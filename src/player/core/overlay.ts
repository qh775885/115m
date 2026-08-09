import type Artplayer from 'artplayer'
import { escapeHtml } from '../../shared/utils'
import { Icons } from '../../shared/icons'
import { UI_LAYER } from './ui-layer'
import { readOverlayMetaQuery } from './player-query'
import { createHeaderActionButton, createOverlayHeaderScaffold, getFavoriteButtonIcon } from './overlay-header'
import {
  bindPlaylistInteractions,
  buildPlaylistHtml,
  formatPlaylistSeconds,
  lazyLoadPlaylistCovers,
  scrollActivePlaylistNodeIntoView,
} from './overlay-playlist'

export interface OverlayPathItem {
  cid: string
  name: string
}

export interface OverlayPlaylistItem {
  pickCode: string
  fileId: string
  name: string
  size?: string
  isMarked?: boolean
  duration?: number
  sha?: string
  cid?: string
  progressSec?: number
  progressPercent?: number
}

export interface PlayerOverlayMeta {
  title: string
  fileSize: string
  fileId: string
  cid: string
  parentId: string
  isMarked: boolean
  path: OverlayPathItem[]
}

export interface PlayerOverlayOptions {
  art: Artplayer
  meta: PlayerOverlayMeta
  onMoveFile: (fileId: string, cid: string) => Promise<void>
  onToggleFavorite: (fileId: string, nextMarked: boolean) => Promise<boolean>
  onPlaylistToggle: (open: boolean) => Promise<OverlayPlaylistItem[]>
  onPlaylistOpenChange?: (open: boolean) => void
  onPlaylistPlay: (pickCode: string, keepPlaylistOpen: boolean) => void
  onPlaylistMove: (item: OverlayPlaylistItem) => Promise<void>
  onPlaylistDelete: (item: OverlayPlaylistItem) => Promise<void>
  onDeleteFile: (fileId: string, parentId: string, pickCode: string) => Promise<void>
  onPlayPrevious: () => void
  onPlayNext: () => void
  onReplay: () => void
  getCurrentPickCode: () => string
  shouldKeepPlaylistOpen: () => boolean
}

export interface OverlayPlaybackNavState {
  hasPrevious: boolean
  hasNext: boolean
  previousTitle?: string
  nextTitle?: string
  currentIndex?: number
  totalCount?: number
}

export interface OverlayPlaybackEndState {
  mode: 'autoplay-next' | 'ended'
  nextTitle?: string
  countdownSec?: number
}

export function readOverlayMetaFromQuery(): PlayerOverlayMeta {
  return readOverlayMetaQuery(window.location.search)
}

function overlayDebug(...args: unknown[]) {
  if (localStorage.getItem('115m-player-debug') === '1') {
    console.debug(...args)
  }
}

export class PlayerOverlayController {
  private readonly root: HTMLElement
  private readonly controlsEl: HTMLElement
  private readonly bottomEl: HTMLElement
  private readonly progressEl: HTMLElement
  private sidebarEl: HTMLElement | null
  private headerEl: HTMLElement | null = null
  private indexEl: HTMLElement | null = null
  private titleEl: HTMLElement | null = null
  private statsEl: HTMLElement | null = null
  private breadcrumbsEl: HTMLElement | null = null
  private playlistTabEl: HTMLElement | null = null
  private playlistListEl: HTMLElement | null = null
  private favBtnEl: HTMLButtonElement | null = null
  private moveBtnEl: HTMLButtonElement | null = null
  private prevBtnEl: HTMLButtonElement | null = null
  private nextBtnEl: HTMLButtonElement | null = null
  private endPanelEl: HTMLDivElement | null = null
  private endPanelTextEl: HTMLDivElement | null = null
  private endPanelSubTextEl: HTMLDivElement | null = null
  private endPanelNextBtnEl: HTMLButtonElement | null = null
  private visibleTimer: number | null = null
  private overlayVisible = false
  private isPointerInsideOverlay = false
  private isPointerOnProgress = false
  private playlistOpen = false
  private playlistItems: OverlayPlaylistItem[] = []
  private cleanupPlaylistCovers: (() => void) | null = null

