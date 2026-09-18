import { describe, expect, it } from 'vitest'
import { resolveInitialPlayback } from './startup'

describe('resolveInitialPlayback', () => {
  it('prefers remembered native source when available', () => {
    expect(resolveInitialPlayback({
      qualityPreference: { label: '无损', quality: 9999 },
      ultraUrl: 'https://lossless.example/video.mp4',
      canUseNativeUltraSource: true,
      m3u8List: [],
    })).toEqual({
      url: 'https://lossless.example/video.mp4',
      type: 'native',
      currentQuality: 9999,
      currentQualityLabel: '无损',
      isNativeVideo: true,
    })
  })

  it('falls back to remembered hls quality when native is unavailable', () => {
    expect(resolveInitialPlayback({
      qualityPreference: { label: '115原画', quality: 9999 },
      ultraUrl: null,
      canUseNativeUltraSource: false,
      m3u8List: [
        { name: 'YH', quality: 9999, url: 'https://origin.example/master.m3u8' },
      ],
    })).toEqual({
      url: 'https://origin.example/master.m3u8',
      type: 'hls',
      currentQuality: 9999,
      currentQualityLabel: '115原画',
      isNativeVideo: false,
    })
  })

  it('uses best available source when there is no remembered preference', () => {
    expect(resolveInitialPlayback({
      qualityPreference: null,
      ultraUrl: null,
      canUseNativeUltraSource: false,
      m3u8List: [
        { name: 'UD', quality: 1080, url: 'https://origin.example/1080.m3u8' },
      ],
    })).toEqual({
      url: 'https://origin.example/1080.m3u8',
      type: 'hls',
      currentQuality: 1080,
      currentQualityLabel: '1080P',
      isNativeVideo: false,
    })
  })

  it('respects remembered native source even for manually selected unsupported containers', () => {
    expect(resolveInitialPlayback({
      qualityPreference: { label: '无损', quality: 9999 },
      ultraUrl: 'https://lossless.example/video.mkv',
      canUseNativeUltraSource: false,
      m3u8List: [
        { name: 'YH', quality: 9999, url: 'https://origin.example/master.m3u8' },
      ],
    })).toEqual({
      url: 'https://lossless.example/video.mkv',
      type: 'native',
      currentQuality: 9999,
      currentQualityLabel: '无损',
      isNativeVideo: true,
    })
  })
})
