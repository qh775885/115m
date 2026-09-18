import { describe, expect, it } from 'vitest'
import { buildPlaybackNavState, getDeleteFallback, getPlaylistPosition } from './playlist-navigation'

const items = [
  { pickCode: 'a', fileId: '1', name: '第一集' },
  { pickCode: 'b', fileId: '2', name: '第二集' },
  { pickCode: 'c', fileId: '3', name: '第三集' },
]

describe('playlist navigation helpers', () => {
  it('returns previous and next items around current pick code', () => {
    const position = getPlaylistPosition(items, 'b')
    expect(position.totalCount).toBe(3)
    expect(position.index).toBe(1)
    expect(position.previous?.pickCode).toBe('a')
    expect(position.current?.pickCode).toBe('b')
    expect(position.next?.pickCode).toBe('c')
  })

  it('builds overlay nav state from position', () => {
    expect(buildPlaybackNavState(getPlaylistPosition(items, 'a'))).toEqual({
      hasPrevious: false,
      hasNext: true,
      previousTitle: undefined,
      nextTitle: '第二集',
      currentIndex: 1,
      totalCount: 3,
    })
  })

  it('prefers next item after delete, then previous', () => {
    expect(getDeleteFallback(items, 'b')).toEqual({ nextPickCode: 'c' })
    expect(getDeleteFallback(items, 'c')).toEqual({ nextPickCode: 'b' })
    expect(getDeleteFallback([{ pickCode: 'a', fileId: '1', name: '第一集' }], 'a')).toEqual({ nextPickCode: null })
  })
})