  constructor(private readonly options: PlayerOverlayOptions) {
    this.root = options.art.template.$player as HTMLElement
    this.controlsEl = options.art.template.$controls as HTMLElement
    this.bottomEl = options.art.template.$bottom as HTMLElement
    this.progressEl = options.art.template.$progress as HTMLElement
    this.sidebarEl = document.getElementById('playlist-sidebar')
  }

  init() {
    // Hide the static HTML header
    const staticHeader = document.getElementById('header')
    if (staticHeader) staticHeader.style.display = 'none'

    this.mountHeaderOverlay()
    this.mountPlaylistTab()
    this.mountSidebarContent()
    this.mountPlaybackEndPanel()

    this.controlsEl.addEventListener('mouseenter', this.handleOverlayEnter)
    this.controlsEl.addEventListener('mouseleave', this.handleOverlayLeave)
    this.controlsEl.style.transition = 'opacity .2s ease'
    // 鼠标在进度条上时也保持控件不隐藏（查看预览图需要）
    if (this.progressEl) {
      this.progressEl.addEventListener('mouseenter', this.handleProgressEnter)
      this.progressEl.addEventListener('mouseleave', this.handleProgressLeave)
    }
    this.root.addEventListener('mousemove', this.handleMouseMove)
    this.root.addEventListener('mouseenter', this.handleMouseMove)
    this.root.addEventListener('mouseleave', this.handleMouseLeave)

    if (this.options.shouldKeepPlaylistOpen()) {
      void this.restorePlaylistOpen()
    }

    if (this.titleEl) this.titleEl.textContent = this.options.meta.title
    document.title = this.options.meta.title

    if (this.statsEl && this.options.meta.fileSize) {
      this.statsEl.textContent = this.options.meta.fileSize
      this.statsEl.style.display = ''
    }

    this.renderBreadcrumbs(this.options.meta.path)
    this.showTemporarily()
  }

  private async restorePlaylistOpen() {
    try {
      const items = await this.options.onPlaylistToggle(true)
      this.renderPlaylist(items)
      this.setPlaylistOpen(true)
    }
    catch (error) {
      overlayDebug('[115m] restore playlist open failed:', error)
    }
  }

  destroy() {
    if (this.visibleTimer) {
      window.clearTimeout(this.visibleTimer)
      this.visibleTimer = null
    }
    this.root.removeEventListener('mousemove', this.handleMouseMove)
    this.root.removeEventListener('mouseenter', this.handleMouseMove)
    this.root.removeEventListener('mouseleave', this.handleMouseLeave)
    this.controlsEl.removeEventListener('mouseenter', this.handleOverlayEnter)
    this.controlsEl.removeEventListener('mouseleave', this.handleOverlayLeave)
    this.progressEl?.removeEventListener('mouseenter', this.handleProgressEnter)
    this.progressEl?.removeEventListener('mouseleave', this.handleProgressLeave)
    this.headerEl?.removeEventListener('mouseenter', this.handleOverlayEnter)
    this.headerEl?.removeEventListener('mouseleave', this.handleOverlayLeave)
    this.sidebarEl?.removeEventListener('mouseenter', this.handleOverlayEnter)
    this.sidebarEl?.removeEventListener('mouseleave', this.handleOverlayLeave)
    this.sidebarEl?.removeEventListener('pointerdown', this.stopInteractiveEvent)
    this.sidebarEl?.removeEventListener('mousedown', this.stopInteractiveEvent)
    this.sidebarEl?.removeEventListener('click', this.stopInteractiveEvent)
    this.cleanupPlaylistCovers?.()
    this.cleanupPlaylistCovers = null
    this.playlistTabEl?.remove()
    this.headerEl?.remove()
    this.endPanelEl?.remove()
  }

  setCurrentTitle(title: string) {
    this.options.meta.title = title
    if (this.titleEl) this.titleEl.textContent = title
    document.title = title
  }

  updateBreadcrumbs(items: OverlayPathItem[]) {
    if (!items || items.length === 0) return
    this.options.meta.path = items
    this.renderBreadcrumbs(items)
  }

