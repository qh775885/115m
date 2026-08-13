import type { AVCFrame } from '@cbingbing/demuxer'
import type { AvcFrameData } from './demuxerTsNew'
import { ChunkReader } from './io/ChunkIO'
import type { FetchIO } from './io/FetchIO'
import type { Logger } from '../logger'
import { appLogger } from '../logger'
import { promiseDelay } from '../promise'
import { DecoderFlowError } from './DecoderFlowError'
import { DemuxerTsNew } from './demuxerTsNew'
import { microsecTimebase, secTimebase, timebaseConvert } from './timebase'

/**
 * M3U8 视频剪辑器跳转结果
 */
export interface FrameData {
  /** 视频帧 */
  videoFrame: VideoFrame
  /** 帧实际时间(秒) */
  frameTime: number
  /** 请求时间(秒) */
  seekTime: number
  /** 消耗时间(毫秒) */
  consumedTime: number
}

export interface SampleQueueItem extends AvcFrameData {
  encodedChunk: EncodedVideoChunk
}

export interface DecoderFlowOptions {
  /** 目标时间/秒 */
  targetTime: number
  /** 基础时间/秒，它用于校准视频帧时间 */
  baseTime: number
  /** 分片 URL */
  segmentUrl: string
  /** 分片字节范围 */
  segmentByterange?: { length: number; offset: number }
  /** 首帧优先 */
  firstFramePriority: boolean
  /** 输入输出流 */
  io: FetchIO
  /** 日志 */
  logger?: Logger
}
/**
 * 解码器流
 * @description 负责管理 VideoDecoder、Demuxer 和解码循环逻辑
 */
export class DecoderFlow {
  static readonly LOGGER_NAME = 'DecoderFlow'
  static readonly PRECISE_FINISH_WINDOW = 0.4
  static readonly PRECISE_OVERSHOOT_LIMIT = 1.2
  /** 已找到帧后，允许继续逼近 targetTime 的宽限期（毫秒）。
   *  避免大分片/慢网下精确模式每次都拖满超时（5s）才返回帧 */
  static readonly FRAME_GRACE_MS = 1500
  /** 空闲轮询间隔（毫秒）。样本队列/解码队列为空时不再 setTimeout(0) 忙等，
   *  解码推进由 WebCodecs 回调（ondequeue/output）驱动，轮询仅做兜底检查 */
  static readonly IDLE_POLL_MS = 30
  /** samplesProcessed 保留条数上限（调试/状态统计用，超出后丢弃最旧的） */
  static readonly MAX_KEPT_SAMPLES = 64
  protected logger = appLogger.sub(DecoderFlow.LOGGER_NAME)
  private videoDecoder: VideoDecoder | undefined
  private demuxer: DemuxerTsNew | undefined
  private sampleQueue: SampleQueueItem[] = []
  private samplesProcessed: SampleQueueItem[] = []
  private decodedFramesTimes: number[] = []
  private frame: VideoFrame | undefined
  private frameTime: number | undefined
  private isRunning: boolean = true
  private shouldFinish: boolean = false
  private targetTime: number
  private baseTime: number
  private segmentUrl: string = ''
  private segmentByterange?: { length: number; offset: number }
  private firstFramePriority: boolean
  private io: FetchIO
  private firstPts: number | undefined
  private reader: ChunkReader | undefined
  private error: Error | undefined
  constructor(
    options: DecoderFlowOptions,
  ) {
    if (options.logger) {
      this.logger = options.logger.sub(DecoderFlow.LOGGER_NAME)
    }
    this.targetTime = options.targetTime
    this.baseTime = options.baseTime
    this.segmentUrl = options.segmentUrl
    this.segmentByterange = options.segmentByterange
    this.firstFramePriority = options.firstFramePriority
    this.io = options.io
  }

  /**
   * 初始化解码器和解复用器
   */
  initialize(): void {
    this.logger.debug(`initialize 开始, segmentUrl: ${this.segmentUrl}`)
    this.videoDecoder = this._createDecoder()
    this.demuxer = this._createDemuxer()
    
    if (this.segmentByterange) {
      const { offset, length } = this.segmentByterange
      this.reader = this.io.createChunkReader(
        this.segmentUrl,
        offset,
        ChunkReader.DEFAULT_LIMIT,
        offset + length - 1,
      )
    }
    else {
      this.reader = this.io.createChunkReader(this.segmentUrl, 0)
    }

    this.logger.debug(`initialize 完成, videoDecoder状态: ${this.videoDecoder.state}`)
  }

