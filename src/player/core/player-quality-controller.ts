/**
 * 画质域控制器：持有画质状态（源/画质选项/原生标记），负责画质切换、状态刷新、画质控件构建。
 * 从 PlayerManager 中拆出，通过 attach 注入外部依赖。
 */

import type Artplayer from 'artplayer'
import type { M3u8Item } from '../../lib/types'
import { fetchM3u8WithRetry } from './source'
import { ORIGINAL_PLACEHOLDER_URL, buildQualityOptions } from './quality'
import { saveQualityPreference } from './history'
import { buildQualityControlItem as buildQualityControlConfig, updateArtplayerControl } from './player-quality'
import type { QualityOption } from './types'
import type { ResolvedPlaybackBundle } from './player-services'
import {
  applySelectedQualityOption,
  isOriginalPlaceholderOption,
  refreshPlaybackQualityState,
  resolveOriginalPlaceholderUrl,
  syncPlaybackStateByUrl,
  type PlaybackState,
} from './playback-state'
import { primeThumbnailSourceUrl } from '../../lib/videoThumbnail'

const QUALITY_CONTROL_NAME = 'm115-quality-control'

export interface QualityControllerDeps {
  /** 获取当前 artplayer 实例 */
  getArtplayer: () => Artplayer | null
  /** 获取当前 pickCode */
  getCurrentPickCode: () => string
  /** 是否已加载过（用于区分手动切换 vs 首次加载） */
  isReady: () => boolean
  /** 读取 switchUrlInFlight */
  getSwitchUrlInFlight: () => boolean
  /** 设置 switchUrlInFlight */
  setSwitchUrlInFlight: (value: boolean) => void
  /** 超时兜底包装 */
  withSwitchTimeout: <T>(promise: Promise<T>, timeoutMs?: number, message?: string) => Promise<T>
  /** 重置原生播放重试计数 */
  resetNativeRetry: () => void
  /** 销毁 HLS 实例（切到原生源前） */
  disposeHls: () => void
  /** toast 提示 */
  onShowToast: (msg: string) => void
  /** 展示错误 */
  onShowError: (msg: string) => void
}

export class PlayerQualityController {
  private artplayer: Artplayer | null = null
  private deps: QualityControllerDeps | null = null

  private m3u8List: M3u8Item[] = []
  private ultraUrl: string | null = null
  private qualityOptions: QualityOption[] = []
  private currentQuality = 0
  private currentQualityLabel = '加载中'
  private isNativeVideo = false
  private currentPlaybackType: 'native' | 'hls' = 'hls'

  /** 当前 m3u8 源列表 */
  get m3u8ListValue(): M3u8Item[] {
    return this.m3u8List
  }

  /** 当前无损源 URL */
  get ultraUrlValue(): string | null {
    return this.ultraUrl
  }

  /** 当前画质选项 */
  get qualityOptionsValue(): QualityOption[] {
    return this.qualityOptions
  }

  /** 当前画质 */
  get currentQualityValue(): number {
    return this.currentQuality
  }

  /** 当前画质标签 */
  get currentQualityLabelValue(): string {
    return this.currentQualityLabel
  }

  /** 是否原生播放 */
  get isNativeVideoValue(): boolean {
    return this.isNativeVideo
  }

  /** 当前播放类型 */
  get currentPlaybackTypeValue(): 'native' | 'hls' {
    return this.currentPlaybackType
  }

  attach(deps: QualityControllerDeps) {
    this.deps = deps
    this.artplayer = deps.getArtplayer()
  }

  /** 构建 PlaybackState 快照（供纯函数操作） */
  getPlaybackState(): PlaybackState {
    return {
      ultraUrl: this.ultraUrl,
      m3u8List: this.m3u8List,
      qualityOptions: this.qualityOptions,
      currentQuality: this.currentQuality,
      currentQualityLabel: this.currentQualityLabel,
      isNativeVideo: this.isNativeVideo,
    }
  }

  /** 应用 PlaybackState patch（含 isNativeVideo ↔ currentPlaybackType 同步） */
  applyPlaybackStatePatch(state: Partial<PlaybackState>) {
    Object.assign(this, state)
    // isNativeVideo 与 currentPlaybackType 是同一事实的两个投影，patch 更新 isNativeVideo 时同步 playbackType，
    // 避免 onError 用 isNativeVideo、nativeMonitor 用 currentPlaybackType 时两处判断不一致
    if (state.isNativeVideo !== undefined) {
      this.currentPlaybackType = state.isNativeVideo ? 'native' : 'hls'
    }
  }

  /** 按 URL 同步画质状态 */
  updateQualityByUrl(url: string) {
    this.applyPlaybackStatePatch(syncPlaybackStateByUrl(this.getPlaybackState(), url))
  }

  /** 刷新画质状态（重建画质选项并同步） */
  refreshQualityState(currentUrl: string) {
    this.applyPlaybackStatePatch(refreshPlaybackQualityState(this.getPlaybackState(), currentUrl))
  }

  /** 构建画质控件配置 */
  buildQualityControlItem(): any {
    const deps = this.deps
    if (!deps) return undefined
    return buildQualityControlConfig({
      controlName: QUALITY_CONTROL_NAME,
      currentQualityLabel: this.currentQualityLabel,
      currentUrl: this.artplayer?.url || '',
      qualityOptions: this.qualityOptions,
      onSelect: async target => await this.switchQuality(target),
    })
  }

  /** 渲染画质控件 */
  renderQualityPanel() {
    if (!this.artplayer) return
    const item = this.buildQualityControlItem()
    if (item) {
      updateArtplayerControl(this.artplayer, QUALITY_CONTROL_NAME, item)
    }
  }

