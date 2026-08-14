/**
 * 转码 handler：VIP 加速、状态查询、批量转码、原生回退
 * API 封装见 transcode-api.ts，状态/冷却缓存见 transcode-state.ts。
 */
import type {
  MsgTranscode,
  MsgTranscodeNativeFallback,
  MsgTranscodeStatus,
} from '../shared/messages'
import { handleFetchM3u8 } from './media-info'
import { isTransientFrameError, wait } from '../shared/utils'
import { acquireExtension115VodTabScope, releaseExtension115VodTabScope } from '../platform/115/main-world'
import {
  buildQueuedResponse,
  checkIsTranscoded,
  checkTranscodeJob,
  getTranscodeContext,
  pushBatchTranscode,
  pushVipTranscode,
} from './transcode-api'
import {
  getBatchCooldownKey,
  getCachedTranscodeStatus,
  getTranscodeCooldown,
  invalidateTranscodeStatus,
  isBatchTranscodeCooling,
  setBatchTranscodeCooldown,
  setCachedTranscodeStatus,
  setTranscodeCooldown,
} from './transcode-state'

const MAX_BATCH_TRANSCODE_COUNT = 20
const NATIVE_FALLBACK_TIMEOUT_MS = 12_000
const NATIVE_FALLBACK_SETTLE_MS = 3_000
let nativeFallbackQueue: Promise<unknown> = Promise.resolve()
const nativeFallbackTabs = new Set<number>()
type TabLoadStatus = 'loading' | 'complete'

function isPageModeDisabledError(error: unknown): boolean {
  return /115vod page mode disabled/i.test(String(error))
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

    const listener = (updatedTabId: number, changeInfo: any) => {
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
      // tab may already be closed
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
      // tab may already be closed
    }
  }
}

function enqueueNativeFallback<T>(task: () => Promise<T>) {
  const queued = nativeFallbackQueue.then(task, task)
  nativeFallbackQueue = queued.catch(() => {})
  return queued
}

export async function handleTranscodeStatus(message: MsgTranscodeStatus, sender?: chrome.runtime.MessageSender) {
  const pickCode = message.data.pickCode

  const cached = getCachedTranscodeStatus(pickCode)
  if (cached) {
    if (cached instanceof Promise) {
      return await cached
    }
    return cached
  }

  const checkPromise = (async () => {
    try {
      const context = await getTranscodeContext(pickCode, sender)
      if ('error' in context) {
        return { ok: false, state: 'failed', error: context.error }
      }

      const job = await checkTranscodeJob(context.sha1, context.pickCode)

      // status === 3 表示在排队中，有 count / time 进度信息
      if (job?.status === 3) {
        return buildQueuedResponse(job, 'queue status refreshed')
      }

      // 先尝试直接拉取 m3u8，最终判断依据是能否实际播放
      const m3u8List = await handleFetchM3u8({ type: 'FETCH_M3U8', data: { pickCode: context.pickCode } })

      if (m3u8List?.list && m3u8List.list.length > 0) {
        return {
          ok: true,
          state: 'completed_refresh',
          detail: 'VIP 加速已完成，刷新页面后可预览',
        }
      }

      // m3u8 不可用 → 检查 is_transcoded 判断是否还有任务记录
      const transcoded = await checkIsTranscoded(context.pickCode)

      // is_transcoded state=1 但 m3u8 不可用
      // 如果 job status 不是 3（排队中），说明没有活跃的转码任务
      // state=1 只表示"该文件支持转码"，不代表正在转码
      if (transcoded?.state === 1) {
        // 有活跃的 job（status=3 已在上面处理），其他 status 说明没在转码
        if (job?.status === 127 || !job || job?.status === 0) {
          return {
            ok: true,
            state: 'no_task',
            detail: '视频支持转码但未在队列中，可手动发起转码',
          }
        }

        return {
          ok: true,
          state: 'queued',
          queueCount: job?.count,
          etaSeconds: job?.time,
          priority: job?.priority,
          detail: '转码处理中，等待完成...',
        }
      }

      return {
        ok: true,
        state: 'no_task',
        detail: '未检测到转码任务',
        autoFallback: true, // 没有活跃任务且也没有转码记录（transcoded.state !== 1），大概率是原生不支持播放的刚上传视频（B类）
      }
    }
    catch (e: any) {
      console.error('[115m] transcode status error:', e)
      return { ok: false, state: 'failed', error: e?.message || String(e) }
    }
  })()

  setCachedTranscodeStatus(pickCode, checkPromise)
  return await checkPromise
}

