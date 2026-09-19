/**
 * 115m 2.0 大图查看器装配中枢 (Image Viewer Orchestrator)
 * 采用现代解耦架构：单一数据源 Store + 纯手势引擎 + 组件化 UI
 */

import { createViewerStore, type ViewerItem } from './state/viewer-store'
import { mountToolbar } from './ui/toolbar'
import { mountStage } from './ui/stage'
import { mountFilmstrip } from './ui/filmstrip'
import { mountDeleteAction } from './ui/delete-action'
import { NeighborPreloader } from '../core/media-wall-preload'
import type { LightboxController } from '../core/media-wall-types'
import { processWheelGesture } from './engine/gesture-engine'

export function resolveViewerRootDoc(doc: Document): Document {
  try {
    const topDoc = doc.defaultView?.top?.document
    if (topDoc && topDoc.body) {
      return topDoc
    }
  } catch {
    // 跨域或安全限制时回退使用当前文档
  }
  return doc
}

function preloadImage(url: string, release: () => void) {
  if (!url) {
    release()
    return
  }
  const img = new Image()
  img.onload = img.onerror = () => release()
  img.src = url
}

function suppressWatermarks(doc: Document) {
  try {
    const marks = doc.querySelectorAll<HTMLElement>('div[class^="fp-"]')
    marks.forEach((el) => {
      el.style.setProperty('display', 'none', 'important')
    })
  } catch {
    // 忽略异常
  }
}

export function createImageViewer(
  hostDoc: Document,
  sendRuntimeMessageSafe: typeof import('../core/runtime').sendRuntimeMessageSafe,
): LightboxController {
  const rootDoc = resolveViewerRootDoc(hostDoc)
  const store = createViewerStore()

  // 1. 全屏沉浸遮罩根节点
  const overlay = rootDoc.createElement('div')
  overlay.className = 'm115-viewer'

  // 2. 挂载子组件
  const toolbar = mountToolbar(rootDoc, store)
  const stage = mountStage(rootDoc, store)
  const filmstrip = mountFilmstrip(rootDoc, store)
  const deleteAction = mountDeleteAction(rootDoc, store, sendRuntimeMessageSafe)

  overlay.appendChild(toolbar)
  overlay.appendChild(stage)
  overlay.appendChild(filmstrip)
  overlay.appendChild(deleteAction)
  rootDoc.body.appendChild(overlay)

  // 3. 预加载器
  const preloader = new NeighborPreloader((url, release) => preloadImage(url, release))

  // 4. 点击遮罩背景空白处关闭，并锁定遮罩防止垂直微滚
  overlay.addEventListener('scroll', () => {
    if (overlay.scrollTop !== 0) overlay.scrollTop = 0
  })

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target === stage || (e.target as HTMLElement).classList.contains('m115-viewer-frame')) {
      store.close()
    }
  })

  // 滚轮自适应手势 (切图 / 缩放)
  let accumulatedDelta = 0
  overlay.addEventListener('wheel', (e) => {
    if (!store.get().isOpen) return
    if (filmstrip.contains(e.target as Node)) return
    e.preventDefault()
    const { decision, nextAccumulated } = processWheelGesture(
      e.deltaY,
      store.get().zoomScale,
      accumulatedDelta,
    )
    accumulatedDelta = nextAccumulated

    if (decision.type === 'navigate') {
      if (decision.direction === 1) store.next()
      else if (decision.direction === -1) store.prev()
    } else if (decision.type === 'zoom' && decision.nextScale !== undefined) {
      store.setZoom(decision.nextScale, store.get().panX, store.get().panY)
    }
  }, { passive: false })

  // 5. 键盘全局监听
  const isTyping = (target: EventTarget | null) => {
    const el = target as HTMLElement | null
    if (!el) return false
    return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
  }

  const handleKeydown = (e: KeyboardEvent) => {
    if (!store.get().isOpen) return
    if (isTyping(e.target)) return
    if (e.key === 'Escape') {
      e.preventDefault()
      store.close()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      store.prev()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      store.next()
    }
  }

  rootDoc.addEventListener('keydown', handleKeydown)

  // 6. 状态中心响应
  store.subscribe((state, prev) => {
    // 打开/关闭状态切换
    if (state.isOpen !== prev.isOpen) {
      overlay.classList.toggle('active', state.isOpen)
      rootDoc.documentElement.classList.toggle('m115-viewer-locked', state.isOpen)
      if (state.isOpen) {
        overlay.scrollTop = 0
        suppressWatermarks(rootDoc)
      }
    }

    // 邻居图片预加载
    if (state.isOpen && (state.currentIndex !== prev.currentIndex || state.items !== prev.items)) {
      preloader.schedule(state.currentIndex, idx => state.items[idx]?.originalUrl ?? null)
    }
  })

  return {
    open(items: ViewerItem[], startIndex: number) {
      store.open(items, startIndex)
    },
  }
}