  /**
   * 推送数据到解复用器
   * @param buffer 数据缓冲区
   * @param done 是否完成
   */
  pushData(buffer: ArrayBuffer, done?: boolean): void {
    if (!this.demuxer) {
      this.logger.warn('pushData demuxer is undefined')
      return
    }

    if (done) {
      this.logger.debug(`pushData 推送最后一块数据, 大小: ${buffer.byteLength} bytes`)
    }
    else {
      // 只在解码器未配置时记录，帮助调试
      if (this.videoDecoder?.state === 'unconfigured') {
        this.logger.debug(`pushData 推送数据到解复用器, 大小: ${buffer.byteLength} bytes, 解码器状态: ${this.videoDecoder.state}`)
      }
    }
    this.demuxer.push(buffer, done ? { done: true } : undefined)
  }

  /**
   * 检查是否已找到帧
   * @returns 是否已找到帧
   */
  hasFrame(): boolean {
    return !!this.frame
  }

  /**
   * 等待帧解码完成
   * @param timeoutMs 超时时间（毫秒）
   * @returns 解码结果
   */
  async waitForFrame(timeoutMs: number): Promise<FrameData | undefined> {
    if (!this.videoDecoder || !this.demuxer) {
      const component = !this.videoDecoder ? 'videoDecoder' : 'demuxer'
      throw new DecoderFlowError.NotInitialized(component)
    }
    const startTime = Date.now()
    this.logger.debug(`waitForFrame 开始, targetTime: ${this.targetTime}, timeoutMs: ${timeoutMs}, segmentUrl: ${this.segmentUrl}`)

    await this.autoReadChunk()

    this.videoDecoder.ondequeue = () => {
      this.triggerAutoReadChunk()
    }

    let loopCount = 0
    let lastAutoReadTime = Date.now()
    let frameFoundAt: number | undefined
    while (this.isRunning) {
      loopCount++
      const elapsed = Date.now() - startTime
      const timeout = this._checkTimeout(startTime, timeoutMs)

      // 已找到帧后，再给一段继续逼近 targetTime 的宽限期，到点返回当前最佳帧，
      // 避免大分片/慢网下每次都要拖满超时才返回（悬停预览连续候选点会成倍拖慢）
      if (this.frame && !this.shouldFinish) {
        if (frameFoundAt === undefined) {
          frameFoundAt = Date.now()
        }
        else if (Date.now() - frameFoundAt > DecoderFlow.FRAME_GRACE_MS) {
          this.logger.debug(`有帧后宽限期结束, 返回当前帧, 已耗时: ${Date.now() - startTime}ms`)
          this._stop()
          const frameTime = this.frameTime ?? this._getFrameRealTime(this.frame.timestamp)
          return {
            videoFrame: this.frame.clone(),
            frameTime,
            seekTime: this.targetTime,
            consumedTime: Date.now() - startTime,
          }
        }
        // 已找到帧、无待处理样本/在途读取/未完成解码时，数据已耗尽，
        // 无需再空等宽限期，立即返回当前帧
        else if (this._hasPendingWork() === false) {
          this.logger.debug(`已找到帧且数据耗尽, 提前返回, 已耗时: ${Date.now() - startTime}ms`)
          this._stop()
          const frameTime = this.frameTime ?? this._getFrameRealTime(this.frame.timestamp)
          return {
            videoFrame: this.frame.clone(),
            frameTime,
            seekTime: this.targetTime,
            consumedTime: Date.now() - startTime,
          }
        }
      }

      // 解码队列为空且待处理样本为空时，主动尝试读取数据（每100ms尝试一次）
      // 覆盖两种场景：
      // 1. 解码器未配置，等待读取关键帧信息（SPS/PPS）以配置解码器；
      // 2. 解码器已配置但当前已读数据未产出完整样本（如块边界截断 PES、分片无关键帧），
      //    此时必须主动继续读取推进 reader，否则仅靠 ondequeue 驱动会在该状态下空转直至超时
      if (
        (this.videoDecoder?.decodeQueueSize ?? 0) === 0
        && this.sampleQueue.length === 0
        && Date.now() - lastAutoReadTime > 100
      ) {
        this.logger.debug(`解码队列空闲，主动尝试读取数据`)
        await this.autoReadChunk()
        lastAutoReadTime = Date.now()
      }

      if (this.error) {
        this._stop()
        throw this.error
      }

      if (this._shouldStop() || this._isExhausted() || timeout) {
        if (timeout) {
          if (this.frame) {
            // 超时但已找到帧：返回当前最佳帧，避免"有帧还报错"
            this.logger.warn(`超时但已找到帧, 返回当前帧, 已耗时: ${Date.now() - startTime}ms`)
            this._stop()
            const frameTime = this.frameTime ?? this._getFrameRealTime(this.frame.timestamp)
            return {
              videoFrame: this.frame.clone(),
              frameTime,
              seekTime: this.targetTime,
              consumedTime: Date.now() - startTime,
            }
          }
          this.logger.error(`超时! 循环次数: ${loopCount}, 已耗时: ${elapsed}ms`)
          this.logger.error(`超时时的状态: ${JSON.stringify({
            targetTime: this.targetTime,
            segmentUrl: this.segmentUrl,
            videoDecoderState: this.videoDecoder?.state,
            decodeQueueSize: this.videoDecoder?.decodeQueueSize,
            sampleQueueLength: this.sampleQueue.length,
            samplesProcessedLength: this.samplesProcessed.length,
            hasFrame: !!this.frame,
            readerIsDoned: this.reader?.isDoned,
            isRunning: this.isRunning,
            firstPts: this.firstPts,
          })}`)
          this._stop()

          throw new DecoderFlowError.Timeout(
            this.targetTime,
            this.segmentUrl,
            timeoutMs,
          )
        }

        this._stop()

        if (this.frame) {
          const frameTime = this.frameTime ?? this._getFrameRealTime(this.frame.timestamp)
          this.logger.debug(`成功找到帧, frameTime: ${frameTime}, 耗时: ${Date.now() - startTime}ms`)
          return {
            videoFrame: this.frame.clone(),
            frameTime,
            seekTime: this.targetTime,
            consumedTime: Date.now() - startTime,
          }
        }
      }

      await this._processSampleQueue()
    }

    return undefined
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this._stop()
    this.sampleQueue = []
    this.samplesProcessed = []

    this._clearSelectedFrame()

    if (this.demuxer) {
      this.demuxer.destroy()
      this.demuxer = undefined
    }

    if (this.videoDecoder && this.videoDecoder.state !== 'closed') {
      this.videoDecoder.close()
      this.videoDecoder = undefined
    }
  }

