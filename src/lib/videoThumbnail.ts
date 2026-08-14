import type { FrameData } from './clipper/DecoderFlow'
import { drive115 } from './drive115'
import { M3U8ClipperNew } from './clipper/m3u8Clipper'
import { getImageResize } from './image'
import { BoundedCache, ByteBudgetCache } from './cache'
import { CACHE_VERSION } from './cache-schema'
import { fetchWithTimeout } from './promise'
import { mapWithConcurrency } from '../shared/utils'

/**
 * M3U8 源不可用，通常表示视频尚未转码、服务端未生成 HLS 流
 */
export class M3u8UnavailableError extends Error {
  constructor(message = 'M3U8 source unavailable') {
    super(message)
    this.name = 'M3u8UnavailableError'
  }
}

const MAX_WIDTH = 720
const MAX_HEIGHT = 720
const SEEK_CONCURRENCY = 3
const PRECISE_TARGET_ACCEPT_DELTA = 2.5
const PRECISE_EARLY_SUCCESS_DELTA = 0.45

const SOURCE_URL_CACHE_LIMIT = 200
/** 内存封面/时间轴缓存字节预算（dataURL 单条可达几十 MB，按条数设限不可控） */
const COVER_CACHE_BYTE_BUDGET = 64 * 1024 * 1024
const SINGLE_COVER_CACHE_BYTE_BUDGET = 32 * 1024 * 1024
const TIMELINE_CACHE_BYTE_BUDGET = 64 * 1024 * 1024
/** 单条时间轴记录允许的最大封面条数，防止按 pickCode 单调增长 */
const TIMELINE_ENTRY_LIMIT = 200

const sourceUrlCache = new BoundedCache<Promise<string>>(SOURCE_URL_CACHE_LIMIT)
const memoryCoverCache = new ByteBudgetCache<VideoThumbnail[]>(COVER_CACHE_BYTE_BUDGET, estimateCoversBytes)
/** 单点封面缓存：只存已 resolve 的成功结果（dataURL 字符串按 UTF-16 2 字节/字符估算） */
const memorySingleCoverCache = new ByteBudgetCache<VideoThumbnail>(SINGLE_COVER_CACHE_BYTE_BUDGET, estimateSingleCoverBytes)
/** 单点封面 in-flight 去重：同一时间点的并发请求共享一个 Promise，resolve 后即移除 */
const singleCoverInflight = new Map<string, Promise<VideoThumbnail | null>>()
const memoryTimelineCache = new ByteBudgetCache<VideoThumbnail[]>(TIMELINE_CACHE_BYTE_BUDGET, estimateCoversBytes)

function estimateSingleCoverBytes(cover: VideoThumbnail): number {
  return cover.imgUrl.length * 2
}

function estimateCoversBytes(covers: VideoThumbnail[]): number {
  let bytes = 0
  for (const cover of covers) {
    bytes += cover.imgUrl.length * 2
  }
  return bytes
}

/** 时间轴超过条数上限时按时间均匀截断，防止单个 pickCode 的记录无限增长 */
function capTimelineCovers(covers: VideoThumbnail[], limit: number): VideoThumbnail[] {
  if (covers.length <= limit) {
    return covers
  }
  const step = covers.length / limit
  const picked = new Map<string, VideoThumbnail>()
  for (let i = 0; i < limit; i++) {
    const cover = covers[Math.min(covers.length - 1, Math.floor(i * step))]
    if (cover) {
      picked.set(`${cover.time}:${cover.imgUrl.length}:${cover.imgUrl}`, cover)
    }
  }
  return sortAndDedupeCovers(Array.from(picked.values()))
}

export interface VideoCoverOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  cacheScope?: string
  deferCacheWrite?: boolean
  useTimelineCache?: boolean
}

interface RenderCoverOptions {
  maxWidth: number
  maxHeight: number
  quality: number
}

const defaultCoverOptions: Required<Pick<VideoCoverOptions, 'maxWidth' | 'maxHeight' | 'quality' | 'cacheScope' | 'deferCacheWrite' | 'useTimelineCache'>> = {
  maxWidth: MAX_WIDTH,
  maxHeight: MAX_HEIGHT,
  quality: 0.85,
  cacheScope: 'default',
  deferCacheWrite: false,
  useTimelineCache: true,
}

