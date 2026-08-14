import type { RuntimeTranscodeResponse } from '../../shared/messages'
import {
  saveTranscodeStatus,
  subscribeTranscodeStatus,
} from './transcode-store'
import { isRuntimeContextInvalidatedResult, sendTypedRuntimeMessageSafe } from './runtime'
import { previewObserverRegistry } from './observer-registry'

const TRANSCODE_STATUS_POLL_MS = 15000

export type TranscodeResponse = RuntimeTranscodeResponse

function formatTranscodeEta(etaSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(etaSeconds))
  if (safeSeconds <= 60) {
    return `${safeSeconds} 秒`
  }

  return `${Math.floor(safeSeconds / 60)} 分钟`
}

export function formatTranscodeStatus(res: TranscodeResponse): { text: string, color: string } {
  const batchText = typeof res.batchQueued === 'number' && res.batchQueued > 0 ? `，同文件夹已提交 ${res.batchQueued} 个` : ''
  if (res.state === 'queued') {
    const parts: string[] = []
    if (typeof res.queueCount === 'number') {
      parts.push(`前方 ${res.queueCount} 个`)
    }
    if (typeof res.etaSeconds === 'number') {
      parts.push(`预计 ${formatTranscodeEta(res.etaSeconds)}`)
    }
    if (parts.length > 0) {
      return {
        text: `VIP 加速排队中: ${parts.join('，')}${batchText}`,
        color: '#52c41a',
      }
    }
    return {
      text: res.detail ? `${res.detail}${batchText}` : `VIP 加速排队中${batchText}`,
      color: '#52c41a',
    }
  }

  if (res.state === 'pending_check') {
    return {
      text: res.detail ? `${res.detail}${batchText}` : `VIP 加速已发起，等待队列确认${batchText}`,
      color: '#52c41a',
    }
  }

  if (res.state === 'manual_required') {
    return {
      text: res.detail || '自动加速未命中，可手动转码',
      color: '#faad14',
    }
  }

  if (res.state === 'completed_refresh') {
    return {
      text: res.detail || 'VIP 加速已完成，刷新页面后可预览',
      color: '#52c41a',
    }
  }

  if (res.state === 'no_task') {
    return {
      text: res.detail || '未检测到转码任务，可手动发起转码',
      color: '#faad14',
    }
  }

  return {
    text: res.error || res.detail || '自动加速失败，可手动重试',
    color: '#fa8c16',
  }
}

/** 已触发过加速的 pickCode 集合（避免重复请求） */
const acceleratedSet = new Set<string>()

/**
 * 预览区手动 VIP 加速转码：
 * - 仅在判定需要转码时展示按钮，不自动触发
 * - 点击后提交当前视频，并顺带批量同文件夹需转码项（官方 batch_push）
 */
