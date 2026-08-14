import { describe, expect, it } from 'vitest'
import { blurTime, clamp, findNearestCover, formatTimeLabel, formatVttTime, type HoverCover } from './hover-utils'

describe('formatTimeLabel', () => {
  it('格式化为 mm:ss', () => {
    expect(formatTimeLabel(0)).toBe('00:00')
    expect(formatTimeLabel(65)).toBe('01:05')
    expect(formatTimeLabel(3599)).toBe('59:59')
  })

  it('超过 1 小时带 hh', () => {
    expect(formatTimeLabel(3600)).toBe('01:00:00')
    expect(formatTimeLabel(3661)).toBe('01:01:01')
  })

  it('负数归零', () => {
    expect(formatTimeLabel(-5)).toBe('00:00')
  })
})

describe('formatVttTime', () => {
  it('格式化为 hh:mm:ss.mmm', () => {
    expect(formatVttTime(65.5)).toBe('00:01:05.500')
    expect(formatVttTime(0)).toBe('00:00:00.000')
  })
})

describe('clamp', () => {
  it('限制在范围内', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
  })
})

describe('blurTime', () => {
  it('按 interval 取整并夹取', () => {
    expect(blurTime(65, 30, 100)).toBe(60)
    expect(blurTime(50, 30, 100)).toBe(60)
    expect(blurTime(100, 30, 100)).toBe(90)
  })

  it('非法 duration 返回 0', () => {
    expect(blurTime(10, 30, 0)).toBe(0)
    expect(blurTime(10, 30, -1)).toBe(0)
  })

  it('非法 interval 直接 clamp', () => {
    expect(blurTime(200, 0, 100)).toBe(100)
  })
})

describe('findNearestCover', () => {
  const covers: HoverCover[] = [
    { time: 10, imgUrl: 'a' },
    { time: 30, imgUrl: 'b' },
    { time: 50, imgUrl: 'c' },
  ]

  it('找到最近封面', () => {
    expect(findNearestCover(covers, 28)?.imgUrl).toBe('b')
    expect(findNearestCover(covers, 12)?.imgUrl).toBe('a')
  })

  it('空列表返回 null', () => {
    expect(findNearestCover([], 10)).toBeNull()
  })

  it('超出 maxDelta 返回 null', () => {
    expect(findNearestCover(covers, 100, 30)).toBeNull()
  })
})
