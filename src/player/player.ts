/**
 * 播放器页面逻辑
 */

import Artplayer from 'artplayer'
import type HlsType from 'hls.js'
import '../player/style.css'
import playerSkinCss from './core/player-skin.css?inline'
import playerQualityCss from './core/css/player-quality.css?inline'
import playerPlaybackModeCss from './core/css/player-playback-mode.css?inline'
import playerNavigationCss from './core/css/player-navigation.css?inline'
import playerRotationCss from './core/css/player-rotation.css?inline'
import playerPlaylistCss from './core/css/player-playlist.css?inline'
import playerHeaderCss from './core/css/player-header.css?inline'
import playerSelectorCss from './core/css/player-selector.css?inline'
import playerVolumeCss from './core/player-volume.css?inline'
import uiLayerCss from './core/ui-layer.css?inline'
import playerMediaTrackCss from './core/css/player-media-track.css?inline'
import playerSettingsMenuCss from './core/css/player-settings-menu.css?inline'
import type { M3u8Item } from '../lib/types'
import { buildArtplayerQuality, buildQualityOptions, getQualityDisplayName, ORIGINAL_PLACEHOLDER_URL } from './core/quality'
import { buildQualityControlItem as buildQualityControlConfig, updateArtplayerControl } from './core/player-quality'
import { AudioManager } from './core/audio-manager'
import { buildPlaybackModeControlItem as buildPlaybackModeControlConfig } from './core/player-playback-mode-control'
import { fetchM3u8WithRetry } from './core/source'
import { loadPlayHistoryWhenReady, loadVolumePreference, saveQualityPreference, saveVolumePreference } from './core/history'
import { buildNavControlItem, mountCenterCluster } from './core/player-center-controls'
import { buildCustomVolumeControl } from './core/player-volume'
import type { QualityOption } from './core/types'
import { buildPlaybackModePlan, getPlaybackModeLabel, loadPlaybackMode, savePlaybackMode, type PlaybackMode } from './core/player-playback-mode'
import { runPlayerSmokeChecks } from './core/smoke'
import { renderPlayerError } from './core/dom'
import { createHlsInstance, isHlsSupported } from './core/hls'
import type { VideoPlaybackQualityLike } from './core/types'
import { HoverPreviewController } from './core/hover-preview'
import { bindPlayerEvents } from './core/events'
import { PlayerOverlayController, readOverlayMetaFromQuery, type OverlayPlaylistItem } from './core/overlay'
import { getNextPlaylistItem, getPlaybackEndCountdownPlan, getPreviousPlaylistItem } from './core/player-navigation'
import { fetchBreadcrumbPath, fetchPlaylistData, resolvePlaybackBundle, type ResolvedPlaybackBundle } from './core/player-services'
import { MediaTrackController } from './core/player-media-track'
import { SettingsMenuController } from './core/player-settings-menu'
import { buildOverlayMetaPatch, buildPlayerHistoryUrl, findPlaylistItemByPickCode } from './core/player-switch'
import { MoveDialog } from './core/move-dialog'
import {
  applyFallbackToHlsState,
  applySelectedQualityOption,
  isOriginalPlaceholderOption,
  type PlaybackState,
  refreshPlaybackQualityState,
  resolveOriginalPlaceholderUrl,
  syncPlaybackStateByUrl,
} from './core/playback-state'
import { ensureServiceWorkerReady, getRuntimeApi, sendRuntimeMessageSafe, sendTypedRuntimeMessageSafe } from './core/runtime'
import {
  buildUpdatedMarkedUrl,
  readPathFromLocation,
  readPlayerBootstrapConfig,
  readPlaylistCidFromLocation,
} from './core/player-query'
import { deleteVideoFile, fetchFavoriteStatus, updateFavoriteStatus } from './core/player-api'
import { buildPlaybackNavState, getDeleteFallback, getPlaylistPosition } from './core/playlist-navigation'
import { readTemporaryPlayerPlaylist } from '../shared/player-playlist-cache'
import { primeThumbnailSourceUrl } from '../lib/videoThumbnail'
import { canUseNativeUltraSource, isConservativeNativeUltraExtension } from './core/native-playback'
import { NativePlaybackMonitor } from './core/native-playback-monitor'
import { findVariantInMaster, normalizePlaylistUrl as normalizePlaylistUrlUtil } from './core/playlist-url'
import { RotationManager } from './core/rotation-manager'
import { SubtitleController } from './core/subtitle-controller'

function injectPlayerSkinStyles() {
  const style = document.createElement('style')
  style.id = 'm115-player-skin-style'
  style.textContent = `${playerSkinCss}\n${playerQualityCss}\n${playerPlaybackModeCss}\n${playerNavigationCss}\n${playerRotationCss}\n${playerPlaylistCss}\n${playerHeaderCss}\n${playerSelectorCss}\n${playerVolumeCss}\n${uiLayerCss}\n${playerMediaTrackCss}\n${playerSettingsMenuCss}`
  
  const insertStyle = () => {
    if (document.getElementById('m115-player-skin-style')) return
    if (document.head) {
      document.head.appendChild(style)
    } else {
      document.documentElement.appendChild(style)
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertStyle)
  } else {
    insertStyle()
  }
}

injectPlayerSkinStyles()

const HLS_STEADY_RECOVER_MAX = 3

interface PlayerConfig {
  pickCode: string
  traceId?: string
  clickTs?: number
  keepPlaylistOpen?: boolean
  playlistToken?: string
}

function isInterruptedPlayError(reason: unknown) {
  if (!(reason instanceof DOMException) && !(reason instanceof Error)) return false
  return reason.name === 'AbortError' && /play\(\).*interrupted|interrupted by a new load request/i.test(reason.message)
}

function bindInterruptedPlayRejectionGuard() {
  window.addEventListener('unhandledrejection', (event) => {
    if (isInterruptedPlayError(event.reason)) {
      event.preventDefault()
    }
  })
}

function safePlay(art: Artplayer | null) {
  if (!art) return
  void art.play().catch(() => {
    // Ignore native play promise rejections during source switches and transient media reloads.
  })
}

function playerDebug(...args: unknown[]) {
  if (localStorage.getItem('115m-player-debug') === '1') {
    console.debug(...args)
  }
}

bindInterruptedPlayRejectionGuard()

