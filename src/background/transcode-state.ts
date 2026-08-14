/**
 * 转码状态与冷却缓存：避免重复请求与无界增长（懒 TTL，读取时淘汰）。
 */

/** 转码状态查询的短缓存 TTL：content 每 15s 轮询，串行 3~5 个请求，命中窗口内复用结果避免重复拉取 */
export const TRANSCODE_STATUS_CACHE_TTL_MS = 12_000
export const TRANSCODE_COOLDOWN_MS = 45_000
export const BATCH_TRANSCODE_COOLDOWN_MS = 10 * 60_000

const transcodeCooldown = new Map<string, { ts: number, response: unknown }>()
const batchTranscodeCooldown = new Map<string, number>()
const transcodeStatusCache = new Map<string, { ts: number, response?: unknown, inFlight?: Promise<unknown> }>()

export function getCachedTranscodeStatus(pickCode: string): unknown | null {
  const cached = transcodeStatusCache.get(pickCode)
  if (!cached) return null
  if (Date.now() - cached.ts > TRANSCODE_STATUS_CACHE_TTL_MS) {
    transcodeStatusCache.delete(pickCode)
    return null
  }
  return cached.response ?? cached.inFlight ?? null
}

export function setCachedTranscodeStatus(pickCode: string, value: unknown | Promise<unknown>) {
  const isPromise = value instanceof Promise
  transcodeStatusCache.set(pickCode, {
    ts: Date.now(),
    ...(isPromise ? { inFlight: value } : { response: value }),
  })
}

/** 强制清除单个 pickCode 的状态缓存（如原生回退触发后需要重新拉取） */
export function invalidateTranscodeStatus(pickCode: string) {
  transcodeStatusCache.delete(pickCode)
}

export function getTranscodeCooldown(pickCode: string) {
  const cached = transcodeCooldown.get(pickCode)
  if (!cached) return null
  if (Date.now() - cached.ts > TRANSCODE_COOLDOWN_MS) {
    transcodeCooldown.delete(pickCode)
    return null
  }
  return cached.response
}

export function setTranscodeCooldown(pickCode: string, response: unknown) {
  transcodeCooldown.set(pickCode, { ts: Date.now(), response })
}

export function getBatchCooldownKey(pickCode: string, fileIds: string[]) {
  return `${pickCode}:${fileIds.join(',')}`
}

export function isBatchTranscodeCooling(key: string) {
  const ts = batchTranscodeCooldown.get(key)
  if (!ts) return false
  if (Date.now() - ts > BATCH_TRANSCODE_COOLDOWN_MS) {
    batchTranscodeCooldown.delete(key)
    return false
  }
  return true
}

export function setBatchTranscodeCooldown(key: string) {
  batchTranscodeCooldown.set(key, Date.now())
}
