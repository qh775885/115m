import { describe, expect, it } from 'vitest'
import { buildQueuedResponse, pickTranscodeTab } from './transcode-api'

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

describe('buildQueuedResponse 排队响应构造', () => {
  it('透传任务队列信息', () => {
    const response = buildQueuedResponse(
      { status: 3, count: 2, time: 120, priority: 100 },
      'queue status refreshed',
    )
    expect(response.ok).toBe(true)
    expect(response.state).toBe('queued')
    expect(response.queueCount).toBe(2)
    expect(response.etaSeconds).toBe(120)
    expect(response.priority).toBe(100)
    expect(response.pushAccepted).toBeUndefined()
    expect(response.detail).toBe('queue status refreshed')
  })

  it('任务为空时返回占位值', () => {
    const response = buildQueuedResponse(null, 'no job')
    expect(response.queueCount).toBeUndefined()
    expect(response.etaSeconds).toBeUndefined()
  })

  it('支持标注 push 已受理', () => {
    const response = buildQueuedResponse(undefined, 'queued after vip push', true)
    expect(response.pushAccepted).toBe(true)
  })
})
