import { describe, expect, it } from 'vitest'
import { collectStaleCacheKeys, extractCacheVersion } from './cache-schema'

describe('extractCacheVersion', () => {
  it('extracts version from cover batch keys', () => {
    expect(extractCacheVersion('115m_covers_v4_default_pc_5')).toBe('v4')
  })

  it('extracts version from single cover keys', () => {
    expect(extractCacheVersion('115m_cover_v4_pc_12.3')).toBe('v4')
  })

  it('extracts version from timeline keys', () => {
    expect(extractCacheVersion('115m_timeline_v4_pc')).toBe('v4')
  })

  it('returns null for unrelated keys', () => {
    expect(extractCacheVersion('115m-schema-version')).toBeNull()
    expect(extractCacheVersion('data')).toBeNull()
  })
})

describe('collectStaleCacheKeys', () => {
  const keys = [
    '115m_covers_v4_default_pc_5',
    '115m_cover_v4_pc_12.3',
    '115m_timeline_v4_pc',
    '115m_covers_v3_default_other_5',
    '115m_cover_v2_pc_3.5',
    '115m-schema-version',
    'data',
  ]

  it('collects keys from older versions only', () => {
    const stale = collectStaleCacheKeys(keys, 'v4')
    expect(stale).toEqual(['115m_covers_v3_default_other_5', '115m_cover_v2_pc_3.5'])
  })

  it('collects all prefixed keys when version format is unknown', () => {
    const stale = collectStaleCacheKeys(['115m_covers_pc_5', '115m_covers_v4_pc_5'], 'v4')
    expect(stale).toEqual(['115m_covers_pc_5'])
  })

  it('ignores non-cache keys', () => {
    const stale = collectStaleCacheKeys(['data', '115m-schema-version', 'settings'], 'v4')
    expect(stale).toEqual([])
  })
})
