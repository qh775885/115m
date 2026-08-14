// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createImageModule } from './media-wall-images'
import type { MediaWallImageItem } from './media-wall-types'
import type { sendRuntimeMessageSafe } from './runtime'

type SendRuntimeMessageSafe = typeof sendRuntimeMessageSafe

function makeImages(count: number): MediaWallImageItem[] {
  return Array.from({ length: count }, (_, index) => {
    const sourceItem = document.createElement('li')
    sourceItem.setAttribute('file_id', String(index))
    sourceItem.setAttribute('file_type', '1')
    return {
      id: String(index),
      title: `图 ${index + 1}`,
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

function openLightbox(doc: Document) {
  const module = createImageModule((async () => ({ ok: true })) as unknown as SendRuntimeMessageSafe)
  const images = makeImages(3)
  const section = module.renderImagesSection(doc, images)
  doc.body.appendChild(section)

  const card = section.querySelector<HTMLElement>('.m115-image-card')
  expect(card).not.toBeNull()
  card?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

  const overlay = doc.querySelector<HTMLElement>('.m115-viewer')
  expect(overlay).not.toBeNull()
  expect(overlay?.classList.contains('active')).toBe(true)
  return { doc, section, images, overlay: overlay! }
}

beforeEach(() => {
  document.body.innerHTML = ''
  if (!HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = vi.fn()
  }
})

describe('图片查看器交互', () => {
  it('点击图片本体不关闭查看器', () => {
    const { doc, overlay } = openLightbox(document)

    const imageEl = doc.querySelector<HTMLElement>('.m115-viewer-image')
    expect(imageEl).not.toBeNull()
    imageEl?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

    expect(overlay.classList.contains('active')).toBe(true)
  })

  it('点击缩略图切图且不关闭查看器', () => {
    const { doc, overlay } = openLightbox(document)

    const thumbs = doc.querySelectorAll<HTMLElement>('.m115-viewer-thumb')
    expect(thumbs.length).toBe(3)
    thumbs[2]?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

    expect(overlay.classList.contains('active')).toBe(true)
    const titleEl = doc.querySelector<HTMLElement>('.m115-viewer-title')
    expect(titleEl?.textContent).toContain('图 3')
  })

  it('点击空白区域关闭查看器', () => {
    const { overlay } = openLightbox(document)

    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

    expect(overlay.classList.contains('active')).toBe(false)
  })

  it('关闭按钮关闭查看器', () => {
    const { doc, overlay } = openLightbox(document)

    const closeBtn = doc.querySelector<HTMLElement>('.m115-viewer-tool-btn')
    closeBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))

    expect(overlay.classList.contains('active')).toBe(false)
  })

  it('打开后键盘方向键立即生效', () => {
    const { doc, overlay } = openLightbox(document)

    doc.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }))

    expect(overlay.classList.contains('active')).toBe(true)
    const titleEl = doc.querySelector<HTMLElement>('.m115-viewer-title')
    expect(titleEl?.textContent).toContain('图 2')
  })

  it('打开后键盘 Esc 立即关闭', () => {
    const { doc, overlay } = openLightbox(document)

    doc.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))

    expect(overlay.classList.contains('active')).toBe(false)
  })

  it('查看器关闭后键盘事件不再响应', () => {
    const { doc, overlay } = openLightbox(document)
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    expect(overlay.classList.contains('active')).toBe(false)

    doc.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }))

    expect(overlay.classList.contains('active')).toBe(false)
  })

  it('滚轮向下翻页', () => {
    const { doc, overlay } = openLightbox(document)

    overlay.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }))

    expect(overlay.classList.contains('active')).toBe(true)
    const titleEl = doc.querySelector<HTMLElement>('.m115-viewer-title')
    expect(titleEl?.textContent).toContain('图 2')
  })

  it('滚轮向上翻上一张', async () => {
    const { doc, overlay } = openLightbox(document)

    // 先翻到第二张
    overlay.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }))
    let titleEl = doc.querySelector<HTMLElement>('.m115-viewer-title')
    expect(titleEl?.textContent).toContain('图 2')

    // 等手势重置后再向上滚回第一张
    await new Promise(resolve => setTimeout(resolve, 130))
    overlay.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true }))
    await new Promise(resolve => setTimeout(resolve, 10))

    titleEl = doc.querySelector<HTMLElement>('.m115-viewer-title')
    expect(titleEl?.textContent).toContain('图 1')
  })

  it('缩略图面板折叠后再展开', () => {
    const { doc, overlay } = openLightbox(document)

    const thumbsToggle = doc.querySelector<HTMLElement>('.m115-viewer-thumbs-toggle')
    thumbsToggle?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    const thumbsWrap = doc.querySelector<HTMLElement>('.m115-viewer-thumbs-wrap')
    expect(thumbsWrap?.classList.contains('is-collapsed')).toBe(true)

    thumbsToggle?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    expect(thumbsWrap?.classList.contains('is-collapsed')).toBe(false)
    expect(overlay.classList.contains('active')).toBe(true)
  })

  it('删除当前图片后缩略图与标题同步', async () => {
    const { doc, overlay } = openLightbox(document)

    const deleteBtn = doc.querySelector<HTMLElement>('.m115-viewer-frame-delete')
    deleteBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await new Promise(resolve => setTimeout(resolve, 10))

    const titleEl = doc.querySelector<HTMLElement>('.m115-viewer-title')
    // 删除第 1 张后，当前应校正为原第 2 张
    expect(titleEl?.textContent).toContain('图 2')
    const thumbs = doc.querySelectorAll<HTMLElement>('.m115-viewer-thumb')
    expect(thumbs.length).toBe(2)
    expect(overlay.classList.contains('active')).toBe(true)
  })

  it('删除最后一张后关闭查看器', async () => {
    const { doc, overlay } = openLightbox(document)

    // 依次删除三张
    for (let i = 0; i < 3; i++) {
      const deleteBtn = doc.querySelector<HTMLElement>('.m115-viewer-frame-delete')
      deleteBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    expect(overlay.classList.contains('active')).toBe(false)
  })

  it('切图直接设置新图 src（秒显示，无预载门控）', () => {
    const { doc, overlay } = openLightbox(document)
    const imageEl = doc.querySelector<HTMLElement>('.m115-viewer-image')

    expect(imageEl?.getAttribute('src')).toContain('0_0.jpg')

    overlay.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }))

    // 滚动即设置下一张 src，不等待任何预载
    expect(imageEl?.getAttribute('src')).toContain('1_0.jpg')
  })

  it('快速连滚时始终指向最新图片', () => {
    const { doc, overlay } = openLightbox(document)
    const imageEl = doc.querySelector<HTMLElement>('.m115-viewer-image')

    overlay.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }))
    overlay.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true }))

    // 连续滚动后 imageEl.src 应指向第 3 张（0 基索引 2）
    expect(imageEl?.getAttribute('src')).toContain('2_0.jpg')
  })
})
