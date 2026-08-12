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

export type VodFetchMode = 'auto' | 'direct' | 'main_world' | 'page'

interface VodFrameSession {
  tabId: number
  frameId: number
  pickCode: string
  expiresAt: number
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
const vodFrameSessions = new Map<string, VodFrameSession>()

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
      args: [url, safeBody, contentType ?? 'application/x-www-form-urlencoded', VOD_FETCH_TIMEOUT_MS],
      func: async (fetchUrl: string, fetchBody: string, requestContentType: string, fetchTimeoutMs: number) => {
        try {
          const isPost = fetchBody.length > 0
          const options: RequestInit = {
            method: isPost ? 'POST' : 'GET',
            credentials: 'include',
          }
          if (isPost) {
            options.headers = { 'Content-Type': requestContentType }
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
      },
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

export async function register115VodFrameSession(sender: chrome.runtime.MessageSender | undefined, pickCode: string) {
  const tabId = sender?.tab?.id
  if (!tabId) return { ok: false, error: 'no sender tab' }

  for (let i = 0; i < 40; i++) {
    const frames = await chrome.webNavigation.getAllFrames({ tabId }).catch(() => null)
    const frame = frames?.find(item => item.frameId !== 0 && /^https:\/\/([^/]+\.)?115vod\.com\//.test(item.url || ''))
    if (frame) {
      vodFrameSessions.set(pickCode, { tabId, frameId: frame.frameId, pickCode, expiresAt: Date.now() + 60_000 })
      return { ok: true, frameId: frame.frameId }
    }
    await new Promise(resolve => setTimeout(resolve, 250))
  }

  return { ok: false, error: '115vod iframe not found' }
}

export async function close115VodFrameSession(pickCode: string) {
  const session = vodFrameSessions.get(pickCode)
  vodFrameSessions.delete(pickCode)
  if (!session) return

  try {
    await chrome.scripting.executeScript({
      target: { tabId: session.tabId },
      world: 'ISOLATED',
      args: [pickCode],
      func: (targetPickCode: string) => {
        const frame = document.querySelector(`iframe[data-115m-transcode-frame="${targetPickCode}"]`)
        frame?.remove()
      },
    })
  }
  catch {
    // tab may be closed or script injection may fail
  }
}

async function get115VodFrameSession(pickCode?: string) {
  if (!pickCode) return undefined
  const session = vodFrameSessions.get(pickCode)
  if (!session) return undefined
  if (Date.now() > session.expiresAt) {
    vodFrameSessions.delete(pickCode)
    return undefined
  }
  return session
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
    if (mode === 'direct' || mode === 'auto') {
      const direct = await fetchTextDirectVod(url, body, contentType)
      if (direct.ok || mode === 'direct') {
        return direct
      }
    }

    if (mode === 'main_world' || (mode === 'auto' && safeBody.length === 0)) {
      const mainWorld = await fetchTextIn115MainWorld(undefined, url, body, contentType)
      if (mainWorld.ok || mode === 'main_world') {
        return mainWorld
      }
    }

    if (mode !== 'page') {
      return { ok: false, text: '', error: '115vod page mode disabled' }
    }

    const frameSession = await get115VodFrameSession(pickCode)
    let tabId = frameSession?.tabId ?? await find115VodTabId(sender)
    if (!tabId) {
      tabId = await ensure115VodTabId(pickCode)
    }
    if (!tabId) {
      return { ok: false, text: '', error: 'no 115vod.com tab found' }
    }

    const result = await runIn115MainWorld({
      tabId,
      ...(frameSession ? { frameId: frameSession.frameId } : {}),
      args: [url, safeBody, contentType ?? 'application/x-www-form-urlencoded; charset=UTF-8', VOD_FETCH_TIMEOUT_MS],
      func: async (fetchUrl: string, fetchBody: string, requestContentType: string, fetchTimeoutMs: number) => {
        try {
          const isPost = fetchBody.length > 0
          const options: RequestInit = {
            method: isPost ? 'POST' : 'GET',
            credentials: 'include',
            headers: {
              Accept: 'application/json, text/javascript, */*; q=0.01',
              'X-Requested-With': 'XMLHttpRequest',
            },
          }
          if (isPost) {
            options.headers = {
              ...options.headers,
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
      },
    })

    return result as MainWorldTextResponse
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
