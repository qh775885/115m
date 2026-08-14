/**
 * 播放列表域控制器：播放列表缓存、连播进度同步、自动连播/上一集/下一集/重播。
 * 从 PlayerManager 中拆出，通过 attach 注入外部依赖。
 */

import type Artplayer from 'artplayer'
import { readTemporaryPlayerPlaylist } from '../../shared/player-playlist-cache'
import { readPlaylistCidFromLocation } from './player-query'
import { getNextPlaylistItem, getPlaybackEndCountdownPlan, getPreviousPlaylistItem } from './player-navigation'
import { fetchPlaylistData } from './player-services'
import { buildPlaybackNavState, getPlaylistPosition } from './playlist-navigation'
import { buildPlaybackModePlan, type PlaybackMode } from './player-playback-mode'
import { sendRuntimeMessageSafe } from './runtime'
import type { OverlayPathItem, OverlayPlaybackNavState, OverlayPlaylistItem } from './overlay-types'

export interface PlaylistControllerDeps {
  /** 获取当前 artplayer 实例 */
  getArtplayer: () => Artplayer | null
  /** 获取当前 pickCode */
  getCurrentPickCode: () => string
  /** 获取临时播放列表 token */
  getPlaylistToken: () => string | undefined
  /** 是否正在切换视频 */
  getIsSwitchingVideo: () => boolean
  /** 获取当前播放模式 */
  getCurrentPlaybackMode: () => PlaybackMode
  /** 更新播放器导航控件（上一集/下一集） */
  onRenderPlaybackNavControls: () => void
  /** 导航到目标视频 */
  navigateToVideo: (pickCode: string, keepPlaylistOpen?: boolean, autoPlay?: boolean) => void
  /** 更新播放列表面板导航状态 */
  updatePlaybackNav: (state: OverlayPlaybackNavState) => void
  /** 更新当前播放进度 */
  updateCurrentPlaylistProgress: (pickCode: string, progressSec: number, duration: number) => void
  /** 更新面包屑 */
  updateBreadcrumbs: (path: OverlayPathItem[]) => void
  /** 展示连播结束面板 */
  showPlaybackEndPanel: (state: { mode: 'autoplay-next' | 'ended', nextTitle?: string, countdownSec?: number }) => void
  /** 隐藏连播结束面板 */
  hidePlaybackEndPanel: () => void
  /** 播放列表是否展开 */
  isPlaylistExpanded: () => boolean
  /** 展示 toast */
  onShowToast: (msg: string) => void
  /** 格式化文件大小 */
  formatFileSize: (size: number) => string
}

function playlistDebug(...args: unknown[]) {
  if (localStorage.getItem('115m-player-debug') === '1') {
    console.debug(...args)
  }
}

function safePlay(art: Artplayer | null) {
  if (!art) return
  void art.play().catch(() => {
    // Ignore native play promise rejections during source switches and transient media reloads.
  })
}

export class PlayerPlaylistController {
  private deps: PlaylistControllerDeps | null = null

  private playlistItemsCache: OverlayPlaylistItem[] = []
  private playlistLoadingPromise: Promise<OverlayPlaylistItem[]> | null = null
  private autoNextTimer: number | null = null
  private lastPlaylistProgressSyncSec = -1

  /** 当前播放列表缓存 */
  get items(): OverlayPlaylistItem[] {
    return this.playlistItemsCache
  }

  attach(deps: PlaylistControllerDeps) {
    this.deps = deps
  }

  async prefetchPlaylistItems() {
    const deps = this.deps
    if (!deps) return
    try {
      await this.fetchPlaylistItems()
      this.syncOverlayPlaybackNav()
    }
    catch (error) {
      playlistDebug('[115m] prefetchPlaylistItems failed:', error)
    }
  }