  updateFavoriteStatus(isMarked: boolean) {
    this.options.meta.isMarked = isMarked
    this.updateFavoriteIcon()
  }

  updateMeta(meta: Partial<PlayerOverlayMeta>) {
    const prevCid = this.options.meta.cid
    Object.assign(this.options.meta, meta)

    if (typeof meta.cid === 'string') {
      if (meta.cid) {
        this.options.meta.cid = meta.cid
        this.options.meta.parentId = meta.cid
      }
      else {
        this.options.meta.cid = prevCid
        this.options.meta.parentId = prevCid
      }
    }

    if (typeof meta.title === 'string') {
      this.setCurrentTitle(meta.title)
    }

    if (typeof meta.fileSize === 'string' && this.statsEl) {
      this.statsEl.textContent = meta.fileSize
      this.statsEl.style.display = meta.fileSize ? '' : 'none'
    }

    if (Array.isArray(meta.path)) {
      this.renderBreadcrumbs(meta.path)
    }

    if (typeof meta.isMarked === 'boolean') {
      this.updateFavoriteIcon()
    }
  }

  updatePlaylist(items: OverlayPlaylistItem[]) {
    this.renderPlaylist(items)
  }

  updateCurrentPlaylistProgress(pickCode: string, progressSec: number, duration: number) {
    if (!pickCode || !duration || duration <= 0) return

    const item = this.playlistItems.find(entry => entry.pickCode === pickCode)
    if (!item) return

    const progressPercent = Math.max(0, Math.min(100, (progressSec / duration) * 100))
    item.progressSec = progressSec
    item.progressPercent = progressPercent

    if (!this.playlistListEl) return
    const node = this.playlistListEl.querySelector<HTMLElement>(`.m115-pl-item[data-pickcode="${escapeHtml(pickCode)}"]`)
    if (!node) return

    const container = node.querySelector<HTMLElement>('[data-role="playlist-progress"]')
    const bar = node.querySelector<HTMLElement>('[data-role="playlist-progress-bar"]')
    const text = node.querySelector<HTMLElement>('[data-role="playlist-progress-text"]')

    if (container) {
      container.style.display = progressPercent > 0 ? 'flex' : 'none'
    }
    if (bar) {
      bar.style.width = `${Math.max(2, Math.min(100, progressPercent))}%`
    }
    if (text) {
      text.textContent = formatPlaylistSeconds(progressSec)
      text.style.display = 'inline'
    }
  }

  isPlaylistExpanded() {
    return this.playlistOpen
  }

  updatePlaybackNav(state: OverlayPlaybackNavState) {
    this.syncNavButton(this.prevBtnEl, state.hasPrevious, state.previousTitle ? `上一集：${state.previousTitle}` : '没有上一集')
    this.syncNavButton(this.nextBtnEl, state.hasNext, state.nextTitle ? `下一集：${state.nextTitle}` : '没有下一集')
    this.updatePlaylistIndex(state.currentIndex, state.totalCount)
    if (this.endPanelNextBtnEl) {
      this.endPanelNextBtnEl.disabled = !state.hasNext
      this.endPanelNextBtnEl.style.opacity = state.hasNext ? '1' : '.45'
      this.endPanelNextBtnEl.style.cursor = state.hasNext ? 'pointer' : 'not-allowed'
      this.endPanelNextBtnEl.title = state.hasNext ? (state.nextTitle ? `下一集：${state.nextTitle}` : '下一集') : '没有下一集'
    }
  }

  showPlaybackEndPanel(state: OverlayPlaybackEndState) {
    if (!this.endPanelEl || !this.endPanelTextEl || !this.endPanelSubTextEl) return
    this.endPanelTextEl.textContent = '当前视频播放完成'
    if (state.mode === 'autoplay-next' && state.nextTitle) {
      const sec = Math.max(1, state.countdownSec || 1)
      this.endPanelSubTextEl.textContent = `${sec} 秒后自动播放下一集：${state.nextTitle}`
    }
    else {
      this.endPanelSubTextEl.textContent = state.nextTitle ? `下一集：${state.nextTitle}` : '已经是最后一集'
    }
    this.endPanelEl.style.display = 'flex'
  }

