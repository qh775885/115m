export const CACHE_VERSION = 'v4'
export const CACHE_SCHEMA_VERSION_KEY = '115m-cache-schema-version'
export const CACHE_KEY_PREFIXES = ['115m_covers_', '115m_cover_', '115m_timeline_']
const CACHE_KEY_VERSION_RE = /^115m_(?:covers|cover|timeline)_([^_]+)_/

export function extractCacheVersion(key: string): string | null {
  const match = key.match(CACHE_KEY_VERSION_RE)
  return match ? match[1] : null
}

export function collectStaleCacheKeys(keys: string[], currentVersion = CACHE_VERSION): string[] {
  return keys.filter(key =>
    CACHE_KEY_PREFIXES.some(prefix => key.startsWith(prefix))
    && extractCacheVersion(key) !== currentVersion,
  )
}
