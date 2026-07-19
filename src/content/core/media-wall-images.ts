import type { MediaWallImageItem, LightboxController } from './media-wall-types'
import { isImageExtension, readAttr } from '../../shared/utils'
import { openNativeFolder, openNativeFolderContextMenu, selectNativeFolder } from './media-wall-folders'
import { installWallDragSelection, isWallSourceItemSelected } from './media-wall-selection'
import { isRuntimeContextInvalidatedResult } from './runtime'

function toOriginalImageUrl(url: string): string {
  return url.replace(/_\d+(\?|$)/, '_0$1')
}

function startSelectionSync(sourceItem: HTMLElement, sync: () => void): () => void {
  const observer = new MutationObserver(() => sync())
  observer.observe(sourceItem, {
    attributes: true,
    attributeFilter: ['class', 'selected', 'check', 'is_selected', 'data-selected', 'aria-selected'],
    subtree: true,
    childList: true,
  })
  sourceItem.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.addEventListener('change', sync)
  })
  return () => observer.disconnect()
}

export function buildImageItem(item: HTMLElement): MediaWallImageItem | null {
  if (item.getAttribute('file_type') !== '1') return null
  if (item.getAttribute('iv') === '1') return null

  const title = item.getAttribute('title') || item.querySelector('.file-name .name')?.textContent?.trim() || '图片'
  const thumbUrl = item.getAttribute('path') || item.querySelector('img')?.getAttribute('src') || ''
  if (!thumbUrl || !isImageExtension(title)) return null

  return {
    id: readAttr(item, ['file_id', 'fid', 'fileid', 'pick_code']) || title,
    title,
    thumbUrl,
    originalUrl: toOriginalImageUrl(thumbUrl),
    fileId: readAttr(item, ['file_id', 'fid', 'fileid']),
    parentId: readAttr(item, ['p_id', 'pid', 'parent_id', 'cid']) || new URLSearchParams(location.search).get('cid') || '0',
    pickCode: readAttr(item, ['pick_code', 'pickcode']),
    sourceItem: item,
    open: () => openNativeFolder(item, 'm115-wall-hidden-item'),
    select: (event?: MouseEvent) => selectNativeFolder(item, 'm115-wall-hidden-item', event),
    contextMenu: (event: MouseEvent) => openNativeFolderContextMenu(item, 'm115-wall-hidden-item', event),
  }
}

function preloadImage(url: string) {
  if (!url) return
  const img = new Image()
  img.src = url
}

function createToast(doc: Document, message: string) {
  const toast = doc.createElement('div')
  toast.className = 'm115-viewer-toast'
  toast.textContent = message
  doc.body.appendChild(toast)
  window.setTimeout(() => toast.remove(), 1600)
}

