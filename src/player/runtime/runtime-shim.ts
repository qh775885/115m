/**
 * 115m 2.0 · MAIN 世界 runtime 垫片
 * v2 运行于页面 MAIN 世界，无法直连 chrome.runtime。
 * 为让旧业务模块（MoveDialog 等直接使用 sendRuntimeMessageSafe 的代码）无需改动即可工作，
 * 在此把 chrome.runtime.sendMessage 垫成经 bridge 转发到扩展后台。
 */

import { callExtensionBridge } from './bridge-client'

let installed = false

export function installRuntimeShim(): void {
  if (installed) return
  installed = true

  const w = window as unknown as { chrome?: { runtime?: unknown } }
  try {
    if (!w.chrome) {
      w.chrome = {}
    }
  }
  catch {
    return
  }

  const chromeObj = w.chrome
  if (!chromeObj) return

  const existing = chromeObj.runtime as { sendMessage?: unknown } | undefined
  if (existing && typeof existing.sendMessage === 'function') {
    // 已存在可用 runtime（如 isolated 世界），不覆盖
    return
  }

  const runtime: Record<string, unknown> = (existing as Record<string, unknown>) || {}
  runtime.sendMessage = (message: unknown, callback?: (response: unknown) => void) => {
    const promise = callExtensionBridge(message)
    if (typeof callback === 'function') {
      promise
        .then((response) => {
          try {
            callback(response)
          }
          catch {
            // 回调异常忽略
          }
        })
        .catch(() => {
          try {
            callback(undefined)
          }
          catch {
            // 回调异常忽略
          }
        })
      return undefined
    }
    return promise
  }
  runtime.lastError = undefined

  try {
    chromeObj.runtime = runtime
  }
  catch {
    try {
      Object.defineProperty(chromeObj, 'runtime', { value: runtime, configurable: true })
    }
    catch {
      // 无法注入则保持原状
    }
  }
}
