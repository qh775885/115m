import type Artplayer from 'artplayer'
import { createHoverPreviewElements, findProgressElement } from './dom'
import { clamp, formatTimeLabel } from './hover-utils'
import { HoverPreviewSession, THUMBNAIL_PREVIEW_ENABLED, type HoverCover } from './hover-preview-session'
import { debugLog } from './debug'

function previewDebug(label: string, payload?: Record<string, unknown>) {
  if (payload) {
    debugLog(`[115m][preview] ${label}`, payload)
    return
  }
  debugLog(`[115m][preview] ${label}`)
}

export class HoverPreviewController {
  private previewEl: HTMLDivElement | null = null
  private previewImgEl: HTMLImageElement | null = null
  private previewTimeEl: HTMLDivElement | null = null
  private previewLoadingEl: HTMLDivElement | null = null
  private progressEl: HTMLElement | null = null
  private bindRetryTimer: number | null = null
  private hideTimer: number | null = null
  private hoverReticle: HTMLDivElement | null = null
  private hoverActive = false
  private lastPointerClientX: number | null = null
  private lastPointerClientY: number | null = null
  private lastRenderableCover: HoverCover | null = null
  private lastDisplayedCover: HoverCover | null = null
  private session: HoverPreviewSession | null = null
  private covers: HoverCover[] = []
  private lastHoverBucketTime: number | null = null

  constructor(
    private readonly art: Artplayer,
    private readonly pickCode: string,
    private readonly previewSourceUrl: string | null = null,
  ) {}

  setup() {
    if (!THUMBNAIL_PREVIEW_ENABLED) {
      return
    }

    this.ensurePreviewElements()
    this.bindProgressHoverEventsWithRetry(0)
    this.art.on('video:loadedmetadata', this.handleVideoLoadedmetadata)
    this.art.on('video:durationchange', this.handleVideoDurationChange)
    this.session = new HoverPreviewSession({
      art: this.art,
      pickCode: this.pickCode,
      onCoversChanged: this.handleCoversChanged,
      onDisplayRefreshRequested: this.refreshPreviewFromLastPointer,
      onPreciseCoverReady: this.handlePreciseCoverReady,
      onDebug: previewDebug,
    })
    this.session.scheduleThumbnailWarmup()
    previewDebug('setup', {
      pickCode: this.pickCode,
      previewSourceUrl: this.previewSourceUrl,
    })
  }

  updateSize(cover?: HoverCover | null) {
    if (!this.previewImgEl || !this.previewEl) return

    const coverWidth = cover?.width || 0
    const coverHeight = cover?.height || 0
    if (coverWidth > 0 && coverHeight > 0) {
      this.applyPreviewSize(coverWidth, coverHeight)
      return
    }

    const video = this.art.video as HTMLVideoElement | undefined
    if (!video) return

    const vw = video.videoWidth || 0
    const vh = video.videoHeight || 0
    if (vw > 0 && vh > 0) {
      this.applyPreviewSize(vw, vh)
    }
  }

  private applyPreviewSize(sourceWidth: number, sourceHeight: number) {
    if (!this.previewImgEl || !this.previewEl) return

    if (sourceHeight > sourceWidth) {
      const height = 160
      const width = Math.round(height * (sourceWidth / sourceHeight))
      this.previewImgEl.style.width = `${width}px`
      this.previewImgEl.style.height = `${height}px`
      this.previewEl.style.width = `${width + 16}px`
      this.previewEl.style.minWidth = `${width + 16}px`
      this.previewEl.style.maxWidth = `${width + 16}px`
    }
    else {
      const width = 170
      const height = Math.round(width * (sourceHeight / sourceWidth))
      this.previewImgEl.style.width = `${width}px`
      this.previewImgEl.style.height = `${height}px`
      this.previewEl.style.width = `${width + 16}px`
      this.previewEl.style.minWidth = `${width + 16}px`
      this.previewEl.style.maxWidth = `${width + 16}px`
    }
  }

