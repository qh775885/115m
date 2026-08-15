import { isTransientFrameError, wait } from '../../shared/utils'
import { fetchWithTimeout } from '../../lib/promise'

export interface MainWorldTextResponse {
  ok: boolean
  text: string
  error?: string
}

/** 单次 115vod fetch 超时（毫秒）：防止弱网挂起阻塞整个串行队列 */
const VOD_FETCH_TIMEOUT_MS = 20_000
/** 队列单步总超时：串行的 direct/main_world/page 路径合计兜底，保证队列永远向前 */
const VOD_QUEUE_STEP_TIMEOUT_MS = 45_000

function withVodQueueTimeout(promise: Promise<MainWorldTextResponse>, ms: number): Promise<MainWorldTextResponse> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<MainWorldTextResponse>((resolve) => {
    timer = setTimeout(() => resolve({ ok: false, text: '', error: '115vod fetch timeout' }), ms)
  })
  return Promise.race([promise, timeout]).finally(() => {
    if (timer !== undefined) clearTimeout(timer)
  })
}

/**
 * 构造注入 MAIN world 的 fetch 函数体。
 * 注入函数必须完全自包含：chrome.scripting.executeScript 会序列化函数体并注入执行，
 * 闭包变量不会保留，故所有依赖（含 withHeaders）都必须作为函数参数随 args 传入。
 */
function createMainWorldFetchFunc() {
  return async (fetchUrl: string, fetchBody: string, requestContentType: string, fetchTimeoutMs: number, withHeaders: boolean) => {
    try {
      const isPost = fetchBody.length > 0
      const options: RequestInit = {
        method: isPost ? 'POST' : 'GET',
        credentials: 'include',
      }
      if (withHeaders) {
        options.headers = {
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
        }
      }
      if (isPost) {
        options.headers = {
          ...(options.headers as Record<string, string>),
          'Content-Type': requestContentType,
        }
        options.body = fetchBody
      }
      if (typeof AbortSignal !== 'undefined' && typeof (AbortSignal as any).timeout === 'function') {
        options.signal = (AbortSignal as any).timeout(fetchTimeoutMs)
      }

      const res = await fetch(fetchUrl, options)
      const text = await res.text()
      return { ok: res.ok, text, status: res.status }
    }
    catch (error) {
      return { ok: false, text: '', status: 0, error: String(error) }
    }
  }
}

export type VodFetchMode = 'auto' | 'direct' | 'main_world' | 'page'

export type VodFetchStep = 'direct' | 'main_world' | 'page'

/**
 * 解析指定模式下应依次尝试的取流步骤（纯逻辑，可独立测试）。
 * - auto：direct 优先，body 为空时追加 main_world；两者均失败时由调用方兜底 page（115vod 播放页同源 fetch）
 * - direct / main_world / page：仅对应单一步骤
 * @param isEmptyBody 请求体是否为空（GET 无 body）
 */
export function resolveVodFetchModeSteps(mode: VodFetchMode, isEmptyBody: boolean): VodFetchStep[] {
  if (mode === 'direct') return ['direct']
  if (mode === 'main_world') return ['main_world']
  if (mode === 'page') return ['page']

  const steps: VodFetchStep[] = ['direct']
  if (isEmptyBody) {
    steps.push('main_world')
  }
  return steps
}

const MATCH_115_PAGE_URLS = [
  '*://115.com/*',
  '*://*.115.com/*',
]

const MATCH_115_PLAYER_URLS = [
  '*://115.com/web/lixian/master/video/*',
  '*://*.115.com/web/lixian/master/video/*',
]

const MATCH_115VOD_PAGE_URLS = [
  '*://115vod.com/*',
  '*://*.115vod.com/*',
]

let extensionCreated115VodTabId: number | undefined
let vodRequestQueue: Promise<MainWorldTextResponse> = Promise.resolve({ ok: true, text: '' })

async function queryTabsByUrls(urls: string[]) {
  const groups = await Promise.all(urls.map(url => chrome.tabs.query({ url })))
  const seen = new Set<number>()

  return groups.flat().filter((tab) => {
    if (!tab.id || seen.has(tab.id)) {
      return false
    }
    seen.add(tab.id)
    return true
  })
}

interface RunIn115MainWorldOptions<TArgs extends unknown[], TResult> {
  sender?: chrome.runtime.MessageSender
  tabId?: number
  frameId?: number
  args: TArgs
  func: (...args: TArgs) => Promise<TResult> | TResult
}

export async function find115TabId(sender?: chrome.runtime.MessageSender): Promise<number | undefined> {
  let tabId = sender?.tab?.id
  if (!tabId) {
    const tabs = await query115Tabs()
    tabId = tabs[0]?.id
  }
  return tabId
}

export async function find115VodTabId(sender?: chrome.runtime.MessageSender): Promise<number | undefined> {
  const senderUrl = sender?.tab?.url || ''
  if (sender?.tab?.id && /^https:\/\/([^/]+\.)?115vod\.com\//.test(senderUrl)) {
    return sender.tab.id
  }

  const tabs = await query115VodTabs()
  return tabs[0]?.id
}

