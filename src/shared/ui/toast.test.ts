// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { showToast, clearToast } from './toast'

describe('showToast 共享 Toast', () => {
  beforeEach(() => {
    clearToast()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.useRealTimers()
    clearToast()
  })

  it('创建并追加 toast 元素', () => {
    const el = showToast(document, '测试提示')
    expect(el.classList.contains('m115-toast')).toBe(true)
    expect(el.textContent).toBe('测试提示')
    expect(document.body.contains(el)).toBe(true)
  })

  it('自动消失', () => {
    vi.useFakeTimers()
    const el = showToast(document, '短暂提示', { duration: 100 })
    expect(document.body.contains(el)).toBe(true)
    vi.advanceTimersByTime(300)
    expect(document.body.contains(el)).toBe(false)
  })

  it('新 toast 替换旧 toast', () => {
    vi.useFakeTimers()
    const first = showToast(document, '第一条')
    const second = showToast(document, '第二条')
    expect(document.body.contains(first)).toBe(false)
    expect(document.body.contains(second)).toBe(true)
  })

  it('支持自定义类名与容器', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const el = showToast(document, '自定义', { container, className: 'custom-toast', topOffset: 30 })
    expect(el.classList.contains('custom-toast')).toBe(true)
    expect(container.contains(el)).toBe(true)
    expect(el.style.top).toBe('30px')
  })

  it('clearToast 强制清理', () => {
    showToast(document, '待清理')
    expect(document.querySelector('.m115-toast')).not.toBeNull()
    clearToast()
    expect(document.querySelector('.m115-toast')).toBeNull()
  })

  it('error 变体使用红色背景', () => {
    const el = showToast(document, '错误提示', { variant: 'error' })
    expect(el.style.background).toContain('231')
    expect(el.style.background).toContain('76')
  })
})
