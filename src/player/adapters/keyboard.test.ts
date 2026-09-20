// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { bindKeyboard, type KeyboardHandlers } from './keyboard'

function createHandlers(): KeyboardHandlers {
  return {
    togglePlay: vi.fn(),
    seekBy: vi.fn(),
    seekToRatio: vi.fn(),
    volumeBy: vi.fn(),
    toggleMute: vi.fn(),
    toggleFullscreen: vi.fn(),
    prev: vi.fn(),
    next: vi.fn(),
    rotate: vi.fn(),
  }
}

describe('keyboard adapter', () => {
  it('数字键 0-9 跳转到 0% - 90%（主键盘 Digit）', () => {
    const handlers = createHandlers()
    const unbind = bindKeyboard(handlers)

    for (let i = 0; i <= 9; i++) {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: `Digit${i}`,
          key: `${i}`,
          bubbles: true,
          cancelable: true,
        })
      )
      expect(handlers.seekToRatio).toHaveBeenLastCalledWith(expect.closeTo(i * 0.1, 5))
    }

    unbind()
  })

  it('数字小键盘 0-9 跳转到 0% - 90%（Numpad）', () => {
    const handlers = createHandlers()
    const unbind = bindKeyboard(handlers)

    for (let i = 0; i <= 9; i++) {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: `Numpad${i}`,
          key: `${i}`,
          bubbles: true,
          cancelable: true,
        })
      )
      expect(handlers.seekToRatio).toHaveBeenLastCalledWith(expect.closeTo(i * 0.1, 5))
    }

    unbind()
  })

  it('输入目标（INPUT/TEXTAREA 等）聚焦时不响应数字键', () => {
    const handlers = createHandlers()
    const unbind = bindKeyboard(handlers)

    const input = document.createElement('input')
    document.body.appendChild(input)

    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        code: 'Digit5',
        key: '5',
        bubbles: true,
        cancelable: true,
      })
    )

    expect(handlers.seekToRatio).not.toHaveBeenCalled()

    input.remove()
    unbind()
  })

  it('按住修饰键（Ctrl / Alt / Meta / Shift）时不触发数字跳转', () => {
    const handlers = createHandlers()
    const unbind = bindKeyboard(handlers)

    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        code: 'Digit5',
        key: '%',
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      })
    )
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        code: 'Digit5',
        key: '5',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      })
    )

    expect(handlers.seekToRatio).not.toHaveBeenCalled()
    unbind()
  })
})
