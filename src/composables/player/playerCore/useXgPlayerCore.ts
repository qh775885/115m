import type { PlayerContext } from '../usePlayerProvide'
import type { PlayerCoreMethods } from './types'
import { shallowRef } from 'vue'
import Player from 'xgplayer'
import Mp4Plugin from 'xgplayer-mp4'
import { PlayerCoreType } from './types'
import { usePlayerCoreState } from './usePlayerCoreState'
import 'xgplayer/dist/index.min.css'

/**
 * XgPlayer 播放器核心
 */
export function useXgPlayerCore(_ctx: PlayerContext) {
  /** 视频元素 */
  const renderElementRef = shallowRef<HTMLVideoElement>()
  /** XgPlayer 实例 */
  const instance = shallowRef<Player>()
  /** 状态 */
  const state = usePlayerCoreState()
  /** 容器元素 */
  let containerRef: HTMLElement | null = null

  /** 初始化播放器实例 */
  const initPlayer = (url: string) => {
    if (instance.value) {
      instance.value.destroy()
      instance.value = undefined
    }

    if (!containerRef)
      return

    /** 实例化 XgPlayer，集成 MP4 插件 */
    const player = new Player({
      el: containerRef,
      url,
      width: '100%',
      height: '100%',
      controls: false, // 使用自定义 UI
      autoplay: state.autoPlay.value,
      volume: state.volume.value / 100,
      playbackRate: [0.5, 0.75, 1, 1.5, 2],
      videoInit: true,
      plugins: [Mp4Plugin], // 启用 MP4 插件
      mp4plugin: {
        reqOptions: {
          mode: 'cors',
        },
        active: true, // 强制启用
      },
      // 允许跨域
      cors: true,
    })

    instance.value = player

    // 获取 video 元素引用
    if (player.video) {
      renderElementRef.value = player.video as HTMLVideoElement
    }

    // 事件监听映射
    player.on('play', () => state.paused.value = false)
    player.on('pause', () => state.paused.value = true)
    player.on('playing', () => state.paused.value = false)
    player.on('ended', () => state.paused.value = true)
    player.on('waiting', () => state.isLoading.value = true)
    player.on('canplay', () => {
      state.isLoading.value = false
      state.canplay.value = true
      if (player.video && !renderElementRef.value) {
        renderElementRef.value = player.video as HTMLVideoElement
      }
    })
    player.on('seeking', () => state.isLoading.value = true)
    player.on('seeked', () => state.isLoading.value = false)
    player.on('timeupdate', () => {
      state.currentTime.value = player.currentTime
    })
    player.on('durationchange', () => {
      state.duration.value = player.duration
    })
    player.on('error', (err: any) => {
      console.error('XgPlayer error:', err)
      // 如果是 demux 错误，可能需要降级（xgplayer 会自动处理一部分，但这里我们记录一下）
      state.loadError.value = new Error(err.message || 'XgPlayer unknown error')
    })
  }

  const methods: PlayerCoreMethods = {
    init: async (container) => {
      /** 创建容器元素 */
      const videoContainer = document.createElement('div')
      videoContainer.id = 'xgplayer-container'
      videoContainer.style.width = '100%'
      videoContainer.style.height = '100%'
      container.appendChild(videoContainer)
      containerRef = videoContainer

      // 注意：这里不再立即 new Player，因为没有 URL 会导致 empty src 错误
      return Promise.resolve()
    },

    load: async (url, lastTime) => {
      // 每次 load 都重新初始化播放器，这是最稳妥的方式避免插件状态混乱
      initPlayer(url)

      const player = instance.value
      if (!player)
        return

      // 更新状态
      methods.setVolume(state.volume.value)
      methods.setMute(state.muted.value)
      // 初始化倍速
      methods.setPlaybackRate(state.playbackRate.value)

      /** 如果有上次播放时间，需要在加载后跳转 */
      const seekHandler = () => {
        if (lastTime && lastTime > 0) {
          player.currentTime = lastTime
        }
        if (state.autoPlay.value) {
          player.play().catch(() => { })
        }
      }

      const video = player.video as HTMLVideoElement
      if (video && video.readyState > 0) {
        seekHandler()
      }
      else {
        player.once('canplay', seekHandler)
        player.once('loadeddata', seekHandler)
      }

      return Promise.resolve()
    },

    getRenderElement: () => renderElementRef.value || null,

    play: async () => {
      await instance.value?.play()
      state.paused.value = false
    },

    pause: async () => {
      instance.value?.pause()
      state.paused.value = true
    },

    togglePlay: async () => {
      if (state.paused.value) {
        await methods.play()
      }
      else {
        await methods.pause()
      }
    },

    setPlaybackRate: (rate) => {
      const player = instance.value
      // 记录状态，无论 player 是否存在
      state.playbackRate.value = rate
      if (player) {
        player.playbackRate = rate
      }
    },

    setVolume: (volume) => {
      const player = instance.value
      state.volume.value = volume
      if (player) {
        player.volume = volume / 100
      }
    },

    setMute: (muted) => {
      const player = instance.value
      state.muted.value = muted
      if (player) {
        player.muted = muted
      }
    },

    toggleMute: () => {
      methods.setMute(!state.muted.value)
    },

    resumeSuspended: async () => {
      const player = instance.value
      if (player) {
        player.muted = false
        state.isSuspended.value = false
      }
    },

    setAutoPlay: (autoPlay) => {
      // state.autoPlay.value = autoPlay
      // xgplayer 动态设置 autoplay 可能无效，主要依靠 load 时的逻辑
      state.autoPlay.value = autoPlay
    },

    seek: async (time) => {
      const player = instance.value
      if (player) {
        player.currentTime = time
        state.currentTime.value = time
      }
    },

    on: (_event, _callback) => {
      // 留空，通过 State 响应式驱动
    },

    destroy: async () => {
      const player = instance.value
      if (player) {
        player.destroy()
        instance.value = undefined
        renderElementRef.value = undefined
      }
      if (containerRef) {
        containerRef.remove()
        containerRef = null
      }
      state.reset()
    },
  }

  return {
    ...state,
    ...methods,
    renderElementRef,
    type: PlayerCoreType.XgPlayer,
  }
}
