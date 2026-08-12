// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderPreview } from './preview'
import type { FileInfo } from './types'

vi.mock('../../lib/videoThumbnail', () => ({
  getVideoCovers: vi.fn(), // eslint-disable-line @typescript-eslint/no-unsafe-return
  primeThumbnailSourceUrl: vi.fn(),
}))

vi.mock('../../shared/transcode-store', () => ({
  getTranscodeStatusByPickCode: vi.fn().mockResolvedValue(null),
  getTranscodeStatusByFileId: vi.fn().mockResolvedValue(null),
  saveTranscodeStatus: vi.fn().mockResolvedValue(undefined),
  subscribeTranscodeStatus: vi.fn().mockReturnValue(() => {}),
}))

vi.mock('./runtime', () => ({
  sendTypedRuntimeMessageSafe: vi.fn().mockResolvedValue({ ok: true, list: [{ quality: 1, url: 'http://m3u8.test/x.m3u8' }] }),
  isRuntimeContextInvalidatedResult: vi.fn().mockReturnValue(false),
}))

import { getVideoCovers } from '../../lib/videoThumbnail'

function makeFile(pickCode: string): FileInfo {
  return { pickCode, fileName: `${pickCode}.mp4`, duration: 60, isVideo: true }
}

class MockIntersectionObserver {
  private readonly cb: IntersectionObserverCallback
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb
  }
  observe(el: Element) {
    this.cb([{ isIntersecting: true, target: el }] as unknown as IntersectionObserverEntry[], this as unknown as IntersectionObserver)
  }
  unobserve() {}
  disconnect() {}
}

let generatedCount = 0

describe('renderPreview 列表项复用清理', () => {
  let doc: Document

  beforeEach(() => {
    generatedCount = 0
    vi.clearAllMocks()
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    vi.useFakeTimers()
    const list = document.createElement('ul')
    list.className = 'list-contents'
    document.body.innerHTML = ''
    document.body.appendChild(list)
    ;(getVideoCovers as unknown as ReturnType<typeof vi.fn>).mockImplementation(async (pickCode: string) => {
      generatedCount += 1
      return []
    })
    doc = document
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('普通首次渲染会建立预览容器', async () => {
    const item = doc.createElement('li')
    item.setAttribute('pick_code', 'A')
    doc.querySelector('ul')!.appendChild(item)

    renderPreview(item, makeFile('A'))
    await vi.advanceTimersByTimeAsync(400)

    expect(item.classList.contains('with-ext-video-cover')).toBe(true)
    expect(item.querySelector('.m115-cover-container')).toBeTruthy()
    expect(generatedCount).toBe(1)
  })

  it('同一节点复用换新文件时：销毁旧预览，重新为新文件加载', async () => {
    const item = doc.createElement('li')
    item.setAttribute('pick_code', 'A')
    doc.querySelector('ul')!.appendChild(item)

    renderPreview(item, makeFile('A'))
    await vi.advanceTimersByTimeAsync(400)
    expect(generatedCount).toBe(1)

    item.setAttribute('pick_code', 'B')
    renderPreview(item, makeFile('B'))
    await vi.advanceTimersByTimeAsync(400)

    // 复用后应为新文件再次加载，而不是被 .m115-cover-container 的 return 跳过
    expect(generatedCount).toBe(2)
    // 同一节点只保留一组预览容器（旧的被移除，新容器已重建）
    expect(item.querySelectorAll('.m115-cover-container').length).toBe(1)
    ;(getVideoCovers as unknown as ReturnType<typeof vi.fn>).mock.calls.forEach((call) => {
      expect(call[0]).toMatch(/^[AB]$/)
    })
  })
})
