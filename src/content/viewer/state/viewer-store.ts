/**
 * 115m 2.0 大图查看器状态层 (Single Source of Truth)
 * 采用轻量响应式发布订阅模型，驱动上层纯视图与物理引擎解耦
 */

import type { MediaWallImageItem } from '../../core/media-wall-types'

export type ViewerItem = MediaWallImageItem

export interface ViewerState {
  isOpen: boolean
  items: ViewerItem[]
  currentIndex: number
  zoomScale: number // 1.0 为视口基准比例，>1.0 为放大
  panX: number
  panY: number
  isDragging: boolean
  isFilmstripCollapsed: boolean
}

export type ViewerListener = (state: ViewerState, prevState: ViewerState) => void

export function createViewerStore(initial?: Partial<ViewerState>) {
  let state: ViewerState = {
    isOpen: false,
    items: [],
    currentIndex: 0,
    zoomScale: 1,
    panX: 0,
    panY: 0,
    isDragging: false,
    isFilmstripCollapsed: false,
    ...initial,
  }

  const listeners = new Set<ViewerListener>()

  const get = () => state

  const set = (patch: Partial<ViewerState>) => {
    const prev = state
    state = { ...state, ...patch }
    listeners.forEach(fn => fn(state, prev))
  }

  const subscribe = (listener: ViewerListener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  // 快捷高阶 Action
  const open = (items: ViewerItem[], startIndex = 0) => {
    const validIndex = Math.max(0, Math.min(startIndex, items.length - 1))
    set({
      isOpen: true,
      items: [...items],
      currentIndex: validIndex,
      zoomScale: 1,
      panX: 0,
      panY: 0,
      isDragging: false,
    })
  }

  const close = () => {
    set({
      isOpen: false,
      zoomScale: 1,
      panX: 0,
      panY: 0,
      isDragging: false,
    })
  }

  const goTo = (index: number) => {
    if (!state.items.length) return
    const total = state.items.length
    const nextIndex = (index + total) % total
    set({
      currentIndex: nextIndex,
      zoomScale: 1,
      panX: 0,
      panY: 0,
      isDragging: false,
    })
  }

  const next = () => {
    if (state.items.length <= 1) return
    goTo(state.currentIndex + 1)
  }

  const prev = () => {
    if (state.items.length <= 1) return
    goTo(state.currentIndex - 1)
  }

  const setZoom = (scale: number, panX = 0, panY = 0) => {
    const clamped = Math.max(1, Math.min(5, scale))
    const isOne = Math.abs(clamped - 1) < 0.04
    set({
      zoomScale: isOne ? 1 : clamped,
      panX: isOne ? 0 : panX,
      panY: isOne ? 0 : panY,
    })
  }

  const setPan = (panX: number, panY: number) => {
    set({ panX, panY })
  }

  const setDragging = (isDragging: boolean) => {
    set({ isDragging })
  }

  const toggleFilmstrip = () => {
    set({ isFilmstripCollapsed: !state.isFilmstripCollapsed })
  }

  const removeItem = (fileId: string): boolean => {
    const remaining = state.items.filter(it => it.fileId !== fileId)
    if (remaining.length === 0) {
      close()
      set({ items: [] })
      return true
    }
    const nextIndex = Math.min(state.currentIndex, remaining.length - 1)
    set({
      items: remaining,
      currentIndex: nextIndex,
      zoomScale: 1,
      panX: 0,
      panY: 0,
    })
    return false
  }

  const getCurrentItem = (): ViewerItem | undefined => {
    return state.items[state.currentIndex]
  }

  return {
    get,
    set,
    subscribe,
    open,
    close,
    goTo,
    next,
    prev,
    setZoom,
    setPan,
    setDragging,
    toggleFilmstrip,
    removeItem,
    getCurrentItem,
    destroy() {
      listeners.clear()
    },
  }
}

export type ViewerStore = ReturnType<typeof createViewerStore>
