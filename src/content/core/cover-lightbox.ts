import type { VideoThumbnail } from '../../lib/videoThumbnail'

let lightboxRoot: HTMLDivElement | null = null
let lightboxImg: HTMLImageElement | null = null
let lightboxTime: HTMLDivElement | null = null
let lightboxCovers: VideoThumbnail[] = []
let lightboxIndex = 0
let lightboxDoc: Document | null = null
let lightboxWin: Window | null = null

function renderLightboxImage() {
  const cover = lightboxCovers[lightboxIndex]
  if (!cover || !lightboxImg || !lightboxTime) return

  lightboxImg.src = cover.imgUrl
  lightboxImg.alt = `预览 ${Math.floor(cover.time)}s`
  lightboxTime.textContent = `${lightboxIndex + 1}/${lightboxCovers.length} · ${Math.floor(cover.time)}s`
}

export function closeCoverLightbox() {
  lightboxRoot?.remove()
  lightboxRoot = null
  lightboxImg = null
  lightboxTime = null
  lightboxCovers = []
  if (lightboxDoc) {
    lightboxDoc.removeEventListener('keydown', handleLightboxKeydown, true)
    lightboxDoc = null
  }
  if (lightboxWin) {
    lightboxWin.removeEventListener('keydown', handleLightboxKeydown, true)
    lightboxWin = null
  }
}

function showLightboxImage(nextIndex: number) {
  if (!lightboxCovers.length) return
  lightboxIndex = (nextIndex + lightboxCovers.length) % lightboxCovers.length
  renderLightboxImage()
}

function handleLightboxKeydown(event: KeyboardEvent) {
  if (!lightboxRoot) return

  if (event.key === 'Escape') {
    event.preventDefault()
    closeCoverLightbox()
    return
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    showLightboxImage(lightboxIndex - 1)
    return
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault()
    showLightboxImage(lightboxIndex + 1)
  }
}

function handleLightboxWheel(event: WheelEvent) {
  if (!lightboxRoot || Math.abs(event.deltaY) < 4) return

  event.preventDefault()
  event.stopPropagation()
  showLightboxImage(lightboxIndex + (event.deltaY > 0 ? 1 : -1))
}

export function openCoverLightbox(doc: Document, covers: VideoThumbnail[], index: number) {
  if (!covers.length) return

  closeCoverLightbox()

  lightboxDoc = doc
  lightboxWin = doc.defaultView
  lightboxCovers = covers
  lightboxIndex = index

  const root = doc.createElement('div')
  root.className = 'm115-cover-lightbox'
  // 让遮罩可获得键盘焦点，避免焦点停留在外部文档导致 Esc/方向键失效
  root.tabIndex = -1

  const image = doc.createElement('img')
  image.className = 'm115-cover-lightbox-img'

  const time = doc.createElement('div')
  time.className = 'm115-cover-lightbox-time'

  const hint = doc.createElement('div')
  hint.className = 'm115-cover-lightbox-hint'
  hint.textContent = '点击任意处或按 Esc 关闭'

  const closeButton = doc.createElement('button')
  closeButton.type = 'button'
  closeButton.className = 'm115-cover-lightbox-close'
  closeButton.textContent = '×'

  const prevButton = doc.createElement('button')
  prevButton.type = 'button'
  prevButton.className = 'm115-cover-lightbox-nav is-prev'
  prevButton.textContent = '‹'

  const nextButton = doc.createElement('button')
  nextButton.type = 'button'
  nextButton.className = 'm115-cover-lightbox-nav is-next'
  nextButton.textContent = '›'

  root.appendChild(image)
  root.appendChild(time)
  root.appendChild(hint)
  root.appendChild(closeButton)
  root.appendChild(prevButton)
  root.appendChild(nextButton)
  doc.documentElement.appendChild(root)

  lightboxRoot = root
  lightboxImg = image
  lightboxTime = time
  renderLightboxImage()

  // 抢占焦点，确保此前焦点无论位于何处，Esc/方向键都能被本遮罩接收
  try {
    root.focus({ preventScroll: true })
  }
  catch {
    root.focus()
  }

  root.addEventListener('click', closeCoverLightbox)
  image.addEventListener('click', closeCoverLightbox)
  root.addEventListener('wheel', handleLightboxWheel, { passive: false })
  closeButton.addEventListener('click', closeCoverLightbox)
  prevButton.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    showLightboxImage(lightboxIndex - 1)
  })
  nextButton.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    showLightboxImage(lightboxIndex + 1)
  })
  doc.addEventListener('keydown', handleLightboxKeydown, true)
  lightboxWin?.addEventListener('keydown', handleLightboxKeydown, true)
}