  refresh() {
    this.updateSize(this.lastRenderableCover)
    this.refreshPreviewFromLastPointer()
  }

  destroy() {
    if (this.bindRetryTimer) {
      window.clearTimeout(this.bindRetryTimer)
      this.bindRetryTimer = null
    }
    this.session?.destroy()
    this.session = null
    this.art.off('video:loadedmetadata', this.handleVideoLoadedmetadata)
    this.art.off('video:durationchange', this.handleVideoDurationChange)
    this.cancelHide()
    const root = this.art.template.$player as HTMLElement
    root.removeEventListener('mousemove', this.handleRootMouseMove)
    root.removeEventListener('mouseleave', this.handleRootMouseLeave)
    this.progressEl?.removeEventListener('mouseenter', this.handleProgressMouseEnter)
    this.progressEl?.removeEventListener('mouseleave', this.handleProgressMouseLeave)
    this.progressEl?.removeEventListener('click', this.handleProgressClick, true)
    this.progressEl = null
    if (this.hoverReticle) {
      this.hoverReticle.remove()
      this.hoverReticle = null
    }
    if (this.previewEl) {
      this.previewEl.remove()
      this.previewEl = null
      this.previewImgEl = null
      this.previewTimeEl = null
      this.previewLoadingEl = null
    }
    this.covers = []
    this.lastRenderableCover = null
    this.lastDisplayedCover = null
    this.lastHoverBucketTime = null
    this.lastPointerClientX = null
    this.lastPointerClientY = null
  }

  private ensurePreviewElements() {
    if (this.previewEl) return

    const refs = createHoverPreviewElements(this.art)
    this.previewEl = refs.preview
    this.previewImgEl = refs.image
    this.previewTimeEl = refs.time
    this.previewLoadingEl = refs.loading
  }

  private bindProgressHoverEventsWithRetry(retry: number) {
    const progress = findProgressElement(this.art)
    if (!progress) {
      if (retry >= 20) return
      this.bindRetryTimer = window.setTimeout(() => {
        this.bindProgressHoverEventsWithRetry(retry + 1)
      }, 300)
      return
    }

    this.progressEl = progress
    progress.addEventListener('mouseenter', this.handleProgressMouseEnter)
    progress.addEventListener('mouseleave', this.handleProgressMouseLeave)
    progress.addEventListener('click', this.handleProgressClick, true)

    this.createHoverReticle()

    const root = this.art.template.$player as HTMLElement
    root.addEventListener('mousemove', this.handleRootMouseMove)
    root.addEventListener('mouseleave', this.handleRootMouseLeave)
  }

  private createHoverReticle() {
    if (this.hoverReticle) return

    const reticle = document.createElement('div')
    reticle.style.cssText = [
      'position:absolute',
      'left:0',
      'bottom:0',
      'height:80px',
      'width:100%',
      'pointer-events:none',
      'z-index:0',
    ].join(';')

    const bottom = this.art.template.$bottom as HTMLElement
    if (bottom) {
      bottom.style.position = 'relative'
      bottom.appendChild(reticle)
    }

    this.hoverReticle = reticle
  }

  private handleProgressMouseEnter = (event: MouseEvent) => {
    this.hoverActive = true
    this.cancelHide()
    this.rememberPointer(event)
    this.session?.ensureThumbnailsForHover()
    if (this.art.duration) {
      this.updatePreviewPosition(event)
    }
    else if (this.previewEl && this.covers.length > 0) {
      this.previewEl.style.display = 'block'
    }
  }

  private handleProgressClick = (event: MouseEvent) => {
    if (!this.progressEl || !this.art.duration) {
      return
    }

    const hoverTime = this.getHoverTimeFromClientX(event.clientX)
    if (hoverTime == null) {
      return
    }

    event.preventDefault()
    event.stopImmediatePropagation()
    this.hoverActive = true
    this.cancelHide()
    this.rememberPointer(event)
    this.updatePreviewPosition(event)
    this.art.seek = this.getSeekTimeForCurrentPreview(hoverTime)
  }

