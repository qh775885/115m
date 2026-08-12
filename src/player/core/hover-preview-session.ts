import type Artplayer from 'artplayer'
import { getTimelineCovers, getVideoCoverAt, getVideoCovers } from '../../lib/videoThumbnail'
import { blurTime, findNearestCover } from './hover-utils'

export interface HoverCover {
  time: number
  imgUrl: string
  width?: number
  height?: number
}

export interface HoverPreviewDisplayState {
  hoverTime: number
  preciseBucketTime: number
  nearest: HoverCover | null
  preciseCover: HoverCover | null
  coarseCover: HoverCover | null
}

interface HoverPreviewSessionOptions {
  art: Artplayer
  pickCode: string
  onCoversChanged: (covers: HoverCover[], duration: number) => void
  onDisplayRefreshRequested: () => void
  onPreciseCoverReady: (bucketTime: number, cover: HoverCover) => void
  onDebug: (label: string, payload?: Record<string, unknown>) => void
}

const PRECISE_COVER_BUCKET = 0.5
const PRECISE_COVER_DEBOUNCE = 50
const MIN_COARSE_COVER_COUNT = 24
export const THUMBNAIL_PREVIEW_ENABLED = true

function mergeCovers(covers: HoverCover[]): HoverCover[] {
  return [...covers]
    .sort((a, b) => a.time - b.time)
    .filter((cover, index, list) => {
      const previous = list[index - 1]
      if (!previous) {
        return true
      }
      return Math.abs(previous.time - cover.time) >= 0.5 || previous.imgUrl !== cover.imgUrl
    })
}

export class HoverPreviewSession {
  private readonly art: Artplayer
  private readonly pickCode: string
  private readonly onCoversChanged: (covers: HoverCover[], duration: number) => void
  private readonly onDisplayRefreshRequested: () => void
  private readonly onPreciseCoverReady: (bucketTime: number, cover: HoverCover) => void
  private readonly onDebug: (label: string, payload?: Record<string, unknown>) => void

  private covers: HoverCover[] = []
  private preciseCovers = new Map<number, HoverCover>()
  private preciseQueue: number[] = []
  private thumbnailsLoading = false
  private thumbnailsLoaded = false
  private preciseCoverTimer: number | null = null
  private preciseCoverRequestKey: string | null = null
  private preloadTimer: number | null = null
  private backgroundRefineTimer: number | null = null
  private lastHoverBucketTime: number | null = null
  private latestHoverTime: number | null = null
  private hoverRequestVersion = 0
  private pendingPreciseBucketTime: number | null = null
  private lastDebugHoverBucketTime: number | null = null
  private thumbnailDuration: number | null = null
  private destroyed = false

  constructor(options: HoverPreviewSessionOptions) {
    this.art = options.art
    this.pickCode = options.pickCode
    this.onCoversChanged = options.onCoversChanged
    this.onDisplayRefreshRequested = options.onDisplayRefreshRequested
    this.onPreciseCoverReady = options.onPreciseCoverReady
    this.onDebug = options.onDebug
  }

  destroy() {
    this.destroyed = true
    if (this.preciseCoverTimer) {
      window.clearTimeout(this.preciseCoverTimer)
      this.preciseCoverTimer = null
    }
    if (this.preloadTimer) {
      window.clearTimeout(this.preloadTimer)
      this.preloadTimer = null
    }
    if (this.backgroundRefineTimer) {
      window.clearTimeout(this.backgroundRefineTimer)
      this.backgroundRefineTimer = null
    }

    this.covers = []
    this.preciseCovers.clear()
    this.preciseQueue = []
    this.preciseCoverRequestKey = null
    this.pendingPreciseBucketTime = null
    this.latestHoverTime = null
    this.hoverRequestVersion = 0
    this.lastHoverBucketTime = null
    this.lastDebugHoverBucketTime = null
    this.thumbnailDuration = null
  }

  handleDurationChange() {
    const duration = this.art.duration || 0
    if (!duration || !this.thumbnailDuration) return
    if (Math.abs(duration - this.thumbnailDuration) < 1) return

    this.resetThumbnailState()
    this.scheduleThumbnailWarmup()
  }

  scheduleThumbnailWarmup() {
    if (this.destroyed || !THUMBNAIL_PREVIEW_ENABLED) {
      return
    }

    const tryWarmup = () => {
      if (this.thumbnailsLoaded || this.thumbnailsLoading) {
        return
      }
      void this.loadThumbnails()
    }

    if (this.art.duration >= 5) {
      this.preloadTimer = window.setTimeout(tryWarmup, 180)
      return
    }

    this.art.once('video:loadedmetadata', () => {
      this.preloadTimer = window.setTimeout(tryWarmup, 180)
    })
  }