  hidePlaybackEndPanel() {
    if (!this.endPanelEl) return
    this.endPanelEl.style.display = 'none'
  }

  showToast(text: string) {
    const existing = this.root.querySelector('.m115-toast')
    existing?.remove()

    const toast = document.createElement('div')
    toast.className = 'm115-toast'
    toast.textContent = text
    toast.style.cssText = [
      'position:absolute',
      'top:60px',
      'left:50%',
      'transform:translateX(-50%) translateY(-8px)',
      `z-index:${UI_LAYER.toast}`,
      'padding:8px 20px',
      'border-radius:999px',
      'background:rgba(0,0,0,.85)',
      'color:#fff',
      'font-size:13px',
      'font-weight:500',
      'white-space:nowrap',
      'pointer-events:none',
      'opacity:0',
      'transition:opacity .2s ease, transform .2s ease',
      'backdrop-filter:blur(8px)',
    ].join(';')
    this.root.appendChild(toast)

    requestAnimationFrame(() => {
      toast.style.opacity = '1'
      toast.style.transform = 'translateX(-50%) translateY(0)'
    })
    setTimeout(() => {
      toast.style.opacity = '0'
      toast.style.transform = 'translateX(-50%) translateY(-8px)'
      setTimeout(() => toast.remove(), 200)
    }, 1800)
  }

  private syncNavButton(button: HTMLButtonElement | null, enabled: boolean, title: string) {
    if (!button) return
    button.disabled = !enabled
    button.title = title
    button.style.opacity = enabled ? '1' : '.38'
    button.style.cursor = enabled ? 'pointer' : 'not-allowed'
  }

  private updatePlaylistIndex(currentIndex?: number, totalCount?: number) {
    if (!this.indexEl) return
    const visible = typeof currentIndex === 'number' && currentIndex > 0 && typeof totalCount === 'number' && totalCount > 0
    this.indexEl.textContent = visible ? `${currentIndex} / ${totalCount}` : ''
    this.indexEl.style.display = visible ? 'inline-flex' : 'none'
  }

  private bindFavoriteButton(button: HTMLButtonElement) {
    button.addEventListener('click', async () => {
      const fileId = this.options.meta.fileId
      if (!fileId) {
        this.showToast('文件 ID 缺失，无法收藏')
        return
      }

      const nextMarked = !this.options.meta.isMarked
      button.style.opacity = '0.4'
      button.style.pointerEvents = 'none'
      button.style.transform = 'scale(0.85)'
      try {
        const result = await this.options.onToggleFavorite(fileId, nextMarked)
        this.options.meta.isMarked = result
        this.updateFavoriteIcon()
        button.style.transform = 'scale(1.3)'
        setTimeout(() => { button.style.transform = '' }, 200)
        this.showToast(result ? '已星标' : '已取消星标')
      }
      catch (e) {
        console.error('[115m] 收藏失败:', e)
        this.showToast('操作失败')
      }
      finally {
        button.style.opacity = ''
        button.style.pointerEvents = ''
      }
    })
  }

