/**
 * 悬停预览策略：按视频时长阶梯选择采样间隔/封面数/精确帧参数。
 * 纯函数模块，便于独立测试与调整策略。
 */

export const PRECISE_COVER_BUCKET = 0.5
export const MIN_COARSE_COVER_COUNT = 24

/** 粗采样间隔（秒）：短视频密集采样，长视频放宽 */
export function getCoarseSamplingInterval(duration: number): number {
  if (duration <= 5 * 60) {
    return 8
  }
  if (duration <= 10 * 60) {
    return 10
  }
  if (duration <= 20 * 60) {
    return 15
  }
  if (duration <= 40 * 60) {
    return 24
  }
  if (duration <= 90 * 60) {
    return 36
  }
  if (duration <= 180 * 60) {
    return 45
  }
  return 60
}

/** 粗采样封面数上限 */
export function getMaxCoarseCoverCount(duration: number): number {
  if (duration <= 20 * 60) {
    return 72
  }
  if (duration <= 90 * 60) {
    return 120
  }
  if (duration <= 180 * 60) {
    return 150
  }
  return 180
}

/** 初始粗封面数：按间隔采样并夹取到 [MIN, MAX] */
export function getInitialCoverCount(duration: number): number {
  const targetInterval = getCoarseSamplingInterval(duration)
  const count = Math.ceil(duration / targetInterval)
  return Math.max(MIN_COARSE_COVER_COUNT, Math.min(count, getMaxCoarseCoverCount(duration)))
}

/** 后台精化封面数（长视频才有，超 12 分钟回退 0） */
export function getBackgroundRefineCoverCount(duration: number): number {
  if (duration <= 5 * 60) {
    return 48
  }
  if (duration <= 8 * 60) {
    return 60
  }
  if (duration <= 12 * 60) {
    return 72
  }
  return 0
}

/** 精确帧最小时间增量（秒）：短视频 1.5s，长视频 0.75s */
export function getPreciseMinDelta(duration: number): number {
  if (duration <= 20 * 60) {
    return 1.5
  }
  if (duration <= 90 * 60) {
    return 1
  }
  return 0.75
}

/** 精确帧预取范围（秒） */
export function getPrecisePrefetchRange(duration: number): number {
  if (duration <= 20 * 60) {
    return 1
  }
  if (duration <= 90 * 60) {
    return 2
  }
  return 3
}

/** 精确帧预取步长（秒） */
export function getPrecisePrefetchStep(duration: number): number {
  if (duration <= 20 * 60) {
    return PRECISE_COVER_BUCKET
  }
  if (duration <= 90 * 60) {
    return 2
  }
  return 3
}