  private handleProgressMouseLeave = () => {
    this.scheduleHide()
  }

  private handleRootMouseMove = (event: MouseEvent) => {
    this.cancelHide()
    this.rememberPointer(event)

    if (this.shouldSuspendPreview(event.target)) {
      this.hidePreview()
      return
    }

    if (!this.progressEl) return

    const progressRect = this.progressEl.getBoundingClientRect()
    const mouseY = event.clientY
    const tolerance = 80
    const belowTolerance = 10

    const isNearProgress = mouseY >= (progressRect.top - tolerance)
      && mouseY <= (progressRect.bottom + belowTolerance)
      && event.clientX >= progressRect.left - 10
      && event.clientX <= progressRect.right + 10

    if (isNearProgress) {
      this.hoverActive = true
      this.session?.ensureThumbnailsForHover()
      if (this.previewEl && this.covers.length > 0 && this.previewEl.style.display === 'none') {
        this.previewEl.style.display = 'block'
      }
      if (this.art.duration) {
        this.updatePreviewPosition(event)
      }
    }
    else {
      this.hoverActive = false
      this.hidePreview()
    }
  }

  private handleRootMouseLeave = () => {
    this.hoverActive = false
    this.lastPointerClientX = null
    this.lastPointerClientY = null
    this.hidePreview()
  }

  private handleVideoLoadedmetadata = () => {
    this.clearDisplayState()
    this.updateSize()
    this.refreshPreviewFromLastPointer()
  }

  private handleVideoDurationChange = () => {
    this.clearDisplayState()
    this.session?.handleDurationChange()
  }

  private clearDisplayState() {
    this.covers = []
    this.lastRenderableCover = null
    this.lastDisplayedCover = null
    this.lastHoverBucketTime = null
    if (this.previewImgEl) {
      this.previewImgEl.removeAttribute('src')
      this.previewImgEl.style.visibility = 'hidden'
    }
    if (this.previewLoadingEl) {
      this.previewLoadingEl.style.display = 'none'
    }
  }

  private handleCoversChanged = (covers: HoverCover[], _duration: number) => {
    this.covers = covers
  }

  private handlePreciseCoverReady = (bucketTime: number, cover: HoverCover) => {
    if (this.hoverActive && this.lastHoverBucketTime === bucketTime && this.previewEl && this.previewImgEl) {
      this.previewImgEl.src = cover.imgUrl
      this.updateSize(cover)
      this.previewImgEl.style.visibility = 'visible'
      this.lastRenderableCover = cover
      this.lastDisplayedCover = cover
      if (this.previewLoadingEl) {
        this.previewLoadingEl.style.display = 'none'
      }
      this.previewEl.style.display = 'block'
      this.refreshPreviewFromLastPointer()
    }
  }

  private scheduleHide() {
    this.cancelHide()
    this.hideTimer = window.setTimeout(() => {
      this.hidePreview()
    }, 200)
  }

  private cancelHide() {
    if (this.hideTimer) {
      window.clearTimeout(this.hideTimer)
      this.hideTimer = null
    }
  }

  private hidePreview() {
    this.hoverActive = false
    if (this.previewEl) {
      this.previewEl.style.display = 'none'
    }
    if (this.previewLoadingEl) {
      this.previewLoadingEl.style.display = 'none'
    }
  }

  private rememberPointer(event: MouseEvent) {
    this.lastPointerClientX = event.clientX
    this.lastPointerClientY = event.clientY
  }

  private refreshPreviewFromLastPointer = () => {
    if (!this.hoverActive || !this.progressEl || !this.previewEl || !this.art.duration) {
      return
    }
    if (this.lastPointerClientX == null || this.lastPointerClientY == null) {
      return
    }

    this.updatePreviewPosition(new MouseEvent('mousemove', {
      clientX: this.lastPointerClientX,
      clientY: this.lastPointerClientY,
      bubbles: true,
      cancelable: true,
      view: window,
    }))
  }

