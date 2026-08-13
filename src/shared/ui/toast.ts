/**
 * 共享 Toast 基础设施：跨模块（播放器 overlay、看图器、移动对话框）统一 toast 行为。
 * 通过 doc 注入兼容不同运行环境（播放器独立页面 / content 注入 115 页面）。
 */

export interface ToastOptions {
  /** 展示时长（毫秒），默认 1800 */
  duration?: number
  /** 挂载容器，默认 doc.body */
  container?: HTMLElement
  /** 离顶部偏移（px），默认 60 */
  topOffset?: number
  /** 自定义类名（追加到基础类后），用于差异样式 */
  className?: string
  /** 相对容器绝对定位（默认 fixed 定位到视口），用于已定位容器内展示 */
  absolute?: boolean
  /** 自定义 z-index，默认 10000000 */
  zIndex?: number
  /** 变体：error 为红色错误提示（默认普通深色） */
  variant?: 'default' | 'error'
}

const TOAST_CLASS = 'm115-toast'

let activeToast: HTMLElement | null = null

/**
 * 展示一个 toast 提示。
 * 同一时刻只保留一个 toast（新 toast 替换旧 toast），避免堆叠。
 */
export function showToast(doc: Document, message: string, options: ToastOptions = {}): HTMLElement {
  const { duration = 1800, container = doc.body, topOffset = 60, className, absolute = false, zIndex = 10000000, variant = 'default' } = options

  activeToast?.remove()

  const isError = variant === 'error'
  const toast = doc.createElement('div')
  toast.className = className ? `${TOAST_CLASS} ${className}` : TOAST_CLASS
  toast.textContent = message
  const position = absolute ? 'absolute' : 'fixed'
  const background = isError ? 'rgba(231,76,60,.95)' : 'rgba(0,0,0,.85)'
  const boxShadow = isError ? '0 4px 16px rgba(231,76,60,.4)' : 'none'
  toast.style.cssText = [
    `position:${position}`,
    `top:${topOffset}px`,
    'left:50%',
    'transform:translateX(-50%) translateY(-8px)',
    `z-index:${zIndex}`,
    'padding:8px 20px',
    'border-radius:999px',
    `background:${background}`,
    'color:#fff',
    'font-size:13px',
    'font-weight:500',
    'white-space:nowrap',
    'pointer-events:none',
    'opacity:0',
    'transition:opacity .2s ease, transform .2s ease',
    'backdrop-filter:blur(8px)',
    `box-shadow:${boxShadow}`,
  ].join(';')
  container.appendChild(toast)
  activeToast = toast

  requestAnimationFrame(() => {
    toast.style.opacity = '1'
    toast.style.transform = 'translateX(-50%) translateY(0)'
  })
  window.setTimeout(() => {
    if (activeToast !== toast) return
    toast.style.opacity = '0'
    toast.style.transform = 'translateX(-50%) translateY(-8px)'
    window.setTimeout(() => {
      toast.remove()
      if (activeToast === toast) activeToast = null
    }, 200)
  }, duration)

  return toast
}

/** 移除当前 toast（用于测试或强制清理） */
export function clearToast() {
  activeToast?.remove()
  activeToast = null
}
