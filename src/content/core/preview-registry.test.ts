// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PreviewObserverRegistry } from './preview'

class TestMutationObserver {
  static instances: TestMutationObserver[] = []
  observed: { target: Node | null, options?: MutationObserverInit } | null = null
  disconnected = false

  constructor(readonly callback: MutationCallback) {
    TestMutationObserver.instances.push(this)
  }

  observe(target: Node, options?: MutationObserverInit) {
    this.observed = { target, options }
  }

  disconnect() {
    this.disconnected = true
  }

  trigger() {
    this.callback([], new (TestMutationObserver as any)())
  }
}

function makeDoc(): { doc: Document, item: HTMLElement, elem: HTMLElement } {
  const doc = document.implementation.createHTMLDocument()
  const elem = doc.createElement('div')
  doc.documentElement.appendChild(elem)
  const item = doc.createElement('li')
  elem.appendChild(item)
  return { doc, item, elem }
}

beforeEach(() => {
  TestMutationObserver.instances = []
  vi.stubGlobal('MutationObserver', TestMutationObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
  TestMutationObserver.instances = []
})

describe('PreviewObserverRegistry', () => {
  it('observes the document that owns the registered item', () => {
    const { doc, item } = makeDoc()
    const registry = new PreviewObserverRegistry()

    registry.registerItem(item, vi.fn())

    const observer = TestMutationObserver.instances[0]
    expect(observer).toBeDefined()
    expect(observer.observed?.target).toBe(doc.documentElement)
    expect(observer.disconnected).toBe(false)
  })

  it('calls dispose when the item is removed from its own document', () => {
    const { item, elem } = makeDoc()
    const registry = new PreviewObserverRegistry()
    const dispose = vi.fn()

    registry.registerItem(item, dispose)
    const observer = TestMutationObserver.instances[0]

    elem.removeChild(item)
    observer.trigger()

    expect(dispose).toHaveBeenCalledTimes(1)
  })

  it('does not dispose items still connected in the document', () => {
    const { item } = makeDoc()
    const registry = new PreviewObserverRegistry()
    const dispose = vi.fn()

    registry.registerItem(item, dispose)
    const observer = TestMutationObserver.instances[0]

    observer.trigger()

    expect(dispose).not.toHaveBeenCalled()
  })

  it('isolates cleanup per document', () => {
    const { item, elem } = makeDoc()
    const registry = new PreviewObserverRegistry()
    const unregisterRef: { fn?: () => void } = {}
    const disposeSpy = vi.fn()
    const unregister = registry.registerItem(item, () => {
      disposeSpy()
      unregisterRef.fn?.()
    })
    unregisterRef.fn = unregister

    // 移除并触发主文档 observer → 应清理
    elem.removeChild(item)
    TestMutationObserver.instances[0]?.trigger()
    expect(disposeSpy).toHaveBeenCalledTimes(1)

    // 清理后 observer 应断开
    expect(TestMutationObserver.instances[0]?.disconnected).toBe(true)

    // 再次注册到另一个文档时独立创建 observer
    const otherDoc = document.implementation.createHTMLDocument()
    const otherElem = otherDoc.createElement('div')
    otherDoc.documentElement.appendChild(otherElem)
    const otherItem = otherDoc.createElement('li')
    otherElem.appendChild(otherItem)

    registry.registerItem(otherItem, vi.fn())
    const lastObserver = TestMutationObserver.instances[TestMutationObserver.instances.length - 1]
    expect(lastObserver?.observed?.target).toBe(otherDoc.documentElement)

    unregister()
  })

  it('registerScrollStop removes listeners when the last callback is unregistered', () => {
    const { elem } = makeDoc()
    const registry = new PreviewObserverRegistry()
    const removeEventListener = vi.fn()
    elem.addEventListener = vi.fn()
    elem.removeEventListener = removeEventListener

    const unregister = registry.registerScrollStop(elem, vi.fn())
    unregister()

    expect(removeEventListener).toHaveBeenCalled()
  })
})
