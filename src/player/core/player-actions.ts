/**
 * 文件操作域控制器：面包屑、移动、收藏、删除。
 * 从 PlayerManager 中拆出，通过 attach 注入外部依赖。
 */

import { fetchBreadcrumbPath } from './player-services'
import { deleteVideoFile, fetchFavoriteStatus, updateFavoriteStatus } from './player-api'
import { getDeleteFallback } from './playlist-navigation'
import { MoveDialog } from './move-dialog'
import { sendRuntimeMessageSafe } from './runtime'
import {
  buildUpdatedMarkedUrl,
  readPathFromLocation,
  readPlaylistCidFromLocation,
} from './player-query'
import { readOverlayMetaFromQuery, type OverlayPathItem, type OverlayPlaylistItem } from './overlay'
import type { PlayerPlaylistController } from './player-playlist'

export interface ActionsControllerDeps {
  /** 获取当前 pickCode */
  getCurrentPickCode: () => string
  /** 播放列表控制器（移动/删除后同步列表） */
  getPlaylist: () => PlayerPlaylistController
  /** 是否保持播放列表打开 */
  getKeepPlaylistOpenOnInit: () => boolean
  /** 导航到目标视频 */
  navigateToVideo: (pickCode: string, keepPlaylistOpen?: boolean, autoPlay?: boolean) => void
  /** 更新播放列表 UI */
  updatePlaylist: (items: OverlayPlaylistItem[]) => void
  /** 更新面包屑 */
  updateBreadcrumbs: (path: OverlayPathItem[]) => void
  /** 更新收藏状态 UI */
  updateFavoriteStatus: (isMarked: boolean) => void
  /** 播放列表是否展开 */
  isPlaylistExpanded: () => boolean
  /** 展示 toast */
  onShowToast: (msg: string) => void
}

export class PlayerActionsController {
  private deps: ActionsControllerDeps | null = null

  attach(deps: ActionsControllerDeps) {
    this.deps = deps
  }

  /**
   * 主动通过 API 获取面包屑，不依赖 DOM 提取或 URL 参数
   */
  async fetchBreadcrumbs(expectedPickCode = this.deps?.getCurrentPickCode() || ''): Promise<void> {
    const deps = this.deps
    if (!deps) return
    const currentPickCode = deps.getCurrentPickCode()
    const pathFromQuery = readPathFromLocation(window.location.search)
    if (expectedPickCode !== currentPickCode) return
    if (pathFromQuery.length > 0) {
      deps.updateBreadcrumbs(pathFromQuery)
      return
    }

    // 通过 API 获取（需要 cid 或 pickCode）
    const cid = readPlaylistCidFromLocation(window.location.search)
    const path = await fetchBreadcrumbPath(sendRuntimeMessageSafe, cid, expectedPickCode)

    if (expectedPickCode !== currentPickCode) return
    if (path.length > 0) {
      deps.updateBreadcrumbs(path)
    }
  }

  /**
   * 刷新面包屑（移动文件后调用）
   */
  async refreshBreadcrumbs(): Promise<void> {
    const deps = this.deps
    if (!deps) return
    // 强制通过 API 获取最新路径
    const path = await fetchBreadcrumbPath(sendRuntimeMessageSafe, '', deps.getCurrentPickCode())

    if (path.length > 0) {
      deps.updateBreadcrumbs(path)
    }
  }

  async moveFile(fileId: string, cid: string): Promise<void> {
    const deps = this.deps
    if (!deps) return
    if (!fileId) throw new Error('fileId missing')

    const dialog = new MoveDialog(
      fileId,
      cid || '0',
      () => void this.refreshBreadcrumbs(),
    )
    const result = await dialog.show()
    if (result.moved) {
      this.handleCurrentVideoMoved()
    }
  }

  async movePlaylistVideo(item: OverlayPlaylistItem): Promise<void> {
    const deps = this.deps
    if (!deps) return
    if (!item.fileId) {
      deps.onShowToast('文件 ID 缺失')
      return
    }

    const parentId = this.getPlaylistItemParentId(item)
    const dialog = new MoveDialog(
      item.fileId,
      parentId || '0',
      () => item.pickCode === deps.getCurrentPickCode() ? void this.refreshBreadcrumbs() : undefined,
    )
    const result = await dialog.show()
    if (result.moved) {
      this.handlePlaylistVideoMoved(item.pickCode)
    }
  }

