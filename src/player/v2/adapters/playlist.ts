/**
 * 115m 2.0 · 播放列表业务适配层（Layer 1）
 * 通过桥接调用扩展后台，拉取同目录剧集列表与面包屑路径。
 */

import { fetchPlaylistData } from '../../core/player-services'
import type { OverlayPathItem, OverlayPlaylistItem } from '../../core/overlay-types'
import { callExtensionBridge } from '../bridge-client'

export interface LoadedPlaylist {
  items: OverlayPlaylistItem[]
  path: OverlayPathItem[]
}

const bridgeSender = async (message: unknown) => callExtensionBridge(message)

export async function loadPlaylist(cid: string, pickCode: string): Promise<LoadedPlaylist> {
  let path: OverlayPathItem[] = []
  const items = await fetchPlaylistData({
    sendMessage: bridgeSender as never,
    cid,
    pickCode,
    onPath: (p) => {
      path = p
    },
  })
  return { items, path }
}