  private mountPlaybackEndPanel() {
    this.endPanelEl?.remove()

    const panel = document.createElement('div')
    panel.className = 'm115-playback-end m115-interactive m115-layer-playback-end'
    panel.style.cssText = [
      'position:absolute',
      'left:50%',
      'top:50%',
      'transform:translate(-50%,-50%)',
      `z-index:${UI_LAYER.playbackEnd}`,
      'display:none',
      'flex-direction:column',
      'align-items:center',
      'gap:12px',
      'min-width:320px',
      'max-width:min(72vw,520px)',
      'padding:24px 28px',
      'border:1px solid rgba(255,255,255,.14)',
      'border-radius:18px',
      'background:rgba(8,8,8,.84)',
      'box-shadow:0 20px 60px rgba(0,0,0,.38)',
      'backdrop-filter:blur(14px)',
      'pointer-events:auto',
      'box-sizing:border-box',
      'text-align:center',
    ].join(';')

    const title = document.createElement('div')
    title.style.cssText = 'font-size:20px;font-weight:700;color:#fff;line-height:1.4;'

    const desc = document.createElement('div')
    desc.style.cssText = 'font-size:13px;line-height:1.6;color:rgba(255,255,255,.72);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'

    const actions = document.createElement('div')
    actions.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;'

    const replayBtn = document.createElement('button')
    replayBtn.type = 'button'
    replayBtn.textContent = '重播'
    replayBtn.style.cssText = 'min-width:92px;height:38px;padding:0 16px;border:none;border-radius:999px;background:#1890ff;color:#fff;font-size:14px;font-weight:600;cursor:pointer;'
    replayBtn.addEventListener('click', this.options.onReplay)

    const nextBtn = document.createElement('button')
    nextBtn.type = 'button'
    nextBtn.textContent = '下一集'
    nextBtn.style.cssText = 'min-width:92px;height:38px;padding:0 16px;border:1px solid rgba(255,255,255,.16);border-radius:999px;background:rgba(255,255,255,.08);color:#fff;font-size:14px;font-weight:600;cursor:pointer;'
    nextBtn.addEventListener('click', this.options.onPlayNext)

    actions.appendChild(replayBtn)
    actions.appendChild(nextBtn)
    panel.appendChild(title)
    panel.appendChild(desc)
    panel.appendChild(actions)
    this.root.appendChild(panel)

    this.endPanelEl = panel
    this.endPanelTextEl = title
    this.endPanelSubTextEl = desc
    this.endPanelNextBtnEl = nextBtn
  }

  private renderBreadcrumbs(items: OverlayPathItem[]) {
    if (!this.breadcrumbsEl) return
    if (items.length === 0) {
      this.breadcrumbsEl.style.display = 'none'
      this.breadcrumbsEl.innerHTML = ''
      return
    }

    this.breadcrumbsEl.style.display = ''
    this.breadcrumbsEl.innerHTML = items.map((item, index) => {
      const sep = index < items.length - 1 ? '<span style="margin:0 6px;opacity:.4">›</span>' : ''
      return `<a style="pointer-events:auto;text-decoration:none;color:inherit;transition:color .15s" onmouseenter="this.style.color='#fff'" onmouseleave="this.style.color=''" href="https://115.com/?cid=${encodeURIComponent(item.cid)}&offset=0&tab=&mode=wangpan" target="_blank" rel="noreferrer">${escapeHtml(item.name)}</a>${sep}`
    }).join('')
  }

  private renderPlaylist(items: OverlayPlaylistItem[]) {
    if (!this.playlistListEl) return
    this.playlistItems = items
    const currentPickCode = this.options.getCurrentPickCode()

    this.cleanupPlaylistCovers?.()
    this.cleanupPlaylistCovers = null
    this.playlistListEl.innerHTML = buildPlaylistHtml(items, currentPickCode)
    bindPlaylistInteractions(this.playlistListEl, currentPickCode, items, {
      onPlay: this.options.onPlaylistPlay,
      onMove: this.options.onPlaylistMove,
      onDelete: this.options.onPlaylistDelete,
    })
    scrollActivePlaylistNodeIntoView(this.playlistListEl, currentPickCode)
    this.cleanupPlaylistCovers = lazyLoadPlaylistCovers(this.playlistListEl, items)
  }

  private setVisible(visible: boolean) {
    this.overlayVisible = visible
    if (this.headerEl) {
      this.headerEl.style.opacity = visible ? '1' : '0'
      this.headerEl.style.pointerEvents = visible ? 'auto' : 'none'
    }
    this.controlsEl.style.opacity = visible ? '1' : '0'
    this.controlsEl.style.pointerEvents = visible ? 'auto' : 'none'
    this.bottomEl.style.opacity = visible ? '1' : '0'
    this.bottomEl.style.pointerEvents = visible ? 'auto' : 'none'
    this.progressEl.style.opacity = visible ? '1' : '0'
    this.progressEl.style.pointerEvents = visible ? 'auto' : 'none'
    this.syncPlaylistTabVisibility(visible)
    this.root.style.cursor = visible || this.playlistOpen ? 'auto' : 'none'
  }

