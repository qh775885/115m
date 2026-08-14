import { readAttr } from '../../shared/utils'
import { sendRuntimeMessageSafe } from './runtime'
import { buildFolderItem, renderFoldersSection } from './media-wall-folders'
import { createImageModule } from './media-wall-images'
import {
  getFileItems,
  getFileListContainer,
  getHasDesc,
  getStarStateKey,
  isRemarkVisible,
} from './native-dom'
import type { MediaWallFolderItem, MediaWallImageItem } from './media-wall-types'
import { WALL_HIDDEN_CLASS } from './media-wall-types'

interface MediaWallState {
  listEl: HTMLElement | null
  signature: string
  itemsRef: HTMLElement[] | null
}

const stateByDoc = new WeakMap<Document, MediaWallState>()
const refreshTimersByDoc = new WeakMap<Document, number[]>()
const imageModule = createImageModule(sendRuntimeMessageSafe)

const WALL_ID = 'm115-media-wall'

function getFolderStateSignature(item: HTMLElement): string {
  return [
    item.getAttribute('title') || '',
    item.getAttribute('img_url') || '',
    getStarStateKey(item),
    isRemarkVisible(item) ? 'visible' : 'none',
    getHasDesc(item),
  ].join(':')
}

function getImageStateSignature(item: HTMLElement): string {
  return [
    item.getAttribute('title') || '',
    item.getAttribute('path') || item.querySelector('img')?.getAttribute('src') || '',
  ].join(':')
}

function buildSignature(items: HTMLElement[], folders: MediaWallFolderItem[], images: MediaWallImageItem[]) {
  const itemStates = items.map((item) => {
    const key = readAttr(item, ['file_id', 'cate_id', 'pick_code']) || item.getAttribute('title') || ''
    if (item.getAttribute('file_type') === '0') return `${key}:${getFolderStateSignature(item)}`
    if (item.getAttribute('file_type') === '1') return `${key}:${getImageStateSignature(item)}`
    return `${item.getAttribute('file_type') || ''}:${key}`
  })
  return `${folders.map(item => item.id).join(',')}|${images.map(item => item.id).join(',')}|${itemStates.join(',')}`
}

function clearWall(list: HTMLElement) {
  list.querySelector(`#${WALL_ID}`)?.remove()
  list.querySelectorAll<HTMLElement>(`.${WALL_HIDDEN_CLASS}`).forEach((item) => item.classList.remove(WALL_HIDDEN_CLASS))
}

function renderImagesSection(doc: Document, images: MediaWallImageItem[]) {
  return imageModule.renderImagesSection(doc, images)
}

function collectMediaItems(list: HTMLElement) {
  const items = getFileItems(list)
  const folders = items.map(buildFolderItem).filter((item): item is MediaWallFolderItem => !!item)
  const images = items.map(imageModule.buildImageItem).filter((item): item is MediaWallImageItem => !!item)
  return { items, folders, images }
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
  folders.forEach(folder => folder.sourceItem.classList.add(WALL_HIDDEN_CLASS))
  images.forEach(image => image.sourceItem.classList.add(WALL_HIDDEN_CLASS))
}

function sameItemsRef(a: HTMLElement[] | null, b: HTMLElement[]): boolean {
  if (!a || a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

function scheduleMediaWallRefresh(doc: Document) {
  const timers = refreshTimersByDoc.get(doc) || []
  timers.forEach(timer => window.clearTimeout(timer))

  const timer = window.setTimeout(() => renderMediaWall(doc, true), 80)
  refreshTimersByDoc.set(doc, [timer])
}

export function renderMediaWall(doc: Document, force = false) {
  const list = getFileListContainer(doc)
  if (!list) return

  const { items, folders, images } = collectMediaItems(list)
  const previousState = stateByDoc.get(doc)
  const hasWall = !!list.querySelector(`#${WALL_ID}`)

  // 快速短路：列表元素引用未变化时，signature 必然相同，跳过重算与重渲染。
  // 仅当非强制刷新时启用（星标/备注等 DOM 属性变化需走 force 路径重算）。
  if (!force && previousState?.listEl === list && hasWall && sameItemsRef(previousState.itemsRef, items)) return

  const signature = buildSignature(items, folders, images)
  if (previousState?.listEl === list && previousState.signature === signature && hasWall) return

  clearWall(list)
  if (!folders.length && !images.length) {
    stateByDoc.set(doc, { listEl: list, signature, itemsRef: items })
    return
  }

  const wall = ensureWallContainer(list)
  wall.innerHTML = ''

  if (folders.length) wall.appendChild(renderFoldersSection(doc, folders, scheduleMediaWallRefresh))
  if (images.length) wall.appendChild(renderImagesSection(doc, images))

  hideSourceItems(folders, images)
  stateByDoc.set(doc, { listEl: list, signature, itemsRef: items })
}