  ensureThumbnailsForHover() {
    if (this.destroyed || !THUMBNAIL_PREVIEW_ENABLED) {
      return
    }

    if (!this.thumbnailsLoaded && !this.thumbnailsLoading) {
      void this.loadThumbnails()
    }
  }

  getDisplayState(hoverTime: number): HoverPreviewDisplayState {
    if (this.destroyed) {
      return {
        hoverTime,
        preciseBucketTime: hoverTime,
        nearest: null,
        preciseCover: null,
        coarseCover: null,
      }
    }

    const preciseBucketTime = this.getPreciseBucketTime(hoverTime)
    this.lastHoverBucketTime = preciseBucketTime
    this.latestHoverTime = hoverTime

    const preciseCover = this.preciseCovers.get(preciseBucketTime) ?? null
    const coarseCover = findNearestCover(
      this.covers,
      hoverTime,
      Math.max(2, Math.min(8, this.getCoarseSamplingInterval(this.art.duration) * 1.5)),
    )
    const nearest = preciseCover ?? coarseCover

    if (this.lastDebugHoverBucketTime !== preciseBucketTime) {
      this.onDebug('hover snapshot', {
        hoverTime: Math.round(hoverTime * 10) / 10,
        bucketTime: preciseBucketTime,
        preciseHit: !!preciseCover,
        coarseHit: !!coarseCover,
        displayedSource: preciseCover ? 'precise' : coarseCover ? 'coarse' : 'loading',
        displayedFrameTime: nearest?.time ?? null,
      })
      this.lastDebugHoverBucketTime = preciseBucketTime
    }

    return {
      hoverTime,
      preciseBucketTime,
      nearest,
      preciseCover,
      coarseCover,
    }
  }

  schedulePreciseCover(hoverTime: number, nearest: HoverCover | null) {
    if (this.destroyed || !THUMBNAIL_PREVIEW_ENABLED) {
      return
    }

    if (!this.art.duration) {
      return
    }

    const requestVersion = ++this.hoverRequestVersion
    this.latestHoverTime = hoverTime
    const bucketTime = this.getPreciseBucketTime(hoverTime)
    const cacheHit = this.preciseCovers.get(bucketTime)
    if (cacheHit) {
      if (this.lastDebugHoverBucketTime !== bucketTime) {
        this.onDebug('precise cache hit', {
          hoverTime: Math.round(hoverTime * 10) / 10,
          bucketTime,
          frameTime: cacheHit.time,
        })
        this.lastDebugHoverBucketTime = bucketTime
      }
      this.prefetchNearbyPreciseCovers(bucketTime)
      return
    }

    if (nearest && Math.abs(nearest.time - hoverTime) < this.getPreciseMinDelta(this.art.duration)) {
      return
    }

    if (this.preciseCoverTimer) {
      window.clearTimeout(this.preciseCoverTimer)
    }

    const wait = nearest ? PRECISE_COVER_DEBOUNCE : 0
    this.preciseCoverTimer = window.setTimeout(() => {
      if (requestVersion !== this.hoverRequestVersion) {
        this.onDebug('skip stale precise schedule', {
          hoverTime: Math.round(hoverTime * 10) / 10,
          bucketTime,
          requestVersion,
          latestVersion: this.hoverRequestVersion,
        })
        return
      }
      this.onDebug('schedule precise request', {
        hoverTime: Math.round(hoverTime * 10) / 10,
        bucketTime,
        hasNearest: !!nearest,
      })
      this.enqueuePreciseCover(bucketTime, true)
      this.prefetchNearbyPreciseCovers(bucketTime)
    }, wait)
  }

