/**
 * Background handlers: 播放列表、M3U8、移动文件等
 */
import type {
  MsgDeleteFile,
  MsgDeleteSuccessRefresh,
  MsgFetchM3u8,
  MsgFetchPlaylist,
  MsgFetchSubtitles,
  MsgMoveFile,
  MsgTranscode,
  MsgTranscodeNativeFallback,
  MsgTranscodeStatus,
} from '../shared/messages'
import { parseM3u8Text } from '../lib/m3u8-parser'
import {
  deleteFileIn115Page,
  fetchPlaylistIn115Page,
  fetchVideoInfoByPickCode,
  refreshListPageIn115Tab,
  removeDeletedNodeIn115Tab,
  showMoveFileDialogIn115Page,
} from '../platform/115/file-actions'
import { executeInMainWorld } from './helpers'
import { close115VodFrameSession, closeExtensionCreated115VodTab, fetchTextIn115MainWorld, fetchTextIn115VodMainWorld, find115TabId, query115Tabs, queryPlayerTabs } from '../platform/115/main-world'

interface TranscodeCheckResult {
  result?: number
  status?: number
  count?: number
  time?: number
  priority?: number
}

interface TranscodePushResult {
  state?: boolean
  error?: string
  errno?: number
  msg?: string
  msg_code?: number
}

interface IsTranscodedResult {
  state?: number
  message?: string
  code?: number
  data?: string[]
  count?: number
}

const TRANSCODE_COOLDOWN_MS = 45_000
const BATCH_TRANSCODE_COOLDOWN_MS = 10 * 60_000
const MAX_BATCH_TRANSCODE_COUNT = 20
const NATIVE_FALLBACK_TIMEOUT_MS = 12_000
const NATIVE_FALLBACK_SETTLE_MS = 3_000
const transcodeCooldown = new Map<string, { ts: number, response: unknown }>()
const batchTranscodeCooldown = new Map<string, number>()
let nativeFallbackQueue: Promise<unknown> = Promise.resolve()
const nativeFallbackTabs = new Set<number>()
type TabLoadStatus = 'loading' | 'complete'

function isTransientFrameError(error: unknown): boolean {
  return /Frame with ID \d+ was removed|No frame with id|The tab was closed|Cannot access contents of url/i.test(String(error))
}

function isPageModeDisabledError(error: unknown): boolean {
  return /115vod page mode disabled/i.test(String(error))
}

function getTranscodeCooldown(pickCode: string) {
  const cached = transcodeCooldown.get(pickCode)
  if (!cached) return null
  if (Date.now() - cached.ts > TRANSCODE_COOLDOWN_MS) {
    transcodeCooldown.delete(pickCode)
    return null
  }
  return cached.response
}

function setTranscodeCooldown(pickCode: string, response: unknown) {
  transcodeCooldown.set(pickCode, { ts: Date.now(), response })
}

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function waitForTabStatus(tabId: number, status: TabLoadStatus, timeoutMs: number) {
  try {
    const tab = await chrome.tabs.get(tabId)
    if (tab.status === status) return
  }
  catch {
    return
  }

  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener)
      resolve()
    }, timeoutMs)

    const listener = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === status) {
        clearTimeout(timer)
        chrome.tabs.onUpdated.removeListener(listener)
        resolve()
      }
    }

    chrome.tabs.onUpdated.addListener(listener)
  })
}

async function closeNativeFallbackTabs() {
  const tabIds = Array.from(nativeFallbackTabs)
  nativeFallbackTabs.clear()
  for (const tabId of tabIds) {
    try {
      await chrome.tabs.remove(tabId)
    }
    catch {
    }
  }
}

async function runNativeFallbackOnce(pickCode: string) {
  await closeNativeFallbackTabs()
  const url = `https://115.com/web/lixian/master/video/?pick_code=${encodeURIComponent(pickCode)}&pickCode=${encodeURIComponent(pickCode)}&m115_transcode_fallback=1`
  const tab = await chrome.tabs.create({ url, active: false })
  if (!tab.id) throw new Error('后台加速页面创建失败')
  nativeFallbackTabs.add(tab.id)
  try {
    await waitForTabStatus(tab.id, 'complete', NATIVE_FALLBACK_TIMEOUT_MS)
    await wait(NATIVE_FALLBACK_SETTLE_MS)
  }
  finally {
    nativeFallbackTabs.delete(tab.id)
    try {
      await chrome.tabs.remove(tab.id)
    }
    catch {
    }
  }
}

