import { describe, expect, it, vi } from 'vitest'
import { Store } from './store'

interface Demo {
  a: number
  b: string
}

describe('Store', () => {
  it('合并式更新并保留其它字段', () => {
    const store = new Store<Demo>({ a: 1, b: 'x' })
    store.set({ a: 2 })
    expect(store.get()).toEqual({ a: 2, b: 'x' })
  })

  it('值未变化时不通知订阅者', () => {
    const store = new Store<Demo>({ a: 1, b: 'x' })
    const fn = vi.fn()
    store.subscribe(fn)
    store.set({ a: 1 })
    expect(fn).not.toHaveBeenCalled()
  })

  it('值变化时通知并携带新旧状态', () => {
    const store = new Store<Demo>({ a: 1, b: 'x' })
    const fn = vi.fn()
    store.subscribe(fn)
    store.set({ a: 2 })
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith({ a: 2, b: 'x' }, { a: 1, b: 'x' })
  })

  it('取消订阅后不再收到通知', () => {
    const store = new Store<Demo>({ a: 1, b: 'x' })
    const fn = vi.fn()
    const off = store.subscribe(fn)
    off()
    store.set({ a: 2 })
    expect(fn).not.toHaveBeenCalled()
  })

  it('初始状态为副本，修改外部对象不影响内部', () => {
    const initial: Demo = { a: 1, b: 'x' }
    const store = new Store<Demo>(initial)
    initial.a = 99
    expect(store.get().a).toBe(1)
  })
})
