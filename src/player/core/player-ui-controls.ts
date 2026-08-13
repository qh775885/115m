/**
 * 播放器 UI 控件控制器：上一集/下一集导航控件、播放模式控件、倍速应用。
 * 从 PlayerManager 中拆出，通过 attach 注入外部依赖。
 */

import type Artplayer from 'artplayer'
import { buildPlaybackModeControlItem as buildPlaybackModeControlConfig } from './player-playback-mode-control'
import { buildNavControlItem, mountCenterCluster } from './player-center-controls'
import { updateArtplayerControl } from './player-quality'
import { buildPlaybackNavState, getPlaylistPosition } from './playlist-navigation'
import { getPlaybackModeLabel, savePlaybackMode, type PlaybackMode } from './player-playback-mode'
import type { OverlayPlaylistItem } from './overlay'

const PREV_CONTROL_NAME = 'm115-prev-control'
const NEXT_CONTROL_NAME = 'm115-next-control'
const PLAYBACK_MODE_CONTROL_NAME = 'm115-playback-mode-control'

export interface UIControlsDeps {
  /** 获取当前 artplayer 实例 */
  getArtplayer: () => Artplayer | null
  /** 获取当前 pickCode */
  getCurrentPickCode: () => string
  /** 是否正在切换视频 */
  getIsSwitchingVideo: () => boolean
  /** 播放列表控制器操作 */
  getPlaylist: () => {
    items: OverlayPlaylistItem[]
    playPrevious: () => void
    playNext: () => void
  }
  /** 当前播放模式 */
  getCurrentPlaybackMode: () => PlaybackMode
  /** 应用播放模式选择（保存偏好 + toast） */
  onPlaybackModeSelected: (mode: PlaybackMode) => void
  /** 渲染倍速控件（settings 菜单） */
  renderSpeedControl: () => void
  /** 展示 toast */
  onShowToast: (msg: string) => void
}

export class PlayerUIControlsController {
  private deps: UIControlsDeps | null = null

  attach(deps: UIControlsDeps) {
    this.deps = deps
  }

  buildPrevControlItem(): any {
    const deps = this.deps
    if (!deps) return undefined
    const state = buildPlaybackNavState(getPlaylistPosition(deps.getPlaylist().items, deps.getCurrentPickCode()))
    const enabled = state.hasPrevious && !deps.getIsSwitchingVideo()
    return buildNavControlItem({
      controlName: PREV_CONTROL_NAME,
      direction: 'prev',
      index: 9,
      enabled,
      title: deps.getIsSwitchingVideo() ? '正在切换视频' : (state.previousTitle ? `上一集：${state.previousTitle}` : '没有上一集'),
      onClick: () => deps.getPlaylist().playPrevious(),
    })
  }

  buildNextControlItem(): any {
    const deps = this.deps
    if (!deps) return undefined
    const state = buildPlaybackNavState(getPlaylistPosition(deps.getPlaylist().items, deps.getCurrentPickCode()))
    const enabled = state.hasNext && !deps.getIsSwitchingVideo()
    return buildNavControlItem({
      controlName: NEXT_CONTROL_NAME,
      direction: 'next',
      index: 11,
      enabled,
      title: deps.getIsSwitchingVideo() ? '正在切换视频' : (state.nextTitle ? `下一集：${state.nextTitle}` : '没有下一集'),
      onClick: () => deps.getPlaylist().playNext(),
    })
  }

  buildPlaybackModeControlItem(): any {
    const deps = this.deps
    if (!deps) return undefined
    return buildPlaybackModeControlConfig({
      controlName: PLAYBACK_MODE_CONTROL_NAME,
      currentPlaybackMode: deps.getCurrentPlaybackMode(),
      onSelectPlaybackMode: mode => this.applyPlaybackModeSelection(mode),
    })
  }

  renderPlaybackModeControl() {
    const art = this.deps?.getArtplayer()
    if (!art) return
    const item = this.buildPlaybackModeControlItem()
    if (item) {
      updateArtplayerControl(art, PLAYBACK_MODE_CONTROL_NAME, item)
    }
  }

  renderPlaybackNavControls() {
    const art = this.deps?.getArtplayer()
    if (!art) return
    const prev = this.buildPrevControlItem()
    const next = this.buildNextControlItem()
    if (prev) {
      updateArtplayerControl(art, PREV_CONTROL_NAME, prev)
    }
    if (next) {
      updateArtplayerControl(art, NEXT_CONTROL_NAME, next)
    }
    // controls.update 会把重建的控件插回左侧容器，需重新搬进居中簇
    mountCenterCluster(art)
  }

  applyPlaybackModeSelection(mode: PlaybackMode) {
    const deps = this.deps
    if (!deps) return
    savePlaybackMode(mode)
    deps.onPlaybackModeSelected(mode)
    this.renderPlaybackModeControl()
    deps.onShowToast(`播放模式：${getPlaybackModeLabel(mode)}`)
  }

  /** 渲染倍速控件（settings 菜单） */
  renderSpeedControl() {
    this.deps?.renderSpeedControl()
  }

  destroy() {
    this.deps = null
  }
}
