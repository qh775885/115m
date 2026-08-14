import { describe, expect, it } from 'vitest'
import {
  getBackgroundRefineCoverCount,
  getCoarseSamplingInterval,
  getInitialCoverCount,
  getMaxCoarseCoverCount,
  getPreciseMinDelta,
  getPrecisePrefetchRange,
  getPrecisePrefetchStep,
} from './hover-preview-policy'

describe('getCoarseSamplingInterval 时长阶梯', () => {
  it('短视频密集采样，长视频放宽', () => {
    expect(getCoarseSamplingInterval(4 * 60)).toBe(8)
    expect(getCoarseSamplingInterval(8 * 60)).toBe(10)
    expect(getCoarseSamplingInterval(15 * 60)).toBe(15)
    expect(getCoarseSamplingInterval(30 * 60)).toBe(24)
    expect(getCoarseSamplingInterval(60 * 60)).toBe(36)
    expect(getCoarseSamplingInterval(120 * 60)).toBe(45)
    expect(getCoarseSamplingInterval(300 * 60)).toBe(60)
  })
})

describe('getMaxCoarseCoverCount 封面数上限', () => {
  it('随时长增长', () => {
    expect(getMaxCoarseCoverCount(10 * 60)).toBe(72)
    expect(getMaxCoarseCoverCount(50 * 60)).toBe(120)
    expect(getMaxCoarseCoverCount(120 * 60)).toBe(150)
    expect(getMaxCoarseCoverCount(300 * 60)).toBe(180)
  })
})

describe('getInitialCoverCount', () => {
  it('按间隔采样并夹取到下限', () => {
    expect(getInitialCoverCount(3 * 60)).toBe(24)
    expect(getInitialCoverCount(60 * 60)).toBe(100)
  })
})

describe('getBackgroundRefineCoverCount', () => {
  it('长视频才后台精化', () => {
    expect(getBackgroundRefineCoverCount(3 * 60)).toBe(48)
    expect(getBackgroundRefineCoverCount(7 * 60)).toBe(60)
    expect(getBackgroundRefineCoverCount(10 * 60)).toBe(72)
    expect(getBackgroundRefineCoverCount(30 * 60)).toBe(0)
  })
})

describe('精确帧策略', () => {
  it('getPreciseMinDelta：短时长 1.5s，长时长 0.75s', () => {
    expect(getPreciseMinDelta(10 * 60)).toBe(1.5)
    expect(getPreciseMinDelta(60 * 60)).toBe(1)
    expect(getPreciseMinDelta(180 * 60)).toBe(0.75)
  })

  it('getPrecisePrefetchRange：短时长 1，长时长 3', () => {
    expect(getPrecisePrefetchRange(10 * 60)).toBe(1)
    expect(getPrecisePrefetchRange(60 * 60)).toBe(2)
    expect(getPrecisePrefetchRange(180 * 60)).toBe(3)
  })

  it('getPrecisePrefetchStep：短时长用 bucket 0.5', () => {
    expect(getPrecisePrefetchStep(10 * 60)).toBe(0.5)
    expect(getPrecisePrefetchStep(60 * 60)).toBe(2)
    expect(getPrecisePrefetchStep(180 * 60)).toBe(3)
  })
})
