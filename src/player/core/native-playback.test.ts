import { describe, expect, it } from 'vitest'
import { canUseNativeUltraSource, shouldFallbackNativeBlackVideo, shouldFallbackNativeDroppedFrames, shouldFallbackNativeSilentAudio, shouldRetryNativePlayback } from './native-playback'

const HAVE_CURRENT_DATA = 2
const HAVE_FUTURE_DATA = 3

describe('shouldRetryNativePlayback', () => {
  it('allows one retry before first successful playing', () => {
    expect(shouldRetryNativePlayback({ retryCount: 0, hasStartedPlaying: false })).toBe(true)
    expect(shouldRetryNativePlayback({ retryCount: 1, hasStartedPlaying: false })).toBe(false)
  })

  it('does not auto retry once native playback already started', () => {
    expect(shouldRetryNativePlayback({ retryCount: 0, hasStartedPlaying: true })).toBe(false)
  })

  it('allows native ultra for conservative browser-playable containers only', () => {
    expect(canUseNativeUltraSource('video.mp4', 'https://example.com/file.mp4')).toBe(true)
    expect(canUseNativeUltraSource('video.webm', 'https://example.com/file.webm')).toBe(true)
    expect(canUseNativeUltraSource('video.mkv', 'https://example.com/file.mkv')).toBe(false)
    expect(canUseNativeUltraSource('video.ts', 'https://example.com/file.ts')).toBe(false)
  })

  it('falls back silent native audio for stable containers and manually selected mkv', () => {
    expect(shouldFallbackNativeSilentAudio({ title: 'video.mp4', ultraUrl: null, nativeUltraConservative: true })).toBe(true)
    expect(shouldFallbackNativeSilentAudio({ title: 'video.mkv', ultraUrl: 'https://example.com/file.mkv', nativeUltraConservative: false })).toBe(true)
    expect(shouldFallbackNativeSilentAudio({ title: 'video.mov', ultraUrl: 'https://example.com/file.mov', nativeUltraConservative: false })).toBe(false)
  })

  it('falls back native playback when audio advances but no video frame is decoded', () => {
    expect(shouldFallbackNativeBlackVideo({
      currentTime: 4,
      readyState: HAVE_FUTURE_DATA,
      videoWidth: 0,
      videoHeight: 0,
      totalVideoFrames: 0,
    })).toBe(true)
  })

  it('keeps native playback before enough evidence or when video frames are decoded', () => {
    expect(shouldFallbackNativeBlackVideo({
      currentTime: 1,
      readyState: HAVE_FUTURE_DATA,
      videoWidth: 0,
      videoHeight: 0,
      totalVideoFrames: 0,
    })).toBe(false)
    expect(shouldFallbackNativeBlackVideo({
      currentTime: 4,
      readyState: HAVE_CURRENT_DATA,
      videoWidth: 0,
      videoHeight: 0,
      totalVideoFrames: 0,
    })).toBe(false)
    expect(shouldFallbackNativeBlackVideo({
      currentTime: 4,
      readyState: HAVE_FUTURE_DATA,
      videoWidth: 1920,
      videoHeight: 1080,
      totalVideoFrames: 120,
    })).toBe(false)
  })
})

describe('shouldFallbackNativeDroppedFrames', () => {
  it('triggers fallback when drop rate exceeds 15% after enough frames', () => {
    // 120 total, 20 dropped = 16.7% → fallback
    expect(shouldFallbackNativeDroppedFrames({
      currentTime: 3,
      totalVideoFrames: 120,
      droppedVideoFrames: 20,
    })).toBe(true)
  })

  it('does not trigger fallback when drop rate is within threshold', () => {
    // 120 total, 10 dropped = 8.3% → ok
    expect(shouldFallbackNativeDroppedFrames({
      currentTime: 3,
      totalVideoFrames: 120,
      droppedVideoFrames: 10,
    })).toBe(false)
  })

  it('does not trigger fallback too early (currentTime < 2)', () => {
    expect(shouldFallbackNativeDroppedFrames({
      currentTime: 1,
      totalVideoFrames: 120,
      droppedVideoFrames: 60,
    })).toBe(false)
  })

  it('does not trigger fallback with too few frames', () => {
    expect(shouldFallbackNativeDroppedFrames({
      currentTime: 3,
      totalVideoFrames: 30,
      droppedVideoFrames: 15,
    })).toBe(false)
  })
})
