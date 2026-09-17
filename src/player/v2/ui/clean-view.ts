/**
 * 115m 2.0 专业现代影院视口装配器
 * 采用顶级流媒体中控标准，彻底抛弃老旧缝合补丁
 * 每一个元素像素级对齐，底层纯净交由 Vidstack 驱动
 */

import themeCss from './theme.css?inline'
import { Icons } from '../../../shared/icons'

export interface BreadcrumbNode {
  cid: string
  name: string
}

export interface CleanViewOptions {
  container: HTMLElement
  playerEl: HTMLElement
  title?: string
  indexText?: string
  statsText?: string
  breadcrumbs?: BreadcrumbNode[]
  isFavorite?: boolean
  onBack?: () => void
  onBreadcrumbClick?: (item: BreadcrumbNode) => void
  onToggleFavorite?: (marked: boolean) => void
  onMove?: () => void
  onDownload?: () => void
  onDelete?: () => void
  onPrev?: () => void
  onNext?: () => void
  onModeClick?: () => void
  onRotateClick?: () => void
  onQualityClick?: () => void
  onAudioClick?: () => void
  onSubtitleClick?: () => void
  onSpeedClick?: () => void
}

function ensureThemeCss() {
  if (typeof document === 'undefined') return
  let style = document.getElementById('m115-v2-clean-style') as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = 'm115-v2-clean-style'
    ;(document.head || document.documentElement).appendChild(style)
  }
  style.textContent = themeCss
}

