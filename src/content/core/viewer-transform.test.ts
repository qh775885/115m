import { describe, expect, it } from 'vitest'
import {
  clampScale,
  clampToBounds,
  computeDragBounds,
  computeRenderedSize,
  computeZoomAtPoint,
  settleStep,
  applyEdgeResistance,
  ZOOM_MAX,
  ZOOM_MIN,
} from './viewer-transform'

describe('computeRenderedSize', () => {
  it('未超界时按容器适配（fitScale 封顶 1）', () => {
    const size = computeRenderedSize(100, 100, { width: 50, height: 50 }, 1)
    expect(size.width).toBe(50)
    expect(size.height).toBe(50)
  })

  it('放大后按 zoomScale 倍乘', () => {
    const size = computeRenderedSize(100, 100, { width: 50, height: 50 }, 2)
    expect(size.width).toBe(100)
    expect(size.height).toBe(100)
  })

  it('超大图缩到容器内', () => {
    const size = computeRenderedSize(400, 200, { width: 100, height: 100 }, 1)
    expect(size.width).toBe(100)
    expect(size.height).toBe(50)
  })
})

describe('computeDragBounds', () => {
  it('渲染小于容器时边界为 0（不可拖）', () => {
    const bounds = computeDragBounds(50, 50, { width: 100, height: 100 }, 1)
    expect(bounds.maxOffsetX).toBe(0)
    expect(bounds.maxOffsetY).toBe(0)
  })

  it('放大超出容器时允许偏移渲染超出量的一半', () => {
    const bounds = computeDragBounds(100, 100, { width: 50, height: 50 }, 2)
    expect(bounds.maxOffsetX).toBe(25)
    expect(bounds.maxOffsetY).toBe(25)
  })
})

describe('applyEdgeResistance', () => {
  it('范围内原样返回', () => {
    expect(applyEdgeResistance(5, 0, 10)).toBe(5)
  })

  it('越界按阻力压缩', () => {
    expect(applyEdgeResistance(-2, 0, 10, 0.5)).toBe(-1)
    expect(applyEdgeResistance(12, 0, 10, 0.5)).toBe(11)
  })
})

describe('clampToBounds', () => {
  it('夹取到边界内', () => {
    expect(clampToBounds(5, 0, 10)).toBe(5)
    expect(clampToBounds(-1, 0, 10)).toBe(0)
    expect(clampToBounds(11, 0, 10)).toBe(10)
  })
})

describe('clampScale', () => {
  it('限制在 [ZOOM_MIN, ZOOM_MAX]', () => {
    expect(clampScale(0.5)).toBe(ZOOM_MIN)
    expect(clampScale(1.5)).toBe(1.5)
    expect(clampScale(10)).toBe(ZOOM_MAX)
  })
})

describe('computeZoomAtPoint', () => {
  const frame = { left: 0, top: 0, width: 200, height: 200 }

  it('放大到 1 时归零位移', () => {
    const state = computeZoomAtPoint({ zoomScale: 2, translateX: 10, translateY: 10 }, 1, 100, 100, frame, 100, 100)
    expect(state.translateX).toBe(0)
    expect(state.translateY).toBe(0)
  })

  it('以光标为锚点缩放保持图像点不动', () => {
    const initial = { zoomScale: 1, translateX: 0, translateY: 0 }
    const after = computeZoomAtPoint(initial, 2, 100, 100, frame, 150, 150)
    // 光标在中心偏右 50px 处，放大后该点仍应在 50px 处（相对中心）
    expect(after.translateX).toBeCloseTo(-50, 5)
    expect(after.translateY).toBeCloseTo(-50, 5)
  })

  it('非有限值归零', () => {
    const state = computeZoomAtPoint({ zoomScale: 0, translateX: 0, translateY: 0 }, 2, 100, 100, frame, 0, 0)
    expect(Number.isFinite(state.translateX)).toBe(true)
    expect(Number.isFinite(state.translateY)).toBe(true)
  })
})

describe('settleStep', () => {
  it('按 lerp 逼近目标', () => {
    const step = settleStep(0, 10, 0.5)
    expect(step.next).toBe(5)
    expect(step.done).toBe(false)
  })

  it('接近目标时判为完成', () => {
    const step = settleStep(9.9, 10, 0.5)
    expect(step.done).toBe(true)
    expect(step.next).toBe(10)
  })
})
