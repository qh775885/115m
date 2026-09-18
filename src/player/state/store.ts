/**
 * 115m 2.0 · 轻量发布订阅商店
 * 单一数据源 + 订阅通知。视图层只读状态、只派发动作，绝不直接操作内核。
 */

export type StoreListener<T> = (state: T, prev: T) => void

export class Store<T extends object> {
  private state: T
  private listeners = new Set<StoreListener<T>>()

  constructor(initial: T) {
    this.state = { ...initial }
  }

  get(): T {
    return this.state
  }

  /** 合并式更新；仅当值确有变化时才通知订阅者，避免无谓重渲染。 */
  set(patch: Partial<T>): void {
    let changed = false
    for (const key of Object.keys(patch) as (keyof T)[]) {
      if (patch[key] !== this.state[key]) {
        changed = true
        break
      }
    }
    if (!changed) return

    const prev = this.state
    this.state = { ...this.state, ...patch }
    this.listeners.forEach((fn) => fn(this.state, prev))
  }

  subscribe(fn: StoreListener<T>): () => void {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  destroy(): void {
    this.listeners.clear()
  }
}
