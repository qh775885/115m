import type { RuntimeMessage, RuntimeMessageResponse } from '../../shared/messages'
import { recordRuntimeFailure } from '../../shared/telemetry'
import {
  formatRuntimeMessage,
  isContextInvalidated,
  showContextInvalidatedTip,
} from '../../shared/runtime-utils'

export interface RuntimeContextInvalidatedResult {
  runtimeContextInvalidated: true
}

export function isRuntimeContextInvalidatedResult(value: unknown): value is RuntimeContextInvalidatedResult {
  return !!value && typeof value === 'object' && (value as RuntimeContextInvalidatedResult).runtimeContextInvalidated === true
}

let runtimeContextInvalidated = false

/** SW 未启动/被终止时 sendMessage 的典型报错，此时无法直接投递，需先唤醒 SW */
function isServiceWorkerUnavailable(error: unknown): boolean {
  return /Receiving end does not exist|Could not establish connection/i.test(String(error))
}

/**
 * 通过 PING 主动唤醒 background Service Worker。
 * MV3 SW 空闲即被 Chrome 终止，直接 sendMessage 可能报 "Receiving end does not exist"，
 * 先发 PING 触发 SW 冷启动，待其注册监听后再投递业务消息。
 */
async function wakeServiceWorker(maxRetries = 3, delay = 500): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'PING' }) as { pong?: boolean } | undefined
      if (response?.pong) return true
    }
    catch {
      // SW 尚未就绪，继续重试
    }
    await new Promise(resolve => setTimeout(resolve, delay))
  }
  return false
}

/**
 * 向 background 发送消息，带重试机制
 * Service Worker 冷启动时可能还没准备好，需要重试
 */
export async function sendRuntimeMessageSafe<T = unknown>(
  message: unknown,
  retries = 2,
  delay = 300,
): Promise<T | RuntimeContextInvalidatedResult | null> {
  const messageLabel = formatRuntimeMessage(message)
  if (runtimeContextInvalidated) {
    showContextInvalidatedTip()
    return { runtimeContextInvalidated: true }
  }

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await chrome.runtime.sendMessage(message) as T
      return response
    }
    catch (error) {
      if (isContextInvalidated(error)) {
        runtimeContextInvalidated = true
        showContextInvalidatedTip()
        return { runtimeContextInvalidated: true }
      }

      console.warn(`[115m][runtime] sendRuntimeMessage failed type=${messageLabel} attempt=${i} error=${String(error)}`)

      // SW 不可达：先尝试唤醒，唤醒成功则立即重发业务消息，避免空等 delay
      if (isServiceWorkerUnavailable(error)) {
        const woke = await wakeServiceWorker()
        if (woke && i < retries) {
          continue
        }
      }

      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  console.warn(`[115m] sendRuntimeMessage failed after retries: ${messageLabel}`)
  recordRuntimeFailure(messageLabel)
  return null
}

export async function sendTypedRuntimeMessageSafe<T extends RuntimeMessage>(
  message: T,
  retries = 2,
  delay = 300,
): Promise<RuntimeMessageResponse<T> | RuntimeContextInvalidatedResult | null> {
  return await sendRuntimeMessageSafe<RuntimeMessageResponse<T>>(message, retries, delay)
}
