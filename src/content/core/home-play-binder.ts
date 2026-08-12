import type { FileInfo } from './types'
import type { StoredPlayerPlaylistItem } from '../../shared/player-playlist-cache'
import { extractFileInfo, isPlayIntentTarget } from './extractors'

function isStoredPlaylistItem(file: FileInfo): file is FileInfo & StoredPlayerPlaylistItem {
  return typeof file.fileId === 'string' && typeof file.fileSize === 'string'
}

interface BoundPlayItem {
  pickCode: string
  fileNameNode: HTMLElement
  handler: EventListener
}

export class HomePlayBinder {
  private playBoundItems = new WeakMap<HTMLElement, BoundPlayItem>()
  private lastOpen: { pickCode: string, ts: number } | null = null
  private openingLock = false

  private unbindItem(item: HTMLElement, existing: BoundPlayItem) {
    existing.fileNameNode.removeEventListener('click', existing.handler, true)
    item.removeEventListener('dblclick', existing.handler, true)
    this.playBoundItems.delete(item)
  }

  bindItemPlay(item: HTMLElement) {
    const file = extractFileInfo(item)
    const existing = this.playBoundItems.get(item)

    // 115 会复用同一 li 节点展示新文件：旧监听闭包持有旧 pickCode，
    // 复用时必须先解绑旧文件再绑定新文件，否则点击会打开错误的视频
    if (!file || !file.isVideo) {
      if (existing) this.unbindItem(item, existing)
      return
    }

    if (existing && existing.pickCode === file.pickCode) return
    if (existing) this.unbindItem(item, existing)

    const fileNameNode = (item.querySelector('.file-thumb') || item.querySelector('.file-name .name') || item.querySelector('.file-name')) as HTMLElement | null
    if (!fileNameNode) return

    const handleClickPlayer = (event: Event) => {
      const target = event.target as HTMLElement | null
      if (target && !isPlayIntentTarget(target)) return
      const now = Date.now()
      if (this.openingLock) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        return
      }
      if (this.lastOpen && this.lastOpen.pickCode === file.pickCode && now - this.lastOpen.ts < 1500) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        return
      }

      this.openingLock = true
      this.lastOpen = { pickCode: file.pickCode, ts: now }
      window.setTimeout(() => {
        this.openingLock = false
      }, 1500)

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      void this.openPlayer(file, this.collectVisiblePlaylistItems(item.ownerDocument))
    }

    fileNameNode.addEventListener('click', handleClickPlayer as EventListener, true)
    item.addEventListener('dblclick', handleClickPlayer as EventListener, true)
    this.playBoundItems.set(item, {
      pickCode: file.pickCode,
      fileNameNode,
      handler: handleClickPlayer as EventListener,
    })
  }

  private collectVisiblePlaylistItems(doc: Document): StoredPlayerPlaylistItem[] {
    const list = doc.querySelector('.list-contents')
    if (!list) return []

    const items: StoredPlayerPlaylistItem[] = []
    for (const item of Array.from(list.querySelectorAll<HTMLElement>('li[rel="item"],div[rel="item"],li[pick_code],li[pickcode],div[pick_code],div[pickcode]'))) {
      if (!this.isRenderablePlaylistItem(item)) continue
      const file = extractFileInfo(item)
      if (!file?.isVideo || !isStoredPlaylistItem(file)) continue
      items.push({
        pickCode: file.pickCode,
        fileId: file.fileId,
        name: file.fileName,
        size: file.fileSize,
        isMarked: file.isMarked,
        duration: file.duration,
      })
    }

    return items
  }

  private isRenderablePlaylistItem(item: HTMLElement) {
    if (!item.isConnected) return false
    if (item.closest('.m115-media-wall')) return false

    const style = item.ownerDocument.defaultView?.getComputedStyle(item)
    if (!style || style.display === 'none' || style.visibility === 'hidden') return false
    if (item.hidden || item.getAttribute('aria-hidden') === 'true') return false
    return item.getClientRects().length > 0
  }

  constructor(private readonly openPlayer: (file: FileInfo, playlist: StoredPlayerPlaylistItem[]) => Promise<unknown> | void) {}
}
