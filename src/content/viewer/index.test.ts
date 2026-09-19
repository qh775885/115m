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

  it('手动折叠把手后切图保持折叠，且再次点击单次即生效切换', async () => {
    const sendSafe = vi.fn() as any
    const viewer = createImageViewer(document, sendSafe)
    const images = makeImages(5)
    viewer.open(images, 0)

    const thumbsWrap = document.querySelector<HTMLElement>('.m115-viewer-thumbs-wrap')
    const toggleBtn = document.querySelector<HTMLElement>('.m115-viewer-thumbs-toggle')
    const overlay = document.querySelector<HTMLElement>('.m115-viewer')

    expect(thumbsWrap?.classList.contains('is-collapsed')).toBe(false)
    expect(toggleBtn?.classList.contains('open')).toBe(true)

    // 1. 用户手动折叠
    toggleBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(thumbsWrap?.classList.contains('is-collapsed')).toBe(true)
    expect(toggleBtn?.classList.contains('open')).toBe(false)

    // 2. 切图（模拟连续切图 3 次）
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    await new Promise(resolve => setTimeout(resolve, 20))

    // 3. 切图后必须依然严格保持折叠状态，且遮罩层 scrollTop 绝不偏移
    expect(thumbsWrap?.classList.contains('is-collapsed')).toBe(true)
    expect(toggleBtn?.classList.contains('open')).toBe(false)
    expect(overlay?.scrollTop).toBe(0)

    // 4. 再次手动点击折叠把手：仅需 1 次点击，立即恢复展开，状态绝不混乱
    toggleBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(thumbsWrap?.classList.contains('is-collapsed')).toBe(false)
    expect(toggleBtn?.classList.contains('open')).toBe(true)
  })

  it('关闭查看器后再打开新目录图片，旧图残影被彻底清理并直指新图', () => {
    const sendSafe = vi.fn() as any
    const viewer = createImageViewer(document, sendSafe)
    const folderAImages = makeImages(2)
    const folderBImages = [
      {
        id: '100',
        title: 'B目录首图.jpg',
        thumbUrl: 'https://example.com/b_thumb_0.jpg',
        originalUrl: 'https://example.com/b_orig_0.jpg',
        fileId: '100',
        parentId: '10',
        pickCode: 'p_100',
        sourceItem: document.createElement('li'),
        open: () => {},
        select: () => {},
        contextMenu: () => {},
      },
    ]

    // 1. 在 A 目录查看第 1 张图片
    viewer.open(folderAImages, 0)
    const imageEl = document.querySelector<HTMLImageElement>('.m115-viewer-image')
    expect(imageEl?.src).toContain('orig_0.jpg')

    // 2. 关闭查看器
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    // 关闭后应清理 src 与透明度，杜绝旧图常驻
    expect(imageEl?.getAttribute('src')).toBeNull()
    expect(imageEl?.style.opacity).toBe('0')

    // 3. 在 B 目录打开新图片
    viewer.open(folderBImages, 0)
    expect(imageEl?.src).toContain('b_orig_0.jpg')
    const titleEl = document.querySelector<HTMLElement>('.m115-viewer-title')
    expect(titleEl?.textContent).toContain('B目录首图.jpg')
  })
})
