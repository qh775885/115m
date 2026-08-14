import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getBatchCooldownKey,
  getCachedTranscodeStatus,
  getTranscodeCooldown,
  invalidateTranscodeStatus,
  isBatchTranscodeCooling,
  setBatchTranscodeCooldown,
  setCachedTranscodeStatus,
  setTranscodeCooldown,
  TRANSCODE_COOLDOWN_MS,
  TRANSCODE_STATUS_CACHE_TTL_MS,
} from './transcode-state'

describe('转码状态缓存', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('写入后可读回', () => {
    setCachedTranscodeStatus('p1', { ok: true, state: 'queued' })
    expect(getCachedTranscodeStatus('p1')).toEqual({ ok: true, state: 'queued' })
  })

  it('支持 in-flight promise 合并', async () => {
    const promise = Promise.resolve({ ok: true })
    setCachedTranscodeStatus('p2', promise)
    const cached = getCachedTranscodeStatus('p2')
    expect(cached).toBeInstanceOf(Promise)
    expect(await cached).toEqual({ ok: true })
  })

  it('超过 TTL 后失效', () => {
    setCachedTranscodeStatus('p3', { ok: true })
    vi.advanceTimersByTime(TRANSCODE_STATUS_CACHE_TTL_MS + 1)
    expect(getCachedTranscodeStatus('p3')).toBeNull()
  })

  it('invalidate 清除单条', () => {
    setCachedTranscodeStatus('p4', { ok: true })
    invalidateTranscodeStatus('p4')
    expect(getCachedTranscodeStatus('p4')).toBeNull()
  })
})

describe('转码冷却', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('冷却期内返回缓存响应', () => {
    setTranscodeCooldown('p1', { ok: true })
    expect(getTranscodeCooldown('p1')).toEqual({ ok: true })
  })

  it('超过冷却期后失效', () => {
    setTranscodeCooldown('p1', { ok: true })
    vi.advanceTimersByTime(TRANSCODE_COOLDOWN_MS + 1)
    expect(getTranscodeCooldown('p1')).toBeNull()
  })

  it('批量冷却按 key 生效', () => {
    const key = getBatchCooldownKey('p1', ['f1', 'f2'])
    expect(isBatchTranscodeCooling(key)).toBe(false)
    setBatchTranscodeCooldown(key)
    expect(isBatchTranscodeCooling(key)).toBe(true)
  })

  it('批量冷却超时后失效', () => {
    const key = getBatchCooldownKey('p1', ['f1'])
    setBatchTranscodeCooldown(key)
    vi.advanceTimersByTime(10 * 60_000 + 1)
    expect(isBatchTranscodeCooling(key)).toBe(false)
  })
})
