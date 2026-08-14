import { homeStyles } from './home-styles'
import { extractFileInfo } from './core/extractors'
import { openPlayer } from './core/player-open'
import { injectActionButtons } from './core/action-buttons'
import { addDownloadIntercept } from './core/download-intercept'

import { renderPreview } from './core/preview'
import { previewObserverRegistry } from './core/observer-registry'
import { renderMediaWall } from './core/media-wall'
import { initSidebar, injectSidebarPrehide } from './core/sidebar'
import { sendRuntimeMessageSafe } from './core/runtime'
import { initUnarchiveHelper } from './core/unarchive-helper'
import { injectUnarchiveButton, setupUnarchiveActions } from './core/unarchive-actions'
import { HomePlayBinder } from './core/home-play-binder'
import { watchWangpanFrame } from './core/home-frame'
import { HomeScrollBinder } from './core/home-scroll-binder'

class HomeController {
  private boundDocs = new Set<Document>()
  private processedItemPickCodes = new WeakMap<HTMLElement, string>()
  private observers = new WeakMap<Document, MutationObserver>()
  private scanFrames = new WeakMap<Document, number>()
  private unarchiveCleanups = new WeakMap<Document, () => void>()
  private unarchiveActionCleanups = new WeakMap<Document, () => void>()
  private playBinder = new HomePlayBinder((file, playlist) => openPlayer(file!, playlist))
  private scrollBinder = new HomeScrollBinder()
  private stopWatchFrame: (() => void) | null = null

  init() {
    this.bindDocument(document)
    this.stopWatchFrame = watchWangpanFrame(
      doc => this.bindDocument(doc),
      doc => this.unbindDocument(doc),
    )
    globalThis.chrome?.runtime?.onMessage?.addListener(this.handleRuntimeMessage)
  }

  destroy() {
    [...this.boundDocs].forEach(doc => this.unbindDocument(doc))
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
    if (!this.unarchiveActionCleanups.has(doc)) {
      this.unarchiveActionCleanups.set(doc, setupUnarchiveActions(doc))
    }
    this.injectStyles(doc)
    this.scanAndRender(doc)
    this.scrollBinder.bind(doc)

    const observer = new MutationObserver(() => this.scheduleScanAndRender(doc))
    observer.observe(doc.documentElement, { childList: true, subtree: true })
    this.observers.set(doc, observer)
  }

  private unbindDocument(doc: Document) {
    if (!this.boundDocs.delete(doc)) return
    this.observers.get(doc)?.disconnect()
    this.observers.delete(doc)
    const frame = this.scanFrames.get(doc)
    if (frame) window.cancelAnimationFrame(frame)
    this.scanFrames.delete(doc)
    this.unarchiveCleanups.get(doc)?.()
    this.unarchiveCleanups.delete(doc)
    this.unarchiveActionCleanups.get(doc)?.()
    this.unarchiveActionCleanups.delete(doc)
    this.scrollBinder.unbind(doc)
    previewObserverRegistry.clearDocument(doc)
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
    try {
      const list = doc.querySelector('.list-contents')
      if (!list) return

      try {
        renderMediaWall(doc)
      }
      catch (error) {
        console.warn('[115m] media wall render failed:', error)
      }

      try {
        setupUnarchiveActions(doc)
      }
      catch (error) {
        console.warn('[115m] unarchive actions setup failed:', error)
      }

      const items = list.querySelectorAll('li[pick_code],li[pickcode],div[pick_code],div[pickcode]')
      items.forEach((node) => {
        try {
          this.scanItem(node, doc)
        }
        catch (error) {
          console.warn('[115m] scan item failed:', error)
        }
      })
    }
    catch (error) {
      console.warn('[115m] scanAndRender failed:', error)
    }
  }

  private scanItem(node: Element, _doc: Document) {
    const item = node as HTMLElement
    if (!this.isWangpanFileItem(item)) return

    const file = extractFileInfo(item)
    if (!file) return

    // 以「DOM 节点 + pickCode」去重，替代全局 pickCode 去重：
    // - 同一 li 复用展示新文件（pickCode 变化）→ 重新处理
    // - 115 排序/重绘重建 li 节点 → 新节点未记录 → 重新处理
    // - li 内部被 115 重写导致预览容器丢失 → 重新处理
    // - 内容未变 → 跳过，避免高频 MutationObserver 反复销毁重建预览
    if (this.processedItemPickCodes.get(item) === file.pickCode) {
      const previewLost = file.isVideo && !item.querySelector('.m115-cover-container')
      if (!previewLost) return
    }
    this.processedItemPickCodes.set(item, file.pickCode)

    addDownloadIntercept(item, file)
    injectUnarchiveButton(item, file)

    if (!file.isVideo) return

    this.playBinder.bindItemPlay(item)
    injectActionButtons(item, file)
    renderPreview(item, file)
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
