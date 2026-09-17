import './theme.css'
import { createTopBar } from './topbar'
import { createCenterCapsule } from './center'
import { createTimeline } from './timeline'
import { createBottomControls } from './controls'
import { createFloatingSheet } from './sheet'
import { createEpisodeDrawer } from './drawer'

export interface AuroraShellContext {
  playerEl: HTMLElement
  videoEl?: HTMLVideoElement | null
}

export function mountAuroraShell(ctx: AuroraShellContext) {
  const root = document.createElement('div')
  root.className = 'm115-v2-shell'

  // 上下暗部渐变遮罩
  const maskTop = document.createElement('div')
  maskTop.className = 'm115-v2-mask-top'
  const maskBottom = document.createElement('div')
  maskBottom.className = 'm115-v2-mask-bottom'

  root.appendChild(maskTop)
  root.appendChild(maskBottom)

  // 1. 顶部栏
  const topbar = createTopBar({
    title: '色，戒 (2007) · 完整无删减版',
    badgeText: '4K 原画 33.2GB',
    onBack: () => window.history.back(),
    onDownload: () => alert('[2.0 视觉壳演示] 下载原画视频'),
    onMove: () => alert('[2.0 视觉壳演示] 移动到网盘目录'),
  })
  root.appendChild(topbar.element)

  // 2. 居中主控微气泡胶囊
  const center = createCenterCapsule({
    onPrev: () => alert('[2.0 视觉壳演示] 切换上一集'),
    onTogglePlay: () => {
      const video = ctx.playerEl.querySelector('video') as HTMLVideoElement | null
      if (video) {
        if (video.paused) video.play()
        else video.pause()
      }
    },
    onNext: () => alert('[2.0 视觉壳演示] 切换下一集'),
  })
  root.appendChild(center.element)

  // 3. 贴底极光流光时间轴
  const timeline = createTimeline({
    onSeek: (percent) => {
      const video = ctx.playerEl.querySelector('video') as HTMLVideoElement | null
      if (video && video.duration) {
        video.currentTime = percent * video.duration
      }
    },
  })
  root.appendChild(timeline.element)

  // 4. 通用向上浮层微卡片面板
  const sheet = createFloatingSheet()
  root.appendChild(sheet.element)

  // 5. 右侧选集无感抽屉
  const drawer = createEpisodeDrawer({
    onSelect: (ep) => {
      alert(`[2.0 视觉壳演示] 点击跳播: ${ep.name}`)
      drawer.close()
    },
  })
  root.appendChild(drawer.element)

  // 填充示例选集数据以供零审阅视觉效果
  drawer.setEpisodes([
    { id: 1, name: '第 01 集 · 破晓入局', sub: '1080P · 42 分钟' },
    { id: 2, name: '第 02 集 · 暗潮汹涌', sub: '1080P · 45 分钟' },
    { id: 3, name: '第 03 集 · 绝密交锋', sub: '1080P · 48 分钟' },
    { id: 4, name: '第 04 集 · 迷局追踪', sub: '1080P · 41 分钟' },
    { id: 5, name: '第 05 集 · 终极抉择', sub: '1080P · 50 分钟' },
  ], 1)

  // 6. 底部控制栏
  const controls = createBottomControls({
    onTogglePlay: () => {
      const video = ctx.playerEl.querySelector('video') as HTMLVideoElement | null
      if (video) {
        if (video.paused) video.play()
        else video.pause()
      }
    },
    onVolumeChange: (vol) => {
      const video = ctx.playerEl.querySelector('video') as HTMLVideoElement | null
      if (video) video.volume = vol
    },
    onToggleMute: () => {
      const video = ctx.playerEl.querySelector('video') as HTMLVideoElement | null
      if (video) video.muted = !video.muted
    },
    onQualityClick: () => {
      sheet.open('切换画质', [
        { id: 'origin', label: '115 原画直链', badge: '最高质量' },
        { id: 'uhd', label: '4K 超高清', badge: '转码' },
        { id: 'fhd', label: '1080P 全高清' },
        { id: 'hd', label: '720P 高清' },
      ], 'origin', (item) => {
        controls.setQualityLabel(item.label.split(' ')[0])
      })
    },
    onAudioTrackClick: () => {
      sheet.open('多音频轨道', [
        { id: 1, label: '国语原声 (Dolby 5.1)', badge: '当前' },
        { id: 2, label: '粤语原声 (Stereo)' },
        { id: 3, label: '英语伴音 (AAC)' },
      ], 1, (item) => {
        alert(`[2.0 视觉壳演示] 切换音轨: ${item.label}`)
      })
    },
    onSubtitleClick: () => {
      sheet.open('字幕轨道与样式', [
        { id: 'sub1', label: '内置中文字幕 (ASS)', badge: '特效' },
        { id: 'sub2', label: '外挂双语字幕 (SRT)' },
        { id: 'off', label: '关闭字幕' },
      ], 'sub1', (item) => {
        alert(`[2.0 视觉壳演示] 字幕选择: ${item.label}`)
      })
    },
    onSpeedClick: () => {
      sheet.open('播放速度', [
        { id: 0.75, label: '0.75x' },
        { id: 1.0, label: '1.0x 标准' },
        { id: 1.25, label: '1.25x' },
        { id: 1.5, label: '1.5x' },
        { id: 2.0, label: '2.0x 倍速' },
      ], 1.0, (item) => {
        controls.setSpeedLabel(String(item.id) + 'x')
        const video = ctx.playerEl.querySelector('video') as HTMLVideoElement | null
        if (video) video.playbackRate = Number(item.id)
      })
    },
    onPlaylistClick: () => {
      drawer.toggle()
    },
    onFullscreenClick: () => {
      if (!document.fullscreenElement) {
        ctx.playerEl.requestFullscreen().catch(() => {})
      }
      else {
        document.exitFullscreen().catch(() => {})
      }
    },
  })
  root.appendChild(controls.element)

  // 7. 绑定底层视频状态到 UI 呈现
  const bindVideoListeners = () => {
    const video = ctx.playerEl.querySelector('video') as HTMLVideoElement | null
    if (!video) return

    const formatTime = (seconds: number) => {
      const s = Math.floor(seconds % 60).toString().padStart(2, '0')
      const m = Math.floor((seconds / 60) % 60).toString().padStart(2, '0')
      const h = Math.floor(seconds / 3600)
      return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`
    }

    video.addEventListener('timeupdate', () => {
      if (video.duration) {
        timeline.setProgress(video.currentTime / video.duration)
        controls.setTime(formatTime(video.currentTime), formatTime(video.duration))
      }
    })

    video.addEventListener('progress', () => {
      if (video.buffered.length > 0 && video.duration) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        timeline.setBuffer(bufferedEnd / video.duration)
      }
    })

    video.addEventListener('play', () => {
      center.setPlaying(true)
      controls.setPlaying(true)
    })

    video.addEventListener('pause', () => {
      center.setPlaying(false)
      controls.setPlaying(false)
      root.classList.remove('idle')
    })
  }

  // 8. 鼠标空闲自动平滑淡出控制层
  let idleTimer: any = null
  const resetIdle = () => {
    root.classList.remove('idle')
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      const video = ctx.playerEl.querySelector('video') as HTMLVideoElement | null
      if (video && !video.paused && !sheet.isOpen() && !drawer.isOpen()) {
        root.classList.add('idle')
      }
    }, 2500)
  }

  ctx.playerEl.addEventListener('mousemove', resetIdle)
  ctx.playerEl.addEventListener('mouseenter', resetIdle)

  // 挂载到容器
  ctx.playerEl.appendChild(root)

  setTimeout(() => {
    bindVideoListeners()
  }, 500)

  return {
    root,
    topbar,
    center,
    timeline,
    controls,
  }
}