function createLightboxController(doc: Document, sendRuntimeMessageSafe: typeof import('./runtime').sendRuntimeMessageSafe): LightboxController {
  const overlay = doc.createElement('div')
  overlay.className = 'm115-viewer'

  const toolbar = doc.createElement('div')
  toolbar.className = 'm115-viewer-toolbar'

  const titleEl = doc.createElement('div')
  titleEl.className = 'm115-viewer-title'

  const zoomHint = doc.createElement('div')
  zoomHint.className = 'm115-viewer-zoom-hint'

  const toolbarMeta = doc.createElement('div')
  toolbarMeta.className = 'm115-viewer-meta'

  const toolbarActions = doc.createElement('div')
  toolbarActions.className = 'm115-viewer-actions'

  const closeBtn = doc.createElement('button')
  closeBtn.type = 'button'
  closeBtn.className = 'm115-viewer-tool-btn is-icon'
  closeBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  closeBtn.title = '关闭'
  closeBtn.setAttribute('aria-label', '关闭')

  const zoomBadge = doc.createElement('button')
  zoomBadge.type = 'button'
  zoomBadge.className = 'm115-viewer-zoom-badge'

  toolbarMeta.appendChild(titleEl)
  toolbarMeta.appendChild(zoomHint)
  toolbarActions.appendChild(zoomBadge)
  toolbarActions.appendChild(closeBtn)
  toolbar.appendChild(toolbarMeta)
  toolbar.appendChild(toolbarActions)

  const stage = doc.createElement('div')
  stage.className = 'm115-viewer-stage'

  const prevBtn = doc.createElement('button')
  prevBtn.type = 'button'
  prevBtn.className = 'm115-viewer-nav m115-viewer-prev'
  prevBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>'

  const nextBtn = doc.createElement('button')
  nextBtn.type = 'button'
  nextBtn.className = 'm115-viewer-nav m115-viewer-next'
  nextBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>'

  const mediaFrame = doc.createElement('div')
  mediaFrame.className = 'm115-viewer-frame'

  const deleteBtn = doc.createElement('button')
  deleteBtn.type = 'button'
  deleteBtn.className = 'm115-viewer-frame-delete'
  deleteBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>'
  deleteBtn.title = '删除当前图片'
  deleteBtn.setAttribute('aria-label', '删除当前图片')

  const imageEl = doc.createElement('img')
  imageEl.className = 'm115-viewer-image'

  mediaFrame.appendChild(imageEl)
  mediaFrame.appendChild(deleteBtn)
  stage.appendChild(prevBtn)
  stage.appendChild(mediaFrame)
  stage.appendChild(nextBtn)

  const thumbsWrap = doc.createElement('div')
  thumbsWrap.className = 'm115-viewer-thumbs-wrap'

  const thumbsToggle = doc.createElement('button')
  thumbsToggle.type = 'button'
  thumbsToggle.className = 'm115-viewer-thumbs-toggle'
  thumbsToggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'
  thumbsToggle.title = '收起缩略图'
  thumbsToggle.setAttribute('aria-label', '收起缩略图')

  const thumbs = doc.createElement('div')
  thumbs.className = 'm115-viewer-thumbs'

  overlay.appendChild(toolbar)
  overlay.appendChild(stage)
  overlay.appendChild(thumbsWrap)
  doc.body.appendChild(overlay)
  thumbsWrap.appendChild(thumbsToggle)
  thumbsWrap.appendChild(thumbs)

  let items: MediaWallImageItem[] = []
  let currentIndex = 0
  let zoomScale = 1
  let translateX = 0
  let translateY = 0
  let isDragging = false
  let pointerId: number | null = null
  let pointerDownX = 0
  let pointerDownY = 0
  let clickSuppressUntil = 0
  let dragStartX = 0
  let dragStartY = 0
  let dragOriginX = 0
  let dragOriginY = 0
  let targetTranslateX = 0
  let targetTranslateY = 0
  let settleAnimationFrame = 0
  let dragAnimationFrame = 0
  let lastDragTime = 0
  let velocityX = 0
  let velocityY = 0
  let lastPointerX = 0
  let lastPointerY = 0
  let lastTapAt = 0
  const lastTapX = 0
  const lastTapY = 0
  let thumbsCollapsed = false
  let wheelGestureAccumulated = 0
  let wheelGestureTriggered = false
  let wheelGestureTimer = 0
  let thumbButtons: HTMLButtonElement[] = []

  const DRAG_THRESHOLD = 6
  const EDGE_RESISTANCE = 0.5
  const DOUBLE_TAP_DELAY = 260
  const INERTIA_FACTOR = 60
  const SETTLE_LERP = 0.34
  const WHEEL_GESTURE_STEP = 70
  const WHEEL_GESTURE_RESET_DELAY = 120

  const updateThumbsToggle = () => {
    thumbsToggle.innerHTML = thumbsCollapsed
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 12h10"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'
    thumbsToggle.title = thumbsCollapsed ? '展开缩略图' : '收起缩略图'
    thumbsToggle.setAttribute('aria-label', thumbsToggle.title)
    thumbsWrap.classList.toggle('is-collapsed', thumbsCollapsed)
  }

  const getDragBounds = () => {
    const frameRect = mediaFrame.getBoundingClientRect()
    const naturalWidth = imageEl.naturalWidth || frameRect.width || 1
    const naturalHeight = imageEl.naturalHeight || frameRect.height || 1
    const fitScale = Math.min(frameRect.width / naturalWidth, frameRect.height / naturalHeight, 1)
    const renderedWidth = naturalWidth * fitScale * zoomScale
    const renderedHeight = naturalHeight * fitScale * zoomScale
    return {
      maxOffsetX: Math.max(0, (renderedWidth - frameRect.width) / 2),
      maxOffsetY: Math.max(0, (renderedHeight - frameRect.height) / 2),
    }
  }

  const applyEdgeResistance = (value: number, min: number, max: number) => {
    if (value < min) return min + (value - min) * EDGE_RESISTANCE
    if (value > max) return max + (value - max) * EDGE_RESISTANCE
    return value
  }

  const clampTranslate = () => {
    const { maxOffsetX, maxOffsetY } = getDragBounds()
    translateX = Math.max(-maxOffsetX, Math.min(maxOffsetX, translateX))
    translateY = Math.max(-maxOffsetY, Math.min(maxOffsetY, translateY))
  }

  const updateZoomUi = () => {
    const percent = Math.round(zoomScale * 100)
    zoomBadge.textContent = `${percent}%`
    zoomBadge.classList.toggle('is-active', zoomScale > 1)
    zoomHint.textContent = zoomScale > 1 ? '可拖动' : ''
    zoomHint.classList.toggle('is-active', zoomScale > 1)
    imageEl.classList.toggle('is-draggable', zoomScale > 1)
    imageEl.classList.toggle('is-dragging', isDragging)
    mediaFrame.classList.toggle('is-zoomed', zoomScale > 1)
    mediaFrame.classList.toggle('is-dragging', isDragging)
  }

  const applyZoom = () => {
    clampTranslate()
    targetTranslateX = translateX
    targetTranslateY = translateY
    imageEl.style.transform = `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${zoomScale})`
    updateZoomUi()
  }

  const applyDragFrame = () => {
    dragAnimationFrame = 0
    const { maxOffsetX, maxOffsetY } = getDragBounds()
    translateX = applyEdgeResistance(targetTranslateX, -maxOffsetX, maxOffsetX)
    translateY = applyEdgeResistance(targetTranslateY, -maxOffsetY, maxOffsetY)
    imageEl.style.transform = `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${zoomScale})`
    updateZoomUi()
  }

  const scheduleDragFrame = () => {
    if (dragAnimationFrame) return
    dragAnimationFrame = window.requestAnimationFrame(applyDragFrame)
  }

  const ensureActiveThumbVisible = () => {
    const activeThumb = thumbs.querySelector<HTMLElement>('.m115-viewer-thumb.is-active')
    activeThumb?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  const updateActiveThumb = (nextIndex: number, previousIndex: number) => {
    if (previousIndex !== nextIndex) {
      thumbButtons[previousIndex]?.classList.remove('is-active')
    }
    thumbButtons[nextIndex]?.classList.add('is-active')
    window.setTimeout(() => ensureActiveThumbVisible(), 0)
  }

  const syncThumbs = () => {
    thumbs.innerHTML = ''
    thumbButtons = items.map((item, index) => {
      const btn = doc.createElement('button')
      btn.type = 'button'
      btn.className = `m115-viewer-thumb ${index === currentIndex ? 'is-active' : ''}`
      btn.title = item.title
      const img = doc.createElement('img')
      img.src = item.thumbUrl
      img.alt = item.title
      img.loading = 'lazy'
      btn.appendChild(img)
      btn.addEventListener('click', () => {
        if (currentIndex === index) return
        const previousIndex = currentIndex
        currentIndex = index
        render(previousIndex)
      })
      thumbs.appendChild(btn)
      return btn
    })

    window.setTimeout(() => ensureActiveThumbVisible(), 0)
  }

  const preloadNeighbors = () => {
    ;[-2, -1, 1, 2].forEach((offset) => {
      const item = items[currentIndex + offset]
      if (item) preloadImage(item.originalUrl)
    })
  }

  const zoomAtPoint = (nextScale: number, clientX: number, clientY: number) => {
    const frameRect = mediaFrame.getBoundingClientRect()
    const naturalWidth = imageEl.naturalWidth || frameRect.width || 1
    const naturalHeight = imageEl.naturalHeight || frameRect.height || 1
    const fitScale = Math.min(frameRect.width / naturalWidth, frameRect.height / naturalHeight, 1)
    const baseWidth = naturalWidth * fitScale
    const baseHeight = naturalHeight * fitScale
    const currentScale = zoomScale
    const frameX = clientX - frameRect.left - frameRect.width / 2
    const frameY = clientY - frameRect.top - frameRect.height / 2
    const imagePointX = (frameX - translateX) / currentScale
    const imagePointY = (frameY - translateY) / currentScale

    zoomScale = nextScale
    translateX = frameX - imagePointX * nextScale
    translateY = frameY - imagePointY * nextScale

    if (!Number.isFinite(translateX)) translateX = 0
    if (!Number.isFinite(translateY)) translateY = 0
    if (!baseWidth || !baseHeight || nextScale === 1) {
      translateX = 0
      translateY = 0
    }

    if (zoomScale === 1) {
      targetTranslateX = 0
      targetTranslateY = 0
      isDragging = false
      pointerId = null
    }

    applyZoom()
  }

  const snapBackToBounds = () => {
    if (settleAnimationFrame) window.cancelAnimationFrame(settleAnimationFrame)

    const { maxOffsetX, maxOffsetY } = getDragBounds()
    targetTranslateX = Math.max(-maxOffsetX, Math.min(maxOffsetX, targetTranslateX))
    targetTranslateY = Math.max(-maxOffsetY, Math.min(maxOffsetY, targetTranslateY))

    const tick = () => {
      const nextX = translateX + (targetTranslateX - translateX) * SETTLE_LERP
      const nextY = translateY + (targetTranslateY - translateY) * SETTLE_LERP
      const doneX = Math.abs(targetTranslateX - nextX) < 0.5
      const doneY = Math.abs(targetTranslateY - nextY) < 0.5
      translateX = doneX ? targetTranslateX : nextX
      translateY = doneY ? targetTranslateY : nextY
      imageEl.style.transform = `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${zoomScale})`
      updateZoomUi()
      if (doneX && doneY) {
        translateX = targetTranslateX
        translateY = targetTranslateY
        imageEl.style.transform = `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${zoomScale})`
        updateZoomUi()
        settleAnimationFrame = 0
        return
      }
      settleAnimationFrame = window.requestAnimationFrame(tick)
    }

    settleAnimationFrame = window.requestAnimationFrame(tick)
  }

  const resetZoom = () => {
    if (settleAnimationFrame) {
      window.cancelAnimationFrame(settleAnimationFrame)
      settleAnimationFrame = 0
    }
    if (dragAnimationFrame) {
      window.cancelAnimationFrame(dragAnimationFrame)
      dragAnimationFrame = 0
    }
    zoomScale = 1
    translateX = 0
    translateY = 0
    targetTranslateX = 0
    targetTranslateY = 0
    isDragging = false
    pointerId = null
    applyZoom()
  }

  const adjustZoom = (delta: number, clientX?: number, clientY?: number) => {
    const next = Math.max(1, Math.min(4, zoomScale + delta))
    if (next === zoomScale) return
    if (typeof clientX === 'number' && typeof clientY === 'number') {
      zoomAtPoint(next, clientX, clientY)
      return
    }
    zoomScale = next
    if (zoomScale === 1) {
      translateX = 0
      translateY = 0
      targetTranslateX = 0
      targetTranslateY = 0
      isDragging = false
      pointerId = null
    }
    applyZoom()
  }

  const render = (previousIndex = currentIndex) => {
    const current = items[currentIndex]
    if (!current) return
    const shortTitle = current.title.length > 26 ? `${current.title.slice(0, 26)}…` : current.title
    titleEl.textContent = `${shortTitle} · ${currentIndex + 1} / ${items.length}`
    titleEl.title = current.title
    imageEl.src = current.originalUrl
    imageEl.alt = current.title
    resetZoom()
    if (thumbButtons.length !== items.length) {
      syncThumbs()
    }
    else {
      updateActiveThumb(currentIndex, previousIndex)
    }
    preloadNeighbors()
  }

  const move = (step: number) => {
    if (items.length <= 1) return false
    const previousIndex = currentIndex
    currentIndex = (currentIndex + step + items.length) % items.length
    if (previousIndex === currentIndex) return false
    render(previousIndex)
    return true
  }

  const consumeWheelGesture = (deltaY: number) => {
    if (!deltaY || wheelGestureTriggered) return
    wheelGestureAccumulated += deltaY
    if (wheelGestureTimer) {
      window.clearTimeout(wheelGestureTimer)
    }
    wheelGestureTimer = window.setTimeout(() => {
      wheelGestureAccumulated = 0
      wheelGestureTriggered = false
      wheelGestureTimer = 0
    }, WHEEL_GESTURE_RESET_DELAY)

    if (Math.abs(wheelGestureAccumulated) < WHEEL_GESTURE_STEP) return

    const direction = wheelGestureAccumulated > 0 ? 1 : -1
    wheelGestureTriggered = true
    wheelGestureAccumulated = 0
    move(direction)
  }

  imageEl.addEventListener('load', () => {
    clampTranslate()
    applyZoom()
  })

  imageEl.addEventListener('dblclick', (event) => {
    event.preventDefault()
    event.stopPropagation()
    clickSuppressUntil = Date.now() + 260
    lastTapAt = 0
    zoomAtPoint(zoomScale > 1 ? 1 : 2, event.clientX, event.clientY)
  })

  imageEl.addEventListener('click', (event) => {
    event.stopPropagation()
    if (Date.now() < clickSuppressUntil) return
    if (zoomScale > 1) return
    window.setTimeout(() => {
      if (Date.now() < clickSuppressUntil) return
      close()
    }, 220)
  })

  const close = () => {
    overlay.classList.remove('active')
    imageEl.src = ''
    if (wheelGestureTimer) {
      window.clearTimeout(wheelGestureTimer)
      wheelGestureTimer = 0
    }
    wheelGestureAccumulated = 0
    wheelGestureTriggered = false
    resetZoom()
  }

  const getDeleteTarget = () => items[currentIndex]

  const deleteCurrent = async () => {
    const current = getDeleteTarget()
    if (!current?.fileId) return
    try {
      const response = await sendRuntimeMessageSafe<{ ok?: boolean, error?: string }>({
        type: 'DELETE_FILE',
        data: {
          fileId: current.fileId,
          parentId: current.parentId,
          pickCode: current.pickCode,
        },
      })
      if (isRuntimeContextInvalidatedResult(response)) throw new Error('扩展已更新，请刷新页面后继续使用')
      if (!response?.ok) throw new Error(response?.error || '删除失败')
      items = items.filter((item) => item.fileId !== current.fileId)
      current.sourceItem.remove()
      createToast(doc, '已删除')
      thumbButtons = []
      if (!items.length) {
        close()
        return
      }
      currentIndex = Math.min(currentIndex, items.length - 1)
      render()
    }
    catch (error) {
      const message = error instanceof Error ? error.message : '删除失败'
      createToast(doc, message)
    }
  }

  deleteBtn.addEventListener('click', async (event) => {
    event.preventDefault()
    event.stopPropagation()
    await deleteCurrent()
  })

  prevBtn.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    move(-1)
  })

  nextBtn.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    move(1)
  })

  closeBtn.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    close()
  })

  thumbsToggle.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    thumbsCollapsed = !thumbsCollapsed
    updateThumbsToggle()
  })

  zoomBadge.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (zoomScale > 1) resetZoom()
    else zoomAtPoint(2, window.innerWidth / 2, window.innerHeight / 2)
  })

  overlay.addEventListener('click', () => close())

  overlay.addEventListener('wheel', (event) => {
    if (!overlay.classList.contains('active')) return
    if (thumbs.contains(event.target as Node)) {
      event.preventDefault()
      thumbs.scrollLeft += event.deltaY || event.deltaX
      return
    }

    event.preventDefault()

    if (zoomScale > 1) {
      const delta = event.deltaY < 0 ? 0.18 : -0.18
      adjustZoom(delta, event.clientX, event.clientY)
      return
    }

    if (!event.deltaY) return
    consumeWheelGesture(event.deltaY)
  }, { passive: false })

  imageEl.addEventListener('pointerdown', (event) => {
    if (zoomScale <= 1) return
    pointerId = event.pointerId
    pointerDownX = event.clientX
    pointerDownY = event.clientY
    lastPointerX = event.clientX
    lastPointerY = event.clientY
    dragStartX = translateX
    dragStartY = translateY
    dragOriginX = translateX
    dragOriginY = translateY
    targetTranslateX = translateX
    targetTranslateY = translateY
    isDragging = false
    lastDragTime = performance.now()
    velocityX = 0
    velocityY = 0
    imageEl.setPointerCapture(event.pointerId)
    event.preventDefault()
    event.stopPropagation()
  })

  imageEl.addEventListener('pointermove', (event) => {
    if (pointerId !== event.pointerId) return
    const dx = event.clientX - pointerDownX
    const dy = event.clientY - pointerDownY
    if (!isDragging && Math.hypot(dx, dy) >= DRAG_THRESHOLD) {
      isDragging = true
      clickSuppressUntil = Date.now() + 220
      imageEl.classList.add('is-dragging')
      mediaFrame.classList.add('is-dragging')
    }
    if (!isDragging) return
    const now = performance.now()
    const deltaTime = Math.max(16, now - lastDragTime)
    const moveX = event.clientX - lastPointerX
    const moveY = event.clientY - lastPointerY
    velocityX = moveX / deltaTime
    velocityY = moveY / deltaTime
    lastPointerX = event.clientX
    lastPointerY = event.clientY
    lastDragTime = now
    targetTranslateX = dragOriginX + dx
    targetTranslateY = dragOriginY + dy
    scheduleDragFrame()
    event.preventDefault()
    event.stopPropagation()
  })

  const finishDrag = (event: PointerEvent) => {
    if (pointerId !== event.pointerId) return
    if (imageEl.hasPointerCapture(event.pointerId)) imageEl.releasePointerCapture(event.pointerId)
    pointerId = null
    imageEl.classList.remove('is-dragging')
    mediaFrame.classList.remove('is-dragging')
    if (!isDragging) return
    isDragging = false
    translateX = targetTranslateX + velocityX * INERTIA_FACTOR
    translateY = targetTranslateY + velocityY * INERTIA_FACTOR
    targetTranslateX = translateX
    targetTranslateY = translateY
    scheduleDragFrame()
    snapBackToBounds()
    clickSuppressUntil = Date.now() + 180
    event.preventDefault()
    event.stopPropagation()
  }

  imageEl.addEventListener('pointerup', finishDrag)
  imageEl.addEventListener('pointercancel', finishDrag)

  overlay.addEventListener('keydown', (event) => {
    if (!overlay.classList.contains('active')) return
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
      return
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      move(-1)
      return
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      move(1)
    }
  })

  updateThumbsToggle()

  return {
    open(nextItems, startIndex) {
      items = [...nextItems]
      thumbButtons = []
      wheelGestureAccumulated = 0
      wheelGestureTriggered = false
      if (wheelGestureTimer) {
        window.clearTimeout(wheelGestureTimer)
        wheelGestureTimer = 0
      }
      currentIndex = Math.max(0, Math.min(startIndex, items.length - 1))
      overlay.classList.add('active')
      render()
    },
  }
}

