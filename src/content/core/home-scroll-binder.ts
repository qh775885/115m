import { findScrollBox, ScrollPositionManager } from './scroll-history'

export class HomeScrollBinder {
  private scrollManagers = new WeakMap<Document, ScrollPositionManager>()
  private observers = new WeakMap<Document, MutationObserver>()
  private debounceTimers = new WeakMap<Document, number>()
  private docs = new Set<Document>()

  bind(doc: Document) {
    if (this.observers.has(doc)) return

    const tryBind = () => {
      const scrollBox = findScrollBox(doc)
      if (!scrollBox) return

      const manager = this.scrollManagers.get(doc)
      if (manager?.matches(scrollBox, doc)) {
        manager.checkAndRestore()
        return
      }
      manager?.unbind()
      const nextManager = new ScrollPositionManager()
      nextManager.bind(scrollBox, doc)
      this.scrollManagers.set(doc, nextManager)
    }

    const scheduleTryBind = () => {
      const timer = this.debounceTimers.get(doc)
      if (timer) window.clearTimeout(timer)
      this.debounceTimers.set(doc, window.setTimeout(tryBind, 120))
    }

    tryBind()

    const observer = new MutationObserver(scheduleTryBind)
    observer.observe(doc.documentElement, { childList: true, subtree: true })
    this.observers.set(doc, observer)
    this.docs.add(doc)
  }

  unbind(doc: Document) {
    this.observers.get(doc)?.disconnect()
    const timer = this.debounceTimers.get(doc)
    if (timer) window.clearTimeout(timer)
    this.debounceTimers.delete(doc)
    this.scrollManagers.get(doc)?.unbind()
    this.docs.delete(doc)
    this.observers.delete(doc)
    this.scrollManagers.delete(doc)
  }

  destroy() {
    this.docs.forEach((doc) => {
      this.unbind(doc)
    })
    this.docs.clear()
    this.observers = new WeakMap()
    this.scrollManagers = new WeakMap()
    this.debounceTimers = new WeakMap()
  }
}
