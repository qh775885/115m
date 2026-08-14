/**
 * 播放器调试基础设施：统一 debug 门控、console 日志与页面浮层日志。
 */

const DEBUG_KEY = '115m-player-debug'

export function isPlayerDebugEnabled(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(DEBUG_KEY) === '1'
  } catch {
    return false
  }
}

/** 受门控的 console 日志（各模块复用，替代各自的 xxDebug helper） */
export function debugLog(...args: unknown[]) {
  if (isPlayerDebugEnabled()) {
    console.debug(...args)
  }
}

/** 在页面内显示调试日志浮层 */
export function debugLogToPage(msg: string) {
  if (!isPlayerDebugEnabled()) return
  if (typeof document === 'undefined') return
  let el = document.getElementById('m115-debug-log')
  if (!el) {
    el = document.createElement('div')
    el.id = 'm115-debug-log'
    el.style.cssText = 'position:fixed;top:10px;right:10px;z-index:999999;background:rgba(0,0,0,.85);color:#0f0;font-size:12px;font-family:monospace;padding:10px;max-height:300px;overflow:auto;white-space:pre-wrap;'
    document.body.appendChild(el)
  }
  el.textContent += `[${new Date().toLocaleTimeString()}] ${msg}\n`
}
