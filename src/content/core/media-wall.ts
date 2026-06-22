import { isImageExtension, readAttr } from '../../shared/utils'
import { sendRuntimeMessageSafe } from './runtime'
import { buildFolderItem, renderFoldersSection } from './media-wall-folders'
import { createImageModule } from './media-wall-images'
import type { MediaWallFolderItem, MediaWallImageItem } from './media-wall-types'

interface MediaWallState {
  listEl: HTMLElement | null
  signature: string
}

const stateByDoc = new WeakMap<Document, MediaWallState>()
const refreshTimersByDoc = new WeakMap<Document, number[]>()
const imageModule = createImageModule(sendRuntimeMessageSafe)

const HIDDEN_CLASS = 'm115-wall-hidden-item'
const WALL_ID = 'm115-media-wall'

function toOriginalImageUrl(url: string): string {
  return url.replace(/_\d+(\?|$)/, '_0$1')
}

function getFolderStateSignature(item: HTMLElement): string {
  const starAction = item.querySelector('.icon-star,[menu="star"],.tpstar,.tpstar-disabled') as HTMLElement | null
  const remarkAction = item.querySelector('.icon-remarks,[menu="remark"],.file-remark,.remarks') as HTMLElement | null
  return [
    item.getAttribute('title') || '',
    item.getAttribute('img_url') || '',
    starAction?.getAttribute('is_star') || '',
    remarkAction ? getComputedStyle(remarkAction).display : 'none',
    item.getAttribute('has_desc') || '',
  ].join(':')
}

function getImageStateSignature(item: HTMLElement): string {
  return [
    item.getAttribute('title') || '',
    item.getAttribute('path') || item.querySelector('img')?.getAttribute('src') || '',
  ].join(':')
}

function buildSignature(list: HTMLElement, folders: MediaWallFolderItem[], images: MediaWallImageItem[]) {
  const itemStates = Array.from(list.querySelectorAll<HTMLElement>('li[rel="item"]')).map((item) => {
    const key = readAttr(item, ['file_id', 'cate_id', 'pick_code']) || item.getAttribute('title') || ''
    if (item.getAttribute('file_type') === '0') return `${key}:${getFolderStateSignature(item)}`
    if (item.getAttribute('file_type') === '1') return `${key}:${getImageStateSignature(item)}`
    return `${item.getAttribute('file_type') || ''}:${key}`
  })
  return `${folders.map(item => item.id).join(',')}|${images.map(item => item.id).join(',')}|${itemStates.join(',')}`
}

function clearWall(list: HTMLElement) {
  list.querySelector(`#${WALL_ID}`)?.remove()
  list.querySelectorAll<HTMLElement>(`.${HIDDEN_CLASS}`).forEach((item) => item.classList.remove(HIDDEN_CLASS))
}

function forwardNativeContextMenu(sourceItem: HTMLElement, event: MouseEvent) {
  const anchor = (sourceItem.querySelector('.file-name .name,[menu="open"],[rel="view_folder"],.file-thumb img,.photo-icon img') as HTMLElement | null) || sourceItem
  sourceItem.classList.remove(HIDDEN_CLASS)

  const previousStyle = sourceItem.getAttribute('style') || ''
  sourceItem.style.setProperty('position', 'fixed', 'important')
  sourceItem.style.setProperty('left', `${event.clientX}px`, 'important')
  sourceItem.style.setProperty('top', `${event.clientY}px`, 'important')
  sourceItem.style.setProperty('width', '1px', 'important')
  sourceItem.style.setProperty('height', '1px', 'important')
  sourceItem.style.setProperty('overflow', 'hidden', 'important')
  sourceItem.style.setProperty('opacity', '0', 'important')
  sourceItem.style.setProperty('pointer-events', 'none', 'important')

  const init: MouseEventInit = {
    bubbles: true,
    cancelable: true,
    view: window,
    button: 2,
    buttons: 2,
    clientX: event.clientX,
    clientY: event.clientY,
    screenX: event.screenX,
    screenY: event.screenY,
  }

  anchor.dispatchEvent(new MouseEvent('mousedown', init))
  anchor.dispatchEvent(new MouseEvent('mouseup', init))
  anchor.dispatchEvent(new MouseEvent('contextmenu', init))

  window.setTimeout(() => {
    if (previousStyle) sourceItem.setAttribute('style', previousStyle)
    else sourceItem.removeAttribute('style')
    sourceItem.classList.add(HIDDEN_CLASS)
  }, 0)
}

function renderImagesSection(doc: Document, images: MediaWallImageItem[]) {
  return imageModule.renderImagesSection(doc, images)
}

function collectMediaItems(list: HTMLElement) {
  const items = Array.from(list.querySelectorAll<HTMLElement>('li[rel="item"]'))
  const folders = items.map(buildFolderItem).filter((item): item is MediaWallFolderItem => !!item)
  const images = items.map(imageModule.buildImageItem).filter((item): item is MediaWallImageItem => !!item)
  return { folders, images }
}

function ensureWallContainer(list: HTMLElement): HTMLElement {
  let wall = list.querySelector<HTMLElement>(`#${WALL_ID}`)
  if (wall) return wall
  wall = document.createElement('div')
  wall.id = WALL_ID
  wall.className = 'm115-media-wall'
  list.prepend(wall)
  return wall
}

function hideSourceItems(folders: MediaWallFolderItem[], images: MediaWallImageItem[]) {
  folders.forEach(folder => folder.sourceItem.classList.add(HIDDEN_CLASS))
  images.forEach(image => image.sourceItem.classList.add(HIDDEN_CLASS))
}

function scheduleMediaWallRefresh(doc: Document) {
  const timers = refreshTimersByDoc.get(doc) || []
  timers.forEach(timer => window.clearTimeout(timer))

  const timer = window.setTimeout(() => renderMediaWall(doc), 80)
  refreshTimersByDoc.set(doc, [timer])
}

export function renderMediaWall(doc: Document) {
  const list = doc.querySelector('.list-contents') as HTMLElement | null
  if (!list) return

  const { folders, images } = collectMediaItems(list)
  const signature = buildSignature(list, folders, images)
  const previousState = stateByDoc.get(doc)
  if (previousState?.listEl === list && previousState.signature === signature) return

  clearWall(list)
  if (!folders.length && !images.length) {
    stateByDoc.set(doc, { listEl: list, signature })
    return
  }

  const wall = ensureWallContainer(list)
  wall.innerHTML = ''

  if (folders.length) wall.appendChild(renderFoldersSection(doc, folders, forwardNativeContextMenu, scheduleMediaWallRefresh))
  if (images.length) wall.appendChild(renderImagesSection(doc, images))

  hideSourceItems(folders, images)
  stateByDoc.set(doc, { listEl: list, signature })
}