function enqueueNativeFallback<T>(task: () => Promise<T>) {
  const queued = nativeFallbackQueue.then(task, task)
  nativeFallbackQueue = queued.catch(() => {})
  return queued
}

function getBatchCooldownKey(pickCode: string, fileIds: string[]) {
  return `${pickCode}:${fileIds.join(',')}`
}

function isBatchTranscodeCooling(key: string) {
  const ts = batchTranscodeCooldown.get(key)
  if (!ts) return false
  if (Date.now() - ts > BATCH_TRANSCODE_COOLDOWN_MS) {
    batchTranscodeCooldown.delete(key)
    return false
  }
  return true
}

function setBatchTranscodeCooldown(key: string) {
  batchTranscodeCooldown.set(key, Date.now())
}

function buildQueuedResponse(job: TranscodeCheckResult | null | undefined, detail: string, pushAccepted?: boolean) {
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

async function getTranscodeContext(pickCode: string) {
  const tabs = await query115Tabs()
  const tabId = tabs[0]?.id
  if (!tabId) return { error: '未找到 115.com 页面' }

  const videoResult = await fetchVideoInfoByPickCode(tabId, pickCode) as any
  if (!videoResult?.state) {
    return { error: '获取视频信息失败' }
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

export async function handleTranscodeStatus(message: MsgTranscodeStatus) {
  try {
    const context = await getTranscodeContext(message.data.pickCode)
    if ('error' in context) {
      return { ok: false, state: 'failed', error: context.error }
    }

    const job = await checkTranscodeJob(context.sha1, context.pickCode)
    if (job?.status === 3) {
      return buildQueuedResponse(job, 'queue status refreshed')
    }

    const transcoded = await checkIsTranscoded(context.pickCode)
    if (transcoded?.state === 1) {
      return {
        ok: true,
        state: 'completed_refresh',
        detail: 'VIP 加速已完成，刷新页面后可预览',
      }
    }

    return {
      ok: true,
      state: 'pending_check',
      detail: '等待队列状态更新',
    }
  }
  catch (e: any) {
    console.error('[115m] transcode status error:', e)
    return { ok: false, state: 'failed', error: e?.message || String(e) }
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as T
  }
  catch {
    return null
  }
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

async function checkTranscodeJob(sha1: string, pickCode: string, priority?: number): Promise<TranscodeCheckResult | null> {
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

async function pushVipTranscode(sha1: string, pickCode: string): Promise<TranscodePushResult | null> {
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
  )
  if (!response.ok) {
    throw new Error(response.error || 'vip push request failed')
  }
  const parsed = parseJsonText<TranscodePushResult>(response.text)
  if (!parsed) throw new Error('vip push parse failed')
  return parsed
}

async function checkIsTranscoded(pickCode: string): Promise<IsTranscodedResult | null> {
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

async function pushBatchTranscode(fileIds: string[], pickCode: string): Promise<TranscodePushResult | null> {
  if (fileIds.length === 0) return null

  const body = new URLSearchParams()
  body.append('file_ids', fileIds.join(','))

  const response = await fetchTextIn115VodMainWorld(
    undefined,
    'https://115vod.com/site/?ctl=play&ac=batch_push',
    body.toString(),
    'application/x-www-form-urlencoded; charset=UTF-8',
    pickCode,
  )
  if (!response.ok) {
    throw new Error(response.error || 'batch push request failed')
  }
  const parsed = parseJsonText<TranscodePushResult>(response.text)
  if (!parsed) throw new Error('batch push parse failed')
  return parsed
}

async function pushFolderBatchTranscode(pickCode: string, limit = MAX_BATCH_TRANSCODE_COUNT) {
  const transcoded = await checkIsTranscoded(pickCode)
  const fileIds = Array.isArray(transcoded?.data) ? transcoded.data.slice(0, limit) : []
  if (fileIds.length === 0) {
    return { batchTotal: 0, batchQueued: 0, batchSkipped: 0, batchDetail: 'no folder transcode candidates' }
  }

  const cooldownKey = getBatchCooldownKey(pickCode, fileIds)
  if (isBatchTranscodeCooling(cooldownKey)) {
    return { batchTotal: fileIds.length, batchQueued: 0, batchSkipped: fileIds.length, batchDetail: 'batch already requested recently' }
  }

  await wait(800)
  const result = await pushBatchTranscode(fileIds, pickCode)
  const accepted = !!result?.state && result?.errno !== 911
  if (accepted) {
    setBatchTranscodeCooldown(cooldownKey)
  }

  return {
    batchTotal: fileIds.length,
    batchQueued: accepted ? fileIds.length : 0,
    batchSkipped: 0,
    batchDetail: result?.error || result?.msg || (accepted ? 'folder batch queued' : 'folder batch rejected'),
  }
}

// ─── FETCH_M3U8 ───

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
    
    // 经查阅 115master-main 参考项目，获取字幕应直接请求 webapi.115.com
    const url = `https://webapi.115.com/movies/subtitle?pickcode=${pickCode}`
    const legacyUrl = `https://115.com/webapi/movies/subtitle?pickcode=${pickCode}`
    
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

// ─── FETCH_PLAYLIST ───
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

// ─── MOVE_FILE ───
export async function handleMoveFile(
  message: MsgMoveFile,
  sender?: chrome.runtime.MessageSender,
) {
  const tabId = await find115TabId(sender)
  if (!tabId) {
    return { ok: false, error: 'no 115.com tab found' }
  }

  const { fileId, parentId, cid } = message.data
  const result = await showMoveFileDialogIn115Page(tabId, { fileId, parentId, cid }) as { ok?: boolean, error?: string } | undefined
  if (result?.ok) {
    await chrome.tabs.update(tabId, { active: true })
  }
  return result ?? { ok: false, error: 'move executeScript empty' }
}

// ─── MOVE_SUCCESS_REFRESH ───
export async function handleMoveSuccessRefresh() {
  const playerTabs = await queryPlayerTabs()
  for (const tab of playerTabs) {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'MOVE_SUCCESS_REFRESH' }).catch(() => {})
    }
  }

  const allTabs = await query115Tabs()
  for (const tab of allTabs) {
    if (tab.id && !playerTabs.some(pt => pt.id === tab.id)) {
      try {
        await refreshListPageIn115Tab(tab.id)
      }
      catch (e) {
        console.warn('[115m] executeScript refresh failed:', e)
      }
    }
  }
  return { success: true }
}

export async function handleDeleteFile(
  message: MsgDeleteFile,
  sender?: chrome.runtime.MessageSender,
) {
  const tabId = await find115TabId(sender)
  if (!tabId) {
    return { ok: false, error: 'no 115.com tab found' }
  }

  const { fileId, parentId, pickCode } = message.data
  const result = await deleteFileIn115Page(tabId, { fileId, parentId }) as { ok?: boolean, error?: string } | undefined
  if (result?.ok) {
    await handleDeleteSuccessRefresh({
      type: 'DELETE_SUCCESS_REFRESH',
      data: { fileId, parentId, pickCode },
    })
  }
  return result ?? { ok: false, error: 'delete executeScript empty' }
}

export async function handleDeleteSuccessRefresh(message: MsgDeleteSuccessRefresh) {
  const { fileId, parentId, pickCode } = message.data

  const playerTabs = await queryPlayerTabs()
  for (const tab of playerTabs) {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'DELETE_SUCCESS_REFRESH', data: { fileId, parentId, pickCode } }).catch(() => {})
    }
  }

  const allTabs = await query115Tabs()
  for (const tab of allTabs) {
    if (tab.id && !playerTabs.some(pt => pt.id === tab.id)) {
      chrome.tabs.sendMessage(tab.id, { type: 'DELETE_SUCCESS_REFRESH', data: { fileId, parentId, pickCode } }).catch(() => {})
      try {
        await removeDeletedNodeIn115Tab(tab.id, { fileId, pickCode })
      }
      catch {
        // ignore per-tab sync failures
      }
    }
  }

  return { ok: true }
}

