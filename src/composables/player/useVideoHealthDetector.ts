import type { PlayerCoreType } from './playerCore/types'
import type { PlayerContext } from './usePlayerProvide'

/**
 * 视频健康检测器（已禁用自动切换）
 * 所有黑屏、卡顿问题由用户手动切换播放器核心
 */
export function useVideoHealthDetector(
  _ctx: PlayerContext,
  _switchCoreFn: (core: PlayerCoreType) => Promise<void>,
) {
  /** 重置检测器（空实现） */
  const reset = () => { }

  /** 启动检测（空实现） */
  const startDetection = () => { }

  return {
    startDetection,
    reset,
  }
}
