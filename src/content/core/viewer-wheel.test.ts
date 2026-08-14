import { describe, expect, it } from 'vitest'
import {
  createWheelGestureState,
  normalizeWheelDeltaY,
  pushWheelGesture,
} from './viewer-wheel'

describe('normalizeWheelDeltaY', () => {
  it('deltaMode=0（像素）原样返回', () => {
    expect(normalizeWheelDeltaY(100, 0)).toBe(100)
    expect(normalizeWheelDeltaY(-40, 0)).toBe(-40)
  })

  it('deltaMode=1（行）按行高折算', () => {
    expect(normalizeWheelDeltaY(2, 1)).toBe(32)
    expect(normalizeWheelDeltaY(-3, 1)).toBe(-48)
  })

  it('deltaMode=2（页）按页高折算', () => {
    expect(normalizeWheelDeltaY(1, 2)).toBe(600)
    expect(normalizeWheelDeltaY(-1, 2)).toBe(-600)
  })
})

describe('pushWheelGesture', () => {
  it('单次像素滚动达阈值即切图并归零', () => {
    const state = createWheelGestureState()
    expect(pushWheelGesture(state, 100, 0)).toEqual({ shouldMove: true, direction: 1 })
    expect(state.accumulated).toBe(0)
  })

  it('未达阈值只累积不切图', () => {
    const state = createWheelGestureState()
    expect(pushWheelGesture(state, 40, 0)).toEqual({ shouldMove: false, direction: 0 })
    expect(state.accumulated).toBe(40)
  })

  it('多次小步累积到阈值才切', () => {
    const state = createWheelGestureState()
    pushWheelGesture(state, 30, 0)
    pushWheelGesture(state, 30, 0)
    expect(pushWheelGesture(state, 30, 0)).toEqual({ shouldMove: true, direction: 1 })
    expect(state.accumulated).toBe(0)
  })

  it('切图后立即响应下一次滚动（无冷却锁）', () => {
    const state = createWheelGestureState()
    pushWheelGesture(state, 100, 0)
    expect(pushWheelGesture(state, 100, 0)).toEqual({ shouldMove: true, direction: 1 })
  })

  it('反向滚动先抵消再反向触发', () => {
    const state = createWheelGestureState()
    pushWheelGesture(state, 100, 0)
    pushWheelGesture(state, -60, 0)
    expect(pushWheelGesture(state, -60, 0)).toEqual({ shouldMove: true, direction: -1 })
  })

  it('deltaY 为 0 不处理', () => {
    const state = createWheelGestureState()
    expect(pushWheelGesture(state, 0, 0)).toEqual({ shouldMove: false, direction: 0 })
  })

  it('行模式滚轮累积到阈值也可切图', () => {
    const state = createWheelGestureState()
    expect(pushWheelGesture(state, 5, 1)).toEqual({ shouldMove: true, direction: 1 })
  })

  it('自定义阈值生效', () => {
    const state = createWheelGestureState()
    expect(pushWheelGesture(state, 50, 0, 100)).toEqual({ shouldMove: false, direction: 0 })
    expect(pushWheelGesture(state, 50, 0, 100)).toEqual({ shouldMove: true, direction: 1 })
  })
})
