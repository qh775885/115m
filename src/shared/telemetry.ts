const STORAGE_KEY = '115m-telemetry-failures'
const FLUSH_INTERVAL_MS = 30_000
let pendingCounts: Record<string, number> = {}
let flushTimer: ReturnType<typeof setTimeout> | null = null

function getStorageArea(): chrome.storage.StorageArea | null {
  return (globalThis as any)?.chrome?.storage?.local as chrome.storage.StorageArea | undefined ?? null
}

export function accumulateFailureCounts(existing: Record<string, number>, additions: Record<string, number>): Record<string, number> {
  const result = { ...existing }
  for (const [type, count] of Object.entries(additions)) {
    result[type] = (result[type] ?? 0) + count
  }
  return result
}

export function recordRuntimeFailure(messageType: string) {
  if (!messageType) return
  pendingCounts[messageType] = (pendingCounts[messageType] ?? 0) + 1
  scheduleFlush()
}

function scheduleFlush() {
  if (flushTimer !== null) return
  flushTimer = setTimeout(() => {
    void flush()
  }, FLUSH_INTERVAL_MS)
}

async function flush() {
  if (flushTimer !== null) {
    clearTimeout(flushTimer)
    flushTimer = null
  }
  const batch = pendingCounts
  pendingCounts = {}
  if (Object.keys(batch).length === 0) return

  const area = getStorageArea()
  if (!area) return

  try {
    const stored = await area.get(STORAGE_KEY)
    const existing = stored[STORAGE_KEY] as Record<string, number> | undefined
    await area.set({ [STORAGE_KEY]: accumulateFailureCounts(existing ?? {}, batch) })
  }
  catch {
    // telemetry failures are non-fatal
  }
}
