/**
 * 看图器缩放/拖拽物理纯函数
 * 无 DOM 依赖，可独立测试
 */

export const ZOOM_MIN = 1
export const ZOOM_MAX = 4

export interface ViewportSize {
  width: number
  height: number
}

export interface FrameRect extends ViewportSize {
  left: number
  top: number
}

export interface DragBounds {
  maxOffsetX: number
  maxOffsetY: number
}

/** 图片在缩放后的渲染尺寸（按 fitScale 适配 + zoomScale 放大） */
export function computeRenderedSize(
  naturalWidth: number,
  naturalHeight: number,
  frame: ViewportSize,
  zoomScale: number,
): ViewportSize {
  const fitScale = Math.min(frame.width / naturalWidth, frame.height / naturalHeight, 1)
  return {
    width: naturalWidth * fitScale * zoomScale,
    height: naturalHeight * fitScale * zoomScale,
  }
}

/** 可拖拽边界：渲染尺寸超出容器时允许偏移一半 */
export function computeDragBounds(
  naturalWidth: number,
  naturalHeight: number,
  frame: ViewportSize,
  zoomScale: number,
): DragBounds {
  const rendered = computeRenderedSize(naturalWidth, naturalHeight, frame, zoomScale)
  return {
    maxOffsetX: Math.max(0, (rendered.width - frame.width) / 2),
    maxOffsetY: Math.max(0, (rendered.height - frame.height) / 2),
  }
}

/** 越界回弹：超出边界时按阻力系数压缩，边缘有弹性手感 */
export function applyEdgeResistance(value: number, min: number, max: number, factor = 0.5): number {
  if (value < min) return min + (value - min) * factor
  if (value > max) return max + (value - max) * factor
  return value
}

/** 夹取到边界内（无弹性） */
export function clampToBounds(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export interface TransformState {
  zoomScale: number
  translateX: number
  translateY: number
}

/** 缩放并保持鼠标所在图像点不动的变换计算（返回新的 zoom/translate） */
export function computeZoomAtPoint(
  state: TransformState,
  nextScale: number,
  naturalWidth: number,
  naturalHeight: number,
  frame: FrameRect,
  clientX: number,
  clientY: number,
): TransformState {
  const fitScale = Math.min(frame.width / naturalWidth, frame.height / naturalHeight, 1)
  const baseWidth = naturalWidth * fitScale
  const baseHeight = naturalHeight * fitScale

  const frameX = clientX - frame.left - frame.width / 2
  const frameY = clientY - frame.top - frame.height / 2
  const imagePointX = (frameX - state.translateX) / state.zoomScale
  const imagePointY = (frameY - state.translateY) / state.zoomScale

  let translateX = frameX - imagePointX * nextScale
  let translateY = frameY - imagePointY * nextScale

  if (!Number.isFinite(translateX)) translateX = 0
  if (!Number.isFinite(translateY)) translateY = 0
  if (!baseWidth || !baseHeight || nextScale === 1) {
    translateX = 0
    translateY = 0
  }

  return { zoomScale: nextScale, translateX, translateY }
}

export function clampScale(scale: number): number {
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, scale))
}

/** 惯性回中单步：按 lerp 系数逼近目标，返回是否已到达（差值 < 0.5） */
export function settleStep(
  current: number,
  target: number,
  lerp = 0.34,
): { next: number, done: boolean } {
  const next = current + (target - current) * lerp
  const done = Math.abs(target - next) < 0.5
  return { next: done ? target : next, done }
}