  /**
   * 销毁所有资源
   */
  destroy(): void {
    this.cleanup()
  }

  /**
   * 创建视频解码器
   * @returns 视频解码器
   */
  private _createDecoder(): VideoDecoder {
    const videoDecoder = new VideoDecoder({
      output: (videoFrame) => {
        this._processFrame(videoFrame)
      },
      error: (error) => {
        this.error = new DecoderFlowError.DecoderRuntime(error)
        this._stop()
      },
    })
    return videoDecoder
  }

  /**
   * 创建解复用器
   * @returns 解复用器
   */
  private _createDemuxer(): DemuxerTsNew {
    this.logger.debug('创建解复用器')
    return new DemuxerTsNew({
      onConfig: (config) => {
        this._configure(config.codec)
      },
      onAvcFrameData: (encodeChunk) => {
        this._onAvcFrameData(encodeChunk)
      },
      onDone: () => {
        this.logger.debug('解复用完成, 刷新解码器')
        if (this.videoDecoder) {
          this.videoDecoder.flush()
        }
      },
    })
  }

  /**
   * 配置解码器
   * @param codec 编解码器字符串
   */
  private _configure(codec: string): void {
    if (!this.videoDecoder) {
      this.logger.warn('videoDecoder is undefined')
      return
    }

    try {
      this.logger.debug(`配置解码器, codec: ${codec}`)
      this.videoDecoder.configure({
        codec,
      })
      this.logger.debug(`解码器配置成功, 状态: ${this.videoDecoder.state}`)
    }
    catch (error) {
      this.error = new DecoderFlowError.DecoderConfiguration(codec, error)
    }
  }

