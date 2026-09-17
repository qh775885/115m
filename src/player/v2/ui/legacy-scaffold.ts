/**
 * 115m 2.0 经典视觉外壳架构
 * 100% 继承 1.9.5 经过长期验证打磨的成熟排版、尺寸与 CSS 体系
 * 底层纯净交由 Vidstack 流媒体引擎驱动
 */

import playerSkinCss from '../../core/player-skin.css?inline'
import playerQualityCss from '../../core/css/player-quality.css?inline'
import playerPlaybackModeCss from '../../core/css/player-playback-mode.css?inline'
import playerNavigationCss from '../../core/css/player-navigation.css?inline'
import playerRotationCss from '../../core/css/player-rotation.css?inline'
import playerPlaylistCss from '../../core/css/player-playlist.css?inline'
import playerHeaderCss from '../../core/css/player-header.css?inline'
import playerSelectorCss from '../../core/css/player-selector.css?inline'
import playerVolumeCss from '../../core/player-volume.css?inline'
import uiLayerCss from '../../core/ui-layer.css?inline'
import playerMediaTrackCss from '../../core/css/player-media-track.css?inline'
import playerSettingsMenuCss from '../../core/css/player-settings-menu.css?inline'
import { Icons } from '../../../shared/icons'

export interface BreadcrumbItem {
  cid: string
  name: string
}

export interface LegacyScaffoldOptions {
  container: HTMLElement
  playerEl: HTMLElement
  title?: string
  indexText?: string
  statsText?: string
  breadcrumbs?: BreadcrumbItem[]
  isFavorite?: boolean
  onBack?: () => void
  onBreadcrumbClick?: (item: BreadcrumbItem) => void
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
  onPlaylistToggle?: () => void
}

