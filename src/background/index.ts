/**
 * Background Service Worker
 * 消息路由分发 + 生命周期管理
 */

import type { RuntimeMessage } from '../shared/messages'
import { executeInMainWorld } from './helpers'
import { assertAllowedOpenTabUrl } from './tab-allowlist'
import { getNativeHistory, getNativeHistoryMap, setNativeHistory } from './native-history'
import {
  handleTranscode,
  handleTranscodeNativeFallback,
  handleTranscodeStatus,
} from './transcode'
import {
  handleDeleteFile,
  handleMoveSuccessRefresh,
} from './file-operations'
import {
  handleFetchM3u8,
  handleFetchM3u8Text,
  handleFetchSubtitles,
  handleFetchPlaylist,
} from './media-info'
import { sweepStaleCache } from './cache-sweeper'

void sweepStaleCache()

// 监听来自 content script 和 player 页面的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'PING') {
    sendResponse({ pong: true })
    return false // 同步响应返回 false，防止端口悬挂导致 Service Worker 僵死
  }
  handleMessage(message, sender).then(sendResponse).catch((err) => {
    console.error('[115m] BG error:', err)
    sendResponse({ error: err?.message || String(err) })
  })
  return true // 异步响应保持 sendResponse 通道有效
})

// 监听长连接 Port 保活（来自 115 页面），防止 MV3 Service Worker 在用户浏览时意外休眠或死锁
chrome.runtime.onConnect?.addListener((port) => {
  if (port.name === 'keep-alive') {
    if (!isTrustedSender(port.sender)) {
      port.disconnect()
      return
    }
    port.onMessage.addListener((msg) => {
      if (msg === 'ping') {
        port.postMessage('pong')
      }
    })
  }
})

let lastOpenTabMeta: { url: string, ts: number } | null = null

const TRUSTED_PAGE_HOSTS = new Set(['115.com', '115vod.com', 'localhost'])
const TRUSTED_EXTENSION_PROTOCOL = 'chrome-extension:'
const MAIN_WORLD_ALLOWED_PATHS = [
  { host: 'webapi.115.com', path: '/files' },
  { host: 'webapi.115.com', path: '/files/add' },
  { host: 'webapi.115.com', path: '/files/move' },
  { host: 'webapi.115.com', path: '/files/star' },
  { host: 'webapi.115.com', path: '/rb/delete' },
  { host: 'webapi.115.com', path: '/movies/subtitle' },
  { host: 'proapi.115.com', path: '/app/chrome/downurl' },
  { host: '115vod.com', path: '/webapi/movies/subtitle' },
]


function readSenderUrl(sender?: chrome.runtime.MessageSender) {
  return sender?.url || sender?.tab?.url || ''
}

/** 校验消息发送方是否为受信来源（115 域名 / 扩展自身 / 本地开发） */
export function isTrustedSender(sender?: chrome.runtime.MessageSender) {
  const rawUrl = readSenderUrl(sender)
  if (!rawUrl) return false

  try {
    const url = new URL(rawUrl)
    if (url.protocol === TRUSTED_EXTENSION_PROTOCOL && url.host === chrome.runtime.id) return true
    // 开发模式下，允许 WXT 的 background 热更新请求
    if (url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) return true
    return TRUSTED_PAGE_HOSTS.has(url.hostname) || url.hostname.endsWith('.115.com')
  }
  catch {
    return false
  }
}

function assertTrustedSender(sender: chrome.runtime.MessageSender | undefined, type: RuntimeMessage['type']) {
  if (!isTrustedSender(sender)) {
    throw new Error(`Untrusted sender for ${type}`)
  }
}

/** 校验 MAIN world fetch 目标 URL 是否在白名单内（仅 https + 已登记的 115 路径） */
export function assertAllowedMainWorldUrl(rawUrl: string) {
  const url = new URL(rawUrl)
  if (url.protocol !== 'https:') throw new Error('MAIN world URL must use https')

  const allowed = MAIN_WORLD_ALLOWED_PATHS.some(rule =>
    url.hostname === rule.host && (url.pathname === rule.path || url.pathname.startsWith(`${rule.path}/`)),
  )
  if (!allowed) throw new Error('MAIN world URL is not allowed')
}

/** 校验 cookie 域名仅限 115CDN 下载域 */
export function normalizeCookieDomain(domain: string) {
  const normalized = domain.trim().toLowerCase()
  if (normalized !== '.115cdn.net' && normalized !== 'dl.115cdn.net') {
    throw new Error('Cookie domain is not allowed')
  }
  return normalized
}

async function handleMessage(message: RuntimeMessage, sender?: chrome.runtime.MessageSender): Promise<any> {
  if (message.type !== 'PING') {
    assertTrustedSender(sender, message.type)
  }

  switch (message.type) {
    case 'MAIN_WORLD_FETCH':
      assertAllowedMainWorldUrl(message.data.url)
      return executeInMainWorld(sender, message.data.url, message.data.body, message.data.contentType)

    case 'MAIN_WORLD_GET':
      assertAllowedMainWorldUrl(message.data.url)
      return executeInMainWorld(sender, message.data.url)

    case 'OPEN_TAB': {
      assertAllowedOpenTabUrl(message.url)
      const now = Date.now()
      if (lastOpenTabMeta && lastOpenTabMeta.url === message.url && now - lastOpenTabMeta.ts < 2500) {
        return { success: true, deduped: true }
      }
      lastOpenTabMeta = { url: message.url, ts: now }
      await chrome.tabs.create({ url: message.url })
      return { success: true }
    }

    case 'REQUEST_MOVE_REFRESH':
      return handleMoveSuccessRefresh(sender)

    case 'FETCH_M3U8':
      return handleFetchM3u8(message)

    case 'FETCH_M3U8_TEXT':
      return handleFetchM3u8Text(message)

    case 'FETCH_SUBTITLES':
      return handleFetchSubtitles(message, sender)

    case 'FETCH_PLAYLIST':
      return handleFetchPlaylist(message)

    case 'DELETE_FILE':
      return handleDeleteFile(message, sender)

    case 'TRANSCODE_ACCELERATE':
      return handleTranscode(message, sender)

    case 'TRANSCODE_STATUS':
      return handleTranscodeStatus(message, sender)

    case 'TRANSCODE_NATIVE_FALLBACK':
      return handleTranscodeNativeFallback(message)

    case 'SET_COOKIE': {
      const { data } = message
      const domain = normalizeCookieDomain(data.domain)
      await chrome.cookies.set({
        url: 'https://dl.115cdn.net',
        name: data.name,
        value: data.value,
        path: data.path || '/',
        domain,
        secure: true,
        expirationDate: data.expirationDate,
        sameSite: data.sameSite as chrome.cookies.SameSiteStatus,
      })
      return { success: true }
    }

    case 'GET_NATIVE_HISTORY': {
      return await getNativeHistory(message.data.pickCode, message.data.shareId)
    }

    case 'GET_NATIVE_HISTORY_MAP': {
      return await getNativeHistoryMap(message.data.pickCodes, message.data.shareId)
    }

    case 'SET_NATIVE_HISTORY': {
      return { success: await setNativeHistory(message.data) }
    }

    default:
      return { error: 'Unknown message type' }
  }
}
