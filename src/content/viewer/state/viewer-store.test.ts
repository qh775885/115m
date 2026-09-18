import { describe, expect, it, vi } from 'vitest'
import { createViewerStore } from './viewer-store'

const mockItems = [
  { id: '1', title: 'A.jpg', thumbUrl: '1_t.jpg', originalUrl: '1.jpg', fileId: '1', parentId: '0', pickCode: 'p1', sourceItem: null as any, open: () => {}, select: () => {}, contextMenu: () => {} },
  { id: '2', title: 'B.jpg', thumbUrl: '2_t.jpg', originalUrl: '2.jpg', fileId: '2', parentId: '0', pickCode: 'p2', sourceItem: null as any, open: () => {}, select: () => {}, contextMenu: () => {} },
  { id: '3', title: 'C.jpg', thumbUrl: '3_t.jpg', originalUrl: '3.jpg', fileId: '3', parentId: '0', pickCode: 'p3', sourceItem: null as any, open: () => {}, select: () => {}, contextMenu: () => {} },
]

describe('ViewerStore', () => {
  it('初始化与 open/close 状态流转', () => {
    const store = createViewerStore()
    expect(store.get().isOpen).toBe(false)

    store.open(mockItems, 1)
    expect(store.get().isOpen).toBe(true)
    expect(store.get().currentIndex).toBe(1)
    expect(store.get().items.length).toBe(3)

    store.close()
    expect(store.get().isOpen).toBe(false)
  })

  it('循环切换 next/prev 与切集重置缩放', () => {
    const store = createViewerStore()
    store.open(mockItems, 2)

    store.setZoom(2.5, 50, 50)
    expect(store.get().zoomScale).toBe(2.5)

    store.next() // 循环回到第 0 项
    expect(store.get().currentIndex).toBe(0)
    expect(store.get().zoomScale).toBe(1) // 切集重置为 1x
    expect(store.get().panX).toBe(0)

    store.prev() // 循环切回最后一项
    expect(store.get().currentIndex).toBe(2)
  })

  it('移除项目 removeItem 逻辑', () => {
    const store = createViewerStore()
    store.open(mockItems, 1)

    const isAllRemoved = store.removeItem('2')
    expect(isAllRemoved).toBe(false)
    expect(store.get().items.length).toBe(2)
    expect(store.get().currentIndex).toBe(1) // 自动调整到剩余的最后一项

    store.removeItem('1')
    const finalEmpty = store.removeItem('3')
    expect(finalEmpty).toBe(true)
    expect(store.get().isOpen).toBe(false)
  })

  it('订阅发布机制通知监听者', () => {
    const store = createViewerStore()
    const spy = vi.fn()
    const unsub = store.subscribe(spy)

    store.open(mockItems, 0)
    expect(spy).toHaveBeenCalledTimes(1)

    unsub()
    store.next()
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
