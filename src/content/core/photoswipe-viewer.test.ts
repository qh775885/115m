// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPhotoSwipeController } from './photoswipe-viewer'
import type { MediaWallImageItem } from './media-wall-types'

function makeImages(count: number): MediaWallImageItem[] {
  return Array.from({ length: count }, (_, index) => {
    const sourceItem = document.createElement('li')
    sourceItem.setAttribute('file_id', String(index))
    sourceItem.setAttribute('file_type', '1')
    return {
      id: String(index),
      title: `测试图片 ${index + 1}.jpg`,
      thumbUrl: `https://cdn.example.com/img/${index}_200.jpg`,
      originalUrl: `https://cdn.example.com/img/${index}_0.jpg`,
      fileId: String(index),
      parentId: '0',
      pickCode: `pick-${index}`,
      sourceItem,
      open: () => {},
      select: () => {},
      contextMenu: () => {},
    }
  })
}

beforeEach(() => {
  document.body.innerHTML = ''
  if (!HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = vi.fn()
  }
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }))
  }
})

describe('PhotoSwipe 看图器核心控制器', () => {
  it('正确装配 DOM 结构与标题元数据', () => {
    const sendSafe = vi.fn() as any
    const controller = createPhotoSwipeController(document, sendSafe)
    const images = makeImages(3)
    controller.open(images, 0)

    const overlay = document.querySelector<HTMLElement>('.m115-viewer')
    expect(overlay).not.toBeNull()
    expect(overlay?.classList.contains('active')).toBe(true)

    const titleEl = document.querySelector<HTMLElement>('.m115-viewer-title')
    expect(titleEl?.textContent).toContain('测试图片 1.jpg')
    expect(titleEl?.textContent).toContain('1 / 3')
  })

  it('支持上一张/下一张导航及循环', () => {
    const sendSafe = vi.fn() as any
    const controller = createPhotoSwipeController(document, sendSafe)
    const images = makeImages(3)
    controller.open(images, 0)

    const nextBtn = document.querySelector<HTMLElement>('.m115-viewer-next')
    nextBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

    const titleEl = document.querySelector<HTMLElement>('.m115-viewer-title')
    expect(titleEl?.textContent).toContain('测试图片 2.jpg')

    // 上一张
    const prevBtn = document.querySelector<HTMLElement>('.m115-viewer-prev')
    prevBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    expect(titleEl?.textContent).toContain('测试图片 1.jpg')
  })

  it('支持双击切换放大', () => {
    const sendSafe = vi.fn() as any
    const controller = createPhotoSwipeController(document, sendSafe)
    const images = makeImages(2)
    controller.open(images, 0)

    const imageEl = document.querySelector<HTMLElement>('.m115-viewer-image')
    imageEl?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }))

    const zoomBadge = document.querySelector<HTMLElement>('.m115-viewer-zoom-badge')
    expect(zoomBadge?.textContent).toBe('200%')

    imageEl?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }))
    expect(zoomBadge?.textContent).toBe('100%')
  })

  it('联动删除成功后移除 DOM 并切下一张', async () => {
    const sendSafe = vi.fn().mockResolvedValue({ ok: true }) as any
    const controller = createPhotoSwipeController(document, sendSafe)
    const images = makeImages(2)
    document.body.appendChild(images[0].sourceItem)
    document.body.appendChild(images[1].sourceItem)

    controller.open(images, 0)

    const deleteBtn = document.querySelector<HTMLElement>('.m115-viewer-frame-delete')
    deleteBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(sendSafe).toHaveBeenCalledWith({
      type: 'DELETE_FILE',
      data: {
        fileId: '0',
        parentId: '0',
        pickCode: 'pick-0',
      },
    })
    expect(document.body.contains(images[0].sourceItem)).toBe(false)
    const titleEl = document.querySelector<HTMLElement>('.m115-viewer-title')
    expect(titleEl?.textContent).toContain('测试图片 2.jpg')
  })
})
