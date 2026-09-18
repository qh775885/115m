/**
 * 115m 2.0 · 内容状态树
 * 承载视频元信息与播放列表；与播放瞬时状态（player-state）分离。
 */

import type { OverlayPathItem, OverlayPlaylistItem } from '../../core/overlay-types'
import { Store } from './store'

export type PlaybackMode = 'sequence' | 'loop-one' | 'loop-all'

export interface ContentState {
  /** 当前视频 pickCode */
  pickCode: string
  /** 所在目录 cid */
  cid: string
  title: string
  fileSize: string
  isFavorite: boolean
  /** 播放列表（同目录剧集） */
  playlist: OverlayPlaylistItem[]
  /** 面包屑路径 */
  path: OverlayPathItem[]
  /** 当前集序号（1 起，0 表示未知） */
  currentIndex: number
  /** 可选清晰度标签列表 */
  qualities: string[]
  /** 当前清晰度标签 */
  quality: string
  /** 可选字幕列表 */
  subtitles: { sid: string, title: string }[]
  /** 当前字幕 sid（'' 表示关闭） */
  subtitle: string
  /** 播放模式 */
  mode: PlaybackMode
  /** 是否正在切换集数 */
  switching: boolean
}

export const initialContentState: ContentState = {
  pickCode: '',
  cid: '',
  title: '',
  fileSize: '',
  isFavorite: false,
  playlist: [],
  path: [],
  currentIndex: 0,
  qualities: [],
  quality: '',
  subtitles: [],
  subtitle: '',
  mode: 'sequence',
  switching: false,
}

export function createContentStore(): Store<ContentState> {
  return new Store<ContentState>({ ...initialContentState })
}
