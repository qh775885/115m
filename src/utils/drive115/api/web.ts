import type { MoviesSubtitleItem, PathItem, PlaylistItem } from './entity'

/** 获取文件列表 */
export interface GetFiles {
  pickcode?: string
  aid: number
  /** 目录id */
  cid: string
  /** 偏移量 */
  offset: number
  /** 限制数量 */
  limit: number
  /** 是否显示目录 */
  show_dir: number
  nf: string
  qid: number
  /** 1.文档；2.图片；3.音乐；4.视频；5.压缩；6.应用；7.书籍 */
  type: number
  source: string
  /** 返回格式 */
  format: string
  /** 是否星标 mark */
  star: string

  is_q: string
  is_share: string
  r_all: number
  /** 排序方式 */
  o: string
  /** 是否升序 */
  asc: number
  /** 当前页 */
  cur: number
  /** 是否自然排序 */
  natsort: number
}

/** 获取视频文件信息请求 */
export interface GetFilesVideo {
  pickcode: string
  share_id: string
  local: string
}

/** 文件星标状态 */
export enum MarkStatus {
  Mark = '1',
  Unmark = '0',
}

/** 文件星标请求 */
export interface FilesStar {
  file_id: string
  star: MarkStatus
}

/** 播放历史请求基础 */
interface FilesHistoryBase {
  category: '1'
  share_id: string
  pick_code: string
}

/** 获取播放历史请求 */
export type GetFilesHistory = FilesHistoryBase & {
  fetch: 'one'
}

/** 更新播放历史请求 */
export type PostFilesHistory = FilesHistoryBase & {
  op: 'update'
  time: number
  definition: '0'
}

/** 获取电影字幕请求 */
export interface GetMoviesSubtitle {
  pickcode: string
}

/** 基础类型 */
type Base<T> = {
  state: boolean
  errNo: number
} & T

/** 获取文件列表 */
export type Files = Base<{
  data: PlaylistItem[]
  path: PathItem[]
}>

/** 应用浏览器下载 */
export type FilesAppChromeDown = Base<{
  data: {
    [key: string]: {
      url: {
        url: string
      }
    }
  }
}>

/** 下载 */
export type FilesDownload = Base<{
  file_url: string
}>

/** 视频文件信息 */
export type FilesVideo = Base<{
  /** 是否开启内嵌字幕 */
  inlay_power: number
  /** 是否开启视频推送 */
  video_push_state: boolean
  /** 下载地址 */
  download_url: string[]
  /** 文件状态 */
  file_status: number
  /** 缩略图 */
  thumb_url: string
  /** 视频高度 */
  height: string
  /** 视频宽度 */
  width: string
  /** 视频地址 */
  video_url: string
  /** 视频地址（demo） */
  video_url_demo: string
  /** 定义列表 */
  definition_list: {
    [key: string]: string
  }
  /** 多轨道列表 */
  multitrack_list: string[]
  /** 播放时长 */
  play_long: string
  /** 字幕信息 */
  subtitle_info: string[]
  /** 大纲信息 */
  outline_info: string[]
  /** 选集代码 */
  pick_code: string
  /** 文件名 */
  file_name: string
  /** 文件大小 */
  file_size: string
  /** 父级ID */
  parent_id: string
  /** 文件ID */
  file_id: string
  /** 是否标记 */
  is_mark: string
  /** SHA1 */
  sha1: string
  /** 音频列表 */
  audio_list: string
  /** 用户定义 */
  user_def: number
  /** 用户旋转 */
  user_rotate: number
  /** 用户翻转 */
  user_turn: number
}>

/** 收藏 */
export type FilesStarRes = Base<unknown>

/** 播放历史 */
export type FilesHistory = Base<{
  data: {
    add_time: number
    category: number
    file_name: string
    hash: string
    pick_code: string
    thumb: string
    time: number
  }
}>

/** 电影字幕 */
export type MoviesSubtitle = Base<{
  data: {
    autoload: MoviesSubtitleItem
    list: MoviesSubtitleItem[]
  }
}>

// eslint-disable-next-line ts/no-namespace
export namespace Req {
  export type GetFiles = import('./web').GetFiles
  export type GetFilesVideo = import('./web').GetFilesVideo
  export type FilesStar = import('./web').FilesStar
  export type GetFilesHistory = import('./web').GetFilesHistory
  export type PostFilesHistory = import('./web').PostFilesHistory
  export type GetMoviesSubtitle = import('./web').GetMoviesSubtitle
}

// eslint-disable-next-line ts/no-namespace
export namespace Res {
  export type Files = import('./web').Files
  export type FilesAppChromeDown = import('./web').FilesAppChromeDown
  export type FilesDownload = import('./web').FilesDownload
  export type FilesVideo = import('./web').FilesVideo
  export type FilesStar = import('./web').FilesStarRes
  export type FilesHistory = import('./web').FilesHistory
  export type MoviesSubtitle = import('./web').MoviesSubtitle
}
