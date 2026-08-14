import type { OverlayPlaybackNavState } from './overlay-types'
import type { OverlayPlaylistItem } from './overlay-types'

export interface PlaylistPosition {
  index: number
  totalCount: number
  previous: OverlayPlaylistItem | null
  current: OverlayPlaylistItem | null
  next: OverlayPlaylistItem | null
}

export interface PlaylistDeleteFallback {
  nextPickCode: string | null
}

export function getPlaylistPosition(items: OverlayPlaylistItem[], pickCode: string): PlaylistPosition {
  const index = items.findIndex(item => item.pickCode === pickCode)
  return {
    index,
    totalCount: items.length,
    previous: index > 0 ? items[index - 1] : null,
    current: index >= 0 ? items[index] : null,
    next: index >= 0 && index < items.length - 1 ? items[index + 1] : null,
  }
}

export function buildPlaybackNavState(position: PlaylistPosition): OverlayPlaybackNavState {
  return {
    hasPrevious: !!position.previous,
    hasNext: !!position.next,
    previousTitle: position.previous?.name,
    nextTitle: position.next?.name,
    currentIndex: position.index >= 0 ? position.index + 1 : undefined,
    totalCount: position.index >= 0 ? position.totalCount : undefined,
  }
}

export function getDeleteFallback(items: OverlayPlaylistItem[], pickCode: string): PlaylistDeleteFallback {
  const position = getPlaylistPosition(items, pickCode)
  return {
    nextPickCode: position.next?.pickCode || position.previous?.pickCode || null,
  }
}
