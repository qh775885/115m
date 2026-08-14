import type { VideoThumbnail } from '../../lib/videoThumbnail'

let lightboxRoot: HTMLDivElement | null = null
let lightboxImg: HTMLImageElement | null = null
let lightboxTime: HTMLDivElement | null = null
let lightboxCovers: VideoThumbnail[] = []
let lightboxIndex = 0
let lightboxDoc: Document | null = null

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
  lightboxCovers = covers
  lightboxIndex = index

  const root = doc.createElement('div')
  root.className = 'm115-cover-lightbox'

  const image = doc.createElement('img')
  image.className = 'm115-cover-lightbox-img'

  const time = doc.createElement('div')
  time.className = 'm115-cover-lightbox-time'

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
  root.appendChild(closeButton)
  root.appendChild(prevButton)
  root.appendChild(nextButton)
  doc.documentElement.appendChild(root)

  lightboxRoot = root
  lightboxImg = image
  lightboxTime = time
  renderLightboxImage()

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
}
