import type { OverlayPlaylistItem } from './overlay'
import { buildNavigateToVideoUrl } from './player-query'

export function findPlaylistItemByPickCode(items: OverlayPlaylistItem[], pickCode: string) {
  return items.find(item => item.pickCode === pickCode)
}

export function buildOverlayMetaPatch(targetItem?: OverlayPlaylistItem) {
  if (!targetItem) return null

  return {
    title: targetItem.name,
    fileId: targetItem.fileId,
    fileSize: targetItem.size || '',
    // 不使用缓存的 isMarked，切换时先重置为空心，由 fetchFileFavoriteStatus 异步获取真实状态
    isMarked: false,
  }
}

export function buildPlayerHistoryUrl(params: {
  pathname: string
  search: string
  pickCode: string
  targetItem?: OverlayPlaylistItem
  keepPlaylistOpen: boolean
}) {
  return buildNavigateToVideoUrl(
    params.pathname,
    params.search,
    params.pickCode,
    {
      title: params.targetItem?.name,
      fileId: params.targetItem?.fileId,
      fileSize: params.targetItem?.size,
      // 不使用缓存 isMarked，由 fetchFileFavoriteStatus 异步获取真实状态后更新
      isMarked: false,
      keepPlaylistOpen: params.keepPlaylistOpen,
    },
  )
}
