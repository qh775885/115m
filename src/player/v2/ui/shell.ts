import './theme.css'
import { createTopBar } from './topbar'
import { createEpisodeDrawer } from './drawer'
import { createFloatingSheet } from './sheet'
import { Icons } from '../../../shared/icons'

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

  // 1. 顶部 Header 骨架（左上角信息与面包屑，右上角三联操作与星标）
  const topbar = createTopBar({
    title: '色，戒 (2007) · 完整无删减版',
    indexText: '01',
    statsText: '33.17 GB · 原画',
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

  // 2. 通用微卡片弹层 (Sheet)
  const sheet = createFloatingSheet()
  root.appendChild(sheet.element)

  // 3. 右侧选集抽屉 (Drawer)
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

  // 4. 底部控制区（全宽时间轴 + 黄金水平行）
  const bottomArea = document.createElement('div')
  bottomArea.className = 'm115-v2-bottom-area'

  // 全宽时间轴
  const timelineContainer = document.createElement('div')
  timelineContainer.className = 'm115-v2-timeline-container'
  timelineContainer.innerHTML = `
    <div class="m115-v2-timeline-track">
      <div class="m115-v2-timeline-buffer" style="width: 0%;"></div>
      <div class="m115-v2-timeline-progress" style="width: 0%;">
        <div class="m115-v2-timeline-thumb"></div>
      </div>
    </div>
  `
  bottomArea.appendChild(timelineContainer)

  const progressEl = timelineContainer.querySelector('.m115-v2-timeline-progress') as HTMLElement
  const bufferEl = timelineContainer.querySelector('.m115-v2-timeline-buffer') as HTMLElement
  const trackEl = timelineContainer.querySelector('.m115-v2-timeline-track') as HTMLElement

  let isDragging = false
  const getPercent = (e: MouseEvent) => {
    const rect = trackEl.getBoundingClientRect()
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  }

  timelineContainer.addEventListener('mousedown', (e) => {
    isDragging = true
    const p = getPercent(e)
    progressEl.style.width = `${p * 100}%`
    const video = ctx.playerEl.querySelector('video') as HTMLVideoElement | null
    if (video && video.duration) video.currentTime = p * video.duration

    const onMove = (moveEvt: MouseEvent) => {
      if (!isDragging) return
      const mp = getPercent(moveEvt)
      progressEl.style.width = `${mp * 100}%`
      if (video && video.duration) video.currentTime = mp * video.duration
    }
    const onUp = () => {
      isDragging = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  })

  // 底部控制横行
  const controlsRow = document.createElement('div')
  controlsRow.className = 'm115-v2-controls-row'

  controlsRow.innerHTML = `
    <!-- 左侧：时间码与音量 -->
    <div class="m115-v2-left-cluster">
      <div class="m115-v2-time-display">00:00:00 / 00:00:00</div>

      <div class="m115-v2-volume-cluster">
        <button class="m115-v2-ctrl-icon-btn m115-vol-btn" style="border:none;background:transparent;width:24px;height:24px;" title="静音 / 取消静音 ( M )">
          ${Icons.Volume2()}
        </button>
        <div class="m115-v2-volume-slider-wrap">
          <input type="range" class="m115-v2-volume-slider" min="0" max="100" value="100">
        </div>
      </div>
    </div>

    <!-- 中间：上一集 + 居中主播放大键 + 下一集 -->
    <div class="m115-v2-center-cluster">
      <button class="m115-v2-nav-btn m115-prev-btn" title="上一集 ( [ )">
        ${Icons.SkipBack()}
      </button>
      <button class="m115-v2-center-play-btn" title="播放 / 暂停 ( 空格 )">
        ${Icons.Pause()}
      </button>
      <button class="m115-v2-nav-btn m115-next-btn" title="下一集 ( ] )">
        ${Icons.SkipForward()}
      </button>
    </div>

    <!-- 右侧：高频功能群 -->
    <div class="m115-v2-right-cluster">
      <button class="m115-v2-ctrl-icon-btn m115-mode-btn" title="播放模式">
        ${Icons.Repeat()}
      </button>
      <button class="m115-v2-ctrl-icon-btn m115-rotate-btn" title="画面旋转 90°">
        ${Icons.RotateCw()}
      </button>
      <button class="m115-v2-ctrl-btn m115-quality-btn">原画</button>
      <button class="m115-v2-ctrl-btn m115-audio-btn">
        ${Icons.MediaTrack()}
        <span>音轨</span>
      </button>
      <button class="m115-v2-ctrl-btn m115-subtitle-btn">字幕</button>
      <button class="m115-v2-ctrl-btn m115-speed-btn">1.0x</button>
      <button class="m115-v2-ctrl-btn m115-playlist-btn">
        ${Icons.Playlist()}
        <span>选集</span>
      </button>
      <button class="m115-v2-ctrl-icon-btn m115-fullscreen-btn" title="全屏 ( F )">
        ${Icons.Fullscreen()}
      </button>
    </div>
  `

  bottomArea.appendChild(controlsRow)
  root.appendChild(bottomArea)

  // 绑定底栏元素事件
  const timeDisplay = controlsRow.querySelector('.m115-v2-time-display') as HTMLElement
  const playBtn = controlsRow.querySelector('.m115-v2-center-play-btn') as HTMLElement
  const volBtn = controlsRow.querySelector('.m115-vol-btn') as HTMLElement
  const volSlider = controlsRow.querySelector('.m115-v2-volume-slider') as HTMLInputElement

  playBtn.onclick = () => {
    const video = ctx.playerEl.querySelector('video') as HTMLVideoElement | null
    if (video) {
      if (video.paused) video.play()
      else video.pause()
    }
  }

  volBtn.onclick = () => {
    const video = ctx.playerEl.querySelector('video') as HTMLVideoElement | null
    if (video) {
      video.muted = !video.muted
      volBtn.innerHTML = video.muted ? Icons.VolumeX() : Icons.Volume2()
    }
  }

  volSlider.oninput = () => {
    const video = ctx.playerEl.querySelector('video') as HTMLVideoElement | null
    if (video) {
      const val = Number(volSlider.value) / 100
      video.volume = val
      video.muted = (val === 0)
      volBtn.innerHTML = (val === 0) ? Icons.VolumeX() : Icons.Volume2()
    }
  }

  controlsRow.querySelector('.m115-prev-btn')?.addEventListener('click', () => {
    alert('[2.0 骨架交互] 播放上一集 ( [ )')
  })
  controlsRow.querySelector('.m115-next-btn')?.addEventListener('click', () => {
    alert('[2.0 骨架交互] 播放下一集 ( ] )')
  })
  controlsRow.querySelector('.m115-mode-btn')?.addEventListener('click', () => {
    sheet.open('播放模式', [
      { id: 'sequence', label: '顺序播放', badge: '默认' },
      { id: 'loop-one', label: '单集循环' },
      { id: 'loop-all', label: '列表循环' },
    ], 'sequence', (item) => {
      alert(`[2.0 骨架交互] 切换模式: ${item.label}`)
    })
  })
  controlsRow.querySelector('.m115-rotate-btn')?.addEventListener('click', () => {
    alert('[2.0 骨架交互] 画面顺时针旋转 90°')
  })

  const qualityBtn = controlsRow.querySelector('.m115-quality-btn') as HTMLElement
  qualityBtn.onclick = () => {
    sheet.open('切换画质', [
      { id: 'origin', label: '115 原画直链', badge: '无损' },
      { id: 'uhd', label: '4K 超高清', badge: '转码' },
      { id: 'fhd', label: '1080P 全高清' },
      { id: 'hd', label: '720P 高清' },
    ], 'origin', (item) => {
      qualityBtn.textContent = item.label.split(' ')[0]
    })
  }

  controlsRow.querySelector('.m115-audio-btn')?.addEventListener('click', () => {
    sheet.open('多音频轨道', [
      { id: 1, label: '国语原声 (Dolby 5.1)', badge: '当前' },
      { id: 2, label: '粤语原声 (Stereo)' },
      { id: 3, label: '英语伴音 (AAC)' },
    ], 1, (item) => {
      alert(`[2.0 骨架交互] 切换音轨: ${item.label}`)
    })
  })

  controlsRow.querySelector('.m115-subtitle-btn')?.addEventListener('click', () => {
    sheet.open('字幕选择与样式', [
      { id: 'sub1', label: '内置中文字幕 (ASS)', badge: '特效' },
      { id: 'sub2', label: '外挂双语字幕 (SRT)' },
      { id: 'off', label: '关闭字幕' },
    ], 'sub1', (item) => {
      alert(`[2.0 骨架交互] 选择字幕: ${item.label}`)
    })
  })

  const speedBtn = controlsRow.querySelector('.m115-speed-btn') as HTMLElement
  speedBtn.onclick = () => {
    sheet.open('播放速度', [
      { id: 0.75, label: '0.75x' },
      { id: 1.0, label: '1.0x 标准' },
      { id: 1.25, label: '1.25x' },
      { id: 1.5, label: '1.5x' },
      { id: 2.0, label: '2.0x 倍速' },
    ], 1.0, (item) => {
      speedBtn.textContent = String(item.id) + 'x'
      const video = ctx.playerEl.querySelector('video') as HTMLVideoElement | null
      if (video) video.playbackRate = Number(item.id)
    })
  }

  controlsRow.querySelector('.m115-playlist-btn')?.addEventListener('click', () => {
    drawer.toggle()
  })

  controlsRow.querySelector('.m115-fullscreen-btn')?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      ctx.playerEl.requestFullscreen().catch(() => {})
    }
    else {
      document.exitFullscreen().catch(() => {})
    }
  })

  // 5. 驱动底层播放进度
  const bindVideo = () => {
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
        if (!isDragging) {
          progressEl.style.width = `${(video.currentTime / video.duration) * 100}%`
        }
        timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`
      }
    })

    video.addEventListener('progress', () => {
      if (video.buffered.length > 0 && video.duration) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        bufferEl.style.width = `${(bufferedEnd / video.duration) * 100}%`
      }
    })

    video.addEventListener('play', () => {
      playBtn.innerHTML = Icons.Pause()
    })

    video.addEventListener('pause', () => {
      playBtn.innerHTML = Icons.Play()
      root.classList.remove('idle')
    })
  }

  // 6. 鼠标空闲 2.5 秒淡出控制层
  let idleTimer: any = null
  const resetIdle = () => {
    root.classList.remove('idle')
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      const video = ctx.playerEl.querySelector('video') as HTMLVideoElement | null
      const isMenuOpen = sheet.isOpen() || drawer.isOpen()
      if (video && !video.paused && !isMenuOpen) {
        root.classList.add('idle')
      }
    }, 2500)
  }

  ctx.playerEl.addEventListener('mousemove', resetIdle)
  ctx.playerEl.addEventListener('mouseenter', resetIdle)

  // 挂载到容器
  ctx.playerEl.appendChild(root)

  setTimeout(() => {
    bindVideo()
  }, 300)

  return {
    root,
    topbar,
  }
}