  handleCurrentVideoMoved() {
    const deps = this.deps
    if (!deps) return
    this.handlePlaylistVideoMoved(deps.getCurrentPickCode())
  }

  handlePlaylistVideoMoved(movedPickCode: string) {
    const deps = this.deps
    if (!deps) return
    if (!movedPickCode) return

    const playlist = deps.getPlaylist()
    const beforeCount = playlist.items.length
    playlist.setItems(playlist.items.filter(item => item.pickCode !== movedPickCode))
    if (playlist.items.length === beforeCount) return

    playlist.syncOverlayPlaybackNav()
    deps.updatePlaylist(playlist.items)
  }

  getPlaylistItemParentId(item: OverlayPlaylistItem): string {
    const deps = this.deps
    if (!deps) return ''
    if (item.pickCode === deps.getCurrentPickCode()) {
      return this.currentParentId()
    }
    return item.cid || readPlaylistCidFromLocation(window.location.search) || this.currentParentId()
  }

  currentParentId(): string {
    const meta = readOverlayMetaFromQuery()
    return meta.cid || meta.parentId || '0'
  }

  async toggleFavorite(fileId: string, nextMarked: boolean): Promise<boolean> {
    const deps = this.deps
    if (!deps) return !nextMarked
    if (!fileId) return !nextMarked

    const result = await updateFavoriteStatus(sendRuntimeMessageSafe, fileId, nextMarked)
    if (result === nextMarked) {
      window.history.replaceState(null, '', buildUpdatedMarkedUrl(window.location.pathname, window.location.search, nextMarked))
    }
    return result
  }

  async deleteCurrentVideo(fileId: string, parentId: string, pickCode: string): Promise<void> {
    await this.deleteVideoFromPlaylist({ fileId, parentId, pickCode, navigateAfterDelete: true })
  }

  async deletePlaylistVideo(item: OverlayPlaylistItem): Promise<void> {
    const deps = this.deps
    if (!deps) return
    if (!item.fileId || !item.pickCode) {
      deps.onShowToast('缺少删除参数')
      return
    }
    await this.deleteVideoFromPlaylist({
      fileId: item.fileId,
      parentId: this.getPlaylistItemParentId(item),
      pickCode: item.pickCode,
      navigateAfterDelete: item.pickCode === deps.getCurrentPickCode(),
    })
  }

  async fetchFileFavoriteStatus(_fileId: string): Promise<void> {
    const deps = this.deps
    if (!deps) return
    const requestPickCode = deps.getCurrentPickCode()
    try {
      const favoriteStatus = await fetchFavoriteStatus(sendRuntimeMessageSafe, requestPickCode)
      if (requestPickCode !== deps.getCurrentPickCode()) return
      if (favoriteStatus !== null) {
        deps.updateFavoriteStatus(favoriteStatus)
        // 同步更新 URL 的 marked 参数，避免刷新后读到旧值
        window.history.replaceState(null, '', buildUpdatedMarkedUrl(window.location.pathname, window.location.search, favoriteStatus))
      }
    } catch {
      // 低优先级请求失败静默
    }
  }

  destroy() {
    this.deps = null
  }

  // ─── 内部方法 ───

  private async deleteVideoFromPlaylist(params: {
    fileId: string
    parentId: string
    pickCode: string
    navigateAfterDelete: boolean
  }): Promise<void> {
    const deps = this.deps
    if (!deps) return
    const { fileId, parentId, pickCode, navigateAfterDelete } = params
    const playlist = deps.getPlaylist()
    const items = await playlist.fetchPlaylistItems().catch(() => playlist.items)
    const { nextPickCode } = getDeleteFallback(items, pickCode)
    const keepPlaylistOpen = deps.getKeepPlaylistOpenOnInit() || deps.isPlaylistExpanded()

    await deleteVideoFile(sendRuntimeMessageSafe, fileId, parentId, pickCode)

    playlist.setItems(playlist.items.filter(item => item.pickCode !== pickCode))
    playlist.syncOverlayPlaybackNav()
    deps.updatePlaylist(playlist.items)

    if (!navigateAfterDelete) {
      deps.onShowToast('已删除')
      return
    }

    if (nextPickCode) {
      deps.navigateToVideo(nextPickCode, keepPlaylistOpen, true)
      return
    }

    if (window.history.length > 1) {
      window.history.back()
      return
    }

    window.close()
  }
}
