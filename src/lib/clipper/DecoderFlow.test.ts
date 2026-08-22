// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AVCFrame } from '@cbingbing/demuxer'
import { DecoderFlow } from './DecoderFlow'

type AvcFrameDataHandler = (chunk: { avcFrame: AVCFrame, rawData: Uint8Array }) => void
type ConfigHandler = (config: { codec: string, width: number, height: number }) => void
type DoneHandler = () => void

const demuxerCallbacks: { onAvcFrameData?: AvcFrameDataHandler, onConfig?: ConfigHandler, onDone?: DoneHandler } = {}

vi.mock('./demuxerTsNew', () => ({
  DemuxerTsNew: class {
    constructor(options: {
      onAvcFrameData: AvcFrameDataHandler
      onConfig: ConfigHandler
      onDone: DoneHandler
    }) {
      demuxerCallbacks.onAvcFrameData = options.onAvcFrameData
      demuxerCallbacks.onConfig = options.onConfig
      demuxerCallbacks.onDone = options.onDone
    }
    push = vi.fn()
    destroy = vi.fn()
  },
}))

class MockVideoFrame {
  timestamp: number
  constructor(timestamp: number) {
    this.timestamp = timestamp
  }
  close() {}
  clone() {
    return { timestamp: this.timestamp, close: () => {} }
  }
}

function mockWebCodecs() {
  class MockVideoDecoder {
    state = 'unconfigured'
    decodeQueueSize = 0
    decode = vi.fn()
    configure = vi.fn(() => {
      this.state = 'configured'
    })
    flush = vi.fn(() => {})
    close = vi.fn(() => {
      this.state = 'closed'
    })
  }
  class MockEncodedVideoChunk {}
  vi.stubGlobal('VideoFrame', MockVideoFrame)
  vi.stubGlobal('VideoDecoder', MockVideoDecoder)
  vi.stubGlobal('EncodedVideoChunk', MockEncodedVideoChunk)
  return MockVideoDecoder
}

function createReader() {
  const state = { isDoned: false, calls: 0 }
  const reader = {
    get isDoned() {
      return state.isDoned
    },
    next: vi.fn(async () => {
      state.calls += 1
      if (state.calls === 1) {
        return new Uint8Array([1, 2, 3, 4])
      }
      state.isDoned = true
      return undefined
    }),
  }
  return { reader, state }
}

function createFlow(targetTime = 5) {
  const { reader, state } = createReader()
  const io = {
    createChunkReader: vi.fn(() => reader),
  } as never
  const flow = new DecoderFlow({
    targetTime,
    baseTime: 0,
    segmentUrl: 'https://x/seg.ts',
    firstFramePriority: false,
    io,
    logger: {
      sub: () => ({ debug: () => {}, warn: () => {}, error: () => {}, info: () => {} }),
    } as never,
  })
  flow.initialize()
  return { flow, reader, state }
}

function emitKeyframe() {
  demuxerCallbacks.onConfig?.({ codec: 'avc1.4d401f', width: 1280, height: 720 })
  const avcFrame: AVCFrame = { pts: 0, duration: 40, keyframe: true } as AVCFrame
  demuxerCallbacks.onAvcFrameData?.({ avcFrame, rawData: new Uint8Array([0, 0, 0, 1, 103]) })
}

