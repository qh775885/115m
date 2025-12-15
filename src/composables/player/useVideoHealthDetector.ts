import type { PlayerContext } from './usePlayerProvide'
import { onUnmounted, watch } from 'vue'
import { PlayerCoreType } from './playerCore/types'

export function useVideoHealthDetector(
  ctx: PlayerContext,
  switchCoreFn: (core: PlayerCoreType) => Promise<void>,
) {
  const { playerCore } = ctx

  /** 状态监测 */
  let loadTimeoutTimer: any = null
  let checkPixelsTimer: any = null

  /** 重置检测器 */
  const reset = () => {
    if (loadTimeoutTimer)
      clearTimeout(loadTimeoutTimer)
    if (checkPixelsTimer)
      clearInterval(checkPixelsTimer)
  }

  /** 启动检测 */
  const startDetection = () => {
    reset()

    // 只有 XgPlayer 需要检测 (Native 已被废弃)，AvPlayer 自身足够健壮无需检测
    if (!playerCore.value || playerCore.value.type !== PlayerCoreType.XgPlayer) {
      return
    }

    const player = playerCore.value

    // 1. 加载超时检测 (10秒)
    // 如果 10 秒后 readyState 还是 0 (HAVE_NOTHING)，说明解码器挂了或者源甚至都没拉下来
    loadTimeoutTimer = setTimeout(() => {
      const video = player.getRenderElement() as HTMLVideoElement
      if (!video)
        return

      if (video.readyState < 2) { // 还没准备好数据
        console.warn('【115Master】XgPlayer 加载超时(10s)，自动切换到 AvPlayer 兜底')
        switchCoreFn(PlayerCoreType.AvPlayer)
      }
    }, 10000)

    // 2. 也是最关键的：错误监听
    // 我们通过 watch state.loadError 来做（已经在 useSources 处理了？如果没有，这里加）

    // 3. 尺寸检测 (针对 DivX 等可能无法解析尺寸的情况)
    /** 每秒检查一次，检查 5 次 */
    let checkCount = 0
    checkPixelsTimer = setInterval(() => {
      checkCount++
      if (checkCount > 10) { // 10秒后停止检查
        clearInterval(checkPixelsTimer)
        return
      }

      const video = player.getRenderElement() as HTMLVideoElement
      if (!video)
        return

      // 如果已经有元数据了 (readyState >= 1)
      if (video.readyState >= 1) {
        // 如果宽高异常
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          console.warn('【115Master】检测到视频尺寸为 0 (不支持的格式)，自动切换到 AvPlayer')
          clearInterval(checkPixelsTimer)
          clearTimeout(loadTimeoutTimer) // 取消超时检测，直接切
          switchCoreFn(PlayerCoreType.AvPlayer)
        }
      }
    }, 1000)
  }

  // 监听核心变化或视频加载
  watch(() => playerCore.value?.type, () => {
    startDetection()
  })

  // 监听视频源变化 (由 useSources 触发重新加载，我们可以通过监听 isLoading 变 false 来...
  // 或者简单点，每次 useSources 调用 initializeVideo 时重新 start，但这需要侵入 useSources。
  // 更好的办法是监听 playerCore.value 的变化（重新创建实例时引用会变）
  watch(() => playerCore.value, () => {
    startDetection()
  })

  // 监听错误
  watch(() => playerCore.value?.loadError, (err) => {
    if (err && playerCore.value?.type === PlayerCoreType.XgPlayer) {
      console.warn('【115Master】XgPlayer 发送错误信号:', err)
      console.warn('【115Master】自动切换到 AvPlayer 兜底')
      switchCoreFn(PlayerCoreType.AvPlayer)
    }
  }, { deep: true })

  onUnmounted(() => {
    reset()
  })

  return {
    startDetection,
    reset,
  }
}
