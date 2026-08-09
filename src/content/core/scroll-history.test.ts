// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildListKey,
  extractListParams,
  restoreScrollPosition,
  saveScrollPosition,
} from './scroll-history'

const ORIGINAL_SEARCH = window.location.search

beforeEach(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { search: '' },
  })
})

afterEach(() => {
  sessionStorage.clear()
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { search: ORIGINAL_SEARCH },
  })
})

function setSearch(search: string) {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { search },
  })
}

function makeScrollableBox() {
  const box = document.createElement('div')
  return box
}

describe('extractListParams', () => {
  it('parses cid, offset and tpl from search', () => {
    setSearch('?cid=123&offset=24&tpl=view_large')
    const doc = { defaultView: window } as unknown as Document
    expect(extractListParams(doc)).toEqual({ cid: '123', offset: '24', tpl: 'view_large' })
  })

  it('falls back to defaults when params missing', () => {
    setSearch('')
    const doc = { defaultView: window } as unknown as Document
    expect(extractListParams(doc)).toEqual({ cid: '0', offset: '0', tpl: '' })
  })
})

describe('buildListKey', () => {
  it('is stable regardless of list content', () => {
    setSearch('?cid=5&offset=0&tpl=view_large')
    const doc = { defaultView: window } as unknown as Document
    expect(buildListKey(doc)).toBe('5_0_view_large')
  })

  it('differs when cid changes', () => {
    const doc = { defaultView: window } as unknown as Document
    setSearch('?cid=1&offset=0&tpl=view_large')
    const keyA = buildListKey(doc)
    setSearch('?cid=2&offset=0&tpl=view_large')
    const keyB = buildListKey(doc)
    expect(keyA).not.toBe(keyB)
  })

  it('differs when offset changes', () => {
    const doc = { defaultView: window } as unknown as Document
    setSearch('?cid=1&offset=0&tpl=view_large')
    const keyA = buildListKey(doc)
    setSearch('?cid=1&offset=24&tpl=view_large')
    const keyB = buildListKey(doc)
    expect(keyA).not.toBe(keyB)
  })

  it('differs when view tpl changes', () => {
    const doc = { defaultView: window } as unknown as Document
    setSearch('?cid=1&offset=0&tpl=view_large')
    const keyA = buildListKey(doc)
    setSearch('?cid=1&offset=0&tpl=view_list')
    const keyB = buildListKey(doc)
    expect(keyA).not.toBe(keyB)
  })
})

describe('saveScrollPosition / restoreScrollPosition', () => {
  it('round-trips a saved position', () => {
    saveScrollPosition('k', 300)
    const box = makeScrollableBox()
    const restored = restoreScrollPosition('k', box)
    expect(restored).toBe(true)
    expect(box.scrollTop).toBe(300)
  })

  it('ignores saving zero or negative positions', () => {
    saveScrollPosition('k', 0)
    saveScrollPosition('k', -5)
    expect(sessionStorage.getItem('m115_scroll_history')).toBeNull()
  })

  it('does not restore when no record exists', () => {
    const box = makeScrollableBox()
    const restored = restoreScrollPosition('missing_key', box)
    expect(restored).toBe(false)
    expect(box.scrollTop).toBe(0)
  })

  it('caps the store size at 200 entries', () => {
    for (let i = 0; i < 220; i++) {
      saveScrollPosition(`k_x${i}`, 100)
    }
    const store = JSON.parse(sessionStorage.getItem('m115_scroll_history') ?? '{}')
    expect(Object.keys(store).length).toBeLessThanOrEqual(200)
  })
})
