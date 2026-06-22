/**
 * 媒体信息 handler：M3U8 获取、字幕获取、播放列表获取
 */
import type {
  MsgFetchM3u8,
  MsgFetchPlaylist,
  MsgFetchSubtitles,
} from '../shared/messages'
import { parseM3u8Text } from '../lib/m3u8-parser'
import {
  fetchPlaylistIn115Page,
  fetchVideoInfoByPickCode,
} from '../platform/115/file-actions'
import { executeInMainWorld } from './helpers'
import { query115Tabs } from '../platform/115/main-world'

export async function handleFetchM3u8(message: MsgFetchM3u8) {
  const pickCode = message.data.pickCode
  const url = `https://115.com/api/video/m3u8/${pickCode}.m3u8`
  const maxRetries = 2

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        credentials: 'include',
        headers: { Accept: '*/*' },
      })
      const htmlText = await res.text()
      const m3u8List = parseM3u8Text(htmlText)

      if (m3u8List.length > 0) {
        return { list: m3u8List }
      }

      // 响应不是有效 M3U8（可能是 JSON 错误），重试
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
        continue
      }

      // 重试用尽，返回空列表
      return { list: [] }
    }
    catch (e: any) {
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
        continue
      }
      return { error: e?.message || String(e) }
    }
  }

  return { error: 'unreachable' }
}

export async function handleFetchSubtitles(message: MsgFetchSubtitles, sender?: chrome.runtime.MessageSender) {
  try {
    const pickCode = encodeURIComponent(message.data.pickCode)

    const url = `https://webapi.115.com/movies/subtitle?pickcode=${pickCode}`

    // 注入简单的 fetch 逻辑，确保最纯粹的请求环境
    const script = `
      (async () => {
        try {
          const res = await fetch("${url}", { credentials: "include" });
          const text = await res.text();
          return { ok: true, text };
        } catch (e) {
          return { ok: false, error: e.message };
        }
      })()
    `

    try {
      const mainWorldResult = await executeInMainWorld(sender, script)
      if (mainWorldResult?.ok && mainWorldResult.text) {
        let parsed: any = null
        try {
          parsed = JSON.parse(mainWorldResult.text)
        } catch (e) {}

        if (parsed) return parsed
      }
    } catch (e) {
      console.warn('[115m][bg] script injection fetch failed', e)
    }

    // 备用 fallback: 直接在 background fetch
    const res = await fetch(url, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
      },
    })

    const text = await res.text()
    let result: any = null
    try {
      result = JSON.parse(text)
    } catch (e) {}

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

    let { cid, pickCode } = message.data

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
    const result = await fetchPlaylistIn115Page(tabId, cid) as any
    if (!result?.state) {
      return { error: result?.error || 'API error', list: [], path: [] }
    }

    return {
      list: result.data ?? [],
      path: result.path ?? [],
    }
  }
  catch (e) {
    return { error: String(e), list: [], path: [] }
  }
}
