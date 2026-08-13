/**
 * DecoderFlow 错误类型
 */

/** 把未知错误转为可读的字符串（提取 message / 序列化 / 类型兜底） */
function formatErrorDetail(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  try {
    return JSON.stringify(error)
  }
  catch {
    return String(error)
  }
}

export class DecoderFlowError extends Error {
  /** 超时错误 */
  static Timeout = class extends DecoderFlowError {
    constructor(
      readonly targetTime: number,
      readonly segmentUrl: string,
      readonly timeoutMs: number,
    ) {
      super(`DecoderFlow waitForFrame timeout, targetTime: ${targetTime}, segmentUrl: ${segmentUrl}, timeoutMs: ${timeoutMs}ms`)
      this.name = 'DecoderFlowTimeout'
    }
  }

  /** 解码器配置错误 */
  static DecoderConfiguration = class extends DecoderFlowError {
    constructor(
      readonly codec: string,
      readonly originalError: unknown,
    ) {
      super(`Decoder configuration failed, codec: ${codec}, error: ${formatErrorDetail(originalError)}`)
      this.name = 'DecoderFlowDecoderConfiguration'
    }
  }

  /** 解码器运行时错误 */
  static DecoderRuntime = class extends DecoderFlowError {
    constructor(
      readonly originalError: unknown,
    ) {
      super(`Decoder runtime error: ${formatErrorDetail(originalError)}`)
      this.name = 'DecoderFlowDecoderRuntime'
    }
  }

  /** 数据读取错误 */
  static DataRead = class extends DecoderFlowError {
    constructor(
      readonly segmentUrl: string,
      readonly originalError: unknown,
    ) {
      super(`Data read failed, segmentUrl: ${segmentUrl}, error: ${formatErrorDetail(originalError)}`)
      this.name = 'DecoderFlowDataRead'
    }
  }

  /** 未初始化错误 */
  static NotInitialized = class extends DecoderFlowError {
    constructor(readonly component: 'videoDecoder' | 'demuxer' | 'reader') {
      super(`DecoderFlow component not initialized: ${component}`)
      this.name = 'DecoderFlowNotInitialized'
    }
  }

  /** 解码失败错误 */
  static DecodeFailed = class extends DecoderFlowError {
    constructor(
      readonly pts: number | undefined,
      readonly keyframe: boolean | undefined,
      readonly timestamp: number | undefined,
      readonly decoderState: string | undefined,
      readonly originalError: unknown,
    ) {
      super(`Decode failed, pts: ${pts ?? '-'}, ts: ${timestamp ?? '-'}, decoderState: ${decoderState ?? '-'}, error: ${formatErrorDetail(originalError)}`)
      this.name = 'DecoderFlowDecodeFailed'
    }
  }
}
