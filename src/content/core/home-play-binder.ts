import type { FileInfo } from './types'
import type { StoredPlayerPlaylistItem } from '../../shared/player-playlist-cache'
import { extractFileInfo, isPlayIntentTarget } from './extractors'

function isStoredPlaylistItem(file: FileInfo): file is FileInfo & StoredPlayerPlaylistItem {
  return typeof file.fileId === 'string' && typeof file.fileSize === 'string'
}

export class HomePlayBinder {
  private playBoundItems = new WeakSet<HTMLElement>()
  private lastOpen: { pickCode: string, ts: number } | null = null
  private openingLock = false

  bindItemPlay(item: HTMLElement) {
    if (this.playBoundItems.has(item)) return

    const file = extractFileInfo(item)
    if (!file || !file.isVideo) return

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
    this.playBoundItems.add(item)
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
