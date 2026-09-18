import { describe, expect, it } from 'vitest'
import {
  computeDragBounds,
  clampToBounds,
  processWheelGesture,
  computeToggleZoom,
} from './gesture-engine'

describe('gesture-engine', () => {
  it('计算拖拽边界与截断', () => {
    expect(computeDragBounds(1000, 800, 1)).toEqual({ maxOffsetX: 0, maxOffsetY: 0 })
    expect(computeDragBounds(1000, 800, 2)).toEqual({ maxOffsetX: 500, maxOffsetY: 400 })

    expect(clampToBounds(600, -500, 500)).toBe(500)
    expect(clampToBounds(-600, -500, 500)).toBe(-500)
    expect(clampToBounds(200, -500, 500)).toBe(200)
  })

  it('双击缩放往返计算', () => {
    expect(computeToggleZoom(1)).toBe(2)
    expect(computeToggleZoom(2)).toBe(1)
    expect(computeToggleZoom(1.05)).toBe(1)
  })

  it('滚轮手势自适应：1x 切图，放大缩放并吸附', () => {
    // 1x 状态累积达到阈值切图
    const step1 = processWheelGesture(30, 1, 0)
    expect(step1.decision.type).toBe('none')
    expect(step1.nextAccumulated).toBe(30)

    const step2 = processWheelGesture(40, 1, step1.nextAccumulated)
    expect(step2.decision.type).toBe('navigate')
    expect(step2.decision.direction).toBe(1) // 下一张
    expect(step2.nextAccumulated).toBe(0)

    // 放大状态下自动转为平滑缩放
    const zoomIn = processWheelGesture(-100, 2, 0)
    expect(zoomIn.decision.type).toBe('zoom')
    expect(zoomIn.decision.nextScale).toBe(2 * 1.15)

    // 向下缩小并吸附回 1x
    const zoomOut = processWheelGesture(100, 1.1, 0)
    expect(zoomOut.decision.type).toBe('zoom')
    expect(zoomOut.decision.nextScale).toBe(1)
  })
})
