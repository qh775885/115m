// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createImageViewer } from './index'
import type { ViewerItem } from './state/viewer-store'

function makeImages(count: number): ViewerItem[] {
  return Array.from({ length: count }, (_, index) => {
    const sourceItem = document.createElement('li')
    sourceItem.setAttribute('file_id', String(index))
    return {
      id: String(index),
      title: `图 ${index + 1}.jpg`,
      thumbUrl: `https://example.com/thumb_${index}.jpg`,
      originalUrl: `https://example.com/orig_${index}.jpg`,
      fileId: String(index),
      parentId: '0',
      pickCode: `p_${index}`,
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
})

describe('ImageViewer Orchestrator', () => {
  it('创建并完整装配 DOM 结构与初次显示', () => {
    const sendSafe = vi.fn() as any
    const viewer = createImageViewer(document, sendSafe)
    const images = makeImages(3)

    viewer.open(images, 0)

    const overlay = document.querySelector<HTMLElement>('.m115-viewer')
    expect(overlay).not.toBeNull()
    expect(overlay?.classList.contains('active')).toBe(true)

    const titleEl = document.querySelector<HTMLElement>('.m115-viewer-title')
    expect(titleEl?.textContent).toContain('图 1.jpg · 1 / 3')

    const imageEl = document.querySelector<HTMLImageElement>('.m115-viewer-image')
    expect(imageEl?.src).toContain('orig_0.jpg')
  })

  it('键盘左右键切图与 Esc 退出', () => {
    const sendSafe = vi.fn() as any
    const viewer = createImageViewer(document, sendSafe)
    const images = makeImages(3)
    viewer.open(images, 0)

    // 右箭头
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    const titleEl = document.querySelector<HTMLElement>('.m115-viewer-title')
    expect(titleEl?.textContent).toContain('图 2.jpg · 2 / 3')

    // Esc 关闭
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    const overlay = document.querySelector<HTMLElement>('.m115-viewer')
    expect(overlay?.classList.contains('active')).toBe(false)
  })

  it('删除当前图片并联动移除 DOM', async () => {
    const sendSafe = vi.fn().mockResolvedValue({ ok: true }) as any
    const viewer = createImageViewer(document, sendSafe)
    const images = makeImages(2)
    document.body.appendChild(images[0].sourceItem)

    viewer.open(images, 0)

    const deleteBtn = document.querySelector<HTMLElement>('.m115-viewer-frame-delete')
    deleteBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(sendSafe).toHaveBeenCalledWith({
      type: 'DELETE_FILE',
      data: { fileId: '0', parentId: '0', pickCode: 'p_0' },
    })
    expect(document.body.contains(images[0].sourceItem)).toBe(false)

    const titleEl = document.querySelector<HTMLElement>('.m115-viewer-title')
    expect(titleEl?.textContent).toContain('图 2.jpg')
  })
})
