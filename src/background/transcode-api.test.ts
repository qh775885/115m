import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../platform/115/main-world', () => ({
  fetchTextIn115VodMainWorld: vi.fn(),
  query115Tabs: vi.fn().mockResolvedValue([]),
}))

vi.mock('../platform/115/file-actions', () => ({
  fetchVideoInfoByPickCode: vi.fn(),
}))

import { fetchTextIn115VodMainWorld } from '../platform/115/main-world'
import { checkTranscodeJob, checkIsTranscoded, pushVipTranscode } from './transcode-api'

const mockedFetch = vi.mocked(fetchTextIn115VodMainWorld)

beforeEach(() => {
  vi.clearAllMocks()
  mockedFetch.mockResolvedValue({ ok: true, text: '{"state":true}' } as never)
})

describe('transcode-api 请求构造', () => {
  it('checkTranscodeJob 走 115vod transcode job 接口 + json body', async () => {
    await checkTranscodeJob('sha1-abc', 'pc1', 100)
    expect(mockedFetch).toHaveBeenCalledTimes(1)
    const [sender, url, body, contentType, pickCode] = mockedFetch.mock.calls[0]
    expect(url).toContain('https://115vod.com/transcode/api/1.0/web/1.0/trans_code/check_transcode_job?')
    expect(url).toContain('sha1=sha1-abc')
    expect(pickCode).toBe('pc1')
    expect(contentType).toBe('application/json')
    expect(body).toContain('priority')
    expect(sender).toBeUndefined()
  })

  it('pushVipTranscode 强制 page 模式避免 CORS', async () => {
    await pushVipTranscode('sha1-abc', 'pc1')
    const [, url, body, , pickCode, mode] = mockedFetch.mock.calls[0]
    expect(url).toBe('https://115vod.com/site/?ct=play&ac=push')
    expect(body).toContain('op=vip_push')
    expect(body).toContain('pickcode=pc1')
    expect(body).toContain('sha1=sha1-abc')
    expect(mode).toBe('page')
    expect(pickCode).toBe('pc1')
  })

  it('checkIsTranscoded 构造 pick_code 表单', async () => {
    await checkIsTranscoded('pc1')
    const [, url, body, , pickCode] = mockedFetch.mock.calls[0]
    expect(url).toBe('https://115vod.com/webapi/files/is_transcoded')
    expect(body).toContain('pick_code=pc1')
    expect(pickCode).toBe('pc1')
  })

  it('接口返回非 ok 时抛错', async () => {
    mockedFetch.mockResolvedValue({ ok: false, text: '', error: 'boom' } as never)
    await expect(checkIsTranscoded('pc1')).rejects.toThrow('boom')
  })

  it('解析失败抛错', async () => {
    mockedFetch.mockResolvedValue({ ok: true, text: 'not json' } as never)
    await expect(checkTranscodeJob('sha', 'pc1')).rejects.toThrow(/parse failed/)
  })
})
