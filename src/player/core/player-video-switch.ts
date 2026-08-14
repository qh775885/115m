/**
 * 视频切换调度控制器：切换请求去重、冷却节流、切换执行编排。
 * 从 PlayerManager 中拆出，通过 attach 注入外部依赖。
 */

import type Artplayer from 'artplayer'
import { resetVideoProgress, safePlay } from './media'
import type { ResolvedPlaybackBundle } from './player-services'
import { findPlaylistItemByPickCode, buildOverlayMetaPatch, buildPlayerHistoryUrl } from './player-switch'
import { loadPlayHistoryWhenReady } from './history'
import type { OverlayPlaylistItem } from './overlay-types'
import type { PlayerOverlayMeta } from './overlay-types'

const VIDEO_SWITCH_COOLDOWN_MS = 1200

export interface SwitchControllerDeps {
  /** 获取当前 artplayer 实例 */
  getArtplayer: () => Artplayer | null
  /** 获取当前 pickCode */
  getCurrentPickCode: () => string
  /** 更新当前 pickCode */
  setCurrentPickCode: (pickCode: string) => void
  /** 读取是否正在切换视频 */
  getIsSwitchingVideo: () => boolean
  /** 设置切换中状态 */
  setIsSwitchingVideo: (value: boolean) => void
  /** 设置 switchUrlInFlight */
  setSwitchUrlInFlight: (value: boolean) => void
  /** 清理跨集播放监听（native 监控 + 音频同步定时器） */
  clearTransientPlaybackWatchers: () => void
  /** 销毁 HLS 实例（切到原生源前） */
  disposeHls: () => void
  /** 重置倍速到 1x */
  resetPlaybackRate: () => void
  /** 重新挂载悬停预览 */
  setupProgressHoverPreview: (url: string, type: 'native' | 'hls') => void
  /** 渲染画质控件 */
  renderQualityPanel: () => void
  /** 渲染播放器导航控件 */
  renderPlaybackNavControls: () => void
  /** 应用已解析播放包 */
  applyResolvedPlayback: (playback: ResolvedPlaybackBundle, pickCode: string, nativeUltraSupported: boolean) => void
  /** 当前播放类型 */
  getCurrentPlaybackType: () => 'native' | 'hls'
  /** native 超清是否可用 */
  getNativeUltraSupported: () => boolean
  /** 播放列表控制器操作 */
  playlist: {
    clearPlaybackEndState: () => void
    resetProgressSyncBase: () => void
    items: () => OverlayPlaylistItem[]
    syncOverlayPlaybackNav: () => void
  }
  /** actions 控制器操作 */
  actions: {
    fetchBreadcrumbs: (pickCode: string) => Promise<void>
    fetchFileFavoriteStatus: (fileId: string) => Promise<void>
  }
  /** 切换视频通知（rotation/subtitle/audio 重置） */
  onVideoSwitched: (pickCode: string) => void
  /** 更新 overlay 元数据 */
  updateOverlayMeta: (patch: Partial<PlayerOverlayMeta>) => void
  /** 更新 URL */
  updateHistoryUrl: (url: string) => void
  /** 更新播放列表 UI */
  updatePlaylist: (items: OverlayPlaylistItem[]) => void
  /** 展示 toast */
  onShowToast: (msg: string) => void
  /** 解析播放源 */
  resolvePlaybackForPickCode: (pickCode: string) => Promise<ResolvedPlaybackBundle>
  /** 超时兜底包装 */
  withSwitchTimeout: <T>(promise: Promise<T>, timeoutMs?: number, message?: string) => Promise<T>
  /** 重置性能标记 */
  resetPerfMarks: () => void
  /** 重置首播上报 */
  resetFirstPlaying: () => void
}

export class PlayerSwitchController {
  private deps: SwitchControllerDeps | null = null
  private switchVideoRequestId = 0
  private lastVideoSwitchStartedAt = 0
  private pendingVideoSwitch: { pickCode: string, keepPlaylistOpen: boolean, autoPlay: boolean } | null = null
  private switchCooldownTimer: number | null = null

  attach(deps: SwitchControllerDeps) {
    this.deps = deps
  }

  navigateToVideo(pickCode: string, keepPlaylistOpen = false, autoPlay = false) {
    const deps = this.deps
    if (!deps) return
    if (!pickCode || pickCode === deps.getCurrentPickCode()) return

    deps.playlist.clearPlaybackEndState()
    this.pendingVideoSwitch = { pickCode, keepPlaylistOpen, autoPlay }
    this.schedulePendingVideoSwitch()
  }

