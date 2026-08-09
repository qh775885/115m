/**
 * 文件列表滚动位置记忆
 *
 * 115 网盘切换目录后，列表会重新加载，滚动位置丢失。
 * 此模块在切换目录前保存 scrollTop，切换后恢复。
 * 数据存储在 sessionStorage 中，浏览器标签关闭时自动清除。
 */

const STORAGE_KEY = 'm115_scroll_history'
const MAX_STORE_KEYS = 200

interface ScrollStore {
  [key: string]: number
}

function getStore(): ScrollStore {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}') as ScrollStore
  }
  catch {
    return {}
  }
}

function setStore(data: ScrollStore) {
  const keys = Object.keys(data)
  if (keys.length > MAX_STORE_KEYS) {
    const dropCount = keys.length - MAX_STORE_KEYS
    keys.slice(0, dropCount).forEach((key) => delete data[key])
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/**
 * 构建 sessionStorage 的 key：cid + offset + tpl（视图类型）
 * 115 网盘翻页时 offset 会变，同一 cid 不同页码的滚动位置分别记录；
 * tpl 区分列表/网格视图，避免切换视图时串用位置。
 */
function buildKey(cid: string, offset: string, tpl: string): string {
  return `${cid}_${offset}_${tpl}`
}

/**
 * 保存滚动位置
 */
export function saveScrollPosition(key: string, scrollTop: number) {
  if (scrollTop <= 0) return
  const store = getStore()
  store[key] = scrollTop
  setStore(store)
}

/**
 * 恢复滚动位置（如果有记录的话）
 * @returns 是否成功恢复了位置
 */
export function restoreScrollPosition(key: string, scrollBox: Element): boolean {
  const store = getStore()
  const scrollTop = store[key]
  if (scrollTop && scrollTop > 0) {
    scrollBox.scrollTop = scrollTop
    return true
  }
  scrollBox.scrollTop = 0
  return false
}

/**
 * 从 document 或 URL 中提取 cid、offset、tpl
 */
export function extractListParams(doc: Document): { cid: string, offset: string, tpl: string } {
  const params = new URLSearchParams(doc.defaultView?.location.search ?? '')
  const cid = params.get('cid') ?? '0'
  const offset = params.get('offset') ?? '0'
  const tpl = params.get('tpl') ?? ''
  return { cid, offset, tpl }
}

export function buildListKey(doc: Document): string {
  const { cid, offset, tpl } = extractListParams(doc)
  return buildKey(cid, offset, tpl)
}

/**
 * 找到文件列表的滚动容器
 * 115 网盘有两种视图：列表视图(.list-contents) 和 网格视图(.list-thumb)
 */
export function findScrollBox(doc: Document): Element | null {
  const listCell = doc.querySelector('.list-cell')
  if (!listCell) return null
  return listCell.querySelector('.list-contents') ?? listCell.querySelector('.list-thumb') ?? null
}

/**
 * 简单节流：确保 fn 在 interval 间隔内最多执行一次（trailing 模式）
 */
function throttle(fn: () => void, interval: number): () => void {
  let last = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  return () => {
    const now = Date.now()
    const remaining = interval - (now - last)
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      last = now
      fn()
    }
    else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now()
        timer = null
        fn()
      }, remaining)
    }
  }
}

/**
 * 滚动位置管理器
 */
export class ScrollPositionManager {
  private scrollBox: Element | null = null
  private doc: Document | null = null
  private handleScroll: (() => void) | null = null
  private key = ''

  /**
   * 绑定滚动容器
   */
  bind(scrollBox: Element, doc: Document) {
    this.unbind()

    this.scrollBox = scrollBox
    this.doc = doc
    this.key = buildListKey(doc)

    restoreScrollPosition(this.key, scrollBox)

    this.handleScroll = throttle(() => {
      if (!this.scrollBox || !this.key) return
      saveScrollPosition(this.key, this.scrollBox.scrollTop)
    }, 150)

    scrollBox.addEventListener('scroll', this.handleScroll, { passive: true })
  }

  matches(scrollBox: Element, doc: Document): boolean {
    return this.scrollBox === scrollBox && this.key === buildListKey(doc)
  }

  /**
   * 解绑
   */
  unbind() {
    if (this.scrollBox && this.handleScroll) {
      this.scrollBox.removeEventListener('scroll', this.handleScroll)
    }
    this.scrollBox = null
    this.doc = null
    this.handleScroll = null
    this.key = ''
  }
}
