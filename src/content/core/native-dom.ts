/**
 * 115 原生 DOM 适配层
 * 集中维护对 115 网盘页面原生 DOM 的所有硬编码选择器与读取逻辑。
 * 官方改版时只需修改本文件，业务模块（媒体墙等）不直接触碰原生选择器。
 */

const STAR_SELECTOR = '.icon-star,[menu="star"],.tpstar,.tpstar-disabled'
const REMARK_SELECTOR = '.icon-remarks,[menu="remark"],.file-remark,.remarks'
const OPEN_ANCHOR_SELECTOR = '.file-name .name,[menu="open"],[rel="view_folder"]'
const CONTEXT_MENU_ANCHOR_SELECTOR = '.file-name .name,[menu="open"],[rel="view_folder"],.file-thumb img,.photo-icon img'
const NAME_SELECTOR = '.file-name .name'

export function getFileListContainer(doc: Document): HTMLElement | null {
  return doc.querySelector<HTMLElement>('.list-contents')
}

export function getFileItems(list: HTMLElement): HTMLElement[] {
  return Array.from(list.querySelectorAll<HTMLElement>('li[rel="item"]'))
}

export function getFileType(item: HTMLElement): string {
  return item.getAttribute('file_type') || ''
}

export function getFolderId(item: HTMLElement): string {
  return item.getAttribute('cate_id') || ''
}

export function getItemTitle(item: HTMLElement): string {
  return item.getAttribute('title') || item.querySelector(NAME_SELECTOR)?.textContent?.trim() || ''
}

export function getFolderCoverUrl(item: HTMLElement): string {
  return item.getAttribute('img_url') || ''
}

export function getImageThumbUrl(item: HTMLElement): string {
  return item.getAttribute('path') || item.querySelector('img')?.getAttribute('src') || ''
}

export function getImageIv(item: HTMLElement): string {
  return item.getAttribute('iv') || ''
}

export function getHasDesc(item: HTMLElement): string {
  return item.getAttribute('has_desc') || ''
}

export function getStarAction(item: HTMLElement): HTMLElement | null {
  return item.querySelector<HTMLElement>(STAR_SELECTOR)
}

export function getStarStateKey(item: HTMLElement): string {
  return getStarAction(item)?.getAttribute('is_star') || ''
}

export function isItemStarred(item: HTMLElement): boolean {
  const starAction = getStarAction(item)
  return starAction?.getAttribute('is_star') === '1'
    || item.getAttribute('is_star') === '1'
    || item.getAttribute('star') === '1'
    || item.classList.contains('is-starred')
}

export function getRemarkAction(item: HTMLElement): HTMLElement | null {
  return item.querySelector<HTMLElement>(REMARK_SELECTOR)
}

export function isRemarkVisible(item: HTMLElement): boolean {
  const remarkAction = getRemarkAction(item)
  return !!remarkAction && getComputedStyle(remarkAction).display !== 'none'
}

export function getOpenAnchor(item: HTMLElement): HTMLElement {
  return item.querySelector<HTMLElement>(OPEN_ANCHOR_SELECTOR) || item
}

export function getContextMenuAnchor(item: HTMLElement): HTMLElement {
  return item.querySelector<HTMLElement>(CONTEXT_MENU_ANCHOR_SELECTOR) || item
}

export function getSelectionTarget(item: HTMLElement): HTMLElement {
  return item.querySelector<HTMLElement>('.checkbox[menu="file_check_one"]')
    || item.querySelector<HTMLElement>('input[type="checkbox"]')
    || item
}

export function getItemCheckboxes(item: HTMLElement): HTMLInputElement[] {
  return Array.from(item.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'))
}
