/**
 * 115m 2.0 · 播放列表业务适配层（Layer 1）
 * 通过桥接调用扩展后台，拉取同目录剧集列表、面包屑路径与观看进度。
 * 注意：v2 运行于 MAIN 世界，无法直连 chrome.runtime，所有特权请求必须走 bridge。
 */

import { fetchPlaylistResponse } from '../../core/player-api'
import { fetchBreadcrumbPath } from '../../core/player-services'
import { normalizePlaylistItems } from '../../core/playlist'
import { buildPlaylistProgressSnapshot, type PlayHistoryMap } from '../../core/history'
import type { OverlayPathItem, OverlayPlaylistItem } from '../../core/overlay-types'
import { callExtensionBridge } from '../bridge-client'

export interface LoadedPlaylist {
  items: OverlayPlaylistItem[]
  path: OverlayPathItem[]
}

export async function loadPlaylist(cid: string, pickCode: string): Promise<LoadedPlaylist> {
  const response = await fetchPlaylistResponse(bridgeSender as never, cid, pickCode)
  const items = normalizePlaylistItems(response?.list || [])
  return {
    items: await attachPlaylistProgress(items),
    path: response?.path ?? [],
  }
}

/** 独立拉取面包屑路径（旧实现即以此方式获取，cid 传空由后台按 pickCode 推导）。 */
export async function loadBreadcrumb(pickCode: string): Promise<OverlayPathItem[]> {
  return await fetchBreadcrumbPath(bridgeSender as never, '', pickCode)
}

function bridgeSender(message: unknown) {
  return callExtensionBridge(message)
}

/** 观看进度同样走 bridge（旧实现直连 runtime，在 MAIN 世界不可用）。 */
async function attachPlaylistProgress(items: OverlayPlaylistItem[]): Promise<OverlayPlaylistItem[]> {
  if (items.length === 0) return items

  const historyMap = await callExtensionBridge<PlayHistoryMap>({
    type: 'GET_NATIVE_HISTORY_MAP',
    data: { pickCodes: items.map(item => item.pickCode), shareId: '0' },
  })
  if (!historyMap) return items

  return items.map((item) => {
    const record = historyMap[item.pickCode]
    if (!record?.currentTime) return item
    // 115 历史接口不返回总时长，用列表项的时长补上
    const snapshot = buildPlaylistProgressSnapshot({
      currentTime: record.currentTime,
      duration: item.duration || 0,
      watchEnd: record.watchEnd,
    })
    if (!snapshot) return item
    return {
      ...item,
      progressSec: snapshot.progressSec,
      progressPercent: snapshot.progressPercent,
    }
  })
}
