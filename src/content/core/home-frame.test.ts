import { afterEach, describe, expect, it, vi } from 'vitest'
import { watchWangpanFrame } from './home-frame'

class TestMutationObserver {
  static instances: TestMutationObserver[] = []
  disconnected = false

  constructor(readonly callback: MutationCallback) {
    TestMutationObserver.instances.push(this)
  }

  observe() {}

  disconnect() {
    this.disconnected = true
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  TestMutationObserver.instances = []
})

describe('watchWangpanFrame', () => {
  it('binds the iframe document after each navigation', () => {
    const firstDocument = {} as Document
    const secondDocument = {} as Document
    let loadListener: (() => void) | undefined
    const frame = {
      contentDocument: firstDocument,
      addEventListener: vi.fn((type: string, listener: () => void) => {
        if (type === 'load') loadListener = listener
      }),
    }
    vi.stubGlobal('document', {
      documentElement: {},
      querySelector: vi.fn(() => frame),
    })
    vi.stubGlobal('MutationObserver', TestMutationObserver)

    const onReady = vi.fn()
    const stop = watchWangpanFrame(onReady)

    expect(onReady).toHaveBeenCalledWith(firstDocument)
    frame.contentDocument = secondDocument
    loadListener?.()

    expect(onReady).toHaveBeenLastCalledWith(secondDocument)

    stop()

    expect(TestMutationObserver.instances[0]?.disconnected).toBe(true)
  })

  it('detaches the previous document before binding a new one', () => {
    const firstDocument = {} as Document
    const secondDocument = {} as Document
    let loadListener: (() => void) | undefined
    const frame = {
      contentDocument: firstDocument,
      addEventListener: vi.fn((type: string, listener: () => void) => {
        if (type === 'load') loadListener = listener
      }),
    }
    vi.stubGlobal('document', {
      documentElement: {},
      querySelector: vi.fn(() => frame),
    })
    vi.stubGlobal('MutationObserver', TestMutationObserver)

    const onReady = vi.fn()
    const onDetached = vi.fn()
    watchWangpanFrame(onReady, onDetached)

    frame.contentDocument = secondDocument
    loadListener?.()

    expect(onDetached).toHaveBeenCalledWith(firstDocument)
    expect(onReady).toHaveBeenLastCalledWith(secondDocument)
  })

  it('detaches the current document on stop', () => {
    const firstDocument = {} as Document
    const frame = {
      contentDocument: firstDocument,
      addEventListener: vi.fn(),
    }
    vi.stubGlobal('document', {
      documentElement: {},
      querySelector: vi.fn(() => frame),
    })
    vi.stubGlobal('MutationObserver', TestMutationObserver)

    const onReady = vi.fn()
    const onDetached = vi.fn()
    const stop = watchWangpanFrame(onReady, onDetached)

    stop()

    expect(onDetached).toHaveBeenCalledWith(firstDocument)
  })

  it('supports search result frame (.wrap-view iframe) and detaches when removed', () => {
    const wangpanDoc = { id: 'wangpan-doc' } as unknown as Document
    const searchDoc = { id: 'search-doc' } as unknown as Document
    const wangpanFrame = {
      contentDocument: wangpanDoc,
      addEventListener: vi.fn(),
    } as unknown as HTMLIFrameElement
    const searchFrame = {
      contentDocument: searchDoc,
      addEventListener: vi.fn(),
    } as unknown as HTMLIFrameElement

    let activeFrames = [wangpanFrame, searchFrame]

    vi.stubGlobal('document', {
      documentElement: {},
      querySelectorAll: vi.fn(() => activeFrames),
      contains: vi.fn((el: any) => activeFrames.includes(el)),
    })
    vi.stubGlobal('MutationObserver', TestMutationObserver)

    const onReady = vi.fn()
    const onDetached = vi.fn()
    watchWangpanFrame(onReady, onDetached)

    expect(onReady).toHaveBeenCalledWith(wangpanDoc)
    expect(onReady).toHaveBeenCalledWith(searchDoc)

    // 搜索页关闭，searchFrame 从 DOM 移除
    activeFrames = [wangpanFrame]
    const observer = TestMutationObserver.instances[0]
    observer.callback([], observer as any)

    expect(onDetached).toHaveBeenCalledWith(searchDoc)
    expect(onDetached).not.toHaveBeenCalledWith(wangpanDoc)
  })
})
