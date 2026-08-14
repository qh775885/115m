/**
 * 看图器滚轮手势纯函数
 * 归一化滚轮增量（deltaMode 行/页/像素统一换算）+ 切图累积决策。
 * 无 DOM 依赖，可独立测试。
 */

/** 滚轮切图阈值（归一化像素） */
export const WHEEL_GESTURE_STEP = 70

/** 行模式（deltaMode=1）单行折算像素 */
const LINE_HEIGHT_PX = 16
/** 页模式（deltaMode=2）单页折算像素 */
const PAGE_HEIGHT_PX = 600

export interface WheelGestureState {
  /** 已累积的归一化滚轮增量（像素） */
  accumulated: number
}

/** 创建滚轮手势状态 */
export function createWheelGestureState(): WheelGestureState {
  return { accumulated: 0 }
}

/** 将各 deltaMode 的滚轮增量统一换算为像素（0=像素 / 1=行 / 2=页） */
export function normalizeWheelDeltaY(deltaY: number, deltaMode: number): number {
  if (deltaMode === 1) return deltaY * LINE_HEIGHT_PX
  if (deltaMode === 2) return deltaY * PAGE_HEIGHT_PX
  return deltaY
}

/**
 * 喂入一次滚轮事件：累积到阈值即触发切图并归零。
 * 无冷却锁，切图后立即响应下一次滚动（消除快速连滚滞后）。
 */
export function pushWheelGesture(
  state: WheelGestureState,
  deltaY: number,
  deltaMode: number,
  stepThreshold = WHEEL_GESTURE_STEP,
): { shouldMove: boolean, direction: number } {
  if (!deltaY) return { shouldMove: false, direction: 0 }
  state.accumulated += normalizeWheelDeltaY(deltaY, deltaMode)
  if (Math.abs(state.accumulated) < stepThreshold) {
    return { shouldMove: false, direction: 0 }
  }
  const direction = state.accumulated > 0 ? 1 : -1
  state.accumulated = 0
  return { shouldMove: true, direction }
}
