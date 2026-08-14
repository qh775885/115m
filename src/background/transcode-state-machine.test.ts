import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./transcode-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./transcode-api')>()
  return {
    ...actual,
    getTranscodeContext: vi.fn(),
    checkTranscodeJob: vi.fn(),
    checkIsTranscoded: vi.fn(),
  }
})

vi.mock('./media-info', () => ({
  handleFetchM3u8: vi.fn(),
}))

vi.mock('./transcode-state', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./transcode-state')>()
  return {
    ...actual,
    getCachedTranscodeStatus: vi.fn().mockReturnValue(null),
    setCachedTranscodeStatus: vi.fn(),
  }
})

import { checkIsTranscoded, checkTranscodeJob, getTranscodeContext } from './transcode-api'
import { handleFetchM3u8 } from './media-info'
import { handleTranscodeStatus } from './transcode'

const mockedGetContext = vi.mocked(getTranscodeContext)
const mockedCheckJob = vi.mocked(checkTranscodeJob)
const mockedCheckIsTranscoded = vi.mocked(checkIsTranscoded)
const mockedFetchM3u8 = vi.mocked(handleFetchM3u8)

beforeEach(() => {
  vi.clearAllMocks()
  mockedGetContext.mockResolvedValue({ pickCode: 'pc1', sha1: 'sha1' } as never)
})

describe('handleTranscodeStatus 状态机', () => {
  it('排队中（job.status=3）返回 queued', async () => {
    mockedCheckJob.mockResolvedValue({ status: 3, count: 2, time: 60 } as never)
    const res = await handleTranscodeStatus({ type: 'TRANSCODE_STATUS', data: { pickCode: 'pc1' } })
    expect(res.ok).toBe(true)
    expect(res.state).toBe('queued')
    expect(res.queueCount).toBe(2)
  })

  it('m3u8 可播放返回 completed_refresh', async () => {
    mockedCheckJob.mockResolvedValue({ status: 0 } as never)
    mockedFetchM3u8.mockResolvedValue({ list: [{ quality: 1, url: 'x' }] } as never)
    const res = await handleTranscodeStatus({ type: 'TRANSCODE_STATUS', data: { pickCode: 'pc1' } })
    expect(res.state).toBe('completed_refresh')
  })

  it('支持转码但无活跃任务返回 no_task', async () => {
    mockedCheckJob.mockResolvedValue({ status: 127 } as never)
    mockedFetchM3u8.mockResolvedValue({} as never)
    mockedCheckIsTranscoded.mockResolvedValue({ state: 1 } as never)
    const res = await handleTranscodeStatus({ type: 'TRANSCODE_STATUS', data: { pickCode: 'pc1' } })
    expect(res.state).toBe('no_task')
    expect(res.detail).toContain('可手动发起')
  })

  it('活跃任务未完成返回 queued（带 queueCount）', async () => {
    mockedCheckJob.mockResolvedValue({ status: 2, count: 1, time: 300 } as never)
    mockedFetchM3u8.mockResolvedValue({} as never)
    mockedCheckIsTranscoded.mockResolvedValue({ state: 1 } as never)
    const res = await handleTranscodeStatus({ type: 'TRANSCODE_STATUS', data: { pickCode: 'pc1' } })
    expect(res.state).toBe('queued')
    expect(res.queueCount).toBe(1)
  })

  it('无转码记录且无任务返回 no_task + autoFallback', async () => {
    mockedCheckJob.mockResolvedValue({ status: 0 } as never)
    mockedFetchM3u8.mockResolvedValue({} as never)
    mockedCheckIsTranscoded.mockResolvedValue({} as never)
    const res = await handleTranscodeStatus({ type: 'TRANSCODE_STATUS', data: { pickCode: 'pc1' } })
    expect(res.state).toBe('no_task')
    expect(res.autoFallback).toBe(true)
  })

  it('context 报错返回 failed', async () => {
    mockedGetContext.mockResolvedValue({ error: 'context lost' } as never)
    const res = await handleTranscodeStatus({ type: 'TRANSCODE_STATUS', data: { pickCode: 'pc1' } })
    expect(res.ok).toBe(false)
    expect(res.state).toBe('failed')
    expect(res.error).toBe('context lost')
  })

  it('内部异常返回 failed', async () => {
    mockedCheckJob.mockRejectedValue(new Error('boom'))
    const res = await handleTranscodeStatus({ type: 'TRANSCODE_STATUS', data: { pickCode: 'pc1' } })
    expect(res.ok).toBe(false)
    expect(res.state).toBe('failed')
  })
})
