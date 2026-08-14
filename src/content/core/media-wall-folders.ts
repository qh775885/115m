import type { MediaWallFolderItem } from './media-wall-types'
import { installWallDragSelection, isWallSourceItemSelected } from './media-wall-selection'
import { Icons } from '../../shared/icons'
import { selectNativeFolder, openNativeFolder, openNativeFolderContextMenu } from './native-interact'
import {
  getFileType,
  getFolderCoverUrl,
  getFolderId,
  getItemTitle,
  getRemarkAction,
  getStarAction,
  isItemStarred,
  isRemarkVisible,
} from './native-dom'

function syncStarButtonState(starBtn: HTMLButtonElement, active: boolean) {
  starBtn.classList.toggle('is-active', active)
  starBtn.classList.remove('is-pending')
  starBtn.disabled = false
  starBtn.title = active ? '取消星标' : '星标'
  starBtn.setAttribute('aria-label', active ? '取消星标' : '星标')
  const starIcon = starBtn.querySelector<HTMLElement>('.m115-folder-icon')
  if (starIcon) starIcon.innerHTML = active ? Icons.StarFilled() : Icons.Star()
}

function scheduleFolderStarSync(
  doc: Document,
  starBtn: HTMLButtonElement,
  sourceItem: HTMLElement,
  scheduleMediaWallRefresh: (doc: Document) => void,
) {
  const sync = () => syncStarButtonState(starBtn, isItemStarred(sourceItem))
  window.setTimeout(sync, 180)
  window.setTimeout(() => {
    sync()
    scheduleMediaWallRefresh(doc)
  }, 600)
  window.setTimeout(() => {
    sync()
    scheduleMediaWallRefresh(doc)
  }, 1200)
}

export function buildFolderItem(item: HTMLElement): MediaWallFolderItem | null {
  if (getFileType(item) !== '0') return null

  const title = getItemTitle(item) || '文件夹'
  const coverUrl = getFolderCoverUrl(item)
  if (!coverUrl) return null

  const starAction = getStarAction(item)
  const remarkAction = getRemarkAction(item)

  return {
    id: getFolderId(item) || title,
    title,
    coverUrl,
    sourceItem: item,
    isStarred: isItemStarred(item),
    hasRemark: isRemarkVisible(item),
    starAction,
    remarkAction,
    open: () => openNativeFolder(item, 'm115-wall-hidden-item'),
    select: (event?: MouseEvent) => selectNativeFolder(item, 'm115-wall-hidden-item', event),
    contextMenu: (event: MouseEvent) => openNativeFolderContextMenu(item, 'm115-wall-hidden-item', event),
  }
}