export function showTranscodeButton(container: HTMLElement, pickCode: string, fileId?: string, initialStatus?: TranscodeResponse) {
  const doc = container.ownerDocument

  container.classList.add('is-transcode-tip')
  container.innerHTML = ''

  const wrapper = doc.createElement('div')
  wrapper.className = 'm115-transcode-area'

  const label = doc.createElement('span')
  label.className = 'm115-transcode-label'
  label.textContent = '视频需转码后才能预览'
  label.style.color = '#fa8c16'

  const button = doc.createElement('button')
  button.type = 'button'
  button.className = 'm115-transcode-btn'
  button.textContent = 'VIP加速转码'
  button.style.cssText = [
    'margin-top:10px',
    'padding:8px 14px',
    'border:none',
    'border-radius:6px',
    'background:#ff6a00',
    'color:#fff',
    'font-size:12px',
    'cursor:pointer',
  ].join(';')
  button.hidden = false

  wrapper.appendChild(label)
  wrapper.appendChild(button)
  container.appendChild(wrapper)

  let pollTimer: number | undefined
  let nativeFallbackVisible = false

  // 监听全局事件，用于接收被同步的文件状态
  const unsubscribe = subscribeTranscodeStatus((event) => {
    // 只有非当前 pickCode / fileId 触发的广播事件才进行处理，避免自我触发循环
    if ((event.pickCode && event.pickCode === pickCode) || (fileId && event.fileId === fileId)) {
      applyStatus(event.status, true)
    }
  })

  // 元素销毁时解除事件监听和轮询（doc 级共享 observer，避免每按钮一个 body 级 observer）
  const unregisterTranscodeItem = previewObserverRegistry.registerItem(container, () => {
    unsubscribe()
    stopPolling()
    unregisterTranscodeItem()
  })

  const stopPolling = () => {
    if (typeof pollTimer === 'number') {
      clearTimeout(pollTimer)
      pollTimer = undefined
    }
  }

  const schedulePoll = () => {
    stopPolling()
    pollTimer = window.setTimeout(() => {
      if (!wrapper.isConnected) {
        stopPolling()
        return
      }
      runStatusCheck()
    }, TRANSCODE_STATUS_POLL_MS)
  }

  const setManualFallback = (message: string) => {
    nativeFallbackVisible = false
    stopPolling()
    label.textContent = message
    label.style.color = '#fa8c16'
    button.hidden = false
    button.disabled = false
    button.textContent = 'VIP加速转码'
  }

  const setNativeFallback = (message: string) => {
    nativeFallbackVisible = true
    stopPolling()
    label.textContent = message
    label.style.color = '#fa8c16'
    button.hidden = false
    button.disabled = false
    button.textContent = '后台加速'
  }

  const setContextInvalidatedState = () => {
    stopPolling()
    acceleratedSet.delete(pickCode)
    label.textContent = '扩展已更新，请刷新页面后继续使用'
    label.style.color = '#8c8c8c'
    button.hidden = true
    button.disabled = true
  }

  const applyStatus = (res: TranscodeResponse, skipBroadcast = false) => {
    // 保存至扩展会话级存储中（跨标签共享）
    void saveTranscodeStatus(pickCode, res, fileId, skipBroadcast)

    // 风控检测：115 返回验证码/安全异常时，直接提示用户解除，不显示重试按钮
    if (res.state === 'failed' && res.error && /验证|安全|异常|captcha|911/i.test(res.error)) {
      label.textContent = '⚠ 115 风控验证中，请先用 115 原生播放器播放任意视频解除验证码'
      label.style.color = '#fa541c'
      button.hidden = true
      stopPolling()
      return true
    }

    // 登录态失效
    if (res.state === 'failed' && res.error && /登录超时|登录过期|990001/i.test(res.error)) {
      label.textContent = '⚠ 115 登录态已失效，请刷新 115 页面后重试'
      label.style.color = '#fa541c'
      button.hidden = true
      stopPolling()
      return true
    }

    if (res.ok && res.state && res.state !== 'manual_required') {
      const status = formatTranscodeStatus(res)
      label.textContent = status.text
      label.style.color = status.color
      button.hidden = true
      if (res.state === 'queued' || res.state === 'pending_check') {
        schedulePoll()
      }
      else {
        stopPolling()
      }
      return true
    }

    if (res.state === 'manual_required') {
      const status = formatTranscodeStatus(res)
      setManualFallback(status.text)
      return true
    }

    return false
  }

  const runStatusCheck = () => {
    sendTypedRuntimeMessageSafe({
      type: 'TRANSCODE_STATUS',
      data: { pickCode },
    }).then((res) => {
      if (isRuntimeContextInvalidatedResult(res)) {
        setContextInvalidatedState()
        return
      }
      if (res && applyStatus(res)) {
        return
      }

      acceleratedSet.delete(pickCode)
      setManualFallback(res?.error || '转码状态刷新失败，可手动重试')
    }).catch(() => {
      acceleratedSet.delete(pickCode)
      setManualFallback('转码状态刷新异常，可手动重试')
    })
  }

  const runTranscode = () => {
    stopPolling()
    button.disabled = true
    button.textContent = '加速中...'
    label.textContent = '正在请求 VIP 加速转码（含同文件夹）...'
    label.style.color = '#1677ff'

    sendTypedRuntimeMessageSafe({
      type: 'TRANSCODE_ACCELERATE',
      data: { pickCode, batchFolder: true },
    }).then((res) => {
      if (isRuntimeContextInvalidatedResult(res)) {
        setContextInvalidatedState()
        return
      }
      if (res && applyStatus(res)) {
        // 如果有同文件夹批量被加速的视频列表，我们需要把加速状态同步到那些视频的 UI 状态中
        if (res.batchFileIds && res.batchFileIds.length > 0) {
          res.batchFileIds.forEach((batchFid) => {
            // 对每一个被批量提交的 fileId，保存其 status 并通过事件同步给本页已初始化的 showTranscodeButton DOM
            const siblingStatus: TranscodeResponse = {
              ok: true,
              state: 'queued',
              detail: '已随同文件夹视频一起加速，排队中...',
            }
            // 这里我们可能没有 sibling 的 pickCode，但我们有 fileId。
            // 我们的 saveTranscodeStatus 已经支持通过 fileId 记录和分发事件。
            void saveTranscodeStatus('', siblingStatus, batchFid)
          })
        }
        return
      }

      acceleratedSet.delete(pickCode)
      setNativeFallback(res?.error || '手动加速失败，可尝试后台加速')
    }).catch((error) => {
      console.warn(`[115m][transcode] runTranscode exception error=${error instanceof Error ? error.message : String(error)}`)
      acceleratedSet.delete(pickCode)
      setNativeFallback('手动加速异常，可尝试后台加速')
    })
  }

  const runNativeFallback = () => {
    stopPolling()
    button.disabled = true
    button.textContent = '后台加速中...'
    label.textContent = '正在后台打开原生播放页触发加速...'
    label.style.color = '#1677ff'
    sendTypedRuntimeMessageSafe({
      type: 'TRANSCODE_NATIVE_FALLBACK',
      data: { pickCode },
    }).then((res) => {
      if (isRuntimeContextInvalidatedResult(res)) {
        setContextInvalidatedState()
        return
      }
      if (res && applyStatus(res)) {
        return
      }
      setNativeFallback(res?.error || res?.detail || '后台加速未命中，可稍后再试')
    }).catch((error) => {
      console.warn(`[115m][transcode] native fallback exception error=${error instanceof Error ? error.message : String(error)}`)
      setNativeFallback('后台加速异常，可稍后再试')
    })
  }

  button.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    acceleratedSet.add(pickCode)
    if (nativeFallbackVisible) {
      runNativeFallback()
      return
    }
    runTranscode()
  })

  // 有初始状态（刷新恢复）→ 直接显示进度并开始轮询
  if (initialStatus) {
    applyStatus(initialStatus)
    return
  }

  // 本页已手动触发过：只恢复状态轮询，绝不自动再推队列
  if (acceleratedSet.has(pickCode)) {
    runStatusCheck()
    return
  }
}
