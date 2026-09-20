/**
 * 115m 2.0 专业现代影院视口装配器
 * 采用顶级流媒体中控标准，彻底抛弃老旧缝合补丁
 * 每一个元素像素级对齐，底层纯净交由 Vidstack 驱动
 */

import themeCss from './theme.css?inline'
import { Icons } from '../../shared/icons'
import type { PlayerCore } from '../controller/player-core'
import type { PlayerState } from '../state/player-state'
import type { ContentState } from '../state/content-state'
import type { Store } from '../state/store'
import type { OverlayPlaylistItem } from '../types/overlay-types'
import {
  bindPlaylistInteractions,
  buildPlaylistHtml,
  lazyLoadPlaylistCovers,
  scrollActivePlaylistNodeIntoView,
} from './overlay-playlist'
import {
  getPlaylistViewMode,
  setPlaylistViewMode,
  togglePlaylistViewMode,
  renderPlaylistViewModeSwitch,
  type PlaylistViewMode,
} from './playlist-view-mode'
import { formatCompactTime } from './hover-utils'
import type { SubtitleController } from '../controller/subtitles'
import { VideoStatsTracker } from '../adapters/video-stats'

export interface BreadcrumbNode {
  cid: string
  name: string
}

export interface CleanViewOptions {
  container: HTMLElement
  playerEl: HTMLElement
  core: PlayerCore
  content: Store<ContentState>
  subtitles: SubtitleController
  onBack?: () => void
  onBreadcrumbClick?: (item: BreadcrumbNode) => void
  onToggleFavorite?: (marked: boolean) => void
  onMove?: () => void
  onDownload?: () => void
  onDelete?: () => void
  onPrev?: () => void
  onNext?: () => void
  onRotate?: () => void
  onSelectEpisode?: (pickCode: string) => void
  onMoveEpisode?: (pickCode: string) => void
  onDeleteEpisode?: (pickCode: string) => void
  onSelectQuality?: (label: string) => void
  onSelectAudioTrack?: (id: string) => void
  onSelectSubtitle?: (sid: string) => void
  onSelectMode?: (mode: string) => void
  requestPreview?: (
    time: number,
    duration: number,
    onUpdate: (cover: { imgUrl: string, width?: number, height?: number } | null) => void,
  ) => void
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00'
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  const m = Math.floor((seconds / 60) % 60).toString().padStart(2, '0')
  const h = Math.floor(seconds / 3600)
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`
}

function formatRate(rate: number): string {
  return Number.isInteger(rate) ? rate.toFixed(1) : String(rate)
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

  // 字幕显示层（位于视频之上、控制层之下）
  const subtitleLayer = document.createElement('div')
  subtitleLayer.className = 'm115-v2-subtitle-layer'
  playerPane.appendChild(subtitleLayer)

  // 进度条悬停预览（缩略图 + 时间码）
  const previewEl = document.createElement('div')
  previewEl.className = 'm115-v2-preview'
  previewEl.innerHTML = `
    <img class="m115-v2-preview-img" alt="" />
    <span class="m115-v2-preview-time">00:00</span>
  `
  playerPane.appendChild(previewEl)

  // 长按极速快进指示器
  const speedHud = document.createElement('div')
  speedHud.className = 'm115-v2-speed-hud'
  speedHud.innerHTML = `
    ${Icons.FastForward()}
    <span>2.0x 极速快进中</span>
  `
  playerPane.appendChild(speedHud)

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
          <span class="m115-v2-badge-index">--</span>
          <span class="m115-v2-title-text">正在读取视频标题...</span>
          <button type="button" class="m115-v2-fav-btn" title="星标收藏">
            ${Icons.Star()}
          </button>
          <span class="m115-v2-badge-size"></span>
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

  // 渲染面包屑（由内容状态驱动；无路径时隐藏整行）
  const crumbsContainer = topBar.querySelector('.m115-v2-crumbs-row') as HTMLElement
  const renderCrumbs = (crumbs: BreadcrumbNode[]) => {
    crumbsContainer.innerHTML = ''
    if (crumbs.length === 0) {
      crumbsContainer.style.display = 'none'
      return
    }
    crumbsContainer.style.display = ''
    crumbs.forEach((crumb, idx) => {
      const node = document.createElement('span')
      node.className = 'm115-v2-crumb-item'
      node.textContent = crumb.name
      node.title = `在网盘中打开：${crumb.name}`
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

  // ───────────────────────────────────────────
  // 4.3.1 右键自定义上下文菜单 (Context Menu & 实时视频信息)
  // ───────────────────────────────────────────
  const statsTracker = new VideoStatsTracker()
  let statsTimer: number | null = null

  const contextMenu = document.createElement('div')
  contextMenu.className = 'm115-v2-context-menu'
  contextMenu.innerHTML = `
    <div class="m115-v2-context-stats">
      <div class="m115-v2-context-stats-title">
        ${Icons.Activity()} <span>视频信息</span>
      </div>
      <div class="m115-v2-context-stat-row">
        <span class="m115-v2-context-stat-label">分辨率</span>
        <span class="m115-v2-context-stat-value">
          <span class="m115-v2-stat-res">--</span>
          <span class="m115-v2-context-stat-tag m115-v2-stat-tag" style="display:none;"></span>
        </span>
      </div>
      <div class="m115-v2-context-stat-row">
        <span class="m115-v2-context-stat-label">实时帧率</span>
        <span class="m115-v2-context-stat-value m115-v2-stat-fps">--</span>
      </div>
      <div class="m115-v2-context-stat-row">
        <span class="m115-v2-context-stat-label">渲染丢帧</span>
        <span class="m115-v2-context-stat-value m115-v2-stat-drop">0 (0.0%)</span>
      </div>
    </div>
    <div class="m115-v2-context-divider"></div>
    <div class="m115-v2-context-item m115-ctx-hotkeys">
      <div class="m115-v2-context-item-left">
        ${Icons.Keyboard()}
        <span>快捷键说明</span>
      </div>
      <span class="m115-v2-context-item-arrow">›</span>
    </div>
    <div class="m115-v2-context-item m115-ctx-about">
      <div class="m115-v2-context-item-left">
        ${Icons.Info()}
        <span>关于 115m</span>
      </div>
      <span class="m115-v2-context-item-arrow">›</span>
    </div>
  `
  overlay.appendChild(contextMenu)

  // ───────────────────────────────────────────
  // 4.3.2 快捷键指南与关于面板 (Modal Mask & Dialog)
  // ───────────────────────────────────────────
  const modalMask = document.createElement('div')
  modalMask.className = 'm115-v2-modal-mask'
  modalMask.innerHTML = `
    <div class="m115-v2-modal m115-v2-modal-hotkeys" style="display:none;">
      <div class="m115-v2-modal-header">
        <div class="m115-v2-modal-title">${Icons.Keyboard()} 快捷键指南</div>
        <button type="button" class="m115-v2-modal-close" title="关闭">${Icons.Close()}</button>
      </div>
      <div class="m115-v2-hotkeys-grid">
        <div class="m115-v2-hotkey-row"><span class="m115-v2-hotkey-desc">播放 / 暂停</span><kbd class="m115-kbd">空格</kbd></div>
        <div class="m115-v2-hotkey-row"><span class="m115-v2-hotkey-desc">全屏 / 退出全屏</span><kbd class="m115-kbd">F</kbd></div>
        <div class="m115-v2-hotkey-row"><span class="m115-v2-hotkey-desc">快退 5 秒</span><kbd class="m115-kbd">←</kbd></div>
        <div class="m115-v2-hotkey-row"><span class="m115-v2-hotkey-desc">快进 5 秒</span><kbd class="m115-kbd">→</kbd></div>
        <div class="m115-v2-hotkey-row"><span class="m115-v2-hotkey-desc">音量调节 (±5%)</span><kbd class="m115-kbd">↑ / ↓</kbd></div>
        <div class="m115-v2-hotkey-row"><span class="m115-v2-hotkey-desc">静音切换</span><kbd class="m115-kbd">M</kbd></div>
        <div class="m115-v2-hotkey-row"><span class="m115-v2-hotkey-desc">切集 (上一集 / 下一集)</span><kbd class="m115-kbd">[ / ]</kbd></div>
        <div class="m115-v2-hotkey-row"><span class="m115-v2-hotkey-desc">画面旋转 90°</span><kbd class="m115-kbd">R</kbd></div>
        <div class="m115-v2-hotkey-row" style="grid-column: span 2;"><span class="m115-v2-hotkey-desc">画面长按</span><kbd class="m115-kbd">2.0x 极速快进</kbd></div>
      </div>
    </div>

