export interface StoredPlayerPlaylistItem {
  pickCode: string
  fileId: string
  name: string
  size?: string
  isMarked?: boolean
  duration?: number
}

interface StoredPlayerPlaylistEntry {
  createdAt: number
  items: StoredPlayerPlaylistItem[]
}

type StoredPlayerPlaylistMap = Record<string, StoredPlayerPlaylistEntry>

const STORAGE_KEY = 'm115-player-playlist-cache'
const ENTRY_TTL_MS = 30 * 60 * 1000
const MAX_ENTRY_COUNT = 12

function readCache(): StoredPlayerPlaylistMap {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as StoredPlayerPlaylistMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  }
  catch {
    return {}
  }
}

function writeCache(cache: StoredPlayerPlaylistMap) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(cache))
  }
  catch {
    // ignore storage write errors
  }
}

function normalizeItems(items: StoredPlayerPlaylistItem[]): StoredPlayerPlaylistItem[] {
  const seen = new Set<string>()
  const result: StoredPlayerPlaylistItem[] = []

  for (const item of items) {
    if (!item?.pickCode || seen.has(item.pickCode)) continue
    seen.add(item.pickCode)
    result.push({
      pickCode: item.pickCode,
      fileId: item.fileId || '',
      name: item.name || '视频',
      size: item.size || '',
      isMarked: item.isMarked === true,
      duration: typeof item.duration === 'number' ? item.duration : 0,
    })
  }

  return result
}

function pruneCache(cache: StoredPlayerPlaylistMap, now: number): StoredPlayerPlaylistMap {
  const entries = Object.entries(cache)
    .filter(([, entry]) => now - entry.createdAt < ENTRY_TTL_MS && Array.isArray(entry.items) && entry.items.length > 0)
    .sort((a, b) => b[1].createdAt - a[1].createdAt)
    .slice(0, MAX_ENTRY_COUNT)

  return Object.fromEntries(entries)
}

export function saveTemporaryPlayerPlaylist(items: StoredPlayerPlaylistItem[]): string | null {
  const normalizedItems = normalizeItems(items)
  if (normalizedItems.length === 0) return null

  const now = Date.now()
  const token = `${now}-${Math.random().toString(36).slice(2, 10)}`
  const cache = pruneCache(readCache(), now)
  cache[token] = {
    createdAt: now,
    items: normalizedItems,
  }
  writeCache(pruneCache(cache, now))
  return token
}

export function readTemporaryPlayerPlaylist(token: string | null | undefined): StoredPlayerPlaylistItem[] {
  if (!token) return []

  const now = Date.now()
  const rawCache = readCache()
  const pruned = pruneCache(rawCache, now)
  // 仅当确实清理了过期/空条目时才写回，避免高频读触发无意义的 localStorage 写入
  if (Object.keys(pruned).length !== Object.keys(rawCache).length) {
    writeCache(pruned)
  }
  const entry = pruned[token]
  if (!entry) return []
  return normalizeItems(entry.items)
}
