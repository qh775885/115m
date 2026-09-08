// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('content/core/runtime', () => {
  let sendMessageMock: ReturnType<typeof vi.fn>
  let connectMock: ReturnType<typeof vi.fn>
  let portListeners: Array<() => void>

  beforeEach(() => {
    vi.clearAllMocks()
    portListeners = []

    sendMessageMock = vi.fn()
    connectMock = vi.fn().mockImplementation(() => ({
      name: 'keep-alive',
      postMessage: vi.fn(),
      disconnect: vi.fn(),
      onDisconnect: {
        addListener: (cb: () => void) => portListeners.push(cb),
      },
    }))

    const chromeMock = {
      runtime: {
        id: 'test-id',
        sendMessage: sendMessageMock,
        connect: connectMock,
        lastError: null,
      },
    }

    vi.stubGlobal('chrome', chromeMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('正常情况下 sendMessage 成功返回响应', async () => {
    const { sendRuntimeMessageSafe } = await import('./runtime')
    sendMessageMock.mockResolvedValueOnce({ ok: true, data: 'test' })

    const result = await sendRuntimeMessageSafe({ type: 'TEST' })
    expect(result).toEqual({ ok: true, data: 'test' })
  })

  it('SW 休眠时（Receiving end does not exist）并发请求去重唤醒并重试成功', async () => {
    const { sendRuntimeMessageSafe } = await import('./runtime')

    // 两个并发业务请求初次都遇到 SW 休眠
    // 随后 PING 唤醒成功，重试成功返回
    sendMessageMock
      .mockRejectedValueOnce(new Error('Could not establish connection. Receiving end does not exist.'))
      .mockRejectedValueOnce(new Error('Could not establish connection. Receiving end does not exist.'))
      .mockResolvedValueOnce({ pong: true }) // 共享的 PING 唤醒
      .mockResolvedValueOnce({ ok: true, id: 1 }) // 业务重试 1
      .mockResolvedValueOnce({ ok: true, id: 2 }) // 业务重试 2

    const [res1, res2] = await Promise.all([
      sendRuntimeMessageSafe({ type: 'FETCH_1' }),
      sendRuntimeMessageSafe({ type: 'FETCH_2' }),
    ])

    expect(res1).toEqual({ ok: true, id: 1 })
    expect(res2).toEqual({ ok: true, id: 2 })

    // 验证 PING 唤醒只被调用了 1 次（去重合并），没有发起多次 PING 风暴
    const pingCalls = sendMessageMock.mock.calls.filter(call => call[0]?.type === 'PING')
    expect(pingCalls.length).toBe(1)
  })

  it('唤醒彻底失败时熔断生效，不进行冗余重试', async () => {
    const { sendRuntimeMessageSafe } = await import('./runtime')

    // 模拟持续无法连接
    sendMessageMock.mockRejectedValue(new Error('Could not establish connection. Receiving end does not exist.'))

    const res = await sendRuntimeMessageSafe({ type: 'FETCH_FAIL' }, 2, 50)
    expect(res).toBeNull()

    // 熔断冷却期内立即再次发起的请求，应直接返回 null，不再调用 sendMessage
    const callsBefore = sendMessageMock.mock.calls.length
    const fastFailRes = await sendRuntimeMessageSafe({ type: 'FETCH_FAST_FAIL' })
    expect(fastFailRes).toBeNull()
    expect(sendMessageMock.mock.calls.length).toBe(callsBefore)
  })

  it('startKeepAlive 建立长连接并在 disconnectKeepAlive 时断开', async () => {
    const { startKeepAlive, disconnectKeepAlive } = await import('./runtime')

    startKeepAlive()
    expect(connectMock).toHaveBeenCalledWith({ name: 'keep-alive' })

    disconnectKeepAlive()
  })
})