  private async loadThumbnails() {
    if (this.destroyed || this.thumbnailsLoaded || this.thumbnailsLoading) return
    const duration = this.art.duration
    if (!duration || duration < 5) {
      return
    }

    this.thumbnailDuration = duration
    this.thumbnailsLoading = true
    try {
      const timelineCovers = await getTimelineCovers(this.pickCode)
      if (this.destroyed) return
      if (timelineCovers.length > 0) {
        this.onDebug('timeline cache hit', {
          pickCode: this.pickCode,
          count: timelineCovers.length,
        })
        this.covers = mergeCovers([
          ...this.covers,
          ...timelineCovers.map(cover => ({ imgUrl: cover.imgUrl, time: cover.time })),
        ])
        this.onCoversChanged(this.covers, duration)
        this.thumbnailsLoaded = true
        this.onDisplayRefreshRequested()
      }

      const initialCoverCount = this.getInitialCoverCount(duration)
      const covers = await getVideoCovers(this.pickCode, duration, initialCoverCount)
      if (this.destroyed) return
      this.onDebug('coarse covers ready', {
        pickCode: this.pickCode,
        duration,
        requestedCount: initialCoverCount,
        actualCount: covers.length,
        coarseInterval: this.getCoarseSamplingInterval(duration),
      })
      if (covers.length === 0) return

      this.covers = mergeCovers([
        ...this.covers,
        ...covers.map(cover => ({ imgUrl: cover.imgUrl, time: cover.time })),
      ])
      this.onCoversChanged(this.covers, duration)
      this.thumbnailsLoaded = true
      this.onDisplayRefreshRequested()
      this.scheduleBackgroundRefinement(duration)
    }
    catch (error) {
      this.onDebug('coarse covers failed', {
        pickCode: this.pickCode,
        duration,
        error: error instanceof Error ? error.message : String(error),
      })
    }
    finally {
      this.thumbnailsLoading = false
    }
  }

  private resetThumbnailState() {
    if (this.preciseCoverTimer) {
      window.clearTimeout(this.preciseCoverTimer)
      this.preciseCoverTimer = null
    }
    if (this.preloadTimer) {
      window.clearTimeout(this.preloadTimer)
      this.preloadTimer = null
    }
    if (this.backgroundRefineTimer) {
      window.clearTimeout(this.backgroundRefineTimer)
      this.backgroundRefineTimer = null
    }

    this.covers = []
    this.preciseCovers.clear()
    this.preciseQueue = []
    this.preciseCoverRequestKey = null
    this.pendingPreciseBucketTime = null
    this.latestHoverTime = null
    this.hoverRequestVersion += 1
    this.lastHoverBucketTime = null
    this.lastDebugHoverBucketTime = null
    this.thumbnailDuration = null
    this.thumbnailsLoaded = false
    this.thumbnailsLoading = false
    this.onCoversChanged([], this.art.duration || 0)
  }

  private getCoarseSamplingInterval(duration: number): number {
    if (duration <= 5 * 60) {
      return 8
    }
    if (duration <= 10 * 60) {
      return 10
    }
    if (duration <= 20 * 60) {
      return 15
    }
    if (duration <= 40 * 60) {
      return 24
    }
    if (duration <= 90 * 60) {
      return 36
    }
    if (duration <= 180 * 60) {
      return 45
    }
    return 60
  }

  private getMaxCoarseCoverCount(duration: number): number {
    if (duration <= 20 * 60) {
      return 72
    }
    if (duration <= 90 * 60) {
      return 120
    }
    if (duration <= 180 * 60) {
      return 150
    }
    return 180
  }

  private getInitialCoverCount(duration: number): number {
    const targetInterval = this.getCoarseSamplingInterval(duration)
    const count = Math.ceil(duration / targetInterval)
    return Math.max(MIN_COARSE_COVER_COUNT, Math.min(count, this.getMaxCoarseCoverCount(duration)))
  }

  private getBackgroundRefineCoverCount(duration: number): number {
    if (duration <= 5 * 60) {
      return 48
    }
    if (duration <= 8 * 60) {
      return 60
    }
    if (duration <= 12 * 60) {
      return 72
    }
    return 0
  }

  private scheduleBackgroundRefinement(duration: number) {
    const refineCount = this.getBackgroundRefineCoverCount(duration)
    if (!refineCount || refineCount <= this.getInitialCoverCount(duration)) {
      return
    }

    if (this.backgroundRefineTimer) {
      window.clearTimeout(this.backgroundRefineTimer)
    }

    this.backgroundRefineTimer = window.setTimeout(() => {
      void this.runBackgroundRefinement(duration, refineCount)
    }, 1200)
  }

  private async runBackgroundRefinement(duration: number, refineCount: number) {
    if (this.destroyed) return
    try {
      const covers = await getVideoCovers(this.pickCode, duration, refineCount)
      if (this.destroyed) return
      if (covers.length === 0) {
        return
      }

      this.covers = mergeCovers([
        ...this.covers,
        ...covers.map(cover => ({ imgUrl: cover.imgUrl, time: cover.time })),
      ])
      this.onCoversChanged(this.covers, duration)
      this.onDebug('background coarse refinement ready', {
        pickCode: this.pickCode,
        duration,
        refineCount,
        actualCount: covers.length,
      })
      this.onDisplayRefreshRequested()
    }
    catch {
      this.onDebug('background coarse refinement failed', {
        pickCode: this.pickCode,
        duration,
        refineCount,
      })
    }
  }

