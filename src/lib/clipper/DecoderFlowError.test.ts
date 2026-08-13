import { describe, expect, it } from 'vitest'
import { DecoderFlowError } from './DecoderFlowError'

describe('DecoderFlowError 日志可读性', () => {
  it('DecodeFailed 包含 pts/ts/decoderState 与原始错误详情', () => {
    const error = new DecoderFlowError.DecodeFailed(2975.5, true, 2975000000, 'closed', new Error('buffer overrun'))
    expect(error.name).toBe('DecoderFlowDecodeFailed')
    expect(error.message).toContain('pts: 2975.5')
    expect(error.message).toContain('ts: 2975000000')
    expect(error.message).toContain('decoderState: closed')
    expect(error.message).toContain('Error: buffer overrun')
    // 不再出现 [object Object]
    expect(error.message).not.toContain('[object Object]')
  })

  it('DecodeFailed 对 undefined 字段显示占位', () => {
    const error = new DecoderFlowError.DecodeFailed(undefined, undefined, undefined, undefined, 'boom')
    expect(error.message).toContain('pts: -')
    expect(error.message).toContain('error: "boom"')
  })

  it('DecodeFailed 对非 Error 对象提取 message 或序列化', () => {
    const withMessage = new DecoderFlowError.DecodeFailed(1, false, 2, 'running', { message: 'custom msg' })
    expect(withMessage.message).toContain('custom msg')

    const plain = new DecoderFlowError.DecodeFailed(1, false, 2, 'running', { code: 5 })
    expect(plain.message).toContain('{"code":5}')
  })

  it('DecoderRuntime 包含原始错误详情', () => {
    const error = new DecoderFlowError.DecoderRuntime(new TypeError('invalid chunk'))
    expect(error.name).toBe('DecoderFlowDecoderRuntime')
    expect(error.message).toContain('TypeError: invalid chunk')
    expect(error.message).not.toContain('[object Object]')
  })

  it('DecoderConfiguration / DataRead 包含原始错误详情', () => {
    const config = new DecoderFlowError.DecoderConfiguration('avc1.64001f', new DOMException('unsupported', 'NotSupportedError'))
    expect(config.message).toContain('codec: avc1.64001f')
    expect(config.message).toContain('unsupported')

    const dataRead = new DecoderFlowError.DataRead('https://example.com/a.ts', '404')
    expect(dataRead.message).toContain('segmentUrl: https://example.com/a.ts')
    expect(dataRead.message).toContain('error: "404"')
  })

  it('Timeout / NotInitialized 保持原格式', () => {
    const timeout = new DecoderFlowError.Timeout(10, 'https://example.com/a.ts', 5000)
    expect(timeout.message).toContain('targetTime: 10')

    const notInit = new DecoderFlowError.NotInitialized('demuxer')
    expect(notInit.message).toContain('component not initialized: demuxer')
  })
})