// ─── TRANSCODE_ACCELERATE ───
async function transcodeOne(pickCodeForCooldown: string) {
  const cached = getTranscodeCooldown(pickCodeForCooldown)
  if (cached) {
    return { ...(cached as object), deduped: true }
  }

  const context = await getTranscodeContext(pickCodeForCooldown)
  if ('error' in context) {
    return { ok: false, state: 'failed', error: context.error }
  }

  const { pickCode, sha1 } = context

  const before = await checkTranscodeJob(sha1, pickCode)
  if (before?.status === 3) {
    const response = buildQueuedResponse(before, 'already queued')
    setTranscodeCooldown(pickCode, response)
    return response
  }

  const pushResult = await pushVipTranscode(sha1, pickCode)
  const after = await checkTranscodeJob(sha1, pickCode, 1)

  if (after?.status === 3 || (typeof before?.priority === 'number' && typeof after?.priority === 'number' && after.priority > before.priority)) {
    const response = buildQueuedResponse(after, pushResult?.msg || 'queued after vip push', !!pushResult?.state)
    setTranscodeCooldown(pickCode, response)
    return response
  }

  if (pushResult?.state) {
    const response = {
      ok: true,
      state: 'pending_check',
      pushAccepted: true,
      detail: pushResult.msg || 'vip push accepted',
    }
    setTranscodeCooldown(pickCode, response)
    return response
  }

  const transcoded = await checkIsTranscoded(pickCode)
  if (transcoded?.state === 1 && after?.status !== 3) {
    const response = {
      ok: true,
      state: 'manual_required',
      pushAccepted: !!pushResult?.state,
      detail: pushResult?.msg || 'transcode not queued automatically',
    }
    setTranscodeCooldown(pickCode, response)
    return response
  }

  const response = {
    ok: true,
    state: 'manual_required',
    pushAccepted: false,
    detail: pushResult?.msg || pushResult?.error || 'vip push rejected',
  }
  setTranscodeCooldown(pickCode, response)
  return response
}

