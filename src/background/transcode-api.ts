/**
 * 转码 115 API 封装：check/push/is_transcoded/batch 四类请求的文本构造与解析。
 * 统一走 115vod MAIN world fetch，消除重复的 URLSearchParams + parseJsonText 模板。
 */
import { fetchTextIn115VodMainWorld, query115Tabs } from '../platform/115/main-world'
import { fetchVideoInfoByPickCode } from '../platform/115/file-actions'

export interface TranscodeCheckResult {
  result?: number
  status?: number
  count?: number
  time?: number
  priority?: number
}

export interface TranscodePushResult {
  state?: boolean
  error?: string
  errno?: number
  msg?: string
  msg_code?: number
}

export interface IsTranscodedResult {
  state?: number
  message?: string
  code?: number
  data?: string[]
  count?: number
}

function parseJsonText<T>(text: string): T | null {
  if (!text) return null
  try {
    return JSON.parse(text) as T
  }
  catch {
    return null
  }
}

export async function checkTranscodeJob(sha1: string, pickCode: string, priority?: number): Promise<TranscodeCheckResult | null> {
  const params = new URLSearchParams({ sha1, priority: '100' })
  const body = priority === undefined ? JSON.stringify({ fid: sha1 }) : JSON.stringify({ fid: sha1, priority })
  const response = await fetchTextIn115VodMainWorld(
    undefined,
    `https://115vod.com/transcode/api/1.0/web/1.0/trans_code/check_transcode_job?${params}`,
    body,
    'application/json',
    pickCode,
  )
  if (!response.ok) {
    throw new Error(response.error || 'check transcode job failed')
  }
  const parsed = parseJsonText<TranscodeCheckResult>(response.text)
  if (!parsed) throw new Error('check transcode job parse failed')
  return parsed
}

export async function pushVipTranscode(sha1: string, pickCode: string): Promise<TranscodePushResult | null> {
  const body = new URLSearchParams()
  body.append('op', 'vip_push')
  body.append('pickcode', pickCode)
  body.append('sha1', sha1)

  const response = await fetchTextIn115VodMainWorld(
    undefined,
    'https://115vod.com/site/?ct=play&ac=push',
    body.toString(),
    'application/x-www-form-urlencoded; charset=UTF-8',
    pickCode,
    'page', // Force 'page' mode to avoid CORS issues on redirection
  )
  if (!response.ok) {
    throw new Error(response.error || 'vip push request failed')
  }
  const parsed = parseJsonText<TranscodePushResult>(response.text)
  if (!parsed) throw new Error('vip push parse failed')
  return parsed
}

export async function checkIsTranscoded(pickCode: string): Promise<IsTranscodedResult | null> {
  const body = new URLSearchParams()
  body.append('pick_code', pickCode)

  const response = await fetchTextIn115VodMainWorld(
    undefined,
    'https://115vod.com/webapi/files/is_transcoded',
    body.toString(),
    'application/x-www-form-urlencoded; charset=UTF-8',
    pickCode,
  )
  if (!response.ok) {
    throw new Error(response.error || 'is_transcoded request failed')
  }
  const parsed = parseJsonText<IsTranscodedResult>(response.text)
  if (!parsed) throw new Error('is_transcoded parse failed')
  return parsed
}

export async function pushBatchTranscode(fileIds: string[], pickCode: string): Promise<TranscodePushResult | null> {
  if (fileIds.length === 0) return null

  const body = new URLSearchParams()
  body.append('file_ids', fileIds.join(','))

  const response = await fetchTextIn115VodMainWorld(
    undefined,
    'https://115vod.com/site/?ctl=play&ac=batch_push',
    body.toString(),
    'application/x-www-form-urlencoded; charset=UTF-8',
    pickCode,
    'page', // Force 'page' mode
  )
  if (!response.ok) {
    throw new Error(response.error || 'batch push request failed')
  }
  const parsed = parseJsonText<TranscodePushResult>(response.text)
  if (!parsed) throw new Error('batch push parse failed')
  return parsed
}

/**
 * 从 115 标签页列表中选择转码上下文目标 tab
 * 优先当前活跃 tab，避免多标签/多账号时取错账号上下文
 */
export function pickTranscodeTab(tabs: Array<{ id?: number, active?: boolean }>): number | undefined {
  return tabs.find(tab => tab.active)?.id ?? tabs[0]?.id
}

/**
 * 获取转码所需的视频上下文（sha1 / parentId / fileId）
 * 从发送方 tab 或 115 页面 tab 获取，返回带 SHA1 的上下文
 */
export async function getTranscodeContext(pickCode: string, sender?: chrome.runtime.MessageSender) {
  let tabId = sender?.tab?.id
  if (!tabId) {
    const tabs = await query115Tabs()
    tabId = pickTranscodeTab(tabs)
  }
  if (!tabId) return { error: '未找到 115.com 页面' }

  const videoResult = await fetchVideoInfoByPickCode(tabId, pickCode) as any
  if (!videoResult?.state) {
    return { error: videoResult?.error || '获取视频信息失败' }
  }

  const sha1 = videoResult.sha1
  if (!sha1) {
    return { error: '无法获取 SHA1' }
  }

  return {
    pickCode,
    sha1,
    parentId: videoResult.parent_id || videoResult.data?.parent_id || '',
    fileId: videoResult.file_id || videoResult.data?.file_id || '',
  }
}

export function buildQueuedResponse(job: TranscodeCheckResult | null | undefined, detail: string, pushAccepted?: boolean) {
  return {
    ok: true,
    state: 'queued' as const,
    queueCount: job?.count,
    etaSeconds: job?.time,
    priority: job?.priority,
    pushAccepted,
    detail,
  }
}
