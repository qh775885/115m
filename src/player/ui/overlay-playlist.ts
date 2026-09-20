import { escapeHtml } from '../../shared/utils'
import { Icons } from '../../shared/icons'
import { getVideoCovers } from '../../lib/videoThumbnail'
import { formatCompactTime } from './hover-utils'
import { PlaylistCoverScheduler, TaskCancelledError } from './playlist-scheduler'
import type { OverlayPlaylistItem } from '../types/overlay-types'
import type { PlaylistViewMode } from './playlist-view-mode'

const esc = escapeHtml
const PLAYLIST_COVER_FEATURE_ENABLED = true
const PLAYLIST_COVER_CONCURRENCY = 2
const SCROLL_STOP_DEBOUNCE_MS = 250

export function renderPlaylistProgress(item: OverlayPlaylistItem, active: boolean) {
  const visible = !!item.progressPercent && item.progressPercent > 0
  const progressText = typeof item.progressSec === 'number' && item.progressSec > 0
    ? formatCompactTime(item.progressSec)
    : ''

  return `
    <div data-role="playlist-progress" style="margin-top:6px;display:${visible ? 'flex' : 'none'};align-items:center;gap:8px;min-width:0;">
      <div style="flex:1;height:4px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden;">
        <div data-role="playlist-progress-bar" style="width:${Math.max(2, Math.min(100, item.progressPercent || 0))}%;height:100%;border-radius:999px;background:${active ? '#38bdf8' : 'rgba(255,255,255,.56)'};"></div>
      </div>
      <span data-role="playlist-progress-text" style="flex:0 0 auto;font-size:10px;color:rgba(255,255,255,.42);font-variant-numeric:tabular-nums;display:${progressText ? 'inline' : 'none'};">${progressText}</span>
    </div>
  `
}

export interface PlaylistItemActionHandlers {
  onPlay: (pickCode: string, keepPlaylistOpen: boolean) => void
  onMove: (item: OverlayPlaylistItem) => Promise<void> | void
  onDelete: (item: OverlayPlaylistItem) => Promise<void> | void
}

export function buildPlaylistHtml(
  items: OverlayPlaylistItem[],
  currentPickCode: string,
  mode: PlaylistViewMode = 'card',
) {
  return items.map((item, index) => {
    const active = item.pickCode === currentPickCode
    const num = index + 1
    const durationText = item.duration && item.duration > 0 ? formatCompactTime(item.duration) : ''

    if (mode === 'compact') {
      return `
        <div class="m115-pl-item m115-pl-compact${active ? ' is-active' : ''}" data-pickcode="${esc(item.pickCode)}" data-index="${index}" ${active ? 'aria-current="true"' : ''}
          style="background:${active ? 'rgba(255,255,255,.12)' : 'transparent'};">
          <span class="m115-pl-compact-num">${num}</span>
          <div class="m115-pl-info">
            <div class="m115-pl-title" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
            <div class="m115-pl-meta-row">
              <div class="m115-pl-meta-tags">
                ${item.size ? `<span class="m115-pl-size">${escapeHtml(item.size)}</span>` : ''}
                ${durationText ? `<span class="m115-pl-dur">${durationText}</span>` : ''}
              </div>
              <div class="m115-pl-actions">
                <button type="button" class="m115-pl-action" data-action="move" title="移动视频" aria-label="移动视频">
                  ${Icons.Move()}
                </button>
                <button type="button" class="m115-pl-action" data-action="delete" title="删除视频" aria-label="删除视频">
                  ${Icons.Trash()}
                </button>
              </div>
            </div>
            ${renderPlaylistProgress(item, active)}
          </div>
        </div>
      `
    }

    return `
      <div class="m115-pl-item${active ? ' is-active' : ''}" data-pickcode="${esc(item.pickCode)}" data-index="${index}" ${active ? 'aria-current="true"' : ''}
        style="background:${active ? 'rgba(255,255,255,.12)' : 'transparent'};">
        <div class="m115-pl-thumb">
          <span class="m115-pl-thumb-placeholder">${Icons.Play()}</span>
          <span class="m115-pl-badge-num ${active ? 'is-active' : ''}">${num}</span>
          ${durationText ? `<span class="m115-pl-badge-dur">${durationText}</span>` : ''}
        </div>
        <div class="m115-pl-info">
          <div class="m115-pl-title" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
          <div class="m115-pl-meta-row">
            ${item.size ? `<span class="m115-pl-size">${escapeHtml(item.size)}</span>` : '<span class="m115-pl-size-spacer"></span>'}
            <div class="m115-pl-actions">
              <button type="button" class="m115-pl-action" data-action="move" title="移动视频" aria-label="移动视频">
                ${Icons.Move()}
              </button>
              <button type="button" class="m115-pl-action" data-action="delete" title="删除视频" aria-label="删除视频">
                ${Icons.Trash()}
              </button>
            </div>
          </div>
          ${renderPlaylistProgress(item, active)}
        </div>
      </div>
    `
  }).join('')
}

