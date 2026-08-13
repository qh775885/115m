import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiCreateFolder, apiFetchFolders, apiMoveFile, apiSearchFolders } from './move-dialog-api'

vi.mock('./runtime', () => ({
  sendRuntimeMessageSafe: vi.fn(),
}))

import { sendRuntimeMessageSafe } from './runtime'
const mockedSend = vi.mocked(sendRuntimeMessageSafe)

function mockMainWorldResponse(text: string) {
  mockedSend.mockResolvedValue({ ok: true, text })
}

describe('move-dialog-api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('apiFetchFolders', () => {
    it('接口失败时返回 error 而非空目录', async () => {
      mockedSend.mockResolvedValue({ ok: false, text: '' })
      const result = await apiFetchFolders('cid1')
      expect(result.folders).toEqual([])
      expect(result.error).toBe('网络请求失败')
    })

    it('解析失败时返回 error', async () => {
      mockMainWorldResponse('not-json')
      const result = await apiFetchFolders('cid1')
      expect(result.folders).toEqual([])
      expect(result.error).toBe('解析返回数据失败')
    })

    it('state=false 时返回 error', async () => {
      mockMainWorldResponse(JSON.stringify({ state: false }))
      const result = await apiFetchFolders('cid1')
      expect(result.folders).toEqual([])
      expect(result.error).toBe('接口返回异常')
    })

    it('成功时返回文件夹与面包屑，过滤 sha/ico 条目', async () => {
      mockMainWorldResponse(JSON.stringify({
        state: true,
        data: [
          { cid: 'a', n: '文件夹A', pid: 'cid1' },
          { cid: 'b', n: '文件B', sha: 'x', ico: 'y' },
          { cid: 123, n: '文件夹C', parent_id: 'cid1' },
        ],
        path: [{ cid: 'root', name: '根目录' }],
      }))
      const result = await apiFetchFolders('cid1')
      expect(result.folders).toEqual([
        { cid: 'a', name: '文件夹A', pid: 'cid1' },
        { cid: '123', name: '文件夹C', pid: 'cid1' },
      ])
      expect(result.path).toEqual([{ cid: 'root', name: '根目录' }])
      expect(result.error).toBeUndefined()
    })

    it('成功但目录为空时无 error（真空目录）', async () => {
      mockMainWorldResponse(JSON.stringify({ state: true, data: [], path: [] }))
      const result = await apiFetchFolders('cid1')
      expect(result.folders).toEqual([])
      expect(result.error).toBeUndefined()
    })
  })

  describe('apiSearchFolders', () => {
    it('失败时返回空数组', async () => {
      mockedSend.mockResolvedValue({ ok: false, text: '' })
      expect(await apiSearchFolders('kw')).toEqual([])
    })

    it('成功时返回文件夹列表', async () => {
      mockMainWorldResponse(JSON.stringify({
        state: true,
        data: [{ cid: 'a', n: '匹配', pid: '0' }],
      }))
      const result = await apiSearchFolders('kw')
      expect(result).toEqual([{ cid: 'a', name: '匹配', pid: '0' }])
    })
  })

  describe('apiCreateFolder', () => {
    it('成功时返回 cid', async () => {
      mockMainWorldResponse(JSON.stringify({ state: true, cid: 'new1' }))
      const result = await apiCreateFolder('pid1', '新文件夹')
      expect(result).toEqual({ ok: true, cid: 'new1' })
    })

    it('失败时返回 error', async () => {
      mockMainWorldResponse(JSON.stringify({ state: false, error: '重名' }))
      const result = await apiCreateFolder('pid1', '新文件夹')
      expect(result).toEqual({ ok: false, error: '重名' })
    })
  })

  describe('apiMoveFile', () => {
    it('成功时 ok=true', async () => {
      mockMainWorldResponse(JSON.stringify({ state: true }))
      const result = await apiMoveFile('f1', 'target')
      expect(result).toEqual({ ok: true })
    })

    it('失败时返回 error', async () => {
      mockMainWorldResponse(JSON.stringify({ state: false, error_msg: '无权限' }))
      const result = await apiMoveFile('f1', 'target')
      expect(result).toEqual({ ok: false, error: '无权限' })
    })
  })
})
