import { describe, expect, it } from 'vitest'
import { filterTabsInWindow } from './file-operations'

describe('filterTabsInWindow', () => {
  const tabs = [
    { id: 1, windowId: 10 },
    { id: 2, windowId: 10 },
    { id: 3, windowId: 20 },
  ] as chrome.tabs.Tab[]

  it('filters tabs to the given window', () => {
    const filtered = filterTabsInWindow(tabs, 10)
    expect(filtered.map(t => t.id)).toEqual([1, 2])
  })

  it('returns all tabs when windowId is missing', () => {
    expect(filterTabsInWindow(tabs, undefined)).toHaveLength(3)
    expect(filterTabsInWindow(tabs)).toHaveLength(3)
  })
})
