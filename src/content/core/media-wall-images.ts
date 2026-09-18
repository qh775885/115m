import type { MediaWallImageItem, LightboxController } from './media-wall-types'
import { WALL_HIDDEN_CLASS } from './media-wall-types'
import { isImageExtension, readAttr } from '../../shared/utils'
import { openNativeFolder, openNativeFolderContextMenu, selectNativeFolder } from './native-interact'
import {
  createWallSelectionButton,
  installWallDragSelection,
  scheduleSelectionSync,
  syncWallSelectionState,
  SELECT_SYNC_AFTER_ACTION,
  SELECT_SYNC_INITIAL,
  SELECT_SYNC_IMAGE_INITIAL_EXTRA,
} from './media-wall-selection'
import { getFileType, getImageIv, getImageThumbUrl, getItemCheckboxes, getItemParentId, getItemTitle } from './native-dom'
import { createImageViewer } from '../viewer'

function toOriginalImageUrl(url: string): string {
  return url.replace(/_\d+(\?|$)/, '_0$1')
}

function startSelectionSync(sourceItem: HTMLElement, sync: () => void): () => void {
  const observer = new MutationObserver(() => sync())
  observer.observe(sourceItem, {
    attributes: true,
    attributeFilter: ['class', 'selected', 'check', 'is_selected', 'data-selected', 'aria-selected'],
    subtree: true,
    childList: true,
  })
  const inputs = getItemCheckboxes(sourceItem)
  inputs.forEach((input) => {
    input.addEventListener('change', sync)
  })
  return () => {
    observer.disconnect()
    inputs.forEach(input => input.removeEventListener('change', sync))
  }
}

export function buildImageItem(item: HTMLElement): MediaWallImageItem | null {
  if (getFileType(item) !== '1') return null
  if (getImageIv(item) === '1') return null

  const title = getItemTitle(item) || '图片'
  const thumbUrl = getImageThumbUrl(item)
  if (!thumbUrl || !isImageExtension(title)) return null

  return {
    id: readAttr(item, ['file_id', 'fid', 'fileid', 'pick_code']) || title,
    title,
    thumbUrl,
    originalUrl: toOriginalImageUrl(thumbUrl),
    fileId: readAttr(item, ['file_id', 'fid', 'fileid']),
    parentId: getItemParentId(item),
    pickCode: readAttr(item, ['pick_code', 'pickcode']),
    sourceItem: item,
    open: () => openNativeFolder(item, WALL_HIDDEN_CLASS),
    select: (event?: MouseEvent) => selectNativeFolder(item, WALL_HIDDEN_CLASS, event),
    contextMenu: (event: MouseEvent) => openNativeFolderContextMenu(item, WALL_HIDDEN_CLASS, event),
  }
}

export function createImageModule(sendRuntimeMessageSafe: typeof import('./runtime').sendRuntimeMessageSafe) {
  const lightboxByDoc = new WeakMap<Document, LightboxController>()

  const getLightboxController = (doc: Document): LightboxController => {
    const existing = lightboxByDoc.get(doc)
    if (existing) return existing
    const created = createImageViewer(doc, sendRuntimeMessageSafe)
    lightboxByDoc.set(doc, created)
    return created
  }

  const renderImagesSection = (
    doc: Document,
    images: MediaWallImageItem[],
  ) => {
    const section = doc.createElement('section')
    section.className = 'm115-wall-section'

    const title = doc.createElement('div')
    title.className = 'm115-wall-title'
    title.textContent = '图片'
    section.appendChild(title)

    const grid = doc.createElement('div')
    grid.className = 'm115-image-grid'
    const lightbox = getLightboxController(doc)
    const stopSyncList: Array<() => void> = []

    const syncSelectionState = () => syncWallSelectionState(grid, '.m115-image-card', images, 'data-image-id')

    images.forEach((image, index) => {
      const button = doc.createElement('button')
      button.type = 'button'
      button.className = 'm115-image-card'
      button.title = image.title
      button.dataset.imageId = image.id

      const thumbWrap = doc.createElement('span')
      thumbWrap.className = 'm115-image-thumb-wrap'

      const thumb = doc.createElement('img')
      thumb.className = 'm115-image-thumb'
      thumb.src = image.thumbUrl
      thumb.alt = image.title
      thumb.loading = 'lazy'

      const name = doc.createElement('span')
      name.className = 'm115-image-name'
      name.textContent = image.title

      thumbWrap.appendChild(thumb)
      button.appendChild(thumbWrap)
      button.appendChild(name)
      const selection = createWallSelectionButton(doc, '选择图片', image.select, syncSelectionState)
      button.appendChild(selection)
      button.addEventListener('click', (event) => {
        if (event.defaultPrevented) return
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
          image.select(event)
          scheduleSelectionSync(syncSelectionState, SELECT_SYNC_AFTER_ACTION)
          return
        }
        lightbox.open(images, index)
      })
      button.addEventListener('contextmenu', (event) => {
        event.preventDefault()
        event.stopPropagation()
        image.contextMenu(event)
      })
      grid.appendChild(button)
      stopSyncList.push(startSelectionSync(image.sourceItem, syncSelectionState))
    })

    const stopDragSelection = installWallDragSelection(
      doc,
      section,
      '.m115-image-card',
      element => images.find(image => element.dataset.imageId === image.id),
      syncSelectionState,
    )

    syncSelectionState()
    scheduleSelectionSync(syncSelectionState, SELECT_SYNC_INITIAL)
    window.setTimeout(syncSelectionState, SELECT_SYNC_IMAGE_INITIAL_EXTRA)

    section.addEventListener('DOMNodeRemoved', () => {
      stopDragSelection()
      stopSyncList.forEach(stopSync => stopSync())
    }, { once: true })

    section.appendChild(grid)
    return section
  }

  return {
    buildImageItem,
    renderImagesSection,
  }
}