  /**
   * 处理解复用后的 chunk
   */
  private _onAvcFrameData(encodeChunk: {
    avcFrame: AVCFrame
    rawData: Uint8Array
  }): void {
    const { avcFrame, rawData } = encodeChunk

    if (this._shouldStop()) {
      return
    }

    if (avcFrame.pts == null) {
      this.logger.warn('_onDecodeChunk avcFrame lost pts')
      return
    }

    if (avcFrame.duration == null) {
      this.logger.warn('_onDecodeChunk avcFrame lost duration')
      return
    }

    if (this.videoDecoder?.state === 'unconfigured') {
      this.logger.warn('_onDecodeChunk videoDecoder is unconfigured')
      return
    }

    if (this.firstPts == null) {
      this.firstPts = avcFrame.pts
      if (!avcFrame.keyframe) {
        this.logger.warn('_onDecodeChunk first avcFrame is not keyframe')
      }
    }

    const encodedChunk = new EncodedVideoChunk({
      type: avcFrame.keyframe ? 'key' : 'delta',
      timestamp: timebaseConvert((avcFrame.pts), secTimebase, microsecTimebase),
      data: rawData,
    })

    this.sampleQueue.push(
      {
        encodedChunk,
        avcFrame,
        rawData,
      },
    )
  }

  /**
   * 处理解码出的帧
   * @param videoFrame 视频帧
   */
  private _processFrame(videoFrame: VideoFrame): void {
    const frameTime = this._getFrameRealTime(videoFrame.timestamp)
    this.decodedFramesTimes.push(frameTime)

    if (this.firstFramePriority) {
      if (!this.frame) {
        this._setSelectedFrame(videoFrame, frameTime)
        this.shouldFinish = true
        return
      }

      videoFrame.close()
      return
    }

    const previousDelta = this.frameTime == null
      ? Number.POSITIVE_INFINITY
      : Math.abs(this.frameTime - this.targetTime)
    const nextDelta = Math.abs(frameTime - this.targetTime)

    if (!this.frame || nextDelta <= previousDelta) {
      this._setSelectedFrame(videoFrame, frameTime)
    }
    else {
      videoFrame.close()
    }

    if (frameTime >= this.targetTime) {
      const bestDelta = Math.abs((this.frameTime ?? frameTime) - this.targetTime)
      const overshoot = frameTime - this.targetTime
      if (
        bestDelta <= DecoderFlow.PRECISE_FINISH_WINDOW
        || overshoot >= DecoderFlow.PRECISE_OVERSHOOT_LIMIT
      ) {
        this.shouldFinish = true
      }
    }
  }

  /**
   * 自动读取分块
   */
  private readChunkInFlight: Promise<void> | null = null

  /**
   * 读取下一块数据。ondequeue 回调与等待循环会并发调用本方法，
   * 若不加互斥两个 reader.next() 会取到相同字节区间（重复 Range 请求、
   * 数据乱序入 demuxer），因此共用同一个在途读取 Promise。
   */
  private async autoReadChunk(): Promise<void> {
    if (this.readChunkInFlight) return this.readChunkInFlight

    const decodeQueueSize = this.videoDecoder?.decodeQueueSize ?? 0
    const shouldRead = (
      decodeQueueSize === 0
      && !this.shouldFinish
      && this.isRunning
      && this.reader
      && !this.reader.isDoned
    )

    if (!shouldRead || !this.reader) return

    const task = (async () => {
      try {
        this.logger.debug(`autoReadChunk 开始读取, decodeQueueSize: ${decodeQueueSize}`)
        const arrayBuffer = await this.reader!.next()

        // 如果在等待数据返回的途中，解码器已经被 cleanup(destroy) 销毁，则直接丢弃数据，不报警告
        if (!this.isRunning || !this.demuxer) {
          return
        }

        if (arrayBuffer) {
          this.logger.debug(`autoReadChunk 读取成功, 数据大小: ${arrayBuffer.byteLength} bytes`)
          this.pushData(arrayBuffer)
        }
        else {
          this.logger.debug(`autoReadChunk 读取返回 undefined, reader.isDoned: ${this.reader!.isDoned}`)
        }
      }
      catch (error) {
        this.error = new DecoderFlowError.DataRead(
          this.segmentUrl,
          error,
        )
        throw this.error
      }
      finally {
        this.readChunkInFlight = null
      }
    })()
    this.readChunkInFlight = task
    return task
  }

