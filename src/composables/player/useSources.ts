import type { VideoSource } from '../../components/XPlayer/types'
import type { PlayerContext } from './usePlayerProvide'
import { ref, shallowRef, toValue, watch } from 'vue'

import { playerCorePreferenceCache, qualityPreferenceCache } from '../../utils/cache'
import { error, log, warn } from '../../utils/logger'
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
        log(`使用画质偏好: ${preference.quality}P`)
        return preferredSource
      }
      else {
        warn(`画质偏好 ${preference.quality}P 不存在，使用默认最高画质`)
        return list.value[0]
      }
    }
    catch (err) {
      error('获取画质偏好失败:', err)
      return list.value[0]
    }
  }

  const getDefaultPlayerCore = (source: VideoSource) => {
    /** HLS 格式使用 Hls 核心 */
    if (source.type === 'hls') {
      return PlayerCoreType.Hls
    }
    /** 其他格式默认使用 Native 核心 */
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

    /** 更新当前源 */
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

      /** 初始化播放器 */
      await playerCore.value.init(playerElementRef.value)

      /** 加载视频源 */
      await playerCore.value.load(source.url, lastTime ?? 0)
    }
    catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return
      }
      if (err instanceof Error) {
        const hlsSource = getHlsSource()

        if (hlsSource && playerCore?.value?.type !== PlayerCoreType.Hls) {
          await initializeVideo(hlsSource, undefined, lastTime ?? 0)
        }

        return
      }

      throw err
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
        log(`画质偏好已保存: ${source.quality}P`)
      }
      catch (err) {
        error('保存画质偏好失败:', err)
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
        .catch((e: Error) => error('销毁播放器失败:', e))
    }
  }

  /** 恢复源 */
  const resumeSource = () => {
    isInterrupt.value = false
    initializeVideo(current.value!)
  }

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
        /** 尝试获取保存的核心偏好 */
        let preferredCore: PlayerCoreType | undefined
        const videoId = ctx.rootProps.videoId
        if (videoId) {
          try {
            const corePreference = await playerCorePreferenceCache.getPreference(videoId)
            if (corePreference) {
              preferredCore = corePreference.coreType
              log(`使用播放器核心偏好: ${preferredCore}`)
            }
          }
          catch (err) {
            error('获取播放器核心偏好失败:', err)
          }
        }

        await initializeVideo(
          preferredSource,
          preferredCore,
          toValue(ctx.rootProps.lastTime),
        )
      }
    },
    { immediate: true, deep: true },
  )

  /** 手动切换播放器核心 */
  const switchPlayerCore = async (playerCoreType: PlayerCoreType) => {
    if (!current.value) {
      warn('无法切换播放器核心：当前没有视频源')
      return
    }

    /** 记住当前播放时间 */
    const currentTime = playerCore.value?.currentTime || 0

    log(`手动切换播放器核心: ${playerCore.value?.type} -> ${playerCoreType}`)

    /** 保存核心偏好 */
    const videoId = ctx.rootProps.videoId
    if (videoId) {
      try {
        await playerCorePreferenceCache.setPreference(videoId, playerCoreType)
        log(`播放器核心偏好已保存: ${playerCoreType}`)
      }
      catch (err) {
        error('保存播放器核心偏好失败:', err)
      }
    }

    /** 初始化视频并使用指定的播放器核心 */
    await initializeVideo(current.value, playerCoreType, currentTime)

    /** 恢复播放时间 */
    playerCore.value?.seek(currentTime)
  }

  return {
    list,
    current,
    changeQuality,
    interruptSource,
    resumeSource,
    isInterrupt,
    switchPlayerCore,
  }
}
