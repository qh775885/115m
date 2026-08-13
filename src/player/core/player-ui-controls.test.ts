// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlayerUIControlsController, type UIControlsDeps } from './player-ui-controls'

function createController() {
  const art = {
    contextmenu: { remove: vi.fn() },
    template: { $controls: document.createElement('div'), $player: document.createElement('div') },
  } as never
  const getArtplayer = vi.fn(() => art)
  const getCurrentPickCode = vi.fn(() => 'pick-1')
  const getIsSwitchingVideo = vi.fn(() => false)
  const playlist = {
    items: [
      { pickCode: 'pick-1', fileId: 'f1', name: '第一集', type: 'video' as const },
      { pickCode: 'pick-2', fileId: 'f2', name: '第二集', type: 'video' as const },
    ],
    playPrevious: vi.fn(),
    playNext: vi.fn(),
  }
  const getPlaylist = vi.fn(() => playlist)
  const getCurrentPlaybackMode = vi.fn(() => 'next' as const)
  const onPlaybackModeSelected = vi.fn()
  const renderSpeedControl = vi.fn()
  const onShowToast = vi.fn()

  const deps: UIControlsDeps = {
    getArtplayer,
    getCurrentPickCode,
    getIsSwitchingVideo,
    getPlaylist,
    getCurrentPlaybackMode,
    onPlaybackModeSelected,
    renderSpeedControl,
    onShowToast,
  }
  const controller = new PlayerUIControlsController()
  controller.attach(deps)
  return {
    controller, art, deps, playlist,
    getArtplayer, getCurrentPickCode, getIsSwitchingVideo, getPlaylist,
    getCurrentPlaybackMode, onPlaybackModeSelected, renderSpeedControl, onShowToast,
  }
}

describe('PlayerUIControlsController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('buildPrevControlItem 有上一集时启用', () => {
    const { controller, getCurrentPickCode } = createController()
    getCurrentPickCode.mockReturnValue('pick-2')
    const item = controller.buildPrevControlItem()
    expect(item.name).toBe('m115-prev-control')
    expect(item.html).toContain('上一集')
    expect(item.html).not.toContain('is-disabled')
  })

  it('buildPrevControlItem 切换中禁用', () => {
    const { controller, getIsSwitchingVideo, getCurrentPickCode } = createController()
    getCurrentPickCode.mockReturnValue('pick-2')
    getIsSwitchingVideo.mockReturnValue(true)
    const item = controller.buildPrevControlItem()
    expect(item.html).toContain('正在切换视频')
    expect(item.html).toContain('is-disabled')
  })

  it('buildNextControlItem 有下一集时启用并触发 playNext', () => {
    const { controller, playlist } = createController()
    const item = controller.buildNextControlItem()
    expect(item.name).toBe('m115-next-control')
    item.click()
    expect(playlist.playNext).toHaveBeenCalled()
  })

  it('buildNextControlItem 无下一集时禁用', () => {
    const { controller, getCurrentPickCode } = createController()
    getCurrentPickCode.mockReturnValue('pick-2')
    const item = controller.buildNextControlItem()
    expect(item.html).toContain('没有下一集')
  })

  it('applyPlaybackModeSelection 保存偏好并联动', () => {
    const { controller, onPlaybackModeSelected, onShowToast } = createController()
    controller.applyPlaybackModeSelection('repeat')
    expect(onPlaybackModeSelected).toHaveBeenCalledWith('repeat')
    expect(onShowToast).toHaveBeenCalledWith('播放模式：重播')
  })

  it('renderSpeedControl 委托给 settings 菜单', () => {
    const { controller, renderSpeedControl } = createController()
    controller.renderSpeedControl()
    expect(renderSpeedControl).toHaveBeenCalled()
  })

  it('无 artplayer 时渲染方法安全跳过', () => {
    const { controller, getArtplayer } = createController()
    getArtplayer.mockReturnValue(null as never)
    controller.renderPlaybackNavControls()
    controller.renderPlaybackModeControl()
    expect(() => controller.buildPrevControlItem()).not.toThrow()
  })
})
