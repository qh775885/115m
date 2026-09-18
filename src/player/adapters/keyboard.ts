/**
 * 115m 2.0 · 全局键盘适配层（Layer 1）
 * 仅负责按键识别与派发，具体行为由外部注入的回调执行。
 */

export interface KeyboardHandlers {
  togglePlay: () => void
  seekBy: (delta: number) => void
  volumeBy: (delta: number) => void
  toggleMute: () => void
  toggleFullscreen: () => void
  prev: () => void
  next: () => void
  rotate: () => void
}

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

export function bindKeyboard(handlers: KeyboardHandlers): () => void {
  const onKeyDown = (e: KeyboardEvent) => {
    if (isTypingTarget(e.target)) return

    switch (e.key) {
      case ' ':
        e.preventDefault()
        handlers.togglePlay()
        break
      case 'ArrowLeft':
        e.preventDefault()
        handlers.seekBy(-10)
        break
      case 'ArrowRight':
        e.preventDefault()
        handlers.seekBy(10)
        break
      case 'ArrowUp':
        e.preventDefault()
        handlers.volumeBy(0.05)
        break
      case 'ArrowDown':
        e.preventDefault()
        handlers.volumeBy(-0.05)
        break
      case 'm':
      case 'M':
        handlers.toggleMute()
        break
      case 'f':
      case 'F':
        handlers.toggleFullscreen()
        break
      case '[':
        handlers.prev()
        break
      case ']':
        handlers.next()
        break
      case 'r':
      case 'R':
        handlers.rotate()
        break
    }
  }

  window.addEventListener('keydown', onKeyDown)
  return () => window.removeEventListener('keydown', onKeyDown)
}
