import { escapeHtml } from '../../shared/utils'
import { Icons } from '../../shared/icons'
import { getVideoCovers } from '../../lib/videoThumbnail'
import { formatCompactTime } from './hover-utils'
import type { OverlayPlaylistItem } from './overlay-types'

const esc = escapeHtml
const PLAYLIST_COVER_FEATURE_ENABLED = true
const PLAYLIST_COVER_CONCURRENCY = 3
let activePlaylistCoverTasks = 0
const playlistCoverTaskQueue: Array<() => void> = []

function runPlaylistCoverTask<T>(task: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = () => {
      activePlaylistCoverTasks += 1
      task().then(resolve, reject).finally(() => {
        activePlaylistCoverTasks -= 1
        playlistCoverTaskQueue.shift()?.()
      })
    }

    if (activePlaylistCoverTasks < PLAYLIST_COVER_CONCURRENCY) {
      run()
      return
    }

    playlistCoverTaskQueue.push(run)
  })
}

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

export function buildPlaylistHtml(items: OverlayPlaylistItem[], currentPickCode: string) {
  return items.map((item, index) => {
    const active = item.pickCode === currentPickCode
    const num = index + 1
    return `
      <div class="m115-pl-item${active ? ' is-active' : ''}" data-pickcode="${esc(item.pickCode)}" data-index="${index}" ${active ? 'aria-current="true"' : ''}
        style="display:flex;align-items:center;gap:10px;width:100%;padding:6px 8px;border:none;border-radius:8px;cursor:pointer;transition:background .15s;background:${active ? 'rgba(255,255,255,.12)' : 'transparent'};text-align:left;box-sizing:border-box;">
        <span style="flex-shrink:0;width:22px;text-align:center;font-size:11px;font-variant-numeric:tabular-nums;${active ? 'color:#38bdf8;font-weight:600' : 'color:rgba(255,255,255,.35)'}">${num}</span>
        <div class="m115-pl-thumb" style="position:relative;width:120px;height:68px;border-radius:6px;flex-shrink:0;background:#1a1a1a;overflow:hidden;display:flex;align-items:center;justify-content:center">
          <span style="color:rgba(255,255,255,.15)">${Icons.Play()}</span>
        </div>
        <div style="min-width:0;flex:1;overflow:hidden">
          <div style="font-size:13px;font-weight:500;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-overflow:ellipsis;${active ? 'color:#fff' : 'color:rgba(255,255,255,.78)'}">${escapeHtml(item.name)}</div>
          ${item.size ? `<div style="font-size:11px;color:rgba(255,255,255,.35);margin-top:2px">${escapeHtml(item.size)}</div>` : ''}
          ${renderPlaylistProgress(item, active)}
        </div>
        <div class="m115-pl-actions" style="display:flex;flex-direction:column;gap:6px;flex:0 0 auto;opacity:0;pointer-events:none;transition:opacity .15s;">
          <button type="button" class="m115-pl-action" data-action="move" title="移动视频" aria-label="移动视频" style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border:none;border-radius:7px;background:rgba(255,255,255,.08);color:rgba(255,255,255,.72);cursor:pointer;transition:background .15s,color .15s;">
            ${Icons.Move()}
          </button>
          <button type="button" class="m115-pl-action" data-action="delete" title="删除视频" aria-label="删除视频" style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border:none;border-radius:7px;background:rgba(255,255,255,.08);color:rgba(255,255,255,.72);cursor:pointer;transition:background .15s,color .15s;">
            ${Icons.Trash()}
          </button>
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
    const item = items[parseInt(node.dataset.index || '-1', 10)]
    const isActive = pc === currentPickCode
    const actionsEl = node.querySelector<HTMLElement>('.m115-pl-actions')

    node.addEventListener('mouseenter', () => {
      node.style.background = isActive ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.06)'
      if (actionsEl) {
        actionsEl.style.opacity = '1'
        actionsEl.style.pointerEvents = 'auto'
      }
    })
    node.addEventListener('mouseleave', () => {
      node.style.background = isActive ? 'rgba(255,255,255,.12)' : ''
      if (actionsEl) {
        actionsEl.style.opacity = '0'
        actionsEl.style.pointerEvents = 'none'
      }
    })
    node.addEventListener('click', (event) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('.m115-pl-action')) return
      if (pc) handlers.onPlay(pc, true)
    })

    node.querySelectorAll<HTMLButtonElement>('.m115-pl-action').forEach((button) => {
      button.addEventListener('mouseenter', () => {
        button.style.background = 'rgba(255,255,255,.16)'
        button.style.color = '#fff'
      })
      button.addEventListener('mouseleave', () => {
        button.style.background = 'rgba(255,255,255,.08)'
        button.style.color = 'rgba(255,255,255,.72)'
      })
      button.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        if (!item) return
        button.style.pointerEvents = 'none'
        button.style.opacity = '.55'
        const action = button.dataset.action
        const work = action === 'move' ? handlers.onMove(item) : handlers.onDelete(item)
        Promise.resolve(work).finally(() => {
          button.style.pointerEvents = ''
          button.style.opacity = ''
        })
      })
    })
  })
}

export function scrollActivePlaylistNodeIntoView(listEl: HTMLElement, currentPickCode: string) {
  const activeNode = listEl.querySelector(`[data-pickcode="${esc(currentPickCode)}"]`)
  activeNode?.scrollIntoView({ block: 'center', behavior: 'instant' })
}

export function lazyLoadPlaylistCovers(listEl: HTMLElement, items: OverlayPlaylistItem[]) {
  if (!PLAYLIST_COVER_FEATURE_ENABLED) {
    return () => {}
  }

  const thumbEls = listEl.querySelectorAll<HTMLElement>('.m115-pl-thumb')
  const loadedSet = new Set<string>()

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      const node = entry.target.closest<HTMLElement>('.m115-pl-item')
      const idx = parseInt(node?.dataset.index || '-1', 10)
      const item = items[idx]
      if (!item || loadedSet.has(item.pickCode)) continue
      loadedSet.add(item.pickCode)
      observer.unobserve(entry.target)

      const thumbEl = entry.target as HTMLElement
      const duration = item.duration || 0
      if (duration <= 0) return

      void runPlaylistCoverTask(() => getVideoCovers(item.pickCode, duration, 1)).then((covers) => {
        if (covers.length > 0 && thumbEl.isConnected) {
          thumbEl.innerHTML = `<img src="${covers[0].imgUrl}" alt="" style="width:100%;height:100%;object-fit:contain;object-position:center;display:block" />`
        }
      }).catch((error) => {
        console.warn(`[115m] 播放列表封面抽帧失败 ${item.pickCode}:`, error)
      })
    }
  }, { root: listEl, rootMargin: '200px 0px' })

  thumbEls.forEach(el => observer.observe(el))

  return () => observer.disconnect()
}

