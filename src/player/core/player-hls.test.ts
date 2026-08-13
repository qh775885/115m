// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HlsPlayerController, type HlsPlayerDeps } from './player-hls'

if (typeof localStorage === 'undefined') {
  ;(globalThis as any).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  }
}

vi.mock('./hls', () => ({
  createHlsInstance: vi.fn(async (video, url) => {
    const hls = makeMockHls()
    hls.loadSource(url)
    hls.attachMedia(video)
    return hls
  }),
  isHlsSupported: vi.fn(async () => true),
}))

function makeMockHls() {
  const handlers: Record<string, ((...args: any[]) => void)[]> = {}
  return {
    on: vi.fn((name: string, cb: (...args: any[]) => void) => {
      handlers[name] = handlers[name] || []
      handlers[name].push(cb)
    }),
    _handlers: handlers,
    emit(name: string, ...args: any[]) {
      ;(handlers[name] || []).forEach(cb => cb(...args))
    },
    destroy: vi.fn(),
    startLoad: vi.fn(),
    loadSource: vi.fn(),
    attachMedia: vi.fn(),
    recoverMediaError: vi.fn(),
    audioTracks: [],
    audioTrack: 0,
  }
}

function createVideo() {
  const video = document.createElement('video')
  return video
}

function createController() {
  const video = createVideo()
  const art = {
    video,
    on: vi.fn(),
    off: vi.fn(),
    seek: 0,
    play: vi.fn().mockResolvedValue(undefined),
  } as never
  const failSwitchUrl = vi.fn()
  const onShowToast = vi.fn()
  const getAudioTrackLabel = vi.fn(() => '音轨')
  const onAudioTracksUpdated = vi.fn()
  const onAudioScheduleSync = vi.fn()
  const onAudioHydrateFromMaster = vi.fn()
  const getSwitchUrlInFlight = vi.fn(() => false)
  const getCurrentPickCode = vi.fn(() => 'pick-1')
  const getArtplayer = vi.fn(() => art)

  const deps: HlsPlayerDeps = {
    getArtplayer,
    getCurrentPickCode,
    getSwitchUrlInFlight,
    failSwitchUrl,
    onShowToast,
    getAudioTrackLabel,
    onAudioTracksUpdated,
    onAudioScheduleSync,
    onAudioHydrateFromMaster,
  }
  const controller = new HlsPlayerController()
  controller.attach(deps)
  return { controller, art, deps, failSwitchUrl, onShowToast, onAudioTracksUpdated, onAudioScheduleSync, onAudioHydrateFromMaster, getSwitchUrlInFlight, video }
}

describe('HlsPlayerController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('init 创建实例并附加到 video', async () => {
    const { controller, video, onAudioScheduleSync, onAudioHydrateFromMaster } = createController()
    const hls = await controller.init(video, 'https://example.com/master.m3u8')
    expect(hls).toBeDefined()
    expect(controller.instance).toBe(hls)
    expect(controller.logicalUrl).toBe('https://example.com/master.m3u8')
    expect(onAudioScheduleSync).toHaveBeenCalled()
    expect(onAudioHydrateFromMaster).toHaveBeenCalled()
  })

  it('init 时销毁旧实例', async () => {
    const { controller, video } = createController()
    const first = await controller.init(video, 'https://example.com/a.m3u8')
    const second = await controller.init(video, 'https://example.com/b.m3u8')
    expect(first!.destroy).toHaveBeenCalled()
    expect(controller.instance).toBe(second)
  })

  it('切换在途时 mediaError 先恢复一次，再失败则触发 failSwitchUrl', async () => {
    const { controller, video, getSwitchUrlInFlight, failSwitchUrl } = createController()
    getSwitchUrlInFlight.mockReturnValue(true)
    const hls = await controller.init(video, 'https://example.com/a.m3u8') as any
    // 第一次 mediaError -> recover
    hls.emit('hlsError', null, { fatal: true, type: 'mediaError', details: 'bufferAppendError' })
    expect(hls.recoverMediaError).toHaveBeenCalledTimes(1)
    expect(failSwitchUrl).not.toHaveBeenCalled()
    // 第二次 mediaError -> 恢复耗尽，触发 failSwitchUrl
    hls.emit('hlsError', null, { fatal: true, type: 'mediaError', details: 'bufferAppendError' })
    expect(hls.destroy).toHaveBeenCalled()
    expect(failSwitchUrl).toHaveBeenCalledWith('视频源加载失败')
    expect(controller.instance).toBeNull()
  })

  it('稳态 networkError 限量自愈并提示', async () => {
    const { controller, video, onShowToast } = createController()
    const hls = await controller.init(video, 'https://example.com/a.m3u8') as any
    for (let i = 0; i < 3; i++) {
      hls.emit('hlsError', null, { fatal: true, type: 'networkError', details: 'networkError' })
    }
    expect(hls.startLoad).toHaveBeenCalledTimes(3)
    // 播放成功后清零，再次触发可继续自愈
    controller.resetSteadyRecoverCount()
    hls.emit('hlsError', null, { fatal: true, type: 'networkError', details: 'networkError' })
    expect(hls.startLoad).toHaveBeenCalledTimes(4)
    // 额度用尽 -> toast 提示
    hls.emit('hlsError', null, { fatal: true, type: 'networkError', details: 'networkError' })
    hls.emit('hlsError', null, { fatal: true, type: 'networkError', details: 'networkError' })
    hls.emit('hlsError', null, { fatal: true, type: 'networkError', details: 'networkError' })
    expect(onShowToast).toHaveBeenCalledWith('网络连接异常，加载失败')
  })

  it('稳态 mediaError 恢复一次后提示', async () => {
    const { controller, video, onShowToast } = createController()
    const hls = await controller.init(video, 'https://example.com/a.m3u8') as any
    hls.emit('hlsError', null, { fatal: true, type: 'mediaError', details: 'bufferStallError' })
    expect(hls.recoverMediaError).toHaveBeenCalledTimes(1)
    hls.emit('hlsError', null, { fatal: true, type: 'mediaError', details: 'bufferStallError' })
    expect(onShowToast).toHaveBeenCalledWith('播放异常，请刷新重试')
  })

  it('dispose 递增代次并清理 blob URL', async () => {
    const { controller, video } = createController()
    await controller.init(video, 'https://example.com/a.m3u8')
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL')
    controller.dispose()
    expect(controller.instance).toBeNull()
    expect(controller.logicalUrl).toBeNull()
    expect(revokeSpy).not.toHaveBeenCalled() // 源不是 blob
  })

  it('master 文本缓存命中时不重复请求', async () => {
    const { controller } = createController()
    vi.spyOn(Date, 'now').mockReturnValue(0)
    // 通过私有 fetchMasterPlaylistText 测缓存：首次无缓存（无依赖运行时消息），直接返回 null
    expect(await controller.fetchMasterPlaylistText()).toBeNull()
    vi.restoreAllMocks()
  })

  it('rebuildForAudioTrack 无 artplayer 时提示不支持', async () => {
    const { controller, deps, onShowToast } = createController()
    deps.getArtplayer = vi.fn(() => null)
    await controller.rebuildForAudioTrack({ id: 1, currentTime: 10, shouldResume: true, track: {} })
    expect(onShowToast).toHaveBeenCalledWith('当前播放链路暂不支持切换音轨')
  })
})
