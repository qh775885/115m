/**
 * 原生播放监控器：卡顿检测、黑屏检测、静音检测、自动重试、HLS 降级触发
 */
import type Artplayer from 'artplayer'
import type { VideoPlaybackQualityLike } from './types'
import { shouldFallbackNativeBlackVideo, shouldFallbackNativeDroppedFrames, shouldFallbackNativeSilentAudio, shouldRetryNativePlayback } from './native-playback'

const AUDIO_PROBE_DELAY_MS = 4500
const STALL_CHECK_INTERVAL_MS = 1000
const STALL_TIME_THRESHOLD_MS = 3000
const STALL_MAX_TIME_DRIFT_SEC = 0.12
const SEEK_LONG_JUMP_SEC = 45
const SEEK_RECOVERY_WINDOW_MS = 6000

export interface NativePlaybackDeps {
  art: Artplayer
  getIsNativeVideo: () => boolean
  getCurrentPlaybackType: () => 'native' | 'hls'
  getUltraUrl: () => string | null
  getTitle: () => string
  getNativeUltraConservative: () => boolean
  getPerfMarksPlaying: () => number | undefined
  onFallbackToHls: (reason: string, rememberOriginal: boolean) => Promise<void>
  onRetry: () => void
  onShowToast: (msg: string) => void
  fetchMasterPlaylistText: () => Promise<string | null>
}

export class NativePlaybackMonitor {
  private art: Artplayer | null = null
  private retryCount = 0
  private audioProbeTimer: number | null = null
  private videoProbeTimer: number | null = null
  private stallCheckTimer: number | null = null
  private stallStartedAt = 0
  private stallLastTime = 0
  private stallLastFrameCount = 0
  private stallFallbackInFlight = false
  private seekStartedAt = 0
  private seekFromTime = 0
  private seekRecoveryUntil = 0

  private deps: NativePlaybackDeps | null = null

  /** 绑定 artplayer 实例和依赖 */
  attach(deps: NativePlaybackDeps) {
    this.art = deps.art
    this.deps = deps
  }

  /** 视频切换时重置重试计数 */
  resetRetryCount() {
    this.retryCount = 0
  }

  /** 是否原生播放模式 */
  private get isNative(): boolean {
    return this.deps?.getIsNativeVideo() ?? false
  }

  private get isNativePlayback(): boolean {
    return this.isNative && this.deps?.getCurrentPlaybackType() === 'native'
  }

  // ─── 事件入口（由 PlayerManager 的 artplayer 事件调用） ───

  /** video:seeking 事件 */
  onSeeking() {
    if (!this.art || !this.isNativePlayback) return
    this.seekStartedAt = Date.now()
    this.seekFromTime = this.stallLastTime || this.art.currentTime || 0
    this.stallStartedAt = 0
  }

  /** video:seeked 事件 */
  onSeeked() {
    if (!this.art || !this.isNativePlayback) return
    const targetTime = this.art.currentTime || 0
    const jumpDistance = Math.abs(targetTime - this.seekFromTime)
    this.seekRecoveryUntil = jumpDistance >= SEEK_LONG_JUMP_SEC
      ? Date.now() + SEEK_RECOVERY_WINDOW_MS
      : 0
    this.stallStartedAt = 0
    this.stallLastTime = targetTime
    this.stallLastFrameCount = this.getTotalVideoFrames(this.art.video as HTMLVideoElement)
    this.scheduleStallCheck()
  }

  /** video:playing 事件 */
  onPlaying() {
    this.clearAudioProbe()
    this.resetStallState()
    this.scheduleStallCheck()
    if (this.isNative) {
      this.scheduleAudioProbe()
      this.scheduleVideoProbe()
    }
  }

  /** video:pause 事件：暂停时停止音视频探测与卡顿检测，避免无限自我重排 */
  onPause() {
    this.clearAudioProbe()
    this.clearVideoProbe()
    this.clearStallCheck()
    this.stallStartedAt = 0
  }

  /** video:error 事件 */
  async onError() {
    if (!this.art || !this.deps) return

    const hasStartedPlaying = !!this.deps.getPerfMarksPlaying()
    if (shouldRetryNativePlayback({ retryCount: this.retryCount, hasStartedPlaying })) {
      this.retryCount += 1
      this.retryPlayback()
      return
    }

    await this.deps.onFallbackToHls('无损播放异常，已改用 115原画', true)
  }

  // ─── 清理方法 ───

  clearAudioProbe() {
    if (this.audioProbeTimer != null) {
      window.clearTimeout(this.audioProbeTimer)
      this.audioProbeTimer = null
    }
  }

  clearVideoProbe() {
    if (this.videoProbeTimer != null) {
      window.clearTimeout(this.videoProbeTimer)
      this.videoProbeTimer = null
    }
  }

