/**
 * 查看器主视口舞台组件 (Stage)
 * 单一职责：Flex 纯净自适应居中排版、平滑手势拖拽、双击放大/还原、左右悬浮导航
 */

import { Icons } from '../../../shared/icons'
import type { ViewerStore } from '../state/viewer-store'
import {
  computeDragBounds,
  clampToBounds,
  computeToggleZoom,
} from '../engine/gesture-engine'

export function mountStage(doc: Document, store: ViewerStore): HTMLElement {
  const stage = doc.createElement('div')
  stage.className = 'm115-viewer-stage'

  const prevBtn = doc.createElement('button')
  prevBtn.type = 'button'
  prevBtn.className = 'm115-viewer-nav m115-viewer-prev'
  prevBtn.innerHTML = Icons.ChevronLeft()
  prevBtn.title = '上一张'

  const nextBtn = doc.createElement('button')
  nextBtn.type = 'button'
  nextBtn.className = 'm115-viewer-nav m115-viewer-next'
  nextBtn.innerHTML = Icons.ChevronRight()
  nextBtn.title = '下一张'

  const frame = doc.createElement('div')
  frame.className = 'm115-viewer-frame'

  const imageEl = doc.createElement('img')
  imageEl.className = 'm115-viewer-image'

  const loadingEl = doc.createElement('div')
  loadingEl.className = 'm115-viewer-loading'
  loadingEl.textContent = '加载中…'

  frame.appendChild(imageEl)
  frame.appendChild(loadingEl)
  stage.appendChild(prevBtn)
  stage.appendChild(frame)
  stage.appendChild(nextBtn)

  // 左右切图事件
  prevBtn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    store.prev()
  })

  nextBtn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    store.next()
  })

  // 双击图片切换放大 / 还原
  imageEl.addEventListener('dblclick', (e) => {
    e.preventDefault()
    e.stopPropagation()
    const currentScale = store.get().zoomScale
    const nextScale = computeToggleZoom(currentScale)
    store.setZoom(nextScale)
  })

  imageEl.addEventListener('click', (e) => {
    e.stopPropagation()
  })

  // 放大状态下的平移拖拽
  let isPointerDown = false
  let pointerId = 0
  let startClientX = 0
  let startClientY = 0
  let startPanX = 0
  let startPanY = 0

  imageEl.addEventListener('pointerdown', (e) => {
    if (store.get().zoomScale <= 1.04) return
    isPointerDown = true
    pointerId = e.pointerId
    startClientX = e.clientX
    startClientY = e.clientY
    startPanX = store.get().panX
    startPanY = store.get().panY
    try {
      imageEl.setPointerCapture(pointerId)
    } catch {}
    store.setDragging(true)
    e.preventDefault()
  })

  imageEl.addEventListener('pointermove', (e) => {
    if (!isPointerDown) return
    const dx = e.clientX - startClientX
    const dy = e.clientY - startClientY

    const { maxOffsetX, maxOffsetY } = computeDragBounds(
      frame.clientWidth || window.innerWidth,
      frame.clientHeight || window.innerHeight,
      store.get().zoomScale,
    )

    const nextPanX = clampToBounds(startPanX + dx, -maxOffsetX, maxOffsetX)
    const nextPanY = clampToBounds(startPanY + dy, -maxOffsetY, maxOffsetY)
    store.setPan(nextPanX, nextPanY)
  })

  const endPointerDrag = (e: PointerEvent) => {
    if (!isPointerDown || e.pointerId !== pointerId) return
    isPointerDown = false
    try {
      imageEl.releasePointerCapture(pointerId)
    } catch {}
    store.setDragging(false)
  }

  imageEl.addEventListener('pointerup', endPointerDrag)
  imageEl.addEventListener('pointercancel', endPointerDrag)

  // 状态订阅驱动
  store.subscribe((state, prev) => {
    if (!state.isOpen) return

    // 1. 胶卷条折叠状态与视口高度避让
    stage.classList.toggle('thumbs-collapsed', state.isFilmstripCollapsed)

    // 2. 图片源切换
    if (state.currentIndex !== prev.currentIndex || state.items !== prev.items) {
      const current = state.items[state.currentIndex]
      if (current) {
        imageEl.src = current.originalUrl
        imageEl.alt = current.title
      }
    }

    // 3. 缩放与平移矩阵更新
    if (state.zoomScale !== prev.zoomScale || state.panX !== prev.panX || state.panY !== prev.panY) {
      if (state.zoomScale <= 1.04) {
        imageEl.style.transform = 'scale(1)'
      } else {
        imageEl.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoomScale})`
      }
      frame.classList.toggle('is-zoomed', state.zoomScale > 1.04)
    }

    // 4. 拖拽光标状态
    if (state.isDragging !== prev.isDragging) {
      frame.classList.toggle('is-dragging', state.isDragging)
      imageEl.classList.toggle('is-dragging', state.isDragging)
    }
  })

  // 窗口 resize 自动重置 1x 居中
  window.addEventListener('resize', () => {
    if (!store.get().isOpen) return
    if (store.get().zoomScale <= 1.04) {
      imageEl.style.transform = 'scale(1)'
    }
  })

  return stage
}
