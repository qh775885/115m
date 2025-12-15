import type { VideoSource } from '../../components/XPlayer/types'
import type { PlayerContext } from './usePlayerProvide'
import { useDebounceFn } from '@vueuse/core'
import { ref, shallowRef, toValue, watch } from 'vue'
import { VideoSourceExtension } from '../../components/XPlayer/types'
import { qualityPreferenceCache } from '../../utils/cache'
import { PlayerCoreType } from './playerCore/types'

/**
 * 视频源
 */
export function useSources(ctx: PlayerContext) {
  /** 视频元素 */
  const playerElementRef = ctx.refs.playerElementRef
  /** 播放器 */
  const playerCore = ctx?.playerCore
  /** 视频源列表 */
  const list = ctx.rootProps.sources
  /** 当前视频源 */
  const current = ref<VideoSource | null>(null)
  /** 是否中断 */
  const isInterrupt = shallowRef(false)
  /** 是否正在切换播放器核心 */
  const isSwitching = shallowRef(false)
  /** 获取 hls 视频源 */
  const getHlsSource = () => {
    return list.value.find((item: VideoSource) => item.type === 'hls')
  }

  /** 根据画质偏好选择默认视频源 */
  const getPreferredVideoSource = async (): Promise<VideoSource | null> => {
    if (list.value.length === 0) {
      return null
    }

    /** 如果没有 videoId，使用默认第一个源（最高画质） */
    const videoId = ctx.rootProps.videoId
    if (!videoId) {
      return list.value[0]
    }

    try {
      /** 尝试获取保存的画质偏好 */
      const preference = await qualityPreferenceCache.getPreference(videoId)
      if (!preference) {
        // 没有保存的偏好，使用默认第一个源（最高画质）
        return list.value[0]
      }

      /** 根据保存的画质偏好查找对应的视频源 */
      const preferredSource = list.value.find((source: VideoSource) => source.quality === preference.quality)
      if (preferredSource) {
        console.log(`🎞️ 使用保存的画质偏好: ${preference.quality}P (${preference.displayQuality || preference.quality})`)
        return preferredSource
      }
      else {
        console.warn(`⚠️ 保存的画质偏好 ${preference.quality}P 不存在，使用默认最高画质`)
        return list.value[0]
      }
    }
    catch (error) {
      console.error('获取画质偏好失败，使用默认最高画质:', error)
      return list.value[0]
    }
  }

  const getDefaultPlayerCore = (source: VideoSource) => {
    if (source.type === 'hls') {
      return PlayerCoreType.Hls
    }
    if ([VideoSourceExtension.mkv].includes(source.extension)) {
      return PlayerCoreType.AvPlayer
    }
    return PlayerCoreType.Native
  }

  /** 初始化视频 */
  const initializeVideo = async (
    source: VideoSource,
    playerCoreType?: PlayerCoreType,
    lastTime?: number,
  ) => {
    if (!ctx.driver) {
      throw new Error('videoDriver is not found')
    }

    // 更新当前源
    current.value = source

    try {
      await ctx.driver?.switchDriver(
        playerCoreType ?? getDefaultPlayerCore(source),
      )

      if (!playerCore.value) {
        throw new Error('player is not found')
      }

      if (!playerElementRef.value) {
        throw new Error('playerElementRef is not found')
      }

      // 初始化播放器
      await playerCore.value.init(playerElementRef.value)

      // 加载视频源
      await playerCore.value.load(source.url, lastTime ?? 0)
    }
    catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
      if (error instanceof Error) {
        const hlsSource = getHlsSource()

        if (hlsSource && playerCore?.value?.type !== PlayerCoreType.Hls) {
          await initializeVideo(hlsSource, undefined, lastTime ?? 0)
        }

        return
      }

      throw error
    }
  }

  /** 切换视频源 */
  const changeQuality = async (source: VideoSource) => {
    if (!playerCore.value) {
      throw new Error('player is not found')
    }
    /** 记住当前播放时间和播放状态 */
    const currentTime = playerCore.value.currentTime || 0

    /** 保存画质偏好 */
    const videoId = ctx.rootProps.videoId
    if (videoId) {
      try {
        await qualityPreferenceCache.setPreference(
          videoId,
          source.quality,
          source.displayQuality,
        )
        console.log(`💾 画质偏好已保存: ${source.quality}P (${source.displayQuality || source.quality})`)
      }
      catch (error) {
        console.error('保存画质偏好失败:', error)
      }
    }

    // 初始化新视频驱动
    await initializeVideo(source)

    // 恢复播放时间和状态
    playerCore.value.seek(currentTime)
  }

  /** 中断源 */
  const interruptSource = () => {
    isInterrupt.value = true
    if (playerCore.value) {
      playerCore.value
        .destroy()
        .catch((e: Error) => console.error('销毁播放器失败:', e))
    }
  }

  /** 恢复源 */
  const resumeSource = () => {
    isInterrupt.value = false
    initializeVideo(current.value!)
  }

  /** 切换播放器核心的实际实现 */
  const switchPlayerCoreImpl = async (type: PlayerCoreType) => {
    if (isSwitching.value) {
      console.warn('正在切换播放器核心，忽略此次操作')
      return
    }

    if (!current.value) {
      throw new Error('当前没有视频源')
    }

    isSwitching.value = true

    try {
      const currentTime = playerCore.value?.currentTime || 0
      const wasPaused = playerCore.value?.paused ?? true

      // 确保当前播放器完全停止
      if (playerCore.value && !playerCore.value.paused) {
        await playerCore.value.pause()
      }

      await initializeVideo(current.value, type)

      if (playerCore.value) {
        await playerCore.value.seek(currentTime)

        // 恢复播放状态
        if (!wasPaused) {
          await playerCore.value.play()
        }
      }
    }
    finally {
      isSwitching.value = false
    }
  }

  /** 使用防抖的切换播放器核心方法 */
  const switchPlayerCore = useDebounceFn(switchPlayerCoreImpl, 300)

  watch(
    list,
    async () => {
      isInterrupt.value = false
      if (list.value.length === 0) {
        await ctx.playerCore.value?.destroy()
        return
      }

      /** 根据画质偏好选择初始视频源 */
      const preferredSource = await getPreferredVideoSource()
      if (preferredSource) {
        await initializeVideo(
          preferredSource,
          undefined,
          toValue(ctx.rootProps.lastTime),
        )
      }
    },
    { immediate: true, deep: true },
  )

  return {
    list,
    current,
    changeQuality,
    interruptSource,
    resumeSource,
    isInterrupt,
    isSwitching,
    switchPlayerCore,
  }
}