export async function handleTranscode(message: MsgTranscode) {
  const pickCodeForCooldown = message.data.pickCode
  try {
    const response = await transcodeOne(pickCodeForCooldown) as Record<string, unknown>
    if (message.data.batchFolder && response.ok && response.state !== 'failed') {
      const batch = await pushFolderBatchTranscode(
        pickCodeForCooldown,
        Math.max(1, Math.min(message.data.batchLimit || MAX_BATCH_TRANSCODE_COUNT, MAX_BATCH_TRANSCODE_COUNT)),
      )
      return {
        ...response,
        ...batch,
        detail: batch.batchQueued > 0 ? `${response.detail || ''}；同文件夹已提交 ${batch.batchQueued} 个` : response.detail,
      }
    }
    return response
  }
  catch (e: any) {
    if (isTransientFrameError(e)) {
      return { ok: true, state: 'pending_check', detail: '页面切换中，稍后刷新转码状态' }
    }
    if (isPageModeDisabledError(e)) {
      return { ok: true, state: 'manual_required', detail: '自动加速不可用，可手动重试' }
    }
    console.error('[115m] transcode error:', e)
    return { ok: false, state: 'failed', error: e?.message || String(e) }
  }
  finally {
    await close115VodFrameSession(pickCodeForCooldown)
    await closeExtensionCreated115VodTab()
  }
}

export async function handleTranscodeNativeFallback(message: MsgTranscodeNativeFallback) {
  const pickCode = message.data.pickCode
  return enqueueNativeFallback(async () => {
    try {
      await runNativeFallbackOnce(pickCode)
      await wait(1200)
      const status = await handleTranscodeStatus({ type: 'TRANSCODE_STATUS', data: { pickCode } }) as Record<string, unknown>
      if (status.ok && status.state !== 'failed') {
        return {
          ...status,
          nativeFallback: true,
          detail: status.detail || '后台原生页已触发',
        }
      }
      return {
        ok: true,
        state: 'manual_required',
        nativeFallback: true,
        detail: status.error || '后台加速已尝试，暂未命中队列',
      }
    }
    catch (e: any) {
      return {
        ok: false,
        state: 'failed',
        nativeFallback: true,
        error: e?.message || String(e),
      }
    }
  })
}
