// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NeighborPreloader, neighborOffsets } from './media-wall-preload'

describe('neighborOffsets 邻居索引', () => {
  it('返回有效范围内的邻居索引', () => {
    expect(neighborOffsets(5, 10)).toEqual([6, 4, 7, 3])
  })

  it('边界裁剪', () => {
    expect(neighborOffsets(0, 3)).toEqual([1, 2])
    expect(neighborOffsets(2, 3)).toEqual([1, 0])
  })

  it('支持自定义偏移', () => {
    expect(neighborOffsets(5, 10, [1, 2])).toEqual([6, 7])
  })
})

describe('NeighborPreloader 邻居预载', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('按偏移错峰触发 loadImage', () => {
    const load = vi.fn()
    const preloader = new NeighborPreloader(load, { staggerMs: 100 })
    const items = ['a', 'b', 'c', 'd', 'e', 'f']
    preloader.schedule(2, idx => items[idx] ?? null)
    vi.advanceTimersByTime(0)
    expect(load).toHaveBeenCalledWith('d')
    vi.advanceTimersByTime(100)
    expect(load).toHaveBeenCalledWith('b')
    vi.advanceTimersByTime(100)
    expect(load).toHaveBeenCalledWith('e')
  })

  it('快速翻页使旧预载失效', () => {
    const load = vi.fn()
    const preloader = new NeighborPreloader(load, { staggerMs: 100 })
    const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
    preloader.schedule(2, idx => items[idx] ?? null)
    // 翻页到索引 3，版本递增
    preloader.schedule(3, idx => items[idx] ?? null)
    vi.advanceTimersByTime(0)
    // 只应加载第二轮的 [4,2,5]，第一轮的 [3,1] 已作废
    expect(load).toHaveBeenCalledWith('e')
    expect(load).not.toHaveBeenCalledWith('d')
  })

  it('越界索引跳过', () => {
    const load = vi.fn()
    const preloader = new NeighborPreloader(load)
    preloader.schedule(0, () => null)
    vi.advanceTimersByTime(1000)
    expect(load).not.toHaveBeenCalled()
  })

  it('acquire/release 控制并发额度', () => {
    const load = vi.fn()
    const preloader = new NeighborPreloader(load, { maxConcurrent: 2 })
    preloader.acquire()
    preloader.acquire()
    expect(preloader.inflightCount).toBe(2)
    preloader.schedule(5, () => 'url')
    vi.advanceTimersByTime(1000)
    // 并发已满，新预载被丢弃
    expect(load).not.toHaveBeenCalled()
    preloader.release()
    expect(preloader.inflightCount).toBe(1)
  })
})
