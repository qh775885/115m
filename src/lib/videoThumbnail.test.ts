// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CACHE_VERSION } from './cache-schema'
import { calculateTimes, clampTime, getTimelineCovers, getVideoCovers, selectCoverSet, sortAndDedupeCovers } from './videoThumbnail'

vi.mock('./drive115', () => ({
  drive115: {
    getM3u8: vi.fn().mockRejectedValue(new Error('m3u8 not found')),
  },
}))

const TIMELINE_KEY = (pick: string) => `115m_timeline_${CACHE_VERSION}_${pick}`

function makeCovers(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    imgUrl: `https://example.com/thumb-${i}.png`,
    width: 160,
    height: 90,
    time: i * 10,
  }))
}

beforeEach(() => {
  ;(globalThis as any).chrome = {
    storage: {
      local: {
        get: async () => ({}),
        set: async () => {},
      },
    },
  }
})

describe('videoThumbnail 时间轴封顶', () => {
  it('从 storage 读回超过 TIMELINE_ENTRY_LIMIT(200) 的记录被均匀截断', async () => {
    const oversized = makeCovers(500)
    ;(globalThis as any).chrome.storage.local.get = async () => ({
      [TIMELINE_KEY('pick-cap')]: oversized,
    })

    const covers = await getTimelineCovers('pick-cap')
    expect(covers.length).toBeLessThanOrEqual(200)
    expect(covers.length).toBeGreaterThan(0)
    // 截断后仍按时间升序且无重复
    const times = covers.map(c => c.time)
    expect([...times].sort((a, b) => a - b)).toEqual(times)
    expect(new Set(times).size).toBe(times.length)
  })

  it('未超上限时原样返回', async () => {
    const covers = makeCovers(10)
    ;(globalThis as any).chrome.storage.local.get = async () => ({
      [TIMELINE_KEY('pick-small')]: covers,
    })

    const result = await getTimelineCovers('pick-small')
    expect(result.length).toBe(10)
  })

  it('storage 不可用时返回空数组', async () => {
    ;(globalThis as any).chrome = undefined
    const result = await getTimelineCovers('pick-no-storage')
    expect(result).toEqual([])
  })

  it('getVideoCovers 无 m3u8 源时抛出 M3u8UnavailableError', async () => {
    await expect(getVideoCovers('pick-no-m3u8', 600, 5)).rejects.toThrow(/m3u8 not found/i)
  })
})

describe('videoThumbnail 纯函数', () => {
  it('clampTime 夹取到有效区间', () => {
    expect(clampTime(-5, 100)).toBe(0.2)
    expect(clampTime(50, 100)).toBe(50)
    expect(clampTime(999, 100)).toBe(99.8)
    expect(clampTime(30, 0)).toBe(30)
  })

  it('calculateTimes 均匀分布采样点', () => {
    expect(calculateTimes(100, 5)).toEqual([10, 30, 50, 70, 90])
    expect(calculateTimes(100, 1)).toEqual([50])
  })

  it('sortAndDedupeCovers 排序并按时间+图去重', () => {
    const covers = [
      { imgUrl: 'b', width: 1, height: 1, time: 30 },
      { imgUrl: 'a', width: 1, height: 1, time: 10 },
      { imgUrl: 'a', width: 1, height: 1, time: 10.2 },
      { imgUrl: 'a', width: 1, height: 1, time: 20 },
    ]
    const result = sortAndDedupeCovers(covers)
    // 相邻且时间差 <0.5 且同图 → 去重（time 10.2 的 a 被合并）
    expect(result.map(c => c.time)).toEqual([10, 20, 30])
  })

  it('selectCoverSet 选取最接近目标时间的封面', () => {
    const covers = makeCovers(10)
    const result = selectCoverSet(covers, 100, 3)
    expect(result.length).toBe(3)
    expect(result.map(c => c.time).sort((a, b) => a - b)).toEqual([20, 50, 80])
  })
})
