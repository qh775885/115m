import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Drive115, shouldOpenVerificationTab, VERIFICATION_TAB_COOLDOWN_MS } from './drive115'

describe('fetchM3u8TextWithRetry', () => {
  const fetchMock = vi.fn()
  const tabsCreateMock = vi.fn().mockResolvedValue({ id: 1 })
  const tabsGetMock = vi.fn().mockRejectedValue(new Error('no tab'))

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('chrome', { tabs: { create: tabsCreateMock, get: tabsGetMock } })
    fetchMock.mockReset()
    tabsCreateMock.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns m3u8 text on success', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(new Response('#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1\nhttp://a/b.m3u8', { status: 200 })))
    const d = new Drive115()
    await expect(d.fetchM3u8TextWithRetry('PC1')).resolves.toContain('#EXTM3U')
  })

  it('opens verification tab on 911 and rejects', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ state: false, code: 911, error: 'captcha' }), { status: 200 })))
    const d = new Drive115()
    await expect(d.fetchM3u8TextWithRetry('PC1')).rejects.toThrow('获取 m3u8 失败')
    expect(tabsCreateMock).toHaveBeenCalled()
  })

  it('throws NotFoundM3u8 for non-m3u8 non-json responses', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(new Response('<html>oops</html>', { status: 200 })))
    const d = new Drive115()
    await expect(d.fetchM3u8TextWithRetry('PC1')).rejects.toThrow()
  })
})

describe('shouldOpenVerificationTab', () => {
  const now = 1_000_000

  it('opens when no record exists', () => {
    expect(shouldOpenVerificationTab(undefined, false, now)).toBe(true)
  })

  it('reuses the tab while it is still valid', () => {
    expect(shouldOpenVerificationTab({ tabId: 42, openedAt: now - 5_000 }, true, now)).toBe(false)
  })

  it('opens a new tab when the recorded tab is gone', () => {
    expect(shouldOpenVerificationTab({ tabId: 42, openedAt: now - 5_000 }, false, now)).toBe(true)
  })

  it('dedupes window.open within the cooldown', () => {
    expect(shouldOpenVerificationTab({ tabId: undefined, openedAt: now - 1_000 }, false, now)).toBe(false)
  })

  it('allows window.open again after the cooldown', () => {
    expect(shouldOpenVerificationTab({ tabId: undefined, openedAt: now - VERIFICATION_TAB_COOLDOWN_MS - 1 }, false, now)).toBe(true)
  })
})
