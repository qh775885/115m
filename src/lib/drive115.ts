/**
 * 115 Drive API 核心 - 从原项目移植，适配扩展环境
 */
import {
  NORMAL_URL, WEB_API_URL, VOD_URL,
} from './constants'
import type { M3u8Item } from './types'
import { parseM3u8Text } from './m3u8-parser'
import type {
  DownloadResult,
  FilesDownloadRes, VideoM3u8Res,
} from './api/types'
import { fetchWithTimeout } from './promise'

export class Drive115Error extends Error {
  static NotFoundM3u8 = class extends Error {
    constructor() { super('Not found m3u8 file') }
  }
}

/** 网络请求超时（毫秒），防止弱网/不响应时 fetch 永久挂起拖死整条链路 */
const REQUEST_TIMEOUT_MS = 15_000

/**
 * 网络请求封装
 */
class Request {
  async get(url: string, options?: RequestInit): Promise<Response> {
    return fetchWithTimeout(url, {
      credentials: 'include',
      ...options,
    }, REQUEST_TIMEOUT_MS)
  }

  async getJson<T>(url: string): Promise<T> {
    const res = await this.get(url)
    return res.json()
  }
}

const request = new Request()

export interface VerificationTabRecord {
  tabId?: number
  openedAt: number
}

export const VERIFICATION_TAB_COOLDOWN_MS = 10_000

let verificationTabRecord: VerificationTabRecord | undefined

export function shouldOpenVerificationTab(
  record: VerificationTabRecord | undefined,
  tabStillValid: boolean,
  now: number,
): boolean {
  if (!record) return true
  if (record.tabId !== undefined) {
    return !tabStillValid
  }
  return now - record.openedAt >= VERIFICATION_TAB_COOLDOWN_MS
}

async function isVerificationTabValid(tabId: number): Promise<boolean> {
  if (typeof chrome === 'undefined' || !chrome.tabs) return false
  try {
    const tab = await chrome.tabs.get(tabId)
    return /^https:\/\/([^/]+\.)?115vod\.com\//.test(tab.url || '')
  }
  catch {
    return false
  }
}

async function openVerificationTab(url: string) {
  const now = Date.now()
  const tabStillValid = verificationTabRecord?.tabId !== undefined
    ? await isVerificationTabValid(verificationTabRecord.tabId)
    : false
  if (!shouldOpenVerificationTab(verificationTabRecord, tabStillValid, now)) {
    return
  }

  if (typeof chrome !== 'undefined' && chrome.tabs) {
    const tab = await chrome.tabs.create({ url }).catch(() => undefined)
    verificationTabRecord = { tabId: tab?.id, openedAt: now }
  }
  else if (typeof window !== 'undefined') {
    window.open(url, '_blank')
    verificationTabRecord = { tabId: undefined, openedAt: now }
  }
}

/**
 * 115 Drive 核心类
 */
export class Drive115 {
  private req = request

  /**
   * 普通下载接口（有限制大小）
   */
  async webApiFilesDownload(pickcode: string): Promise<DownloadResult> {
    const res = await this.req.getJson<FilesDownloadRes>(
      `${WEB_API_URL}/files/download?pickcode=${pickcode}`,
    )

    if (res.errNo === 990001) {
      throw new Error('登录已过期，请重新登录 115')
    }

    if (!res.state || !res.file_url) {
      throw new Error(`获取下载地址失败: ${JSON.stringify(res)}`)
    }

    return { url: { url: res.file_url } }
  }

  /**
   * 获取 M3U8 根 URL
   */
  getM3u8Url(pickcode: string): string {
    return `${NORMAL_URL}/api/video/m3u8/${pickcode}.m3u8`
  }

  /**
   * 拉取 M3U8 原始文本，带 911 人机验证处理与重试
   * 供 media-info 与 getM3u8Info 共用，行为统一
   */
  async fetchM3u8TextWithRetry(pickcode: string, maxRetries = 2): Promise<string> {
    const url = this.getM3u8Url(pickcode)

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.req.get(url, {
          headers: { 'Accept': '*/*' },
        })
        const text = await response.text()

        if (text.startsWith('#')) {
          return text
        }

        let res: VideoM3u8Res | undefined
        try {
          res = JSON.parse(text) as VideoM3u8Res
        }
        catch {
          throw new Drive115Error.NotFoundM3u8()
        }

        if (res && res.state === false) {
          if (res.code === 911) {
            console.warn('[Drive115] 需要人机验证')
            const verifyUrl = `${VOD_URL}/?pickcode=${pickcode}`
            await openVerificationTab(verifyUrl)
          }
          throw new Error(`获取 m3u8 失败: ${res.error}`)
        }

        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
          continue
        }
        return text
      }
      catch (error) {
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
          continue
        }
        throw error
      }
    }

    throw new Error('m3u8 fetch failed')
  }

  /**
   * 解析 M3U8 列表
   */
  async getM3u8Info(pickcode: string): Promise<M3u8Item[]> {
    const text = await this.fetchM3u8TextWithRetry(pickcode)
    return parseM3u8Text(text)
  }

  /**
   * 获取 M3U8 列表
   */
  async getM3u8(pickcode: string): Promise<M3u8Item[]> {
    return this.getM3u8Info(pickcode)
  }
}

export const drive115 = new Drive115()
