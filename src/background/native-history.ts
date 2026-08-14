import { fetchWithTimeout } from '../lib/promise'
import { mapWithConcurrency } from '../shared/utils'
import type { NativePlayHistoryRecord } from '../shared/messages'

interface NativeHistoryApiData {
  pick_code?: string
  time?: number | string
  watch_end?: boolean | number | string
}

interface NativeHistoryApiResponse {
  state?: boolean
  error?: string
  data?: NativeHistoryApiData | NativeHistoryApiData[]
}

const NATIVE_HISTORY_API_URL = 'https://webapi.115.com/files/history'

function normalizeShareId(shareId?: string) {
  return shareId && shareId !== '0' ? shareId : '0'
}

function buildHistoryUrl(pickCode: string, shareId?: string) {
  const params = new URLSearchParams({
    pick_code: pickCode,
    fetch: 'one',
    category: '1',
    share_id: normalizeShareId(shareId),
  })
  return `${NATIVE_HISTORY_API_URL}?${params}`
}

export function parseNativeRecord(data: NativeHistoryApiData | undefined, fallbackPickCode: string): NativePlayHistoryRecord | null {
  if (!data) return null
  const currentTime = Number(data.time || 0)
  if (!Number.isFinite(currentTime)) return null

  return {
    pickCode: data.pick_code || fallbackPickCode,
    currentTime,
    watchEnd: data.watch_end === true || data.watch_end === 1 || data.watch_end === '1',
  }
}

export async function getNativeHistory(pickCode: string, shareId?: string): Promise<NativePlayHistoryRecord | null> {
  if (!pickCode) return null

  const response = await fetchWithTimeout(buildHistoryUrl(pickCode, shareId), {
    credentials: 'include',
  }, 15000)
  if (!response.ok) return null

  const json = await response.json() as NativeHistoryApiResponse
  if (!json.state || Array.isArray(json.data)) return null

  return parseNativeRecord(json.data, pickCode)
}

export async function getNativeHistoryMap(pickCodes: string[], shareId?: string): Promise<Record<string, NativePlayHistoryRecord>> {
  const uniquePickCodes = Array.from(new Set(pickCodes)).filter(Boolean)
  const entries = await mapWithConcurrency(uniquePickCodes, 6, async (pickCode) => {
    try {
      return [pickCode, await getNativeHistory(pickCode, shareId)] as const
    }
    catch {
      return [pickCode, null] as const
    }
  })

  return entries.reduce<Record<string, NativePlayHistoryRecord>>((map, [pickCode, record]) => {
    if (record) {
      map[pickCode] = record
    }
    return map
  }, {})
}

export async function setNativeHistory(params: {
  pickCode: string
  currentTime: number
  definition?: number
  shareId?: string
}): Promise<boolean> {
  if (!params.pickCode) return false

  const body = new URLSearchParams({
    op: 'update',
    pick_code: params.pickCode,
    time: String(Math.max(0, Math.floor(params.currentTime || 0))),
    definition: String(params.definition ?? 0),
    category: '1',
    share_id: normalizeShareId(params.shareId),
  })

  const response = await fetchWithTimeout(NATIVE_HISTORY_API_URL, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body,
  }, 15000)
  if (!response.ok) return false

  const json = await response.json() as NativeHistoryApiResponse
  return json.state === true
}
