import { describe, expect, it } from 'vitest'
import { parseM3u8Text } from './m3u8-parser'

describe('parseM3u8Text', () => {
  it('parses variants with absolute URLs', () => {
    const text = [
      '#EXTM3U',
      '#EXT-X-STREAM-INF:BANDWIDTH=5000000,NAME="UD"',
      'https://cdn.115cdn.net/v/1080p.m3u8',
      '#EXT-X-STREAM-INF:BANDWIDTH=3000000,NAME="HD"',
      'https://cdn.115cdn.net/v/720p.m3u8',
    ].join('\n')

    const list = parseM3u8Text(text)
    expect(list.length).toBe(2)
    expect(list[0].quality).toBe(1080)
    expect(list[0].url).toBe('https://cdn.115cdn.net/v/1080p.m3u8')
  })

  it('resolves protocol-relative URLs (//host) without double slashes', () => {
    const text = [
      '#EXTM3U',
      '#EXT-X-STREAM-INF:BANDWIDTH=5000000,NAME="UD"',
      '//cdn.115cdn.net/v/1080p.m3u8',
    ].join('\n')

    const list = parseM3u8Text(text)
    expect(list.length).toBe(1)
    expect(list[0].url).toBe('https://cdn.115cdn.net/v/1080p.m3u8')
    expect(list[0].url).not.toContain('115.com//cdn')
  })

  it('resolves relative paths against the 115 base', () => {
    const text = [
      '#EXTM3U',
      '#EXT-X-STREAM-INF:BANDWIDTH=3000000,NAME="HD"',
      '/api/video/720p.m3u8',
    ].join('\n')

    const list = parseM3u8Text(text)
    expect(list.length).toBe(1)
    expect(list[0].url).toBe('https://115.com/api/video/720p.m3u8')
  })

  it('sorts by quality descending', () => {
    const text = [
      '#EXTM3U',
      '#EXT-X-STREAM-INF:BANDWIDTH=3000000,NAME="HD"',
      'https://cdn.115cdn.net/v/720p.m3u8',
      '#EXT-X-STREAM-INF:BANDWIDTH=5000000,NAME="UD"',
      'https://cdn.115cdn.net/v/1080p.m3u8',
      '#EXT-X-STREAM-INF:BANDWIDTH=8000000,NAME="BD"',
      'https://cdn.115cdn.net/v/4k.m3u8',
    ].join('\n')

    const list = parseM3u8Text(text)
    expect(list.map(item => item.quality)).toEqual([2160, 1080, 720])
  })

  it('returns empty list for text without variants', () => {
    expect(parseM3u8Text('#EXTM3U\n#EXT-X-ENDLIST')).toEqual([])
  })
})