/** 注入老版经过考验的完整 12 套成熟 CSS 体系 */
function injectFullLegacyStyles() {
  if (typeof document === 'undefined') return
  let style = document.getElementById('m115-legacy-full-styles') as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = 'm115-legacy-full-styles'
    ;(document.head || document.documentElement).appendChild(style)
  }
  style.textContent = `
    ${playerSkinCss}
    ${playerQualityCss}
    ${playerPlaybackModeCss}
    ${playerNavigationCss}
    ${playerRotationCss}
    ${playerPlaylistCss}
    ${playerHeaderCss}
    ${playerSelectorCss}
    ${playerVolumeCss}
    ${uiLayerCss}
    ${playerMediaTrackCss}
    ${playerSettingsMenuCss}

    /* Artplayer 基础定位垫片 (替代缺失的 artplayer.css) */
    .art-video-player {
      position: relative !important;
      width: 100% !important;
      height: 100% !important;
      overflow: hidden !important;
      background: #000 !important;
    }
    .art-video-player .m115-layer-header {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      z-index: 30 !important;
      display: flex !important;
      align-items: flex-start !important;
      justify-content: space-between !important;
      padding: 16px 20px 28px !important;
      box-sizing: border-box !important;
    }
    .art-video-player .art-bottom {
      position: absolute !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      z-index: 30 !important;
      display: flex !important;
      flex-direction: column !important;
      padding: 0 16px 14px !important;
      box-sizing: border-box !important;
    }
    .art-video-player .art-progress {
      position: relative !important;
      width: 100% !important;
      box-sizing: border-box !important;
      margin: 0 0 10px 0 !important;
    }
    .art-control-progress {
      position: relative !important;
      width: 100% !important;
      height: 8px !important;
      cursor: pointer !important;
    }
    .art-control-progress-inner {
      position: relative !important;
      width: 100% !important;
      height: 100% !important;
      background: rgba(255, 255, 255, 0.2) !important;
      border-radius: 999px !important;
      overflow: visible !important;
    }
    .art-progress-loaded {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      height: 100% !important;
      background: rgba(255, 255, 255, 0.35) !important;
      border-radius: 999px !important;
    }
    .art-progress-played {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      height: 100% !important;
      background: #1890ff !important;
      border-radius: 999px !important;
    }
    .art-progress-indicator {
      position: absolute !important;
      right: -6px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      width: 12px !important;
      height: 12px !important;
      border-radius: 999px !important;
      background: #fff !important;
      box-shadow: 0 0 6px rgba(24, 144, 255, 0.8) !important;
    }
    .art-video-player .art-controls {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      box-sizing: border-box !important;
      width: 100% !important;
      height: 40px !important;
    }

    /* 保证 Vidstack 充满父容器并置于最底层 */
    media-player {
      width: 100% !important;
      height: 100% !important;
      aspect-ratio: unset !important;
      position: absolute !important;
      inset: 0 !important;
      overflow: hidden !important;
      z-index: 1 !important;
      display: block !important;
    }
    media-player[data-view-type='video'] {
      aspect-ratio: unset !important;
    }
    media-provider {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    video {
      position: absolute !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      object-fit: contain !important;
      display: block !important;
    }

    /* 顶部与底部渐变暗部遮罩 */
    .m115-top-gradient-mask {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 130px;
      background: linear-gradient(to bottom, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.35) 60%, transparent 100%);
      pointer-events: none;
      z-index: 20;
    }
    .m115-bottom-gradient-mask {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 160px;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.4) 60%, transparent 100%);
      pointer-events: none;
      z-index: 20;
    }

    /* 控制栏淡入淡出动画 */
    .art-video-player .m115-layer-header,
    .art-video-player .art-bottom,
    .art-video-player .m115-top-gradient-mask,
    .art-video-player .m115-bottom-gradient-mask {
      transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    .art-video-player:not(.art-control-show) .m115-layer-header,
    .art-video-player:not(.art-control-show) .art-bottom,
    .art-video-player:not(.art-control-show) .m115-top-gradient-mask,
    .art-video-player:not(.art-control-show) .m115-bottom-gradient-mask {
      opacity: 0 !important;
      pointer-events: none !important;
    }
    .art-video-player.art-control-show .m115-layer-header,
    .art-video-player.art-control-show .art-bottom,
    .art-video-player.art-control-show .m115-top-gradient-mask,
    .art-video-player.art-control-show .m115-bottom-gradient-mask {
      opacity: 1 !important;
      pointer-events: auto !important;
    }

    /* 确保右侧选集抽屉在收起时绝不外漏 */
    #playlist-sidebar {
      width: 0 !important;
      min-width: 0 !important;
      flex: 0 0 0 !important;
      overflow: hidden !important;
      transition: width 0.25s ease, flex-basis 0.25s ease !important;
    }
    #playlist-sidebar.open {
      width: 320px !important;
      flex: 0 0 320px !important;
    }
  `
}