function resolveCoverOptions(options: VideoCoverOptions = {}) {
  return {
    ...defaultCoverOptions,
    ...options,
  }
}

function isContextInvalidatedError(error: unknown): boolean {
  return String(error).includes('Extension context invalidated')
}

function getStorageArea(): chrome.storage.StorageArea | null {
  const area = (globalThis as any)?.chrome?.storage?.local as chrome.storage.StorageArea | undefined
  return area ?? null
}

export function clampTime(time: number, duration?: number): number {
  const min = 0.2
  const max = duration ? Math.max(min, duration - 0.2) : Number.POSITIVE_INFINITY
  return Math.max(min, Math.min(max, time))
}

function uniqueTimes(times: number[]): number[] {
  return Array.from(new Set(times.map(time => Math.round(time * 10) / 10)))
}

function isStableImageUrl(imgUrl: string): boolean {
  return imgUrl.startsWith('data:') || /^https?:\/\//i.test(imgUrl)
}

function normalizeCachedCovers(covers: VideoThumbnail[] | undefined): VideoThumbnail[] {
  if (!Array.isArray(covers)) {
    return []
  }

  return covers.filter(cover => !!cover?.imgUrl && isStableImageUrl(cover.imgUrl))
}

function getBatchCacheKey(pickCode: string, coverNum: number, scope = defaultCoverOptions.cacheScope): string {
  return `115m_covers_${CACHE_VERSION}_${scope}_${pickCode}_${coverNum}`
}

function getSingleCacheKey(pickCode: string, time: number): string {
  return `115m_cover_${CACHE_VERSION}_${pickCode}_${Math.round(time * 10) / 10}`
}

function getTimelineCacheKey(pickCode: string): string {
  return `115m_timeline_${CACHE_VERSION}_${pickCode}`
}

async function getThumbnailSourceUrl(pickCode: string): Promise<string> {
  let cached = sourceUrlCache.get(pickCode)
  if (!cached) {
    cached = (async () => {
      let m3u8List
      try {
        m3u8List = await drive115.getM3u8(pickCode)
      } catch (error) {
        throw new M3u8UnavailableError(error instanceof Error ? error.message : String(error))
      }

      const source = m3u8List.sort((a, b) => a.quality - b.quality)[0]
      if (!source) {
        throw new M3u8UnavailableError('No m3u8 source found')
      }

      return source.url
    })()
    sourceUrlCache.set(pickCode, cached)
  }

  try {
    return await cached
  }
  catch (error) {
    sourceUrlCache.delete(pickCode)
    throw error
  }
}

export function primeThumbnailSourceUrl(pickCode: string, url: string): void {
  if (!pickCode || !url) {
    return
  }
  sourceUrlCache.set(pickCode, Promise.resolve(url))
}

async function openClipper(pickCode: string): Promise<M3U8ClipperNew> {
  const url = await getThumbnailSourceUrl(pickCode)
  const clipper = new M3U8ClipperNew({ url })
  await clipper.open()
  return clipper
}

export interface VideoThumbnail {
  imgUrl: string
  width: number
  height: number
  time: number
}

export function calculateTimes(duration: number, count = 5): number[] {
  if (count <= 1) {
    return [Math.round(clampTime(duration / 2, duration) * 10) / 10]
  }

  const interval = duration / count
  return Array.from({ length: count }, (_, i) =>
    Math.round(clampTime(interval / 2 + interval * i, duration) * 10) / 10
  )
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
}

async function coverToStorableDataUrl(cover: VideoThumbnail): Promise<VideoThumbnail> {
  if (cover.imgUrl.startsWith('data:')) {
    return cover
  }

  const response = await fetchWithTimeout(cover.imgUrl, undefined, 15000)
  const blob = await response.blob()
  const imgUrl = await blobToDataUrl(blob)
  return { ...cover, imgUrl }
}

