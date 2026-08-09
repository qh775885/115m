/**
 * 转码状态存储与全局/页面广播同步
 * 跨标签共享：优先 chrome.storage.session（扩展级会话存储），降级 sessionStorage。
 * 广播：同页用 window 自定义事件，跨标签用 chrome.storage.onChanged。
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

function getSessionArea(): chrome.storage.StorageArea | null {
  const c = globalThis.chrome
  return c?.storage?.session ?? null
}

function getWindowStorage(): Storage | null {
  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage
  }
  return null
}

export async function getTranscodeStatusStore(): Promise<TranscodeStoreData> {
  const area = getSessionArea()
  if (area) {
    try {
      const got = await area.get(STORAGE_KEY)
      return (got?.[STORAGE_KEY] as TranscodeStoreData | undefined) ?? {}
    }
    catch {
      return {}
    }
  }
  try {
    const storage = getWindowStorage()
    if (!storage) return {}
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as TranscodeStoreData
  }
  catch {
    return {}
  }
}

export async function saveTranscodeStatus(
  pickCode: string,
  status: RuntimeTranscodeResponse,
  fileId?: string,
  skipBroadcast = false,
): Promise<void> {
  try {
    const store = await getTranscodeStatusStore()
    const record: TranscodeStatusRecord = {
      pickCode,
      fileId,
      status,
      updatedAt: Date.now(),
    }
    if (pickCode) {
      store[pickCode] = record
    }
    if (fileId) {
      store[`fid:${fileId}`] = record
    }

    const area = getSessionArea()
    if (area) {
      await area.set({ [STORAGE_KEY]: store })
    }
    else {
      const storage = getWindowStorage()
      storage?.setItem(STORAGE_KEY, JSON.stringify(store))
    }

    if (typeof window !== 'undefined' && !skipBroadcast) {
      window.dispatchEvent(
        new CustomEvent(EVENT_NAME, {
          detail: { pickCode, fileId, status },
        }),
      )
    }
  }
  catch (error) {
    console.error('[115m] saveTranscodeStatus error:', error)
  }
}

export async function getTranscodeStatusByPickCode(pickCode: string): Promise<TranscodeStatusRecord | null> {
  const store = await getTranscodeStatusStore()
  return store[pickCode] || null
}

export async function getTranscodeStatusByFileId(fileId: string): Promise<TranscodeStatusRecord | null> {
  const store = await getTranscodeStatusStore()
  return store[`fid:${fileId}`] || null
}

export function subscribeTranscodeStatus(
  callback: (event: { pickCode: string; fileId?: string; status: RuntimeTranscodeResponse }) => void,
) {
  const unsubs: Array<() => void> = []

  if (typeof window !== 'undefined') {
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
    unsubs.push(() => window.removeEventListener(EVENT_NAME, handler))
  }

  const c = globalThis.chrome
  if (c?.storage?.onChanged) {
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) => {
      if (areaName !== 'session') return
      const change = changes[STORAGE_KEY]
      if (!change?.newValue) return
      const newStore = change.newValue as TranscodeStoreData
      const oldStore = (change.oldValue as TranscodeStoreData | undefined) ?? {}
      for (const [key, record] of Object.entries(newStore)) {
        if (JSON.stringify(oldStore[key]) !== JSON.stringify(record)) {
          callback({ pickCode: record.pickCode, fileId: record.fileId, status: record.status })
        }
      }
    }
    c.storage.onChanged.addListener(listener)
    unsubs.push(() => c.storage.onChanged.removeListener(listener))
  }

  return () => {
    unsubs.forEach(fn => fn())
  }
}
