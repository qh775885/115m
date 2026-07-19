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

  let attempts = 0
  const timer = setInterval(() => {
    attempts++
    if (tryClickWebFullscreen() || attempts >= 40) {
      clearInterval(timer)
    }
  }, 250)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitAndFullscreen)
} else {
  waitAndFullscreen()
}
