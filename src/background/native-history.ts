export interface NativePlayHistoryRecord {
  pickCode: string
  currentTime: number
  watchEnd?: boolean
}

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

const NATIVE_HISTORY_API_URL = 'https://115vod.com/webapi/files/history'
const VOD_COOKIE_URL = 'https://115vod.com/'

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

function parseNativeRecord(data: NativeHistoryApiData | undefined, fallbackPickCode: string): NativePlayHistoryRecord | null {
  if (!data) return null
  const currentTime = Number(data.time || 0)
  if (!Number.isFinite(currentTime)) return null

  return {
    pickCode: data.pick_code || fallbackPickCode,
    currentTime,
    watchEnd: data.watch_end === true || data.watch_end === 1 || data.watch_end === '1',
  }
}

async function buildVodCookieHeader(): Promise<string> {
  const cookies = await chrome.cookies.getAll({ url: VOD_COOKIE_URL })
  if (cookies.length === 0) return ''
  return cookies.map(c => `${c.name}=${c.value}`).join('; ')
}

async function fetchVodApi(url: string, options: { method?: string, body?: string, contentType?: string } = {}): Promise<{ ok: boolean, text: string }> {
  const cookieHeader = await buildVodCookieHeader()
  const headers: Record<string, string> = {
    Accept: 'application/json, text/javascript, */*; q=0.01',
  }
  if (cookieHeader) {
    headers['Cookie'] = cookieHeader
  }
  if (options.body && options.contentType) {
    headers['Content-Type'] = options.contentType
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body,
  })
  const text = await response.text()
  return { ok: response.ok, text }
}

export async function getNativeHistory(pickCode: string, shareId?: string): Promise<NativePlayHistoryRecord | null> {
  if (!pickCode) return null

  const url = buildHistoryUrl(pickCode, shareId)
  const response = await fetchVodApi(url)
  if (!response.ok) return null

  const json = JSON.parse(response.text) as NativeHistoryApiResponse
  if (!json.state || Array.isArray(json.data)) return null

  return parseNativeRecord(json.data, pickCode)
}

export async function getNativeHistoryMap(pickCodes: string[], shareId?: string): Promise<Record<string, NativePlayHistoryRecord>> {
  const entries = await Promise.all(Array.from(new Set(pickCodes)).filter(Boolean).map(async (pickCode) => {
    try {
      return [pickCode, await getNativeHistory(pickCode, shareId)] as const
    }
    catch {
      return [pickCode, null] as const
    }
  }))

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

  const response = await fetchVodApi(NATIVE_HISTORY_API_URL, {
    method: 'POST',
    body: body.toString(),
    contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
  })
  if (!response.ok) return false

  const json = JSON.parse(response.text) as NativeHistoryApiResponse
  return json.state === true
}
