// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CACHE_VERSION } from './cache-schema'
import { getTimelineCovers, getVideoCovers } from './videoThumbnail'

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