class PlayerManager {
  private static readonly QUALITY_CONTROL_NAME = 'm115-quality-control'
  private static readonly SPEED_CONTROL_NAME = 'm115-speed-control'
  private static readonly PLAYBACK_MODE_CONTROL_NAME = 'm115-playback-mode-control'
  private static readonly PREV_CONTROL_NAME = 'm115-prev-control'
  private static readonly NEXT_CONTROL_NAME = 'm115-next-control'
  private static readonly MEDIA_TRACK_CONTROL_NAME = 'm115-media-track-control'
  private static readonly SETTINGS_MENU_CONTROL_NAME = 'm115-settings-menu-control'
  private static readonly VIDEO_SWITCH_COOLDOWN_MS = 1200
  private artplayer: Artplayer | null = null
  private hlsInstance: HlsType | null = null
  private m3u8List: M3u8Item[] = []
  private currentPickCode: string
  private isNativeVideo = false
  private ultraUrl: string | null = null
  private qualityOptions: QualityOption[] = []
  private currentQuality = 0
  private currentQualityLabel = '加载中'
  private infoMenuTimer: number | null = null
  private infoMenuEl: HTMLElement | null = null
  private hoverPreview: HoverPreviewController | null = null
  private overlay: PlayerOverlayController | null = null
  private playlistItemsCache: OverlayPlaylistItem[] = []
  private playlistLoadingPromise: Promise<OverlayPlaylistItem[]> | null = null
  private autoNextTimer: number | null = null
  private switchVideoRequestId = 0
  private traceId = ''
  private clickTs = 0
  private initStartTs = 0
  private perfMarks: Partial<Record<'init' | 'ultraReady' | 'loadedmetadata' | 'canplay' | 'playing', number>> = {}
  private firstPlayingReported = false
  private _initUrl = ''
  private cleanupKeyboard: (() => void) | null = null
  private readonly keepPlaylistOpenOnInit: boolean
  private readonly playlistToken?: string
  private readonly nativeUltraSupported: boolean
  private readonly nativeUltraConservative: boolean
  private readonly title: string
  private currentPlaybackType: 'native' | 'hls' = 'hls'
  private rotationManager: RotationManager | null = null
  private nativeMonitor: NativePlaybackMonitor | null = null
  private audioManager: AudioManager | null = null
  private lastPlaylistProgressSyncSec = -1
  private currentPlaybackRate = 1
  private currentPlaybackMode: PlaybackMode = loadPlaybackMode()
  private subtitleController: SubtitleController | null = null
  private mediaTrackController: MediaTrackController | null = null
  private settingsMenuController: SettingsMenuController | null = null
  private currentHlsSourceUrl: string | null = null
  private currentHlsLogicalUrl: string | null = null
  private isSwitchingVideo = false
  /** switchUrl/switchQuality 执行期间置位，用于 hls fatal 错误时打破 artplayer 内部 Promise 挂起 */
  private switchUrlInFlight = false
  /** 当前 hls 实例是否已尝试过一次媒体错误恢复（每次 initHls 重置） */
  private hlsMediaRecoverAttempted = false
  /** HLS 初始化代次：每次 initHls 自增，用于废弃被新切换（切集/切画质）取代的旧加载流程 */
  private hlsInitSeq = 0
  /** 稳态播放期间 HLS 网络错误自动恢复（startLoad）次数，播放成功后清零 */
  private hlsSteadyRecoverCount = 0
  /** master 播放列表文本缓存：initHls 内 buildHlsPlaybackUrl 与 hydrateFromMasterPlaylist 共用，避免每次重复拉取 */
  private masterTextCache: { pickCode: string, text: string, fetchedAt: number } | null = null
  private lastVideoSwitchStartedAt = 0
  private pendingVideoSwitch: { pickCode: string, keepPlaylistOpen: boolean, autoPlay: boolean } | null = null
  private switchCooldownTimer: number | null = null
  private readonly handleRuntimeMessage = (message: any) => {
    if (message?.type === 'MOVE_REFRESHED') {
      void this.refreshBreadcrumbs()
      this.overlay?.showToast('文件已移动')
      return
    }

    if (message?.type === 'DELETE_REFRESHED' && message?.data?.pickCode === this.currentPickCode) {
      this.overlay?.showToast('文件已删除')
    }
  }

  constructor(config: PlayerConfig) {
    this.currentPickCode = config.pickCode
    this.traceId = config.traceId || `${config.pickCode}-${Date.now()}`
    this.clickTs = config.clickTs || 0
    this.keepPlaylistOpenOnInit = config.keepPlaylistOpen === true
    this.playlistToken = config.playlistToken
    this.title = new URLSearchParams(window.location.search).get('title') || ''
    this.nativeUltraSupported = canUseNativeUltraSource(
      this.title,
      null,
    )
    this.nativeUltraConservative = isConservativeNativeUltraExtension(
      this.title,
      null,
    )
    this.initStartTs = performance.now()
    this.perfMarks.init = this.initStartTs
    runPlayerSmokeChecks()
    this.init()
  }

  private perf(stage: string, extra?: Record<string, unknown>) {
    const now = performance.now()
    const payload = {
      stage,
      traceId: this.traceId,
      pickCode: this.currentPickCode,
      clickToNowMs: this.clickTs > 0 ? Math.round(Date.now() - this.clickTs) : -1,
      initCostMs: Math.round(now - this.initStartTs),
      ...extra,
    }
    playerDebug('[115m][Perf]', payload)
  }

  private reportFirstFrameSummary() {
    if (this.firstPlayingReported) return
    const p = this.perfMarks
    if (!p.playing || !p.init) return
    this.firstPlayingReported = true

    const clickToPlay = this.clickTs > 0 ? Math.round(Date.now() - this.clickTs) : -1
    const initToUltra = p.ultraReady ? Math.round(p.ultraReady - p.init) : -1
    const ultraToMeta = p.ultraReady && p.loadedmetadata ? Math.round(p.loadedmetadata - p.ultraReady) : -1
    const metaToPlay = p.loadedmetadata ? Math.round(p.playing - p.loadedmetadata) : -1
    const initToPlay = Math.round(p.playing - p.init)

    playerDebug('[115m][首播耗时]', {
      traceId: this.traceId,
      pickCode: this.currentPickCode,
      clickToPlayMs: clickToPlay,
      initToPlayMs: initToPlay,
      initToUltraMs: initToUltra,
      ultraToLoadedmetadataMs: ultraToMeta,
      loadedmetadataToPlayingMs: metaToPlay,
    })
  }

  /** 调试辅助：在页面内显示日志 */
  private debugLogToPage(msg: string) {
    if (localStorage.getItem('115m-player-debug') !== '1') return
    let el = document.getElementById('m115-debug-log')
    if (!el) {
      el = document.createElement('div')
      el.id = 'm115-debug-log'
      el.style.cssText = 'position:fixed;top:10px;right:10px;z-index:999999;background:rgba(0,0,0,.85);color:#0f0;font-size:12px;font-family:monospace;padding:10px;max-height:300px;overflow:auto;white-space:pre-wrap;'
      document.body.appendChild(el)
    }
    el.textContent += `[${new Date().toLocaleTimeString()}] ${msg}\n`
  }

  private async init() {
    const debugMode = localStorage.getItem('115m-player-debug') === '1'
    if (debugMode) this.debugLogToPage('init() called')
    try {
      this.perf('player-init-start')

      const loadingTextEl = document.getElementById('loading-text')
      if (loadingTextEl) {
        loadingTextEl.textContent = '正在初始化...'
      }

      if (debugMode) this.debugLogToPage('calling ensureServiceWorkerReady')
      await ensureServiceWorkerReady(10, 1000)
      if (debugMode) this.debugLogToPage('ensureServiceWorkerReady done')

      if (loadingTextEl) {
        loadingTextEl.textContent = '正在获取播放源...'
      }

      if (debugMode) this.debugLogToPage('calling resolvePlaybackForPickCode')
      const playback = await this.resolvePlaybackForPickCode(this.currentPickCode)
      if (debugMode) this.debugLogToPage(`resolvePlaybackForPickCode done: ultra=${!!playback.ultraUrl}, m3u8=${playback.m3u8List.length}, type=${playback.initialPlayback.type}`)
      this.applyResolvedPlayback(playback)

      this.perfMarks.ultraReady = performance.now()
      this.perf('ultra-source-ready', { ok: !!playback.ultraUrl, m3u8Count: this.m3u8List.length })

      if (debugMode) this.debugLogToPage(`calling createArtplayer: type=${playback.initialPlayback.type}`)
      this.createArtplayer(playback.initialPlayback.url, playback.initialPlayback.type)
      if (debugMode) this.debugLogToPage(`createArtplayer done: hasArtplayer=${!!this.artplayer}`)
      this.perf(playback.initialPlayback.type === 'native' ? 'create-player-native' : 'create-player-hls', {
        label: playback.initialPlayback.currentQualityLabel,
        hasPreference: !!playback.qualityPreference,
      })

      const currentUrl = this.artplayer?.url || ''
      this.refreshQualityState(currentUrl)
      this.renderQualityPanel()
      this.subtitleController?.renderControl()
      this.renderPlaybackNavControls()
      this.rotationManager?.renderControl()
      this.renderSpeedControl()

      const initPickCode = this.currentPickCode
      void loadPlayHistoryWhenReady(
        initPickCode,
        () => this.currentPickCode === initPickCode && this.artplayer ? this.artplayer.video as HTMLVideoElement : null,
        () => this.currentPickCode === initPickCode,
      )
    }
    catch (error) {
      if (debugMode) this.debugLogToPage(`ERROR: ${error instanceof Error ? error.message : String(error)}`)
      this.showError(`播放器初始化失败: ${error instanceof Error ? error.message : String(error)}`)
    }
    finally {
      if (debugMode) this.debugLogToPage('finally block - hiding loading')
      const loadingEl = document.getElementById('loading')
      if (loadingEl) loadingEl.style.display = 'none'
    }
  }