  private syncPlaylistTabVisibility(visible: boolean) {
    if (!this.playlistTabEl) return

    if (this.playlistOpen) {
      this.playlistTabEl.style.opacity = '0'
      this.playlistTabEl.style.pointerEvents = 'none'
      return
    }

    this.playlistTabEl.style.opacity = visible ? '0.6' : '0'
    this.playlistTabEl.style.pointerEvents = visible ? 'auto' : 'none'
  }

  // ── Header (left side only: back, title, stats, breadcrumbs) ──

  private mountHeaderOverlay() {
    this.headerEl?.remove()
    const { header, back, titleRow, title, index, stats, breadcrumbs, pillGroup } = createOverlayHeaderScaffold()
    const favBtn = createHeaderActionButton('星标', '')
    favBtn.style.marginLeft = '0'
    favBtn.style.flexShrink = '0'
    this.bindFavoriteButton(favBtn)

    titleRow.appendChild(index)
    titleRow.appendChild(title)
    titleRow.appendChild(stats)
    titleRow.appendChild(favBtn)
    const moveBtn = createHeaderActionButton('移动视频', Icons.Move)
    moveBtn.addEventListener('click', async () => {
      const { fileId, cid } = this.options.meta
      if (!fileId) {
        this.showToast('文件 ID 缺失')
        return
      }
      try {
        await this.options.onMoveFile(fileId, cid)
      } catch (e: any) {
        const msg = e?.message || ''
        console.error('[115m] 移动失败:', msg)
        if (msg.includes('User canceled')) { /* user closed dialog, no toast needed */ }
        else this.showToast('移动失败: ' + msg)
      }
    })
    const deleteBtn = createHeaderActionButton('删除视频', Icons.Trash)
    deleteBtn.addEventListener('click', async () => {
      const fileId = this.options.meta.fileId
      const parentId = this.options.meta.cid
      const pickCode = this.options.getCurrentPickCode()
      if (!fileId || !parentId || !pickCode) {
        this.showToast('缺少删除参数')
        return
      }
      try {
        await this.options.onDeleteFile(fileId, parentId, pickCode)
      }
      catch (error) {
        this.showToast(error instanceof Error ? error.message : '删除失败')
      }
    })

    this.favBtnEl = favBtn
    this.moveBtnEl = moveBtn
    this.updateFavoriteIcon()

    pillGroup.appendChild(moveBtn)
    pillGroup.appendChild(deleteBtn)

    this.root.appendChild(header)

    this.headerEl = header
    this.indexEl = index
    this.titleEl = title
    this.statsEl = stats
    this.breadcrumbsEl = breadcrumbs

    header.classList.add('m115-interactive')
    back.addEventListener('click', this.handleBack)
    header.addEventListener('mouseenter', this.handleOverlayEnter)
    header.addEventListener('mouseleave', this.handleOverlayLeave)
  }

  private updateFavoriteIcon() {
    if (!this.favBtnEl) return
    const marked = this.options.meta.isMarked
    this.favBtnEl.title = marked ? '取消星标' : '星标'
    this.favBtnEl.innerHTML = getFavoriteButtonIcon(marked)
  }

  // ── Playlist toggle tab (right edge, vertically centered) ──

