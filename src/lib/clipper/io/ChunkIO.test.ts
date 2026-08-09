import { describe, expect, it, vi } from 'vitest'
import { ChunkReader } from './ChunkIO'

function createMockFetchIO() {
  return {
    fetchBufferRange: vi.fn(),
  }
}

function makeResponse(status: number, body: Uint8Array<ArrayBuffer>, contentLength?: number): Response {
  return new Response(body, {
    status,
    headers: contentLength !== undefined ? { 'content-length': String(contentLength) } : {},
  })
}

describe('ChunkReader', () => {
  it('advances offset and keeps reading while chunk is full on 206', async () => {
    const io = createMockFetchIO()
    io.fetchBufferRange.mockResolvedValue(makeResponse(206, new Uint8Array([1, 2, 3, 4, 5]), 5))
    const reader = new ChunkReader('https://x/a.ts', io as any, 10, 5)

    const result = await reader.next()
    expect(io.fetchBufferRange).toHaveBeenCalledWith('https://x/a.ts', 10, 14)
    expect(new Uint8Array(result!)).toEqual(new Uint8Array([1, 2, 3, 4, 5]))
    // 取满一个 chunk，尚未读完，继续读取
    expect(reader.isDoned).toBe(false)
  })

  it('marks done on 206 when server returns a short tail chunk', async () => {
    const io = createMockFetchIO()
    io.fetchBufferRange.mockResolvedValue(makeResponse(206, new Uint8Array([1, 2]), 2))
    const reader = new ChunkReader('https://x/a.ts', io as any, 10, 5)

    await reader.next()
    // 返回内容短于请求范围 → 已到文件尾
    expect(reader.isDoned).toBe(true)
  })

  it('marks done on 416 out of range', async () => {
    const io = createMockFetchIO()
    io.fetchBufferRange.mockResolvedValue(makeResponse(416, new Uint8Array()))
    const reader = new ChunkReader('https://x/a.ts', io as any, 999, 5)

    const result = await reader.next()
    expect(result).toBeUndefined()
    expect(reader.isDoned).toBe(true)
  })

  it('marks done after single full read when server ignores Range (200)', async () => {
    const io = createMockFetchIO()
    io.fetchBufferRange.mockResolvedValue(makeResponse(200, new Uint8Array([9, 8, 7, 6]), 4))
    const reader = new ChunkReader('https://x/a.ts', io as any, 0, 5)

    const result = await reader.next()
    expect(new Uint8Array(result!)).toEqual(new Uint8Array([9, 8, 7, 6]))
    // 核心修复：200 全量响应后标记 done，避免后续重读同一数据
    expect(reader.isDoned).toBe(true)
  })

  it('rejects further reads after done', async () => {
    const io = createMockFetchIO()
    io.fetchBufferRange.mockResolvedValue(makeResponse(200, new Uint8Array([1]), 1))
    const reader = new ChunkReader('https://x/a.ts', io as any, 0, 5)

    await reader.next()
    await expect(reader.next()).rejects.toThrow('chunk reader is done')
  })
})
