export function watchWangpanFrame(
  onDocumentReady: (doc: Document) => void,
) {
  const boundFrames = new WeakSet<HTMLIFrameElement>()

  const bindFrame = () => {
    const frame = document.querySelector('iframe[name="wangpan"]') as HTMLIFrameElement | null
    if (frame && !boundFrames.has(frame)) {
      frame.addEventListener('load', bindFrame)
      boundFrames.add(frame)
    }
    const doc = frame?.contentDocument
    if (!doc) return
    onDocumentReady(doc)
  }

  bindFrame()

  const observer = new MutationObserver(bindFrame)
  observer.observe(document.documentElement, { childList: true, subtree: true })

  return () => {
    observer.disconnect()
  }
}
