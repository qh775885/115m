import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AVCFrame } from '@cbingbing/demuxer'

const mockConfig = { codec: 'avc1.4d401f', width: 1280, height: 720 }

vi.mock('@cbingbing/demuxer', () => ({
  Events: { DONE: 'done' },
  getAVCConfig: vi.fn(() => mockConfig),
  TSDemux: class {
    constructor() {}
    on = vi.fn()
    push = vi.fn()
    destroy = vi.fn()
    elementaryStream_ = { avcStream: { on: vi.fn() } }
  },
}))

import { DemuxerTsNew } from './demuxerTsNew'
import { getAVCConfig } from '@cbingbing/demuxer'

function makeNalu(unitType: number, data: number[]): { unit_type: number, rawData: Uint8Array, sps?: { width: number, height: number } } {
  const nalu: { unit_type: number, rawData: Uint8Array, sps?: { width: number, height: number } } = {
    unit_type: unitType,
    rawData: new Uint8Array(data),
  }
  if (unitType === 7) {
    nalu.sps = { width: 1280, height: 720 }
  }
  return nalu
}

function createDemuxer() {
  const onAvcFrameData = vi.fn()
  const onConfig = vi.fn()
  const onDone = vi.fn()
  const demuxer = new DemuxerTsNew({ onAvcFrameData, onConfig, onDone })
  return { demuxer, onAvcFrameData, onConfig, onDone }
}

describe('DemuxerTsNew 帧重组', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('NALU 添加 Annex-B 起始码并合并', () => {
    const { demuxer, onAvcFrameData } = createDemuxer()
    const nalu1 = makeNalu(5, [1, 2, 3])
    const nalu2 = makeNalu(1, [4, 5])
    const avcFrame = { length: 2, 0: nalu1, 1: nalu2 } as unknown as AVCFrame

    ;(demuxer as unknown as { _createFrameData(avcFrame: AVCFrame): Uint8Array | null })._createFrameData(avcFrame)

    // 直接触发私有方法会走 _sendVideoFrame 链路（经 _onDemuxFrame）
    // 此处验证完整帧回调
    ;(demuxer as unknown as { _onDemuxFrame(avcFrame: AVCFrame): void })._onDemuxFrame(avcFrame)

    expect(onAvcFrameData).toHaveBeenCalledTimes(1)
    const payload = onAvcFrameData.mock.calls[0][0] as { avcFrame: AVCFrame, rawData: Uint8Array }
    // 起始码 4 + NALU1(3) + 起始码 4 + NALU2(2) = 13
    expect(payload.rawData.length).toBe(13)
    expect(Array.from(payload.rawData.slice(0, 4))).toEqual([0, 0, 0, 1])
  })

  it('SPS NALU 触发配置回调', () => {
    const { demuxer, onConfig } = createDemuxer()
    const sps = makeNalu(7, [10, 20, 30])
    const avcFrame = { length: 1, 0: sps } as unknown as AVCFrame

    ;(demuxer as unknown as { _onDemuxFrame(avcFrame: AVCFrame): void })._onDemuxFrame(avcFrame)

    expect(getAVCConfig).toHaveBeenCalled()
    expect(onConfig).toHaveBeenCalledWith(mockConfig)
  })

  it('空 NALU 数组时返回 null 且不回调', () => {
    const { demuxer, onAvcFrameData, onConfig } = createDemuxer()
    const emptyNalu = makeNalu(0, [])
    const avcFrame = { length: 1, 0: emptyNalu } as unknown as AVCFrame

    ;(demuxer as unknown as { _onDemuxFrame(avcFrame: AVCFrame): void })._onDemuxFrame(avcFrame)

    expect(onAvcFrameData).not.toHaveBeenCalled()
    expect(onConfig).not.toHaveBeenCalled()
  })

  it('push 未初始化时抛错', () => {
    const { demuxer } = createDemuxer()
    ;(demuxer as unknown as { demux: undefined }).demux = undefined
    expect(() => demuxer.push(new ArrayBuffer(8))).toThrow(/未初始化/)
  })

  it('destroy 清理 demux 实例', () => {
    const { demuxer } = createDemuxer()
    demuxer.destroy()
    expect((demuxer as unknown as { demux: unknown }).demux).toBeUndefined()
  })
})