  clearStallCheck() {
    if (this.stallCheckTimer != null) {
      window.clearTimeout(this.stallCheckTimer)
      this.stallCheckTimer = null
    }
  }

  resetStallState() {
    this.clearStallCheck()
    this.stallStartedAt = 0
    this.stallLastTime = 0
    this.stallLastFrameCount = 0
    this.stallFallbackInFlight = false
    this.seekStartedAt = 0
    this.seekFromTime = 0
    this.seekRecoveryUntil = 0
  }

  clearAll() {
    this.clearAudioProbe()
    this.clearVideoProbe()
    this.resetStallState()
  }

  destroy() {
    this.clearAll()
    this.art = null
    this.deps = null
  }

  // ─── 内部方法 ───

  private scheduleStallCheck() {
    this.clearStallCheck()
    if (!this.art || !this.isNativePlayback) return
    this.stallCheckTimer = window.setTimeout(() => {
      this.stallCheckTimer = null
      void this.checkPlaybackStall()
    }, STALL_CHECK_INTERVAL_MS)
  }

  private getBufferedAhead(video: HTMLVideoElement): number {
    const currentTime = video.currentTime || 0
    for (let i = 0; i < video.buffered.length; i += 1) {
      const start = video.buffered.start(i)
      const end = video.buffered.end(i)
      if (currentTime >= start && currentTime <= end) {
        return Math.max(0, end - currentTime)
      }
    }
    return 0
  }

  private getTotalVideoFrames(video: HTMLVideoElement): number {
    const quality = (video.getVideoPlaybackQuality?.() || {}) as VideoPlaybackQualityLike
    const total = quality.totalVideoFrames
    if (typeof total === 'number' && total > 0) return total
    return (video as HTMLVideoElement & { webkitDecodedFrameCount?: number }).webkitDecodedFrameCount ?? 0
  }

  private async checkPlaybackStall() {
    if (!this.art || !this.isNativePlayback || !this.deps) return
    if (this.stallFallbackInFlight) return

    const video = this.art.video as HTMLVideoElement
    if (video.paused || video.ended || video.seeking) {
      this.stallStartedAt = 0
      this.stallLastTime = video.currentTime || 0
      this.stallLastFrameCount = this.getTotalVideoFrames(video)
      this.scheduleStallCheck()
      return
    }

    if (!this.deps.getPerfMarksPlaying() || video.currentTime < 3) {
      this.stallStartedAt = 0
      this.stallLastTime = video.currentTime || 0
      this.stallLastFrameCount = this.getTotalVideoFrames(video)
      this.scheduleStallCheck()
      return
    }

    const bufferedAhead = this.getBufferedAhead(video)
    const currentTime = video.currentTime || 0
    const totalFrames = this.getTotalVideoFrames(video)
    const timeDrift = Math.abs(currentTime - this.stallLastTime)
    const frameDrift = Math.abs(totalFrames - this.stallLastFrameCount)
    const mediaLikelyStalled = video.readyState <= HTMLMediaElement.HAVE_CURRENT_DATA
    const inSeekRecovery = this.seekRecoveryUntil > Date.now()
    
    // 如果播放器卡在片头(currentTime几乎为0)，缩短降级等待时间(2.5秒)，避免一开始白等太久
    const isInitialStall = video.currentTime < 1 && this.deps.getPerfMarksPlaying()
    
    let stallThresholdMs = STALL_TIME_THRESHOLD_MS
    if (inSeekRecovery) {
      stallThresholdMs = Math.max(2500, STALL_TIME_THRESHOLD_MS - 1500)
    } else if (isInitialStall) {
      stallThresholdMs = 2500
    }

    if (mediaLikelyStalled && timeDrift <= STALL_MAX_TIME_DRIFT_SEC && frameDrift <= 1) {
      if (!this.stallStartedAt) {
        this.stallStartedAt = Date.now()
      }
      else if (Date.now() - this.stallStartedAt >= stallThresholdMs) {
        this.stallFallbackInFlight = true
        console.warn(`[115m][native] stall detected, fallback to HLS`, {
          currentTime,
          bufferedAhead,
          readyState: video.readyState,
          networkState: video.networkState,
          totalFrames,
          inSeekRecovery,
          isInitialStall,
          stallThresholdMs
        })
        await this.deps.onFallbackToHls(
          inSeekRecovery ? '无损远跳后恢复失败，已改用 115原画' : '无损播放卡死，已改用 115原画',
          true,
        )
        return
      }
    }
    else {
      this.stallStartedAt = 0
    }

    this.stallLastTime = currentTime
    this.stallLastFrameCount = totalFrames
    this.scheduleStallCheck()
  }

  private scheduleAudioProbe() {
    this.clearAudioProbe()
    this.audioProbeTimer = window.setTimeout(() => {
      this.audioProbeTimer = null
      void this.checkAudioDecode()
    }, AUDIO_PROBE_DELAY_MS)
  }

