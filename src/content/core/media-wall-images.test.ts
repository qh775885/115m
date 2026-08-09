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
})
