/**
 * 媒体信息 handler：M3U8 获取、字幕获取、播放列表获取
 */
import type {
  MsgFetchM3u8,
  MsgFetchM3u8Text,
  MsgFetchPlaylist,
  MsgFetchSubtitles,
} from '../shared/messages'
import { parseM3u8Text } from '../lib/m3u8-parser'
import { drive115 } from '../lib/drive115'
import {
  fetchPlaylistIn115Page,
  fetchVideoInfoByPickCode,
} from '../platform/115/file-actions'
import { executeInMainWorld } from './helpers'
import { query115Tabs } from '../platform/115/main-world'
import { fetchWithTimeout } from '../lib/promise'
import { parseJsonText } from '../shared/utils'

/** 播放列表缓存 TTL：同一文件夹在短时间内重复进入播放器/刷新时复用，避免每次全量拉取 */
const PLAYLIST_CACHE_TTL_MS = 10_000
const playlistCache = new Map<string, { ts: number, list: unknown[], path: unknown[] }>()

export async function handleFetchM3u8(message: MsgFetchM3u8) {
  try {
    const text = await drive115.fetchM3u8TextWithRetry(message.data.pickCode)
    return { list: parseM3u8Text(text) }
  }
  catch (e: any) {
    return { error: e?.message || String(e) }
  }
}

export async function handleFetchM3u8Text(message: MsgFetchM3u8Text) {
  try {
    const text = await drive115.fetchM3u8TextWithRetry(message.data.pickCode)
    return { text }
  }
  catch (e: any) {
    return { error: e?.message || String(e) }
  }
}

export async function handleFetchSubtitles(message: MsgFetchSubtitles, sender?: chrome.runtime.MessageSender) {
  try {
    const pickCode = encodeURIComponent(message.data.pickCode)

    const url = `https://webapi.115.com/movies/subtitle?pickcode=${pickCode}`

    try {
      const mainWorldResult = await executeInMainWorld(sender, url)
      if (mainWorldResult?.ok && mainWorldResult.text) {
        const parsed = parseJsonText(mainWorldResult.text)

        if (parsed) return parsed
      }
    } catch (e) {
      console.warn('[115m][bg] script injection fetch failed', e)
    }

    // 备用 fallback: 直接在 background fetch
    const res = await fetchWithTimeout(url, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
      },
    }, 15000)

    const text = await res.text()
    const result = parseJsonText(text)

    if (result) {
      return result
    }

    return { data: [], error: 'empty' }
  }
  catch (e: any) {
    console.warn('[115m][bg] fetch subtitles failed', e)
    return { data: [], error: e?.message || String(e) }
  }
}

export async function handleFetchPlaylist(message: MsgFetchPlaylist) {
  try {
    const tabs = await query115Tabs()
    const tabId = tabs[0]?.id
    if (!tabId) return { error: 'no 115.com tab found', list: [], path: [] }

    let { cid } = message.data
    const { pickCode } = message.data

    if (!cid && pickCode) {
      const videoResult = await fetchVideoInfoByPickCode(tabId, pickCode) as any
      if (videoResult?.state) {
        cid = videoResult.parent_id || videoResult.data?.parent_id || ''
      }
      if (!cid) {
        console.warn('[115m] FETCH_PLAYLIST: could not get parent_id from video info')
        return { error: 'no cid available', list: [], path: [] }
      }
    }

    if (!cid) return { error: 'no cid provided', list: [], path: [] }

    const cacheKey = `playlist:${cid}`
    const cached = playlistCache.get(cacheKey)
    if (cached && Date.now() - cached.ts <= PLAYLIST_CACHE_TTL_MS) {
      return { list: cached.list, path: cached.path }
    }

    const result = await fetchPlaylistIn115Page(tabId, cid) as any
    if (!result?.state) {
      return { error: result?.error || 'API error', list: [], path: [] }
    }

    const list = result.data ?? []
    const path = result.path ?? []
    playlistCache.set(cacheKey, { ts: Date.now(), list, path })
    return { list, path }
  }
  catch (e) {
    return { error: String(e), list: [], path: [] }
  }
}
