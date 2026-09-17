/**
 * 115m 2.0 · 网盘文件操作适配层（Layer 1）
 * 收藏 / 下载 / 删除，全部经 bridge 调用扩展后台特权接口。
 */

import { deleteVideoFile, fetchFavoriteStatus, updateFavoriteStatus } from '../../core/player-api'
import { fetchBestDownloadResult } from '../../../lib/pro-api'
import { callExtensionBridge } from '../bridge-client'

const send = <T = unknown>(message: unknown): Promise<T | null> => callExtensionBridge<T>(message)

export async function loadFavorite(pickCode: string): Promise<boolean | null> {
  return await fetchFavoriteStatus(send, pickCode)
}

export async function setFavorite(fileId: string, marked: boolean): Promise<boolean> {
  if (!fileId) return marked
  return await updateFavoriteStatus(send, fileId, marked)
}

export async function removeVideo(fileId: string, parentId: string, pickCode: string): Promise<boolean> {
  return await deleteVideoFile(send, fileId, parentId, pickCode)
}

export async function downloadVideo(pickCode: string): Promise<void> {
  const result = await fetchBestDownloadResult(send as never, pickCode)
  if (result?.url?.auth_cookie) {
    await callExtensionBridge({
      type: 'SET_COOKIE',
      data: {
        name: result.url.auth_cookie.name,
        value: result.url.auth_cookie.value,
        path: '/',
        domain: '.115cdn.net',
        expirationDate: Number(result.url.auth_cookie.expire),
      },
    })
  }
  if (result?.url?.url) {
    window.open(result.url.url, '_blank')
  }
  else {
    throw new Error('未获取到真实下载地址')
  }
}
