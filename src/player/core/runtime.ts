import type { RuntimeMessage, RuntimeMessageResponse } from '../../shared/messages'
import { recordRuntimeFailure } from '../../shared/telemetry'
import {
  canUseRuntimeMessaging,
  formatRuntimeMessage,
  getRuntimeApi,
  isContextInvalidated,
  showContextInvalidatedTip,
} from '../../shared/runtime-utils'
import { debugLog, debugLogToPage, isPlayerDebugEnabled } from './debug'

export { getRuntimeApi, canUseRuntimeMessaging }

/**
 * 确保 Service Worker 已就绪
 * 浏览器重启后 SW 可能处于冷启动状态，需要等待它完全加载
 * 通过发送一个简单的 ping 消息来唤醒 SW
 */
export async function ensureServiceWorkerReady(maxRetries = 5, delay = 500): Promise<void> {
  const debugMode = isPlayerDebugEnabled()
  if (debugMode) debugLogToPage(`ensureServiceWorkerReady start (canUseRuntime=${canUseRuntimeMessaging()})`)
  debugLog('[115m] ensureServiceWorkerReady: starting...')
  if (!canUseRuntimeMessaging()) {
    console.warn('[115m] ensureServiceWorkerReady skipped: runtime unavailable')
    if (debugMode) debugLogToPage('runtime messaging unavailable')
    return
  }
  for (let i = 0; i < maxRetries; i++) {
    try {
      const runtime = getRuntimeApi()
      if (!runtime?.sendMessage) return
      if (debugMode) debugLogToPage(`PING attempt ${i + 1}/${maxRetries}`)
      const result = await new Promise<any>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('PING timeout')), 3000)
        runtime.sendMessage({ type: 'PING' }, (response) => {
          clearTimeout(timer)
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
            return
          }
          resolve(response)
        })
      })
      if (debugMode) debugLogToPage(`PING success on attempt ${i + 1}`)
      debugLog('[115m] ensureServiceWorkerReady: PING response', result)
      if (result) return
    }
    catch (e) {
      if (debugMode) debugLogToPage(`PING error: ${e instanceof Error ? e.message : String(e)}`)
      if (isContextInvalidated(e)) {
        showContextInvalidatedTip()
        return
      }
      debugLog('[115m] ensureServiceWorkerReady: PING error, retrying...', i, e)
    }
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  if (debugMode) debugLogToPage(`SW retries exhausted (${maxRetries})`)
  console.error('[115m] Service Worker not ready after retries')
}

/**
 * 向 background 发送消息，带重试机制
 * Service Worker 冷启动时可能还没准备好，需要重试
 */
export async function sendRuntimeMessageSafe<T = unknown>(
  message: unknown,
  retries = 3,
  delay = 1000,
  timeoutMs = 0,
): Promise<T | null> {
  if (!canUseRuntimeMessaging()) {
    console.warn('[115m] sendRuntimeMessage skipped: runtime unavailable', formatRuntimeMessage(message))
    return null
  }
  for (let i = 0; i <= retries; i++) {
    try {
      const runtime = getRuntimeApi()
      if (!runtime?.sendMessage) return null
      const messagePromise = runtime.sendMessage(message) as Promise<T>
      const result = await (timeoutMs > 0
        ? Promise.race<T | undefined>([
            messagePromise,
            new Promise<undefined>(resolve => window.setTimeout(resolve, timeoutMs)),
          ])
        : messagePromise)
      if (result !== undefined) {
        return result
      }
      // result 为 undefined 时重试（可能由于 Service Worker 尚未就绪导致没有响应）
      debugLog('[115m] sendMessage got undefined, retrying...', i, formatRuntimeMessage(message))
    }
    catch (e) {
      if (isContextInvalidated(e)) {
        // Extension reload invalidates the old page context. Show a refresh tip without polluting error panels.
        showContextInvalidatedTip()
        return null
      }
      debugLog('[115m] sendMessage error, retrying...', i, formatRuntimeMessage(message), e)
    }
    if (i < retries) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  console.warn('[115m] sendRuntimeMessage failed after retries:', formatRuntimeMessage(message))
  recordRuntimeFailure(formatRuntimeMessage(message))
  return null
}

export async function sendTypedRuntimeMessageSafe<T extends RuntimeMessage>(
  message: T,
  retries = 3,
  delay = 1000,
  timeoutMs = 0,
): Promise<RuntimeMessageResponse<T> | null> {
  return await sendRuntimeMessageSafe<RuntimeMessageResponse<T>>(message, retries, delay, timeoutMs)
}