export function renderFoldersSection(
  doc: Document,
  folders: MediaWallFolderItem[],
  forwardNativeContextMenu: (sourceItem: HTMLElement, event: MouseEvent) => void,
  scheduleMediaWallRefresh: (doc: Document) => void,
) {
  const section = doc.createElement('section')
  section.className = 'm115-wall-section'

  const title = doc.createElement('div')
  title.className = 'm115-wall-title'
  title.textContent = '文件夹'
  section.appendChild(title)

  const grid = doc.createElement('div')
  grid.className = 'm115-folder-grid'

  const syncSelectionState = () => {
    folders.forEach((folder) => {
      const card = grid.querySelector<HTMLElement>(`.m115-folder-card[data-folder-id="${CSS.escape(folder.id)}"]`)
      if (!card) return
      card.classList.toggle('is-selected', isWallSourceItemSelected(folder.sourceItem))
    })
  }

  folders.forEach((folder) => {
    const card = doc.createElement('button')
    card.type = 'button'
    card.className = 'm115-folder-card'
    card.title = folder.title
    card.dataset.folderId = folder.id

    const shellBack = doc.createElement('span')
    shellBack.className = 'm115-folder-shell-back'
    card.appendChild(shellBack)

    const shellContent = doc.createElement('span')
    shellContent.className = 'm115-folder-shell-content'
    card.appendChild(shellContent)

    const shellFront = doc.createElement('span')
    shellFront.className = 'm115-folder-shell-front'

    const coverWrap = doc.createElement('span')
    coverWrap.className = 'm115-folder-cover-wrap'
    coverWrap.style.setProperty('--m115-folder-cover-url', `url("${folder.coverUrl}")`)

    const cover = doc.createElement('img')
    cover.className = 'm115-folder-cover'
    cover.src = folder.coverUrl
    cover.alt = folder.title
    cover.loading = 'lazy'
    coverWrap.appendChild(cover)

    const footer = doc.createElement('span')
    footer.className = 'm115-folder-footer'

    const name = doc.createElement('span')
    name.className = 'm115-folder-name'
    name.textContent = folder.title
    footer.appendChild(name)

    shellFront.appendChild(coverWrap)
    shellFront.appendChild(footer)
    card.appendChild(shellFront)

    const selection = doc.createElement('button')
    selection.type = 'button'
    selection.className = 'm115-folder-selection'
    selection.setAttribute('aria-label', '选择文件夹')
    selection.innerHTML = `<span class="m115-folder-selection-box">${Icons.Check()}</span>`
    selection.addEventListener('mousedown', (event) => {
      if (event.button !== 0) return
      event.preventDefault()
      event.stopPropagation()
      folder.select(event)
      window.setTimeout(syncSelectionState, 0)
      window.setTimeout(syncSelectionState, 60)
    })
    selection.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      window.setTimeout(syncSelectionState, 0)
      window.setTimeout(syncSelectionState, 60)
    })
    card.appendChild(selection)

    const actions = doc.createElement('span')
    actions.className = 'm115-folder-actions'

    const starBtn = doc.createElement('button')
    starBtn.type = 'button'
    starBtn.className = `m115-folder-action-btn ${folder.isStarred ? 'is-active' : ''}`
    starBtn.dataset.role = 'star'
    starBtn.title = folder.isStarred ? '取消星标' : '星标'
    starBtn.setAttribute('aria-label', folder.isStarred ? '取消星标' : '星标')
    const starIcon = doc.createElement('span')
    starIcon.className = 'm115-folder-icon'
    starIcon.setAttribute('aria-hidden', 'true')
    starIcon.innerHTML = folder.isStarred ? Icons.StarFilled() : Icons.Star()
    starBtn.appendChild(starIcon)
    starBtn.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      if (!folder.starAction || starBtn.disabled) return
      starBtn.disabled = true
      starBtn.classList.add('is-pending')
      folder.starAction.click()
      scheduleFolderStarSync(doc, starBtn, folder.sourceItem, scheduleMediaWallRefresh)
    })
    actions.appendChild(starBtn)

    if (folder.hasRemark) {
      const remarkBtn = doc.createElement('button')
      remarkBtn.type = 'button'
      remarkBtn.className = 'm115-folder-action-btn m115-folder-remark-badge'
      remarkBtn.dataset.role = 'remark'
      remarkBtn.title = '备注'
      remarkBtn.setAttribute('aria-label', '备注')
      remarkBtn.textContent = '备注'
      remarkBtn.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        folder.remarkAction?.click()
        scheduleMediaWallRefresh(doc)
      })
      actions.appendChild(remarkBtn)
    }

    card.appendChild(actions)

    card.addEventListener('click', (event) => {
      if (event.defaultPrevented) return
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
        folder.select(event)
        window.setTimeout(syncSelectionState, 0)
        window.setTimeout(syncSelectionState, 60)
        return
      }
      folder.open()
    })
    card.addEventListener('contextmenu', (event) => {
      event.preventDefault()
      event.stopPropagation()
      folder.contextMenu(event)
    })
    grid.appendChild(card)
  })

  const stopDragSelection = installWallDragSelection(
    doc,
    section,
    '.m115-folder-card',
    element => folders.find(folder => element.dataset.folderId === folder.id),
    syncSelectionState,
  )

  syncSelectionState()
  window.setTimeout(syncSelectionState, 0)
  window.setTimeout(syncSelectionState, 80)

  section.addEventListener('DOMNodeRemoved', stopDragSelection, { once: true })
  section.appendChild(grid)
  return section
}

