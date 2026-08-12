import type { Segment as M3U8Segment } from 'm3u8-parser'
import { Parser } from 'm3u8-parser'
import { FetchIO } from './FetchIO'
import { fetchWithTimeout } from '../../promise'

/**
 * 请求信息
 */
interface FetchInfo {
  /** 请求 URL */
  url: string
  /** 请求头 */
  headers?: Record<string, string>
  /** 请求选项 */
  fetchOptions?: RequestInit
}

/**
 * 分段
 */
export type Segment = M3U8Segment & {
  /** 分段 URL */
  url: string
  /** 分段时间戳 */
  timestamp: number
  /** 分段结束时间 */
  endTime: number
  /** 分段字节范围 */
  byterange?: { length: number; offset: number }
}

/**
 * HlsIO 类 - 负责从URL获取指定范围的视频数据
 * 处理数据块的读取和管理
 */
export class HlsIO extends FetchIO {
  /** 请求信息 */
  info: FetchInfo | undefined

  /** 当前分片索引 */
  segmentIndex = 0

  /** 分片列表 */
  segments: Segment[] = []

  /** 总时长 */
  duration = 0

  constructor() {
    super()
  }

  /**
   * 打开
   * @param info 请求信息
   */
  async open(info: FetchInfo): Promise<void> {
    this.info = info
    await this.fetchMasterPlaylist()
  }

  /**
   * 读取分片
   * @param time 时间/秒
   * @returns 读取到的分片
   */
  readSegment(time: number): Segment {
    const index = this.segments.findIndex(
      i => i.timestamp <= time && time <= i.endTime,
    )
    if (index === -1) {
      throw new Error('时间超出范围')
    }
    return this.segments[index]
  }

  /**
   * 销毁
   */
  destroy() {
    this.segments = []
    this.duration = 0
    this.info = undefined
  }

  /**
   * 获取主播放列表
   */
  private async fetchMasterPlaylist(): Promise<void> {
    if (!this.info) {
      throw new Error('info is undefined')
    }
    const response = await fetchWithTimeout(
      this.info.url,
      { headers: this.info.headers },
      FetchIO.REQUEST_TIMEOUT_MS,
    )
    const m3u8Text = await response.text()
    const parser = new Parser({
      uri: this.info.url,
    })
    parser.push(m3u8Text)
    parser.end()
    let start = 0
    this.segments = parser.manifest.segments.map((segment) => {
      const timestamp = start
      start += segment.duration
      return {
        ...segment,
        duration: segment.duration,
        timestamp,
        endTime: timestamp + segment.duration,
        url: new URL(segment.uri, this.info?.url).href,
      }
    })
    this.duration = start
  }
}
