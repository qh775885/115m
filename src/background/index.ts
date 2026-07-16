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
  handleDeleteSuccessRefresh,
  handleMoveFile,
  handleMoveSuccessRefresh,
} from './file-operations'
import {
  handleFetchM3u8,
  handleFetchSubtitles,
  handleFetchPlaylist,
} from './media-info'

// 安装时初始化
chrome.runtime.onInstalled.addListener((details) => {
  registerEarlyOverrideScript()
})

// 浏览器启动时，确保 early script 已注册
chrome.runtime.onStartup.addListener(() => {
  registerEarlyOverrideScript()
})

/**
 * 注册一个极轻量的 content script，在 document_start 阶段同步覆盖 115 视频页面
 * 脚本放在 public/ 目录下，Vite 原样复制不打包，确保同步执行
 * 这样能在 115 原生行内脚本执行之前接管页面，避免 "undefined action!" 闪现
 */
async function registerEarlyOverrideScript() {
  try {
    await chrome.scripting.registerContentScripts([{
      id: 'video-page-early-override',
      matches: [
        'https://115.com/web/lixian/master/video/*',
        'https://*.115.com/web/lixian/master/video/*',
      ],
      js: ['video-page-early.js'],
      runAt: 'document_start',
      world: 'ISOLATED' as any,
    }])
  }
  catch (e) {
    console.warn('[115m] Failed to register early override script:', e)
  }
}

// 监听来自 content script 和 player 页面的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch((err) => {
    console.error('[115m] BG error:', err)
    sendResponse({ error: err.message })
  })
  return true // 保持 sendResponse 有效
})

if (import.meta.hot) {
  import.meta.hot.on('extension-reload', () => {
    // 重载前向所有标签页发送刷新指令
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id && tab.url && (tab.url.includes('115.com') || tab.url.includes('115vod.com'))) {
          // 捕获错误以防某些页面无法注入或已断开
          chrome.tabs.reload(tab.id).catch(() => {})
        }
      })
      setTimeout(() => {
        chrome.runtime.reload()
      }, 100)
    })
  })
}

let lastOpenTabMeta: { url: string, ts: number } | null = null

const TRUSTED_PAGE_HOSTS = new Set(['115.com', '115vod.com'])
const TRUSTED_EXTENSION_PROTOCOL = 'chrome-extension:'
const MAIN_WORLD_ALLOWED_PATHS = [
  { host: 'webapi.115.com', path: '/files' },
  { host: 'webapi.115.com', path: '/files/' },
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
  if (!rawUrl) return true

  try {
    const url = new URL(rawUrl)
    if (url.protocol === TRUSTED_EXTENSION_PROTOCOL && url.host === chrome.runtime.id) return true
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
  switch (message.type) {
    case 'PING':
      return { pong: true }

    case 'MAIN_WORLD_FETCH':
      assertTrustedSender(sender, message.type)
      assertAllowedMainWorldUrl(message.data.url)
      return executeInMainWorld(sender, message.data.url, message.data.body, message.data.contentType)

    case 'MAIN_WORLD_GET':
      assertTrustedSender(sender, message.type)
      assertAllowedMainWorldUrl(message.data.url)
      return executeInMainWorld(sender, message.data.url)

    case 'TRANSCODE_FRAME_READY':
      assertTrustedSender(sender, message.type)
      return register115VodFrameSession(sender, message.data.pickCode)

    case 'OPEN_TAB': {
      assertTrustedSender(sender, message.type)
      const now = Date.now()
      if (lastOpenTabMeta && lastOpenTabMeta.url === message.url && now - lastOpenTabMeta.ts < 2500) {
        return { success: true, deduped: true }
      }
      lastOpenTabMeta = { url: message.url, ts: now }
      await chrome.tabs.create({ url: message.url })
      return { success: true }
    }

    case 'MOVE_SUCCESS_REFRESH':
      assertTrustedSender(sender, message.type)
      return handleMoveSuccessRefresh()

    case 'DELETE_SUCCESS_REFRESH':
      assertTrustedSender(sender, message.type)
      return handleDeleteSuccessRefresh(message)

    case 'FETCH_M3U8':
      assertTrustedSender(sender, message.type)
      return handleFetchM3u8(message)

    case 'FETCH_SUBTITLES':
      assertTrustedSender(sender, message.type)
      return handleFetchSubtitles(message, sender)

    case 'FETCH_PLAYLIST':
      assertTrustedSender(sender, message.type)
      return handleFetchPlaylist(message)

    case 'MOVE_FILE':
      assertTrustedSender(sender, message.type)
      return handleMoveFile(message, sender)

    case 'DELETE_FILE':
      assertTrustedSender(sender, message.type)
      return handleDeleteFile(message, sender)

    case 'TRANSCODE_ACCELERATE':
      assertTrustedSender(sender, message.type)
      return handleTranscode(message)

    case 'TRANSCODE_STATUS':
      assertTrustedSender(sender, message.type)
      return handleTranscodeStatus(message)

    case 'TRANSCODE_NATIVE_FALLBACK':
      assertTrustedSender(sender, message.type)
      return handleTranscodeNativeFallback(message)

    case 'SET_COOKIE': {
      assertTrustedSender(sender, message.type)
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
      assertTrustedSender(sender, message.type)
      const { url, filename } = message.data
      assertDownloadUrl(url)
      chrome.downloads.download({
        url,
        filename: filename || undefined,
        saveAs: true,
      })
      return { success: true }
    }

    case 'GET_HISTORY': {
      assertTrustedSender(sender, message.type)
      return await getHistory(message.data.pickCode)
    }

    case 'GET_NATIVE_HISTORY': {
      assertTrustedSender(sender, message.type)
      return await getNativeHistory(message.data.pickCode, message.data.shareId)
    }

    case 'GET_NATIVE_HISTORY_MAP': {
      assertTrustedSender(sender, message.type)
      return await getNativeHistoryMap(message.data.pickCodes, message.data.shareId)
    }

    case 'SET_NATIVE_HISTORY': {
      assertTrustedSender(sender, message.type)
      return { success: await setNativeHistory(message.data) }
    }

    case 'GET_HISTORY_MAP': {
      assertTrustedSender(sender, message.type)
      return await getHistoryMap()
    }

    case 'SET_HISTORY': {
      assertTrustedSender(sender, message.type)
      await setHistory(message.data)
      return { success: true }
    }

    case 'DELETE_HISTORY': {
      assertTrustedSender(sender, message.type)
      await deleteHistory(message.data.pickCode)
      return { success: true }
    }

    default:
      return { error: 'Unknown message type' }
  }
}
