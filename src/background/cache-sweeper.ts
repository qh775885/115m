import { CACHE_SCHEMA_VERSION_KEY, CACHE_VERSION, collectStaleCacheKeys } from '../lib/cache-schema'

export async function sweepStaleCache(): Promise<void> {
  const area = (globalThis as any)?.chrome?.storage?.local as chrome.storage.StorageArea | undefined
  if (!area) return

  try {
    // MV3 SW 每次唤醒都会执行清扫：storage.local 中封面 base64 可达数 MB，
    // 先只读版本 key 比对，版本一致直接返回，避免全量反序列化拖慢启动
    const versionEntry = await area.get(CACHE_SCHEMA_VERSION_KEY) as Record<string, unknown>
    if (versionEntry[CACHE_SCHEMA_VERSION_KEY] === CACHE_VERSION) return

    const all = await area.get(null) as Record<string, unknown>
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
