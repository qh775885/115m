import { findScrollBox, ScrollPositionManager } from './scroll-history'

export class HomeScrollBinder {
  private scrollManagers = new WeakMap<Document, ScrollPositionManager>()
  private observers = new WeakMap<Document, MutationObserver>()
  private docs = new Set<Document>()

  bind(doc: Document) {
    if (this.observers.has(doc)) return

    const tryBind = () => {
      const scrollBox = findScrollBox(doc)
      if (!scrollBox) return

      const manager = this.scrollManagers.get(doc)
      if (manager?.matches(scrollBox, doc)) return
      manager?.unbind()
      const nextManager = new ScrollPositionManager()
      nextManager.bind(scrollBox, doc)
      this.scrollManagers.set(doc, nextManager)
    }

    tryBind()

    const observer = new MutationObserver(tryBind)
    observer.observe(doc.documentElement, { childList: true, subtree: true })
    this.observers.set(doc, observer)
    this.docs.add(doc)
  }

  unbind(doc: Document) {
    this.observers.get(doc)?.disconnect()
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
  }
}
