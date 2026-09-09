/**
 * 文件列表滚动位置记忆
 *
 * 核心规则：
 * 1. 只记忆当前活动目录的滚动位置。
 * 2. 切换到任何其他文件夹时，强制重置滚动条在最顶部（scrollTop = 0）。
 * 3. 只有在当前同一个文件夹内（如重命名视频触发列表刷新、或原地刷新页面）时，才恢复之前滚动的位置。
 */

const ACTIVE_STORAGE_KEY = 'm115_active_scroll'
const LEGACY_STORAGE_KEY = 'm115_scroll_history'

// 清理旧版本遗留的多目录历史
try {
  sessionStorage.removeItem(LEGACY_STORAGE_KEY)
}
catch {
  // 忽略环境不支持
}

export interface ActiveScrollRecord {
  key: string
  scrollTop: number
}

export function getActiveScroll(): ActiveScrollRecord | null {
  try {
    const raw = sessionStorage.getItem(ACTIVE_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ActiveScrollRecord) : null
  }
  catch {
    return null
  }
}

export function setActiveScroll(key: string, scrollTop: number) {
  try {
    sessionStorage.setItem(ACTIVE_STORAGE_KEY, JSON.stringify({ key, scrollTop }))
  }
  catch {
    // 忽略写入异常
  }
}

export function clearActiveScroll() {
  try {
    sessionStorage.removeItem(ACTIVE_STORAGE_KEY)
  }
  catch {
    // 忽略清理异常
  }
}

/**
 * 构建 key：cid + offset + tpl（视图类型）
 */
export function buildKey(cid: string, offset: string, tpl: string): string {
  return `${cid}_${offset}_${tpl}`
}

/**
 * 保存滚动位置（仅限当前活动 key）
 */
export function saveScrollPosition(key: string, scrollTop: number) {
  if (scrollTop < 0) return
  setActiveScroll(key, scrollTop)
}

/**
 * 恢复滚动位置（仅当同一目录时恢复，切目录时重置为 0）
 * @returns 是否成功恢复了非零位置
 */
export function restoreScrollPosition(key: string, scrollBox: Element): boolean {
  const active = getActiveScroll()
  if (active && active.key === key && active.scrollTop > 0) {
    scrollBox.scrollTop = active.scrollTop
    return true
  }
  scrollBox.scrollTop = 0
  setActiveScroll(key, 0)
  return false
}

/**
 * 从 document 或 URL 中提取 cid、offset、tpl
 */
export function extractListParams(doc: Document): { cid: string, offset: string, tpl: string } {
  const loc = doc.defaultView?.location
  const searchParams = new URLSearchParams(loc?.search ?? '')
  let cid = searchParams.get('cid')
  let offset = searchParams.get('offset')
  let tpl = searchParams.get('tpl')

  if (!cid && loc?.hash) {
    const hashQuery = loc.hash.includes('?') ? loc.hash.slice(loc.hash.indexOf('?') + 1) : ''
    const hashParams = new URLSearchParams(hashQuery)
    cid = hashParams.get('cid')
    offset = offset ?? hashParams.get('offset')
    tpl = tpl ?? hashParams.get('tpl')
  }

  return {
    cid: cid ?? '0',
    offset: offset ?? '0',
    tpl: tpl ?? '',
  }
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
  private isRestoring = false
  private targetScrollTop = 0

  /**
   * 绑定滚动容器
   */
  bind(scrollBox: Element, doc: Document) {
    this.unbind()

    this.scrollBox = scrollBox
    this.doc = doc
    this.key = buildListKey(doc)

    const active = getActiveScroll()
    if (active && active.key === this.key && active.scrollTop > 0) {
      this.targetScrollTop = active.scrollTop
      this.tryApplyScroll(active.scrollTop)
    }
    else {
      // 切换到了新文件夹或新页面：重置位置为最顶部 0
      this.targetScrollTop = 0
      this.isRestoring = true
      scrollBox.scrollTop = 0
      setActiveScroll(this.key, 0)
      window.requestAnimationFrame(() => {
        this.isRestoring = false
      })
    }

    this.handleScroll = throttle(() => {
      if (!this.scrollBox || !this.key || this.isRestoring) return
      const currentKey = this.doc ? buildListKey(this.doc) : this.key
      if (currentKey !== this.key) return

      const st = this.scrollBox.scrollTop
      if (st > 0) {
        this.targetScrollTop = st
        setActiveScroll(this.key, st)
      }
      else if (this.scrollBox.scrollHeight > this.scrollBox.clientHeight + 10) {
        // 仅在容器高度充足且用户确实滚到顶部时记录 0，避免 DOM 坍塌过程误记 0
        this.targetScrollTop = 0
        setActiveScroll(this.key, 0)
      }
    }, 150)

    scrollBox.addEventListener('scroll', this.handleScroll, { passive: true })
  }

  /**
   * 当列表发生变化（如重命名后刷新渲染）时检查并恢复
   */
  checkAndRestore() {
    if (!this.scrollBox || !this.doc) return
    const currentKey = buildListKey(this.doc)
    if (currentKey !== this.key) {
      this.key = currentKey
      this.targetScrollTop = 0
      this.isRestoring = true
      this.scrollBox.scrollTop = 0
      setActiveScroll(currentKey, 0)
      window.requestAnimationFrame(() => {
        this.isRestoring = false
      })
      return
    }

    const active = getActiveScroll()
    if (active && active.key === this.key && active.scrollTop > 0) {
      this.targetScrollTop = active.scrollTop
      if (this.scrollBox.scrollTop !== active.scrollTop) {
        this.tryApplyScroll(active.scrollTop)
      }
    }
  }

  private tryApplyScroll(top: number) {
    if (!this.scrollBox) return
    this.isRestoring = true
    this.scrollBox.scrollTop = top

    // 容器若尚未撑开，在下一帧再次尝试
    if (top > 0 && this.scrollBox.scrollTop < top) {
      window.requestAnimationFrame(() => {
        if (!this.scrollBox || this.targetScrollTop !== top) return
        this.scrollBox.scrollTop = top
        window.setTimeout(() => {
          this.isRestoring = false
        }, 50)
      })
    }
    else {
      window.requestAnimationFrame(() => {
        this.isRestoring = false
      })
    }
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
    this.targetScrollTop = 0
    this.isRestoring = false
  }
}

