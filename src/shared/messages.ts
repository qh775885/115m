import type { M3u8Item } from '../lib/types'
import type { FileItem } from '../lib/api/types'

export interface NativePlayHistoryRecord {
  pickCode: string
  currentTime: number
  watchEnd?: boolean
}

export interface RuntimeSuccessResponse {
  success: true
}

export interface RuntimeMainWorldResponse {
  ok: boolean
  text: string
  status?: number
  error?: string
}

export type RuntimeDeleteFileResponse =
  | { ok: true }
  | { ok: false, error: string }

export type RuntimeTranscodeState =
  | 'queued'
  | 'pending_check'
  | 'completed_refresh'
  | 'no_task'
  | 'manual_required'
  | 'failed'

export interface RuntimeTranscodeResponse {
  ok: boolean
  state: RuntimeTranscodeState
  error?: string
  detail?: string
  queueCount?: number
  etaSeconds?: number
  priority?: number
  pushAccepted?: boolean
  batchQueued?: number
  batchTotal?: number
  batchSkipped?: number
  autoFallback?: boolean
  nativeFallback?: boolean
  deduped?: true
  batchFileIds?: string[]
}

export type RuntimeTranscodeFrameReadyResponse =
  | { ok: true, frameId: number }
  | { ok: false, error: string }

export interface FetchM3u8Response {
  list?: M3u8Item[]
  error?: string
}

export interface FetchM3u8TextResponse {
  text?: string
  error?: string
}

export type OpenTabResponse = RuntimeSuccessResponse & {
  deduped?: true
}

export interface SubtitleItem {
  sid: string
  title: string
  url: string
  type: string
  language?: string
  sha1?: string
}

/** 115 字幕接口原始响应（可能含 list / autoload / sub_list 多种形状，由播放器侧 normalize） */
export interface FetchSubtitlesResponse {
  data?: {
    list?: SubtitleItem[]
    autoload?: SubtitleItem
    sub_list?: SubtitleItem[]
    [key: string]: unknown
  }
  list?: SubtitleItem[]
  error?: string
}

export interface MsgSetCookie {
  type: 'SET_COOKIE'
  data: {
    name: string
    value: string
    path: string
    domain: string
    secure: boolean
    expirationDate: number
    sameSite: string
  }
}
export interface MsgGetNativeHistory {
  type: 'GET_NATIVE_HISTORY'
  data: { pickCode: string, shareId?: string }
}

export interface MsgGetNativeHistoryMap {
  type: 'GET_NATIVE_HISTORY_MAP'
  data: { pickCodes: string[], shareId?: string }
}

export interface MsgSetNativeHistory {
  type: 'SET_NATIVE_HISTORY'
  data: {
    pickCode: string
    currentTime: number
    definition?: number
    shareId?: string
  }
}

export interface MsgOpenTab {
  type: 'OPEN_TAB'
  url: string
}

export interface MsgFetchM3u8 {
  type: 'FETCH_M3U8'
  data: { pickCode: string }
}

export interface MsgFetchM3u8Text {
  type: 'FETCH_M3U8_TEXT'
  data: { pickCode: string }
}

export interface MsgFetchSubtitles {
  type: 'FETCH_SUBTITLES'
  data: { pickCode: string }
}

export interface MsgMainWorldFetch {
  type: 'MAIN_WORLD_FETCH'
  data: { url: string, body: string, contentType?: string }
}

export interface MsgMainWorldGet {
  type: 'MAIN_WORLD_GET'
  data: { url: string }
}

export interface MsgTranscodeFrameReady {
  type: 'TRANSCODE_FRAME_READY'
  data: { pickCode: string }
}

export interface MsgFetchPlaylist {
  type: 'FETCH_PLAYLIST'
  data: { cid: string, pickCode?: string }
}

export interface MsgDeleteFile {
  type: 'DELETE_FILE'
  data: {
    fileId: string
    parentId: string
    pickCode: string
  }
}

export interface MsgPing {
  type: 'PING'
}

export interface MsgTranscode {
  type: 'TRANSCODE_ACCELERATE'
  data: { pickCode: string, batchFolder?: boolean, batchLimit?: number }
}

export interface MsgTranscodeStatus {
  type: 'TRANSCODE_STATUS'
  data: { pickCode: string }
}

export interface MsgTranscodeNativeFallback {
  type: 'TRANSCODE_NATIVE_FALLBACK'
  data: { pickCode: string }
}

export interface MsgFetchPlaylistResponse {
  list?: FileItem[]
  path?: Array<{ cid: string, name: string }>
  error?: string
}

export interface MsgRequestMoveRefresh {
  type: 'REQUEST_MOVE_REFRESH'
}

export interface MsgMoveRefreshed {
  type: 'MOVE_REFRESHED'
}

export interface MsgDeleteRefreshed {
  type: 'DELETE_REFRESHED'
  data: {
    fileId: string
    parentId: string
    pickCode: string
  }
}

export type RuntimeMessage =
  | MsgSetCookie
  | MsgGetNativeHistory
  | MsgGetNativeHistoryMap
  | MsgSetNativeHistory
  | MsgOpenTab
  | MsgFetchM3u8
  | MsgFetchM3u8Text
  | MsgFetchSubtitles
  | MsgMainWorldFetch
  | MsgMainWorldGet
  | MsgTranscodeFrameReady
  | MsgFetchPlaylist
  | MsgDeleteFile
  | MsgPing
  | MsgRequestMoveRefresh
  | MsgTranscode
  | MsgTranscodeStatus
  | MsgTranscodeNativeFallback

export type RuntimeTabNotification =
  | MsgMoveRefreshed
  | MsgDeleteRefreshed

export interface RuntimeMessageResponseMap {
  PING: { pong: true }
  SET_COOKIE: RuntimeSuccessResponse
  OPEN_TAB: OpenTabResponse
  GET_NATIVE_HISTORY: NativePlayHistoryRecord | null
  GET_NATIVE_HISTORY_MAP: Record<string, NativePlayHistoryRecord>
  SET_NATIVE_HISTORY: { success: boolean }
  FETCH_M3U8: FetchM3u8Response
  FETCH_M3U8_TEXT: FetchM3u8TextResponse
  FETCH_SUBTITLES: FetchSubtitlesResponse
  FETCH_PLAYLIST: MsgFetchPlaylistResponse
  MAIN_WORLD_FETCH: RuntimeMainWorldResponse
  MAIN_WORLD_GET: RuntimeMainWorldResponse
  DELETE_FILE: RuntimeDeleteFileResponse
  TRANSCODE_FRAME_READY: RuntimeTranscodeFrameReadyResponse
  TRANSCODE_ACCELERATE: RuntimeTranscodeResponse
  TRANSCODE_STATUS: RuntimeTranscodeResponse
  TRANSCODE_NATIVE_FALLBACK: RuntimeTranscodeResponse
  REQUEST_MOVE_REFRESH: RuntimeSuccessResponse
}

export type RuntimeMessageResponse<T extends RuntimeMessage> =
  T['type'] extends keyof RuntimeMessageResponseMap
    ? RuntimeMessageResponseMap[T['type']]
    : unknown