async function renderCover(result: FrameData, options: RenderCoverOptions = defaultCoverOptions): Promise<VideoThumbnail | null> {
  const resize = getImageResize(
    result.videoFrame.displayWidth,
    result.videoFrame.displayHeight,
    options.maxWidth,
    options.maxHeight,
  )
  const canvas = new OffscreenCanvas(resize.width, resize.height)
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    result.videoFrame.close()
    return null
  }

  let bitmap: ImageBitmap | null = null
  try {
    bitmap = await createImageBitmap(result.videoFrame, {
      resizeQuality: 'pixelated',
      resizeWidth: resize.width,
      resizeHeight: resize.height,
    })
    ctx.drawImage(bitmap, 0, 0, resize.width, resize.height)

    const blob = await canvas.convertToBlob({ type: 'image/webp', quality: options.quality })
    const imgUrl = await blobToDataUrl(blob)

    return {
      imgUrl,
      width: resize.width,
      height: resize.height,
      time: result.frameTime,
    }
  }
  catch {
    return null
  }
  finally {
    bitmap?.close()
    result.videoFrame.close()
  }
}

async function generateSingleCover(
  clipper: M3U8ClipperNew,
  time: number,
  preferAccurate = false,
  options: RenderCoverOptions = defaultCoverOptions,
): Promise<VideoThumbnail | null> {
  const seekModes = preferAccurate ? [false, true] : [true, false]

  for (const firstFramePriority of seekModes) {
    try {
      const result = await clipper.seek(time, firstFramePriority)
      if (!result) {
        continue
      }

      return await renderCover(result, options)
    }
    catch {
      // thumbnail generation failed, fall through to return null
    }
  }

  return null
}

async function generateCoverWithFallbacks(
  clipper: M3U8ClipperNew,
  time: number,
  duration: number,
  fallbackWindow: number,
  preferAccurate = false,
  options: RenderCoverOptions = defaultCoverOptions,
): Promise<VideoThumbnail | null> {
  const candidateTimes = uniqueTimes([
    clampTime(time, duration),
    clampTime(time - fallbackWindow, duration),
    clampTime(time + fallbackWindow, duration),
    clampTime(time - fallbackWindow * 2, duration),
    clampTime(time + fallbackWindow * 2, duration),
  ])

  for (const candidateTime of candidateTimes) {
    const cover = await generateSingleCover(clipper, candidateTime, preferAccurate, options)
    if (cover) {
      return cover
    }
  }

  return null
}

async function generateAccurateCover(
  clipper: M3U8ClipperNew,
  time: number,
  duration: number,
  options: RenderCoverOptions = defaultCoverOptions,
): Promise<VideoThumbnail | null> {
  const candidateTimes = uniqueTimes([
    clampTime(time, duration),
    clampTime(time - 0.4, duration),
    clampTime(time + 0.4, duration),
    clampTime(time - 0.8, duration),
    clampTime(time + 0.8, duration),
    clampTime(time - 1.2, duration),
    clampTime(time + 1.2, duration),
    clampTime(time - 1.8, duration),
    clampTime(time + 1.8, duration),
    clampTime(time - 2.4, duration),
    clampTime(time + 2.4, duration),
  ])

  let bestCover: VideoThumbnail | null = null
  let bestDelta = Number.POSITIVE_INFINITY

  for (const candidateTime of candidateTimes) {
    const cover = await generateSingleCover(clipper, candidateTime, true, options)
    if (!cover) {
      continue
    }

    const delta = Math.abs(cover.time - time)
    if (delta < bestDelta) {
      bestDelta = delta
      bestCover = cover
    }

    if (delta <= PRECISE_EARLY_SUCCESS_DELTA) {
      return cover
    }
  }

  if (bestCover && bestDelta <= PRECISE_TARGET_ACCEPT_DELTA) {
    return bestCover
  }

  return null
}

export function sortAndDedupeCovers(covers: VideoThumbnail[]): VideoThumbnail[] {
  const sorted = [...covers].sort((a, b) => a.time - b.time)
  return sorted.filter((cover, index) => {
    const prev = sorted[index - 1]
    if (!prev) {
      return true
    }
    return Math.abs(prev.time - cover.time) >= 0.5 || prev.imgUrl !== cover.imgUrl
  })
}