  destroy() {
    if (this.switchCooldownTimer != null) {
      window.clearTimeout(this.switchCooldownTimer)
      this.switchCooldownTimer = null
    }
    this.deps = null
  }

  // ─── 内部方法 ───

  private schedulePendingVideoSwitch() {
    const deps = this.deps
    if (!deps) return
    if (deps.getIsSwitchingVideo() || !this.pendingVideoSwitch) return

    const elapsed = Date.now() - this.lastVideoSwitchStartedAt
    const delay = Math.max(0, VIDEO_SWITCH_COOLDOWN_MS - elapsed)

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
    const deps = this.deps
    if (!deps) return
    if (deps.getIsSwitchingVideo() === switching) return
    deps.setIsSwitchingVideo(switching)
    deps.playlist.syncOverlayPlaybackNav()
  }

  private async switchToVideo(pickCode: string, keepPlaylistOpen = false, autoPlay = false) {
    const deps = this.deps
    if (!deps) return
    const art = deps.getArtplayer()
    if (!art || !pickCode || pickCode === deps.getCurrentPickCode()) return

    const requestId = ++this.switchVideoRequestId
    const targetItem = findPlaylistItemByPickCode(deps.playlist.items(), pickCode)

    deps.playlist.clearPlaybackEndState()
    deps.clearTransientPlaybackWatchers()
    this.lastVideoSwitchStartedAt = Date.now()
    this.setVideoSwitching(true)

    try {
      const playback = await deps.resolvePlaybackForPickCode(pickCode)
      if (requestId !== this.switchVideoRequestId || !deps.getArtplayer()) return

      deps.setCurrentPickCode(pickCode)
      deps.onVideoSwitched(pickCode)
      deps.resetPerfMarks()
      deps.resetFirstPlaying()
      deps.playlist.resetProgressSyncBase()

      const currentArt = deps.getArtplayer()
      if (!currentArt) return

      // 切换前强制重置进度为 0，防止复用 video 元素时继承上一集的进度
      resetVideoProgress(currentArt)

      deps.applyResolvedPlayback(playback, pickCode, deps.getNativeUltraSupported())
      // 切到无损（原生）源时销毁上一集的 hls 实例，m3u8 源由 initHls 自行销毁旧实例
      if (deps.getCurrentPlaybackType() === 'native') {
        deps.disposeHls()
      }
      // 切换视频时重置倍速，避免上一集的倍速残留到下一集
      deps.resetPlaybackRate()
      const metaPatch = buildOverlayMetaPatch(targetItem)
      if (metaPatch) {
        deps.updateOverlayMeta(metaPatch)
      }
      deps.updateHistoryUrl(buildPlayerHistoryUrl({
        pathname: window.location.pathname,
        search: window.location.search,
        pickCode,
        targetItem,
        keepPlaylistOpen,
      }))
      deps.playlist.syncOverlayPlaybackNav()
      deps.updatePlaylist(deps.playlist.items())
      deps.setSwitchUrlInFlight(true)
      try {
        await deps.withSwitchTimeout(currentArt.switchUrl(playback.initialPlayback.url))
      }
      finally {
        deps.setSwitchUrlInFlight(false)
      }
      if (requestId !== this.switchVideoRequestId || !deps.getArtplayer()) return

      // 切换 URL 后再次重置，防止内部状态污染
      resetVideoProgress(currentArt)

      deps.setupProgressHoverPreview(playback.initialPlayback.url, playback.initialPlayback.type)
      deps.renderQualityPanel()
      deps.renderPlaybackNavControls()

      if (autoPlay) {
        safePlay(currentArt)
      }

      void loadPlayHistoryWhenReady(
        pickCode,
        () => requestId === this.switchVideoRequestId && deps.getArtplayer() ? deps.getArtplayer()!.video as HTMLVideoElement : null,
        () => requestId === this.switchVideoRequestId && deps.getCurrentPickCode() === pickCode,
      )

      void deps.actions.fetchBreadcrumbs(pickCode)

      if (targetItem?.fileId) {
        void deps.actions.fetchFileFavoriteStatus(targetItem.fileId)
      }
    }
    catch (error) {
      if (requestId !== this.switchVideoRequestId) return
      deps.onShowToast(error instanceof Error ? error.message : '切换视频失败')
    }
    finally {
      if (requestId === this.switchVideoRequestId) {
        this.setVideoSwitching(false)
        this.schedulePendingVideoSwitch()
      }
    }
  }
}
