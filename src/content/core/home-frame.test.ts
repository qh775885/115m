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
})