async function waitForTabComplete(tabId: number) {
  const tab = await chrome.tabs.get(tabId)
  if (tab.status === 'complete') return

  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener)
      resolve()
    }, 8000)

    const listener = (updatedTabId: number, changeInfo: any) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        clearTimeout(timer)
        chrome.tabs.onUpdated.removeListener(listener)
        resolve()
      }
    }

    chrome.tabs.onUpdated.addListener(listener)
  })
}

export async function ensure115VodTabId(pickCode?: string): Promise<number | undefined> {
  if (extensionCreated115VodTabId) {
    try {
      const tab = await chrome.tabs.get(extensionCreated115VodTabId)
      if (tab.id && /^https:\/\/([^/]+\.)?115vod\.com\//.test(tab.url || '')) {
        return tab.id
      }
    }
    catch {
      extensionCreated115VodTabId = undefined
    }
  }

  const url = pickCode ? `https://115vod.com/?pickcode=${encodeURIComponent(pickCode)}&share_id=0` : 'https://115vod.com/'
  const tab = await chrome.tabs.create({ url, active: false })
  if (!tab.id) return undefined
  extensionCreated115VodTabId = tab.id
  await waitForTabComplete(tab.id)
  // 115vod 未登录时会 302 重定向到登录页（passport/115.com），此时页面不在 115vod 域内，
  // MAIN world 再 fetch 115vod.com 会因跨源被拦截报 "Failed to fetch"。提前识别并复用登录态 tab 或放弃。
  try {
    const current = await chrome.tabs.get(tab.id)
    if (current.id && !/^https:\/\/([^/]+\.)?115vod\.com\//.test(current.url || '')) {
      extensionCreated115VodTabId = undefined
      await chrome.tabs.remove(tab.id).catch(() => {})
      return undefined
    }
  }
  catch {
    // tab may already be closed or inaccessible
  }
  return tab.id
}

async function closeExtension115VodTab(tabId: number) {
  if (extensionCreated115VodTabId !== tabId) return

  try {
    const tab = await chrome.tabs.get(tabId)
    if (/^https:\/\/([^/]+\.)?115vod\.com\//.test(tab.url || '')) {
      await chrome.tabs.remove(tabId)
    }
  }
  catch {
    // tab may already be closed or inaccessible
  }
  finally {
    if (extensionCreated115VodTabId === tabId) {
      extensionCreated115VodTabId = undefined
    }
  }
}

export async function closeExtensionCreated115VodTab() {
  const tabId = extensionCreated115VodTabId
  if (tabId) {
    await closeExtension115VodTab(tabId)
  }
}

export function createVodTabRefCounter() {
  let count = 0
  return {
    acquire() {
      count++
    },
    release() {
      if (count > 0) count--
      return count
    },
    isActive() {
      return count > 0
    },
  }
}

const extension115VodTabRefs = createVodTabRefCounter()

export async function acquireExtension115VodTabScope() {
  extension115VodTabRefs.acquire()
}

export async function releaseExtension115VodTabScope() {
  const remaining = extension115VodTabRefs.release()
  if (remaining === 0) {
    await closeExtensionCreated115VodTab()
  }
}

export async function runIn115MainWorld<TArgs extends unknown[], TResult>(
  options: RunIn115MainWorldOptions<TArgs, TResult>,
): Promise<TResult | undefined> {
  const tabId = options.tabId ?? await find115TabId(options.sender)
  if (!tabId) {
    return undefined
  }

  let injected: chrome.scripting.InjectionResult<unknown>[]
  try {
    injected = await chrome.scripting.executeScript({
      target: options.frameId === undefined ? { tabId } : { tabId, frameIds: [options.frameId] },
      world: 'MAIN',
      func: options.func,
      args: options.args,
    })
  }
  catch (error) {
    if (!isTransientFrameError(error)) {
      throw error
    }
    await wait(500)
    injected = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: options.func,
      args: options.args,
    })
  }

  return injected?.[0]?.result as TResult | undefined
}

export async function fetchTextIn115MainWorld(
  sender: chrome.runtime.MessageSender | undefined,
  url: string,
  body?: string,
  contentType?: string,
): Promise<MainWorldTextResponse> {
  const safeBody = body ?? ''

  try {
    const result = await runIn115MainWorld({
      sender,
      args: [url, safeBody, contentType ?? 'application/x-www-form-urlencoded', VOD_FETCH_TIMEOUT_MS, false],
      func: createMainWorldFetchFunc(),
    })

    if (!result) {
      return { ok: false, text: '', error: 'no 115.com tab found' }
    }

    return result as MainWorldTextResponse
  }
  catch (error) {
    return { ok: false, text: '', error: String(error) }
  }
}

export async function query115Tabs() {
  return await queryTabsByUrls(MATCH_115_PAGE_URLS)
}

