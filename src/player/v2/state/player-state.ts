/**
 * 115m 2.0 · 播放状态树（初稿）
 * 只存放与播放内核直接相关的瞬时状态；内容 / 源 / 交互态后续按需扩展。
 */

export interface AudioTrackInfo {
  id: string
  label: string
}

export interface PlayerState {
  /** 当前播放时间（秒） */
  currentTime: number
  /** 总时长（秒），0 表示尚未就绪 */
  duration: number
  /** 已缓冲比例 0~1 */
  buffered: number
  /** 是否暂停 */
  paused: boolean
  /** 音量 0~1 */
  volume: number
  /** 是否静音 */
  muted: boolean
  /** 倍速 */
  rate: number
  /** 是否正在拖拽进度（拖拽期间内核时间回调不覆盖 UI） */
  dragging: boolean
  /** 可用音频轨道 */
  audioTracks: AudioTrackInfo[]
  /** 当前音频轨道 id */
  audioTrack: string
  /** 视频画面原始宽高（用于预览框比例） */
  videoWidth: number
  videoHeight: number
}

export const initialPlayerState: PlayerState = {
  currentTime: 0,
  duration: 0,
  buffered: 0,
  paused: true,
  volume: 1,
  muted: false,
  rate: 1,
  dragging: false,
  audioTracks: [],
  audioTrack: '',
  videoWidth: 0,
  videoHeight: 0,
}