  private scheduleVideoProbe() {
    this.clearVideoProbe()
    if (!this.art || !this.isNativePlayback) return
    this.videoProbeTimer = window.setTimeout(() => {
      this.videoProbeTimer = null
      void this.checkVideoDecode()
    }, AUDIO_PROBE_DELAY_MS)
  }

  private async checkVideoDecode() {
    if (!this.art || !this.isNativePlayback || !this.deps) return
    if (this.stallFallbackInFlight) return

    const video = this.art.video as HTMLVideoElement
    // 暂停/结束时不重排探测，等 play 事件再重新调度，避免无限自我重排
    if (video.paused || video.ended) return
    if (video.seeking || video.currentTime < 1) {
      this.scheduleVideoProbe()
      return
    }

    const totalFrames = this.getTotalVideoFrames(video)
    const quality = (video.getVideoPlaybackQuality?.() || {}) as VideoPlaybackQualityLike
    const droppedFrames = quality.droppedVideoFrames ?? 0

    // 丢帧率检测：硬解失败（如竖屏超高分辨率）会导致 CPU 软解严重丢帧
    if (shouldFallbackNativeDroppedFrames({
      currentTime: video.currentTime || 0,
      totalVideoFrames: totalFrames,
      droppedVideoFrames: droppedFrames,
    })) {
      this.stallFallbackInFlight = true
      const dropRate = totalFrames > 0 ? Math.round(droppedFrames / totalFrames * 100) : 0
      console.warn('[115m][native] excessive frame drop detected, fallback to HLS', {
        currentTime: video.currentTime,
        totalFrames,
        droppedFrames,
        dropRate: `${dropRate}%`,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
      })
      await this.deps.onFallbackToHls(`无损播放丢帧严重(${dropRate}%)，已改用 115原画`, true)
      return
    }

    const shouldFallback = shouldFallbackNativeBlackVideo({
      currentTime: video.currentTime || 0,
      readyState: video.readyState,
      videoWidth: video.videoWidth || 0,
      videoHeight: video.videoHeight || 0,
      totalVideoFrames: totalFrames,
    })
    if (!shouldFallback) {
      // 片头阶段（<3s）未解码出帧可能只是加载未完成，继续观察，避免黑屏降级链断裂
      // 丢帧检测也需要持续观察，因此扩展到 <10s 仍继续调度
      if ((video.currentTime || 0) < 10) {
        this.scheduleVideoProbe()
      }
      return
    }

    this.stallFallbackInFlight = true
    console.warn('[115m][native] black video detected, fallback to HLS', {
      currentTime: video.currentTime,
      readyState: video.readyState,
      networkState: video.networkState,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      totalFrames,
    })
    await this.deps.onFallbackToHls('无损视频编码不兼容，已改用 115原画', true)
  }

  private async checkAudioDecode() {
    if (!this.art || !this.isNativePlayback || !this.deps) return
    const video = this.art.video as HTMLVideoElement & { webkitAudioDecodedByteCount?: number }
    // 暂停或静音时不判定为无声异常
    if (video.paused || video.muted) return
    if (video.currentTime < 1) {
      this.scheduleAudioProbe()
      return
    }
    const decodedBytes = video.webkitAudioDecodedByteCount
    if (typeof decodedBytes !== 'number' || decodedBytes > 0) return
    if (video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA || video.currentTime < 3) {
      this.scheduleAudioProbe()
      return
    }
    if (!shouldFallbackNativeSilentAudio({
      title: this.deps.getTitle(),
      ultraUrl: this.deps.getUltraUrl(),
      nativeUltraConservative: this.deps.getNativeUltraConservative(),
    })) return
    const masterText = await this.deps.fetchMasterPlaylistText()
    // 只要能获取到 HLS 播放列表（即 115 已转码出 HLS 流，含兼容的 AAC 音频），即可降级
    // 绝大多数普通视频为单音轨（音视频混流），不含独立的 #EXT-X-MEDIA:TYPE=AUDIO 标签
    if (!masterText) return
    await this.deps.onFallbackToHls('无损音频不兼容，已改用 115原画', true)
  }

  private retryPlayback() {
    if (!this.art || !this.deps) return

    this.resetStallState()
    const retryUrl = this.deps.getUltraUrl() || this.art.url || ''
    if (!retryUrl) return

    const currentTime = this.art.currentTime || 0
    const shouldResume = !this.art.video.paused || currentTime <= 0

    this.art.once('video:loadedmetadata', () => {
      if (!this.art) return
      if (currentTime > 0) {
        this.art.seek = currentTime
      }
      if (shouldResume) {
        this.art.play().catch(() => {
          // ignore play rejection on retry; error events handle real failures
        })
      }
    })

    this.art.switchUrl(retryUrl)
  }
}
