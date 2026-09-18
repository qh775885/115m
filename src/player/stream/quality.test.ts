import { describe, expect, it } from 'vitest'
import { ORIGINAL_PLACEHOLDER_URL, buildArtplayerQuality, buildQualityOptions, getQualityDisplayName } from './quality'

describe('quality helpers', () => {
  it('prefers lossless then original placeholder when m3u8 is not loaded yet', () => {
    const options = buildQualityOptions('https://lossless.example/video.mp4', 'https://lossless.example/video.mp4', [], 9999, '无损')

    expect(options).toEqual([
      { label: '无损', quality: 9999, url: 'https://lossless.example/video.mp4' },
      { label: '115原画', quality: 9999, url: ORIGINAL_PLACEHOLDER_URL },
    ])
  })

  it('deduplicates identical original url and keeps lossless first', () => {
    const options = buildQualityOptions(
      'https://lossless.example/video.mp4',
      'https://lossless.example/video.mp4',
      [{ name: 'YH', quality: 9999, url: 'https://lossless.example/video.mp4' }],
      9999,
      '无损',
    )

    expect(options).toEqual([
      { label: '无损', quality: 9999, url: 'https://lossless.example/video.mp4' },
    ])
  })

  it('marks placeholder quality as selected by label', () => {
    const quality = buildArtplayerQuality([
      { label: '无损', quality: 9999, url: 'https://lossless.example/video.mp4' },
      { label: '115原画', quality: 9999, url: ORIGINAL_PLACEHOLDER_URL },
    ], 'https://lossless.example/video.mp4', '115原画')

    expect(quality[0]?.default).toBe(false)
    expect(quality[1]?.default).toBe(true)
  })

  it('maps display labels for source types', () => {
    expect(getQualityDisplayName(9999, false)).toBe('无损')
    expect(getQualityDisplayName(9999, true)).toBe('115原画')
    expect(getQualityDisplayName(1080, true)).toBe('1080P')
  })

  it('does not expose lossless option when native ultra is disabled', () => {
    const options = buildQualityOptions(
      '',
      null,
      [{ name: 'YH', quality: 9999, url: 'https://origin.example/master.m3u8' }],
      9999,
      '115原画',
    )

    expect(options).toEqual([
      { label: '115原画', quality: 9999, url: 'https://origin.example/master.m3u8' },
    ])
  })
})