  async fetchPlaylistItems(): Promise<OverlayPlaylistItem[]> {
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

  /** 从列表中移除指定 pickCode 的项（移动/删除后同步） */
  removeItem(pickCode: string) {
    const beforeCount = this.playlistItemsCache.length
    this.playlistItemsCache = this.playlistItemsCache.filter(item => item.pickCode !== pickCode)
    return this.playlistItemsCache.length !== beforeCount
  }

  /** 整体替换播放列表缓存（移动/删除后同步） */
  setItems(items: OverlayPlaylistItem[]) {
    this.playlistItemsCache = items
  }

  /** 更新播放器导航控件与 overlay 播放导航 */
  syncOverlayPlaybackNav() {
    const deps = this.deps
    if (!deps) return
    deps.onRenderPlaybackNavControls()
    const state = buildPlaybackNavState(
      getPlaylistPosition(this.playlistItemsCache, deps.getCurrentPickCode()),
    )
    const isSwitching = deps.getIsSwitchingVideo()
    deps.updatePlaybackNav({
      ...state,
      hasPrevious: state.hasPrevious && !isSwitching,
      hasNext: state.hasNext && !isSwitching,
      previousTitle: isSwitching ? '正在切换视频' : state.previousTitle,
      nextTitle: isSwitching ? '正在切换视频' : state.nextTitle,
    })
  }

  syncCurrentPlaylistProgress(force = false) {
    const deps = this.deps
    if (!deps) return
    const art = deps.getArtplayer()
    if (!art) return

    const currentTime = art.currentTime || 0
    const duration = art.duration || 0
    if (!duration || duration <= 0) return

    const roundedSec = Math.floor(currentTime)
    if (!force && roundedSec === this.lastPlaylistProgressSyncSec) return
    this.lastPlaylistProgressSyncSec = roundedSec

    const progressPercent = Math.max(0, Math.min(100, currentTime / duration * 100))
    const pickCode = deps.getCurrentPickCode()
    const item = this.playlistItemsCache.find(entry => entry.pickCode === pickCode)
    if (item) {
      item.progressSec = currentTime
      item.progressPercent = progressPercent
    }

    deps.updateCurrentPlaylistProgress(pickCode, currentTime, duration)
  }

  clearPlaybackEndState() {
    if (this.autoNextTimer) {
      window.clearTimeout(this.autoNextTimer)
      this.autoNextTimer = null
    }
    this.deps?.hidePlaybackEndPanel()
  }

  async handlePlaybackEnded() {
    const deps = this.deps
    if (!deps) return
    this.clearPlaybackEndState()
    const items = await this.fetchPlaylistItems().catch(() => [])
    const plan = getPlaybackEndCountdownPlan(items, deps.getCurrentPickCode())
    const next = plan.next

    const playbackPlan = buildPlaybackModePlan(deps.getCurrentPlaybackMode(), !!next)
    if (playbackPlan === 'repeat') {
      this.replayCurrent()
      return
    }
    if (playbackPlan === 'next' && next) {
      deps.navigateToVideo(next.pickCode, deps.isPlaylistExpanded() === true, true)
      return
    }
    if (playbackPlan === 'stop') {
      return
    }

    if (next) {
      let countdown = plan.countdownSec
      deps.showPlaybackEndPanel({
        mode: 'autoplay-next',
        nextTitle: next.name,
        countdownSec: countdown,
      })
      this.autoNextTimer = window.setInterval(() => {
        countdown -= 1
        if (countdown <= 0) {
          this.clearPlaybackEndState()
          deps.navigateToVideo(next.pickCode, deps.isPlaylistExpanded() === true, true)
          return
        }
        deps.showPlaybackEndPanel({
          mode: 'autoplay-next',
          nextTitle: next.name,
          countdownSec: countdown,
        })
      }, 1000) as unknown as number
      return
    }

    deps.showPlaybackEndPanel({ mode: 'ended' })
  }

  async playPrevious() {
    const deps = this.deps
    if (!deps) return
    const items = await this.fetchPlaylistItems().catch(() => [])
    const previous = getPreviousPlaylistItem(items, deps.getCurrentPickCode())
    if (!previous) {
      deps.onShowToast('已经是第一集')
      return
    }
    deps.navigateToVideo(previous.pickCode)
  }

  async playNext() {
    const deps = this.deps
    if (!deps) return
    const items = await this.fetchPlaylistItems().catch(() => [])
    const next = getNextPlaylistItem(items, deps.getCurrentPickCode())
    if (!next) {
      deps.onShowToast('已经是最后一集')
      return
    }
    deps.navigateToVideo(next.pickCode)
  }

  replayCurrent() {
    const deps = this.deps
    if (!deps) return
    this.clearPlaybackEndState()
    const art = deps.getArtplayer()
    if (!art) return
    art.seek = 0
    safePlay(art)
  }

  /** 重置进度同步基点（切集时调用） */
  resetProgressSyncBase() {
    this.lastPlaylistProgressSyncSec = -1
  }

  destroy() {
    if (this.autoNextTimer) {
      window.clearTimeout(this.autoNextTimer)
      this.autoNextTimer = null
    }
    this.deps = null
  }

  // ─── 内部方法 ───

  private async fetchPlaylistItemsInternal(): Promise<OverlayPlaylistItem[]> {
    const deps = this.deps
    if (!deps) return []
    const temporaryPlaylist = readTemporaryPlayerPlaylist(deps.getPlaylistToken())
    if (temporaryPlaylist.some(item => item.pickCode === deps.getCurrentPickCode())) {
      return temporaryPlaylist
    }

    const cid = readPlaylistCidFromLocation(window.location.search)

    return await fetchPlaylistData({
      sendMessage: sendRuntimeMessageSafe,
      cid,
      pickCode: deps.getCurrentPickCode(),
      formatFileSize: size => deps.formatFileSize(size),
      onPath: path => deps.updateBreadcrumbs(path),
    })
  }
}
