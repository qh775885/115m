import type { RuntimeMessage, RuntimeMessageResponse } from '../../shared/messages'
import { recordRuntimeFailure } from '../../shared/telemetry'

function isContextInvalidated(error: unknown): boolean {
  return error instanceof Error && /Extension context invalidated/i.test(error.message)
}

export interface RuntimeContextInvalidatedResult {
  runtimeContextInvalidated: true
}

export function isRuntimeContextInvalidatedResult(value: unknown): value is RuntimeContextInvalidatedResult {
  return !!value && typeof value === 'object' && (value as RuntimeContextInvalidatedResult).runtimeContextInvalidated === true
}

let runtimeContextInvalidated = false

function formatRuntimeMessage(message: unknown): string {
  if (message && typeof message === 'object' && 'type' in message) {
    return String((message as { type?: unknown }).type ?? 'unknown')
  }
  return String(message)
}

function showContextInvalidatedTip() {
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