describe('DecoderFlow waitForFrame 忙等优化', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockWebCodecs()
  })

  it('找到帧且数据耗尽后立即返回，不空等宽限期', async () => {
    const { flow } = createFlow()
    const internal = flow as unknown as {
      videoDecoder: { decode: ReturnType<typeof vi.fn> }
    }
    internal.videoDecoder.decode.mockImplementation((chunk: unknown) => {
      void chunk
      const frame = new MockVideoFrame(0)
      flow['_processFrame'](frame as unknown as VideoFrame)
    })

    const waitPromise = flow.waitForFrame(5000)

    // 在循环运行中注入关键帧样本，驱动解码链
    await vi.advanceTimersByTimeAsync(20)
    emitKeyframe()
    await vi.advanceTimersByTimeAsync(200)

    const result = await Promise.race([waitPromise, new Promise(resolve => setTimeout(() => resolve('pending'), 100))])
    expect(result).not.toBe('pending')
    const frameResult = result as { videoFrame: unknown } | undefined
    expect(frameResult?.videoFrame).toBeDefined()
  })

  it('数据耗尽但无帧时返回 undefined，且不会拖满超时', async () => {
    const { flow } = createFlow()
    const waitPromise = flow.waitForFrame(5000)
    await vi.advanceTimersByTimeAsync(500)
    const result = await Promise.race([waitPromise, new Promise(resolve => setTimeout(() => resolve('pending'), 100))])
    expect(result).toBeUndefined()
  })

  it('超时且未找到帧时抛出 Timeout', async () => {
    // 超时判定基于真实 Date.now()，此用例切回真实时钟并设短超时
    vi.useRealTimers()
    const reader = {
      get isDoned() {
        return false // 永不耗尽，持续供数触发超时分支
      },
      next: vi.fn(async () => new Uint8Array([1, 2, 3, 4])),
    }
    const io = {
      createChunkReader: vi.fn(() => reader),
    } as never
    const flow = new DecoderFlow({
      targetTime: 50,
      baseTime: 0,
      segmentUrl: 'https://x/seg.ts',
      firstFramePriority: false,
      io,
      logger: {
        sub: () => ({ debug: () => {}, warn: () => {}, error: () => {}, info: () => {} }),
      } as never,
    })
    flow.initialize()

    const waitPromise = flow.waitForFrame(150)
    const result = await Promise.race([
      waitPromise.then(() => 'resolved', (e: unknown) => e),
      new Promise(resolve => setTimeout(() => resolve('pending'), 1000)),
    ])
    expect(result).not.toBe('pending')
    expect(result).toBeInstanceOf(Error)
    vi.useFakeTimers()
  })

  it('configure 后首个 delta 帧被跳过，等待关键帧才 decode', async () => {
    const { flow } = createFlow()
    const internal = flow as unknown as {
      videoDecoder: { decode: ReturnType<typeof vi.fn> }
    }
    internal.videoDecoder.decode.mockImplementation((chunk: unknown) => {
      void chunk
      const frame = new MockVideoFrame(0)
      flow['_processFrame'](frame as unknown as VideoFrame)
    })

    const waitPromise = flow.waitForFrame(5000)
    await vi.advanceTimersByTimeAsync(20)

    // 配置解码器后先来一个 delta 帧（不应喂给 decode）
    demuxerCallbacks.onConfig?.({ codec: 'avc1.4d401f', width: 1280, height: 720 })
    const deltaFrame: AVCFrame = { pts: 0, duration: 40, keyframe: false } as AVCFrame
    demuxerCallbacks.onAvcFrameData?.({ avcFrame: deltaFrame, rawData: new Uint8Array([0, 0, 0, 1, 104]) })
    await vi.advanceTimersByTimeAsync(50)
    expect(internal.videoDecoder.decode).not.toHaveBeenCalled()

    // 关键帧到达后正常解码
    emitKeyframe()
    await vi.advanceTimersByTimeAsync(200)

    const result = await Promise.race([waitPromise, new Promise(resolve => setTimeout(() => resolve('pending'), 100))])
    expect(result).not.toBe('pending')
    const frameResult = result as { videoFrame: unknown } | undefined
    expect(frameResult?.videoFrame).toBeDefined()
  })

  it('超时但已找到帧时返回当前帧而非抛错', async () => {
    const { flow } = createFlow()
    const internal = flow as unknown as {
      videoDecoder: { decode: ReturnType<typeof vi.fn> }
    }
    internal.videoDecoder.decode.mockImplementation((chunk: unknown) => {
      void chunk
      const frame = new MockVideoFrame(0)
      flow['_processFrame'](frame as unknown as VideoFrame)
    })

    // 先让循环跑起来并注入关键帧，再以极短超时触发"超时但有帧"分支
    const waitPromise = flow.waitForFrame(30)
    await vi.advanceTimersByTimeAsync(5)
    emitKeyframe()
    await vi.advanceTimersByTimeAsync(100)

    const result = await Promise.race([waitPromise, new Promise(resolve => setTimeout(() => resolve('pending'), 100))])
    expect(result).not.toBe('pending')
    const frameResult = result as { videoFrame: unknown }
    expect(frameResult?.videoFrame).toBeDefined()
  })
})