  private mountPlaylistTab() {
    const tab = document.createElement('button')
    tab.type = 'button'
    tab.className = 'm115-playlist-tab'
    tab.style.cssText = [
      'position:absolute',
      'right:0',
      'top:50%',
      'transform:translateY(-50%)',
      `z-index:${UI_LAYER.playlistTab}`,
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'width:28px',
      'height:72px',
      'border-radius:8px 0 0 8px',
      'background:rgba(0,0,0,.5)',
      'border:1px solid rgba(255,255,255,.12)',
      'border-right:none',
      'color:rgba(255,255,255,.6)',
      'cursor:pointer',
      'transition:background .2s, color .2s, opacity .2s',
      'pointer-events:auto',
      'opacity:0.6',
    ].join(';')
    tab.title = '播放列表'
    tab.setAttribute('aria-label', '播放列表')
    tab.setAttribute('aria-expanded', 'false')
    tab.classList.add('m115-interactive', 'm115-layer-playlist-tab')
    tab.innerHTML = Icons.Playlist

    tab.addEventListener('mouseenter', () => {
      tab.style.background = 'rgba(0,0,0,.7)'
      tab.style.color = '#fff'
      tab.style.opacity = '1'
    })
    tab.addEventListener('mouseleave', () => {
      if (!this.playlistOpen) {
        tab.style.background = 'rgba(0,0,0,.5)'
        tab.style.color = 'rgba(255,255,255,.6)'
        tab.style.opacity = '0.6'
      }
    })
    tab.addEventListener('click', this.handlePlaylistToggle)

    this.root.appendChild(tab)
    this.playlistTabEl = tab
  }

  // ── Sidebar content (rendered into #playlist-sidebar, outside the player) ──

  private mountSidebarContent() {
    if (!this.sidebarEl) {
      // 在构造时可能还没找到，再次尝试
      this.sidebarEl = document.getElementById('playlist-sidebar')
    }
    if (!this.sidebarEl) {
      console.warn('[115m] #playlist-sidebar not found in DOM')
      return
    }
    overlayDebug('[115m] mountSidebarContent: sidebar found, setting up content')

    this.sidebarEl.innerHTML = ''
    this.sidebarEl.style.cssText = 'width:0;min-width:0;flex:0 0 0;overflow:hidden;transition:width .25s ease, flex-basis .25s ease;background:#0a0a0a;border-left:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;box-sizing:border-box;height:100%;pointer-events:none;'
    this.sidebarEl.classList.add('m115-playlist-sidebar', 'm115-interactive')
    this.sidebarEl.addEventListener('mouseenter', this.handleOverlayEnter)
    this.sidebarEl.addEventListener('mouseleave', this.handleOverlayLeave)
    this.sidebarEl.addEventListener('pointerdown', this.stopInteractiveEvent)
    this.sidebarEl.addEventListener('mousedown', this.stopInteractiveEvent)
    this.sidebarEl.addEventListener('click', this.stopInteractiveEvent)

    // Panel header
    const panelHeader = document.createElement('div')
    panelHeader.className = 'm115-playlist-panel-header'
    panelHeader.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:14px 14px 10px;flex-shrink:0;width:100%;box-sizing:border-box;'

    const panelTitle = document.createElement('div')
    panelTitle.className = 'm115-playlist-panel-title'
    panelTitle.style.cssText = 'font-size:14px;font-weight:600;color:rgba(255,255,255,.9)'
    panelTitle.textContent = '播放列表'

    const closeBtn = document.createElement('button')
    closeBtn.type = 'button'
    closeBtn.className = 'm115-playlist-close'
    closeBtn.title = '关闭'
    closeBtn.style.cssText = 'display:flex;align-items:center;justify-content:center;width:28px;height:28px;border:none;border-radius:6px;background:transparent;color:rgba(255,255,255,.5);cursor:pointer;transition:background .15s,color .15s'
    closeBtn.innerHTML = Icons.Close
    closeBtn.addEventListener('mouseenter', () => { closeBtn.style.background = 'rgba(255,255,255,.1)'; closeBtn.style.color = '#fff' })
    closeBtn.addEventListener('mouseleave', () => { closeBtn.style.background = 'transparent'; closeBtn.style.color = 'rgba(255,255,255,.5)' })
    closeBtn.addEventListener('click', () => this.setPlaylistOpen(false))

    panelHeader.appendChild(panelTitle)
    panelHeader.appendChild(closeBtn)

    // List container
    const listContainer = document.createElement('div')
    listContainer.className = 'm115-pl-scroll m115-playlist-list'
    listContainer.style.cssText = 'flex:1;overflow-y:auto;padding:0 8px 12px;width:100%;box-sizing:border-box;'

    // Custom scrollbar
    const scrollStyle = document.createElement('style')
    scrollStyle.textContent = `
      .m115-pl-scroll::-webkit-scrollbar { width: 4px; }
      .m115-pl-scroll::-webkit-scrollbar-track { background: transparent; }
      .m115-pl-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 4px; }
      .m115-pl-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.3); }
    `
    this.sidebarEl.appendChild(scrollStyle)
    this.sidebarEl.appendChild(panelHeader)
    this.sidebarEl.appendChild(listContainer)
    this.playlistListEl = listContainer
  }

