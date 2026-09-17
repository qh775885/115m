/**
 * 115m 2.0 · 播放列表业务适配层（Layer 1）
 * 通过桥接调用扩展后台，拉取同目录剧集列表、面包屑路径与观看进度。
 * 注意：v2 运行于 MAIN 世界，无法直连 chrome.runtime，所有特权请求必须走 bridge。
 */

import { fetchPlaylistResponse } from '../../core/player-api'
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
    const snapshot = buildPlaylistProgressSnapshot(historyMap[item.pickCode])
    if (!snapshot) return item
    return {
      ...item,
      progressSec: snapshot.progressSec,
      progressPercent: snapshot.progressPercent,
    }
  })
}
