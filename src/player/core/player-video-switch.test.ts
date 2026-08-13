// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlayerSwitchController, type SwitchControllerDeps } from './player-video-switch'

function createController() {
  const art = {
    video: document.createElement('video'),
    seek: 0,
    url: '',
    switchUrl: vi.fn().mockResolvedValue(undefined),
    play: vi.fn().mockResolvedValue(undefined),
  } as never
  const getArtplayer = vi.fn(() => art)
  const getCurrentPickCode = vi.fn(() => 'pick-1')
  const setCurrentPickCode = vi.fn()
  const getIsSwitchingVideo = vi.fn(() => false)
  const setIsSwitchingVideo = vi.fn()
  const setSwitchUrlInFlight = vi.fn()
  const clearTransientPlaybackWatchers = vi.fn()
  const disposeHls = vi.fn()
  const resetPlaybackRate = vi.fn()
  const setupProgressHoverPreview = vi.fn()
  const renderQualityPanel = vi.fn()
  const renderPlaybackNavControls = vi.fn()
  const applyResolvedPlayback = vi.fn()
  const getCurrentPlaybackType = vi.fn(() => 'hls' as const)
  const getNativeUltraSupported = vi.fn(() => true)
  const playlist = {
    clearPlaybackEndState: vi.fn(),
    resetProgressSyncBase: vi.fn(),
    items: [
      { pickCode: 'pick-1', fileId: 'f1', name: '第一集', type: 'video' as const },
      { pickCode: 'pick-2', fileId: 'f2', name: '第二集', type: 'video' as const },
    ],
    syncOverlayPlaybackNav: vi.fn(),
  }
  const actions = {
    fetchBreadcrumbs: vi.fn().mockResolvedValue(undefined),
    fetchFileFavoriteStatus: vi.fn().mockResolvedValue(undefined),
  }
  const onVideoSwitched = vi.fn()
  const updateOverlayMeta = vi.fn()
  const updateHistoryUrl = vi.fn()
  const updatePlaylist = vi.fn()
  const onShowToast = vi.fn()
  const resolvePlaybackForPickCode = vi.fn(async () => ({
    qualityPreference: null,
    ultraUrl: null,
    m3u8List: [] as never[],
    initialPlayback: {
      url: 'https://example.com/best.m3u8',
      type: 'hls' as const,
      currentQuality: 1080,
      currentQualityLabel: '超清',
      isNativeVideo: false,
    },
  }))
  const withSwitchTimeout = vi.fn((p: Promise<unknown>) => p)
  const resetPerfMarks = vi.fn()
  const resetFirstPlaying = vi.fn()

  const deps: SwitchControllerDeps = {
    getArtplayer,
    getCurrentPickCode,
    setCurrentPickCode,
    getIsSwitchingVideo,
    setIsSwitchingVideo,
    setSwitchUrlInFlight,
    clearTransientPlaybackWatchers,
    disposeHls,
    resetPlaybackRate,
    setupProgressHoverPreview,
    renderQualityPanel,
    renderPlaybackNavControls,
    applyResolvedPlayback,
    getCurrentPlaybackType,
    getNativeUltraSupported,
    playlist,
    actions,
    onVideoSwitched,
    updateOverlayMeta,
    updateHistoryUrl,
    updatePlaylist,
    onShowToast,
    resolvePlaybackForPickCode,
    withSwitchTimeout: withSwitchTimeout as SwitchControllerDeps['withSwitchTimeout'],
    resetPerfMarks,
    resetFirstPlaying,
  }
  const controller = new PlayerSwitchController()
  controller.attach(deps)
  return {
    controller, art, deps,
    getCurrentPickCode, setCurrentPickCode, getIsSwitchingVideo, setIsSwitchingVideo,
    setSwitchUrlInFlight, disposeHls, resetPlaybackRate, applyResolvedPlayback,
    onShowToast, resolvePlaybackForPickCode, playlist, actions, withSwitchTimeout,
  }
}

describe('PlayerSwitchController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('navigateToVideo 当前集不切换', () => {
    const { controller, resolvePlaybackForPickCode } = createController()
    controller.navigateToVideo('pick-1')
    expect(resolvePlaybackForPickCode).not.toHaveBeenCalled()
  })

  it('navigateToVideo 空 pickCode 不切换', () => {
    const { controller, resolvePlaybackForPickCode } = createController()
    controller.navigateToVideo('')
    expect(resolvePlaybackForPickCode).not.toHaveBeenCalled()
  })

  it('navigateToVideo 冷却期内调度到后续切换', async () => {
    const { controller, resolvePlaybackForPickCode, playlist } = createController()
    controller.navigateToVideo('pick-2')
    // 首次进入 schedulePendingVideoSwitch：冷却期内设定时器
    expect(playlist.clearPlaybackEndState).toHaveBeenCalled()
    await vi.waitFor(() => {
      expect(resolvePlaybackForPickCode).toHaveBeenCalled()
    }, { timeout: 1500 })
  })

  it('navigateToVideo 切换中不重复调度', () => {
    const { controller, getIsSwitchingVideo, resolvePlaybackForPickCode } = createController()
    getIsSwitchingVideo.mockReturnValue(true)
    controller.navigateToVideo('pick-2')
    expect(resolvePlaybackForPickCode).not.toHaveBeenCalled()
  })

  it('switchToVideo 完整执行切换流程', async () => {
    const { controller, setCurrentPickCode, applyResolvedPlayback, resetPlaybackRate, setSwitchUrlInFlight, onShowToast } = createController()
    controller.navigateToVideo('pick-2')
    await vi.waitFor(() => {
      expect(setCurrentPickCode).toHaveBeenCalledWith('pick-2')
    }, { timeout: 1500 })
    expect(applyResolvedPlayback).toHaveBeenCalled()
    expect(resetPlaybackRate).toHaveBeenCalled()
    expect(setSwitchUrlInFlight).toHaveBeenCalledWith(true)
    expect(setSwitchUrlInFlight).toHaveBeenCalledWith(false)
    expect(onShowToast).not.toHaveBeenCalled()
  })

  it('切换失败时提示', async () => {
    const { controller, resolvePlaybackForPickCode, onShowToast } = createController()
    resolvePlaybackForPickCode.mockRejectedValue(new Error('网络错误'))
    controller.navigateToVideo('pick-2')
    await vi.waitFor(() => {
      expect(onShowToast).toHaveBeenCalledWith('网络错误')
    }, { timeout: 1500 })
  })
})