export function mountCleanView(options: CleanViewOptions) {
  ensureThemeCss()

  const { container, playerEl } = options
  container.innerHTML = ''

  // 1. 视口主根节点 (支持右侧挤压式布局)
  const viewport = document.createElement('div')
  viewport.className = 'm115-v2-viewport'

  // 1.1 主播放核心视口
  const playerPane = document.createElement('div')
  playerPane.className = 'm115-v2-player-pane'

  // 2. 插入 Vidstack 播放器
  playerPane.appendChild(playerEl)

  // 3. 插入上下渐变暗部遮罩
  const maskTop = document.createElement('div')
  maskTop.className = 'm115-v2-mask-top'
  const maskBottom = document.createElement('div')
  maskBottom.className = 'm115-v2-mask-bottom'
  playerPane.appendChild(maskTop)
  playerPane.appendChild(maskBottom)

  // 4. 控制层包裹器
  const overlay = document.createElement('div')
  overlay.className = 'm115-v2-controls-overlay'

  // ───────────────────────────────────────────
  // 4.1 顶部 Header
  // ───────────────────────────────────────────
  const topBar = document.createElement('div')
  topBar.className = 'm115-v2-top-bar'

  topBar.innerHTML = `
    <div class="m115-v2-top-left">
      <button type="button" class="m115-v2-back-btn" title="返回">
        ${Icons.Back()}
      </button>
      <div class="m115-v2-title-cluster">
        <div class="m115-v2-title-row">
          <span class="m115-v2-badge-index">${options.indexText || '01'}</span>
          <span class="m115-v2-title-text">${options.title || '正在读取视频标题...'}</span>
          <button type="button" class="m115-v2-fav-btn ${options.isFavorite ? 'active' : ''}" title="星标收藏">
            ${options.isFavorite ? Icons.StarFilled() : Icons.Star()}
          </button>
          <span class="m115-v2-badge-size">${options.statsText || '33.17GB'}</span>
        </div>
        <div class="m115-v2-crumbs-row"></div>
      </div>
    </div>
    <div class="m115-v2-top-right">
      <div class="m115-v2-pill-actions">
        <button type="button" class="m115-v2-pill-btn m115-btn-move" title="移动目录">
          ${Icons.Move()} <span>移动</span>
        </button>
        <div class="m115-v2-pill-divider"></div>
        <button type="button" class="m115-v2-pill-btn m115-btn-download" title="下载原画">
          ${Icons.Download()} <span>下载</span>
        </button>
        <div class="m115-v2-pill-divider"></div>
        <button type="button" class="m115-v2-pill-btn m115-btn-delete delete" title="删除文件">
          ${Icons.Trash()} <span>删除</span>
        </button>
      </div>
    </div>
  `
  overlay.appendChild(topBar)

  // 渲染面包屑
  const crumbsContainer = topBar.querySelector('.m115-v2-crumbs-row') as HTMLElement
  const renderCrumbs = (crumbs: BreadcrumbNode[]) => {
    crumbsContainer.innerHTML = ''
    crumbs.forEach((crumb, idx) => {
      const node = document.createElement('span')
      node.className = 'm115-v2-crumb-item'
      node.textContent = crumb.name
      node.onclick = () => options.onBreadcrumbClick?.(crumb)
      crumbsContainer.appendChild(node)

      if (idx < crumbs.length - 1) {
        const sep = document.createElement('span')
        sep.className = 'm115-v2-crumb-sep'
        sep.textContent = '>'
        crumbsContainer.appendChild(sep)
      }
    })
  }
  renderCrumbs(options.breadcrumbs || [
    { cid: '0', name: '全部文件' },
    { cid: '1', name: '我的影视库' },
    { cid: '2', name: '经典华语电影' },
    { cid: '3', name: '色戒' },
  ])

  // ───────────────────────────────────────────
  // 4.2 底部 Controls Bar (带时间轴 + 黄金对称排版)
  // ───────────────────────────────────────────
  const bottomBar = document.createElement('div')
  bottomBar.className = 'm115-v2-bottom-bar'

  bottomBar.innerHTML = `
    <!-- 纤细高对比度 115 科技蓝时间轴 -->
    <div class="m115-v2-progress-box">
      <div class="m115-v2-progress-track">
        <div class="m115-v2-progress-buffered" style="width: 0%;"></div>
        <div class="m115-v2-progress-played" style="width: 0%;">
          <div class="m115-v2-progress-thumb"></div>
        </div>
      </div>
    </div>

    <!-- 底栏控件行 -->
    <div class="m115-v2-controls-line">
      <!-- 左侧：播放时间与音量 (时间在前、音量在后，展开时向右舒展不挤压) -->
      <div class="m115-v2-ctrl-left">
        <div class="m115-v2-time-label">
          <span class="m115-v2-time-current">00:00</span>
          <span class="m115-v2-time-sep">/</span>
          <span class="m115-v2-time-duration">00:00</span>
        </div>

        <div class="m115-v2-vol-group">
          <button type="button" class="m115-vol-icon-btn m115-btn-vol" title="静音 / 恢复 (M)">
            ${Icons.Volume2()}
          </button>
          <div class="m115-v2-vol-slider-box">
            <input type="range" class="m115-v2-vol-range" min="0" max="100" value="100" style="--vol: 100%;">
            <span class="m115-v2-vol-percent">100%</span>
          </div>
        </div>
      </div>

      <!-- 中间：上一集 + 居中大播放键 + 下一集 -->
      <div class="m115-v2-ctrl-center">
        <button type="button" class="m115-v2-round-btn m115-btn-prev" title="上一集 ( [ )">
          ${Icons.SkipBack()}
        </button>
        <button type="button" class="m115-v2-main-play-btn" title="播放 / 暂停 ( 空格 )">
          ${Icons.Pause()}
        </button>
        <button type="button" class="m115-v2-round-btn m115-btn-next" title="下一集 ( ] )">
          ${Icons.SkipForward()}
        </button>
      </div>

      <!-- 右侧：一体化黑曜石功能托盘 (完整外壳 + 发丝分割线 + 响应式图标与文字) -->
      <div class="m115-v2-ctrl-right">
        <div class="m115-v2-pill-tray">
          <button type="button" class="m115-tray-btn m115-btn-mode" title="播放模式">
            ${Icons.Repeat()}
          </button>
          <div class="m115-tray-divider"></div>
          <button type="button" class="m115-tray-btn m115-btn-rotate" title="画面旋转 90° ( R )">
            ${Icons.RotateCw()}
          </button>
          <div class="m115-tray-divider"></div>
          <button type="button" class="m115-tray-btn m115-btn-quality" title="切换清晰度">
            ${Icons.Quality()} <span class="m115-btn-text">原画</span>
          </button>
          <div class="m115-tray-divider"></div>
          <button type="button" class="m115-tray-btn m115-btn-audio" title="多音频轨道">
            ${Icons.MediaTrack()} <span class="m115-btn-text">音轨</span>
          </button>
          <div class="m115-tray-divider"></div>
          <button type="button" class="m115-tray-btn m115-btn-subtitle" title="字幕设置">
            ${Icons.Subtitle()} <span class="m115-btn-text">字幕</span>
          </button>
          <div class="m115-tray-divider"></div>
          <button type="button" class="m115-tray-btn m115-btn-speed" title="播放速度">
            <span class="m115-btn-text-speed">1.0x</span>
          </button>
          <div class="m115-tray-divider"></div>
          <button type="button" class="m115-tray-btn m115-btn-fullscreen" title="全屏 ( F )">
            ${Icons.Fullscreen()}
          </button>
        </div>
      </div>
    </div>
  `
  overlay.appendChild(bottomBar)

  // ───────────────────────────────────────────
  // 4.3 浮动微卡片 (Sheet - 具备完整的反向切换、点击外部关闭与 Escape 闭环)
  // ───────────────────────────────────────────
  const sheet = document.createElement('div')
  sheet.className = 'm115-v2-pop-sheet'
  sheet.innerHTML = `
    <div class="m115-v2-pop-header"></div>
    <div class="m115-v2-pop-body" style="display:flex;flex-direction:column;gap:2px;"></div>
  `
  overlay.appendChild(sheet)

  let activeSheetType: string | null = null

  const closeSheet = () => {
    sheet.classList.remove('open')
    activeSheetType = null
  }

  const openSheet = (
    type: string,
    title: string, 
    items: { id: string | number, label: string, badge?: string }[], 
    currentId: any, 
    anchorBtn: HTMLElement | null,
    onPick: (item: any) => void
  ) => {
    // 若再次点击当前已经展开的按钮，则直接反向收回！
    if (activeSheetType === type && sheet.classList.contains('open')) {
      closeSheet()
      return
    }

    activeSheetType = type
    sheet.querySelector('.m115-v2-pop-header')!.textContent = title
    const body = sheet.querySelector('.m115-v2-pop-body') as HTMLElement
    body.innerHTML = ''
    items.forEach((it) => {
      const row = document.createElement('div')
      const isSel = it.id === currentId
      row.className = `m115-v2-pop-item ${isSel ? 'selected' : ''}`
      row.innerHTML = `
        <span class="m115-v2-pop-check" style="opacity:${isSel ? '1' : '0'};">${Icons.Check()}</span>
        <span class="m115-v2-pop-label">${it.label}</span>
        ${it.badge ? `<span class="m115-v2-pop-badge">${it.badge}</span>` : ''}
      `
      row.onclick = (e) => {
        e.stopPropagation()
        onPick(it)
        closeSheet()
      }
      body.appendChild(row)
    })

    sheet.classList.add('open')

    // 根据自适应宽度精准正对居中悬浮在触发按钮正上方
    if (anchorBtn) {
      const rect = anchorBtn.getBoundingClientRect()
      const viewportRect = playerPane.getBoundingClientRect()
      const centerLeft = rect.left - viewportRect.left + rect.width / 2
      const sheetWidth = sheet.offsetWidth || 130
      const maxLeft = viewportRect.width - sheetWidth - 12
      const targetLeft = Math.max(12, Math.min(centerLeft - sheetWidth / 2, maxLeft))
      sheet.style.left = `${Math.round(targetLeft)}px`
      sheet.style.right = 'auto'
    }
  }

  // 点击外部空白区域，自动优雅关闭微卡片面板
  window.addEventListener('click', (e) => {
    if (!sheet.contains(e.target as Node)) {
      closeSheet()
    }
  })

  // ───────────────────────────────────────────
  // 4.4 右侧边缘长扁条纤薄感应轨 (Ultra-slim Long Rail) & 挤压侧边栏
  // ───────────────────────────────────────────
  const toggleHandle = document.createElement('button')
  toggleHandle.type = 'button'
  toggleHandle.className = 'm115-v2-drawer-toggle-handle'
  toggleHandle.title = '播放列表 (快捷收展)'
  toggleHandle.innerHTML = `
    <span class="m115-v2-handle-filament"></span>
  `
  playerPane.appendChild(toggleHandle)

  const playlistAside = document.createElement('aside')
  playlistAside.className = 'm115-v2-playlist-aside'
  playlistAside.innerHTML = `
    <div class="m115-v2-drawer-head">
      <span class="m115-v2-drawer-heading">播放列表 (5)</span>
      <button type="button" class="m115-v2-icon-action m115-drawer-close" style="width:28px;height:28px;" title="收起">
        ${Icons.Close()}
      </button>
    </div>
    <div class="m115-v2-drawer-body"></div>
  `

  const togglePlaylist = (open?: boolean) => {
    const willOpen = open !== undefined ? open : !playlistAside.classList.contains('open')
    playlistAside.classList.toggle('open', willOpen)
    toggleHandle.classList.toggle('open', willOpen)
    viewport.classList.toggle('playlist-open', willOpen)
  }

  toggleHandle.addEventListener('click', (e) => {
    e.stopPropagation()
    togglePlaylist()
  })
  
  playlistAside.querySelector('.m115-drawer-close')?.addEventListener('click', (e) => {
    e.stopPropagation()
    togglePlaylist(false)
  })

  // 按 Escape 快捷键亦可一键收回面板与侧边栏
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (sheet.classList.contains('open')) closeSheet()
      if (playlistAside.classList.contains('open')) togglePlaylist(false)
    }
  })

  const setDrawerEpisodes = (episodes: { id: number, name: string, sub?: string }[], curId: number) => {
    const list = playlistAside.querySelector('.m115-v2-drawer-body') as HTMLElement
    list.innerHTML = ''
    episodes.forEach((ep) => {
      const card = document.createElement('div')
      card.className = `m115-v2-card-item ${ep.id === curId ? 'active' : ''}`
      card.innerHTML = `
        <div class="m115-v2-card-name">${ep.name}</div>
        ${ep.sub ? `<div class="m115-v2-card-meta">${ep.sub}</div>` : ''}
      `
      card.onclick = () => {
        alert(`[115 选集] 点击切换: ${ep.name}`)
      }
      list.appendChild(card)
    })
  }

  setDrawerEpisodes([
    { id: 1, name: '第 01 集 · 破晓入局', sub: '1080P · 42 分钟' },
    { id: 2, name: '第 02 集 · 暗潮汹涌', sub: '1080P · 45 分钟' },
    { id: 3, name: '第 03 集 · 绝密交锋', sub: '1080P · 48 分钟' },
    { id: 4, name: '第 04 集 · 迷局追踪', sub: '1080P · 41 分钟' },
    { id: 5, name: '第 05 集 · 终极抉择', sub: '1080P · 50 分钟' },
  ], 1)

  // ───────────────────────────────────────────
  // 5. 绑定交互事件与底层视频驱动
  // ───────────────────────────────────────────
  const timeLabel = bottomBar.querySelector('.m115-v2-time-label') as HTMLElement
  const playBtn = bottomBar.querySelector('.m115-v2-main-play-btn') as HTMLElement
  const volBtn = bottomBar.querySelector('.m115-btn-vol') as HTMLElement
  const volRange = bottomBar.querySelector('.m115-v2-vol-range') as HTMLInputElement
  const playedBar = bottomBar.querySelector('.m115-v2-progress-played') as HTMLElement
  const bufferBar = bottomBar.querySelector('.m115-v2-progress-buffered') as HTMLElement
  const progressBox = bottomBar.querySelector('.m115-v2-progress-box') as HTMLElement

  // 顶部操作
  topBar.querySelector('.m115-v2-back-btn')?.addEventListener('click', () => options.onBack?.())
  topBar.querySelector('.m115-btn-move')?.addEventListener('click', () => options.onMove?.())
  topBar.querySelector('.m115-btn-download')?.addEventListener('click', () => options.onDownload?.())
  topBar.querySelector('.m115-btn-delete')?.addEventListener('click', () => options.onDelete?.())

  const favBtn = topBar.querySelector('.m115-v2-fav-btn') as HTMLElement
  favBtn.onclick = () => {
    const isAct = !favBtn.classList.contains('active')
    favBtn.classList.toggle('active', isAct)
    favBtn.innerHTML = isAct ? Icons.StarFilled() : Icons.Star()
    options.onToggleFavorite?.(isAct)
  }

  // 播放暂停
  playBtn.onclick = () => {
    const video = playerEl.querySelector('video') as HTMLVideoElement | null
    if (video) {
      if (video.paused) video.play()
      else video.pause()
    }
  }

  const volPercentEl = bottomBar.querySelector('.m115-v2-vol-percent') as HTMLElement | null

  const updateVolUi = (val: number, muted: boolean) => {
    const pct = muted ? 0 : Math.round(val * 100)
    volRange.style.setProperty('--vol', `${pct}%`)
    volRange.value = String(pct)
    volBtn.innerHTML = (muted || pct === 0) ? Icons.VolumeX() : Icons.Volume2()
    if (volPercentEl) volPercentEl.textContent = `${pct}%`
  }

  volBtn.onclick = () => {
    const video = playerEl.querySelector('video') as HTMLVideoElement | null
    if (video) {
      video.muted = !video.muted
      updateVolUi(video.volume, video.muted)
    }
  }

  volRange.oninput = () => {
    const video = playerEl.querySelector('video') as HTMLVideoElement | null
    if (video) {
      const val = Number(volRange.value) / 100
      video.volume = val
      video.muted = (val === 0)
      updateVolUi(val, video.muted)
    }
  }

  // 底部功能群
  bottomBar.querySelector('.m115-btn-prev')?.addEventListener('click', () => options.onPrev?.())
  bottomBar.querySelector('.m115-btn-next')?.addEventListener('click', () => options.onNext?.())

  const modeBtn = bottomBar.querySelector('.m115-btn-mode') as HTMLElement
  modeBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    openSheet('mode', '播放模式', [
      { id: 'sequence', label: '顺序播放', badge: '默认' },
      { id: 'loop-one', label: '单集循环' },
      { id: 'loop-all', label: '列表循环' },
    ], 'sequence', modeBtn, (it) => alert(`[115 模式] ${it.label}`))
  })

  bottomBar.querySelector('.m115-btn-rotate')?.addEventListener('click', () => alert('[115 旋转] 顺时针旋转 90°'))

  const qualityBtn = bottomBar.querySelector('.m115-btn-quality') as HTMLElement
  qualityBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    openSheet('quality', '切换清晰度', [
      { id: 'origin', label: '115 原画直链', badge: '无损' },
      { id: 'uhd', label: '4K 超高清', badge: '转码' },
      { id: 'fhd', label: '1080P 全高清' },
      { id: 'hd', label: '720P 高清' },
    ], 'origin', qualityBtn, (it) => {
      const textSpan = qualityBtn.querySelector('.m115-btn-text')
      if (textSpan) textSpan.textContent = it.label.split(' ')[0]
    })
  })

  const audioBtn = bottomBar.querySelector('.m115-btn-audio') as HTMLElement
  audioBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    openSheet('audio', '多音频轨道', [
      { id: 1, label: '国语原声 (Dolby 5.1)', badge: '当前' },
      { id: 2, label: '粤语原声 (Stereo)' },
      { id: 3, label: '英语伴音 (AAC)' },
    ], 1, audioBtn, (it) => alert(`[115 音轨] 切换至: ${it.label}`))
  })

  const subtitleBtn = bottomBar.querySelector('.m115-btn-subtitle') as HTMLElement
  subtitleBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    openSheet('subtitle', '字幕选择与样式', [
      { id: 'sub1', label: '内置中文字幕 (ASS)', badge: '特效' },
      { id: 'sub2', label: '外挂双语字幕 (SRT)' },
      { id: 'off', label: '关闭字幕' },
    ], 'sub1', subtitleBtn, (it) => alert(`[115 字幕] ${it.label}`))
  })

  const speedBtn = bottomBar.querySelector('.m115-btn-speed') as HTMLElement
  speedBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    openSheet('speed', '播放速度', [
      { id: 0.75, label: '0.75x' },
      { id: 1.0, label: '1.0x 标准' },
      { id: 1.25, label: '1.25x' },
      { id: 1.5, label: '1.5x' },
      { id: 2.0, label: '2.0x 倍速' },
    ], 1.0, speedBtn, (it) => {
      const textSpan = speedBtn.querySelector('.m115-btn-text-speed')
      if (textSpan) textSpan.textContent = String(it.id) + 'x'
      const video = playerEl.querySelector('video') as HTMLVideoElement | null
      if (video) video.playbackRate = Number(it.id)
    })
  })

  bottomBar.querySelector('.m115-btn-playlist')?.addEventListener('click', () => {
    drawer.classList.toggle('open')
  })

  bottomBar.querySelector('.m115-btn-fullscreen')?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      viewport.requestFullscreen().catch(() => {})
    }
    else {
      document.exitFullscreen().catch(() => {})
    }
  })

  // 进度条拖拽
  let isDragging = false
  const getPercent = (e: MouseEvent) => {
    const rect = progressBox.getBoundingClientRect()
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  }

  progressBox.addEventListener('mousedown', (e) => {
    isDragging = true
    const p = getPercent(e)
    playedBar.style.width = `${p * 100}%`
    const video = playerEl.querySelector('video') as HTMLVideoElement | null
    if (video && video.duration) video.currentTime = p * video.duration

    const onMove = (me: MouseEvent) => {
      if (!isDragging) return
      const mp = getPercent(me)
      playedBar.style.width = `${mp * 100}%`
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

  // 驱动视频底层进度
  const bindVideo = () => {
    const video = playerEl.querySelector('video') as HTMLVideoElement | null
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
          playedBar.style.width = `${(video.currentTime / video.duration) * 100}%`
        }
        const curEl = timeLabel.querySelector('.m115-v2-time-current')
        const durEl = timeLabel.querySelector('.m115-v2-time-duration')
        if (curEl) curEl.textContent = formatTime(video.currentTime)
        if (durEl) durEl.textContent = formatTime(video.duration)
      }
    })

    video.addEventListener('progress', () => {
      if (video.buffered.length > 0 && video.duration) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        bufferBar.style.width = `${(bufferedEnd / video.duration) * 100}%`
      }
    })

    video.addEventListener('play', () => {
      playBtn.innerHTML = Icons.Pause()
    })

    video.addEventListener('pause', () => {
      playBtn.innerHTML = Icons.Play()
      viewport.classList.remove('idle')
    })
  }

  // 鼠标空闲自动淡出
  let idleTimer: any = null
  const resetIdle = () => {
    playerPane.classList.remove('idle')
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      const video = playerEl.querySelector('video') as HTMLVideoElement | null
      const isPlaylistOpen = playlistAside.classList.contains('open')
      const isSheetOpen = sheet.classList.contains('open')
      if (video && !video.paused && !isPlaylistOpen && !isSheetOpen) {
        playerPane.classList.add('idle')
      }
    }, 2500)
  }

  playerPane.addEventListener('mousemove', resetIdle)
  playerPane.addEventListener('mouseenter', resetIdle)

  // 挂入整体结构
  playerPane.appendChild(overlay)
  viewport.appendChild(playerPane)
  viewport.appendChild(playlistAside)
  container.appendChild(viewport)

  setTimeout(() => {
    bindVideo()
  }, 200)

  return {
    viewport,
    topBar,
    bottomBar,
    setTitle(title: string) {
      topBar.querySelector('.m115-v2-title-text')!.textContent = title
    },
    setStats(text: string) {
      const badge = topBar.querySelector('.m115-v2-badge-size')
      if (badge) badge.textContent = text
    },
    setIndex(text: string) {
      topBar.querySelector('.m115-v2-badge-index')!.textContent = text
    },
    setBreadcrumbs(items: BreadcrumbNode[]) {
      renderCrumbs(items)
    },
    setFavorite(marked: boolean) {
      favBtn.classList.toggle('active', marked)
      favBtn.innerHTML = marked ? Icons.StarFilled() : Icons.Star()
    },
  }
}
