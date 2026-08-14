import type { FrameData } from './DecoderFlow'
import type { Logger } from '../logger'
import { appLogger } from '../logger'
import { DecoderFlow } from './DecoderFlow'
import { HlsIO } from './io/HlsIO'

/** 超时时间 */
const TIMEOUT_MS = 5000

/**
 * M3U8 视频剪辑器构造选项
 */
interface M3U8ClipperOptions {
  /** m3u8 url */
  url: string
  /** 请求头 */
  headers?: Record<string, string>
  /** 请求选项 */
  fetchOptions?: RequestInit
}

/**
 * M3U8 视频剪辑器
 */
export class M3U8ClipperNew {
  hlsIo: HlsIO
  protected logger = appLogger.sub('M3U8ClipperNew')
  constructor(private options: M3U8ClipperOptions) {
    this.hlsIo = new HlsIO()
    this.logger.enableSilentMode()
  }

  /**
   * 销毁
   */
  destroy() {
    this.hlsIo.destroy()
  }

  /**
   * 打开
   * @description 打开 m3u8 文件
   */
  async open(): Promise<void> {
    await this.hlsIo.open(this.options)
  }

  /**
   * 跳转
   * @description 跳转到分片截取 VideoFrame
   * @param time 时间/秒
   * @param firstFramePriority 首帧优先
   * @param samplingInterval 采样间隔(秒)，采样间隔如果大于 segment.duration, 则自动开启 firstFramePriority
   * @param logger 日志
   * @returns 视频帧
   */
  async seek(
    time: number,
    firstFramePriority = true,
    samplingInterval = 1,
    logger?: Logger,
  ): Promise<FrameData | undefined> {
    logger = logger ?? this.logger.sub(`seek ${time}s`)
    const segment = this.hlsIo.readSegment(time)
    if (samplingInterval > segment.duration) {
      logger.warn(`samplingInterval ${samplingInterval}s is greater than segment.duration ${segment.duration}s, auto enable firstFramePriority`)
      firstFramePriority = true
    }
    const targetTime = time

    try {
      const frameData = await this._seekWithSegment(segment, targetTime, firstFramePriority, logger)
      if (frameData) {
        logger.debug('seek success frameData', frameData)
        return frameData
      }
      return undefined
    }
    catch (error) {
      logger.error('seek error', error)
      throw error
    }
  }

  /**
   * 使用指定片段进行跳转
   * @param segment 片段
   * @param targetTime 目标时间
   * @param firstFramePriority 首帧优先
   * @param logger 日志
   * @returns 视频帧
   */
  private async _seekWithSegment(
    segment: ReturnType<typeof this.hlsIo.readSegment>,
    targetTime: number,
    firstFramePriority: boolean,
    logger: Logger,
  ): Promise<FrameData | undefined> {
    const decoderFlow = new DecoderFlow({
      targetTime,
      baseTime: segment.timestamp,
      segmentUrl: segment.url,
      segmentByterange: segment.byterange,
      firstFramePriority,
      io: this.hlsIo,
      logger,
    })

    decoderFlow.initialize()

    try {
      const frameData = await decoderFlow.waitForFrame(TIMEOUT_MS)
      return frameData
    }
    finally {
      decoderFlow.destroy()
    }
  }
}
