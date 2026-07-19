/**
 * 115vod.com 自动网页全屏
 * 等待播放器加载后点击网页全屏按钮
 */

export {}

function tryClickWebFullscreen(): boolean {
  const btn = document.querySelector('[rel="web_fullscreen"]') as HTMLElement
  if (btn) {
    btn.click()
    return true
  }
  return false
}

function waitAndFullscreen() {
  if (tryClickWebFullscreen()) return

  const observer = new MutationObserver(() => {
    if (tryClickWebFullscreen()) {
      observer.disconnect()
      window.clearTimeout(timeout)
    }
  })
  const timeout = window.setTimeout(() => observer.disconnect(), 10_000)
  observer.observe(document.documentElement, { childList: true, subtree: true })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitAndFullscreen)
} else {
  waitAndFullscreen()
}
