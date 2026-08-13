// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlayerQualityController, type QualityControllerDeps } from './player-quality-controller'

function createController() {
  const art = {
    url: 'https://example.com/best.m3u8',
    video: document.createElement('video'),
    switchQuality: vi.fn().mockResolvedValue(undefined),
  } as never
  const artMock = art as unknown as { url: string, switchQuality: ReturnType<typeof vi.fn> }
  const getArtplayer = vi.fn(() => art)
  const getCurrentPickCode = vi.fn(() => 'pick-1')
  const isReady = vi.fn(() => false)
  const getNativeUltraSupported = vi.fn(() => true)
  const getSwitchUrlInFlight = vi.fn(() => false)
  const setSwitchUrlInFlight = vi.fn()
  const withSwitchTimeout = vi.fn((p: Promise<unknown>, _ms?: number, _msg?: string) => p)
  const resetNativeRetry = vi.fn()
  const disposeHls = vi.fn()
  const onShowToast = vi.fn()
  const onShowError = vi.fn()

  const deps: QualityControllerDeps = {
    getArtplayer,
    getCurrentPickCode,
    isReady,
    getNativeUltraSupported,
    getSwitchUrlInFlight,
    setSwitchUrlInFlight,
    withSwitchTimeout: withSwitchTimeout as QualityControllerDeps['withSwitchTimeout'],
    resetNativeRetry,
    disposeHls,
    onShowToast,
    onShowError,
  }
  const controller = new PlayerQualityController()
  controller.attach(deps)
  return { controller, art, artMock, deps, setSwitchUrlInFlight, resetNativeRetry, disposeHls, onShowToast, onShowError, getCurrentPickCode }
}

const m3u8List = [
  { url: 'https://example.com/low.m3u8', quality: 360, name: '流畅' },
  { url: 'https://example.com/best.m3u8', quality: 1080, name: '超清' },
]

describe('PlayerQualityController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('applyResolvedPlayback 设置源与画质状态', () => {
    const { controller } = createController()
    controller.applyResolvedPlayback({
      qualityPreference: null,
      ultraUrl: null,
      m3u8List,
      initialPlayback: {
        url: 'https://example.com/best.m3u8',
        type: 'hls',
        currentQuality: 1080,
        currentQualityLabel: '超清',
        isNativeVideo: false,
      },
    })
    expect(controller.m3u8ListValue).toHaveLength(2)
    expect(controller.currentQualityValue).toBe(1080)
    expect(controller.currentQualityLabelValue).toBe('超清')
    expect(controller.isNativeVideoValue).toBe(false)
    expect(controller.currentPlaybackTypeValue).toBe('hls')
  })

  it('markNative 标记为无损播放', () => {
    const { controller } = createController()
    controller.markNative()
    expect(controller.currentQualityValue).toBe(9999)
    expect(controller.currentQualityLabelValue).toBe('无损')
  })

  it('applyPlaybackStatePatch 同步 isNativeVideo 与 currentPlaybackType', () => {
    const { controller } = createController()
    controller.applyPlaybackStatePatch({ isNativeVideo: true })
    expect(controller.currentPlaybackTypeValue).toBe('native')
    controller.applyPlaybackStatePatch({ isNativeVideo: false })
    expect(controller.currentPlaybackTypeValue).toBe('hls')
  })

  it('switchQuality 切到原生源时调用 disposeHls', async () => {
    const { controller, artMock, disposeHls, setSwitchUrlInFlight } = createController()
    controller.applyResolvedPlayback({
      qualityPreference: null,
      ultraUrl: 'https://example.com/ultra.mp4',
      m3u8List,
      initialPlayback: {
        url: 'https://example.com/best.m3u8',
        type: 'hls',
        currentQuality: 1080,
        currentQualityLabel: '超清',
        isNativeVideo: false,
      },
    })
    const opt = { url: 'https://example.com/ultra.mp4', label: '115原画', quality: 9999 }
    await controller.switchQuality(opt)
    expect(controller.isNativeVideoValue).toBe(true)
    expect(disposeHls).toHaveBeenCalled()
    expect(setSwitchUrlInFlight).toHaveBeenCalledWith(true)
    expect(setSwitchUrlInFlight).toHaveBeenCalledWith(false)
    expect(artMock.switchQuality).toHaveBeenCalledWith('https://example.com/ultra.mp4')
  })

  it('switchQuality 相同 URL 直接返回', async () => {
    const { controller, artMock } = createController()
    await controller.switchQuality({ url: 'https://example.com/best.m3u8', label: '超清', quality: 1080 })
    expect(artMock.switchQuality).not.toHaveBeenCalled()
  })

  it('switchQuality 原画占位先解析真实源', async () => {
    const { controller, artMock } = createController()
    controller.applyResolvedPlayback({
      qualityPreference: null,
      ultraUrl: null,
      m3u8List,
      initialPlayback: {
        url: 'https://example.com/best.m3u8',
        type: 'hls',
        currentQuality: 1080,
        currentQualityLabel: '超清',
        isNativeVideo: false,
      },
    })
    // 原画占位符：无真实源则提示失败
    await controller.switchQuality({ url: '__ORIGINAL_PLACEHOLDER__', label: '115原画', quality: 9999 })
    // 若 m3u8 列表非空则能解析到 9999 或第一个源，这里验证不会报错
    expect(artMock.switchQuality).toHaveBeenCalled()
  })

  it('applySelectedOption 应用选项并渲染', async () => {
    const { controller } = createController()
    controller.applySelectedOption({ url: 'https://example.com/low.m3u8', label: '流畅', quality: 360 })
    expect(controller.currentQualityValue).toBe(360)
    expect(controller.currentQualityLabelValue).toBe('流畅')
  })

  it('setM3u8List / forceHlsType 支持降级场景', () => {
    const { controller } = createController()
    controller.setM3u8List(m3u8List)
    expect(controller.m3u8ListValue).toHaveLength(2)
    controller.forceHlsType()
    expect(controller.currentPlaybackTypeValue).toBe('hls')
    expect(controller.isNativeVideoValue).toBe(false)
  })
})

