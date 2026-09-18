/**
 * 视频实时性能与规格统计 (Stats Monitor)
 * 纯净单向读取，通过 requestVideoFrameCallback 侦测真实帧率与丢帧
 */

export interface VideoStats {
  resolution: string
  tag: string
  rawWidth: number
  rawHeight: number
  fpsText: string
  fps: number
  droppedFrames: number
  totalFrames: number
  dropRateText: string
}

export function formatResolution(width: number, height: number): { label: string, tag: string } {
  if (!width || !height) return { label: '未知', tag: '' }
  const maxDim = Math.max(width, height)
  const minDim = Math.min(width, height)
  let tag = ''
  if (maxDim >= 3800 || minDim >= 2100) tag = '4K'
  else if (maxDim >= 2500 || minDim >= 1400) tag = '2K'
  else if (maxDim >= 1900 || minDim >= 1000) tag = '1080P'
  else if (maxDim >= 1200 || minDim >= 700) tag = '720P'
  else if (minDim >= 480) tag = '480P'
  else tag = '标清'
  return { label: `${width} × ${height}`, tag }
}

const COMMON_FPS = [23.976, 24, 25, 29.97, 30, 50, 59.94, 60, 120]

export function formatFps(fps: number): string {
  if (!fps || fps <= 0) return '--'
  let closestStd: number | null = null
  let minDiff = 0.15
  for (const std of COMMON_FPS) {
    const diff = Math.abs(fps - std)
    if (diff < minDiff) {
      minDiff = diff
      closestStd = std
    }
  }
  if (closestStd !== null) {
    return `${closestStd} fps`
  }
  return `${fps.toFixed(1)} fps`
}

export class VideoStatsTracker {
  private video: HTMLVideoElement | null = null
  private callbackId: number | null = null
  private frameTimestamps: number[] = []
  private measuredFps = 0
  private lastFpsText = '--'
  private isTracking = false

  attach(video: HTMLVideoElement | null): void {
    if (this.video === video) return
    this.stop()
    this.video = video
    this.frameTimestamps = []
    this.measuredFps = 0
    this.lastFpsText = '--'
  }

  start(): void {
    if (this.isTracking) return
    this.isTracking = true
    this.scheduleNext()
  }

  stop(): void {
    this.isTracking = false
    if (this.video && this.callbackId !== null && 'cancelVideoFrameCallback' in this.video) {
      (this.video as any).cancelVideoFrameCallback(this.callbackId)
    }
    this.callbackId = null
    this.frameTimestamps = []
  }

  private scheduleNext(): void {
    if (!this.isTracking || !this.video) return
    if ('requestVideoFrameCallback' in this.video) {
      this.callbackId = (this.video as any).requestVideoFrameCallback((_now: number, metadata: any) => {
        this.onFrame(metadata?.presentationTime || performance.now())
        this.scheduleNext()
      })
    }
  }

  private onFrame(now: number): void {
    this.frameTimestamps.push(now)
    // 维持最近 1 秒（1000ms）内的帧时间戳
    while (this.frameTimestamps.length > 0 && now - this.frameTimestamps[0] > 1000) {
      this.frameTimestamps.shift()
    }

    if (this.frameTimestamps.length >= 5) {
      const duration = (now - this.frameTimestamps[0]) / 1000
      if (duration > 0.3) {
        const count = this.frameTimestamps.length - 1
        this.measuredFps = count / duration
        this.lastFpsText = formatFps(this.measuredFps)
      }
    }
  }

  getStats(): VideoStats {
    const video = this.video
    if (!video) {
      return {
        resolution: '未知',
        tag: '',
        rawWidth: 0,
        rawHeight: 0,
        fpsText: '--',
        fps: 0,
        droppedFrames: 0,
        totalFrames: 0,
        dropRateText: '0.0%',
      }
    }

    const w = video.videoWidth || 0
    const h = video.videoHeight || 0
    const { label, tag } = formatResolution(w, h)

    let dropped = 0
    let total = 0
    let dropRateText = '0.0%'

    if (typeof (video as any).getVideoPlaybackQuality === 'function') {
      const q = (video as any).getVideoPlaybackQuality()
      dropped = q.droppedVideoFrames || 0
      total = q.totalVideoFrames || 0
      if (total > 0) {
        dropRateText = `${((dropped / total) * 100).toFixed(1)}%`
      }
    }

    return {
      resolution: label,
      tag,
      rawWidth: w,
      rawHeight: h,
      fpsText: this.lastFpsText,
      fps: this.measuredFps,
      droppedFrames: dropped,
      totalFrames: total,
      dropRateText,
    }
  }

  destroy(): void {
    this.stop()
    this.video = null
  }
}
