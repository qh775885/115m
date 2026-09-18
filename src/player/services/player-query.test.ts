import { describe, expect, it } from 'vitest'
import {
  buildNavigateToVideoUrl,
  buildUpdatedMarkedUrl,
  readOverlayMetaQuery,
  readPathFromLocation,
  readPlayerBootstrapConfig,
  readPlaylistCidFromLocation,
} from './player-query'

describe('player query helpers', () => {
  it('reads bootstrap config from location search', () => {
    expect(readPlayerBootstrapConfig('?pickCode=abc&traceId=t1&clickTs=123')).toEqual({
      pickCode: 'abc',
      traceId: 't1',
      clickTs: 123,
      keepPlaylistOpen: false,
      playlistToken: undefined,
    })

    expect(readPlayerBootstrapConfig('?pickCode=abc&playlistOpen=1&playlistToken=p1')).toEqual({
      pickCode: 'abc',
      keepPlaylistOpen: true,
      playlistToken: 'p1',
    })
  })

  it('reads cid and sanitized path from location search', () => {
    expect(readPlaylistCidFromLocation('?cid=88')).toBe('88')
    expect(readPathFromLocation(`?path=${encodeURIComponent(JSON.stringify([{ cid: '1', name: '目录' }, { cid: '', name: 'bad' }]))}`)).toEqual([
      { cid: '1', name: '目录' },
    ])
  })

  it('builds stable navigation urls', () => {
    expect(buildNavigateToVideoUrl('/player', '?cid=88', 'next123', { title: '下一集' })).toBe('/player?cid=88&pick_code=next123&pickCode=next123&title=%E4%B8%8B%E4%B8%80%E9%9B%86')
    expect(buildNavigateToVideoUrl('/player', '?cid=88', 'next123', {
      title: '下一集',
      fileId: 'f1',
      fileSize: '1 GB',
      isMarked: true,
      keepPlaylistOpen: true,
    })).toBe('/player?cid=88&pick_code=next123&pickCode=next123&title=%E4%B8%8B%E4%B8%80%E9%9B%86&fileId=f1&fileSize=1+GB&marked=1&playlistOpen=1')
    expect(buildUpdatedMarkedUrl('/player', '?pickCode=abc', true)).toBe('/player?pickCode=abc&marked=1')
  })

  it('reads overlay meta from location search', () => {
    expect(readOverlayMetaQuery('?title=视频A&fileSize=1GB&fileId=9&cid=3&marked=1')).toEqual({
      title: '视频A',
      fileSize: '1GB',
      fileId: '9',
      cid: '3',
      parentId: '3',
      isMarked: false,
      path: [],
    })
  })
})
