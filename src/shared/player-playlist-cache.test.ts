import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readTemporaryPlayerPlaylist, saveTemporaryPlayerPlaylist } from './player-playlist-cache'

function createMemoryStorage(): Storage {
  const store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    key(index: number) {
      return [...store.keys()][index] || null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
  }
}

describe('player playlist cache', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    })
  })

  it('saves and restores normalized temporary playlists', () => {
    const token = saveTemporaryPlayerPlaylist([
      { pickCode: 'a', fileId: '1', name: 'A', size: '1 MB', isMarked: true, duration: 10 },
      { pickCode: 'a', fileId: '1', name: 'A-dup' },
      { pickCode: 'b', fileId: '', name: 'B' },
    ])

    expect(token).toBeTruthy()
    expect(readTemporaryPlayerPlaylist(token)).toEqual([
      { pickCode: 'a', fileId: '1', name: 'A', size: '1 MB', isMarked: true, duration: 10 },
      { pickCode: 'b', fileId: '', name: 'B', size: '', isMarked: false, duration: 0 },
    ])
  })

  it('returns empty array for unknown tokens', () => {
    expect(readTemporaryPlayerPlaylist('missing')).toEqual([])
  })

  it('does not write back to storage when nothing is pruned on read', () => {
    const token = saveTemporaryPlayerPlaylist([
      { pickCode: 'a', fileId: '1', name: 'A' },
    ])
    const setItemSpy = vi.spyOn(globalThis.localStorage, 'setItem')

    readTemporaryPlayerPlaylist(token)
    readTemporaryPlayerPlaylist(token)

    // 读操作不应触发无意义的写回（除非清除了过期/空条目）
    expect(setItemSpy).not.toHaveBeenCalled()
  })

  it('prunes expired entries and writes back only when needed', () => {
    const token = saveTemporaryPlayerPlaylist([
      { pickCode: 'a', fileId: '1', name: 'A' },
    ])

    // 注入一条已过期的条目
    const raw = JSON.parse(localStorage.getItem('m115-player-playlist-cache')!)
    raw.expired = { createdAt: Date.now() - 31 * 60 * 1000, items: [{ pickCode: 'x', fileId: '', name: 'X' }] }
    localStorage.setItem('m115-player-playlist-cache', JSON.stringify(raw))

    const setItemSpy = vi.spyOn(globalThis.localStorage, 'setItem')
    readTemporaryPlayerPlaylist(token)

    // 存在过期条目 → 读时清理并写回
    expect(setItemSpy).toHaveBeenCalledTimes(1)
    const updated = JSON.parse(localStorage.getItem('m115-player-playlist-cache')!)
    expect(updated.expired).toBeUndefined()
  })
})
