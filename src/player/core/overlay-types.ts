/**
 * Overlay 领域类型：播放器 overlay 的纯类型定义。
 * 与 UI 实现解耦，供领域/服务模块引用，避免依赖最大 UI 模块（overlay.ts）。
 */

export interface OverlayPathItem {
  cid: string
  name: string
}

export interface OverlayPlaylistItem {
  pickCode: string
  fileId: string
  name: string
  size?: string
  isMarked?: boolean
  duration?: number
  sha?: string
  cid?: string
  progressSec?: number
  progressPercent?: number
}

export interface PlayerOverlayMeta {
  title: string
  fileSize: string
  fileId: string
  cid: string
  parentId: string
  isMarked: boolean
  path: OverlayPathItem[]
}

export interface OverlayPlaybackNavState {
  hasPrevious: boolean
  hasNext: boolean
  previousTitle?: string
  nextTitle?: string
  currentIndex?: number
  totalCount?: number
}

export interface OverlayPlaybackEndState {
  mode: 'autoplay-next' | 'ended'
  nextTitle?: string
  countdownSec?: number
}