  private isFloatingMenuOpen() {
    const root = this.art.template.$player as HTMLElement
    const selectors = [
      '.art-settings',
      '.art-setting',
      '.art-setting-body',
      '.art-selector',
      '.art-selector-list',
      '.art-control-selector:hover',
      '.art-qualitys',
      '.art-contextmenus',
      '.art-volume-panel',
    ]

    return selectors.some((selector) => {
      const nodes = root.querySelectorAll<HTMLElement>(selector)
      return Array.from(nodes).some((node) => {
        const style = window.getComputedStyle(node)
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0'
      })
    })
  }

  private shouldSuspendPreview(target: EventTarget | null) {
    if (this.isFloatingMenuOpen()) return true
    if (!(target instanceof Element)) return false

    return Boolean(target.closest([
      '.art-control-volume',
      '.art-volume-panel',
      '.art-volume-slider',
      '.art-volume-handle',
      '.art-volume-indicator',
    ].join(', ')))
  }

  private updatePreviewPosition(event: MouseEvent) {
    if (!this.progressEl || !this.previewEl || !this.previewImgEl || !this.previewTimeEl || !this.session) {
      return
    }
    if (!this.art.duration) return
    if (this.shouldSuspendPreview(event.target)) {
      this.hidePreview()
      return
    }

    const hoverTime = this.getHoverTimeFromClientX(event.clientX)
    if (hoverTime == null) return

    const state = this.session.getDisplayState(hoverTime)
    this.lastHoverBucketTime = state.preciseBucketTime

    const containerRect = (this.art.template.$player as HTMLElement).getBoundingClientRect()
    const offsetX = event.clientX - containerRect.left
    const previewWidth = this.previewEl.offsetWidth || 182
    const minLeft = previewWidth / 2 + 5
    const maxLeft = Math.max(minLeft, containerRect.width - minLeft)
    const clamped = clamp(offsetX, minLeft, maxLeft)
    this.previewEl.style.left = `${clamped}px`

    if (state.nearest?.imgUrl) {
      this.previewImgEl.src = state.nearest.imgUrl
      this.updateSize(state.nearest)
      this.previewImgEl.style.visibility = 'visible'
      if (this.previewLoadingEl) {
        this.previewLoadingEl.style.display = 'none'
      }
      this.previewEl.style.display = 'block'
      this.lastRenderableCover = state.nearest
      this.lastDisplayedCover = state.nearest
    }
    else if (this.lastRenderableCover?.imgUrl) {
      this.previewImgEl.src = this.lastRenderableCover.imgUrl
      this.updateSize(this.lastRenderableCover)
      this.previewImgEl.style.visibility = 'visible'
      if (this.previewLoadingEl) {
        this.previewLoadingEl.style.display = 'none'
      }
      this.previewEl.style.display = 'block'
      this.lastDisplayedCover = this.lastRenderableCover
    }
    else {
      this.lastDisplayedCover = null
      this.previewImgEl.style.visibility = 'hidden'
      if (this.previewLoadingEl) {
        this.previewLoadingEl.style.display = 'flex'
      }
      this.previewEl.style.display = 'block'
    }
    this.previewTimeEl.textContent = formatTimeLabel(hoverTime)
    this.session.schedulePreciseCover(hoverTime, state.nearest)
  }

  private getSeekTimeForCurrentPreview(hoverTime: number): number {
    const displayedTime = this.lastDisplayedCover?.time
    if (typeof displayedTime !== 'number' || !Number.isFinite(displayedTime)) {
      return hoverTime
    }

    return clamp(displayedTime, 0, this.art.duration || displayedTime)
  }

  private getHoverTimeFromClientX(clientX: number): number | null {
    if (!this.progressEl || !this.art.duration) {
      return null
    }

    const progressRect = this.progressEl.getBoundingClientRect()
    if (progressRect.width <= 0) {
      return null
    }

    const raw = (clientX - progressRect.left) / progressRect.width
    const ratio = clamp(raw, 0, 1)
    return ratio * this.art.duration
  }
}
