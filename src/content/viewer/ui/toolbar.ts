/**
 * 查看器顶栏组件 (Toolbar)
 * 单一职责：文件名与序号排版、缩放微徽章、独立关闭按钮
 */

import { Icons } from '../../../shared/icons'
import type { ViewerStore } from '../state/viewer-store'

export function mountToolbar(doc: Document, store: ViewerStore): HTMLElement {
  const toolbar = doc.createElement('div')
  toolbar.className = 'm115-viewer-toolbar'

  const meta = doc.createElement('div')
  meta.className = 'm115-viewer-meta'

  const titleEl = doc.createElement('div')
  titleEl.className = 'm115-viewer-title'

  const zoomHint = doc.createElement('div')
  zoomHint.className = 'm115-viewer-zoom-hint'
  zoomHint.textContent = '可拖动'

  meta.appendChild(titleEl)
  meta.appendChild(zoomHint)

  const actions = doc.createElement('div')
  actions.className = 'm115-viewer-actions'

  const closeBtn = doc.createElement('button')
  closeBtn.type = 'button'
  closeBtn.className = 'm115-viewer-close-btn m115-viewer-tool-btn'
  closeBtn.innerHTML = Icons.Close()
  closeBtn.title = '关闭 (Esc)'
  closeBtn.setAttribute('aria-label', '关闭')

  actions.appendChild(closeBtn)

  toolbar.appendChild(meta)
  toolbar.appendChild(actions)

  closeBtn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    store.close()
  })

  // 状态订阅驱动更新
  store.subscribe((state, prev) => {
    if (!state.isOpen) return

    // 1. 标题与序号
    if (state.currentIndex !== prev.currentIndex || state.items !== prev.items) {
      const current = state.items[state.currentIndex]
      if (current) {
        const short = current.title.length > 28 ? `${current.title.slice(0, 28)}…` : current.title
        titleEl.textContent = `${short} · ${state.currentIndex + 1} / ${state.items.length}`
        titleEl.title = current.title
      }
    }

    // 2. 放大时显示提示
    if (state.zoomScale !== prev.zoomScale) {
      zoomHint.classList.toggle('is-active', state.zoomScale > 1.04)
    }
  })

  return toolbar
}
