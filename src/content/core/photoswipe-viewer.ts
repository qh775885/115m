/**
 * 115m 2.0 工业级大图查看器 (PhotoSwipe v5 驱动)
 * 具备中性炭黑晶体毛玻璃、两蓝角色、滚轮切图/缩放、缩略图胶卷条与 115 删除联动
 */

import PhotoSwipe from 'photoswipe'
import type { MediaWallImageItem, LightboxController } from './media-wall-types'
import { Icons } from '../../shared/icons'
import { showToast } from '../../shared/ui/toast'
import { isRuntimeContextInvalidatedResult } from './runtime'
import { NeighborPreloader } from './media-wall-preload'

function createToast(doc: Document, message: string) {
  showToast(doc, message, {
    className: 'm115-viewer-toast',
    duration: 1600,
  })
}

export function createPhotoSwipeController(
  doc: Document,
  sendRuntimeMessageSafe: typeof import('./runtime').sendRuntimeMessageSafe,
): LightboxController {
  // 外层包裹容器（同时赋予 .m115-viewer 与 .pswp 皮肤类名）
  const overlay = doc.createElement('div')
  overlay.className = 'm115-viewer'

  // 顶栏
  const toolbar = doc.createElement('div')
  toolbar.className = 'm115-viewer-toolbar'

  const toolbarMeta = doc.createElement('div')
  toolbarMeta.className = 'm115-viewer-meta'

  const titleEl = doc.createElement('div')
  titleEl.className = 'm115-viewer-title'

  const zoomHint = doc.createElement('div')
  zoomHint.className = 'm115-viewer-zoom-hint'

  const toolbarActions = doc.createElement('div')
  toolbarActions.className = 'm115-viewer-actions'

  const zoomBadge = doc.createElement('button')
  zoomBadge.type = 'button'
  zoomBadge.className = 'm115-viewer-zoom-badge'
  zoomBadge.textContent = '100%'

  const closeBtn = doc.createElement('button')
  closeBtn.type = 'button'
  closeBtn.className = 'm115-viewer-tool-btn is-icon'
  closeBtn.innerHTML = Icons.Close()
  closeBtn.title = '关闭'
  closeBtn.setAttribute('aria-label', '关闭')

  toolbarMeta.appendChild(titleEl)
  toolbarMeta.appendChild(zoomHint)
  toolbarActions.appendChild(zoomBadge)
  toolbarActions.appendChild(closeBtn)
  toolbar.appendChild(toolbarMeta)
  toolbar.appendChild(toolbarActions)

  // 主舞台及导航
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

  const mediaFrame = doc.createElement('div')
  mediaFrame.className = 'm115-viewer-frame'

  const imageEl = doc.createElement('img')
  imageEl.className = 'm115-viewer-image'

  const loadingEl = doc.createElement('div')
  loadingEl.className = 'm115-viewer-loading'
  loadingEl.textContent = '加载中…'

  // 右下角黑曜石晶体微胶囊删除键 (效仿播放器三联删除设计语言：平时完全隐匿，悬停时浮现)
  const deleteBtn = doc.createElement('button')
  deleteBtn.type = 'button'
  deleteBtn.className = 'm115-viewer-frame-delete m115-v2-delete-capsule delete'
  deleteBtn.title = '删除当前图片'
  deleteBtn.setAttribute('aria-label', '删除当前图片')
  deleteBtn.innerHTML = `${Icons.Trash()} <span>删除</span>`

  mediaFrame.appendChild(imageEl)
  mediaFrame.appendChild(loadingEl)
  stage.appendChild(prevBtn)
  stage.appendChild(mediaFrame)
  stage.appendChild(nextBtn)
  stage.appendChild(deleteBtn)

  // 底部缩略图胶卷条
  const thumbsWrap = doc.createElement('div')
  thumbsWrap.className = 'm115-viewer-thumbs-wrap'

  const thumbsToggle = doc.createElement('button')
  thumbsToggle.type = 'button'
  thumbsToggle.className = 'm115-viewer-thumbs-toggle open'
  thumbsToggle.title = '展开/收起缩略图'
  thumbsToggle.setAttribute('aria-label', '展开/收起缩略图')
  thumbsToggle.innerHTML = '<span class="m115-v2-handle-filament"></span>'

  const thumbs = doc.createElement('div')
  thumbs.className = 'm115-viewer-thumbs'

  thumbsWrap.appendChild(thumbsToggle)
  thumbsWrap.appendChild(thumbs)

  overlay.appendChild(toolbar)
  overlay.appendChild(stage)
  overlay.appendChild(thumbsWrap)
  doc.body.appendChild(overlay)

  // 状态变量
  let items: MediaWallImageItem[] = []
  let currentIndex = 0
  let zoomScale = 1
  let thumbsCollapsed = false
  let thumbButtons: HTMLButtonElement[] = []
  let pswpInstance: PhotoSwipe | null = null
  let lastWheelTime = 0

  const preloader = new NeighborPreloader((url, release) => {
    if (!url) {
      release()
      return
    }
    const img = new Image()
    img.onload = img.onerror = () => release()
    img.src = url
  })

  const updateThumbsToggle = () => {
    thumbsToggle.title = thumbsCollapsed ? '展开缩略图' : '收起缩略图'
    thumbsToggle.setAttribute('aria-label', thumbsToggle.title)
    thumbsToggle.classList.toggle('open', !thumbsCollapsed)
    thumbsWrap.classList.toggle('is-collapsed', thumbsCollapsed)
    stage.classList.toggle('thumbs-collapsed', thumbsCollapsed)
    deleteBtn.classList.toggle('thumbs-collapsed', thumbsCollapsed)

    if (pswpInstance) {
      pswpInstance.options.padding = {
        top: 52,
        bottom: thumbsCollapsed ? 14 : 84,
        left: 20,
        right: 20,
      }
      pswpInstance.updateSize(true)
    }
  }

  const ensureActiveThumbVisible = () => {
    const activeThumb = thumbs.querySelector<HTMLElement>('.m115-viewer-thumb.is-active')
    activeThumb?.scrollIntoView?.({ behavior: 'smooth', inline: 'center', block: 'nearest' })
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
      btn.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        if (currentIndex === index) return
        goTo(index)
      })
      thumbs.appendChild(btn)
      return btn
    })
    window.setTimeout(() => ensureActiveThumbVisible(), 0)
  }

  const updateZoomUi = (scale: number) => {
    zoomScale = scale
    const percent = Math.round(scale * 100)
    zoomBadge.textContent = `${percent}%`
    zoomBadge.classList.toggle('is-active', scale > 1)
    zoomHint.textContent = scale > 1 ? '可拖动' : ''
    zoomHint.classList.toggle('is-active', scale > 1)
    mediaFrame.classList.toggle('is-zoomed', scale > 1)
  }

  const render = (previousIndex = currentIndex) => {
    const current = items[currentIndex]
    if (!current) return
    const shortTitle = current.title.length > 26 ? `${current.title.slice(0, 26)}…` : current.title
    titleEl.textContent = `${shortTitle} · ${currentIndex + 1} / ${items.length}`
    titleEl.title = current.title

    imageEl.src = current.originalUrl
    imageEl.alt = current.title
    updateZoomUi(1)
    imageEl.style.transform = `translate(-50%, -50%) scale(1)`
    accumulatedWheel = 0

    preloader.schedule(currentIndex, index => items[index]?.originalUrl ?? null)

    if (thumbButtons.length !== items.length) {
      syncThumbs()
    } else {
      updateActiveThumb(currentIndex, previousIndex)
    }
  }

  const goTo = (index: number) => {
    if (!items.length) return
    const prev = currentIndex
    currentIndex = (index + items.length) % items.length
    if (pswpInstance && pswpInstance.currIndex !== currentIndex) {
      pswpInstance.goTo(currentIndex)
    }
    render(prev)
  }

  const move = (step: number) => {
    if (items.length <= 1) return false
    goTo(currentIndex + step)
    return true
  }

  const close = () => {
    overlay.classList.remove('active')
    imageEl.src = ''
    if (pswpInstance) {
      pswpInstance.destroy()
      pswpInstance = null
    }
    updateZoomUi(1)
  }

  const deleteCurrent = async () => {
    const current = items[currentIndex]
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

      items = items.filter(it => it.fileId !== current.fileId)
      current.sourceItem.remove()
      createToast(doc, '已删除')
      thumbButtons = []

      if (!items.length) {
        close()
        return
      }
      currentIndex = Math.min(currentIndex, items.length - 1)
      render()
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除失败'
      createToast(doc, message)
    }
  }

  // 事件绑定
  deleteBtn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    deleteCurrent()
  })

  prevBtn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    move(-1)
  })

  nextBtn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    move(1)
  })

  closeBtn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    close()
  })

  thumbsToggle.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    thumbsCollapsed = !thumbsCollapsed
    updateThumbsToggle()
  })

  const getRelativeZoom = (): number => {
    if (pswpInstance?.currSlide) {
      const slide = pswpInstance.currSlide
      const initial = slide.zoomLevels?.initial || 1
      const current = slide.currZoomLevel || initial
      return current / initial
    }
    return zoomScale
  }

  const toggleZoomAt = (point?: { x: number, y: number }) => {
    const pt = point || { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    if (pswpInstance?.currSlide) {
      const slide = pswpInstance.currSlide
      if (typeof slide.toggleZoom === 'function') {
        slide.toggleZoom(pt)
      } else {
        const rel = getRelativeZoom()
        const initial = slide.zoomLevels?.initial || 1
        const secondary = slide.zoomLevels?.secondary || initial * 2
        const target = rel > 1.05 ? initial : secondary
        slide.zoomTo(target, pt, 200)
      }
      const rel = getRelativeZoom()
      updateZoomUi(rel)
    } else {
      const nextZoom = zoomScale > 1.05 ? 1 : 2
      updateZoomUi(nextZoom)
      imageEl.style.transform = `translate(-50%, -50%) scale(${nextZoom})`
    }
  }

  const zoomToRelative = (level: number, point?: { x: number, y: number }) => {
    const next = Math.max(1, Math.min(5, level))
    const finalZoom = Math.abs(next - 1) < 0.05 ? 1 : next
    updateZoomUi(finalZoom)
    if (pswpInstance?.currSlide) {
      const slide = pswpInstance.currSlide
      const initial = slide.zoomLevels?.initial || 1
      slide.zoomTo(finalZoom * initial, point || { x: window.innerWidth / 2, y: window.innerHeight / 2 }, 150)
    } else {
      imageEl.style.transform = `translate(-50%, -50%) scale(${finalZoom})`
    }
  }

  zoomBadge.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleZoomAt({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  })

  imageEl.addEventListener('click', (e) => {
    e.stopPropagation()
  })

  imageEl.addEventListener('dblclick', (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleZoomAt({ x: e.clientX, y: e.clientY })
  })

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target === stage || e.target === mediaFrame) {
      close()
    }
  })

  // 滚轮智能自适应手势：放大状态下为平滑缩放，恢复 1x 后自动转为切图
  let accumulatedWheel = 0

  overlay.addEventListener('wheel', (e) => {
    if (!overlay.classList.contains('active')) return
    if (thumbs.contains(e.target as Node)) {
      e.preventDefault()
      thumbs.scrollLeft += e.deltaY || e.deltaX
      return
    }
    e.preventDefault()

    const currentRelZoom = getRelativeZoom()

    // 1. 放大状态下（> 1.05）：滚轮由切图转为以光标为中心的平滑缩放
    if (currentRelZoom > 1.05) {
      accumulatedWheel = 0
      const factor = e.deltaY < 0 ? 1.15 : 0.87
      const nextRelZoom = currentRelZoom * factor
      zoomToRelative(nextRelZoom, { x: e.clientX, y: e.clientY })
      return
    }

    // 2. 正常自适应状态（1x）：滚轮滑动切换上一张 / 下一张
    accumulatedWheel += e.deltaY
    const threshold = 60
    if (Math.abs(accumulatedWheel) >= threshold) {
      const dir = accumulatedWheel > 0 ? 1 : -1
      accumulatedWheel = 0
      move(dir)
    }
  }, { passive: false })

  const isTyping = (target: EventTarget | null) => {
    const el = target as HTMLElement | null
    if (!el) return false
    return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
  }

  doc.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('active')) return
    if (isTyping(e.target)) return
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      move(-1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      move(1)
    }
  })

  return {
    open(nextItems, startIndex) {
      items = [...nextItems]
      currentIndex = Math.max(0, Math.min(startIndex, items.length - 1))
      thumbButtons = []
      updateZoomUi(1)
      overlay.classList.add('active')
      render()

      // 如果当前不是受限的无窗口 JSDOM 测试环境，初始化 PhotoSwipe 工业级手势核心
      if (typeof window !== 'undefined' && window.matchMedia && typeof window.requestAnimationFrame === 'function') {
        try {
          const pswp = new PhotoSwipe({
            dataSource: items.map(it => ({
              src: it.originalUrl,
              msrc: it.thumbUrl,
              width: 0,
              height: 0,
              alt: it.title,
            })),
            index: currentIndex,
            padding: {
              top: 52,
              bottom: thumbsCollapsed ? 14 : 84,
              left: 20,
              right: 20,
            },
            showHideAnimationType: 'fade',
            wheelToZoom: true,
            arrowPrev: false,
            arrowNext: false,
            close: false,
            zoom: false,
            counter: false,
          })

          pswp.on('change', () => {
            if (currentIndex !== pswp.currIndex) {
              const prev = currentIndex
              currentIndex = pswp.currIndex
              render(prev)
            }
          })

          pswp.on('zoomPanUpdate', () => {
            const rel = getRelativeZoom()
            zoomScale = rel
            updateZoomUi(rel)
          })

          pswp.on('close', () => {
            close()
          })

          pswpInstance = pswp
        } catch {
          // 降级使用内置轻量驱动
        }
      }
    },
  }
}
