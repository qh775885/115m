/**
 * 预览资源注册表：
 * - 滚动停止统一分发（多元素共享单个 scroll 监听）
 * - 元素/文档级销毁回收（doc 级共享 MutationObserver，避免每元素一个 observer）
 */

export class PreviewObserverRegistry {
  private readonly scrollCallbacks = new Map<HTMLElement | Window, Set<() => void>>()
  private readonly scrollListeners = new Map<HTMLElement | Window, () => void>()
  private readonly registeredItemsByDoc = new Map<Document, Map<HTMLElement, () => void>>()
  private readonly removalObservers = new Map<Document, MutationObserver>()

  registerScrollStop(target: HTMLElement | Window, callback: () => void) {
    let callbacks = this.scrollCallbacks.get(target)
    if (!callbacks) {
      callbacks = new Set()
      this.scrollCallbacks.set(target, callbacks)

      let timer: number | undefined
      const listener = () => {
        if (typeof timer === 'number') window.clearTimeout(timer)
        timer = window.setTimeout(() => {
          timer = undefined
          callbacks?.forEach(onScrollStop => onScrollStop())
        }, 120)
      }
      const eventTarget = target === window ? window : target
      const onScroll = typeof eventTarget.addEventListener === 'function'
        ? () => eventTarget.addEventListener('scroll', listener, { passive: true })
        : () => {}
      onScroll()
      this.scrollListeners.set(target, () => {
        if (typeof timer === 'number') window.clearTimeout(timer)
        if (typeof eventTarget.removeEventListener === 'function') {
          eventTarget.removeEventListener('scroll', listener)
        }
      })
    }
    callbacks.add(callback)

    return () => {
      const currentCallbacks = this.scrollCallbacks.get(target)
      if (!currentCallbacks) return
      currentCallbacks.delete(callback)
      if (currentCallbacks.size > 0) return
      this.scrollListeners.get(target)?.()

      this.scrollListeners.delete(target)
      this.scrollCallbacks.delete(target)
    }
  }

  registerItem(item: HTMLElement, dispose: () => void) {
    const doc = item.ownerDocument
    let items = this.registeredItemsByDoc.get(doc)
    if (!items) {
      items = new Map()
      this.registeredItemsByDoc.set(doc, items)

      const observer = new MutationObserver(() => {
        const map = this.registeredItemsByDoc.get(doc)
        if (!map) return
        map.forEach((onDispose, registeredItem) => {
          if (!registeredItem.isConnected) {
            map.delete(registeredItem)
            onDispose()
          }
        })
        if (map.size === 0) {
          observer.disconnect()
          this.removalObservers.delete(doc)
          this.registeredItemsByDoc.delete(doc)
        }
      })
      observer.observe(doc.documentElement, { childList: true, subtree: true })
      this.removalObservers.set(doc, observer)
    }
    items.set(item, dispose)

    return () => {
      items?.delete(item)
      if (items && items.size === 0) {
        this.removalObservers.get(doc)?.disconnect()
        this.removalObservers.delete(doc)
        this.registeredItemsByDoc.delete(doc)
      }
    }
  }

  /** 文档被整体替换/销毁时，强制清理该文档下的全部预览资源与观察器 */
  clearDocument(doc: Document) {
    const items = this.registeredItemsByDoc.get(doc)
    if (items) {
      items.forEach(onDispose => onDispose())
      items.clear()
      this.registeredItemsByDoc.delete(doc)
    }
    this.removalObservers.get(doc)?.disconnect()
    this.removalObservers.delete(doc)
  }
}

export const previewObserverRegistry = new PreviewObserverRegistry()