export function bindPlaylistInteractions(
  listEl: HTMLElement,
  currentPickCode: string,
  items: OverlayPlaylistItem[],
  handlers: PlaylistItemActionHandlers,
) {
  listEl.querySelectorAll<HTMLElement>('.m115-pl-item').forEach((node) => {
    const pc = node.dataset.pickcode || ''

    node.addEventListener('click', (event) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('.m115-pl-action')) return
      if (pc) handlers.onPlay(pc, true)
    })

    const moveBtn = node.querySelector<HTMLButtonElement>('[data-action="move"]')
    moveBtn?.addEventListener('click', (e) => {
      e.stopPropagation()
      const idx = parseInt(node.dataset.index || '-1', 10)
      const item = items[idx]
      if (item) void handlers.onMove(item)
    })

    const deleteBtn = node.querySelector<HTMLButtonElement>('[data-action="delete"]')
    deleteBtn?.addEventListener('click', (e) => {
      e.stopPropagation()
      const idx = parseInt(node.dataset.index || '-1', 10)
      const item = items[idx]
      if (item) void handlers.onDelete(item)
    })
  })
}

export function scrollActivePlaylistNodeIntoView(listEl: HTMLElement, currentPickCode: string) {
  const activeNode = listEl.querySelector(`[data-pickcode="${esc(currentPickCode)}"]`)
  activeNode?.scrollIntoView({ block: 'center', behavior: 'instant' })
}

interface ItemCoverState {
  item: OverlayPlaylistItem
  thumbEl: HTMLElement
  visible: boolean
  loaded: boolean
  loading: boolean
  cancel?: () => void
}

export function lazyLoadPlaylistCovers(listEl: HTMLElement, items: OverlayPlaylistItem[]) {
  if (!PLAYLIST_COVER_FEATURE_ENABLED) {
    return () => {}
  }

  const thumbEls = listEl.querySelectorAll<HTMLElement>('.m115-pl-thumb')
  if (thumbEls.length === 0) {
    return () => {}
  }

  const scheduler = new PlaylistCoverScheduler(PLAYLIST_COVER_CONCURRENCY)
  const states = new Map<string, ItemCoverState>()

  thumbEls.forEach((thumbEl) => {
    const node = thumbEl.closest<HTMLElement>('.m115-pl-item')
    const idx = parseInt(node?.dataset.index || '-1', 10)
    const item = items[idx]
    if (item) {
      states.set(item.pickCode, {
        item,
        thumbEl,
        visible: false,
        loaded: false,
        loading: false,
      })
    }
  })

  let isScrolling = false
  let scrollStopTimer: number | null = null

  const scheduleItemLoad = (state: ItemCoverState) => {
    if (state.loaded || state.loading || (state.item.duration || 0) <= 0) return
    state.loading = true

    const { promise, cancel } = scheduler.add(() => getVideoCovers(state.item.pickCode, state.item.duration || 0, 1))
    state.cancel = cancel

    promise
      .then((covers) => {
        state.loaded = true
        if (covers.length > 0 && state.thumbEl.isConnected) {
          const placeholder = state.thumbEl.querySelector('.m115-pl-thumb-placeholder')
          placeholder?.remove()
          const existingImg = state.thumbEl.querySelector('img')
          existingImg?.remove()
          const img = document.createElement('img')
          img.src = covers[0].imgUrl
          img.alt = ''
          img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center;display:block;'
          state.thumbEl.prepend(img)
        }
        observer.unobserve(state.thumbEl)
      })
      .catch((err) => {
        if (err instanceof TaskCancelledError) {
          return
        }
        console.warn(`[115m] 播放列表封面抽帧失败 ${state.item.pickCode}:`, err)
      })
      .finally(() => {
        state.loading = false
        state.cancel = undefined
      })
  }

  const scheduleVisibleItems = () => {
    if (isScrolling) return
    states.forEach((state) => {
      if (state.visible && !state.loaded && !state.loading) {
        scheduleItemLoad(state)
      }
    })
  }

  const onScroll = () => {
    isScrolling = true
    if (scrollStopTimer !== null) {
      window.clearTimeout(scrollStopTimer)
    }
    scrollStopTimer = window.setTimeout(() => {
      isScrolling = false
      scrollStopTimer = null
      scheduleVisibleItems()
    }, SCROLL_STOP_DEBOUNCE_MS)
  }

  listEl.addEventListener('scroll', onScroll, { passive: true })

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const thumbEl = entry.target as HTMLElement
      const node = thumbEl.closest<HTMLElement>('.m115-pl-item')
      const idx = parseInt(node?.dataset.index || '-1', 10)
      const item = items[idx]
      if (!item) continue

      const state = states.get(item.pickCode)
      if (!state) continue

      if (entry.isIntersecting) {
        state.visible = true
        if (!isScrolling) {
          scheduleItemLoad(state)
        }
      }
      else {
        state.visible = false
        // 离开视口：未运行的任务立即撤销，释放排队槽位
        if (state.cancel) {
          state.cancel()
          state.cancel = undefined
          state.loading = false
        }
      }
    }
  }, { root: listEl, rootMargin: '40px 0px' })

  thumbEls.forEach(el => observer.observe(el))

  return () => {
    if (scrollStopTimer !== null) {
      window.clearTimeout(scrollStopTimer)
      scrollStopTimer = null
    }
    listEl.removeEventListener('scroll', onScroll)
    observer.disconnect()
    scheduler.clear()
    states.forEach((state) => {
      if (state.cancel) {
        state.cancel()
        state.cancel = undefined
      }
    })
    states.clear()
  }
}

