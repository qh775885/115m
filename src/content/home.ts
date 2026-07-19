import { homeStyles } from './home-styles'
import { extractFileInfo } from './core/extractors'
import { openPlayer } from './core/player-open'
import { injectActionButtons } from './core/action-buttons'
import { addDownloadIntercept } from './core/download-intercept'

import { renderPreview } from './core/preview'
import { renderMediaWall } from './core/media-wall'
import { initSidebar, injectSidebarPrehide } from './core/sidebar'
import { sendRuntimeMessageSafe } from './core/runtime'
import { initUnarchiveHelper } from './core/unarchive-helper'
import { injectUnarchiveButton, setupUnarchiveActions } from './core/unarchive-actions'
import { HomePlayBinder } from './core/home-play-binder'
import { watchWangpanFrame, primeSidebarPrehideForPage } from './core/home-frame'
import { HomeScrollBinder } from './core/home-scroll-binder'

class HomeController {
  private boundDocs = new WeakSet<Document>()
  private scannedItems = new WeakSet<HTMLElement>()
  private observers: MutationObserver[] = []
  private scanFrames = new Map<Document, number>()
  private unarchiveCleanups = new WeakMap<Document, () => void>()
  private playBinder = new HomePlayBinder((file, playlist) => openPlayer(file!, playlist))
  private scrollBinder = new HomeScrollBinder()
  private stopWatchFrame: (() => void) | null = null

  init() {
    this.bindDocument(document)
    this.stopWatchFrame = watchWangpanFrame(doc => this.bindDocument(doc))
    globalThis.chrome?.runtime?.onMessage?.addListener(this.handleRuntimeMessage)
  }

  destroy() {
    this.observers.forEach(o => o.disconnect())
    this.observers = []
    this.scanFrames.forEach(frame => window.cancelAnimationFrame(frame))
    this.scanFrames.clear()
    this.scrollBinder.destroy()
    this.stopWatchFrame?.()
    this.stopWatchFrame = null
    globalThis.chrome?.runtime?.onMessage?.removeListener(this.handleRuntimeMessage)
  }

  private handleRuntimeMessage = (message: any) => {
    if (message?.type !== 'DELETE_REFRESHED') return
    this.removeDeletedItem(message.data?.fileId, message.data?.pickCode)
  }

  private removeDeletedItem(fileId?: string, pickCode?: string) {
    if (!fileId && !pickCode) return

    const docs = [document]
    const frame = document.querySelector('iframe[name="wangpan"]') as HTMLIFrameElement | null
    if (frame?.contentDocument) docs.push(frame.contentDocument)

    for (const doc of docs) {
      const selectors: string[] = []
      if (fileId) {
        selectors.push(`[file_id="${fileId}"]`, `[fid="${fileId}"]`, `[fileid="${fileId}"]`)
      }
      if (pickCode) {
        selectors.push(`[pick_code="${pickCode}"]`, `[pickcode="${pickCode}"]`)
      }
      if (selectors.length === 0) continue
      doc.querySelectorAll(selectors.join(',')).forEach(node => node.remove())
    }
  }

  private bindDocument(doc: Document) {
    if (this.boundDocs.has(doc)) return
    this.boundDocs.add(doc)

    injectSidebarPrehide(doc)
    if (!this.unarchiveCleanups.has(doc)) {
      this.unarchiveCleanups.set(doc, initUnarchiveHelper(doc))
    }
    this.injectStyles(doc)
    this.scanAndRender(doc)
    this.scrollBinder.bind(doc)

    const observer = new MutationObserver(() => this.scheduleScanAndRender(doc))
    observer.observe(doc.documentElement, { childList: true, subtree: true })
    this.observers.push(observer)
  }

  private scheduleScanAndRender(doc: Document) {
    if (this.scanFrames.has(doc)) return
    const frame = window.requestAnimationFrame(() => {
      this.scanFrames.delete(doc)
      this.scanAndRender(doc)
    })
    this.scanFrames.set(doc, frame)
  }

  private injectStyles(doc: Document) {
    if (doc.getElementById('m115-style')) return
    const style = doc.createElement('style')
    style.id = 'm115-style'
    style.textContent = homeStyles
    doc.head?.appendChild(style)
  }

  private isWangpanFileItem(item: HTMLElement) {
    if (!item.closest('.list-contents')) return false
    if (item.matches('[status],[delete_id],[cate_id],[complete]')) return false
    if (item.querySelector('[rel="opt"] .ifo-opendir,[task_popup="goto"],[task_popup="copy"],[task_popup="del"]')) return false
    return !!item.querySelector('.file-opr,.file-name .name,.file-thumb')
  }

  private scanAndRender(doc: Document) {
    const list = doc.querySelector('.list-contents')
    if (!list) return

    renderMediaWall(doc)
    setupUnarchiveActions(doc)

    const items = doc.querySelectorAll('li[pick_code],li[pickcode],div[pick_code],div[pickcode]')
    items.forEach((node) => {
      const item = node as HTMLElement
      if (this.scannedItems.has(item)) return
      this.scannedItems.add(item)
      if (!this.isWangpanFileItem(item)) return

      const file = extractFileInfo(item)
      if (!file) return

      addDownloadIntercept(item, file)
      injectUnarchiveButton(item, file)

      if (!file.isVideo) return

      this.playBinder.bindItemPlay(item)
      injectActionButtons(item, file)
      renderPreview(item, file)
    })
  }
}

let controller: HomeController | null = null

function init() {
  if (window.top !== window) return
  if (/\/web\/lixian\/master\/video\//.test(window.location.pathname)) return
  initSidebar(document)
  controller = new HomeController()
  controller.init()
}

primeSidebarPrehideForPage()

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
}
else {
  init()
}

window.addEventListener('115m-move-success', () => {
  void sendRuntimeMessageSafe({ type: 'REQUEST_MOVE_REFRESH' })
})

window.addEventListener('beforeunload', () => {
  controller?.destroy()
  controller = null
})