async function pushFolderBatchTranscode(pickCode: string, limit = MAX_BATCH_TRANSCODE_COUNT) {
  const transcoded = await checkIsTranscoded(pickCode)

  const fileIds = Array.isArray(transcoded?.data) ? transcoded.data.slice(0, limit) : []

  if (fileIds.length === 0) {
    return { batchTotal: 0, batchQueued: 0, batchSkipped: 0, batchDetail: 'no folder transcode candidates', batchPickCodes: [] }
  }

  // is_transcoded 返回同文件夹需转码的 file_ids 数组；把 fileIds 回传 content 侧，
  // 供其按 fileId 匹配 DOM 元素并同步同文件夹其他视频的加速状态
  const cooldownKey = getBatchCooldownKey(pickCode, fileIds)
  if (isBatchTranscodeCooling(cooldownKey)) {
    return { batchTotal: fileIds.length, batchQueued: 0, batchSkipped: fileIds.length, batchDetail: 'batch already requested recently', batchFileIds: fileIds }
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
    batchFileIds: fileIds,
  }
}

// ─── TRANSCODE_ACCELERATE ───
async function transcodeOne(pickCodeForCooldown: string, sender?: chrome.runtime.MessageSender) {
  const cached = getTranscodeCooldown(pickCodeForCooldown)
  if (cached) {
    return { ...(cached as object), deduped: true }
  }

  const context = await getTranscodeContext(pickCodeForCooldown, sender)
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
    return response
  }

  const response = {
    ok: true,
    state: 'manual_required',
    pushAccepted: false,
    detail: pushResult?.msg || pushResult?.error || 'vip push rejected',
  }

  return response
}

export async function handleTranscode(message: MsgTranscode, sender?: chrome.runtime.MessageSender) {
  const pickCodeForCooldown = message.data.pickCode
  await acquireExtension115VodTabScope()
  try {
    const response = await transcodeOne(pickCodeForCooldown, sender) as Record<string, unknown>
    if (message.data.batchFolder && response.ok && response.state !== 'failed') {
      const batch = await pushFolderBatchTranscode(
        pickCodeForCooldown,
        Math.max(1, Math.min(message.data.batchLimit || MAX_BATCH_TRANSCODE_COUNT, MAX_BATCH_TRANSCODE_COUNT)),
      )

      // 这里的 batch.batchQueued 表示批量推成功的数量，并且 checkIsTranscoded 返回了这些同文件夹 fileIds/pickCodes (即 batch.batchPickCodes)
      return {
        ...response,
        ...batch,
        batchPickCodes: batch.batchPickCodes || [],
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
      return { ok: false, state: 'failed', error: '115vod 登录态失效，请先用 115 原生播放器播放任意视频后重试' }
    }
    console.error('[115m] transcode error:', e)
    return { ok: false, state: 'failed', error: e?.message || String(e) }
  }
  finally {
    await releaseExtension115VodTabScope()
  }
}

export async function handleTranscodeNativeFallback(message: MsgTranscodeNativeFallback) {
  const pickCode = message.data.pickCode
  return enqueueNativeFallback(async () => {
    try {
      await runNativeFallbackOnce(pickCode)
      await wait(1200)
      invalidateTranscodeStatus(pickCode)
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
