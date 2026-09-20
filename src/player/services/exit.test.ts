import { describe, expect, it, vi } from 'vitest'
import { exitPlayer } from './exit'

describe('exitPlayer', () => {
  it('优先通过 background 消息关闭标签页', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ success: true })
    const closeWindow = vi.fn()
    const navigate = vi.fn()

    await exitPlayer({
      sendMessage,
      closeWindow,
      navigate,
      cid: '12345',
    })

    expect(sendMessage).toHaveBeenCalledWith({ type: 'CLOSE_TAB' })
    expect(closeWindow).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('若后台关闭失败，则尝试 window.close 与导航兜底', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ success: false })
    const closeWindow = vi.fn()
    const navigate = vi.fn()

    await exitPlayer({
      sendMessage,
      closeWindow,
      navigate,
      cid: '67890',
    })

    expect(sendMessage).toHaveBeenCalledWith({ type: 'CLOSE_TAB' })
    expect(closeWindow).toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith('https://115.com/?cid=67890&offset=0&tab=&mode=wangpan')
  })

  it('若没有 cid，默认跳转到 115 主站', async () => {
    const sendMessage = vi.fn().mockRejectedValue(new Error('no runtime'))
    const closeWindow = vi.fn()
    const navigate = vi.fn()

    await exitPlayer({
      sendMessage,
      closeWindow,
      navigate,
    })

    expect(closeWindow).toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith('https://115.com/')
  })
})