    <div class="m115-v2-modal m115-v2-modal-about" style="display:none;">
      <div class="m115-v2-modal-header">
        <div class="m115-v2-modal-title">${Icons.Info()} 关于 115m</div>
        <button type="button" class="m115-v2-modal-close" title="关闭">${Icons.Close()}</button>
      </div>
      <div class="m115-v2-about-body">
        <div class="m115-v2-about-badge">v${__APP_VERSION__} · Vidstack Engine</div>
        <p class="m115-v2-about-desc">为 115 网盘打造的沉浸式极简观影扩展<br>原生画质直连 · 纯净毛玻璃中控 · 现代化流媒体体验</p>
        <div class="m115-v2-about-meta">
          <div class="m115-v2-about-meta-item"><span>作者</span><b>老魔</b></div>
          <div class="m115-v2-about-meta-item"><span>协议</span><b>GPL-3.0</b></div>
        </div>
        <p class="m115-v2-about-note">名称、图标与品牌视觉不在开源授权范围内；欢迎复刻，改名改图标并注明出处即可。官方来源仅下方 GitHub 仓库。</p>
        <div class="m115-v2-about-links">
          <a href="https://github.com/qh775885/115m" target="_blank" rel="noopener noreferrer" class="m115-v2-about-btn">
            <span>GitHub 仓库</span>
            ${Icons.ExternalLink()}
          </a>
          <a href="https://t.me/+oTk8LExaev8wYmM1" target="_blank" rel="noopener noreferrer" class="m115-v2-about-btn">
            <span>发布频道</span>
            ${Icons.ExternalLink()}
          </a>
        </div>
      </div>
    </div>
  `
  overlay.appendChild(modalMask)

  const updateStatsUI = () => {
    const stats = statsTracker.getStats()
    const resEl = contextMenu.querySelector('.m115-v2-stat-res') as HTMLElement
    const tagEl = contextMenu.querySelector('.m115-v2-stat-tag') as HTMLElement
    const fpsEl = contextMenu.querySelector('.m115-v2-stat-fps') as HTMLElement
    const dropEl = contextMenu.querySelector('.m115-v2-stat-drop') as HTMLElement

    if (resEl) resEl.textContent = stats.resolution
    if (tagEl) {
      if (stats.tag) {
        tagEl.textContent = stats.tag
        tagEl.style.display = 'inline-block'
      } else {
        tagEl.style.display = 'none'
      }
    }
    if (fpsEl) fpsEl.textContent = stats.fpsText
    if (dropEl) {
      dropEl.textContent = `${stats.droppedFrames} (${stats.dropRateText})`
    }
  }

  const closeContextMenu = () => {
    if (!contextMenu.classList.contains('open')) return
    contextMenu.classList.remove('open')
    if (statsTimer) {
      clearInterval(statsTimer)
      statsTimer = null
    }
    statsTracker.stop()
  }

  const openContextMenu = (clientX: number, clientY: number) => {
    closeSheet()
    const video = options.core.getVideoElement()
    if (video) statsTracker.attach(video)
    statsTracker.start()
    updateStatsUI()

    if (statsTimer) clearInterval(statsTimer)
    statsTimer = window.setInterval(updateStatsUI, 300)

    contextMenu.classList.add('open')

    const rect = playerPane.getBoundingClientRect()
    const menuWidth = 228
    const menuHeight = contextMenu.offsetHeight || 190
    let left = clientX - rect.left
    let top = clientY - rect.top

    if (left + menuWidth > rect.width - 12) {
      left = Math.max(12, left - menuWidth)
    }
    if (top + menuHeight > rect.height - 12) {
      top = Math.max(12, top - menuHeight)
    }

    contextMenu.style.left = `${Math.round(left)}px`
    contextMenu.style.top = `${Math.round(top)}px`
  }

  const closeModal = () => {
    modalMask.classList.remove('open')
  }

  const openModal = (type: 'hotkeys' | 'about') => {
    closeContextMenu()
    modalMask.classList.add('open')
    const hotkeysModal = modalMask.querySelector('.m115-v2-modal-hotkeys') as HTMLElement
    const aboutModal = modalMask.querySelector('.m115-v2-modal-about') as HTMLElement
    if (type === 'hotkeys') {
      hotkeysModal.style.display = 'flex'
      aboutModal.style.display = 'none'
    } else {
      hotkeysModal.style.display = 'none'
      aboutModal.style.display = 'flex'
    }
  }

  // 右键菜单项点击
  contextMenu.querySelector('.m115-ctx-hotkeys')?.addEventListener('click', (e) => {
    e.stopPropagation()
    openModal('hotkeys')
  })

  contextMenu.querySelector('.m115-ctx-about')?.addEventListener('click', (e) => {
    e.stopPropagation()
    openModal('about')
  })

  // 模态框内部关闭按钮
  modalMask.querySelectorAll('.m115-v2-modal-close').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      closeModal()
    })
  })

  // 点击外部空白区域，自动优雅关闭微卡片面板与右键菜单
  window.addEventListener('click', (e) => {
    if (!sheet.contains(e.target as Node)) {
      closeSheet()
    }
    if (!contextMenu.contains(e.target as Node)) {
      closeContextMenu()
    }
    if (modalMask.classList.contains('open') && e.target === modalMask) {
      closeModal()
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
      <div class="m115-v2-drawer-tools">
        ${renderPlaylistViewModeSwitch(getPlaylistViewMode())}
        <button type="button" class="m115-v2-icon-action m115-drawer-close" style="width:28px;height:28px;" title="收起">
          ${Icons.Close()}
        </button>
      </div>
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

  const viewToggleBtn = playlistAside.querySelector('.m115-pl-view-btn') as HTMLElement | null
  const updateViewToggleState = (el: HTMLElement, mode: PlaylistViewMode) => {
    const isCard = mode === 'card'
    el.classList.toggle('is-active', isCard)
    el.setAttribute('aria-pressed', isCard ? 'true' : 'false')
  }

  viewToggleBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    const nextMode = togglePlaylistViewMode()
    if (viewToggleBtn) {
      updateViewToggleState(viewToggleBtn, nextMode)
    }
    renderEpisodes(lastPlaylist, lastPickCode)
  })

  // 按 Escape 快捷键亦可一键收回面板、弹窗与侧边栏
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modalMask.classList.contains('open')) closeModal()
      else if (contextMenu.classList.contains('open')) closeContextMenu()
      else if (sheet.classList.contains('open')) closeSheet()
      else if (playlistAside.classList.contains('open')) togglePlaylist(false)
    }
  })

  const drawerHeading = playlistAside.querySelector('.m115-v2-drawer-heading') as HTMLElement
  const drawerBody = playlistAside.querySelector('.m115-v2-drawer-body') as HTMLElement

  let lastPlaylist: OverlayPlaylistItem[] = []
  let lastPickCode = ''
  let disposePlaylistCovers: (() => void) | null = null
  let thumbAspectObserver: MutationObserver | null = null

  // 缩略图加载后，用其真实比例设置图框宽高比（竖屏竖框、横屏横框，既不裁剪也不留大黑边）
  const applyThumbAspect = (img: HTMLImageElement) => {
    const thumb = img.closest('.m115-pl-thumb') as HTMLElement | null
    if (!thumb || !img.naturalWidth || !img.naturalHeight) return
    thumb.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`
  }

  const watchThumbAspect = () => {
    thumbAspectObserver?.disconnect()
    thumbAspectObserver = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          const imgs: HTMLImageElement[] = []
          if (node instanceof HTMLImageElement) imgs.push(node)
          else if (node instanceof HTMLElement) imgs.push(...Array.from(node.querySelectorAll('img')))
          imgs.forEach((img) => {
            if (img.complete) applyThumbAspect(img)
            else img.addEventListener('load', () => applyThumbAspect(img), { once: true })
          })
        })
      })
    })
    thumbAspectObserver.observe(drawerBody, { childList: true, subtree: true })
  }

  const renderEpisodes = (items: OverlayPlaylistItem[], curPickCode: string) => {
    lastPlaylist = items
    lastPickCode = curPickCode
    disposePlaylistCovers?.()
    disposePlaylistCovers = null

    const mode = getPlaylistViewMode()
    drawerBody.classList.toggle('compact', mode === 'compact')
    drawerBody.innerHTML = buildPlaylistHtml(items, curPickCode, mode)
    bindPlaylistInteractions(drawerBody, curPickCode, items, {
      onPlay: (pickCode) => options.onSelectEpisode?.(pickCode),
      onMove: (item) => options.onMoveEpisode?.(item.pickCode),
      onDelete: (item) => options.onDeleteEpisode?.(item.pickCode),
    })
    if (mode === 'card') {
      disposePlaylistCovers = lazyLoadPlaylistCovers(drawerBody, items)
    }
    scrollActivePlaylistNodeIntoView(drawerBody, curPickCode)
  }

  watchThumbAspect()

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

  // 播放 / 暂停（走能力层）
  playBtn.onclick = () => options.core.toggle()

  const volPercentEl = bottomBar.querySelector('.m115-v2-vol-percent') as HTMLElement | null

  volBtn.onclick = () => options.core.toggleMute()

  volRange.oninput = () => options.core.setVolume(Number(volRange.value) / 100)

  // 底部功能群
  bottomBar.querySelector('.m115-btn-prev')?.addEventListener('click', () => options.onPrev?.())
  bottomBar.querySelector('.m115-btn-next')?.addEventListener('click', () => options.onNext?.())

  const modeBtn = bottomBar.querySelector('.m115-btn-mode') as HTMLElement
  modeBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    openSheet('mode', '播放模式', [
      { id: 'sequence', label: '顺序播放' },
      { id: 'loop-one', label: '单集循环' },
      { id: 'loop-all', label: '列表循环' },
    ], options.content.get().mode, modeBtn, (it) => options.onSelectMode?.(String(it.id)))
  })

  bottomBar.querySelector('.m115-btn-rotate')?.addEventListener('click', () => options.onRotate?.())

  const qualityBtn = bottomBar.querySelector('.m115-btn-quality') as HTMLElement
  qualityBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    const c = options.content.get()
    if (c.qualities.length === 0) return
    openSheet(
      'quality',
      '切换清晰度',
      c.qualities.map(label => ({ id: label, label })),
      c.quality,
      qualityBtn,
      (it) => options.onSelectQuality?.(String(it.id)),
    )
  })

  const audioBtn = bottomBar.querySelector('.m115-btn-audio') as HTMLElement
  audioBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    const s = options.core.store.get()
    if (s.audioTracks.length === 0) return
    openSheet(
      'audio',
      '多音频轨道',
      s.audioTracks.map(track => ({ id: track.id, label: track.label })),
      s.audioTrack,
      audioBtn,
      (it) => options.onSelectAudioTrack?.(String(it.id)),
    )
  })

  const subtitleBtn = bottomBar.querySelector('.m115-btn-subtitle') as HTMLElement
  subtitleBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    const c = options.content.get()
    if (c.subtitles.length === 0) return
    openSheet(
      'subtitle',
      '字幕选择',
      [
        ...c.subtitles.map(item => ({ id: item.sid, label: item.title })),
        { id: '', label: '关闭字幕' },
      ],
      c.subtitle,
      subtitleBtn,
      (it) => options.onSelectSubtitle?.(String(it.id)),
    )
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
    ], options.core.store.get().rate, speedBtn, (it) => {
      options.core.setRate(Number(it.id))
    })
  })

  bottomBar.querySelector('.m115-btn-fullscreen')?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      viewport.requestFullscreen().catch(() => {})
    }
    else {
      document.exitFullscreen().catch(() => {})
    }
  })

  // 进度条拖拽（走能力层，拖拽期间冻结内核回写）
  const getPercent = (e: MouseEvent) => {
    const rect = progressBox.getBoundingClientRect()
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  }

  progressBox.addEventListener('mousedown', (e) => {
    const core = options.core
    core.setDragging(true)
    core.seekByRatio(getPercent(e))

    const onMove = (me: MouseEvent) => core.seekByRatio(getPercent(me))
    const onUp = () => {
      core.setDragging(false)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  })

  // 状态 -> UI 单向下行渲染（唯一数据源：core.store）
  // 差异比对：仅在字段真变化时才写 DOM，避免 innerHTML 重建触发图标动画重播（抖动）
  const curEl = timeLabel.querySelector('.m115-v2-time-current')
  const durEl = timeLabel.querySelector('.m115-v2-time-duration')
  const speedSpan = speedBtn.querySelector('.m115-btn-text-speed')
  let prev: PlayerState | null = null
  let prevSubtitleText = ''
  let lastCardProgressAt = 0

  // 把当前集播放进度实时同步到播放列表卡片（进度条 + 已看时间）
  const syncActiveCardProgress = (currentTime: number, duration: number) => {
    const card = drawerBody.querySelector('.m115-pl-item.is-active')
    if (!card) return
    const pct = Math.max(0, Math.min(100, (currentTime / duration) * 100))
    const wrap = card.querySelector('[data-role="playlist-progress"]') as HTMLElement | null
    const bar = card.querySelector('[data-role="playlist-progress-bar"]') as HTMLElement | null
    const text = card.querySelector('[data-role="playlist-progress-text"]') as HTMLElement | null
    if (wrap) wrap.style.display = pct > 0 ? 'flex' : 'none'
    if (bar) bar.style.width = `${Math.max(2, pct)}%`
    if (text) {
      text.textContent = formatCompactTime(currentTime)
      text.style.display = 'inline'
    }
  }

  const render = (s: PlayerState) => {
    if (!prev || s.currentTime !== prev.currentTime || s.duration !== prev.duration) {
      const pct = s.duration > 0 ? (s.currentTime / s.duration) * 100 : 0
      playedBar.style.width = `${pct}%`
      if (curEl) curEl.textContent = formatTime(s.currentTime)
      if (durEl) durEl.textContent = formatTime(s.duration)

      const subText = options.subtitles.getTextAt(s.currentTime)
      if (subText !== prevSubtitleText) {
        prevSubtitleText = subText
        subtitleLayer.textContent = subText
        subtitleLayer.classList.toggle('visible', !!subText)
      }

      // 当前集卡片进度条实时同步（每秒一次，避免频繁回流）
      if (s.duration > 0 && Date.now() - lastCardProgressAt > 1000) {
        lastCardProgressAt = Date.now()
        syncActiveCardProgress(s.currentTime, s.duration)
      }
    }

    if (!prev || s.buffered !== prev.buffered) {
      bufferBar.style.width = `${s.buffered * 100}%`
    }

    if (!prev || s.paused !== prev.paused) {
      playBtn.innerHTML = s.paused ? Icons.Play() : Icons.Pause()
    }

    if (!prev || s.volume !== prev.volume || s.muted !== prev.muted) {
      const volPct = s.muted ? 0 : Math.round(s.volume * 100)
      volRange.style.setProperty('--vol', `${volPct}%`)
      volRange.value = String(volPct)
      volBtn.innerHTML = (s.muted || volPct === 0) ? Icons.VolumeX() : Icons.Volume2()
      if (volPercentEl) volPercentEl.textContent = `${volPct}%`
    }

    if ((!prev || s.rate !== prev.rate) && speedSpan) {
      speedSpan.textContent = `${formatRate(s.rate)}x`
    }

    if (s.paused) playerPane.classList.remove('idle')

    prev = s
  }

  const unsubscribe = options.core.store.subscribe(render)
  render(options.core.store.get())

  // 进度条悬停预览：跟随光标展示时间码与缩略图（缩略图异步抽帧）
  const previewImg = previewEl.querySelector('.m115-v2-preview-img') as HTMLImageElement
  const previewTimeEl = previewEl.querySelector('.m115-v2-preview-time') as HTMLElement
  let previewToken = 0
  let previewTimer: ReturnType<typeof setTimeout> | null = null

  // 按源画面比例计算预览尺寸：横屏限宽，竖屏限高（避免竖屏撑爆/变形）
  const applyPreviewSize = (sourceWidth: number, sourceHeight: number) => {
    if (!sourceWidth || !sourceHeight) return
    const maxWidth = 186
    const maxHeight = 160
    let width: number
    let height: number
    if (sourceHeight > sourceWidth) {
      height = maxHeight
      width = Math.round(height * (sourceWidth / sourceHeight))
    }
    else {
      width = maxWidth
      height = Math.round(width * (sourceHeight / sourceWidth))
    }
    previewEl.style.width = `${width + 8}px`
    previewImg.style.width = `${width}px`
    previewImg.style.height = `${height}px`
  }

  const handlePreviewMove = (e: MouseEvent) => {
    const state = options.core.store.get()
    if (!state.duration || !options.requestPreview) return

    const ratio = getPercent(e)
    const time = ratio * state.duration
    previewTimeEl.textContent = formatTime(time)

    // 出图前先按视频比例把预览框撑成正确形状，避免出现扁条空框
    if (previewImg.style.visibility !== 'visible' && state.videoWidth && state.videoHeight) {
      applyPreviewSize(state.videoWidth, state.videoHeight)
    }

    const trackRect = progressBox.getBoundingClientRect()
    const paneRect = playerPane.getBoundingClientRect()
    previewEl.classList.add('visible')
    const width = previewEl.offsetWidth || 194
    const cursorX = trackRect.left - paneRect.left + ratio * trackRect.width
    const left = Math.max(8, Math.min(cursorX - width / 2, paneRect.width - width - 8))
    previewEl.style.left = `${Math.round(left)}px`

    const token = ++previewToken
    if (previewTimer) clearTimeout(previewTimer)
    previewTimer = setTimeout(() => {
      options.requestPreview?.(time, state.duration, (cover) => {
        if (token !== previewToken) return
        if (cover?.imgUrl) {
          if (cover.width && cover.height) applyPreviewSize(cover.width, cover.height)
          previewImg.src = cover.imgUrl
          previewImg.style.visibility = 'visible'
        }
      })
    }, 60)
  }

  const handlePreviewLeave = () => {
    previewToken += 1
    if (previewTimer) clearTimeout(previewTimer)
    previewEl.classList.remove('visible')
    previewImg.removeAttribute('src')
    previewImg.style.visibility = 'hidden'
  }

  progressBox.addEventListener('mousemove', handlePreviewMove)
  progressBox.addEventListener('mouseleave', handlePreviewLeave)

  // 内容状态 -> UI（标题 / 序号 / 大小 / 星标 / 面包屑 / 播放列表）
  const titleTextEl = topBar.querySelector('.m115-v2-title-text') as HTMLElement
  const badgeIndexEl = topBar.querySelector('.m115-v2-badge-index') as HTMLElement
  const badgeSizeEl = topBar.querySelector('.m115-v2-badge-size') as HTMLElement

  let prevContent: ContentState | null = null
  const renderContent = (c: ContentState) => {
    const p = prevContent
    if (!p || c.title !== p.title) {
      titleTextEl.textContent = c.title || '正在读取视频标题...'
    }
    if (!p || c.currentIndex !== p.currentIndex) {
      badgeIndexEl.textContent = c.currentIndex ? String(c.currentIndex).padStart(2, '0') : '--'
    }
    if (!p || c.fileSize !== p.fileSize) {
      badgeSizeEl.textContent = c.fileSize || ''
    }
    if (!p || c.isFavorite !== p.isFavorite) {
      favBtn.classList.toggle('active', c.isFavorite)
      favBtn.innerHTML = c.isFavorite ? Icons.StarFilled() : Icons.Star()
    }
    if (!p || c.path !== p.path) {
      renderCrumbs(c.path)
    }
    if (!p || c.playlist !== p.playlist || c.pickCode !== p.pickCode) {
      drawerHeading.textContent = `播放列表 (${c.playlist.length})`
      renderEpisodes(c.playlist, c.pickCode)
    }
    if (!p || c.quality !== p.quality) {
      const span = qualityBtn.querySelector('.m115-btn-text')
      if (span) span.textContent = c.quality || '原画'
    }
    prevContent = c
  }

  const unsubscribeContent = options.content.subscribe(renderContent)
  renderContent(options.content.get())

  // 鼠标空闲自动淡出
  let idleTimer: ReturnType<typeof setTimeout> | null = null
  const resetIdle = () => {
    playerPane.classList.remove('idle')
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      const isPlaylistOpen = playlistAside.classList.contains('open')
      const isSheetOpen = sheet.classList.contains('open')
      const isContextOpen = contextMenu.classList.contains('open')
      const isModalOpen = modalMask.classList.contains('open')
      if (!options.core.store.get().paused && !isPlaylistOpen && !isSheetOpen && !isContextOpen && !isModalOpen) {
        playerPane.classList.add('idle')
      }
    }, 2500)
  }

  playerPane.addEventListener('mousemove', resetIdle)
  playerPane.addEventListener('mouseenter', resetIdle)

  // 点击视频画面切换播放/暂停；顶栏/底栏/菜单/播放列表/侧键/预览等控件区域一律排除，避免误触
  const isControlTarget = (target: Node) =>
    topBar.contains(target)
    || bottomBar.contains(target)
    || sheet.contains(target)
    || toggleHandle.contains(target)
    || playlistAside.contains(target)
    || previewEl.contains(target)
    || contextMenu.contains(target)
    || modalMask.contains(target)
    || speedHud.contains(target)

  // 画面长按 2.0x 极速快进（松开自动恢复原倍速）
  let longPressTimer: ReturnType<typeof setTimeout> | null = null
  let isLongPressing = false
  let preLongPressRate = 1
  let cancelNextClick = false

  const startLongPress = (e: MouseEvent) => {
    if (e.button !== 0) return
    if (isControlTarget(e.target as Node)) return
    if (window.getSelection()?.toString()) return

    if (longPressTimer) clearTimeout(longPressTimer)
    longPressTimer = setTimeout(() => {
      isLongPressing = true
      cancelNextClick = true
      preLongPressRate = options.core.store.get().rate || 1
      options.core.setRate(2.0)
      speedHud.classList.add('visible')
    }, 280)
  }

  const endLongPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
    if (isLongPressing) {
      isLongPressing = false
      options.core.setRate(preLongPressRate)
      speedHud.classList.remove('visible')
    }
  }

  playerPane.addEventListener('mousedown', startLongPress)
  window.addEventListener('mouseup', endLongPress)
  playerPane.addEventListener('mouseleave', endLongPress)

  playerPane.addEventListener('click', (e) => {
    if (cancelNextClick) {
      cancelNextClick = false
      return
    }
    if (isControlTarget(e.target as Node)) return
    if (window.getSelection()?.toString()) return
    options.core.toggle()
  })

  // 右键视频画面弹出专业信息与上下文菜单
  playerPane.addEventListener('contextmenu', (e) => {
    if (isControlTarget(e.target as Node)) return
    e.preventDefault()
    e.stopPropagation()
    openContextMenu(e.clientX, e.clientY)
  })

  // 挂入整体结构
  playerPane.appendChild(overlay)
  viewport.appendChild(playerPane)
  viewport.appendChild(playlistAside)
  container.appendChild(viewport)

  return {
    viewport,
    destroy() {
      if (longPressTimer) clearTimeout(longPressTimer)
      if (statsTimer) clearInterval(statsTimer)
      statsTracker.destroy()
      unsubscribe()
      unsubscribeContent()
      disposePlaylistCovers?.()
      thumbAspectObserver?.disconnect()
      if (idleTimer) clearTimeout(idleTimer)
    },
  }
}