  /** fire-and-forget 触发读块（ondequeue 回调使用），错误已记录在 this.error，避免 unhandled rejection */
  private triggerAutoReadChunk() {
    void this.autoReadChunk().catch(() => {})
  }

  /**
   * 检查是否超时
   * @param startTime 开始时间
   * @param timeoutMs 超时时间（毫秒）
   * @returns 是否超时
   */
  private _checkTimeout(startTime: number, timeoutMs: number): boolean {
    return Date.now() - startTime > timeoutMs
  }

  /**
   * 判断是否应该停止
   * @returns 是否停止
   */
  private _shouldStop(): boolean {
    return this.shouldFinish || !this.isRunning
  }

  /**
   * 停止解码
   */
  private _stop(): void {
    this.isRunning = false
  }

  private _isExhausted(): boolean {
    return Boolean(
      this.reader?.isDoned
      && this.sampleQueue.length === 0
      && (this.videoDecoder?.decodeQueueSize ?? 0) === 0,
    )
  }

  /** 是否还有待处理的工作（未解码样本、在途读取、未完成解码队列） */
  private _hasPendingWork(): boolean {
    return Boolean(
      this.sampleQueue.length > 0
      || this.readChunkInFlight
      || (this.videoDecoder?.decodeQueueSize ?? 0) > 0,
    )
  }

  /**
   * 处理样本队列
   * @returns Promise<void>
   */
  private async _processSampleQueue(): Promise<void> {
    if (this.sampleQueue.length === 0) {
      await promiseDelay(DecoderFlow.IDLE_POLL_MS)
      return
    }

    const sample = this.sampleQueue.shift()
    if (sample && this.videoDecoder) {
      try {
        this._rememberProcessedSample(sample)
        this.videoDecoder.decode(sample.encodedChunk)
      }
      catch (error) {
        const decodeError = new DecoderFlowError.DecodeFailed(
          sample.avcFrame.pts,
          sample.avcFrame.keyframe,
          sample.encodedChunk.timestamp,
          this.videoDecoder?.state,
          error,
        )
        this.logger.error('解码失败:', decodeError, {
          sample: {
            pts: sample.avcFrame.pts,
            keyframe: sample.avcFrame.keyframe,
            timestamp: sample.encodedChunk.timestamp,
          },
          decoderState: this.videoDecoder?.state,
        })
        // 同步异常说明解码器已无法继续（如配置/数据损坏），
        // 置 error 并停止循环，交由 waitForFrame 上抛，避免静默空转至超时
        this.error = decodeError
        this._stop()
      }
    }
  }

  private _rememberProcessedSample(sample: SampleQueueItem): void {
    this.samplesProcessed.push(sample)
    if (this.samplesProcessed.length > DecoderFlow.MAX_KEPT_SAMPLES) {
      this.samplesProcessed.shift()
    }
  }

  /**
   * 获取帧的实际时间
   * @param timestamp 时间戳 (微秒) 来源与 VideoFrame 或 EncodedVideoChunk
   * @returns 实际时间 (秒)
   */
  private _getFrameRealTime(timestamp: number): number {
    /** 转换时间基 */
    const videoFrameTime = timebaseConvert(
      timestamp,
      microsecTimebase,
      secTimebase,
    )
    return (this.baseTime ?? 0) + (videoFrameTime - (this.firstPts ?? 0))
  }

  private _clearSelectedFrame(): void {
    if (this.frame) {
      this.frame.close()
      this.frame = undefined
    }
    this.frameTime = undefined
  }

  private _setSelectedFrame(videoFrame: VideoFrame, frameTime: number): void {
    this._clearSelectedFrame()
    this.frame = videoFrame
    this.frameTime = frameTime
  }
}
