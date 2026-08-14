import { describe, expect, it, vi } from 'vitest'

vi.mock('../../lib/videoThumbnail', () => ({
  getVideoCovers: vi.fn(),
}))

import { buildPlaylistHtml, formatPlaylistSeconds } from './overlay-playlist'

describe('overlay playlist helpers', () => {
  it('formats seconds to mm:ss', () => {
    expect(formatPlaylistSeconds(125)).toBe('2:05')
  })

  it('formats seconds to hh:mm:ss when needed', () => {
    expect(formatPlaylistSeconds(3723)).toBe('1:02:03')
  })

  it('builds playlist html with active item', () => {
    const html = buildPlaylistHtml([
      { pickCode: 'pc1', fileId: '1', name: 'Test', size: '1 MB' },
    ], 'pc1')

    expect(html).toContain('data-pickcode="pc1"')
    expect(html).toContain('Test')
    expect(html).toContain('1 MB')
    expect(html).toContain('background:rgba(255,255,255,.12)')
    expect(html).toContain('data-action="move"')
    expect(html).toContain('data-action="delete"')
  })
})
