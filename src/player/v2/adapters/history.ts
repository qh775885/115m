/**
 * 115m 2.0 · 播放历史业务适配层（Layer 1）
 * 观看进度读写一律走 bridge（MAIN 世界无法直连 runtime）。
 */

import { callExtensionBridge } from '../bridge-client'

export interface NativeHistoryRecord {
  currentTime?: number
  duration?: number
  watchEnd?: boolean
}

export async function loadHistory(pickCode: string): Promise<NativeHistoryRecord | null> {
  if (!pickCode) return null
  const response = await callExtensionBridge<NativeHistoryRecord>({
    type: 'GET_NATIVE_HISTORY',
    data: { pickCode, shareId: '0' },
  })
  if (!response?.currentTime || response.currentTime <= 0 || response.watchEnd) return null
  return response
}

export async function saveHistory(params: {
  pickCode: string
  currentTime: number
  duration: number
}): Promise<void> {
  if (!params.pickCode) return
  await callExtensionBridge({
    type: 'SET_NATIVE_HISTORY',
    data: {
      pickCode: params.pickCode,
      shareId: '0',
      currentTime: Math.max(0, params.currentTime),
      definition: 0,
    },
  })
}
