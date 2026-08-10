import { describe, expect, it } from 'vitest'
import { shouldOpenVerificationTab, VERIFICATION_TAB_COOLDOWN_MS } from './drive115'

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
