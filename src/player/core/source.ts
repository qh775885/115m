import type { M3u8Item } from '../../lib/types'
import { fetchBestDownloadResult } from '../../lib/pro-api'
import { sendRuntimeMessageSafe, sendTypedRuntimeMessageSafe } from './runtime'

const PLAYBACK_SOURCE_MESSAGE_TIMEOUT_MS = 12000

/**
 * 获取无损播放源
 * 优先：Pro API 通过主世界 executeScript（正确 Origin）
 * 降级：Web API 直接 fetch
 */
export async function fetchUltraSource(pickCode: string): Promise<{ url: string, ultraUrl: string }> {
  const result = await fetchBestDownloadResult(sendRuntimeMessageSafe, pickCode)

  const url = result.url?.url
  if (!url) throw new Error('未获取到 Ultra 下载地址')

  if (result.url?.auth_cookie) {
    await sendRuntimeMessageSafe({
      type: 'SET_COOKIE',
      data: {
        name: result.url.auth_cookie.name,
        value: result.url.auth_cookie.value,
        path: '/',
        domain: '.115cdn.net',
        secure: true,
        expirationDate: Number(result.url.auth_cookie.expire),
        sameSite: 'no_restriction',
      },
    })
  }

  return { url, ultraUrl: url }
}

/**
 * 获取 M3U8 列表（通过 BG 代理避免跨域）
 */
export async function fetchM3u8WithRetry(pickCode: string): Promise<M3u8Item[]> {
  let lastError: unknown
  for (let i = 0; i < 2; i++) {
    try {
      const res = await sendTypedRuntimeMessageSafe({
        type: 'FETCH_M3U8',
        data: { pickCode },
      }, 0, 0, PLAYBACK_SOURCE_MESSAGE_TIMEOUT_MS)
      if (res?.list && res.list[0]) {
        return res.list
      }
      if (res?.error) {
        throw new Error(res.error)
      }
    }
    catch (error) {
      lastError = error
    }
    await new Promise(resolve => setTimeout(resolve, 250 * (i + 1)))
  }
  throw lastError ?? new Error('M3U8 empty')
}
