import type { FileInfo } from './types'
import { readAttr } from '../../shared/utils'
import { parseDuration } from './utils'
import { getItemParentId, getItemPickCode, getItemTitle } from './native-dom'

export function isPlayIntentTarget(target: HTMLElement): boolean {
  if (target.closest('.file-opr,.m115-cover-container,input[type="checkbox"],.checkbox')) return false
  if (target.closest('[menu]') && !target.closest('a.name, .name')) return false
  return !!target.closest('.file-name .name, a.name, .file-name, .name, .file-thumb')
}

export function extractFileInfo(item: HTMLElement): FileInfo | null {
  const pickCode = getItemPickCode(item)
  if (!pickCode) return null

  const durationNode = item.querySelector('.duration') as HTMLElement | null
  const durationRaw = durationNode?.getAttribute('duration') || durationNode?.textContent?.trim() || ''
  const fileName = getItemTitle(item) || '视频'
  const fileSize = item.querySelector('.size,.file-size,.meta-size,.list-size')?.textContent?.trim() || ''
  const fileId = readAttr(item, ['file_id', 'fid', 'fileid'])
  const parentId = getItemParentId(item, '')
  const isMarked = !!item.querySelector('.icon-star,.isstar,.file-mark .selected,.file-opr .icon-operate-fav.active')

  return {
    pickCode,
    fileName,
    duration: parseDuration(durationRaw),
    isVideo: item.getAttribute('iv') === '1',
    fileId: fileId || undefined,
    parentId: parentId || undefined,
    fileSize: fileSize || undefined,
    isMarked,
  }
}