export function mountLegacyScaffold(options: LegacyScaffoldOptions) {
  injectFullLegacyStyles()

  const { container, playerEl } = options

  // 构建老版外层包裹器 .art-video-player
  const wrapper = document.createElement('div')
  wrapper.className = 'art-video-player art-control-show'
  wrapper.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden;background:#000;'

  // 放入 Vidstack 播放器
  wrapper.appendChild(playerEl)

  // 放入上下暗部渐变遮罩
  const maskTop = document.createElement('div')
  maskTop.className = 'm115-top-gradient-mask'
  const maskBottom = document.createElement('div')
  maskBottom.className = 'm115-bottom-gradient-mask'
  wrapper.appendChild(maskTop)
  wrapper.appendChild(maskBottom)

  // ───────────────────────────────────────────
  // 1. 顶部 Header (100% 继承老版 HTML 结构)
  // ───────────────────────────────────────────
  const header = document.createElement('div')
  header.className = 'm115-layer-header'
  header.style.opacity = '1'
  header.style.pointerEvents = 'auto'

  header.innerHTML = `
    <div class="m115-header-main">
      <button type="button" class="m115-header-back" title="返回">
        ${Icons.Back()}
      </button>
      <div class="m115-header-info">
        <div class="m115-header-title-row">
          <div class="m115-header-index" style="display:flex;">${options.indexText || '01'}</div>
          <div class="m115-header-title">${options.title || '正在加载视频标题...'}</div>
          <div class="m115-header-stats">${options.statsText || '原画'}</div>
        </div>
        <div class="m115-header-breadcrumbs"></div>
      </div>
    </div>
    <div class="m115-header-actions-wrap">
      <button type="button" class="m115-header-action m115-fav-btn ${options.isFavorite ? 'is-marked' : ''}" title="星标收藏">
        ${options.isFavorite ? Icons.StarFilled() : Icons.Star()}
      </button>
      <div class="m115-header-pill-group">
        <button type="button" class="m115-header-action m115-move-btn" title="移动目录">
          ${Icons.Move()}
        </button>
        <button type="button" class="m115-header-action m115-download-btn" title="下载原画">
          ${Icons.Download()}
        </button>
        <button type="button" class="m115-header-action m115-delete-btn" title="删除文件">
          ${Icons.Trash()}
        </button>
      </div>
    </div>
  `
  wrapper.appendChild(header)

  // 渲染面包屑
  const breadcrumbsEl = header.querySelector('.m115-header-breadcrumbs') as HTMLElement
  const renderBreadcrumbs = (items: BreadcrumbItem[]) => {
    breadcrumbsEl.innerHTML = ''
    items.forEach((item, idx) => {
      const crumb = document.createElement('span')
      crumb.className = 'm115-breadcrumb-node'
      crumb.style.cursor = 'pointer'
      crumb.textContent = item.name
      crumb.onclick = () => options.onBreadcrumbClick?.(item)
      breadcrumbsEl.appendChild(crumb)

      if (idx < items.length - 1) {
        const sep = document.createElement('span')
        sep.style.margin = '0 6px'
        sep.style.opacity = '0.4'
        sep.textContent = '>'
        breadcrumbsEl.appendChild(sep)
      }
    })
  }
  renderBreadcrumbs(options.breadcrumbs || [
    { cid: '0', name: '全部文件' },
    { cid: '1', name: '我的影视库' },
    { cid: '2', name: '经典华语电影' },
    { cid: '3', name: '色戒' },
  ])

  // ───────────────────────────────────────────
  // 2. 底部 Controls (100% 继承老版 HTML 结构)
  // ───────────────────────────────────────────
  const bottom = document.createElement('div')
  bottom.className = 'art-bottom'
  bottom.style.opacity = '1'
  bottom.style.pointerEvents = 'auto'

  bottom.innerHTML = `
    <!-- 进度条 -->
    <div class="art-progress">
      <div class="art-control-progress">
        <div class="art-control-progress-inner">
          <div class="art-progress-loaded" style="width: 0%;"></div>
          <div class="art-progress-played" style="width: 0%;">
            <div class="art-progress-indicator"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 控制横行 -->
    <div class="art-controls">
      <!-- 左侧：时间码与音量 -->
      <div class="art-controls-left">
        <div class="art-control art-control-time">
          <span class="art-time-current">00:00:00</span>
          <span class="art-time-separator">/</span>
          <span class="art-time-duration">00:00:00</span>
        </div>

        <div class="art-control m115-custom-volume-control">
          <div class="m115-custom-volume-container">
            <button class="m115-volume-btn" title="静音 (M)">
              ${Icons.Volume2()}
            </button>
            <div class="m115-volume-slider-wrapper">
              <input type="range" class="m115-volume-slider" min="0" max="100" value="100">
            </div>
          </div>
        </div>
      </div>

      <!-- 中间中轴：上一集 + 居中主播放大键 + 下一集 -->
      <div class="art-controls-left m115-center-cluster">
        <div class="art-control art-control-m115-prev-control">
          <span class="m115-control-shell m115-nav-control-button" title="上一集 ( [ )">
            ${Icons.SkipBack()}
          </span>
        </div>
        <div class="art-control art-control-playAndPause">
          <span class="art-icon art-icon-playAndPause">
            ${Icons.Pause()}
          </span>
        </div>
        <div class="art-control art-control-m115-next-control">
          <span class="m115-control-shell m115-nav-control-button" title="下一集 ( ] )">
            ${Icons.SkipForward()}
          </span>
        </div>
      </div>

      <!-- 右侧：全量功能区 (100% 对齐老版) -->
      <div class="art-controls-right">
        <div class="art-control m115-mode-control" title="播放模式">
          <span class="art-icon">${Icons.Repeat()}</span>
        </div>
        <div class="art-control m115-rotate-control" title="画面旋转 (R)">
          <span class="art-icon">${Icons.RotateCw()}</span>
        </div>
        <div class="art-control m115-quality-control">
          <span class="art-selector-value">原画</span>
        </div>
        <div class="art-control m115-audio-control">
          <span class="art-selector-value">${Icons.MediaTrack()} 音轨</span>
        </div>
        <div class="art-control m115-subtitle-control">
          <span class="art-selector-value">字幕</span>
        </div>
        <div class="art-control m115-speed-control">
          <span class="art-selector-value">1.0x</span>
        </div>
        <div class="art-control m115-playlist-control">
          <span class="art-selector-value">${Icons.Playlist()} 选集</span>
        </div>
        <div class="art-control art-control-fullscreen" title="全屏 (F)">
          <span class="art-icon">${Icons.Fullscreen()}</span>
        </div>
      </div>
    </div>
  `
  wrapper.appendChild(bottom)

  // ───────────────────────────────────────────
  // 3. 绑定交互事件与底层视频驱动
  // ───────────────────────────────────────────
  const progressInner = bottom.querySelector('.art-control-progress-inner') as HTMLElement
  const loadedBar = bottom.querySelector('.art-progress-loaded') as HTMLElement
  const playedBar = bottom.querySelector('.art-progress-played') as HTMLElement
  const timeCurrent = bottom.querySelector('.art-time-current') as HTMLElement
  const timeDuration = bottom.querySelector('.art-time-duration') as HTMLElement
  const playBtn = bottom.querySelector('.art-control-playAndPause') as HTMLElement
  const volBtn = bottom.querySelector('.m115-volume-btn') as HTMLElement
  const volSlider = bottom.querySelector('.m115-volume-slider') as HTMLInputElement

  // 顶部返回与操作
  header.querySelector('.m115-header-back')?.addEventListener('click', () => options.onBack?.())
  header.querySelector('.m115-move-btn')?.addEventListener('click', () => options.onMove?.())
  header.querySelector('.m115-download-btn')?.addEventListener('click', () => options.onDownload?.())
  header.querySelector('.m115-delete-btn')?.addEventListener('click', () => options.onDelete?.())

  const favBtn = header.querySelector('.m115-fav-btn') as HTMLElement
  favBtn.onclick = () => {
    const nextMarked = !favBtn.classList.contains('is-marked')
    favBtn.classList.toggle('is-marked', nextMarked)
    favBtn.innerHTML = nextMarked ? Icons.StarFilled() : Icons.Star()
    options.onToggleFavorite?.(nextMarked)
  }

  // 播放暂停
  playBtn.onclick = () => {
    const video = playerEl.querySelector('video') as HTMLVideoElement | null
    if (video) {
      if (video.paused) video.play()
      else video.pause()
    }
  }

  // 音量控制
  volBtn.onclick = () => {
    const video = playerEl.querySelector('video') as HTMLVideoElement | null
    if (video) {
      video.muted = !video.muted
      volBtn.innerHTML = video.muted ? Icons.VolumeX() : Icons.Volume2()
    }
  }
  volSlider.oninput = () => {
    const video = playerEl.querySelector('video') as HTMLVideoElement | null
    if (video) {
      const val = Number(volSlider.value) / 100
      video.volume = val
      video.muted = (val === 0)
      volBtn.innerHTML = (val === 0) ? Icons.VolumeX() : Icons.Volume2()
    }
  }

  // 上下集、功能按钮
  bottom.querySelector('.art-control-m115-prev-control')?.addEventListener('click', () => options.onPrev?.())
  bottom.querySelector('.art-control-m115-next-control')?.addEventListener('click', () => options.onNext?.())
  bottom.querySelector('.m115-mode-control')?.addEventListener('click', () => options.onModeClick?.())
  bottom.querySelector('.m115-rotate-control')?.addEventListener('click', () => options.onRotateClick?.())
  bottom.querySelector('.m115-quality-control')?.addEventListener('click', () => options.onQualityClick?.())
  bottom.querySelector('.m115-audio-control')?.addEventListener('click', () => options.onAudioClick?.())
  bottom.querySelector('.m115-subtitle-control')?.addEventListener('click', () => options.onSubtitleClick?.())
  bottom.querySelector('.m115-speed-control')?.addEventListener('click', () => options.onSpeedClick?.())
  bottom.querySelector('.m115-playlist-control')?.addEventListener('click', () => options.onPlaylistToggle?.())
  bottom.querySelector('.art-control-fullscreen')?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      playerEl.requestFullscreen().catch(() => {})
    }
    else {
      document.exitFullscreen().catch(() => {})
    }
  })

  // 进度条拖拽
  let isSeeking = false
  const getSeekPercent = (e: MouseEvent) => {
    const rect = progressInner.getBoundingClientRect()
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  }
  progressInner.addEventListener('mousedown', (e) => {
    isSeeking = true
    const p = getSeekPercent(e)
    playedBar.style.width = `${p * 100}%`
    const video = playerEl.querySelector('video') as HTMLVideoElement | null
    if (video && video.duration) video.currentTime = p * video.duration

    const onMove = (moveEvt: MouseEvent) => {
      if (!isSeeking) return
      const mp = getSeekPercent(moveEvt)
      playedBar.style.width = `${mp * 100}%`
      if (video && video.duration) video.currentTime = mp * video.duration
    }
    const onUp = () => {
      isSeeking = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  })

  // 驱动底层播放器状态
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
        if (!isSeeking) {
          playedBar.style.width = `${(video.currentTime / video.duration) * 100}%`
        }
        timeCurrent.textContent = formatTime(video.currentTime)
        timeDuration.textContent = formatTime(video.duration)
      }
    })

    video.addEventListener('progress', () => {
      if (video.buffered.length > 0 && video.duration) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        loadedBar.style.width = `${(bufferedEnd / video.duration) * 100}%`
      }
    })

    video.addEventListener('play', () => {
      playBtn.querySelector('.art-icon')!.innerHTML = Icons.Pause()
    })

    video.addEventListener('pause', () => {
      playBtn.querySelector('.art-icon')!.innerHTML = Icons.Play()
      wrapper.classList.add('art-control-show')
    })
  }

  // 鼠标空闲自动淡出
  let idleTimer: any = null
  const resetIdle = () => {
    wrapper.classList.add('art-control-show')
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      const video = playerEl.querySelector('video') as HTMLVideoElement | null
      if (video && !video.paused) {
        wrapper.classList.remove('art-control-show')
      }
    }, 2500)
  }

  wrapper.addEventListener('mousemove', resetIdle)
  wrapper.addEventListener('mouseenter', resetIdle)

  // 挂载到外部容器
  container.appendChild(wrapper)

  setTimeout(() => {
    bindVideo()
  }, 300)

  return {
    wrapper,
    header,
    bottom,
    setTitle(title: string) {
      header.querySelector('.m115-header-title')!.textContent = title
    },
    setStats(text: string) {
      header.querySelector('.m115-header-stats')!.textContent = text
    },
    setIndex(text: string) {
      header.querySelector('.m115-header-index')!.textContent = text
    },
    setBreadcrumbs(items: BreadcrumbItem[]) {
      renderBreadcrumbs(items)
    },
    setFavorite(marked: boolean) {
      favBtn.classList.toggle('is-marked', marked)
      favBtn.innerHTML = marked ? Icons.StarFilled() : Icons.Star()
    },
  }
}
