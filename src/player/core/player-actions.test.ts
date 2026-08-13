// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlayerActionsController, type ActionsControllerDeps } from './player-actions'
import { PlayerPlaylistController } from './player-playlist'

function createController() {
  const playlist = new PlayerPlaylistController()
  const playlistItems = [
    { pickCode: 'pick-1', fileId: 'f1', name: '第一集', type: 'video' as const },
    { pickCode: 'pick-2', fileId: 'f2', name: '第二集', type: 'video' as const },
  ]
  playlist.setItems(playlistItems as any)

  const getCurrentPickCode = vi.fn(() => 'pick-1')
  const getPlaylist = vi.fn(() => playlist)
  const getKeepPlaylistOpenOnInit = vi.fn(() => false)
  const navigateToVideo = vi.fn()
  const updatePlaylist = vi.fn()
  const updateBreadcrumbs = vi.fn()
  const updateFavoriteStatus = vi.fn()
  const isPlaylistExpanded = vi.fn(() => false)
  const onShowToast = vi.fn()

  const deps: ActionsControllerDeps = {
    getCurrentPickCode,
    getPlaylist,
    getKeepPlaylistOpenOnInit,
    navigateToVideo,
    updatePlaylist,
    updateBreadcrumbs,
    updateFavoriteStatus,
    isPlaylistExpanded,
    onShowToast,
  }
  const controller = new PlayerActionsController()
  controller.attach(deps)
  return {
    controller, playlist, deps,
    getCurrentPickCode, getPlaylist, navigateToVideo,
    updatePlaylist, updateBreadcrumbs, updateFavoriteStatus, onShowToast, isPlaylistExpanded,
  }
}

function mockUrlSearch(search: string) {
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { search, pathname: '/player', history: window.history },
  })
}

describe('PlayerActionsController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetchBreadcrumbs 从 URL 参数读取路径并更新', async () => {
    const path = encodeURIComponent(JSON.stringify([{ cid: 'c1', name: '文件夹' }]))
    mockUrlSearch(`?pickCode=pick-1&path=${path}`)
    const { controller, updateBreadcrumbs } = createController()
    await controller.fetchBreadcrumbs('pick-1')
    expect(updateBreadcrumbs).toHaveBeenCalled()
  })

  it('handlePlaylistVideoMoved 从缓存移除并同步', () => {
    const { controller, getPlaylist, updatePlaylist } = createController()
    controller.handlePlaylistVideoMoved('pick-2')
    expect(getPlaylist().items).toHaveLength(1)
    expect(updatePlaylist).toHaveBeenCalled()
  })

  it('handlePlaylistVideoMoved 空参数忽略', () => {
    const { controller, getPlaylist, updatePlaylist } = createController()
    controller.handlePlaylistVideoMoved('')
    expect(getPlaylist().items).toHaveLength(2)
    expect(updatePlaylist).not.toHaveBeenCalled()
  })

  it('getPlaylistItemParentId 当前集用 currentParentId', () => {
    const { controller } = createController()
    expect(controller.getPlaylistItemParentId({ pickCode: 'pick-1', fileId: 'f1' } as any)).toBe('0')
  })

  it('toggleFavorite 无 fileId 时原样返回', async () => {
    const { controller } = createController()
    expect(await controller.toggleFavorite('', true)).toBe(false)
  })

  it('deletePlaylistVideo 缺少参数时提示', async () => {
    const { controller, onShowToast } = createController()
    await controller.deletePlaylistVideo({ fileId: '', pickCode: '' } as any)
    expect(onShowToast).toHaveBeenCalledWith('缺少删除参数')
  })

  it('fetchFileFavoriteStatus 请求失败静默', async () => {
    const { controller } = createController()
    await expect(controller.fetchFileFavoriteStatus('f1')).resolves.toBeUndefined()
  })

  it('movePlaylistVideo 缺少 fileId 时提示', async () => {
    const { controller, onShowToast } = createController()
    await controller.movePlaylistVideo({ fileId: '', pickCode: 'pick-1' } as any)
    expect(onShowToast).toHaveBeenCalledWith('文件 ID 缺失')
  })
})
