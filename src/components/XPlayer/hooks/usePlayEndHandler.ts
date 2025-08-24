import type { PlayerContext } from './usePlayerProvide'
import { PlayMode } from '../../../constants/playMode'

/**
 * 播放结束处理逻辑
 */
export function usePlayEndHandler(ctx: PlayerContext) {
  /**
   * 获取下一集信息
   * @returns 下一集的 pickCode，如果没有下一集则返回 null
   */
  const getNextVideo = (): string | null => {
    /** 从 rootProps 中获取播放列表相关回调 */
    const getCurrentPlaylist = ctx.rootProps.getCurrentPlaylist
    const getCurrentPickCode = ctx.rootProps.getCurrentPickCode

    if (!getCurrentPlaylist || !getCurrentPickCode) {
      console.warn('播放列表或当前播放码获取函数未提供')
      return null
    }

    const playlist = getCurrentPlaylist()
    const currentPickCode = getCurrentPickCode()

    if (!playlist?.data || playlist.data.length === 0) {
      console.log('播放列表为空')
      return null
    }

    const currentIndex = playlist.data.findIndex(item => item.pc === currentPickCode)
    if (currentIndex === -1) {
      console.warn('当前视频不在播放列表中')
      return null
    }

    const nextIndex = currentIndex + 1
    if (nextIndex >= playlist.data.length) {
      console.log('已经是最后一集')
      return null
    }

    return playlist.data[nextIndex].pc
  }

  /**
   * 处理播放结束
   * @param playMode 播放模式
   */
  const handlePlayEnd = async (playMode: PlayMode) => {
    const playerCore = ctx.playerCore.value

    if (!playerCore) {
      console.error('播放器核心不存在')
      return
    }

    console.log(`🎬 视频播放结束，当前播放模式: ${playMode}`)

    switch (playMode) {
      case PlayMode.STOP:
        // 默认行为：停止播放（什么都不做）
        console.log('⏹️ 播放模式：停止')
        break

      case PlayMode.REPEAT_ONE:
        // 重播当前视频
        console.log('🔁 播放模式：单集循环，重新播放当前视频')
        try {
          await playerCore.seek(0)
          await playerCore.play()
        }
        catch (error) {
          console.error('重播失败:', error)
        }
        break

      case PlayMode.AUTO_NEXT: {
        // 自动播放下一集
        console.log('⏭️ 播放模式：自动下一集')
        const nextPickCode = getNextVideo()

        if (nextPickCode) {
          console.log(`🎯 找到下一集: ${nextPickCode}`)
          /** 调用外部提供的切换视频回调 */
          const onChangeVideo = ctx.rootProps.onChangeVideo
          if (onChangeVideo) {
            try {
              await onChangeVideo(nextPickCode)
              console.log('✅ 成功切换到下一集')
            }
            catch (error) {
              console.error('切换到下一集失败:', error)
            }
          }
          else {
            console.error('视频切换回调函数未提供')
          }
        }
        else {
          console.log('📝 没有下一集，播放结束')
        }
        break
      }

      default:
        console.warn(`未知播放模式: ${playMode}`)
    }
  }

  return {
    handlePlayEnd,
    getNextVideo,
  }
}
