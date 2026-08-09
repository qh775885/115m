/**
 * 带容量上限的 Map 缓存（超出限制时淘汰最旧条目）
 */
export class BoundedCache<V> extends Map<string, V> {
  private readonly limit: number

  constructor(limit: number) {
    super()
    this.limit = limit
  }

  override set(key: string, value: V): this {
    if (this.has(key)) {
      super.delete(key)
    }
    super.set(key, value)
    while (this.size > this.limit) {
      const oldestKey = this.keys().next().value
      if (oldestKey === undefined) break
      this.delete(oldestKey)
    }
    return this
  }
}
