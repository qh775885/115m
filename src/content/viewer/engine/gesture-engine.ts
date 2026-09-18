/**
 * 115m 2.0 查看器手势与自适应计算引擎
 * 纯函数数学逻辑，彻底杜绝全局状态与硬编码
 */

export interface DragBounds {
  maxOffsetX: number
  maxOffsetY: number
}

export function computeDragBounds(
  viewportWidth: number,
  viewportHeight: number,
  scale: number,
): DragBounds {
  if (scale <= 1) {
    return { maxOffsetX: 0, maxOffsetY: 0 }
  }
  // 放大后允许平移的物理边界为视口溢出的一半
  const maxOffsetX = Math.max(0, (viewportWidth * (scale - 1)) / 2)
  const maxOffsetY = Math.max(0, (viewportHeight * (scale - 1)) / 2)
  return { maxOffsetX, maxOffsetY }
}

export function clampToBounds(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

export interface WheelDecision {
  type: 'navigate' | 'zoom' | 'none'
  direction?: number // 1: 下一张/缩小, -1: 上一张/放大
  nextScale?: number
}

export function processWheelGesture(
  deltaY: number,
  currentScale: number,
  accumulatedDelta: number,
  threshold = 60,
): { decision: WheelDecision, nextAccumulated: number } {
  // 1. 放大状态 (> 1.04)：滚轮自动切换为以光标为中心的平滑缩放
  if (currentScale > 1.04) {
    const factor = deltaY < 0 ? 1.15 : 0.87
    let nextScale = currentScale * factor
    if (nextScale <= 1.04) {
      nextScale = 1 // 吸附回 1x
    } else {
      nextScale = Math.min(5, nextScale)
    }
    return {
      decision: { type: 'zoom', nextScale, direction: deltaY < 0 ? -1 : 1 },
      nextAccumulated: 0,
    }
  }

  // 2. 正常自适应状态 (1x)：滚轮累积滑动切图
  const nextAcc = accumulatedDelta + deltaY
  if (Math.abs(nextAcc) >= threshold) {
    const direction = nextAcc > 0 ? 1 : -1
    return {
      decision: { type: 'navigate', direction },
      nextAccumulated: 0,
    }
  }

  return {
    decision: { type: 'none' },
    nextAccumulated: nextAcc,
  }
}

export function computeToggleZoom(currentScale: number): number {
  return currentScale > 1.04 ? 1 : 2
}