export function selectCoverSet(covers: VideoThumbnail[], duration: number, coverNum: number): VideoThumbnail[] {
  if (covers.length <= coverNum) {
    return covers
  }

  const targetTimes = calculateTimes(duration, coverNum)
  const picked = new Map<string, VideoThumbnail>()

  for (const targetTime of targetTimes) {
    const nearest = covers.reduce<VideoThumbnail | null>((best, current) => {
      if (!best) return current
      return Math.abs(current.time - targetTime) < Math.abs(best.time - targetTime) ? current : best
    }, null)
    if (nearest) {
      picked.set(`${nearest.time}-${nearest.imgUrl.length}-${nearest.imgUrl}`, nearest)
    }
  }

  return sortAndDedupeCovers(Array.from(picked.values()))
}

async function readTimelineCovers(pickCode: string): Promise<VideoThumbnail[]> {
  const cacheKey = getTimelineCacheKey(pickCode)
  const inMemory = normalizeCachedCovers(memoryTimelineCache.get(cacheKey))
  if (inMemory.length > 0) {
    memoryTimelineCache.set(cacheKey, inMemory)
    return inMemory
  }

  const storageArea = getStorageArea()
  if (!storageArea) {
    return []
  }

  try {
    const cached = await storageArea.get(cacheKey)
    const hit = capTimelineCovers(normalizeCachedCovers(cached[cacheKey] as VideoThumbnail[] | undefined), TIMELINE_ENTRY_LIMIT)
    if (hit.length > 0) {
      memoryTimelineCache.set(cacheKey, hit)
      return hit
    }
  }
  catch (error) {
    if (!isContextInvalidatedError(error)) {
      console.warn('[115m] 读取时间轴缓存失败:', error)
    }
  }

  return []
}

export function coversSignature(covers: VideoThumbnail[]): string {
  return covers.map(cover => `${cover.time}:${cover.imgUrl.length}:${cover.imgUrl}`).join('|')
}

async function writeTimelineCovers(pickCode: string, covers: VideoThumbnail[]): Promise<void> {
  const cacheKey = getTimelineCacheKey(pickCode)
  const capped = capTimelineCovers(covers, TIMELINE_ENTRY_LIMIT)
  memoryTimelineCache.set(cacheKey, capped)

  const storageArea = getStorageArea()
  if (!storageArea) {
    return
  }

  try {
    const existing = await storageArea.get(cacheKey)
    const existingCovers = normalizeCachedCovers(existing[cacheKey] as VideoThumbnail[] | undefined)
    if (existingCovers.length > 0 && coversSignature(existingCovers) === coversSignature(capped)) {
      return
    }
  }
  catch (error) {
    if (!isContextInvalidatedError(error)) {
      console.warn('[115m] 读取时间轴缓存失败:', error)
    }
  }

  // 新生成的封面已是 dataURL，coverToStorableDataUrl 对 data: 直接短路，不会重复 fetch
  const storableResults = await Promise.all(capped.map(coverToStorableDataUrl))
  await storageArea.set({ [cacheKey]: storableResults })
}

function getMissingTimes(targetTimes: number[], existingCovers: VideoThumbnail[], tolerance = 2): number[] {
  return targetTimes.filter(targetTime =>
    !existingCovers.some(cover => Math.abs(cover.time - targetTime) <= tolerance),
  )
}

export async function getTimelineCovers(pickCode: string): Promise<VideoThumbnail[]> {
  return await readTimelineCovers(pickCode)
}

export async function getVideoCoverAt(
  pickCode: string,
  time: number,
  duration?: number,
  options?: VideoCoverOptions,
): Promise<VideoThumbnail | null> {
  const resolvedOptions = resolveCoverOptions(options)
  const normalizedTime = clampTime(time, duration)
  const cacheKey = getSingleCacheKey(pickCode, normalizedTime)

  const cached = memorySingleCoverCache.get(cacheKey)
  if (cached) {
    return cached
  }

  let pending = singleCoverInflight.get(cacheKey)
  if (!pending) {
    pending = (async () => {
      const clipper = await openClipper(pickCode)
      try {
        return await generateAccurateCover(
          clipper,
          normalizedTime,
          duration ?? normalizedTime + 30,
          resolvedOptions,
        )
      }
      finally {
        clipper.destroy()
      }
    })()
    singleCoverInflight.set(cacheKey, pending)
    pending.finally(() => singleCoverInflight.delete(cacheKey)).catch(() => {})
  }

  const cover = await pending
  // 抽帧失败（弱网/分片异常等）会 resolve 为 null，此处不缓存失败结果：
  // 否则本次会话内该时间点永远返回 null、不再重试，弱网恢复后也无法出图
  if (cover) {
    memorySingleCoverCache.set(cacheKey, cover)
  }
  return cover
}

