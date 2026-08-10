import { CACHE_SCHEMA_VERSION_KEY, CACHE_VERSION, collectStaleCacheKeys } from '../lib/cache-schema'

export async function sweepStaleCache(): Promise<void> {
  const area = (globalThis as any)?.chrome?.storage?.local as chrome.storage.StorageArea | undefined
  if (!area) return

  try {
    const all = await area.get(null) as Record<string, unknown>
    if (all[CACHE_SCHEMA_VERSION_KEY] === CACHE_VERSION) return

    const stale = collectStaleCacheKeys(Object.keys(all))
    if (stale.length > 0) {
      await area.remove(stale)
    }
    await area.set({ [CACHE_SCHEMA_VERSION_KEY]: CACHE_VERSION })
  }
  catch {
    // cache sweep failures are non-fatal
  }
}
