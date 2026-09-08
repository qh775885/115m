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

// ---------------------------------------------------------------------------
// 1. Port 保活（Keep-Alive）机制：防止 MV3 Service Worker 意外休眠或死锁
// ---------------------------------------------------------------------------
let keepAlivePort: chrome.runtime.Port | null = null
let keepAlivePingTimer: number | null = null
let reconnectTimer: number | null = null

/**
 * 启动 Port 保活连接。在用户浏览页面期间保持长连接，使 MV3 SW 持续活跃；
 * 5 分钟被 Chrome 自动断开后自动重连。
 */
export function startKeepAlive(): void {
  if (typeof chrome === 'undefined' || !chrome.runtime?.connect || runtimeContextInvalidated) {
    return
  }
  // 仅在顶层窗口或独立页面维持保活，避免嵌套大量 iframe 时重复连接
  if (typeof window !== 'undefined' && window.top && window.top !== window) {
    return
  }
  if (keepAlivePort) {
    return
  }

  try {
    const port = chrome.runtime.connect({ name: 'keep-alive' })
    keepAlivePort = port

    if (keepAlivePingTimer !== null) {
      window.clearInterval(keepAlivePingTimer)
    }
    // 20 秒一次轻量 ping，保证小于 30 秒超时阈值
    keepAlivePingTimer = window.setInterval(() => {
      if (keepAlivePort && !runtimeContextInvalidated) {
        try {
          keepAlivePort.postMessage('ping')
        }
        catch {
          disconnectKeepAlive()
          scheduleReconnect()
        }
      }
    }, 20_000)

    port.onDisconnect?.addListener?.(() => {
      const lastError = chrome.runtime.lastError
      disconnectKeepAlive()

      if (lastError && isContextInvalidated(lastError)) {
        runtimeContextInvalidated = true
        showContextInvalidatedTip()
        return
      }

      if (!runtimeContextInvalidated && typeof document !== 'undefined' && document.visibilityState !== 'hidden') {
        scheduleReconnect()
      }
    })
  }
  catch (e) {
    if (isContextInvalidated(e)) {
      runtimeContextInvalidated = true
      showContextInvalidatedTip()
    }
  }
}

export function disconnectKeepAlive(): void {
  if (keepAlivePingTimer !== null) {
    if (typeof window !== 'undefined') window.clearInterval(keepAlivePingTimer)
    keepAlivePingTimer = null
  }
  if (keepAlivePort) {
    try {
      keepAlivePort.disconnect()
    }
    catch {
      // ignore
    }
    keepAlivePort = null
  }
}

function scheduleReconnect(delay = 1000): void {
  if (reconnectTimer !== null || runtimeContextInvalidated) return
  if (typeof window === 'undefined') return
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null
    if (!runtimeContextInvalidated) {
      startKeepAlive()
    }
  }, delay)
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !runtimeContextInvalidated && !keepAlivePort) {
      startKeepAlive()
    }
  })
}

// 模块初始化时启动保活
startKeepAlive()

// ---------------------------------------------------------------------------
// 2. 统一并发唤醒互斥锁与熔断机制（防风暴）
// ---------------------------------------------------------------------------
let activeWakePromise: Promise<boolean> | null = null
let lastWakeFailureTimestamp = 0
const CIRCUIT_BREAKER_COOLDOWN_MS = 6_000 // 唤醒失败后熔断 6 秒，避免海量并发请求轰炸 IPC

async function performWakeServiceWorker(maxRetries = 2, delay = 300): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'PING' }) as { pong?: boolean } | undefined
      if (response?.pong) {
        startKeepAlive()
        return true
      }
    }
    catch (e) {
      if (isContextInvalidated(e)) {
        runtimeContextInvalidated = true
        showContextInvalidatedTip()
        return false
      }
    }
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  return false
}

/**
 * 唤醒 Service Worker：多个并发请求共享同一个唤醒 Promise，彻底消除并发风暴
 */
async function wakeServiceWorkerDeduplicated(): Promise<boolean> {
  const now = Date.now()
  if (now - lastWakeFailureTimestamp < CIRCUIT_BREAKER_COOLDOWN_MS) {
    return false
  }

  if (!activeWakePromise) {
    activeWakePromise = performWakeServiceWorker().then((success) => {
      if (!success) {
        lastWakeFailureTimestamp = Date.now()
      }
      return success
    }).finally(() => {
      activeWakePromise = null
    })
  }

  return activeWakePromise
}

/**
 * 向 background 发送消息，带并发去重唤醒与熔断机制
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

  // 熔断冷却期内：直接降级返回 null，避免对已挂死的 SW 重复轰炸
  if (Date.now() - lastWakeFailureTimestamp < CIRCUIT_BREAKER_COOLDOWN_MS) {
    return null
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

      // SW 不可达：通过共享 Promise 统一唤醒，避免并发节点产生消息风暴
      if (isServiceWorkerUnavailable(error)) {
        const woke = await wakeServiceWorkerDeduplicated()
        if (woke && i < retries) {
          continue
        }
        if (!woke) {
          // 唤醒彻底失败，触发熔断，无需继续重试
          break
        }
      }

      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // 仅在全部重试用尽且确实失败时记录警告，不在重试尝试过程中打印中间日志
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