export function createImageModule(sendRuntimeMessageSafe: typeof import('./runtime').sendRuntimeMessageSafe) {
  const lightboxByDoc = new WeakMap<Document, LightboxController>()

  const getLightboxController = (doc: Document): LightboxController => {
    const existing = lightboxByDoc.get(doc)
    if (existing) return existing
    const created = createLightboxController(doc, sendRuntimeMessageSafe)
    lightboxByDoc.set(doc, created)
    return created
  }

  const renderImagesSection = (
    doc: Document,
    images: MediaWallImageItem[],
  ) => {
    const section = doc.createElement('section')
    section.className = 'm115-wall-section'

    const title = doc.createElement('div')
    title.className = 'm115-wall-title'
    title.textContent = '图片'
    section.appendChild(title)

    const grid = doc.createElement('div')
    grid.className = 'm115-image-grid'
    const lightbox = getLightboxController(doc)
    const stopSyncList: Array<() => void> = []

    const syncSelectionState = () => {
      images.forEach((image) => {
        const card = grid.querySelector<HTMLElement>(`.m115-image-card[data-image-id="${CSS.escape(image.id)}"]`)
        if (!card) return
        card.classList.toggle('is-selected', isWallSourceItemSelected(image.sourceItem))
      })
    }

    images.forEach((image, index) => {
      const button = doc.createElement('button')
      button.type = 'button'
      button.className = 'm115-image-card'
      button.title = image.title
      button.dataset.imageId = image.id

      const thumbWrap = doc.createElement('span')
      thumbWrap.className = 'm115-image-thumb-wrap'

      const thumb = doc.createElement('img')
      thumb.className = 'm115-image-thumb'
      thumb.src = image.thumbUrl
      thumb.alt = image.title
      thumb.loading = 'lazy'

      const name = doc.createElement('span')
      name.className = 'm115-image-name'
      name.textContent = image.title

      thumbWrap.appendChild(thumb)
      button.appendChild(thumbWrap)
      button.appendChild(name)
      const selection = doc.createElement('button')
      selection.type = 'button'
      selection.className = 'm115-folder-selection'
      selection.setAttribute('aria-label', '选择图片')
      selection.innerHTML = '<span class="m115-folder-selection-box"><svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M3.5 8.2L6.6 11.3L12.5 5.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>'
      selection.addEventListener('mousedown', (event) => {
        if (event.button !== 0) return
        event.preventDefault()
        event.stopPropagation()
        image.select(event)
        window.setTimeout(syncSelectionState, 0)
        window.setTimeout(syncSelectionState, 60)
      })
      selection.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        window.setTimeout(syncSelectionState, 0)
        window.setTimeout(syncSelectionState, 60)
      })
      button.appendChild(selection)
      button.addEventListener('click', (event) => {
        if (event.defaultPrevented) return
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
          image.select(event)
          window.setTimeout(syncSelectionState, 0)
          window.setTimeout(syncSelectionState, 60)
          return
        }
        lightbox.open(images, index)
      })
      button.addEventListener('contextmenu', (event) => {
        event.preventDefault()
        event.stopPropagation()
        image.contextMenu(event)
      })
      grid.appendChild(button)
      stopSyncList.push(startSelectionSync(image.sourceItem, syncSelectionState))
    })

    installWallDragSelection(
      doc,
      section,
      '.m115-image-card',
      element => images.find(image => element.dataset.imageId === image.id),
      syncSelectionState,
    )

    syncSelectionState()
    window.setTimeout(syncSelectionState, 0)
    window.setTimeout(syncSelectionState, 80)
    window.setTimeout(syncSelectionState, 180)

    section.addEventListener('DOMNodeRemoved', () => {
      stopSyncList.forEach(stopSync => stopSync())
    }, { once: true })

    section.appendChild(grid)
    return section
  }

  return {
    buildImageItem,
    renderImagesSection,
  }
}