  private async initHls(video: HTMLVideoElement, url: string): Promise<HlsType | undefined> {
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
    if (seq !== this.hlsInitSeq) return undefined
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

      if (!this.switchUrlInFlight) {
        this.handleSteadyHlsFatalError(hls, data)
        return
      }

      if (data.type === 'mediaError' && !this.hlsMediaRecoverAttempted) {
        this.hlsMediaRecoverAttempted = true
        playerDebug('[115m] HLS 媒体错误，尝试恢复:', data?.details ?? data?.type)
        ;(hls as any).recoverMediaError?.()
        return
      }
      console.error('[115m] HLS 源加载失败（切换中）:', data?.details ?? data?.type)
      this.hlsInstance = null
      hls.destroy()
      this.failSwitchUrl('视频源加载失败')
    })

    hls.on('hlsAudioTracksUpdated' as any, () => {
      this.audioManager?.syncFromHls()
    })
    hls.on('hlsAudioTrackSwitched' as any, () => {
      this.audioManager?.syncFromHls()
    })
    hls.on('hlsManifestParsed' as any, () => {
      this.audioManager?.syncFromHls()
    })
    this.audioManager?.scheduleSync()
    void this.audioManager?.hydrateFromMasterPlaylist()
    return hls
  }

  /**
   * 切换到非 m3u8 源（无损 mp4）前销毁旧 hls 实例。
   * 该路径 artplayer 直接改 video.src，不经过 customType.m3u8，不会走 initHls 的销毁逻辑；
   * 残留的 hls 实例会泄漏 worker/定时器，其 recoverMediaError 还可能重新 attachMedia
   * 覆盖正在播放的原生流，并在后续切换中注入虚假错误。
   */
  private disposeHlsInstance() {
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
  private handleSteadyHlsFatalError(hls: HlsType, data: any) {
    if (this.hlsInstance !== hls) return

    if (data.type === 'networkError') {
      if (this.hlsSteadyRecoverCount < HLS_STEADY_RECOVER_MAX) {
        this.hlsSteadyRecoverCount += 1
        console.warn('[115m] HLS 稳态网络错误，尝试续载恢复:', data?.details ?? data?.type, `(${this.hlsSteadyRecoverCount}/${HLS_STEADY_RECOVER_MAX})`)
        try {
          hls.startLoad(-1)
        }
        catch {
          this.overlay?.showToast('播放网络异常，请重试')
        }
        return
      }
      console.error('[115m] HLS 稳态网络错误，自愈额度已用尽:', data?.details ?? data?.type)
      this.overlay?.showToast('网络连接异常，加载失败')
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
      this.overlay?.showToast('播放异常，请刷新重试')
      return
    }

    console.error('[115m] HLS 稳态致命错误（未处理类型）:', data?.details ?? data?.type)
    this.overlay?.showToast('播放出错，请刷新重试')
  }

  private async fetchMasterPlaylistText(): Promise<string | null> {
    const pickCode = this.currentPickCode
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

  /** 归一化播放列表 URL，用于容错匹配（忽略协议/域名/查询串差异） */
  private normalizePlaylistUrl(url: string): string {
    return normalizePlaylistUrlUtil(url)
  }

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

    const wrapped = ['#EXTM3U', ...audioTags, streamInf, matchedUrl || selectedUrl].join('\n')
    return URL.createObjectURL(new Blob([wrapped], { type: 'application/vnd.apple.mpegurl' }))
  }

  private createArtplayer(videoUrl: string, type: 'native' | 'hls') {
    const container = document.getElementById('artplayer-app')
    if (!container) throw new Error('找不到播放器容器')
    const volumePreference = loadVolumePreference()

    // 记录初始 URL，用于区分初始化和用户手动切换
    this._initUrl = videoUrl

    this.refreshQualityState(videoUrl)

    // 提前初始化管理器（控件构建依赖它们，attach 在 artplayer 创建后调用）
    this.rotationManager?.destroy()
    this.rotationManager = new RotationManager(
      (msg) => this.overlay?.showToast(msg),
      () => this.currentPickCode,
    )
    this.rotationManager.loadPreference(this.currentPickCode)

    this.audioManager?.destroy()
    this.audioManager = new AudioManager()

    this.subtitleController?.destroy()
    this.subtitleController = new SubtitleController()

    this.mediaTrackController?.destroy()
    this.mediaTrackController = new MediaTrackController()

    this.settingsMenuController?.destroy()
    this.settingsMenuController = new SettingsMenuController()

    // YouTube-like idle delay: keep controls visible for a few seconds after mouse movement.
    Artplayer.CONTROL_HIDE_TIME = 6000

    this.artplayer = new Artplayer({
      container: container as HTMLDivElement,
      url: videoUrl,
      volume: volumePreference.volume,
      muted: volumePreference.muted, // set muted state on creation
      autoplay: true,
      pip: false,
      autoMini: true,
      screenshot: false,
      setting: false,
      hotkey: false,
      controls: [
        this.buildPrevControlItem(),
        this.buildNextControlItem(),
        buildCustomVolumeControl(),
      ],
      loop: false,
      playbackRate: false,
      aspectRatio: false,
      fullscreen: false,
      fullscreenWeb: false,
      miniProgressBar: true,
      theme: '#1890ff',
      lang: 'zh-cn',
      contextmenu: [],
      customType: {
        m3u8: async (video, url) => {
          try {
            if (url === ORIGINAL_PLACEHOLDER_URL) {
              saveQualityPreference(this.currentPickCode, '115原画', 9999)
              // 立即更新内部状态，以便后续 UI 同步正常工作
              const opt = this.qualityOptions.find(o => o.url === url)
              if (opt) {
                this.applyPlaybackStatePatch(applySelectedQualityOption(this.getPlaybackState(), opt))
                this.renderQualityPanel()
              }

              const resolvedUrl = await this.ensureOriginalSourceLoaded()
              if (!resolvedUrl) {
                this.showError('115原画加载失败，请稍后重试')
                this.failSwitchUrl('115原画加载失败')
                return
              }
              url = resolvedUrl
            }
            else {
              const opt = this.qualityOptions.find(o => o.url === url)
              if (opt) {
                // 只要是手动切换（非首次加载且已就绪），就记录偏好
                if (this.perfMarks.loadedmetadata) {
                  saveQualityPreference(this.currentPickCode, opt.label, opt.quality)
                }
                this.applyPlaybackStatePatch(applySelectedQualityOption(this.getPlaybackState(), opt))
                this.renderQualityPanel()
              }
            }

            if (this.artplayer && await isHlsSupported()) {
              await this.initHls(video as HTMLVideoElement, url)
            }
            else {
              this.showError('您的浏览器不支持 HLS 播放')
            }
          }
          catch (error) {
            console.error('[115m] HLS 初始化失败:', error)
            this.showError('视频源加载失败，请稍后重试')
            // 主动触发 video error，打破 artplayer switchUrl 的永久挂起，避免播放器卡死
            this.failSwitchUrl(error instanceof Error ? error.message : 'HLS init failed')
          }
        },
      },
    })

    // 尽早把 上一集/播放/下一集 搬进居中簇，避免 ready 前闪现在左侧
    mountCenterCluster(this.artplayer)

    // 强制覆盖 Artplayer 内部的 storage 音量，防止它覆盖我们的全局偏好
    this.artplayer.video.volume = volumePreference.volume
    this.artplayer.video.muted = volumePreference.muted
    
    // Don't use ArtPlayer's fullscreenWeb — it uses position:fixed + moves to body,
    // which covers #playlist-sidebar. Instead the player fills its flex container naturally.
    Artplayer.FULLSCREEN_WEB_IN_BODY = false

    this.artplayer.on('restart', (url) => {
      if (typeof url !== 'string' || url === ORIGINAL_PLACEHOLDER_URL) return
      const opt = this.qualityOptions.find(o => o.url === url)
      if (opt && this.perfMarks.loadedmetadata) {
        saveQualityPreference(this.currentPickCode, opt.label, opt.quality)
        this.applyPlaybackStatePatch(applySelectedQualityOption(this.getPlaybackState(), opt))
        this.renderQualityPanel()
      }
      this.setupProgressHoverPreview(url, this.currentPlaybackType)
    })

    this.artplayer.on('video:pause', () => {
      this.syncCurrentPlaylistProgress(true)
    })

    this.artplayer.on('video:seeking', () => {
      this.nativeMonitor?.onSeeking()
    })

    this.artplayer.on('video:seeked', () => {
      this.nativeMonitor?.onSeeked()
    })

    this.artplayer.on('video:play', () => {})

    this.artplayer.on('video:timeupdate', () => {
      this.syncCurrentPlaylistProgress()
    })

    this.rotationManager.attach(this.artplayer)

    // 创建原生播放监控器
    this.nativeMonitor?.destroy()
    this.nativeMonitor = new NativePlaybackMonitor()
    this.nativeMonitor.attach({
      art: this.artplayer,
      getIsNativeVideo: () => this.isNativeVideo,
      getCurrentPlaybackType: () => this.currentPlaybackType,
      getUltraUrl: () => this.ultraUrl,
      getTitle: () => this.title,
      getNativeUltraConservative: () => this.nativeUltraConservative,
      getPerfMarksPlaying: () => this.perfMarks.playing,
      onFallbackToHls: (reason, rememberOriginal) => this.fallbackToHls(reason, rememberOriginal),
      onRetry: () => {},
      onShowToast: (msg) => this.overlay?.showToast(msg),
      fetchMasterPlaylistText: () => this.fetchMasterPlaylistText(),
    })

    // 绑定音频管理器
    this.audioManager.attach({
      art: this.artplayer,
      getHlsInstance: () => this.hlsInstance,
      getCurrentPickCode: () => this.currentPickCode,
      getCurrentHlsLogicalUrl: () => this.currentHlsLogicalUrl,
      onRebuildHls: (params) => this.rebuildHlsForAudioTrack(params),
      onShowToast: (msg) => this.overlay?.showToast(msg),
      onRenderRequest: () => this.mediaTrackController?.renderControl(),
      fetchMasterPlaylistText: () => this.fetchMasterPlaylistText(),
    })

    if (type === 'native') {
      this.currentQuality = 9999
      this.currentQualityLabel = '无损'
      this.audioManager?.resetForNative()
    }

    this.setupTopNav()
    this.setupProgressHoverPreview(videoUrl, type)
    this.subtitleController.attach({
      art: this.artplayer,
      getCurrentPickCode: () => this.currentPickCode,
      onShowToast: (msg) => this.overlay?.showToast(msg),
      onRenderRequest: () => this.mediaTrackController?.renderControl(),
    })

    this.mediaTrackController?.attach({
      art: this.artplayer,
      subtitleController: this.subtitleController,
      audioManager: this.audioManager,
    })

    this.settingsMenuController?.attach({
      art: this.artplayer,
      currentPlaybackRate: this.currentPlaybackRate,
      onSelectPlaybackRate: (value) => this.applyPlaybackRate(value),
    })

    // 添加合并后的右侧控件
    this.artplayer.controls.add(this.buildQualityControlItem())
    if (this.mediaTrackController) {
      this.artplayer.controls.add(this.mediaTrackController.buildControl()!)
    }
    this.artplayer.controls.add(this.buildPlaybackModeControlItem())
    this.artplayer.controls.add(this.rotationManager.buildControl())
    if (this.settingsMenuController) {
      this.artplayer.controls.add(this.settingsMenuController.buildControl()!)
    }

    void this.fetchBreadcrumbs()

    if (this.artplayer) {
      this.setupStatsMenu()

      if (this.cleanupKeyboard) {
        this.cleanupKeyboard()
      }
      this.cleanupKeyboard = bindPlayerEvents({
        art: this.artplayer,
        getType: () => this.currentPlaybackType,
        getPickCode: () => this.currentPickCode,
        getQualityLabel: () => this.currentQualityLabel,
        onPerf: (stage, extra) => this.perf(stage, extra),
        onReady: () => {
          this.safeRemoveContextmenuItem('playbackRate')
          this.safeRemoveContextmenuItem('aspectRatio')
          this.safeRemoveContextmenuItem('flip')
          this.safeRemoveContextmenuItem('info')
          this.safeRemoveContextmenuItem('close')
          this.artplayer!.contextmenu.add({
            name: 'videoStats',
            index: 40,
            html: this.buildStatsHtml(),
            mounted: ($el: HTMLElement) => { this.infoMenuEl = $el },
          })
          this.renderQualityPanel()
          this.mediaTrackController?.renderControl()
          this.renderPlaybackModeControl()
          this.renderPlaybackNavControls()
          this.rotationManager?.renderControl()
          this.renderSpeedControl()
        },
        onLoadedmetadata: () => {
          this.perfMarks.loadedmetadata = performance.now()
          this.updateQualityByUrl(this.artplayer?.url || '')
          this.renderQualityPanel()
          this.mediaTrackController?.renderControl()
          this.renderPlaybackModeControl()
          this.renderSpeedControl()
          this.rotationManager?.apply()
          this.hoverPreview?.updateSize()
        },
        onCanplay: () => {
          this.perfMarks.canplay = performance.now()
        },
        onPlaying: () => {
          this.clearPlaybackEndState()
          this.hlsSteadyRecoverCount = 0
          this.nativeMonitor?.resetRetryCount()
          this.nativeMonitor?.onPlaying()
          this.perfMarks.playing = performance.now()
          this.reportFirstFrameSummary()
        },
        onVolumeChange: () => {
          if (!this.artplayer) return
          saveVolumePreference({
            volume: this.artplayer.video.volume, // changed to this.artplayer.video.volume
            muted: this.artplayer.video.muted,
          })
        },
        onEnded: () => {
          this.handlePlaybackEnded()
        },
        onError: () => {
          if (this.isNativeVideo) {
            void this.nativeMonitor?.onError()
          }
        },
      })
    }
  }


  private updateQualityByUrl(url: string) {
    this.applyPlaybackStatePatch(syncPlaybackStateByUrl(this.getPlaybackState(), url))
  }

  private refreshQualityState(currentUrl: string) {
    this.applyPlaybackStatePatch(refreshPlaybackQualityState(this.getPlaybackState(), currentUrl))
  }

  private getPlaybackState(): PlaybackState {
    return {
      ultraUrl: this.ultraUrl,
      m3u8List: this.m3u8List,
      qualityOptions: this.qualityOptions,
      currentQuality: this.currentQuality,
      currentQualityLabel: this.currentQualityLabel,
      isNativeVideo: this.isNativeVideo,
    }
  }

  private applyPlaybackStatePatch(state: Partial<PlaybackState>) {
    Object.assign(this, state)
  }

  private buildQualityControlItem(): any {
    return buildQualityControlConfig({
      controlName: PlayerManager.QUALITY_CONTROL_NAME,
      currentQualityLabel: this.currentQualityLabel,
      currentUrl: this.artplayer?.url || '',
      qualityOptions: this.qualityOptions,
      onSelect: async target => await this.switchQuality(target),
    })
  }

  private renderQualityPanel() {
    this.updateQualityControl()
  }

  private buildPlaybackModeControlItem(): any {
    return buildPlaybackModeControlConfig({
      controlName: PlayerManager.PLAYBACK_MODE_CONTROL_NAME,
      currentPlaybackMode: this.currentPlaybackMode,
      onSelectPlaybackMode: mode => this.applyPlaybackModeSelection(mode),
    })
  }

  private renderPlaybackModeControl() {
    if (!this.artplayer) return
    updateArtplayerControl(this.artplayer, PlayerManager.PLAYBACK_MODE_CONTROL_NAME, this.buildPlaybackModeControlItem())
  }

  private renderSpeedControl() {
    this.settingsMenuController?.renderControl()
  }

  private safeRemoveContextmenuItem(name: string) {
    try {
      this.artplayer?.contextmenu.remove(name)
    }
    catch {
      // Some built-in items only exist when the related feature is enabled.
    }
  }

  private buildPrevControlItem(): any {
    const state = buildPlaybackNavState(getPlaylistPosition(this.playlistItemsCache, this.currentPickCode))
    const enabled = state.hasPrevious && !this.isSwitchingVideo
    return buildNavControlItem({
      controlName: PlayerManager.PREV_CONTROL_NAME,
      direction: 'prev',
      index: 9,
      enabled,
      title: this.isSwitchingVideo ? '正在切换视频' : (state.previousTitle ? `上一集：${state.previousTitle}` : '没有上一集'),
      onClick: () => { void this.playPrevious() },
    })
  }

  private buildNextControlItem(): any {
    const state = buildPlaybackNavState(getPlaylistPosition(this.playlistItemsCache, this.currentPickCode))
    const enabled = state.hasNext && !this.isSwitchingVideo
    return buildNavControlItem({
      controlName: PlayerManager.NEXT_CONTROL_NAME,
      direction: 'next',
      index: 11,
      enabled,
      title: this.isSwitchingVideo ? '正在切换视频' : (state.nextTitle ? `下一集：${state.nextTitle}` : '没有下一集'),
      onClick: () => { void this.playNext() },
    })
  }

  private applyPlaybackRate(value: number) {
    this.currentPlaybackRate = value
    if (this.artplayer) {
      this.artplayer.video.playbackRate = value
      try {
        ;(this.artplayer as any).playbackRate = value
      }
      catch {
        // Fallback to direct video playbackRate when the public setter is unavailable.
      }
    }
    this.renderSpeedControl()
  }

  private applyPlaybackModeSelection(mode: PlaybackMode) {
    this.currentPlaybackMode = mode
    savePlaybackMode(mode)
    this.renderPlaybackModeControl()
    this.overlay?.showToast(`播放模式：${getPlaybackModeLabel(mode)}`)
  }

  private async rebuildHlsForAudioTrack(params: {
    id: number
    currentTime: number
    shouldResume: boolean
    track: any
  }) {
    if (!this.artplayer || !this.currentHlsLogicalUrl) {
      this.overlay?.showToast('当前播放链路暂不支持切换音轨')
      return
    }

    const video = this.artplayer.video as HTMLVideoElement
    const targetUrl = this.currentHlsLogicalUrl

    try {
      await this.initHls(video, targetUrl)
      if (!this.hlsInstance) {
        return
      }

      const restore = () => {
        if (!this.artplayer) return
        try {
          this.artplayer.seek = params.currentTime
        }
        catch {
          // ignore seek restore errors
        }
        if (params.shouldResume) {
          safePlay(this.artplayer)
        }
      }

      this.artplayer.once('video:loadedmetadata', restore)
      this.artplayer.once('video:canplay', restore)

      playerDebug('[115m][audio] rebuild track', {
        id: params.id,
        currentTime: params.currentTime,
        track: params.track,
        targetUrl,
      })
      this.overlay?.showToast(`已切换到${this.audioManager?.currentTrackLabel || '音轨'}`)
    }
    catch (error) {
      console.warn('[115m][audio] rebuild track failed', error)
      this.overlay?.showToast('切换音轨失败，请重试')
    }
  }

  private renderPlaybackNavControls() {
    if (!this.artplayer) return
    updateArtplayerControl(this.artplayer, PlayerManager.PREV_CONTROL_NAME, this.buildPrevControlItem())
    updateArtplayerControl(this.artplayer, PlayerManager.NEXT_CONTROL_NAME, this.buildNextControlItem())
    // controls.update 会把重建的控件插回左侧容器，需重新搬进居中簇
    mountCenterCluster(this.artplayer)
  }

  private updateQualityControl() {
    if (!this.artplayer) return
    updateArtplayerControl(this.artplayer, PlayerManager.QUALITY_CONTROL_NAME, this.buildQualityControlItem())
  }

  private async switchQuality(opt: QualityOption) {
    if (!this.artplayer) return

    if (isOriginalPlaceholderOption(opt)) {
      const resolvedUrl = await this.ensureOriginalSourceLoaded()
      if (!resolvedUrl) {
        this.showError('115原画加载失败，请稍后重试')
        return
      }
      opt = { ...opt, url: resolvedUrl }
    }

    if (this.artplayer.url === opt.url) return

    this.nativeMonitor?.resetRetryCount()
    this.currentPlaybackType = !!this.ultraUrl && opt.url === this.ultraUrl ? 'native' : 'hls'

    this.applyPlaybackStatePatch(applySelectedQualityOption(this.getPlaybackState(), opt))
    this.renderQualityPanel()

    // 记住用户手动选择的画质
    saveQualityPreference(this.currentPickCode, opt.label, opt.quality)

    if (this.currentPlaybackType === 'native') {
      this.disposeHlsInstance()
    }

    try {
      this.switchUrlInFlight = true
      try {
        await this.withSwitchTimeout(this.artplayer.switchQuality(opt.url))
      }
      finally {
        this.switchUrlInFlight = false
      }
    }
    catch (error) {
      if (!this.artplayer) return
      this.updateQualityByUrl(this.artplayer.url || '')
      this.renderQualityPanel()
      this.overlay?.showToast(error instanceof Error ? error.message : '切换画质失败')
    }
  }

  private setupTopNav() {
    if (!this.artplayer) return
    this.overlay?.destroy()
    const meta = readOverlayMetaFromQuery()
    this.overlay = new PlayerOverlayController({
      art: this.artplayer,
      meta,
      onMoveFile: async (fileId, cid) => await this.moveFile(fileId, cid),
      onToggleFavorite: async (fileId, nextMarked) => await this.toggleFavorite(fileId, nextMarked),
      onPlaylistToggle: async (open) => {
        if (!open) return []
        const items = await this.fetchPlaylistItems()
        this.syncOverlayPlaybackNav()
        return items
      },
      onPlaylistOpenChange: () => {
        this.hoverPreview?.refresh()
      },
      onPlaylistPlay: (pickCode, keepPlaylistOpen) => {
        if (pickCode && pickCode !== this.currentPickCode) {
          this.navigateToVideo(pickCode, keepPlaylistOpen)
        }
      },
      onPlaylistMove: async item => await this.movePlaylistVideo(item),
      onPlaylistDelete: async item => await this.deletePlaylistVideo(item),
      onDeleteFile: async (fileId, parentId, pickCode) => await this.deleteCurrentVideo(fileId, parentId, pickCode),
      onPlayPrevious: () => this.playPrevious(),
      onPlayNext: () => this.playNext(),
      onReplay: () => this.replayCurrent(),
      getCurrentPickCode: () => this.currentPickCode,
      shouldKeepPlaylistOpen: () => this.keepPlaylistOpenOnInit,
    })
    this.overlay.init()
    const runtime = getRuntimeApi()
    runtime?.onMessage?.removeListener(this.handleRuntimeMessage)
    runtime?.onMessage?.addListener(this.handleRuntimeMessage)
    this.syncOverlayPlaybackNav()
    void this.prefetchPlaylistItems()
    // 异步获取最新的收藏状态
    if (meta.fileId) {
      void this.fetchFileFavoriteStatus(meta.fileId)
    }
  }

  private async fetchFileFavoriteStatus(fileId: string): Promise<void> {
    const requestPickCode = this.currentPickCode
    try {
      const favoriteStatus = await fetchFavoriteStatus(sendRuntimeMessageSafe, requestPickCode)
      if (requestPickCode !== this.currentPickCode) return
      if (favoriteStatus !== null) {
        this.overlay?.updateFavoriteStatus(favoriteStatus)
        // 同步更新 URL 的 marked 参数，避免刷新后读到旧值
        window.history.replaceState(null, '', buildUpdatedMarkedUrl(window.location.pathname, window.location.search, favoriteStatus))
      }
    } catch (error) {
      playerDebug('[115m] fetchFileFavoriteStatus failed:', error)
    }
  }

  private setupProgressHoverPreview(previewSourceUrl?: string, previewSourceType?: 'native' | 'hls') {
    if (!this.artplayer) return

    const currentUrl = previewSourceUrl || this.artplayer.url || ''
    const fallbackThumbnailSource = [...this.m3u8List].sort((a, b) => a.quality - b.quality)[0]?.url

    this.hoverPreview?.destroy()
    this.hoverPreview = new HoverPreviewController(
      this.artplayer,
      this.currentPickCode,
      currentUrl || fallbackThumbnailSource || null,
    )
    this.hoverPreview.setup()
  }

  private buildStatsHtml(): string {
    const video = this.artplayer?.video
    if (!video) return '统计信息'
    const w = video.videoWidth
    const h = video.videoHeight
    const res = w && h ? `${w}×${h}` : '--'
    const fps = this.calcFps()
    return `统计信息 <span style="opacity:.5;margin-left:8px">${res}${fps ? ` · ${fps}fps` : ''}</span>`
  }

  private fpsLastTime = 0
  private fpsLastFrames = 0
  private currentFps = 0

  private calcFps(): string {
    const video = this.artplayer?.video
    if (!video) return ''
    const q = (video.getVideoPlaybackQuality?.() || {}) as VideoPlaybackQualityLike
    let total = q.totalVideoFrames ?? 0
    if (!total) {
      total = (video as HTMLVideoElement & { webkitDecodedFrameCount?: number }).webkitDecodedFrameCount ?? 0
    }
    
    if (total === 0) return ''

    const now = performance.now()
    if (this.fpsLastTime === 0) {
      this.fpsLastTime = now
      this.fpsLastFrames = total
      return ''
    }

    const dt = (now - this.fpsLastTime) / 1000
    if (dt >= 1) { // 至少间隔 1 秒才刷新数据
      const df = total - this.fpsLastFrames
      this.currentFps = Math.max(0, df / dt)
      this.fpsLastTime = now
      this.fpsLastFrames = total
    }

    return this.currentFps > 0 ? this.currentFps.toFixed(1) : ''
  }

  private setupStatsMenu() {
    if (!this.artplayer) return
    if (this.infoMenuTimer != null) window.clearInterval(this.infoMenuTimer)
    this.infoMenuTimer = window.setInterval(() => {
      if (this.infoMenuEl) {
        this.infoMenuEl.innerHTML = this.buildStatsHtml()
      }
    }, 2000)
  }


  private async fallbackToHls(reason = '播放失败', rememberOriginal = false) {
    this.nativeMonitor?.clearAll()
    playerDebug('[115m] fallbackToHls triggered', { m3u8Count: this.m3u8List.length, reason })
    
    if (!this.artplayer) {
      this.showError('播放失败，无可用的视频源')
      return
    }

    // 确保有 m3u8 列表
    if (this.m3u8List.length === 0) {
      playerDebug('[115m] m3u8List empty, fetching...')
      const fetched = await fetchM3u8WithRetry(this.currentPickCode).catch((e) => {
        console.error('[115m] fetchM3u8WithRetry failed:', e)
        return null
      })
      if (fetched && fetched.length > 0) {
        this.m3u8List = fetched
      }
    }

    if (this.m3u8List.length === 0) {
      console.error('[115m] fallbackToHls: no m3u8 sources available')
      this.showError('播放失败，无可用的视频源')
      return
    }

    const { url: bestQualityUrl, patch } = applyFallbackToHlsState(this.getPlaybackState())
    this.applyPlaybackStatePatch(patch)
    this.currentPlaybackType = 'hls'
    if (rememberOriginal) {
      saveQualityPreference(this.currentPickCode, '115原画', 9999)
    }
    if (!bestQualityUrl) {
      this.showError('播放失败，无可用的视频源')
      return
    }
    
    playerDebug('[115m] fallbackToHls: switching to HLS')
    this.renderQualityPanel()
    this.overlay?.showToast(`${reason}，已切换 115原画`)
    try {
      this.switchUrlInFlight = true
      try {
        await this.withSwitchTimeout(this.artplayer.switchUrl(bestQualityUrl))
      }
      finally {
        this.switchUrlInFlight = false
      }
    }
    catch (error) {
      console.error('[115m] fallbackToHls switchUrl failed:', error)
      this.showError('播放失败，无可用的视频源')
    }
  }

  private clearTransientPlaybackWatchers() {
    this.nativeMonitor?.clearAll()
    this.audioManager?.clearSyncTimers()
  }

  private async ensureOriginalSourceLoaded(): Promise<string | null> {
    if (this.m3u8List.length === 0) {
      try {
        const list = await fetchM3u8WithRetry(this.currentPickCode)
        if (list && list.length > 0) {
          this.m3u8List = list
        }
      } catch (e) {
        console.error('[115m] fetchM3u8WithRetry error:', e)
      }
    }

    if (this.m3u8List.length === 0) {
      return null
    }

    const currentUrl = this.artplayer?.url || ''
    this.refreshQualityState(currentUrl)
    this.renderQualityPanel()
    return resolveOriginalPlaceholderUrl(this.getPlaybackState())
  }


  private showError(message: string) {
    renderPlayerError(message)
  }

  private async prefetchPlaylistItems() {
    try {
      await this.fetchPlaylistItems()
      this.syncOverlayPlaybackNav()
    }
    catch (error) {
      playerDebug('[115m] prefetchPlaylistItems failed:', error)
    }
  }

  private async fetchPlaylistItems(): Promise<OverlayPlaylistItem[]> {
    if (this.playlistItemsCache.length > 0) {
      return this.playlistItemsCache
    }
    if (this.playlistLoadingPromise) {
      return await this.playlistLoadingPromise
    }

    this.playlistLoadingPromise = this.fetchPlaylistItemsInternal()
    try {
      this.playlistItemsCache = await this.playlistLoadingPromise
      return this.playlistItemsCache
    }
    finally {
      this.playlistLoadingPromise = null
    }
  }

  private async fetchPlaylistItemsInternal(): Promise<OverlayPlaylistItem[]> {
    const temporaryPlaylist = readTemporaryPlayerPlaylist(this.playlistToken)
    if (temporaryPlaylist.some(item => item.pickCode === this.currentPickCode)) {
      return temporaryPlaylist
    }

    const cid = readPlaylistCidFromLocation(window.location.search)

    return await fetchPlaylistData({
      sendMessage: sendRuntimeMessageSafe,
      cid,
      pickCode: this.currentPickCode,
      formatFileSize: size => this.formatFileSize(size),
      onPath: path => this.overlay?.updateBreadcrumbs(path),
    })
  }

  private syncOverlayPlaybackNav() {
    this.renderPlaybackNavControls()
    const state = buildPlaybackNavState(
      getPlaylistPosition(this.playlistItemsCache, this.currentPickCode),
    )
    this.overlay?.updatePlaybackNav({
      ...state,
      hasPrevious: state.hasPrevious && !this.isSwitchingVideo,
      hasNext: state.hasNext && !this.isSwitchingVideo,
      previousTitle: this.isSwitchingVideo ? '正在切换视频' : state.previousTitle,
      nextTitle: this.isSwitchingVideo ? '正在切换视频' : state.nextTitle,
    })
  }

  private syncCurrentPlaylistProgress(force = false) {
    if (!this.artplayer) return

    const currentTime = this.artplayer.currentTime || 0
    const duration = this.artplayer.duration || 0
    if (!duration || duration <= 0) return

    const roundedSec = Math.floor(currentTime)
    if (!force && roundedSec === this.lastPlaylistProgressSyncSec) return
    this.lastPlaylistProgressSyncSec = roundedSec

    const progressPercent = Math.max(0, Math.min(100, currentTime / duration * 100))
    const item = this.playlistItemsCache.find(entry => entry.pickCode === this.currentPickCode)
    if (item) {
      item.progressSec = currentTime
      item.progressPercent = progressPercent
    }

    this.overlay?.updateCurrentPlaylistProgress(this.currentPickCode, currentTime, duration)
  }

  private clearPlaybackEndState() {
    if (this.autoNextTimer) {
      window.clearTimeout(this.autoNextTimer)
      this.autoNextTimer = null
    }
    this.overlay?.hidePlaybackEndPanel()
  }

  private async handlePlaybackEnded() {
    this.clearPlaybackEndState()
    const items = await this.fetchPlaylistItems().catch(() => [])
    const plan = getPlaybackEndCountdownPlan(items, this.currentPickCode)
    const next = plan.next

    const playbackPlan = buildPlaybackModePlan(this.currentPlaybackMode, !!next)
    if (playbackPlan === 'repeat') {
      this.replayCurrent()
      return
    }
    if (playbackPlan === 'next' && next) {
      this.navigateToVideo(next.pickCode, this.overlay?.isPlaylistExpanded() === true, true)
      return
    }
    if (playbackPlan === 'stop') {
      return
    }

    if (next) {
      let countdown = plan.countdownSec
      this.overlay?.showPlaybackEndPanel({
        mode: 'autoplay-next',
        nextTitle: next.name,
        countdownSec: countdown,
      })
      this.autoNextTimer = window.setInterval(() => {
        countdown -= 1
        if (countdown <= 0) {
          this.clearPlaybackEndState()
          this.navigateToVideo(next.pickCode)
          return
        }
        this.overlay?.showPlaybackEndPanel({
          mode: 'autoplay-next',
          nextTitle: next.name,
          countdownSec: countdown,
        })
      }, 1000) as unknown as number
      return
    }

    this.overlay?.showPlaybackEndPanel({ mode: 'ended' })
  }

  private async playPrevious() {
    const items = await this.fetchPlaylistItems().catch(() => [])
    const previous = getPreviousPlaylistItem(items, this.currentPickCode)
    if (!previous) {
      this.overlay?.showToast('已经是第一集')
      return
    }
    this.navigateToVideo(previous.pickCode)
  }

  private async playNext() {
    const items = await this.fetchPlaylistItems().catch(() => [])
    const next = getNextPlaylistItem(items, this.currentPickCode)
    if (!next) {
      this.overlay?.showToast('已经是最后一集')
      return
    }
    this.navigateToVideo(next.pickCode)
  }

  private replayCurrent() {
    this.clearPlaybackEndState()
    if (!this.artplayer) return
    this.artplayer.seek = 0
    safePlay(this.artplayer)
  }

  /**
   * 主动通过 API 获取面包屑，不依赖 DOM 提取或 URL 参数
   */
  private async fetchBreadcrumbs(expectedPickCode = this.currentPickCode): Promise<void> {
    const pathFromQuery = readPathFromLocation(window.location.search)
    if (expectedPickCode !== this.currentPickCode) return
    if (pathFromQuery.length > 0) {
      this.overlay?.updateBreadcrumbs(pathFromQuery)
      return
    }

    // 通过 API 获取（需要 cid 或 pickCode）
    const cid = readPlaylistCidFromLocation(window.location.search)
    const path = await fetchBreadcrumbPath(sendRuntimeMessageSafe, cid, expectedPickCode)

    if (expectedPickCode !== this.currentPickCode) return
    if (path.length > 0) {
      this.overlay?.updateBreadcrumbs(path)
    }
  }

  /**
   * 刷新面包屑（移动文件后调用）
   */
  private async refreshBreadcrumbs(): Promise<void> {
    // 强制通过 API 获取最新路径
    const path = await fetchBreadcrumbPath(sendRuntimeMessageSafe, '', this.currentPickCode)

    if (path.length > 0) {
      this.overlay?.updateBreadcrumbs(path)
    }
  }

  private async moveFile(fileId: string, cid: string): Promise<void> {
    if (!fileId) throw new Error('fileId missing')

    const dialog = new MoveDialog(
      fileId,
      cid || '0',
      () => this.refreshBreadcrumbs(),
    )
    const result = await dialog.show()
    if (result.moved) {
      this.handleCurrentVideoMoved()
    }
  }

  private async movePlaylistVideo(item: OverlayPlaylistItem): Promise<void> {
    if (!item.fileId) {
      this.overlay?.showToast('文件 ID 缺失')
      return
    }

    const parentId = this.getPlaylistItemParentId(item)
    const dialog = new MoveDialog(
      item.fileId,
      parentId || '0',
      () => item.pickCode === this.currentPickCode ? this.refreshBreadcrumbs() : undefined,
    )
    const result = await dialog.show()
    if (result.moved) {
      this.handlePlaylistVideoMoved(item.pickCode)
    }
  }

  private handleCurrentVideoMoved() {
    this.handlePlaylistVideoMoved(this.currentPickCode)
  }

  private handlePlaylistVideoMoved(movedPickCode: string) {
    if (!movedPickCode) return

    const beforeCount = this.playlistItemsCache.length
    this.playlistItemsCache = this.playlistItemsCache.filter(item => item.pickCode !== movedPickCode)
    if (this.playlistItemsCache.length === beforeCount) return

    this.syncOverlayPlaybackNav()
    this.overlay?.updatePlaylist(this.playlistItemsCache)
  }

  private getPlaylistItemParentId(item: OverlayPlaylistItem): string {
    if (item.pickCode === this.currentPickCode) {
      return this.currentParentId()
    }
    return item.cid || readPlaylistCidFromLocation(window.location.search) || this.currentParentId()
  }

  private currentParentId(): string {
    const meta = readOverlayMetaFromQuery()
    return meta.cid || meta.parentId || '0'
  }

  private async toggleFavorite(fileId: string, nextMarked: boolean): Promise<boolean> {
    if (!fileId) return !nextMarked

    const result = await updateFavoriteStatus(sendRuntimeMessageSafe, fileId, nextMarked)
    if (result === nextMarked) {
      window.history.replaceState(null, '', buildUpdatedMarkedUrl(window.location.pathname, window.location.search, nextMarked))
    }
    return result
  }

  private async deleteCurrentVideo(fileId: string, parentId: string, pickCode: string): Promise<void> {
    await this.deleteVideoFromPlaylist({ fileId, parentId, pickCode, navigateAfterDelete: true })
  }

  private async deletePlaylistVideo(item: OverlayPlaylistItem): Promise<void> {
    if (!item.fileId || !item.pickCode) {
      this.overlay?.showToast('缺少删除参数')
      return
    }
    await this.deleteVideoFromPlaylist({
      fileId: item.fileId,
      parentId: this.getPlaylistItemParentId(item),
      pickCode: item.pickCode,
      navigateAfterDelete: item.pickCode === this.currentPickCode,
    })
  }

  private async deleteVideoFromPlaylist(params: {
    fileId: string
    parentId: string
    pickCode: string
    navigateAfterDelete: boolean
  }): Promise<void> {
    const { fileId, parentId, pickCode, navigateAfterDelete } = params
    const items = await this.fetchPlaylistItems().catch(() => this.playlistItemsCache)
    const { nextPickCode } = getDeleteFallback(items, pickCode)
    const keepPlaylistOpen = this.keepPlaylistOpenOnInit || this.overlay?.isPlaylistExpanded() === true

    await deleteVideoFile(sendRuntimeMessageSafe, fileId, parentId, pickCode)

    this.playlistItemsCache = this.playlistItemsCache.filter(item => item.pickCode !== pickCode)
    this.syncOverlayPlaybackNav()
    this.overlay?.updatePlaylist(this.playlistItemsCache)

    if (!navigateAfterDelete) {
      this.overlay?.showToast('已删除')
      return
    }

    if (nextPickCode) {
      this.navigateToVideo(nextPickCode, keepPlaylistOpen, true)
      return
    }

    if (window.history.length > 1) {
      window.history.back()
      return
    }

    window.close()
  }

  private navigateToVideo(pickCode: string, keepPlaylistOpen = false, autoPlay = false) {
    if (!pickCode || pickCode === this.currentPickCode) return

    this.clearPlaybackEndState()
    this.pendingVideoSwitch = { pickCode, keepPlaylistOpen, autoPlay }
    this.schedulePendingVideoSwitch()
  }

  private schedulePendingVideoSwitch() {
    if (this.isSwitchingVideo || !this.pendingVideoSwitch) return

    const elapsed = Date.now() - this.lastVideoSwitchStartedAt
    const delay = Math.max(0, PlayerManager.VIDEO_SWITCH_COOLDOWN_MS - elapsed)

    if (this.switchCooldownTimer != null) {
      window.clearTimeout(this.switchCooldownTimer)
      this.switchCooldownTimer = null
    }

    if (delay > 0) {
      this.switchCooldownTimer = window.setTimeout(() => {
        this.switchCooldownTimer = null
        this.schedulePendingVideoSwitch()
      }, delay)
      return
    }

    const next = this.pendingVideoSwitch
    this.pendingVideoSwitch = null
    void this.switchToVideo(next.pickCode, next.keepPlaylistOpen, next.autoPlay)
  }

  private setVideoSwitching(switching: boolean) {
    if (this.isSwitchingVideo === switching) return
    this.isSwitchingVideo = switching
    this.syncOverlayPlaybackNav()
  }

  /**
   * 给 artplayer.switchUrl/switchQuality 增加超时兜底。
   * artplayer 内部 switchUrl 依赖 video:canplay resolve / video:error reject，
   * HLS 源加载失败时可能永远不会触发这两个事件，导致 Promise 永久挂起、播放器卡死。
   * 超时后主动 reject，交由调用方 catch 提示，避免卡死。
   */
  private withSwitchTimeout<T>(promise: Promise<T>, timeoutMs = 15000, message = '视频切换超时'): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error(message)), timeoutMs)
      promise.then(
        (value) => {
          window.clearTimeout(timer)
          resolve(value)
        },
        (error) => {
          window.clearTimeout(timer)
          reject(error)
        },
      )
    })
  }

  /**
   * 主动触发 video 的 error 事件，打破 artplayer switchUrl 的内部挂起（它会 reject switchUrl 的 Promise）。
   * 仅在 HLS 加载失败/初始化异常且 switchUrl 在途时调用，避免播放器永久停在"切换中"。
   */
  private failSwitchUrl(reason: string) {
    const video = this.artplayer?.video
    if (!video) return
    video.dispatchEvent(new ErrorEvent('error', { message: reason }))
  }

  private async switchToVideo(pickCode: string, keepPlaylistOpen = false, autoPlay = false) {
    if (!this.artplayer || !pickCode || pickCode === this.currentPickCode) return

    const requestId = ++this.switchVideoRequestId
    const targetItem = findPlaylistItemByPickCode(this.playlistItemsCache, pickCode)

    this.clearPlaybackEndState()
    this.clearTransientPlaybackWatchers()
    this.lastVideoSwitchStartedAt = Date.now()
    this.setVideoSwitching(true)

    try {
      const playback = await this.resolvePlaybackForPickCode(pickCode)
      if (requestId !== this.switchVideoRequestId || !this.artplayer) return

      this.currentPickCode = pickCode
      this.rotationManager?.switchVideo(pickCode)
      this.subtitleController?.resetPreferenceFlag()
      this.audioManager?.resetPreferenceFlag()
      this.perfMarks = { init: performance.now() }
      this.firstPlayingReported = false
      this.lastPlaylistProgressSyncSec = -1
      
      // 切换前强制重置进度为 0，防止复用 video 元素时继承上一集的进度
      if (this.artplayer.video) {
        this.artplayer.video.currentTime = 0
      }
      this.artplayer.seek = 0
      
      this.applyResolvedPlayback(playback)
      // 切到无损（原生）源时销毁上一集的 hls 实例，m3u8 源由 initHls 自行销毁旧实例
      if (this.currentPlaybackType === 'native') {
        this.disposeHlsInstance()
      }
      // 切换视频时重置倍速，避免上一集的倍速残留到下一集
      this.applyPlaybackRate(1)
      const metaPatch = buildOverlayMetaPatch(targetItem)
      if (metaPatch) {
        this.overlay?.updateMeta(metaPatch)
      }
      window.history.replaceState(null, '', buildPlayerHistoryUrl({
        pathname: window.location.pathname,
        search: window.location.search,
        pickCode,
        targetItem,
        keepPlaylistOpen,
      }))
      this.syncOverlayPlaybackNav()
      this.overlay?.updatePlaylist(this.playlistItemsCache)
      this.switchUrlInFlight = true
      try {
        await this.withSwitchTimeout(this.artplayer.switchUrl(playback.initialPlayback.url))
      }
      finally {
        this.switchUrlInFlight = false
      }
      if (requestId !== this.switchVideoRequestId || !this.artplayer) return
      
      // 切换 URL 后再次重置，防止内部状态污染
      this.artplayer.seek = 0
      if (this.artplayer.video) this.artplayer.video.currentTime = 0

      this.setupProgressHoverPreview(playback.initialPlayback.url, playback.initialPlayback.type)
      this.subtitleController?.resetForNewVideo()
      this.renderQualityPanel()
      this.subtitleController?.renderControl()
      this.renderPlaybackNavControls()

      if (autoPlay) {
        safePlay(this.artplayer)
      }

      void loadPlayHistoryWhenReady(
        pickCode,
        () => requestId === this.switchVideoRequestId && this.artplayer ? this.artplayer.video as HTMLVideoElement : null,
        () => requestId === this.switchVideoRequestId && this.currentPickCode === pickCode,
      )

      void this.fetchBreadcrumbs(pickCode)

      if (targetItem?.fileId) {
        void this.fetchFileFavoriteStatus(targetItem.fileId)
      }
    }
    catch (error) {
      if (requestId !== this.switchVideoRequestId) return
      this.overlay?.showToast(error instanceof Error ? error.message : '切换视频失败')
    }
    finally {
      if (requestId === this.switchVideoRequestId) {
        this.setVideoSwitching(false)
        this.schedulePendingVideoSwitch()
      }
    }
  }

  private async resolvePlaybackForPickCode(pickCode: string) {
    const playback = await resolvePlaybackBundle(sendRuntimeMessageSafe, pickCode, this.nativeUltraSupported)

    playerDebug('[115m] Source fetch result:', {
      ultraOk: !!playback.ultraUrl,
      m3u8Ok: playback.m3u8List.length > 0,
      m3u8Count: playback.m3u8List.length,
      qualityPreference: playback.qualityPreference,
    })

    return playback
  }

  private applyResolvedPlayback(playback: ResolvedPlaybackBundle) {
    this.nativeMonitor?.resetRetryCount()
    this.ultraUrl = playback.ultraUrl
    this.m3u8List = playback.m3u8List
    // 播放器已持有 m3u8 列表：预置缩略图源 URL，避免悬停预览首次打开时再走一次 getM3u8
    const thumbnailSource = [...playback.m3u8List].sort((a, b) => a.quality - b.quality)[0]
    if (thumbnailSource?.url && this.currentPickCode) {
      primeThumbnailSourceUrl(this.currentPickCode, thumbnailSource.url)
    }
    this.isNativeVideo = playback.initialPlayback.isNativeVideo
    this.currentPlaybackType = playback.initialPlayback.type
    this.currentQuality = playback.initialPlayback.currentQuality
    this.currentQualityLabel = playback.initialPlayback.currentQualityLabel
    this.qualityOptions = buildQualityOptions(
      '',
      this.nativeUltraSupported ? (playback.initialPlayback.type === 'native' ? playback.initialPlayback.url : playback.ultraUrl) : null,
      this.m3u8List,
      this.currentQuality,
      this.currentQualityLabel,
    )
  }

  private formatFileSize(size: number): string {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
    if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`
    return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`
  }

  destroy() {
    this.clearPlaybackEndState()
    this.nativeMonitor?.destroy()
    this.nativeMonitor = null
    this.audioManager?.destroy()
    this.audioManager = null
    if (this.switchCooldownTimer != null) {
      window.clearTimeout(this.switchCooldownTimer)
      this.switchCooldownTimer = null
    }
    const runtime = getRuntimeApi()
    runtime?.onMessage?.removeListener(this.handleRuntimeMessage)
    this.overlay?.destroy()
    this.overlay = null
    this.hoverPreview?.destroy()
    this.hoverPreview = null
    if (this.infoMenuTimer != null) {
      window.clearInterval(this.infoMenuTimer)
      this.infoMenuTimer = null
    }
    this.infoMenuEl = null
    this.subtitleController?.destroy()
    this.subtitleController = null
    if (this.cleanupKeyboard) {
      this.cleanupKeyboard()
      this.cleanupKeyboard = null
    }
    this.rotationManager?.destroy()
    this.rotationManager = null
    if (this.hlsInstance) {
      this.hlsInstance.destroy()
      this.hlsInstance = null
    }
    if (this.currentHlsSourceUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.currentHlsSourceUrl)
    }
    this.currentHlsSourceUrl = null
    this.currentHlsLogicalUrl = null
    if (this.artplayer) {
      this.artplayer.destroy()
      this.artplayer = null
    }
  }
}

let playerManager: PlayerManager | null = null

function initPlayer() {
  if (playerManager) return // 防止重复初始化

  const { pickCode, traceId, clickTs, keepPlaylistOpen, playlistToken } = readPlayerBootstrapConfig(window.location.search)

  if (!pickCode) {
    const showError = () => {
      const el = document.getElementById('artplayer-app')
      if (el) {
        el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#ff4d4f;font-size:18px;">缺少 pickCode 参数</div>'
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showError)
    } else {
      showError()
    }
    return
  }

  playerManager = new PlayerManager({ pickCode, traceId, clickTs, keepPlaylistOpen, playlistToken })
}

// content script 暴露 initPlayer 供 video-page.ts 的 init() 调用
;(window as any).__115m_initPlayer = initPlayer
// 页面接管已在 video-page.content.ts 中同步完成，此处直接检查 DOM 就绪状态
if (document.getElementById('loading-text')) {
  initPlayer()
}

window.addEventListener('beforeunload', () => {
  playerManager?.destroy()
})

;(window as any).playerManager = playerManager
