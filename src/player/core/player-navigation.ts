import type { OverlayPlaylistItem } from './overlay-types'
import { getPlaylistPosition } from './playlist-navigation'

export function getPreviousPlaylistItem(items: OverlayPlaylistItem[], pickCode: string) {
  return getPlaylistPosition(items, pickCode).previous
}

export function getNextPlaylistItem(items: OverlayPlaylistItem[], pickCode: string) {
  return getPlaylistPosition(items, pickCode).next
}

export function getPlaybackEndCountdownPlan(items: OverlayPlaylistItem[], pickCode: string) {
  const next = getNextPlaylistItem(items, pickCode)
  if (!next) {
    return { next: null, countdownSec: 0 }
  }

  return {
    next,
    countdownSec: 3,
  }
}
