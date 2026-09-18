import { describe, expect, it } from 'vitest'
import { formatFps, formatResolution, VideoStatsTracker } from './video-stats'

describe('video-stats', () => {
  it('formats resolution and tags accurately', () => {
    expect(formatResolution(3840, 2160)).toEqual({ label: '3840 × 2160', tag: '4K' })
    expect(formatResolution(2560, 1440)).toEqual({ label: '2560 × 1440', tag: '2K' })
    expect(formatResolution(1920, 1080)).toEqual({ label: '1920 × 1080', tag: '1080P' })
    expect(formatResolution(1280, 720)).toEqual({ label: '1280 × 720', tag: '720P' })
    expect(formatResolution(854, 480)).toEqual({ label: '854 × 480', tag: '480P' })
    expect(formatResolution(0, 0)).toEqual({ label: '未知', tag: '' })
  })

  it('formats fps with standard broadcast roundings', () => {
    expect(formatFps(23.978)).toBe('23.976 fps')
    expect(formatFps(59.93)).toBe('59.94 fps')
    expect(formatFps(60.05)).toBe('60 fps')
    expect(formatFps(0)).toBe('--')
    expect(formatFps(42.34)).toBe('42.3 fps')
  })

  it('tracks stats from video element safely', () => {
    const tracker = new VideoStatsTracker()
    expect(tracker.getStats().resolution).toBe('未知')

    const fakeVideo = {
      videoWidth: 1920,
      videoHeight: 1080,
      getVideoPlaybackQuality: () => ({
        totalVideoFrames: 100,
        droppedVideoFrames: 2,
      }),
    } as unknown as HTMLVideoElement

    tracker.attach(fakeVideo)
    const stats = tracker.getStats()
    expect(stats.resolution).toBe('1920 × 1080')
    expect(stats.tag).toBe('1080P')
    expect(stats.droppedFrames).toBe(2)
    expect(stats.dropRateText).toBe('2.0%')

    tracker.destroy()
  })
})
