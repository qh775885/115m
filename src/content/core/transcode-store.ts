/**
 * 转码状态存储与全局/页面广播同步
 * 跨标签共享：优先 chrome.storage.session（扩展级会话存储），降级 sessionStorage。
 * 广播：同页用 window 自定义事件，跨标签用 chrome.storage.onChanged。
 */
import type { RuntimeTranscodeResponse } from '../../shared/messages'

const STORAGE_KEY = 'm115_transcode_status_store'
const EVENT_NAME = 'm115-transcode-status-updated'
const SELF_WRITE_WINDOW_MS = 5000
/** store 最大记录条数（pickCode + fid: 双索引各算一条）。超出后淘汰最久未更新的记录，防止长会话单调增长 */
export const MAX_STORE_RECORDS = 300

// 本上下文最近一次写入的 store 快照与其写入时刻。
// 用于在 chrome.storage.onChanged 中识别「由本上下文自身写入」触发的变更，避免自我触发循环。
let lastLocalWriteStore: TranscodeStoreData | null = null
let lastLocalWriteAt = 0

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

function trimStoreToLimit(store: TranscodeStoreData): TranscodeStoreData {
  const entries = Object.entries(store)
  if (entries.length <= MAX_STORE_RECORDS) {
    return store
  }
  // 按 updatedAt 升序排列，淘汰最旧的记录；同文件的双索引（pickCode/fid）视为同一文件，一起淘汰
  const sorted = entries
    .map(([key, record]) => ({ key, record }))
    .sort((a, b) => a.record.updatedAt - b.record.updatedAt)
  const toRemove = new Set<string>()
  let overflow = entries.length - MAX_STORE_RECORDS
  for (const { key, record } of sorted) {
    if (overflow <= 0) break
    toRemove.add(key)
    overflow -= 1
    // 同文件另一条索引一并淘汰
    const companion = record.fileId
      ? (key === record.pickCode ? `fid:${record.fileId}` : record.pickCode)
      : null
    if (companion && store[companion] && store[companion].updatedAt === record.updatedAt) {
      toRemove.add(companion)
    }
  }
  const next: TranscodeStoreData = {}
  for (const [key, record] of entries) {
    if (!toRemove.has(key)) {
      next[key] = record
    }
  }
  return next
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
    const trimmed = trimStoreToLimit(store)

    const area = getSessionArea()
    if (area) {
      lastLocalWriteStore = trimmed
      lastLocalWriteAt = Date.now()
      await area.set({ [STORAGE_KEY]: trimmed })
    }
    else {
      const storage = getWindowStorage()
      storage?.setItem(STORAGE_KEY, JSON.stringify(trimmed))
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

      // 忽略由本上下文自身写入触发的变更，杜绝「set → onChanged → 回调 → set」自我触发循环。
      if (
        lastLocalWriteStore
        && Date.now() - lastLocalWriteAt <= SELF_WRITE_WINDOW_MS
        && JSON.stringify(newStore) === JSON.stringify(lastLocalWriteStore)
      ) {
        lastLocalWriteStore = null
        return
      }
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
