import type { FetchIO } from './FetchIO'

/**
 * 分块读取器
 */
export class ChunkReader {
  static readonly DEFAULT_LIMIT = 188 * 1024 * 2
  private offset: number = 0
  private limit: number = 0
  private io: FetchIO
  private url: string
  private count: number = 0
  private stoped: boolean = false
  private doned: boolean = false

  private endOffset?: number

  constructor(
    url: string,
    io: FetchIO,
    offset: number,
    limit: number = ChunkReader.DEFAULT_LIMIT,
    endOffset?: number,
  ) {
    this.url = url
    this.io = io
    this.offset = offset
    this.limit = limit
    this.endOffset = endOffset
  }

  get isStoped() {
    return this.stoped
  }

  get isDoned() {
    return this.doned
  }

  from(offset: number) {
    this.offset = offset
    return this
  }

  take(limit: number) {
    this.limit = limit
    return this
  }

  stop() {
    this.stoped = true
  }

  async _read(start: number, end: number) {
    const res = await this.io.fetchBufferRange(this.url, start, end)
    return res
  }

  async next(): Promise<ArrayBuffer | undefined> {
    if (this.doned) {
      throw new Error('chunk reader is done')
    }

    this.count++
    const start = this.offset
    
    // Calculate the planned end byte index
    let end = this.limit === 0 ? undefined : this.offset + this.limit - 1
    
    // Clamp to endOffset if provided
    if (this.endOffset !== undefined) {
      if (start > this.endOffset) {
        this.doned = true
        return undefined
      }
      if (end === undefined || end > this.endOffset) {
        end = this.endOffset
      }
    }

    const res = await this._read(start, end ?? start)
    const contentLength = parseInt(res.headers.get('content-length') ?? '0')

    if (res.status === 206) {
      // 用实际读取的字节数推进偏移量
      const advanced = contentLength > 0 ? contentLength : (end !== undefined ? end - start + 1 : this.limit)
      this.offset = start + advanced

      if (this.endOffset !== undefined && this.offset > this.endOffset) {
        this.doned = true
      } else if (contentLength > 0 && contentLength < (end !== undefined ? end - start + 1 : this.limit)) {
        this.doned = true
      }
      return res.arrayBuffer()
    }

    if (res.status === 416) {
      this.doned = true
      return undefined
    }

    // 服务器不支持 Range（返回 200 全量内容）：单次请求已取完所有数据，
    // 标记完成，避免 autoReadChunk 反复重读同一份数据直到超时
    this.doned = true
    return res.arrayBuffer()
  }
}
