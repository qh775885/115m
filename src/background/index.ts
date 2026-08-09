/**
 * Background Service Worker
 * 消息路由分发 + 生命周期管理
 */

import type { RuntimeMessage } from '../shared/messages'
import { executeInMainWorld } from './helpers'
import { deleteHistory, getHistory, getHistoryMap, setHistory } from './history-store'
import { getNativeHistory, getNativeHistoryMap, setNativeHistory } from './native-history'
import { register115VodFrameSession } from '../platform/115/main-world'
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

// 监听来自 content script 和 player 页面的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'PING') {
    sendResponse({ pong: true })
    return true
  }
  handleMessage(message, sender).then(sendResponse).catch((err) => {
    console.error('[115m] BG error:', err)
    sendResponse({ error: err.message })
  })
  return true // 保持 sendResponse 有效
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
const DOWNLOAD_ALLOWED_HOSTS = ['115cdn.net']

function readSenderUrl(sender?: chrome.runtime.MessageSender) {
  return sender?.url || sender?.tab?.url || ''
}

function isTrustedSender(sender?: chrome.runtime.MessageSender) {
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

function assertAllowedMainWorldUrl(rawUrl: string) {
  const url = new URL(rawUrl)
  if (url.protocol !== 'https:') throw new Error('MAIN world URL must use https')

  const allowed = MAIN_WORLD_ALLOWED_PATHS.some(rule =>
    url.hostname === rule.host && (url.pathname === rule.path || url.pathname.startsWith(`${rule.path}/`)),
  )
  if (!allowed) throw new Error('MAIN world URL is not allowed')
}

function normalizeCookieDomain(domain: string) {
  const normalized = domain.trim().toLowerCase()
  if (normalized !== '.115cdn.net' && normalized !== 'dl.115cdn.net') {
    throw new Error('Cookie domain is not allowed')
  }
  return normalized
}

function assertDownloadUrl(rawUrl: string) {
  const url = new URL(rawUrl)
  if (url.protocol !== 'https:') throw new Error('Download URL must use https')
  if (!DOWNLOAD_ALLOWED_HOSTS.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))) {
    throw new Error('Download URL is not allowed')
  }
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

    case 'TRANSCODE_FRAME_READY':
      return register115VodFrameSession(sender, message.data.pickCode)

    case 'OPEN_TAB': {
      const now = Date.now()
      if (lastOpenTabMeta && lastOpenTabMeta.url === message.url && now - lastOpenTabMeta.ts < 2500) {
        return { success: true, deduped: true }
      }
      lastOpenTabMeta = { url: message.url, ts: now }
      await chrome.tabs.create({ url: message.url })
      return { success: true }
    }

    case 'REQUEST_MOVE_REFRESH':
      return handleMoveSuccessRefresh()

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
      return handleTranscode(message)

    case 'TRANSCODE_STATUS':
      return handleTranscodeStatus(message)

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

    case 'DOWNLOAD': {
      const { url, filename } = message.data
      assertDownloadUrl(url)
      try {
        await chrome.downloads.download({
          url,
          filename: filename || undefined,
          saveAs: true,
        })
      }
      catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) }
      }
      return { success: true }
    }

    case 'GET_HISTORY': {
      return await getHistory(message.data.pickCode)
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

    case 'GET_HISTORY_MAP': {
      return await getHistoryMap()
    }

    case 'SET_HISTORY': {
      await setHistory(message.data)
      return { success: true }
    }

    case 'DELETE_HISTORY': {
      await deleteHistory(message.data.pickCode)
      return { success: true }
    }

    default:
      return { error: 'Unknown message type' }
  }
}
