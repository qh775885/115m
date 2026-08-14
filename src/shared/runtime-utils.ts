/**
 * 跨上下文 runtime 消息通用辅助（单一来源）
 * content 与 player 两个 runtime 模块共用，避免「扩展上下文失效」检测与提示逻辑双份漂移。
 * 注意：sendRuntimeMessageSafe 的返回值契约在调用侧各不相同（content 返回失效特例、player 返回 null），
 * 故发送函数本体保留在各自模块，此处只共享无状态的纯逻辑与 DOM 提示。
 */

/** 检测是否为扩展上下文失效错误（扩展更新/重载后旧页面的连接会断开） */
export function isContextInvalidated(error: unknown): boolean {
  return error instanceof Error && /Extension context invalidated/i.test(error.message)
    || /Extension context invalidated/i.test(String(error))
}

/** 扩展上下文失效时，提示用户刷新页面 */
export function showContextInvalidatedTip() {
  if (typeof document === 'undefined') return
  if (document.getElementById('ext-invalidated-tip')) return
  const tip = document.createElement('div')
  tip.id = 'ext-invalidated-tip'
  tip.style.cssText = [
    'position:fixed',
    'top:20px',
    'left:50%',
    'transform:translateX(-50%)',
    'z-index:999999',
    'background:rgba(0,0,0,.85)',
    'color:#fff',
    'padding:12px 24px',
    'border-radius:8px',
    'font-size:14px',
    'cursor:pointer',
    'box-shadow:0 4px 20px rgba(0,0,0,.5)',
  ].join(';')
  tip.textContent = '扩展已更新，点击刷新页面'
  tip.addEventListener('click', () => location.reload())
  document.body.appendChild(tip)
}

/** 格式化消息为可读的 type 标签，用于日志与 telemetry */
export function formatRuntimeMessage(message: unknown): string {
  if (message && typeof message === 'object' && 'type' in message) {
    return String((message as { type?: unknown }).type ?? 'unknown')
  }
  return String(message)
}

/** 获取 chrome.runtime API（缺失时返回 null，兼容无扩展 API 的环境） */
export function getRuntimeApi(): typeof chrome.runtime | null {
  if (typeof chrome === 'undefined' || !chrome?.runtime) {
    return null
  }
  return chrome.runtime
}

/** 当前环境是否可发起 runtime 消息 */
export function canUseRuntimeMessaging(): boolean {
  const runtime = getRuntimeApi()
  return !!runtime && typeof runtime.sendMessage === 'function'
}
