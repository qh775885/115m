import { describe, expect, it, vi } from 'vitest'
import { fetchFavoriteStatus, fetchPlaylistResponse, updateFavoriteStatus } from './player-api'

describe('player api helpers', () => {
  it('delegates playlist request to runtime message', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ list: [], path: [] })
    const result = await fetchPlaylistResponse(sendMessage, '1', 'pc1')

    expect(sendMessage).toHaveBeenCalledWith({
      type: 'FETCH_PLAYLIST',
      data: { cid: '1', pickCode: 'pc1' },
    })
    expect(result).toEqual({ list: [], path: [] })
  })

  it('parses favorite status from runtime response', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ ok: true, text: JSON.stringify({ is_mark: '1' }) })
    await expect(fetchFavoriteStatus(sendMessage, 'pc1')).resolves.toBe(true)
  })

  it('returns updated favorite state only on successful response', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ ok: true, text: JSON.stringify({ state: true }) })
    await expect(updateFavoriteStatus(sendMessage, 'fid1', true)).resolves.toBe(true)
  })
})
