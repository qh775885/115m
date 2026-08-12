import { ChunkReader } from './ChunkIO'
import { fetchWithTimeout } from '../../promise'

/**
 * FetchIO 类 - 负责从URL获取指定范围的视频数据
 * 处理数据块的读取和管理，支持缓存和请求去重
 */
export class FetchIO {
  /** 网络请求超时（毫秒），防止弱网/不响应时 fetch 永久挂起 */
  static readonly REQUEST_TIMEOUT_MS = 15000

  /**
   * 创建分块读取器
   * @param url 目标URL
   * @param start 起始位置
   * @param limit 限制大小
   * @returns 分块读取器
   */
  createChunkReader(url: string, start: number, limit: number = ChunkReader.DEFAULT_LIMIT, endOffset?: number): ChunkReader {
    return new ChunkReader(url, this, start, limit, endOffset)
  }

  /**
   * 从URL获取指定范围的ArrayBuffer
   * @param url 目标URL
   * @param start 起始字节
   * @param end 结束字节
   * @returns 获取到的Response
   */
  async fetchBufferRange(
    url: string,
    start: number,
    end?: number,
  ): Promise<Response> {
    return await fetchWithTimeout(
      url,
      {
        headers: {
          Range: `bytes=${start}-${end ?? ''}`,
        },
      },
      FetchIO.REQUEST_TIMEOUT_MS,
    )
  }
}
