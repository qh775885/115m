import { describe, expect, it } from 'vitest'
import { normalizePlaylistItems } from './playlist'

describe('normalizePlaylistItems', () => {
  it('maps raw playlist items into overlay items', () => {
    expect(normalizePlaylistItems([
      {
        fid: '1',
        fc: 0,
        fn: '视频A',
        fl: 0,
        fp: '',
        fs: 2048,
        fm: '',
        ic: '',
        pick_code: 'pc1',
        s: 2048,
        m: 1,
        play_long: 100,
        sha: 'sha1',
      },
    ])).toEqual([
      {
        pickCode: 'pc1',
        fileId: '1',
        name: '视频A',
        size: '2.00 KB',
        isMarked: true,
        duration: 100,
        sha: 'sha1',
        cid: '',
      },
    ])
  })
})
