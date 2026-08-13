export function watchWangpanFrame(
  onDocumentReady: (doc: Document) => void,
  onDocumentDetached?: (doc: Document) => void,
) {
  const boundFrames = new WeakSet<HTMLIFrameElement>()
  let currentDoc: Document | null = null

  const bindFrame = () => {
    const frame = document.querySelector('iframe[name="wangpan"]') as HTMLIFrameElement | null
    if (frame && !boundFrames.has(frame)) {
      frame.addEventListener('load', bindFrame)
      boundFrames.add(frame)
    }
    const doc = frame?.contentDocument
    if (!doc) return
    if (doc === currentDoc) return
    // wangpan 页面内部导航会替换 contentDocument，旧文档先解除绑定避免注册表累积
    if (currentDoc) {
      onDocumentDetached?.(currentDoc)
    }
    currentDoc = doc
    onDocumentReady(doc)
  }

  bindFrame()

  const observer = new MutationObserver(bindFrame)
  observer.observe(document.documentElement, { childList: true, subtree: true })

  return () => {
    observer.disconnect()
    if (currentDoc) {
      onDocumentDetached?.(currentDoc)
      currentDoc = null
    }
  }
}
