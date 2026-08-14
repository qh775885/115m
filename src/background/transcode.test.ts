import { describe, expect, it } from 'vitest'
import { pickTranscodeTab } from './transcode-api'

describe('pickTranscodeTab', () => {
  it('prefers the active tab over others', () => {
    expect(pickTranscodeTab([
      { id: 1, active: false },
      { id: 2, active: true },
      { id: 3, active: false },
    ])).toBe(2)
  })

  it('falls back to the first tab when none is active', () => {
    expect(pickTranscodeTab([
      { id: 7, active: false },
      { id: 9, active: false },
    ])).toBe(7)
  })

  it('returns undefined for empty list', () => {
    expect(pickTranscodeTab([])).toBeUndefined()
  })

  it('handles tabs without ids', () => {
    expect(pickTranscodeTab([
      { active: true },
      { id: 5, active: false },
    ])).toBeUndefined()
  })
})