  private getPreciseMinDelta(duration: number): number {
    if (duration <= 20 * 60) {
      return 1.5
    }
    if (duration <= 90 * 60) {
      return 1
    }
    return 0.75
  }

  private getPrecisePrefetchRange(duration: number): number {
    if (duration <= 20 * 60) {
      return 1
    }
    if (duration <= 90 * 60) {
      return 2
    }
    return 3
  }

  private getPrecisePrefetchStep(duration: number): number {
    if (duration <= 20 * 60) {
      return PRECISE_COVER_BUCKET
    }
    if (duration <= 90 * 60) {
      return 2
    }
    return 3
  }

  private getPreciseBucketTime(hoverTime: number): number {
    return blurTime(hoverTime, PRECISE_COVER_BUCKET, this.art.duration || hoverTime)
  }

  private enqueuePreciseCover(bucketTime: number, prioritize = false) {
    if (this.preciseCovers.has(bucketTime)) {
      return
    }

    if (prioritize) {
      this.pendingPreciseBucketTime = bucketTime
      this.preciseQueue = this.preciseQueue.filter(time => time !== bucketTime)
    }

    const requestKey = `${this.pickCode}:${bucketTime}`
    if (this.preciseCoverRequestKey === requestKey) {
      return
    }

    if (!prioritize && !this.preciseQueue.includes(bucketTime) && this.pendingPreciseBucketTime !== bucketTime) {
      if (prioritize) {
        this.preciseQueue.unshift(bucketTime)
      }
      else {
        this.preciseQueue.push(bucketTime)
      }
    }

    if (!this.preciseCoverRequestKey) {
      const nextBucketTime = this.pendingPreciseBucketTime ?? this.preciseQueue.shift()
      this.pendingPreciseBucketTime = null
      if (nextBucketTime != null) {
        void this.loadPreciseCover(nextBucketTime)
      }
    }
  }

  private prefetchNearbyPreciseCovers(bucketTime: number) {
    const duration = this.art.duration
    if (!duration) {
      return
    }

    const range = this.getPrecisePrefetchRange(duration)
    const step = this.getPrecisePrefetchStep(duration)
    for (let offset = 1; offset <= range; offset += 1) {
      const previousBucket = this.getPreciseBucketTime(Math.max(0, bucketTime - offset * step))
      const nextBucket = this.getPreciseBucketTime(Math.min(duration, bucketTime + offset * step))
      this.enqueuePreciseCover(previousBucket)
      this.enqueuePreciseCover(nextBucket)
    }
  }

  private async loadPreciseCover(bucketTime: number) {
    if (this.destroyed || !this.art.duration) {
      return
    }

    const requestKey = `${this.pickCode}:${bucketTime}`
    if (this.preciseCovers.has(bucketTime)) {
      return
    }

    if (this.preciseCoverRequestKey) {
      if (!this.preciseQueue.includes(bucketTime)) {
        this.preciseQueue.unshift(bucketTime)
      }
      return
    }

    this.preciseCoverRequestKey = requestKey
    const requestStart = Date.now()
    try {
      const cover = await this.loadFallbackPreciseCover(bucketTime)
      if (this.destroyed) return
      if (!cover) {
        this.onDebug('precise request empty', { bucketTime })
        return
      }

      const preciseCover: HoverCover = {
        imgUrl: cover.imgUrl,
        time: cover.time,
      }

      this.preciseCovers.set(bucketTime, preciseCover)
      this.onDebug('precise request done', {
        bucketTime,
        frameTime: preciseCover.time,
        hoverTime: this.latestHoverTime,
        durationMs: Date.now() - requestStart,
      })
      this.onPreciseCoverReady(bucketTime, preciseCover)
    }
    catch {
      this.onDebug('precise request failed', {
        bucketTime,
        hoverTime: this.latestHoverTime,
        durationMs: Date.now() - requestStart,
      })
    }
    finally {
      if (this.preciseCoverRequestKey === requestKey) {
        this.preciseCoverRequestKey = null
      }

      const nextBucketTime = this.pendingPreciseBucketTime ?? this.preciseQueue.shift()
      this.pendingPreciseBucketTime = null
      if (!this.destroyed && nextBucketTime != null && nextBucketTime !== bucketTime) {
        void this.loadPreciseCover(nextBucketTime)
      }
    }
  }

  private async loadFallbackPreciseCover(bucketTime: number) {
    if (this.destroyed) return null
    return await getVideoCoverAt(this.pickCode, bucketTime, this.art.duration)
  }
}