  /** 应用已选中的画质选项到状态并刷新控件 */
  applySelectedOption(opt: QualityOption) {
    this.applyPlaybackStatePatch(applySelectedQualityOption(this.getPlaybackState(), opt))
    this.renderQualityPanel()
  }

  /** 标记为原生（无损）播放 */
  markNative() {
    this.currentQuality = 9999
    this.currentQualityLabel = '无损'
  }

  /** 设置 m3u8 源列表 */
  setM3u8List(list: M3u8Item[]) {
    this.m3u8List = list
  }

  /** 强制切回 HLS 播放类型（原生播放失败降级时） */
  forceHlsType() {
    this.currentPlaybackType = 'hls'
    this.isNativeVideo = false
  }

  /**
   * 解析播放 URL 对应的画质状态（供 customType.m3u8 回调等播放器加载入口复用）：
   * - 原画占位符：先解析真实源，成功后才记录偏好，避免源不可用时带失败偏好重试
   * - 普通画质：手动切换（已就绪）时记录偏好
   * 返回实际应播放的 URL；占位符解析失败时返回 null。
   */
  async resolveQualityPlayback(url: string): Promise<string | null> {
    const deps = this.deps
    if (!deps) return url

    if (url === ORIGINAL_PLACEHOLDER_URL) {
      const resolvedUrl = await this.ensureOriginalSourceLoaded()
      if (!resolvedUrl) {
        deps.onShowError('115原画加载失败，请稍后重试')
        return null
      }
      // 原画源加载成功后才记录偏好，避免源持续不可用时每次自动加载都带着失败偏好重试
      saveQualityPreference(deps.getCurrentPickCode(), '115原画', 9999)
      // 立即更新内部状态，以便后续 UI 同步正常工作
      const opt = this.qualityOptionsValue.find(o => o.url === url)
      if (opt) {
        this.applySelectedOption(opt)
      }
      return resolvedUrl
    }

    const opt = this.qualityOptionsValue.find(o => o.url === url)
    if (opt) {
      // 只要是手动切换（非首次加载且已就绪），就记录偏好
      if (deps.isReady()) {
        saveQualityPreference(deps.getCurrentPickCode(), opt.label, opt.quality)
      }
      this.applySelectedOption(opt)
    }
    return url
  }

  /**
   * 切换画质。
   * 原画占位项需先解析真实源；切换后应用状态、记录偏好，并委托 artplayer.switchQuality。
   */
  async switchQuality(opt: QualityOption) {
    const deps = this.deps
    if (!deps || !this.artplayer) return

    if (isOriginalPlaceholderOption(opt)) {
      const resolvedUrl = await this.ensureOriginalSourceLoaded()
      if (!resolvedUrl) {
        deps.onShowError('115原画加载失败，请稍后重试')
        return
      }
      opt = { ...opt, url: resolvedUrl }
    }

    if (this.artplayer.url === opt.url) return

    deps.resetNativeRetry()
    this.currentPlaybackType = !!this.ultraUrl && opt.url === this.ultraUrl ? 'native' : 'hls'

    this.applyPlaybackStatePatch(applySelectedQualityOption(this.getPlaybackState(), opt))
    this.renderQualityPanel()

    // 记住用户手动选择的画质
    saveQualityPreference(deps.getCurrentPickCode(), opt.label, opt.quality)

    if (this.currentPlaybackType === 'native') {
      deps.disposeHls()
    }

    try {
      deps.setSwitchUrlInFlight(true)
      try {
        await deps.withSwitchTimeout(this.artplayer.switchQuality(opt.url))
      }
      finally {
        deps.setSwitchUrlInFlight(false)
      }
    }
    catch (error) {
      if (!this.artplayer) return
      this.updateQualityByUrl(this.artplayer.url || '')
      this.renderQualityPanel()
      deps.onShowToast(error instanceof Error ? error.message : '切换画质失败')
    }
  }

  /**
   * 解析 115 原画占位源为真实 URL。
   * 无 m3u8 列表时先拉取；刷新画质状态后返回原画真实源。
   */
  async ensureOriginalSourceLoaded(): Promise<string | null> {
    const deps = this.deps
    if (!deps) return null
    if (this.m3u8List.length === 0) {
      try {
        const list = await fetchM3u8WithRetry(deps.getCurrentPickCode())
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

  /** 应用已解析的播放包（初始化/切集后设置源与画质状态） */
  applyResolvedPlayback(playback: ResolvedPlaybackBundle, pickCode: string, nativeUltraSupported: boolean) {
    this.deps?.resetNativeRetry()
    this.ultraUrl = playback.ultraUrl
    this.m3u8List = playback.m3u8List
    // 播放器已持有 m3u8 列表：预置缩略图源 URL，避免悬停预览首次打开时再走一次 getM3u8
    const thumbnailSource = [...playback.m3u8List].sort((a, b) => a.quality - b.quality)[0]
    if (thumbnailSource?.url && pickCode) {
      primeThumbnailSourceUrl(pickCode, thumbnailSource.url)
    }
    this.isNativeVideo = playback.initialPlayback.isNativeVideo
    this.currentPlaybackType = playback.initialPlayback.type
    this.currentQuality = playback.initialPlayback.currentQuality
    this.currentQualityLabel = playback.initialPlayback.currentQualityLabel
    this.qualityOptions = buildQualityOptions(
      '',
      nativeUltraSupported ? (playback.initialPlayback.type === 'native' ? playback.initialPlayback.url : playback.ultraUrl) : null,
      this.m3u8List,
      this.currentQuality,
      this.currentQualityLabel,
    )
  }

  destroy() {
    this.artplayer = null
    this.deps = null
  }
}
