// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getTranscodeStatusByFileId,
  getTranscodeStatusByPickCode,
  MAX_STORE_RECORDS,
  saveTranscodeStatus,
  subscribeTranscodeStatus,
} from './transcode-store'

type OnChangedListener = (changes: Record<string, unknown>, areaName: string) => void

function installSessionStorageMock() {
  const data = new Map<string, unknown>()
  const listeners = new Set<OnChangedListener>()
  const session = {
    async get(keys?: string | string[] | Record<string, unknown> | null): Promise<Record<string, unknown>> {
      const result: Record<string, unknown> = {}
      if (keys == null) {
        for (const [k, v] of data) result[k] = v
      }
      else if (typeof keys === 'string') {
        result[keys] = data.get(keys)
      }
      else if (Array.isArray(keys)) {
        for (const k of keys) result[k] = data.get(k)
      }
      else {
        for (const k of Object.keys(keys)) result[k] = data.get(k) ?? keys[k]
      }
      return result
    },
    async set(items: Record<string, unknown>): Promise<void> {
      for (const [k, v] of Object.entries(items)) data.set(k, v)
    },
  }
  const onChanged = {
    addListener(fn: OnChangedListener) { listeners.add(fn) },
    removeListener(fn: OnChangedListener) { listeners.delete(fn) },
  }
  vi.stubGlobal('chrome', { storage: { session, onChanged } })
  return {
    data,
    emit(changes: Record<string, unknown>) {
      for (const fn of listeners) fn(changes, 'session')
    },
  }
}

describe('transcode-store (chrome.storage.session)', () => {
  let mock: ReturnType<typeof installSessionStorageMock>

  beforeEach(() => {
    mock = installSessionStorageMock()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('写入后可读回（pickCode/fileId 双索引）', async () => {
    await saveTranscodeStatus('P1', { ok: true, state: 'queued' }, 'F1', true)
    expect((await getTranscodeStatusByPickCode('P1'))?.status.state).toBe('queued')
    expect((await getTranscodeStatusByFileId('F1'))?.status.state).toBe('queued')
  })

  it('同页广播：save 触发订阅回调', async () => {
    const cb = vi.fn()
    const unsub = subscribeTranscodeStatus(cb)
    await saveTranscodeStatus('P1', { ok: true, state: 'queued' }, 'F1')
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({ pickCode: 'P1', fileId: 'F1' }))
    unsub()
  })

  it('skipBroadcast 不触发同页广播', async () => {
    const cb = vi.fn()
    const unsub = subscribeTranscodeStatus(cb)
    await saveTranscodeStatus('P1', { ok: true, state: 'queued' }, 'F1', true)
    expect(cb).not.toHaveBeenCalled()
    unsub()
  })

  it('跨标签 onChanged 仅回调变化的记录', async () => {
    await saveTranscodeStatus('P1', { ok: true, state: 'queued' }, 'F1', true)
    const cb = vi.fn()
    const unsub = subscribeTranscodeStatus(cb)

    const oldStore = mock.data.get('m115_transcode_status_store') as Record<string, unknown>
    const newStore = {
      ...oldStore,
      P2: {
        pickCode: 'P2',
        fileId: 'F2',
        status: { ok: true, state: 'pending_check' },
        updatedAt: 1,
      },
    }
    mock.emit({
      m115_transcode_status_store: { oldValue: oldStore, newValue: newStore },
    })
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({ pickCode: 'P2' }))
    unsub()
  })

  it('onChanged 自触发（本上下文刚写入的相同 store）被过滤，不回调循环', async () => {
    await saveTranscodeStatus('P1', { ok: true, state: 'queued' }, 'F1', true)
    const cb = vi.fn()
    const unsub = subscribeTranscodeStatus(cb)

    const sameAsWritten = mock.data.get('m115_transcode_status_store') as Record<string, unknown>
    mock.emit({
      m115_transcode_status_store: { oldValue: undefined, newValue: sameAsWritten },
    })
    expect(cb).not.toHaveBeenCalled()

    const differentStore = {
      ...sameAsWritten,
      P2: {
        pickCode: 'P2',
        fileId: 'F2',
        status: { ok: true, state: 'queued' },
        updatedAt: 2,
      },
    }
    mock.emit({
      m115_transcode_status_store: { oldValue: sameAsWritten, newValue: differentStore },
    })
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({ pickCode: 'P2' }))
    unsub()
  })

  it('订阅退订后不再收到同页广播', async () => {
    const cb = vi.fn()
    const unsub = subscribeTranscodeStatus(cb)
    unsub()
    await saveTranscodeStatus('P1', { ok: true, state: 'queued' })
    expect(cb).not.toHaveBeenCalled()
  })

  it('store 超过上限后淘汰最久未更新的记录', async () => {
    const now = Date.now()
    // 预置 MAX_STORE_RECORDS + 5 条记录，时间戳递增（越早写入越旧）
    const prefill: Record<string, unknown> = {}
    for (let i = 0; i < MAX_STORE_RECORDS + 5; i += 1) {
      prefill[`P${i}`] = {
        pickCode: `P${i}`,
        status: { ok: true, state: 'queued' },
        updatedAt: now - (MAX_STORE_RECORDS + 5 - i) * 1000,
      }
    }
    mock.data.set('m115_transcode_status_store', prefill)

    await saveTranscodeStatus('NEW', { ok: true, state: 'queued' }, undefined, true)

    const stored = mock.data.get('m115_transcode_status_store') as Record<string, unknown>
    const keys = Object.keys(stored)
    expect(keys.length).toBe(MAX_STORE_RECORDS)
    // 最新的 NEW 一定保留
    expect(stored['NEW']).toBeDefined()
    // 最旧的 5 条（P0-P4，updatedAt 最小）被淘汰
    expect(stored['P0']).toBeUndefined()
    expect(stored['P4']).toBeUndefined()
  })
})

describe('transcode-store fallback (sessionStorage)', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    sessionStorage.clear()
  })

  it('无 chrome.storage.session 时降级 sessionStorage', async () => {
    await saveTranscodeStatus('P1', { ok: true, state: 'no_task' }, undefined, true)
    const raw = sessionStorage.getItem('m115_transcode_status_store')
    expect(raw).toContain('P1')
    expect((await getTranscodeStatusByPickCode('P1'))?.status.state).toBe('no_task')
  })

  it('降级时跨标签订阅退订安全返回', () => {
    const unsub = subscribeTranscodeStatus(() => {})
    unsub()
    expect(true).toBe(true)
  })
})
