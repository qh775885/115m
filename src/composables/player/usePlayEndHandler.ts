import type { PlayerContext } from './usePlayerProvide'
import { PlayMode } from '../../constants/playMode'
import { error, warn } from '../../utils/logger'

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
      warn('播放列表或当前播放码获取函数未提供')
      return null
    }

    const playlist = getCurrentPlaylist()
    const currentPickCode = getCurrentPickCode()

    if (!playlist?.data || playlist.data.length === 0) {
      return null
    }

    const currentIndex = playlist.data.findIndex((item: { pc: string }) => item.pc === currentPickCode)
    if (currentIndex === -1) {
      warn('当前视频不在播放列表中')
      return null
    }

    const nextIndex = currentIndex + 1
    if (nextIndex >= playlist.data.length) {
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
      error('播放器核心不存在')
      return
    }

    switch (playMode) {
      case PlayMode.STOP:
        break

      case PlayMode.REPEAT_ONE:
        try {
          await playerCore.seek(0)
          await playerCore.play()
        }
        catch (err) {
          error('重播失败:', err)
        }
        break

      case PlayMode.AUTO_NEXT: {
        const nextPickCode = getNextVideo()

        if (nextPickCode) {
          const onChangeVideo = ctx.rootProps.onChangeVideo
          if (onChangeVideo) {
            try {
              await onChangeVideo(nextPickCode)
            }
            catch (err) {
              error('切换到下一集失败:', err)
            }
          }
          else {
            error('视频切换回调函数未提供')
          }
        }
        break
      }

      default:
        warn(`未知播放模式: ${playMode}`)
    }
  }

  return {
    handlePlayEnd,
    getNextVideo,
  }
}
