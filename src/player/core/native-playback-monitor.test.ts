// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NativePlaybackMonitor } from './native-playback-monitor'
import type { NativePlaybackDeps } from './native-playback-monitor'

function createVideo() {
  const video = document.createElement('video') as HTMLVideoElement & {
    webkitAudioDecodedByteCount?: number
    getVideoPlaybackQuality?: () => { totalVideoFrames: number }
  }
  const state: Record<string, unknown> = {
    __paused: false,
    __ended: false,
    __seeking: false,
    __currentTime: 5,
    __readyState: 4,
    __videoWidth: 1280,
    __videoHeight: 720,
    __buffered: { length: 0, start: () => 0, end: () => 0 } as unknown as TimeRanges,
  }
  Object.defineProperty(video, 'paused', { configurable: true, get: () => state.__paused })
  Object.defineProperty(video, 'ended', { configurable: true, get: () => state.__ended })
  Object.defineProperty(video, 'seeking', { configurable: true, get: () => state.__seeking })
  Object.defineProperty(video, 'currentTime', { configurable: true, get: () => state.__currentTime, set: v => { state.__currentTime = v } })
  Object.defineProperty(video, 'readyState', { configurable: true, get: () => state.__readyState })
  Object.defineProperty(video, 'videoWidth', { configurable: true, get: () => state.__videoWidth })
  Object.defineProperty(video, 'videoHeight', { configurable: true, get: () => state.__videoHeight })
  Object.defineProperty(video, 'buffered', { configurable: true, get: () => state.__buffered })
  return { video, state }
}

function createMonitor() {
  const { video, state } = createVideo()
  const art = {
    video,
    on: vi.fn(),
    once: vi.fn(),
    off: vi.fn(),
    seek: 0,
    currentTime: 5,
    url: '',
    play: vi.fn().mockResolvedValue(undefined),
    switchUrl: vi.fn(),
  }
  const deps: NativePlaybackDeps = {
    art: art as never,
    getIsNativeVideo: () => true,
    getCurrentPlaybackType: () => 'native',
    getUltraUrl: () => null,
    getTitle: () => 'video.mp4',
    getNativeUltraConservative: () => true,
    getPerfMarksPlaying: () => Date.now(),
    onFallbackToHls: vi.fn().mockResolvedValue(undefined),
    onRetry: vi.fn(),
    onShowToast: vi.fn(),
    fetchMasterPlaylistText: vi.fn().mockResolvedValue('#EXTM3U\n#EXT-X-MEDIA:TYPE=AUDIO'),
  }
  const monitor = new NativePlaybackMonitor()
  monitor.attach(deps)
  return { monitor, art, deps, video, state }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('NativePlaybackMonitor 暂停停止探测', () => {
  it('onPause 清理音视频探测与卡顿定时器', () => {
    const { monitor, state } = createMonitor()
    state.__paused = true
    monitor.onPause()
    // 触发已清理的定时器路径后不应再自我排程
    vi.advanceTimersByTime(20_000)
    expect(monitor as any).toBeDefined()
  })

  it('checkAudioDecode 在暂停时不重新排程探测', async () => {
    const { monitor, state } = createMonitor()
    state.__paused = true
    state.__currentTime = 10
    await (monitor as any).checkAudioDecode()
    // 若未重新排程，则 audioProbeTimer 保持 null
    expect((monitor as any).audioProbeTimer).toBeNull()
  })

  it('checkVideoDecode 在暂停时不重新排程探测', async () => {
    const { monitor, state } = createMonitor()
    state.__paused = true
    state.__currentTime = 10
    await (monitor as any).checkVideoDecode()
    expect((monitor as any).videoProbeTimer).toBeNull()
  })

  it('checkVideoDecode 在播放中继续观察（未暂停会重排）', async () => {
    const { monitor, state, deps } = createMonitor()
    state.__paused = false
    state.__currentTime = 0.5
    state.__videoWidth = 0
    state.__videoHeight = 0
    state.__readyState = 3
    const video = (monitor as any).art.video
    video.getVideoPlaybackQuality = () => ({ totalVideoFrames: 0 })
    vi.spyOn(deps, 'onFallbackToHls').mockResolvedValue(undefined)
    await (monitor as any).checkVideoDecode()
    // 片头阶段 (<3s) 且未暂停 → 继续排程观察
    expect((monitor as any).videoProbeTimer).not.toBeNull()
    // 清理定时器避免测试挂起
    ;(monitor as any).clearVideoProbe()
  })
})
