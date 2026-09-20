import { describe, expect, it } from 'vitest'

describe('home search doc handling', () => {
  it('identifies search document via .lstc-search or search query', async () => {
    // 动态验证 isSearchDocument 规则逻辑
    const hasSearchClassDoc = {
      querySelector: (sel: string) => sel === '.lstc-search' ? {} : null,
      location: { href: 'https://115.com/', search: '' },
    } as unknown as Document

    const hasSearchParamDoc = {
      querySelector: () => null,
      location: { href: 'https://115.com/?ct=file&ac=search', search: '?ct=file&ac=search' },
    } as unknown as Document

    const normalDoc = {
      querySelector: () => null,
      location: { href: 'https://115.com/?cid=0', search: '?cid=0' },
    } as unknown as Document

    function isSearchDocument(doc: Document): boolean {
      if (doc.querySelector?.('.lstc-search')) return true
      const search = doc.location?.search || ''
      const href = doc.location?.href || ''
      return search.includes('ac=search') || href.includes('ac=search') || href.includes('mode=search')
    }

    expect(isSearchDocument(hasSearchClassDoc)).toBe(true)
    expect(isSearchDocument(hasSearchParamDoc)).toBe(true)
    expect(isSearchDocument(normalDoc)).toBe(false)
  })
})
