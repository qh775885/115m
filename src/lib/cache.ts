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

/**
 * 按字节预算设限的 LRU 缓存：条目占用通过 estimateBytes 估算，
 * 超出预算时淘汰最旧条目，避免超大值（如长视频 dataURL 封面）把内存撑爆。
 * 注意 estimateBytes 需对同一 value 返回稳定结果。
 */
export class ByteBudgetCache<V> extends Map<string, V> {
  private readonly byteLimit: number
  private readonly estimateBytes: (value: V) => number
  private totalBytes = 0

  constructor(byteLimit: number, estimateBytes: (value: V) => number) {
    super()
    this.byteLimit = byteLimit
    this.estimateBytes = estimateBytes
  }

  get byteUsage(): number {
    return this.totalBytes
  }

  override set(key: string, value: V): this {
    const prev = this.get(key)
    if (prev !== undefined) {
      this.totalBytes -= this.estimateBytes(prev)
      super.delete(key)
    }
    super.set(key, value)
    this.totalBytes += this.estimateBytes(value)
    while (this.totalBytes > this.byteLimit && this.size > 0) {
      const oldestKey = this.keys().next().value
      if (oldestKey === undefined) break
      this.delete(oldestKey)
    }
    return this
  }

  override delete(key: string): boolean {
    const prev = this.get(key)
    if (prev === undefined) {
      return false
    }
    this.totalBytes -= this.estimateBytes(prev)
    return super.delete(key)
  }

  override clear(): void {
    super.clear()
    this.totalBytes = 0
  }
}
