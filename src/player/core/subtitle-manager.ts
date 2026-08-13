import { fetchSubtitleList, fetchSubtitleText, findCueAt, parseSubtitleText, type SubtitleCue, type SubtitleItem } from './subtitles'

interface SubtitleManagerOptions {
  container: HTMLElement
  getVideo: () => HTMLVideoElement | null
  sendMessage: <T = unknown>(message: unknown, retries?: number, delay?: number, timeoutMs?: number) => Promise<T | null>
  onListChange?: () => void
  onTrackChange?: () => void
  onListLoaded?: () => void
  onError?: (message: string) => void
}

const NATIVE_PREFIX = '__native__'

function subtitleDebug(...args: unknown[]) {
  if (localStorage.getItem('115m-player-debug') === '1') {
    console.debug(...args)
  }
}

export class SubtitleManager {
  private readonly layer: HTMLDivElement
  private readonly textEl: HTMLParagraphElement
  private list: SubtitleItem[] = []
  private cues: SubtitleCue[] = []
  private selectedSid = ''
  private loadToken = 0
  private rafId = 0
  private destroyed = false
  private lastCueText = ''
  private nativeTracks: Map<string, { track: TextTrack, cues: SubtitleCue[] }> = new Map()
  private cleanupFns: Array<() => void> = []

  constructor(private readonly options: SubtitleManagerOptions) {
    this.layer = document.createElement('div')
    this.layer.className = 'm115-subtitle-layer'
    this.layer.style.display = 'none'

    const box = document.createElement('div')
    box.className = 'm115-subtitle-box'

    this.textEl = document.createElement('p')
    box.appendChild(this.textEl)
    this.layer.appendChild(box)
    this.options.container.appendChild(this.layer)

    this.bindVideoEvents()
  }

  getItems() {
    return this.list
  }

  getSelectedSid() {
    return this.selectedSid
  }

  async loadList(pickCode: string) {
    this.clearTrack()
    const token = this.loadToken
    this.nativeTracks.clear()

    subtitleDebug('[115m][subtitle] loadList called')

    try {
      const list = await fetchSubtitleList(this.options.sendMessage, pickCode)
      if (this.destroyed || token !== this.loadToken) return
      subtitleDebug('[115m][subtitle] API returned list:', list.length, 'items')
      this.list = list
      this.options.onListChange?.()

      if (list.length === 0) {
        subtitleDebug('[115m][subtitle] API returned empty, scanning native tracks...')
        this.scanNativeTracks()
      }
      this.options.onListLoaded?.()
    }
    catch (error) {
      if (this.destroyed || token !== this.loadToken) return
      console.warn('[115m][subtitle] loadList failed:', error)
      this.list = []
      this.scanNativeTracks()
      this.options.onListChange?.()
      this.options.onListLoaded?.()
    }
  }

  async select(sid: string) {
    if (!sid) {
      this.clearTrack()
      this.options.onTrackChange?.()
      return
    }

    const item = this.list.find(entry => entry.sid === sid)
    if (!item) return

    const token = ++this.loadToken
    this.selectedSid = sid
    this.cues = []
    this.hide()
    this.options.onTrackChange?.()

    try {
      if (sid.startsWith(NATIVE_PREFIX)) {
        const entry = this.nativeTracks.get(sid)
        if (entry) {
          this.cues = this.extractCuesFromTrack(entry.track)
          this.startRenderLoop()
          this.options.onTrackChange?.()
          if (!this.cues.length) {
            this.options.onError?.('字幕解析为空')
          }
        }
        else {
          this.options.onError?.('未找到内嵌字幕轨道')
        }
      }
      else {
        const text = await fetchSubtitleText(item.url)
        if (this.destroyed || token !== this.loadToken) return
        this.cues = parseSubtitleText(text, item.type)
        this.startRenderLoop()
        this.options.onTrackChange?.()
        if (!this.cues.length) {
          this.options.onError?.('字幕解析为空')
        }
      }
    }
    catch (error) {
      if (this.destroyed || token !== this.loadToken) return
      this.clearTrack()
      this.options.onTrackChange?.()
      this.options.onError?.(error instanceof Error ? error.message : String(error))
    }
  }

  clearTrack() {
    ++this.loadToken
    this.selectedSid = ''
    this.cues = []
    this.stopRenderLoop()
    this.hide()
  }

