import { describe, expect, it } from 'vitest'
import { findVariantInMaster, normalizePlaylistUrl } from './playlist-url'

describe('normalizePlaylistUrl', () => {
  it('keeps hostname and pathname, drops query and hash', () => {
    expect(normalizePlaylistUrl('https://115cdn.net/a/b/1080p.m3u8?sign=abc&expire=123')).toBe('115cdn.net/a/b/1080p.m3u8')
    expect(normalizePlaylistUrl('https://115cdn.net/a/b/1080p.m3u8#frag')).toBe('115cdn.net/a/b/1080p.m3u8')
  })

  it('resolves relative URLs against the 115 base', () => {
    expect(normalizePlaylistUrl('/api/video/1080p.m3u8')).toBe('115.com/api/video/1080p.m3u8')
  })

  it('resolves empty URL to the base root', () => {
    expect(normalizePlaylistUrl('')).toBe('115.com/')
  })
})

describe('findVariantInMaster', () => {
  const master = [
    '#EXTM3U',
    '#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="中文",DEFAULT=YES',
    '#EXT-X-STREAM-INF:BANDWIDTH=5000000,NAME="1080P",AUDIO="audio"',
    'https://cdn.115cdn.net/v/1080p.m3u8?sign=a',
    '#EXT-X-STREAM-INF:BANDWIDTH=3000000,NAME="720P",AUDIO="audio"',
    'https://cdn.115cdn.net/v/720p.m3u8?sign=b',
  ].join('\n')

  it('matches a variant by normalized URL ignoring query signatures', () => {
    const result = findVariantInMaster(master, 'https://cdn.115cdn.net/v/1080p.m3u8?sign=changed')
    expect(result.streamInf).toContain('1080P')
    expect(result.matchedUrl).toBe('https://cdn.115cdn.net/v/1080p.m3u8?sign=a')
  })

  it('returns empty when no variant matches', () => {
    const result = findVariantInMaster(master, 'https://cdn.115cdn.net/v/480p.m3u8')
    expect(result.streamInf).toBe('')
    expect(result.matchedUrl).toBe('')
  })

  it('ignores comment lines while scanning', () => {
    const result = findVariantInMaster(master, 'https://cdn.115cdn.net/v/720p.m3u8')
    expect(result.streamInf).toContain('720P')
  })
})
