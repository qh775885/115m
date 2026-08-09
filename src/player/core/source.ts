import type { M3u8Item } from '../../lib/types'
import { sendTypedRuntimeMessageSafe } from './runtime'

const PLAYBACK_SOURCE_MESSAGE_TIMEOUT_MS = 12000

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
