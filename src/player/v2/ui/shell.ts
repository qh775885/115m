import './theme.css'
import { createTopBar } from './topbar'
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

  // 1. 顶部 Header 骨架（左上角信息与面包屑，右上角三联操作）
  const topbar = createTopBar({
    title: '色，戒 (2007) · 完整无删减版',
    indexText: '01',
    statsText: '33.17 GB · 1080P',
    breadcrumbs: [
      { cid: '0', name: '全部文件' },
      { cid: '1', name: '我的影视库' },
      { cid: '2', name: '经典华语电影' },
      { cid: '3', name: '色戒' },
    ],
    isFavorite: false,
    onBack: () => window.history.back(),
    onBreadcrumbClick: (item) => {
      alert(`[2.0 骨架交互] 点击面包屑返回目录: ${item.name} (cid: ${item.cid})`)
    },
    onToggleFavorite: (marked) => {
      alert(`[2.0 骨架交互] ${marked ? '已加入星标收藏' : '已取消星标'}`)
    },
    onMove: () => alert('[2.0 骨架交互] 移动到网盘目录'),
    onDownload: () => alert('[2.0 骨架交互] 下载原画视频'),
    onDelete: () => alert('[2.0 骨架交互] 删除当前视频文件'),
  })
  root.appendChild(topbar.element)

  // 2. 底部控制区（贴底时间轴 + 底栏三区域）
  const bottomArea = document.createElement('div')
  bottomArea.className = 'm115-v2-bottom-area'

  // 时间轴
  const timeline = createTimeline({
    onSeek: (percent) => {
      const video = ctx.playerEl.querySelector('video') as HTMLVideoElement | null
      if (video && video.duration) {
        video.currentTime = percent * video.duration
      }
    },
  })
  bottomArea.appendChild(timeline.element)

  // 通用微卡片弹层 (Sheet)
  const sheet = createFloatingSheet()
  root.appendChild(sheet.element)

  // 右侧选集抽屉 (Drawer)
  const drawer = createEpisodeDrawer({
    onSelect: (ep) => {
      alert(`[2.0 骨架交互] 点击跳播: ${ep.name}`)
      drawer.close()
    },
  })
  root.appendChild(drawer.element)

  drawer.setEpisodes([
    { id: 1, name: '第 01 集 · 破晓入局', sub: '1080P · 42 分钟' },
    { id: 2, name: '第 02 集 · 暗潮汹涌', sub: '1080P · 45 分钟' },
    { id: 3, name: '第 03 集 · 绝密交锋', sub: '1080P · 48 分钟' },
    { id: 4, name: '第 04 集 · 迷局追踪', sub: '1080P · 41 分钟' },
    { id: 5, name: '第 05 集 · 终极抉择', sub: '1080P · 50 分钟' },
  ], 1)

  // 底部控制行（左时间音量、中上一集大播放下一集、右功能菜单）
  const controls = createBottomControls({
    onTogglePlay: () => {
      const video = ctx.playerEl.querySelector('video') as HTMLVideoElement | null
      if (video) {
        if (video.paused) video.play()
        else video.pause()
      }
    },
    onPrev: () => alert('[2.0 骨架交互] 播放上一集 ( [ )'),
    onNext: () => alert('[2.0 骨架交互] 播放下一集 ( ] )'),
    onVolumeChange: (vol) => {
      const video = ctx.playerEl.querySelector('video') as HTMLVideoElement | null
      if (video) {
        video.volume = vol
        controls.setVolume(vol, video.muted)
      }
    },
    onToggleMute: () => {
      const video = ctx.playerEl.querySelector('video') as HTMLVideoElement | null
      if (video) {
        video.muted = !video.muted
        controls.setVolume(video.volume, video.muted)
      }
    },
    onModeClick: () => {
      sheet.open('播放模式', [
        { id: 'sequence', label: '顺序播放', badge: '默认' },
        { id: 'loop-one', label: '单集循环' },
        { id: 'loop-all', label: '列表循环' },
      ], 'sequence', (item) => {
        alert(`[2.0 骨架交互] 切换模式: ${item.label}`)
      })
    },
    onRotateClick: () => {
      alert('[2.0 骨架交互] 画面顺时针旋转 90°')
    },
    onQualityClick: () => {
      sheet.open('切换画质', [
        { id: 'origin', label: '115 原画直链', badge: '最高质量' },
        { id: 'uhd', label: '4K 超高清', badge: '转码' },
        { id: 'fhd', label: '1080P 全高清' },
        { id: 'hd', label: '720P 高清' },
      ], 'origin', (item) => {
        controls.setQuality(item.label.split(' ')[0])
      })
    },
    onAudioTrackClick: () => {
      sheet.open('多音频轨道', [
        { id: 1, label: '国语原声 (Dolby 5.1)', badge: '当前' },
        { id: 2, label: '粤语原声 (Stereo)' },
        { id: 3, label: '英语伴音 (AAC)' },
      ], 1, (item) => {
        alert(`[2.0 骨架交互] 切换音轨: ${item.label}`)
      })
    },
    onSubtitleClick: () => {
      sheet.open('字幕选择与样式', [
        { id: 'sub1', label: '内置中文字幕 (ASS)', badge: '特效' },
        { id: 'sub2', label: '外挂双语字幕 (SRT)' },
        { id: 'off', label: '关闭字幕' },
      ], 'sub1', (item) => {
        alert(`[2.0 骨架交互] 切换字幕: ${item.label}`)
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
        controls.setSpeed(String(item.id) + 'x')
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
  bottomArea.appendChild(controls.element)
  root.appendChild(bottomArea)

  // 3. 驱动底层播放进度
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
      controls.setPlaying(true)
    })

    video.addEventListener('pause', () => {
      controls.setPlaying(false)
      root.classList.remove('idle')
    })
  }

  // 4. 鼠标空闲 2.5 秒淡出
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
    timeline,
    controls,
  }
}