  private setPlaylistOpen(open: boolean) {
    this.playlistOpen = open
    this.options.onPlaylistOpenChange?.(open)
    // Expand/collapse the external sidebar — the video area shrinks/grows via flex
    if (this.sidebarEl) {
      const width = open ? `${this.getPlaylistSidebarWidth()}px` : '0px'
      this.sidebarEl.style.width = width
      this.sidebarEl.style.minWidth = width
      this.sidebarEl.style.flex = open ? `0 0 ${width}` : '0 0 0px'
      this.sidebarEl.style.pointerEvents = open ? 'auto' : 'none'

      const computed = window.getComputedStyle(this.sidebarEl)
      overlayDebug('[115m] setPlaylistOpen:', {
        open,
        sidebarEl: true,
        inlineWidth: this.sidebarEl.style.width,
        inlineMinWidth: this.sidebarEl.style.minWidth,
        inlineFlex: this.sidebarEl.style.flex,
        computedWidth: computed.width,
        computedDisplay: computed.display,
      })
    }
    if (this.playlistTabEl) {
      this.playlistTabEl.setAttribute('aria-expanded', open ? 'true' : 'false')
      this.syncPlaylistTabVisibility(this.overlayVisible)
    }
    this.setVisible(open || this.isPointerInsideOverlay)
  }

  // ── Event handlers ──

  private showTemporarily() {
    this.setVisible(true)
    if (this.visibleTimer) {
      window.clearTimeout(this.visibleTimer)
    }
    this.visibleTimer = window.setTimeout(() => {
      if (!this.isPointerInsideOverlay && !this.playlistOpen && !this.isPointerOnProgress) {
        this.setVisible(false)
      }
    }, 1000)
  }

  private getPlaylistSidebarWidth() {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0
    if (viewportWidth <= 640) {
      return Math.min(320, Math.max(240, viewportWidth - 32))
    }
    return Math.min(360, Math.max(260, Math.round(viewportWidth * 0.32)))
  }

  private handleBack = () => {
    if (window.history.length > 1) window.history.back()
    else window.close()
  }

  private handleMouseMove = () => {
    this.showTemporarily()
  }

  private handleMouseLeave = () => {
    if (!this.playlistOpen && !this.isPointerInsideOverlay && !this.isPointerOnProgress) {
      this.setVisible(false)
    }
  }

  private handleOverlayEnter = () => {
    this.isPointerInsideOverlay = true
    this.setVisible(true)
  }

  private handleOverlayLeave = () => {
    this.isPointerInsideOverlay = false
    this.showTemporarily()
  }

  private handleProgressEnter = () => {
    this.isPointerOnProgress = true
    this.setVisible(true)
    // 鼠标进入进度条时取消隐藏定时器
    if (this.visibleTimer) {
      window.clearTimeout(this.visibleTimer)
      this.visibleTimer = null
    }
  }

  private handleProgressLeave = () => {
    this.isPointerOnProgress = false
    this.showTemporarily()
  }

  private stopInteractiveEvent = (event: Event) => {
    event.stopPropagation()
  }

  private handlePlaylistToggle = async () => {
    const nextOpen = !this.playlistOpen
    overlayDebug('[115m] handlePlaylistToggle:', { nextOpen, sidebarEl: !!this.sidebarEl, playlistListEl: !!this.playlistListEl })
    if (nextOpen) {
      try {
        const items = await this.options.onPlaylistToggle(true)
        overlayDebug('[115m] playlist items received:', items.length)
        this.renderPlaylist(items)
      }
      catch (error) {
        overlayDebug('[115m] playlist toggle failed:', error)
      }
    }
    this.setPlaylistOpen(nextOpen)
  }
}
