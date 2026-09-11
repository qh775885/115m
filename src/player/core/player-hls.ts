/**
 * HLS 生命周期控制器：实例创建/销毁、稳态致命错误自愈、master 文本缓存与音频轨道重建。
 * 从 PlayerManager 中拆出，HLS 相关状态全部内聚于此，通过 attach 注入外部依赖。
 */

import type Artplayer from 'artplayer'
import { safePlay } from './media'
import type HlsType from 'hls.js'
import { createHlsInstance } from './hls'
import { debugLog } from './debug'
import { findVariantInMaster } from './playlist-url'
import { sendTypedRuntimeMessageSafe } from './runtime'
import { resolveM3u8Url } from '../../lib/m3u8-parser'

const HLS_STEADY_RECOVER_MAX = 3

export interface HlsPlayerDeps {
  /** 获取当前 artplayer 实例 */
  getArtplayer: () => Artplayer | null
  /** 获取当前 pickCode */
  getCurrentPickCode: () => string
  /** switchUrl/switchQuality 是否在途（用于 hls fatal 时打破 artplayer 内部 Promise 挂起） */
  getSwitchUrlInFlight: () => boolean
  /** 主动触发 video error，打破 artplayer switchUrl 的内部挂起 */
  failSwitchUrl: (reason: string) => void
  /** 展示 toast 提示 */
  onShowToast: (msg: string) => void
  /** 当前音轨标签（切换音轨后的 toast 文案用） */
  getAudioTrackLabel: () => string
  /** hls 音轨变更时同步到 AudioManager */
  onAudioTracksUpdated: () => void
  /** 调度延迟音轨同步 */
  onAudioScheduleSync: () => void
  /** 从 master playlist 预解析音轨标签 */
  onAudioHydrateFromMaster: () => void
}

export class HlsPlayerController {
  private hlsInstance: HlsType | null = null
  private deps: HlsPlayerDeps | null = null

  /** 当前 hls 实例是否已尝试过一次媒体错误恢复（每次 init 重置） */
  private hlsMediaRecoverAttempted = false
  /** HLS 初始化代次：每次 init 自增，用于废弃被新切换（切集/切画质）取代的旧加载流程 */
  private hlsInitSeq = 0
  /** 稳态播放期间 HLS 网络错误自动恢复（startLoad）次数，播放成功后清零 */
  private hlsSteadyRecoverCount = 0
  /** master 播放列表文本缓存：buildHlsPlaybackUrl 与 hydrateFromMasterPlaylist 共用，避免每次重复拉取 */
  private masterTextCache: { pickCode: string, text: string, fetchedAt: number } | null = null
  private currentHlsSourceUrl: string | null = null
  private currentHlsLogicalUrl: string | null = null

  /** 当前 hls 实例（供外部读取） */
  get instance(): HlsType | null {
    return this.hlsInstance
  }

  /** 当前 HLS 逻辑 URL（非 blob 包装源） */
  get logicalUrl(): string | null {
    return this.currentHlsLogicalUrl
  }

  attach(deps: HlsPlayerDeps) {
    this.deps = deps
  }

  /**
   * 初始化 HLS 实例并附加到 video 元素。
   * 返回 undefined 表示本流程已被更新的切换（切集/切画质）取代。
   */
  async init(video: HTMLVideoElement, url: string): Promise<HlsType | undefined> {
    const deps = this.deps
    if (!deps) return undefined

    const seq = ++this.hlsInitSeq
    if (this.hlsInstance) {
      this.hlsInstance.destroy()
      this.hlsInstance = null
    }
    if (this.currentHlsSourceUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.currentHlsSourceUrl)
    }
    this.currentHlsSourceUrl = null
    this.currentHlsLogicalUrl = url
    const sourceUrl = await this.buildHlsPlaybackUrl(url)
    // 加载期间发生了新的切换（快速切集/切画质），本流程已过期：放弃，
    // 避免旧流程继续创建实例并 attachMedia 到同一 video 元素，造成 bufferAppendError 等冲突
    if (seq !== this.hlsInitSeq) {
      if (sourceUrl !== url && sourceUrl.startsWith('blob:')) {
        URL.revokeObjectURL(sourceUrl)
      }
      return undefined
    }
    this.currentHlsSourceUrl = sourceUrl
    const hls = await createHlsInstance(video, sourceUrl)
    if (seq !== this.hlsInitSeq) {
      hls.destroy()
      return undefined
    }
    this.hlsInstance = hls
    this.hlsMediaRecoverAttempted = false
    this.hlsSteadyRecoverCount = 0

