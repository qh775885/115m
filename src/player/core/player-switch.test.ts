import { describe, expect, it } from 'vitest'
import { buildOverlayMetaPatch, buildPlayerHistoryUrl } from './player-switch'

describe('buildOverlayMetaPatch', () => {
  it('patch 携带 cid', () => {
    const patch = buildOverlayMetaPatch({ pickCode: 'P1', fileId: 'F1', name: 'v.mp4', cid: 'C9' })
    expect(patch?.cid).toBe('C9')
    expect(patch?.title).toBe('v.mp4')
    expect(patch?.fileId).toBe('F1')
  })

  it('无目标项返回 null', () => {
    expect(buildOverlayMetaPatch()).toBeNull()
  })
})

describe('buildPlayerHistoryUrl', () => {
  it('URL 携带目标项 cid 并覆盖旧 cid', () => {
    const url = buildPlayerHistoryUrl({
      pathname: '/web/lixian/master/video/',
      search: '?pickCode=OLD&cid=OLD_CID',
      pickCode: 'P1',
      targetItem: { pickCode: 'P1', fileId: 'F1', name: 'v.mp4', cid: 'C9' },
      keepPlaylistOpen: false,
    })
    expect(url).toContain('cid=C9')
    expect(url).not.toContain('cid=OLD_CID')
    expect(url).toContain('pickCode=P1')
  })

  it('目标项无 cid 时保留原 cid', () => {
    const url = buildPlayerHistoryUrl({
      pathname: '/web/lixian/master/video/',
      search: '?pickCode=OLD&cid=OLD_CID',
      pickCode: 'P1',
      targetItem: { pickCode: 'P1', fileId: 'F1', name: 'v.mp4' },
      keepPlaylistOpen: false,
    })
    expect(url).toContain('cid=OLD_CID')
  })
})
