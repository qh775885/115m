/**
 * 转码状态存储与全局/页面广播同步
 */
import type { RuntimeTranscodeResponse } from './messages'

const STORAGE_KEY = 'm115_transcode_status_store'
const EVENT_NAME = 'm115-transcode-status-updated'

export interface TranscodeStatusRecord {
  pickCode: string
  fileId?: string
  status: RuntimeTranscodeResponse
  updatedAt: number
}

type TranscodeStoreData = Record<string, TranscodeStatusRecord>

function getStorage(): Storage | null {
  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage
  }
  return null
}

export function getTranscodeStatusStore(): TranscodeStoreData {
  try {
    const storage = getStorage()
    if (!storage) return {}
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as TranscodeStoreData
  } catch {
    return {}
  }
}

export function saveTranscodeStatus(
  pickCode: string,
  status: RuntimeTranscodeResponse,
  fileId?: string,
) {
  try {
    const store = getTranscodeStatusStore()
    const record: TranscodeStatusRecord = {
      pickCode,
      fileId,
      status,
      updatedAt: Date.now(),
    }
    store[pickCode] = record
    if (fileId) {
      store[`fid:${fileId}`] = record
    }

    const storage = getStorage()
    if (storage) {
      storage.setItem(STORAGE_KEY, JSON.stringify(store))
    }

    // 触发 Window 事件通知当前页面 DOM 元素同步
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(EVENT_NAME, {
          detail: { pickCode, fileId, status },
        }),
      )
    }
  } catch (e) {
    console.error('[115m] saveTranscodeStatus error:', e)
  }
}

export function getTranscodeStatusByPickCode(pickCode: string): TranscodeStatusRecord | null {
  const store = getTranscodeStatusStore()
  return store[pickCode] || null
}

export function getTranscodeStatusByFileId(fileId: string): TranscodeStatusRecord | null {
  const store = getTranscodeStatusStore()
  return store[`fid:${fileId}`] || null
}

export function subscribeTranscodeStatus(
  callback: (event: { pickCode: string; fileId?: string; status: RuntimeTranscodeResponse }) => void,
) {
  if (typeof window === 'undefined') return () => {}

  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<{
      pickCode: string
      fileId?: string
      status: RuntimeTranscodeResponse
    }>
    if (customEvent.detail) {
      callback(customEvent.detail)
    }
  }

  window.addEventListener(EVENT_NAME, handler)
  return () => {
    window.removeEventListener(EVENT_NAME, handler)
  }
}
