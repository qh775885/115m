import { Icons } from '../../shared/icons'

export type PlaylistViewMode = 'card' | 'compact'

export const PLAYLIST_VIEW_MODE_STORAGE_KEY = '115m-playlist-view-mode'

const listeners = new Set<(mode: PlaylistViewMode) => void>()

export function getPlaylistViewMode(): PlaylistViewMode {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(PLAYLIST_VIEW_MODE_STORAGE_KEY)
      if (saved === 'compact' || saved === 'card') {
        return saved
      }
    }
  }
  catch {
    // 忽略沙盒/隐私模式下的存储异常
  }
  return 'card'
}

export function setPlaylistViewMode(mode: PlaylistViewMode): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PLAYLIST_VIEW_MODE_STORAGE_KEY, mode)
    }
  }
  catch {
    // ignore
  }
  listeners.forEach(fn => fn(mode))
}

export function togglePlaylistViewMode(): PlaylistViewMode {
  const next = getPlaylistViewMode() === 'card' ? 'compact' : 'card'
  setPlaylistViewMode(next)
  return next
}

export function onPlaylistViewModeChange(callback: (mode: PlaylistViewMode) => void): () => void {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

export function renderPlaylistViewModeToggleBtn(currentMode: PlaylistViewMode): string {
  const isCard = currentMode === 'card'
  const title = isCard ? '切换为紧凑列表（隐藏预览图）' : '切换为图文列表（显示预览图）'
  const activeClass = isCard ? 'active' : ''
  return `
    <button type="button" class="m115-v2-icon-action m115-playlist-view-toggle ${activeClass}" style="width:28px;height:28px;" title="${title}" aria-label="${title}">
      ${Icons.Image()}
    </button>
  `
}
