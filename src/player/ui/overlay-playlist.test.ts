// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

const mockGetVideoCovers = vi.fn()
vi.mock('../../lib/videoThumbnail', () => ({
  getVideoCovers: (...args: any[]) => mockGetVideoCovers(...args),
}))

import { buildPlaylistHtml, lazyLoadPlaylistCovers } from './overlay-playlist'

describe('overlay playlist helpers', () => {
  let originalIO: any
  let observerCallback: any
  let observedElements: HTMLElement[] = []
  let unobservedElements: HTMLElement[] = []
  let disconnected = false

  beforeEach(() => {
    vi.useFakeTimers()
    mockGetVideoCovers.mockReset()
    observedElements = []
    unobservedElements = []
    disconnected = false

    originalIO = globalThis.IntersectionObserver
    globalThis.IntersectionObserver = class MockIntersectionObserver {
      constructor(cb: any) {
        observerCallback = cb
      }
      observe(el: any) {
        observedElements.push(el)
      }
      unobserve(el: any) {
        unobservedElements.push(el)
      }
      disconnect() {
        disconnected = true
      }
    } as any
  })

  afterEach(() => {
    vi.useRealTimers()
    globalThis.IntersectionObserver = originalIO
  })

  it('builds playlist html with active item', () => {
    const html = buildPlaylistHtml([
      { pickCode: 'pc1', fileId: '1', name: 'Test', size: '1 MB' },
    ], 'pc1')

    expect(html).toContain('data-pickcode="pc1"')
    expect(html).toContain('Test')
    expect(html).toContain('1 MB')
    expect(html).toContain('background:rgba(255,255,255,.12)')
    expect(html).toContain('data-action="move"')
    expect(html).toContain('data-action="delete"')
  })

  it('紧凑模式下不渲染缩略图容器，且 lazyLoadPlaylistCovers 零开销直接退出', () => {
    const html = buildPlaylistHtml([
      { pickCode: 'pc1', fileId: '1', name: 'Test', size: '1 MB' },
    ], 'pc1', 'compact')

    expect(html).toContain('m115-pl-compact')
    expect(html).not.toContain('m115-pl-thumb')

    const listEl = document.createElement('div')
    listEl.innerHTML = html
    const cleanup = lazyLoadPlaylistCovers(listEl, [
      { pickCode: 'pc1', fileId: '1', name: 'Test', size: '1 MB' },
    ])
    expect(observedElements.length).toBe(0)
    cleanup()
  })

  it('进入视口时发起封面抽帧并填充图片', async () => {
    mockGetVideoCovers.mockResolvedValue([{ imgUrl: 'https://test/img1.webp', time: 10 }])

    const listEl = document.createElement('div')
    listEl.innerHTML = buildPlaylistHtml([
      { pickCode: 'pc1', fileId: '1', name: 'Ep 1', duration: 120 },
    ], 'pc1')
    document.body.appendChild(listEl)

    const items = [{ pickCode: 'pc1', fileId: '1', name: 'Ep 1', duration: 120 }]
    const cleanup = lazyLoadPlaylistCovers(listEl, items)

    const thumbEl = listEl.querySelector('.m115-pl-thumb') as HTMLElement
    expect(observedElements).toContain(thumbEl)

    // 触发进入视口
    observerCallback([{
      target: thumbEl,
      isIntersecting: true,
    }])

    await vi.runAllTimersAsync()

    expect(mockGetVideoCovers).toHaveBeenCalledWith('pc1', 120, 1)
    expect(thumbEl.innerHTML).toContain('https://test/img1.webp')
    expect(unobservedElements).toContain(thumbEl)

    cleanup()
    expect(disconnected).toBe(true)
    listEl.remove()
  })

  it('滚动期间保持静默，停止滚动防抖 250ms 后才触发当前视口抽帧', async () => {
    mockGetVideoCovers.mockResolvedValue([{ imgUrl: 'https://test/img2.webp', time: 10 }])

    const listEl = document.createElement('div')
    listEl.innerHTML = buildPlaylistHtml([
      { pickCode: 'pc1', fileId: '1', name: 'Ep 1', duration: 120 },
      { pickCode: 'pc2', fileId: '2', name: 'Ep 2', duration: 180 },
    ], 'pc1')
    document.body.appendChild(listEl)

    const items = [
      { pickCode: 'pc1', fileId: '1', name: 'Ep 1', duration: 120 },
      { pickCode: 'pc2', fileId: '2', name: 'Ep 2', duration: 180 },
    ]
    const cleanup = lazyLoadPlaylistCovers(listEl, items)

    const thumbs = listEl.querySelectorAll<HTMLElement>('.m115-pl-thumb')

    // 模拟滚动事件
    listEl.dispatchEvent(new Event('scroll'))

    // 滚动中元素进入视口
    observerCallback([{
      target: thumbs[1],
      isIntersecting: true,
    }])

    // 未到防抖时间，静默不执行
    vi.advanceTimersByTime(100)
    expect(mockGetVideoCovers).not.toHaveBeenCalled()

    // 再次滚动重置计时器
    listEl.dispatchEvent(new Event('scroll'))
    vi.advanceTimersByTime(150)
    expect(mockGetVideoCovers).not.toHaveBeenCalled()

    // 滚动停止满 250ms 后触发
    await vi.advanceTimersByTimeAsync(260)
    expect(mockGetVideoCovers).toHaveBeenCalledWith('pc2', 180, 1)

    cleanup()
    listEl.remove()
  })

  it('离开视口时及时撤销未完成的排队任务', async () => {
    let resolveTask: any
    mockGetVideoCovers.mockImplementation(() => new Promise((r) => { resolveTask = r }))

    const listEl = document.createElement('div')
    listEl.innerHTML = buildPlaylistHtml([
      { pickCode: 'pc1', fileId: '1', name: 'Ep 1', duration: 100 },
      { pickCode: 'pc2', fileId: '2', name: 'Ep 2', duration: 200 },
      { pickCode: 'pc3', fileId: '3', name: 'Ep 3', duration: 300 },
    ], 'pc1')
    document.body.appendChild(listEl)

    const items = [
      { pickCode: 'pc1', fileId: '1', name: 'Ep 1', duration: 100 },
      { pickCode: 'pc2', fileId: '2', name: 'Ep 2', duration: 200 },
      { pickCode: 'pc3', fileId: '3', name: 'Ep 3', duration: 300 },
    ]
    const cleanup = lazyLoadPlaylistCovers(listEl, items)
    const thumbs = listEl.querySelectorAll<HTMLElement>('.m115-pl-thumb')

    // 前两项进入视口，占满 2 个并发槽位
    observerCallback([
      { target: thumbs[0], isIntersecting: true },
      { target: thumbs[1], isIntersecting: true },
    ])

    // 第三项进入视口进入排队
    observerCallback([
      { target: thumbs[2], isIntersecting: true },
    ])

    // 第三项在排队中快速滑出视口
    observerCallback([
      { target: thumbs[2], isIntersecting: false },
    ])

    // 前面的任务完成
    resolveTask([{ imgUrl: 'https://test/1.webp', time: 10 }])
    await vi.runAllTimersAsync()

    // pc3 应该被撤销，不会再次被执行
    expect(mockGetVideoCovers).not.toHaveBeenCalledWith('pc3', 300, 1)

    cleanup()
    listEl.remove()
  })
})
