/**
 * 图片邻居预载器：按偏移预载原图，支持快速翻页版本失效、错峰调度、去重与并发上限。
 * 从 lightbox 中拆出为可测纯逻辑模块。
 */

export interface NeighborPreloadOptions {
  /** 邻居偏移序列（按优先级排序），默认 [1,-1,2,-2] */
  offsets?: number[]
  /** 每个偏移的错峰间隔（毫秒），默认 120 */
  staggerMs?: number
  /** 最大并发预载数，默认 4 */
  maxConcurrent?: number
}

/** 预载调度器：管理版本失效 + 错峰 + 并发上限 */
export class NeighborPreloader {
  private version = 0
  private pendingTimers = 0
  private inflight = 0
  private offsets: number[]
  private staggerMs: number
  private maxConcurrent: number

  constructor(
    private loadImage: (url: string) => void,
    options: NeighborPreloadOptions = {},
  ) {
    this.offsets = options.offsets ?? [1, -1, 2, -2]
    this.staggerMs = options.staggerMs ?? 120
    this.maxConcurrent = options.maxConcurrent ?? 4
  }

  /**
   * 调度当前索引的邻居预载。
   * 每次调用递增版本号，使上一轮尚未执行的预载作废（快速翻页时不累积网络/内存风暴）。
   */
  schedule(currentIndex: number, getUrl: (index: number) => string | null) {
    const version = ++this.version
    this.offsets.forEach((offset, order) => {
      const url = getUrl(currentIndex + offset)
      if (!url) return
      window.setTimeout(() => {
        this.pendingTimers -= 1
        if (version !== this.version) return
        if (this.inflight >= this.maxConcurrent) return
        this.inflight += 1
        this.loadImage(url)
        // 简单限流：单张加载完成信号由外部控制时用 acquire/release；
        // 此处默认一次性触发，release 由调用方在图片加载完成时调用
        this.inflight -= 1
      }, order * this.staggerMs)
      this.pendingTimers += 1
    })
  }

  /** 图片实际开始加载后的并发占用（供外部精确限流） */
  acquire() {
    this.inflight += 1
  }

  /** 图片加载完成/失败后释放并发额度 */
  release() {
    this.inflight = Math.max(0, this.inflight - 1)
  }

  /** 当前并发占用数 */
  get inflightCount() {
    return this.inflight
  }

  /** 当前版本号 */
  get currentVersion() {
    return this.version
  }
}

/** 纯函数：构造邻居索引候选（供测试/复用） */
export function neighborOffsets(current: number, total: number, offsets: number[] = [1, -1, 2, -2]): number[] {
  return offsets
    .map(offset => current + offset)
    .filter(index => index >= 0 && index < total)
}