    // HLS 源加载失败（签名 URL 失效等）时，hls.js 不会让 video 触发 canplay/error，
    // artplayer 的 switchUrl 会永久挂起导致播放器卡死。切换流程中遇到 fatal 错误：
    // - 媒体类错误（如 bufferAppendError 瞬时抖动）先 recover 一次，能自愈则继续播放；
    // - 仍失败或其它类型错误，主动触发 video error 打破挂起，交由调用方 catch 提示。
    hls.on('hlsError' as any, (_event: any, data: any) => {
      if (!data?.fatal) return

      if (!deps.getSwitchUrlInFlight()) {
        this.handleSteadyHlsFatalError(hls, data)
        return
      }

      if (data.type === 'mediaError' && !this.hlsMediaRecoverAttempted) {
        this.hlsMediaRecoverAttempted = true
        debugLog('[115m] HLS 媒体错误，尝试恢复:', data?.details ?? data?.type)
        ;(hls as any).recoverMediaError?.()
        return
      }
      console.error('[115m] HLS 源加载失败（切换中）:', data?.details ?? data?.type)
      this.hlsInstance = null
      hls.destroy()
      deps.failSwitchUrl('视频源加载失败')
    })

    hls.on('hlsAudioTracksUpdated' as any, () => {
      deps.onAudioTracksUpdated()
    })
    hls.on('hlsAudioTrackSwitched' as any, () => {
      deps.onAudioTracksUpdated()
    })
    hls.on('hlsManifestParsed' as any, () => {
      deps.onAudioTracksUpdated()
    })
    deps.onAudioScheduleSync()
    void deps.onAudioHydrateFromMaster()
    return hls
  }

  /**
   * 切换到非 m3u8 源（无损 mp4）前销毁旧 hls 实例。
   * 该路径 artplayer 直接改 video.src，不经过 customType.m3u8，不会走 init 的销毁逻辑；
   * 残留的 hls 实例会泄漏 worker/定时器，其 recoverMediaError 还可能重新 attachMedia
   * 覆盖正在播放的原生流，并在后续切换中注入虚假错误。
   */
  dispose() {
    this.hlsInitSeq += 1
    if (this.hlsInstance) {
      this.hlsInstance.destroy()
      this.hlsInstance = null
    }
    if (this.currentHlsSourceUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.currentHlsSourceUrl)
    }
    this.currentHlsSourceUrl = null
    this.currentHlsLogicalUrl = null
    this.hlsMediaRecoverAttempted = false
  }

  /**
   * 稳态播放（非切源期间）的 HLS fatal 错误自愈。
   * 此前只在 switchUrlInFlight 时处理 fatal，稳定播放中 hls.js 重试耗尽抛出的
   * fatal 会被直接忽略，画面永久卡在加载态。此处限量自愈：
   * - 网络错误：startLoad(-1) 从当前位置续载，最多 HLS_STEADY_RECOVER_MAX 次；
   * - 媒体错误：recoverMediaError() 仅一次；
   * 恢复次数在播放成功后清零（onPlaying）。自愈额度用尽时提示用户，避免无提示卡死。
   */
  handleSteadyHlsFatalError(hls: HlsType, data: any) {
    if (this.hlsInstance !== hls) return
    const deps = this.deps
    if (!deps) return

    if (data.type === 'networkError') {
      if (this.hlsSteadyRecoverCount < HLS_STEADY_RECOVER_MAX) {
        this.hlsSteadyRecoverCount += 1
        console.warn('[115m] HLS 稳态网络错误，尝试续载恢复:', data?.details ?? data?.type, `(${this.hlsSteadyRecoverCount}/${HLS_STEADY_RECOVER_MAX})`)
        try {
          hls.startLoad(-1)
        }
        catch {
          deps.onShowToast('播放网络异常，请重试')
        }
        return
      }
      console.error('[115m] HLS 稳态网络错误，自愈额度已用尽:', data?.details ?? data?.type)
      deps.onShowToast('网络连接异常，加载失败')
      return
    }

    if (data.type === 'mediaError') {
      if (!this.hlsMediaRecoverAttempted) {
        this.hlsMediaRecoverAttempted = true
        console.warn('[115m] HLS 稳态媒体错误，尝试恢复:', data?.details ?? data?.type)
        ;(hls as any).recoverMediaError?.()
        return
      }
      console.error('[115m] HLS 稳态媒体错误，恢复失败:', data?.details ?? data?.type)
      deps.onShowToast('播放异常，请刷新重试')
      return
    }

    console.error('[115m] HLS 稳态致命错误（未处理类型）:', data?.details ?? data?.type)
    deps.onShowToast('播放出错，请刷新重试')
  }

  async fetchMasterPlaylistText(): Promise<string | null> {
    const deps = this.deps
    if (!deps) return null
    const pickCode = deps.getCurrentPickCode()
    // 短 TTL 内存缓存：同一集内多次请求（buildHlsPlaybackUrl + hydrateFromMasterPlaylist）只拉一次；
    // 切集后 pickCode 变化自然失效，避免每次都走一次消息往返
    if (this.masterTextCache && this.masterTextCache.pickCode === pickCode && Date.now() - this.masterTextCache.fetchedAt < 30_000) {
      return this.masterTextCache.text
    }
    try {
      const res = await sendTypedRuntimeMessageSafe({
        type: 'FETCH_M3U8_TEXT',
        data: { pickCode },
      }, 2, 500, 12000)
      const text = res && 'text' in res && res.text ? res.text : null
      if (text) {
        this.masterTextCache = { pickCode, text, fetchedAt: Date.now() }
      }
      return text
    }
    catch {
      return null
    }
  }

  /** 播放成功后重置稳态恢复计数 */
  resetSteadyRecoverCount() {
    this.hlsSteadyRecoverCount = 0
  }

  /**
   * 重建 HLS 以切换音轨（保留播放位置）。
   * 使用 init 的代次作为 token：一旦发生切集/切画质/再次重建音轨，
   * hlsInitSeq 递增，旧 restore 会在触发时被作废并自动摘除，避免误 seek 到上一集。
   */
  async rebuildForAudioTrack(params: {
    id: number
    currentTime: number
    shouldResume: boolean
    track: any
  }) {
    const deps = this.deps
    if (!deps) return
    const art = deps.getArtplayer()
    if (!art || !this.currentHlsLogicalUrl) {
      deps.onShowToast('当前播放链路暂不支持切换音轨')
      return
    }

    const video = art.video as HTMLVideoElement
    const targetUrl = this.currentHlsLogicalUrl

    let restore: (() => void) | null = null
    const detachRestore = () => {
      const currentArt = deps.getArtplayer()
      if (currentArt && restore) {
        currentArt.off('video:loadedmetadata', restore)
        currentArt.off('video:canplay', restore)
      }
    }

    try {
      await this.init(video, targetUrl)
      if (!this.hlsInstance) {
        return
      }

      const token = this.hlsInitSeq
      restore = () => {
        detachRestore()
        const currentArt = deps.getArtplayer()
        if (!currentArt || token !== this.hlsInitSeq) return
        try {
          currentArt.seek = params.currentTime
        }
        catch {
          // ignore seek restore errors
        }
        if (params.shouldResume) {
          safePlay(currentArt)
        }
      }

      art.on('video:loadedmetadata', restore)
      art.on('video:canplay', restore)

      debugLog('[115m][audio] rebuild track', {
        id: params.id,
        currentTime: params.currentTime,
        track: params.track,
        targetUrl,
      })
      deps.onShowToast(`已切换到${deps.getAudioTrackLabel() || '音轨'}`)
    }
    catch (error) {
      detachRestore()
      console.warn('[115m][audio] rebuild track failed', error)
      deps.onShowToast('切换音轨失败，请重试')
    }
  }

  destroy() {
    if (this.hlsInstance) {
      this.hlsInstance.destroy()
      this.hlsInstance = null
    }
    if (this.currentHlsSourceUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.currentHlsSourceUrl)
    }
    this.currentHlsSourceUrl = null
    this.currentHlsLogicalUrl = null
    this.deps = null
  }

  // ─── 内部方法 ───

  private async buildHlsPlaybackUrl(selectedUrl: string): Promise<string> {
    const masterText = await this.fetchMasterPlaylistText()
    if (!masterText || !/#EXT-X-MEDIA:TYPE=AUDIO/i.test(masterText)) {
      return selectedUrl
    }

    const lines = masterText.split(/\r?\n/)
    const audioTags = lines.filter(line => /#EXT-X-MEDIA:TYPE=AUDIO/i.test(line.trim()))
    if (audioTags.length === 0) {
      return selectedUrl
    }

    const { streamInf: matchedStreamInf, matchedUrl } = findVariantInMaster(masterText, selectedUrl)
    let streamInf = matchedStreamInf

    if (!streamInf.startsWith('#EXT-X-STREAM-INF')) {
      const groupId = audioTags[0].match(/GROUP-ID="([^"]+)"/i)?.[1] || 'Audio-Group'
      streamInf = `#EXT-X-STREAM-INF:BANDWIDTH=3000000,AUDIO="${groupId}",NAME="custom"`
    }
    else if (!/\bAUDIO=/i.test(streamInf)) {
      const groupId = audioTags[0].match(/GROUP-ID="([^"]+)"/i)?.[1] || 'Audio-Group'
      streamInf = `${streamInf},AUDIO="${groupId}"`
    }

    const absoluteAudioTags = audioTags.map(tag =>
      tag.replace(/URI="([^"]+)"/i, (_, uri) => `URI="${resolveM3u8Url(uri)}"`)
    )
    const targetVariantUrl = resolveM3u8Url(matchedUrl || selectedUrl)
    const wrapped = ['#EXTM3U', ...absoluteAudioTags, streamInf, targetVariantUrl].join('\n')
    return URL.createObjectURL(new Blob([wrapped], { type: 'application/vnd.apple.mpegurl' }))
  }
}
