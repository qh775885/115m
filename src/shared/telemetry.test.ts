import { describe, expect, it } from 'vitest'
import { accumulateFailureCounts } from './telemetry'

describe('accumulateFailureCounts', () => {
  it('merges counts across batches', () => {
    expect(accumulateFailureCounts(
      { OPEN_TAB: 2, FETCH_M3U8: 1 },
      { OPEN_TAB: 3, TRANSCODE_ACCELERATE: 2 },
    )).toEqual({ OPEN_TAB: 5, FETCH_M3U8: 1, TRANSCODE_ACCELERATE: 2 })
  })

  it('creates entries from empty state', () => {
    expect(accumulateFailureCounts({}, { PING: 1 })).toEqual({ PING: 1 })
  })

  it('does not mutate the existing map', () => {
    const existing = { OPEN_TAB: 1 }
    accumulateFailureCounts(existing, { OPEN_TAB: 1 })
    expect(existing).toEqual({ OPEN_TAB: 1 })
  })
})
