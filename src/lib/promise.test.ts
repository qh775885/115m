import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchWithTimeout } from './promise'

describe('fetchWithTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('正常返回 fetch 结果', async () => {
    const response = { ok: true } as Response
    vi.stubGlobal('fetch', vi.fn(async () => response))
    const result = await fetchWithTimeout('http://x', undefined, 100)
    expect(result).toBe(response)
    expect(fetch).toHaveBeenCalledWith('http://x', expect.objectContaining({ signal: expect.anything() }))
  })

  it('超时后通过 AbortController 中断挂起的请求', async () => {
    const signals: AbortSignal[] = []
    vi.stubGlobal('fetch', vi.fn((_url: string, init?: RequestInit) => {
      const signal = init?.signal as AbortSignal
      signals.push(signal)
      // 模拟弱网挂起：请求在 signal 触发 abort 前永不 resolve
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
      })
    }))

    const promise = fetchWithTimeout('http://x', undefined, 100)
    const assertion = expect(promise).rejects.toThrow()
    await vi.advanceTimersByTimeAsync(200)
    await assertion

    expect(signals.length).toBe(1)
    expect(signals[0].aborted).toBe(true)
  })
})
