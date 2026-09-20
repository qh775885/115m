const FRAME_SELECTORS = 'iframe[name="wangpan"], .wrap-view iframe, div[class*="wrap-view"] iframe'

function findContentFrames(): HTMLIFrameElement[] {
  if (typeof document.querySelectorAll === 'function') {
    const frames = Array.from(document.querySelectorAll<HTMLIFrameElement>(FRAME_SELECTORS))
    if (frames.length > 0) return frames
  }
  const fallback = typeof document.querySelector === 'function'
    ? (document.querySelector('iframe[name="wangpan"]') as HTMLIFrameElement | null)
    : null
  return fallback ? [fallback] : []
}

export function watchWangpanFrame(
  onDocumentReady: (doc: Document) => void,
  onDocumentDetached?: (doc: Document) => void,
) {
  const boundFrames = new WeakSet<HTMLIFrameElement>()
  const trackedDocs = new Map<HTMLIFrameElement, Document>()

  const bindFrames = () => {
    const currentFrames = findContentFrames()

    // 1. 处理已从 DOM 移除的 frame
    for (const [frame, doc] of trackedDocs.entries()) {
      const isDetached = !currentFrames.includes(frame) && (typeof document.contains === 'function' ? !document.contains(frame) : true)
      if (isDetached) {
        onDocumentDetached?.(doc)
        trackedDocs.delete(frame)
      }
    }

    // 2. 检查并绑定现有的 frame
    for (const frame of currentFrames) {
      if (!boundFrames.has(frame)) {
        frame.addEventListener?.('load', bindFrames)
        boundFrames.add(frame)
      }

      let doc: Document | null = null
      try {
        doc = frame.contentDocument
      }
      catch {
        // 跨域或沙箱环境静默跳过
      }
      if (!doc) continue

      // 若为刚初始化的空白帧且无内容，等待真实内容载入
      if (doc.location?.href === 'about:blank' && (!doc.body || !doc.body.hasChildNodes())) {
        continue
      }

      const prevDoc = trackedDocs.get(frame)
      if (doc === prevDoc) continue

      if (prevDoc) {
        onDocumentDetached?.(prevDoc)
      }
      trackedDocs.set(frame, doc)
      onDocumentReady(doc)
    }
  }

  bindFrames()

  const observer = new MutationObserver(bindFrames)
  if (document.documentElement) {
    observer.observe(document.documentElement, { childList: true, subtree: true })
  }

  return () => {
    observer.disconnect()
    for (const doc of trackedDocs.values()) {
      onDocumentDetached?.(doc)
    }
    trackedDocs.clear()
  }
}