async function get115VodTabId(
  sender: chrome.runtime.MessageSender | undefined,
  pickCode?: string,
): Promise<number | undefined> {
  let tabId = await find115VodTabId(sender)
  if (!tabId) {
    // 必须带 pickCode 打开 115vod 播放页：裸首页（115vod.com/）无有效会话，
    // 只有带 pickcode 的播放页加载后才会建立 115vod 会话，否则同源 fetch 会被 302 到登录页
    tabId = await ensure115VodTabId(pickCode)
  }
  return tabId
}

/**
 * 在 115vod 播放页的 MAIN world 内同源 fetch。
 * 页面加载后具备有效 115vod 会话，是 push/batch 等接口最可靠的执行环境。
 */
async function fetch115VodPageMode(
  sender: chrome.runtime.MessageSender | undefined,
  url: string,
  safeBody: string,
  contentType?: string,
  pickCode?: string,
): Promise<MainWorldTextResponse | null> {
  const tabId = await get115VodTabId(sender, pickCode)
  if (!tabId) {
    return null
  }

  const result = await runIn115MainWorld({
    tabId,
    args: [url, safeBody, contentType ?? 'application/x-www-form-urlencoded; charset=UTF-8', VOD_FETCH_TIMEOUT_MS, true],
    func: createMainWorldFetchFunc(),
  }) as MainWorldTextResponse

  if (!result?.ok && /failed to fetch|load failed/i.test(result?.error || '')) {
    // MAIN world fetch 跨源被拦截（115vod 会话失效跳转到登录页时最常见），
    // 转成可操作的提示，避免把裸 "TypeError: Failed to fetch" 抛给 UI
    return { ok: false, text: '', error: '115vod 页面请求失败（可能 115vod 未登录或会话已过期），请先访问 115vod.com 登录后重试' }
  }

  return result
}

export async function fetchTextIn115VodMainWorld(
  sender: chrome.runtime.MessageSender | undefined,
  url: string,
  body?: string,
  contentType?: string,
  pickCode?: string,
  mode: VodFetchMode = 'auto',
): Promise<MainWorldTextResponse> {
  vodRequestQueue = vodRequestQueue.catch(() => ({ ok: true, text: '' })).then(() => withVodQueueTimeout(
    fetchTextIn115VodMainWorldQueued(sender, url, body, contentType, pickCode, mode),
    VOD_QUEUE_STEP_TIMEOUT_MS,
  ))
  return await vodRequestQueue
}

async function fetchTextDirectVod(
  url: string,
  body?: string,
  contentType?: string,
): Promise<MainWorldTextResponse> {
  try {
    const safeBody = body ?? ''
    const isPost = safeBody.length > 0
    const headers: Record<string, string> = {
      Accept: 'application/json, text/javascript, */*; q=0.01',
    }
    if (isPost && contentType) {
      headers['Content-Type'] = contentType
    }

    const response = await fetchWithTimeout(url, {
      method: isPost ? 'POST' : 'GET',
      credentials: 'include',
      headers,
      body: isPost ? safeBody : undefined,
    }, VOD_FETCH_TIMEOUT_MS)
    const text = await response.text()
    return { ok: response.ok, text }
  }
  catch (error) {
    return { ok: false, text: '', error: String(error) }
  }
}

async function fetchTextIn115VodMainWorldQueued(
  sender: chrome.runtime.MessageSender | undefined,
  url: string,
  body?: string,
  contentType?: string,
  pickCode?: string,
  mode: VodFetchMode = 'auto',
): Promise<MainWorldTextResponse> {
  const safeBody = body ?? ''

  try {
    const steps = resolveVodFetchModeSteps(mode, safeBody.length === 0)

    for (const step of steps) {
      if (step === 'direct') {
        const direct = await fetchTextDirectVod(url, body, contentType)
        if (direct.ok || mode === 'direct') {
          return direct
        }
      }
      else if (step === 'main_world') {
        const mainWorld = await fetchTextIn115MainWorld(undefined, url, body, contentType)
        if (mainWorld.ok || mode === 'main_world') {
          return mainWorld
        }
      }
    }

    // direct/main_world 均不可用时（常见于浏览器无 115vod 会话 cookie，接口被 302 到登录页），
    // 兜底走 115vod 播放页内同源 fetch：页面加载后建立有效会话，接口即可正常调用。
    const pageResult = await fetch115VodPageMode(sender, url, safeBody, contentType, pickCode)
    if (pageResult) {
      return pageResult
    }

    if (mode !== 'page') {
      return { ok: false, text: '', error: '115vod page mode disabled' }
    }

    return { ok: false, text: '', error: '115vod 未登录或页面加载失败，请先访问 115vod.com 登录后重试' }
  }
  catch (error) {
    return { ok: false, text: '', error: String(error) }
  }
}

export async function queryPlayerTabs() {
  return await queryTabsByUrls(MATCH_115_PLAYER_URLS)
}

export async function query115VodTabs() {
  return await queryTabsByUrls(MATCH_115VOD_PAGE_URLS)
}