  destroy() {
    this.destroyed = true
    this.clearTrack()
    this.list = []
    this.nativeTracks.clear()
    this.cleanupFns.forEach(fn => fn())
    this.cleanupFns = []
    this.layer.remove()
  }

  private bindVideoEvents() {
    const video = this.options.getVideo()
    if (!video) return

    const onMeta = () => {
      this.scanNativeTracks()
    }

    if (video.readyState >= 1) {
      setTimeout(() => this.scanNativeTracks(), 100)
    }
    else {
      video.addEventListener('loadedmetadata', onMeta, { once: true })
      this.cleanupFns.push(() => video.removeEventListener('loadedmetadata', onMeta))
    }

    const onAddTrack = () => this.scanNativeTracks()
    const tracks = video.textTracks
    if (tracks) {
      tracks.addEventListener('addtrack', onAddTrack)
      this.cleanupFns.push(() => tracks.removeEventListener('addtrack', onAddTrack))
    }
    video.addEventListener('addtrack', onAddTrack)
    this.cleanupFns.push(() => video.removeEventListener('addtrack', onAddTrack))
  }

  private scanNativeTracks() {
    const video = this.options.getVideo()
    if (!video || this.destroyed) return

    const textTracks = video.textTracks
    if (!textTracks || textTracks.length === 0) {
      subtitleDebug('[115m][subtitle] no textTracks found on video')
      return
    }

    subtitleDebug('[115m][subtitle] scanning textTracks:', textTracks.length, 'tracks')

    let changed = false

    for (let i = 0; i < textTracks.length; i++) {
      const track = textTracks[i]
      if (!track) continue
      if (track.kind === 'metadata' || track.kind === 'chapters') continue

      subtitleDebug('[115m][subtitle] found track:', { index: i, kind: track.kind, language: track.language, label: track.label, mode: track.mode, cues: track.cues?.length })

      const lang = (track.language || '').trim()
      const label = (track.label || '').trim()
      const displayName = label || lang || `内嵌字幕 ${i + 1}`
      const sid = `${NATIVE_PREFIX}${i}_${lang || label || i}`

      if (this.list.some(item => item.sid === sid)) continue

      track.mode = 'hidden'

      this.list.push({
        sid,
        title: displayName,
        url: '',
        type: 'native',
        language: lang,
      })

      this.nativeTracks.set(sid, { track, cues: [] })

      changed = true
    }

    if (changed) {
      subtitleDebug('[115m][subtitle] detected new native tracks, list now:', this.list.length)
      this.options.onListChange?.()

      if (!this.selectedSid && this.list.length > 0) {
        void this.select(this.list[0].sid)
      }
    }
  }

  private extractCuesFromTrack(track: TextTrack): SubtitleCue[] {
    const cues: SubtitleCue[] = []
    if (!track.cues) return cues

    for (let i = 0; i < track.cues.length; i++) {
      const c = track.cues[i] as VTTCue
      const rawText = typeof c.text === 'string'
        ? c.text
        : typeof (c as { getCueAsHTML?: () => DocumentFragment }).getCueAsHTML === 'function'
          ? ((c as { getCueAsHTML: () => DocumentFragment }).getCueAsHTML().textContent || '')
          : ''
      cues.push({
        start: c.startTime,
        end: c.endTime,
        text: rawText,
      })
    }
    return cues
  }

  private startRenderLoop() {
    this.stopRenderLoop()
    const render = () => {
      this.render()
      this.rafId = window.requestAnimationFrame(render)
    }
    this.rafId = window.requestAnimationFrame(render)
  }

  private stopRenderLoop() {
    if (this.rafId) {
      window.cancelAnimationFrame(this.rafId)
      this.rafId = 0
    }
  }

  private render() {
    const video = this.options.getVideo()
    if (!video || !this.cues.length) {
      this.hide()
      return
    }

    const cue = findCueAt(this.cues, video.currentTime)
    if (!cue) {
      this.hide()
      return
    }

    // 同一 cue 保持期间不重复写 DOM，仅在文本变化时更新
    if (cue.text === this.lastCueText) {
      return
    }

    this.lastCueText = cue.text
    this.textEl.textContent = cue.text
    this.layer.style.display = 'flex'
  }

  private hide() {
    if (this.lastCueText !== '') {
      this.lastCueText = ''
      this.textEl.textContent = ''
    }
    if (this.layer.style.display !== 'none') {
      this.layer.style.display = 'none'
    }
  }
}