export async function getVideoCovers(pickCode: string, duration: number, coverNum = 5, options?: VideoCoverOptions): Promise<VideoThumbnail[]> {
  const resolvedOptions = resolveCoverOptions(options)

  const cacheKey = getBatchCacheKey(pickCode, coverNum, resolvedOptions.cacheScope)
  const inMemory = normalizeCachedCovers(memoryCoverCache.get(cacheKey))
  if (inMemory.length > 0) {
    memoryCoverCache.set(cacheKey, inMemory)
    return inMemory
  }

  const timelineCovers = resolvedOptions.useTimelineCache ? await readTimelineCovers(pickCode) : []
  const timelineSelection = selectCoverSet(timelineCovers, duration, coverNum)
  if (timelineSelection.length >= coverNum) {
    memoryCoverCache.set(cacheKey, timelineSelection)
    return timelineSelection
  }

  const storageArea = getStorageArea()
  try {
    if (storageArea) {
      const cached = await storageArea.get(cacheKey)
      const hit = normalizeCachedCovers(cached[cacheKey] as VideoThumbnail[] | undefined)
      if (hit.length > 0) {
        memoryCoverCache.set(cacheKey, hit)
        return hit
      }
    }
  }
  catch (error) {
    if (isContextInvalidatedError(error)) {
      return inMemory
    }
    console.warn('[115m] 读取缓存失败:', error)
  }

  const clipper = await openClipper(pickCode)

  try {
    const times = calculateTimes(duration, coverNum)
    const missingTimes = getMissingTimes(times, timelineCovers)
    const fallbackWindow = Math.max(3, Math.min(20, duration / Math.max(coverNum * 4, 1)))

    const covers = await mapWithConcurrency(missingTimes, SEEK_CONCURRENCY, async time =>
      generateCoverWithFallbacks(clipper, time, duration, fallbackWindow, false, resolvedOptions),
    )
    const mergedTimeline = capTimelineCovers(sortAndDedupeCovers([
      ...timelineCovers,
      ...covers.filter((item): item is VideoThumbnail => item !== null),
    ]), TIMELINE_ENTRY_LIMIT)
    const results = selectCoverSet(mergedTimeline, duration, coverNum)

    if (results.length === 0) {
      return results
    }

    memoryCoverCache.set(cacheKey, results)

    try {
      const writeCache = async () => {
        if (storageArea) {
          try {
            const existing = await storageArea.get(cacheKey)
            const existingCovers = normalizeCachedCovers(existing[cacheKey] as VideoThumbnail[] | undefined)
            if (existingCovers.length > 0 && coversSignature(existingCovers) === coversSignature(results)) {
              return
            }
          }
          catch (error) {
            if (!isContextInvalidatedError(error)) {
              console.warn('[115m] 读取缓存失败:', error)
            }
          }
          const storableResults = await Promise.all(results.map(coverToStorableDataUrl))
          await storageArea.set({ [cacheKey]: storableResults })
        }
        if (resolvedOptions.useTimelineCache) {
          await writeTimelineCovers(pickCode, mergedTimeline)
        }
      }

      if (resolvedOptions.deferCacheWrite) {
        void writeCache().catch((error) => {
          if (!isContextInvalidatedError(error)) {
            console.warn('[115m] 写入缓存失败:', error)
          }
        })
      }
      else {
        await writeCache()
      }
    }
    catch (error) {
      if (isContextInvalidatedError(error)) {
        return results
      }
      console.warn('[115m] 写入缓存失败:', error)
    }

    return results
  }
  finally {
    clipper.destroy()
  }
}
