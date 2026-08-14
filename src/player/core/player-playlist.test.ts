// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlayerPlaylistController, type PlaylistControllerDeps } from './player-playlist'
import type { PlaybackMode } from './player-playback-mode'

function createController() {
  const art = {
    currentTime: 120,
    duration: 600,
    seek: 0,
    play: vi.fn().mockResolvedValue(undefined),
  } as never
  const getArtplayer = vi.fn(() => art)
  const getCurrentPickCode = vi.fn(() => 'pick-1')
  const getPlaylistToken = vi.fn(() => undefined)
  const getIsSwitchingVideo = vi.fn(() => false)
  const getCurrentPlaybackMode = vi.fn<() => PlaybackMode>(() => 'next')
  const onRenderPlaybackNavControls = vi.fn()
  const navigateToVideo = vi.fn()
  const updatePlaybackNav = vi.fn()
  const updateCurrentPlaylistProgress = vi.fn()
  const updateBreadcrumbs = vi.fn()
  const showPlaybackEndPanel = vi.fn()
  const hidePlaybackEndPanel = vi.fn()
  const isPlaylistExpanded = vi.fn(() => false)
  const onShowToast = vi.fn()

  const deps: PlaylistControllerDeps = {
    getArtplayer,
    getCurrentPickCode,
    getPlaylistToken,
    getIsSwitchingVideo,
    getCurrentPlaybackMode,
    onRenderPlaybackNavControls,
    navigateToVideo,
    updatePlaybackNav,
    updateCurrentPlaylistProgress,
    updateBreadcrumbs,
    showPlaybackEndPanel,
    hidePlaybackEndPanel,
    isPlaylistExpanded,
    onShowToast,
  }
  const controller = new PlayerPlaylistController()
  controller.attach(deps)
  return {
    controller, art, deps,
    getArtplayer, getCurrentPickCode, getIsSwitchingVideo, getCurrentPlaybackMode,
    onRenderPlaybackNavControls, navigateToVideo, updatePlaybackNav,
    updateCurrentPlaylistProgress, showPlaybackEndPanel, hidePlaybackEndPanel,
    onShowToast, isPlaylistExpanded,
  }
}

const items = [
  { pickCode: 'pick-1', fileId: 'f1', name: '第一集', type: 'video' as const },
  { pickCode: 'pick-2', fileId: 'f2', name: '第二集', type: 'video' as const },
]

describe('PlayerPlaylistController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('setItems / items / removeItem 管理缓存', () => {
    const { controller } = createController()
    controller.setItems(items as any)
    expect(controller.items).toHaveLength(2)
    expect(controller.removeItem('pick-2')).toBe(true)
    expect(controller.items).toHaveLength(1)
    expect(controller.removeItem('pick-2')).toBe(false)
  })

  it('syncCurrentPlaylistProgress 更新缓存与 overlay', () => {
    const { controller, updateCurrentPlaylistProgress, getCurrentPickCode } = createController()
    controller.setItems(items as any)
    controller.syncCurrentPlaylistProgress(true)
    expect(controller.items[0].progressSec).toBe(120)
    expect(controller.items[0].progressPercent).toBeCloseTo(20)
    expect(updateCurrentPlaylistProgress).toHaveBeenCalledWith('pick-1', 120, 600)
    expect(getCurrentPickCode).toHaveBeenCalled()
  })

  it('syncCurrentPlaylistProgress 未变化不重复同步', () => {
    const { controller, updateCurrentPlaylistProgress } = createController()
    controller.setItems(items as any)
    controller.syncCurrentPlaylistProgress(true)
    controller.syncCurrentPlaylistProgress(false)
    expect(updateCurrentPlaylistProgress).toHaveBeenCalledTimes(1)
  })

  it('syncOverlayPlaybackNav 联动播放器导航控件', () => {
    const { controller, onRenderPlaybackNavControls, updatePlaybackNav, getIsSwitchingVideo } = createController()
    controller.setItems(items as any)
    controller.syncOverlayPlaybackNav()
    expect(onRenderPlaybackNavControls).toHaveBeenCalled()
    expect(updatePlaybackNav).toHaveBeenCalled()
    expect(getIsSwitchingVideo).toHaveBeenCalled()
  })

  it('playNext 无下一集时提示', async () => {
    const { controller, getCurrentPickCode, onShowToast } = createController()
    controller.setItems([items[0]] as any)
    getCurrentPickCode.mockReturnValue('pick-1')
    await controller.playNext()
    expect(onShowToast).toHaveBeenCalledWith('已经是最后一集')
  })

  it('playNext 跳转下一集', async () => {
    const { controller, navigateToVideo } = createController()
    controller.setItems(items as any)
    await controller.playNext()
    expect(navigateToVideo).toHaveBeenCalledWith('pick-2')
  })

  it('playPrevious 跳转上一集', async () => {
    const { controller, getCurrentPickCode, navigateToVideo } = createController()
    controller.setItems(items as any)
    getCurrentPickCode.mockReturnValue('pick-2')
    await controller.playPrevious()
    expect(navigateToVideo).toHaveBeenCalledWith('pick-1')
  })

  it('replayCurrent 重播当前集', () => {
    const { controller, art, hidePlaybackEndPanel } = createController()
    controller.replayCurrent()
    expect((art as any).seek).toBe(0)
    expect((art as any).play).toHaveBeenCalled()
    expect(hidePlaybackEndPanel).toHaveBeenCalled()
  })

  it('handlePlaybackEnded 循环播放模式直接重播', async () => {
    const { controller, getCurrentPlaybackMode, art } = createController()
    getCurrentPlaybackMode.mockReturnValue('repeat' as const)
    controller.setItems(items as any)
    await controller.handlePlaybackEnded()
    expect((art as any).seek).toBe(0)
  })

  it('handlePlaybackEnded 自动连播模式直接跳下一集', async () => {
    const { controller, navigateToVideo } = createController()
    controller.setItems(items as any)
    await controller.handlePlaybackEnded()
    expect(navigateToVideo).toHaveBeenCalledWith('pick-2', false, true)
  })

  it('handlePlaybackEnded 无下一集时停止（不导航不弹面板）', async () => {
    const { controller, getCurrentPickCode, navigateToVideo, showPlaybackEndPanel } = createController()
    controller.setItems([items[0]] as any)
    getCurrentPickCode.mockReturnValue('pick-1')
    await controller.handlePlaybackEnded()
    expect(navigateToVideo).not.toHaveBeenCalled()
    expect(showPlaybackEndPanel).not.toHaveBeenCalled()
  })

  it('clearPlaybackEndState 清理定时器', () => {
    const { controller, hidePlaybackEndPanel } = createController()
    controller.clearPlaybackEndState()
    expect(hidePlaybackEndPanel).toHaveBeenCalled()
  })

  it('resetProgressSyncBase 重置进度同步基点', () => {
    const { controller } = createController()
    controller.resetProgressSyncBase()
    expect(controller.items).toHaveLength(0)
  })
})
