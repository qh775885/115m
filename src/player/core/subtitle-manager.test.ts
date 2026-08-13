// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SubtitleManager } from './subtitle-manager'
import type { SubtitleCue } from './subtitles'

function createManager(cues: SubtitleCue[]) {
  const video = document.createElement('video')
  Object.defineProperty(video, 'textTracks', {
    configurable: true,
    get: () => ({ length: 0, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  })
  const container = document.createElement('div')
  document.body.appendChild(container)

  const manager = new SubtitleManager({
    container,
    getVideo: () => video,
    sendMessage: vi.fn().mockResolvedValue(null),
  })

  ;(manager as any).cues = cues
  return { manager, video, container }
}

beforeEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('SubtitleManager.render 缓存上次 cue', () => {
  it('同一 cue 保持期间不重复写 DOM', () => {
    const { manager, video, container } = createManager([
      { start: 1, end: 10, text: '第一行' },
    ])
    video.currentTime = 2

    const layer = container.querySelector('.m115-subtitle-layer') as HTMLElement
    const textEl = container.querySelector('.m115-subtitle-box p') as HTMLElement
    expect(layer.style.display).toBe('none')

    ;(manager as any).render()
    expect(textEl.textContent).toBe('第一行')
    expect(layer.style.display).toBe('flex')

    // 时间前进但 cue 未变化，不应再次写 DOM（textContent/display 引用保持）
    const displayRef = layer.style.display
    const textRef = textEl.textContent
    video.currentTime = 5
    ;(manager as any).render()
    expect(textEl.textContent).toBe(textRef)
    expect(layer.style.display).toBe(displayRef)
    expect(layer.style.display).toBe('flex')
    expect(textEl.textContent).toBe('第一行')
  })

  it('cue 切换时才更新文本', () => {
    const { manager, video, container } = createManager([
      { start: 1, end: 2, text: '甲' },
      { start: 2.5, end: 5, text: '乙' },
    ])
    const textEl = container.querySelector('.m115-subtitle-box p') as HTMLElement

    video.currentTime = 1.2
    ;(manager as any).render()
    expect(textEl.textContent).toBe('甲')

    video.currentTime = 3
    ;(manager as any).render()
    expect(textEl.textContent).toBe('乙')
  })

  it('无 cue 时隐藏且不重复写', () => {
    const { manager, video, container } = createManager([
      { start: 1, end: 2, text: '甲' },
    ])
    const textEl = container.querySelector('.m115-subtitle-box p') as HTMLElement
    const layer = container.querySelector('.m115-subtitle-layer') as HTMLElement

    video.currentTime = 1.2
    ;(manager as any).render()
    expect(layer.style.display).toBe('flex')

    video.currentTime = 3
    ;(manager as any).render()
    expect(textEl.textContent).toBe('')
    expect(layer.style.display).toBe('none')

    // 继续无 cue，display 保持 'none'
    video.currentTime = 8
    ;(manager as any).render()
    expect(layer.style.display).toBe('none')
  })

  it('destroy 后清理 rAF 循环', () => {
    const { manager } = createManager([
      { start: 1, end: 2, text: '甲' },
    ])
    ;(manager as any).startRenderLoop()
    expect((manager as any).rafId).not.toBe(0)
    manager.destroy()
    expect((manager as any).rafId).toBe(0)
  })
})
