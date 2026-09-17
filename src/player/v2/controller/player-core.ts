/**
 * 115m 2.0 · 播放能力层（Layer 2）
 * 包装底层 Vidstack 的 <video>，向状态层回写，向视图层暴露标准动作。
 * 纪律：本层不 import 任何 UI 代码，可独立驱动播放。
 */

import { Store } from '../state/store'
import { initialPlayerState, type AudioTrackInfo, type PlayerState } from '../state/player-state'

export class PlayerCore {
  readonly store = new Store<PlayerState>({ ...initialPlayerState })

  private root: (HTMLElement & { src?: unknown }) | null = null
  private media: HTMLVideoElement | null = null
  private detachFns: Array<() => void> = []
  private rootListeners: Array<() => void> = []
  private observer: MutationObserver | null = null
  private autoPlayPending = false
  private rotation = 0
  private endedHandlers = new Set<() => void>()

  /** 挂载到播放器根节点；Vidstack 异步渲染 <video>，故用 MutationObserver 等待。 */
  attach(root: HTMLElement): void {
    this.root = root as HTMLElement & { src?: unknown }
    this.bindAudioTracks()
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

  onEnded(fn: () => void): () => void {
    this.endedHandlers.add(fn)
    return () => {
      this.endedHandlers.delete(fn)
    }
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
    listen('canplay', () => {
      if (this.autoPlayPending) {
        this.autoPlayPending = false
        this.play()
      }
    })
    listen('ended', () => this.endedHandlers.forEach((fn) => fn()))

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

  /** 监听媒体内核音频轨道变化（Vidstack 原生 track API）。 */
  private bindAudioTracks(): void {
    const el = this.root as any
    if (!el) return
    const emit = () => this.syncAudioTracks()
    for (const type of ['audio-tracks-change', 'audio-track-change', 'provider-change']) {
      el.addEventListener(type, emit)
      this.rootListeners.push(() => el.removeEventListener(type, emit))
    }
  }

  private syncAudioTracks(): void {
    const tracks = (this.root as any)?.audioTracks
    const list: AudioTrackInfo[] = []
    let selectedId = ''
    if (tracks) {
      for (let i = 0; i < tracks.length; i += 1) {
        const track = tracks[i]
        const id = String(track?.id ?? i)
        list.push({ id, label: track?.label || track?.language || `音轨 ${i + 1}` })
        if (track?.selected) selectedId = id
      }
    }
    if (!selectedId && list.length) selectedId = list[0].id
    this.store.set({ audioTracks: list, audioTrack: selectedId })
  }

  // ───────────────────────────── 动作 ─────────────────────────────

  /** 选择音频轨道。 */
  selectAudioTrack(id: string): void {
    const tracks = (this.root as any)?.audioTracks
    if (!tracks) return
    for (let i = 0; i < tracks.length; i += 1) {
      if (String(tracks[i]?.id ?? i) === id) {
        tracks[i].selected = true
        break
      }
    }
    this.syncAudioTracks()
  }

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

  /** 换源（切集 / 切清晰度）；autoPlay 需等内核就绪后自动起播。 */
  load(src: string, type?: string, autoPlay = false): void {
    const el = this.root
    if (!el) return
    this.autoPlayPending = autoPlay
    this.store.set({ currentTime: 0, duration: 0, buffered: 0 })
    el.src = type ? { src, type } : { src }
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

  /** 以当前时间为基础步进（键盘左右键用）。 */
  seekBy(delta: number): void {
    this.seekTo(this.store.get().currentTime + delta)
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

  /** 以当前音量为基础增减（键盘音量键用）。 */
  adjustVolume(delta: number): void {
    const video = this.media
    if (!video) return
    this.setVolume(video.volume + delta)
  }

  /** 顺时针 90° 循环旋转画面，并按视口自适应缩放。 */
  rotate(): void {
    this.rotation = (this.rotation + 90) % 360
    this.applyRotation()
  }

  private applyRotation(): void {
    const video = this.media
    if (!video) return
    const deg = this.rotation
    if (deg === 0) {
      video.style.transform = ''
      video.style.transformOrigin = ''
      return
    }
    const pane = video.parentElement
    const w = pane?.clientWidth || video.clientWidth || 0
    const h = pane?.clientHeight || video.clientHeight || 0
    const scale = deg % 180 === 90 && w && h ? Math.min(w / h, h / w) : 1
    video.style.transformOrigin = 'center center'
    video.style.transform = `rotate(${deg}deg) scale(${scale})`
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
    this.rootListeners.forEach((fn) => fn())
    this.rootListeners = []
    this.media = null
    this.store.destroy()
  }
}

function computeBuffered(video: HTMLVideoElement): number {
  if (!video.buffered.length || !video.duration) return 0
  const end = video.buffered.end(video.buffered.length - 1)
  return Math.max(0, Math.min(1, end / video.duration))
}
