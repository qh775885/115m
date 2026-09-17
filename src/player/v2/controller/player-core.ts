/**
 * 115m 2.0 · 播放能力层（Layer 2）
 * 包装底层 Vidstack 的 <video>，向状态层回写，向视图层暴露标准动作。
 * 纪律：本层不 import 任何 UI 代码，可独立驱动播放。
 */

import { Store } from '../state/store'
import { initialPlayerState, type PlayerState } from '../state/player-state'

export class PlayerCore {
  readonly store = new Store<PlayerState>({ ...initialPlayerState })

  private media: HTMLVideoElement | null = null
  private detachFns: Array<() => void> = []
  private observer: MutationObserver | null = null

  /** 挂载到播放器根节点；Vidstack 异步渲染 <video>，故用 MutationObserver 等待。 */
  attach(root: HTMLElement): void {
    const existing = root.querySelector('video')
    if (existing) {
      this.bind(existing)
      return
    }
    this.observer = new MutationObserver(() => {
      const video = root.querySelector('video')
      if (video) {
        this.observer?.disconnect()
        this.observer = null
        this.bind(video)
      }
    })
    this.observer.observe(root, { childList: true, subtree: true })
  }

  get ready(): boolean {
    return !!this.media
  }

  private bind(video: HTMLVideoElement): void {
    this.media = video

    const listen = <K extends keyof HTMLMediaElementEventMap>(
      type: K,
      fn: (ev: HTMLMediaElementEventMap[K]) => void,
    ) => {
      const handler = fn as EventListener
      video.addEventListener(type, handler)
      this.detachFns.push(() => video.removeEventListener(type, handler))
    }

    listen('loadedmetadata', () => this.syncAll())
    listen('durationchange', () => this.syncAll())
    listen('timeupdate', () => {
      if (this.store.get().dragging) return
      this.store.set({ currentTime: video.currentTime })
    })
    listen('progress', () => {
      this.store.set({ buffered: computeBuffered(video) })
    })
    listen('play', () => this.store.set({ paused: false }))
    listen('pause', () => this.store.set({ paused: true }))
    listen('volumechange', () => {
      this.store.set({ volume: video.volume, muted: video.muted })
    })
    listen('ratechange', () => this.store.set({ rate: video.playbackRate }))

    this.syncAll()
  }

  private syncAll(): void {
    const video = this.media
    if (!video) return
    this.store.set({
      currentTime: video.currentTime || 0,
      duration: Number.isFinite(video.duration) ? video.duration : 0,
      buffered: computeBuffered(video),
      paused: video.paused,
      volume: video.volume,
      muted: video.muted,
      rate: video.playbackRate || 1,
    })
  }

  // ───────────────────────────── 动作 ─────────────────────────────

  play(): void {
    this.media?.play().catch(() => {})
  }

  pause(): void {
    this.media?.pause()
  }

  toggle(): void {
    if (!this.media) return
    if (this.media.paused) this.play()
    else this.pause()
  }

  /** 拖拽开始/结束（拖拽期间冻结内核时间回写，避免抖动）。 */
  setDragging(active: boolean): void {
    this.store.set({ dragging: active })
  }

  seekTo(time: number): void {
    const video = this.media
    if (!video || !Number.isFinite(video.duration)) return
    const clamped = Math.max(0, Math.min(time, video.duration))
    video.currentTime = clamped
    this.store.set({ currentTime: clamped })
  }

  seekByRatio(ratio: number): void {
    const duration = this.store.get().duration
    if (!duration) return
    this.seekTo(ratio * duration)
  }

  setVolume(value: number): void {
    const video = this.media
    if (!video) return
    const v = Math.max(0, Math.min(1, value))
    video.volume = v
    if (v > 0 && video.muted) video.muted = false
    if (v === 0) video.muted = true
  }

  toggleMute(): void {
    const video = this.media
    if (!video) return
    video.muted = !video.muted
  }

  setRate(rate: number): void {
    const video = this.media
    if (!video) return
    video.playbackRate = rate
    this.store.set({ rate })
  }

  destroy(): void {
    this.observer?.disconnect()
    this.observer = null
    this.detachFns.forEach((fn) => fn())
    this.detachFns = []
    this.media = null
    this.store.destroy()
  }
}

function computeBuffered(video: HTMLVideoElement): number {
  if (!video.buffered.length || !video.duration) return 0
  const end = video.buffered.end(video.buffered.length - 1)
  return Math.max(0, Math.min(1, end / video.duration))
}
