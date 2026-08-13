// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { bindClickSelectorBehavior, unbindClickSelectorBehavior } from './player-selector'

beforeEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('bindClickSelectorBehavior / unbindClickSelectorBehavior', () => {
  it('unbind 后点击共享监听不再对旧控件生效，且可重新绑定', () => {
    const control = document.createElement('div')
    document.body.appendChild(control)
    bindClickSelectorBehavior(control)
    control.classList.add('m115-selector-open')

    unbindClickSelectorBehavior(control)
    document.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(control.classList.contains('m115-selector-open')).toBe(true)

    bindClickSelectorBehavior(control)
    control.classList.add('m115-selector-open')
    document.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(control.classList.contains('m115-selector-open')).toBe(false)
  })

  it('unbind 空值安全', () => {
    expect(() => unbindClickSelectorBehavior(null)).not.toThrow()
    expect(() => unbindClickSelectorBehavior(undefined)).not.toThrow()
  })

  it('unbind 后可再次绑定同一控件（不因 __m115SelectorBound 残留而跳过）', () => {
    const control = document.createElement('div')
    document.body.appendChild(control)
    bindClickSelectorBehavior(control)
    unbindClickSelectorBehavior(control)
    bindClickSelectorBehavior(control)
    control.classList.add('m115-selector-open')
    document.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(control.classList.contains('m115-selector-open')).toBe(false)
  })
})
