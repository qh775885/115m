/**
 * 查看器底部缩略图胶卷条组件 (Filmstrip)
 * 单一职责：纤薄微光感应手柄、缩略图水平轴、平滑居中联动
 */

import type { ViewerStore } from '../state/viewer-store'

export function mountFilmstrip(doc: Document, store: ViewerStore): HTMLElement {
  const wrap = doc.createElement('div')
  wrap.className = 'm115-viewer-thumbs-wrap'

  const toggleBtn = doc.createElement('button')
  toggleBtn.type = 'button'
  toggleBtn.className = 'm115-viewer-thumbs-toggle open'
  toggleBtn.title = '展开/收起缩略图'
  toggleBtn.setAttribute('aria-label', '展开/收起缩略图')
  toggleBtn.innerHTML = '<span class="m115-v2-handle-filament"></span>'

  const thumbs = doc.createElement('div')
  thumbs.className = 'm115-viewer-thumbs'

  wrap.appendChild(toggleBtn)
  wrap.appendChild(thumbs)

  let thumbButtons: HTMLButtonElement[] = []

  toggleBtn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    store.toggleFilmstrip()
  })

  // 缩略图区域滚轮横向滑动
  thumbs.addEventListener('wheel', (e) => {
    e.preventDefault()
    e.stopPropagation()
    thumbs.scrollLeft += e.deltaY || e.deltaX
  }, { passive: false })

  const ensureActiveThumbVisible = (smooth = true) => {
    if (store.get().isFilmstripCollapsed) return
    const active = thumbs.querySelector<HTMLElement>('.m115-viewer-thumb.is-active')
    if (!active) return

    const targetLeft = active.offsetLeft - (thumbs.clientWidth - active.offsetWidth) / 2
    if (smooth && typeof thumbs.scrollTo === 'function') {
      thumbs.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: 'smooth',
      })
    } else {
      thumbs.scrollLeft = Math.max(0, targetLeft)
    }
  }

  const renderThumbs = () => {
    thumbs.innerHTML = ''
    const state = store.get()
    thumbButtons = state.items.map((item, index) => {
      const btn = doc.createElement('button')
      btn.type = 'button'
      btn.className = `m115-viewer-thumb ${index === state.currentIndex ? 'is-active' : ''}`
      btn.title = item.title

      const img = doc.createElement('img')
      img.src = item.thumbUrl
      img.alt = item.title
      img.loading = 'lazy'

      btn.appendChild(img)
      btn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        store.goTo(index)
      })
      thumbs.appendChild(btn)
      return btn
    })
    window.setTimeout(() => ensureActiveThumbVisible(false), 0)
  }

  const updateActiveIndex = (nextIndex: number, prevIndex: number) => {
    if (prevIndex !== nextIndex) {
      thumbButtons[prevIndex]?.classList.remove('is-active')
    }
    thumbButtons[nextIndex]?.classList.add('is-active')
    window.setTimeout(() => ensureActiveThumbVisible(true), 0)
  }

  store.subscribe((state, prev) => {
    if (!state.isOpen) return

    // 1. 折叠状态
    if (state.isFilmstripCollapsed !== prev.isFilmstripCollapsed) {
      wrap.classList.toggle('is-collapsed', state.isFilmstripCollapsed)
      toggleBtn.classList.toggle('open', !state.isFilmstripCollapsed)
      toggleBtn.title = state.isFilmstripCollapsed ? '展开缩略图' : '收起缩略图'
      toggleBtn.setAttribute('aria-label', toggleBtn.title)
      if (!state.isFilmstripCollapsed) {
        window.setTimeout(() => ensureActiveThumbVisible(false), 0)
      }
    }

    // 2. 项目列表变更
    if (state.items !== prev.items || thumbButtons.length !== state.items.length) {
      renderThumbs()
    } else if (state.currentIndex !== prev.currentIndex) {
      updateActiveIndex(state.currentIndex, prev.currentIndex)
    }
  })

  return wrap
}
