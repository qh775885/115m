// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleFetchPlaylist } from './media-info'

const mockPlaylist = {
  state: true,
  data: [{ pick_code: 'pc1', name: 'A' }, { pick_code: 'pc2', name: 'B' }],
  path: [{ cid: 'C1', name: '根目录' }],
}

vi.mock('../platform/115/main-world', () => ({
  query115Tabs: vi.fn(async () => [{ id: 7 }]),
}))

vi.mock('../platform/115/file-actions', () => ({
  fetchVideoInfoByPickCode: vi.fn(async () => ({ state: true, parent_id: 'C9' })),
  fetchPlaylistIn115Page: vi.fn(),
}))

import { fetchPlaylistIn115Page } from '../platform/115/file-actions'
import { query115Tabs } from '../platform/115/main-world'

describe('handleFetchPlaylist 缓存', () => {
  beforeEach(() => {
    vi.mocked(fetchPlaylistIn115Page).mockReset()
    vi.mocked(fetchPlaylistIn115Page).mockResolvedValue(mockPlaylist as never)
    vi.mocked(query115Tabs).mockReset()
    vi.mocked(query115Tabs).mockResolvedValue([{ id: 7 }] as never)
  })

  it('相同 cid 在 TTL 内复用缓存，不重复请求', async () => {
    const message = { type: 'FETCH_PLAYLIST', data: { cid: 'C1' } } as never

    const first = await handleFetchPlaylist(message)
    expect(first.list).toHaveLength(2)
    expect(fetchPlaylistIn115Page).toHaveBeenCalledTimes(1)

    const second = await handleFetchPlaylist(message)
    expect(second.list).toHaveLength(2)
    expect(fetchPlaylistIn115Page).toHaveBeenCalledTimes(1)
  })

  it('无 cid 时通过 pickCode 推导 cid 并缓存', async () => {
    const message = { type: 'FETCH_PLAYLIST', data: { pickCode: 'pc1' } } as never

    const first = await handleFetchPlaylist(message)
    expect(first.list).toHaveLength(2)
    expect(fetchPlaylistIn115Page).toHaveBeenCalledTimes(1)

    await handleFetchPlaylist({ type: 'FETCH_PLAYLIST', data: { cid: 'C9' } } as never)
    expect(fetchPlaylistIn115Page).toHaveBeenCalledTimes(1)
  })
})
