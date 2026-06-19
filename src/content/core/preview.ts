import { getVideoCovers, primeThumbnailSourceUrl } from '../../lib/videoThumbnail'
import type { VideoThumbnail } from '../../lib/videoThumbnail'
import type { FileInfo } from './types'
import { isRuntimeContextInvalidatedResult, sendRuntimeMessageSafe } from './runtime'
import {
  Scheduler,
  TaskCancelledError,
  createVisibilityObserver,
  createScrollStopDetector,
  findScrollContainer,
} from './utils'

const coverScheduler = new Scheduler(3)
const TRANSCODE_STATUS_POLL_MS = 15000

/**
 * 通过 background FETCH_M3U8 获取可靠的 M3U8 源 URL
 * background 有 cookie 和扩展上下文，比 content script 直连可靠
 * 返回 { ok: false } 表示视频确实需要转码（M3U8 流不存在）
 * 返回 { ok: true, url } 表示 M3U8 可用，url 为最低画质源地址
 */
async function fetchM3u8ViaBackground(pickCode: string): Promise<{ ok: true, url: string } | { ok: false }> {
  const res = await sendRuntimeMessageSafe<{ list?: Array<{ quality: number, url: string }>, error?: string }>({
    type: 'FETCH_M3U8',
    data: { pickCode },
  })
  if (isRuntimeContextInvalidatedResult(res) || !res || res.error || !res.list || res.list.length === 0) {
    return { ok: false }
  }
  // 取最低画质用于封面抽帧
  const source = res.list.sort((a, b) => a.quality - b.quality)[0]
  return { ok: true, url: source.url }
}

function showPreviewUnavailable(container: HTMLElement) {
  container.innerHTML = ''
}

interface TranscodeResponse {
  ok?: boolean
  state?: 'queued' | 'manual_required' | 'pending_check' | 'completed_refresh' | 'failed'
  error?: string
  detail?: string
  batchQueued?: number
  batchTotal?: number
  batchSkipped?: number
  queueCount?: number
  etaSeconds?: number
  priority?: number
  pushAccepted?: boolean
}

function formatTranscodeEta(etaSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(etaSeconds))
  if (safeSeconds <= 60) {
    return `${safeSeconds} 秒`
  }

  return `${Math.floor(safeSeconds / 60)} 分钟`
}

function formatTranscodeStatus(res: TranscodeResponse): { text: string, color: string } {
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
      text: res.detail ? `${res.detail}${batchText}` : `VIP 自动加速已发起，等待队列确认${batchText}`,
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

  return {
    text: res.error || res.detail || '自动加速失败，可手动重试',
    color: '#fa8c16',
  }
}

const listPreviewCoverOptions = {
  maxWidth: 640,
  maxHeight: 640,
  quality: 0.78,
  cacheScope: 'list-v3',
  deferCacheWrite: true,
  useTimelineCache: false,
}

let lightboxRoot: HTMLDivElement | null = null
let lightboxImg: HTMLImageElement | null = null
let lightboxTime: HTMLDivElement | null = null
let lightboxCovers: VideoThumbnail[] = []
let lightboxIndex = 0

function renderLightboxImage() {
  const cover = lightboxCovers[lightboxIndex]
  if (!cover || !lightboxImg || !lightboxTime) return

  lightboxImg.src = cover.imgUrl
  lightboxImg.alt = `预览 ${Math.floor(cover.time)}s`
  lightboxTime.textContent = `${lightboxIndex + 1}/${lightboxCovers.length} · ${Math.floor(cover.time)}s`
}

function closeCoverLightbox() {
  lightboxRoot?.remove()
  lightboxRoot = null
  lightboxImg = null
  lightboxTime = null
  lightboxCovers = []
  document.removeEventListener('keydown', handleLightboxKeydown, true)
}

function showLightboxImage(nextIndex: number) {
  if (!lightboxCovers.length) return
  lightboxIndex = (nextIndex + lightboxCovers.length) % lightboxCovers.length
  renderLightboxImage()
}

function handleLightboxKeydown(event: KeyboardEvent) {
  if (!lightboxRoot) return

  if (event.key === 'Escape') {
    event.preventDefault()
    closeCoverLightbox()
    return
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    showLightboxImage(lightboxIndex - 1)
    return
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault()
    showLightboxImage(lightboxIndex + 1)
  }
}

function handleLightboxWheel(event: WheelEvent) {
  if (!lightboxRoot || Math.abs(event.deltaY) < 4) return

  event.preventDefault()
  event.stopPropagation()
  showLightboxImage(lightboxIndex + (event.deltaY > 0 ? 1 : -1))
}

function openCoverLightbox(covers: VideoThumbnail[], index: number) {
  if (!covers.length) return

  closeCoverLightbox()

  lightboxCovers = covers
  lightboxIndex = index

  const root = document.createElement('div')
  root.className = 'm115-cover-lightbox'

  const image = document.createElement('img')
  image.className = 'm115-cover-lightbox-img'

  const time = document.createElement('div')
  time.className = 'm115-cover-lightbox-time'

  const closeButton = document.createElement('button')
  closeButton.type = 'button'
  closeButton.className = 'm115-cover-lightbox-close'
  closeButton.textContent = '×'

  const prevButton = document.createElement('button')
  prevButton.type = 'button'
  prevButton.className = 'm115-cover-lightbox-nav is-prev'
  prevButton.textContent = '‹'

  const nextButton = document.createElement('button')
  nextButton.type = 'button'
  nextButton.className = 'm115-cover-lightbox-nav is-next'
  nextButton.textContent = '›'

  root.appendChild(image)
  root.appendChild(time)
  root.appendChild(closeButton)
  root.appendChild(prevButton)
  root.appendChild(nextButton)
  document.documentElement.appendChild(root)

  lightboxRoot = root
  lightboxImg = image
  lightboxTime = time
  renderLightboxImage()

  root.addEventListener('click', closeCoverLightbox)
  image.addEventListener('click', closeCoverLightbox)
  root.addEventListener('wheel', handleLightboxWheel, { passive: false })
  closeButton.addEventListener('click', closeCoverLightbox)
  prevButton.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    showLightboxImage(lightboxIndex - 1)
  })
  nextButton.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    showLightboxImage(lightboxIndex + 1)
  })
  document.addEventListener('keydown', handleLightboxKeydown, true)
}

/** 预览图加载状态 */
interface PreviewState {
  isLoading: boolean
  isLoaded: boolean
  error: boolean
  cancelTask?: () => void
  visibilityObserver?: { destroy: () => void }
  scrollObserver?: { destroy: () => void }
}

const previewStates = new WeakMap<HTMLElement, PreviewState>()

/**
 * 渲染预览图（带可见性检测和滚动优化）
 */
export function renderPreview(item: HTMLElement, file: FileInfo) {
  if (item.querySelector('.m115-cover-container')) return

  item.classList.add('with-ext-video-cover')

  const container = document.createElement('div')
  container.className = 'm115-cover-container'

  const skeleton = document.createElement('div')
  skeleton.className = 'm115-cover-skeleton'
  container.appendChild(skeleton)
  item.appendChild(container)

  const state: PreviewState = {
    isLoading: false,
    isLoaded: false,
    error: false,
  }
  previewStates.set(item, state)

  /** 加载预览图 */
  const loadCovers = async () => {
    if (state.isLoading || state.isLoaded || state.error) return

    state.isLoading = true

    const { promise, cancel } = coverScheduler.add(async () => {
      try {
        // 1. 通过 background 获取可靠的 M3U8 源 URL（含重试）
        const m3u8Result = await fetchM3u8ViaBackground(file.pickCode)
        if (!m3u8Result.ok) {
          // #region debug-point E:loadCovers-no-m3u8
          // #endregion
          // M3U8 不可用 → 先检查是否有正在进行的转码任务
          const statusRes = await sendRuntimeMessageSafe<TranscodeResponse>({
            type: 'TRANSCODE_STATUS',
            data: { pickCode: file.pickCode },
          })
          // #region debug-point C:loadCovers-statusRes
          // #endregion
          if (!isRuntimeContextInvalidatedResult(statusRes) && statusRes?.ok
            && (statusRes.state === 'queued' || statusRes.state === 'pending_check')) {
            // 正在转码中 → 直接显示转码进度面板
            showTranscodeButton(container, file.pickCode, statusRes)
          }
          else if (!isRuntimeContextInvalidatedResult(statusRes) && statusRes?.ok
            && statusRes.state === 'completed_refresh') {
            // 转码已完成但 M3U8 还没生效（缓存延迟）→ 提示刷新
            showCompletedHint(container, statusRes.detail || 'VIP 加速已完成，刷新页面后可预览')
          }
          else if (!isRuntimeContextInvalidatedResult(statusRes) && statusRes?.state === 'failed'
            && statusRes.error && /验证|安全|异常|captcha|911/i.test(statusRes.error)) {
            // 115 风控验证 → 提示用户去 115 播放器解除
            showCompletedHint(container, '⚠ 115 风控验证中，请先用 115 原生播放器播放任意视频解除验证码')
          }
          else if (!isRuntimeContextInvalidatedResult(statusRes) && statusRes?.state === 'failed'
            && statusRes.error && /登录超时|登录过期|990001/i.test(statusRes.error)) {
            // 115 登录态失效 → 提示用户刷新页面
            showCompletedHint(container, '⚠ 115 登录态已失效，请刷新 115 页面后重试')
          }
          else {
            // 无转码任务 → 显示"预览图不可用" + 手动转码链接
            showCoverUnavailableWithTranscode(container, file.pickCode)
          }
          state.isLoaded = true
          return
        }

        // 2. 注入缓存，跳过 content script 不可靠的 M3U8 直连
        primeThumbnailSourceUrl(file.pickCode, m3u8Result.url)

        // 3. duration 缺失时无法抽帧
        if (file.duration === 0) {
          showCoverUnavailableWithTranscode(container, file.pickCode)
          state.isLoaded = true
          return
        }

        // 4. 生成封面
        const covers = await getVideoCovers(file.pickCode, file.duration, 5, listPreviewCoverOptions)
        if (!covers.length) {
          showCoverUnavailableWithTranscode(container, file.pickCode)
          state.isLoaded = true
          return
        }

        const row = document.createElement('div')
        row.className = 'm115-cover-loaded'

        covers.forEach((cover, index) => {
          const thumb = document.createElement('span')
          thumb.className = 'm115-cover-thumb'

          const img = document.createElement('img')
          img.className = 'm115-cover-img'
          img.src = cover.imgUrl
          img.alt = `预览 ${Math.floor(cover.time)}s`

          thumb.appendChild(img)
          thumb.addEventListener('click', (event) => {
            event.preventDefault()
            event.stopPropagation()
            openCoverLightbox(covers, index)
          })
          thumb.addEventListener('dblclick', (event) => {
            event.preventDefault()
            event.stopPropagation()
          })
          row.appendChild(thumb)
        })

        container.classList.remove('is-transcode-tip')
        container.innerHTML = ''
        container.appendChild(row)
        state.isLoaded = true
      } catch (e) {
        if (e instanceof TaskCancelledError) {
          return
        }
        // 封面生成失败 → 显示手动转码按钮
        showCoverUnavailableWithTranscode(container, file.pickCode)
        state.error = true
      } finally {
        state.isLoading = false
      }
    })

    state.cancelTask = cancel
    try {
      await promise
    }
    catch (e) {
      if (!(e instanceof TaskCancelledError)) {
        throw e
      }
    }
  }

  /** 取消加载 */
  const cancelLoad = () => {
    if (state.cancelTask) {
      state.cancelTask()
      state.cancelTask = undefined
    }
    state.isLoading = false
  }

  /** 滚动停止后加载 */
  let scrollStopTimer: number | undefined
  const scheduleLoadAfterScrollStop = () => {
    if (scrollStopTimer) {
      clearTimeout(scrollStopTimer)
    }
    scrollStopTimer = window.setTimeout(() => {
      loadCovers()
    }, 200)
  }

  // 查找滚动容器
  const scrollTarget = findScrollContainer(item)

  // 创建可见性检测器
  state.visibilityObserver = createVisibilityObserver(
    container,
    () => {
      // 可见时，等待滚动停止后加载
      if (!state.isLoaded && !state.error) {
        scheduleLoadAfterScrollStop()
      }
    },
    () => {
      // 不可见时，取消加载
      cancelLoad()
    }
  )

  // 创建滚动检测器
  state.scrollObserver = createScrollStopDetector(scrollTarget, 120, () => {
    // 滚动停止后，如果元素可见且未加载，则加载
    if (!state.isLoaded && !state.error && !state.isLoading) {
      const rect = container.getBoundingClientRect()
      const isVisible = rect.bottom > 0 && rect.top < window.innerHeight
      if (isVisible) {
        loadCovers()
      }
    }
  })

  // 清理函数（元素移除时调用）
  const cleanup = () => {
    state.visibilityObserver?.destroy()
    state.scrollObserver?.destroy()
    cancelLoad()
  }

  // 使用 MutationObserver 监听元素移除
  const mutationObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const removedNode of mutation.removedNodes) {
        if (removedNode === item || item.contains(removedNode)) {
          cleanup()
          mutationObserver.disconnect()
          return
        }
      }
    }
  })

  if (item.parentElement) {
    mutationObserver.observe(item.parentElement, { childList: true, subtree: true })
  }
}

/**
 * 转码已完成但 M3U8 还有缓存延迟时的提示
 */
function showCompletedHint(container: HTMLElement, message: string) {
  container.classList.add('is-transcode-tip')
  container.innerHTML = ''

  const wrapper = document.createElement('div')
  wrapper.className = 'm115-transcode-area'

  const label = document.createElement('span')
  label.className = 'm115-transcode-label'
  label.textContent = message
  label.style.color = '#52c41a'

  wrapper.appendChild(label)
  container.appendChild(wrapper)
}

/**
 * 封面不可用时显示"预览图不可用" + 手动转码链接
 * 不自动触发转码，让用户自己判断是否需要
 */
function showCoverUnavailableWithTranscode(container: HTMLElement, pickCode: string) {
  container.classList.add('is-transcode-tip')
  container.innerHTML = ''

  const wrapper = document.createElement('div')
  wrapper.className = 'm115-transcode-area'

  const label = document.createElement('span')
  label.className = 'm115-transcode-label'
  label.textContent = '预览图不可用'
  label.style.color = '#8c8c8c'

  const link = document.createElement('a')
  link.href = 'javascript:;'
  link.textContent = '尝试转码'
  link.style.cssText = [
    'display:inline-block',
    'margin-top:6px',
    'color:#ff6a00',
    'font-size:11px',
    'text-decoration:underline',
    'cursor:pointer',
  ].join(';')
  link.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    // 点击后切换到完整的转码面板
    showTranscodeButton(container, pickCode)
  })

  wrapper.appendChild(label)
  wrapper.appendChild(link)
  container.appendChild(wrapper)
}

/**
 * 已触发过加速的 pickCode 集合（避免重复请求）
 */
const acceleratedSet = new Set<string>()

/**
 * 在预览区域自动触发 VIP 加速转码并显示状态
 */
function showTranscodeButton(container: HTMLElement, pickCode: string, initialStatus?: TranscodeResponse) {
  container.classList.add('is-transcode-tip')
  container.innerHTML = ''

  const wrapper = document.createElement('div')
  wrapper.className = 'm115-transcode-area'

  const label = document.createElement('span')
  label.className = 'm115-transcode-label'
  label.textContent = 'VIP 自动加速转码中...'

  const button = document.createElement('button')
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
  button.hidden = true

  wrapper.appendChild(label)
  wrapper.appendChild(button)
  container.appendChild(wrapper)

  let pollTimer: number | undefined
  let transcodeFrame: HTMLIFrameElement | undefined
  let nativeFallbackVisible = false

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

  const cleanupTranscodeFrame = () => {
    transcodeFrame?.remove()
    transcodeFrame = undefined
  }

  const prepareTranscodeFrame = async () => {
    cleanupTranscodeFrame()

    const frame = document.createElement('iframe')
    transcodeFrame = frame
    frame.dataset['115mTranscodeFrame'] = pickCode
    frame.src = `https://115vod.com/?pickcode=${encodeURIComponent(pickCode)}&share_id=0`
    frame.style.cssText = [
      'position:fixed',
      'right:16px',
      'top:72px',
      'width:360px',
      'height:220px',
      'opacity:1',
      'border:1px solid rgba(255,106,0,.45)',
      'border-radius:10px',
      'box-shadow:0 10px 30px rgba(0,0,0,.18)',
      'background:#fff',
      'z-index:2147483647',
      'pointer-events:auto',
    ].join(';')
    document.documentElement.appendChild(frame)

    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('115vod iframe load timeout')), 8000)
      frame.addEventListener('load', () => {
        window.clearTimeout(timer)
        resolve()
      }, { once: true })
    })

    const ready = await sendRuntimeMessageSafe<{ ok?: boolean, error?: string }>({
      type: 'TRANSCODE_FRAME_READY',
      data: { pickCode },
    })
    if (isRuntimeContextInvalidatedResult(ready)) {
      setContextInvalidatedState()
      throw new Error('Extension context invalidated')
    }
    if (!ready?.ok) {
      throw new Error(ready?.error || '115vod iframe not ready')
    }
  }

  const enableTranscodeFrameFallback = false

  const applyStatus = (res: TranscodeResponse) => {
    // #region debug-point C:applyStatus
    // #endregion

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
    sendRuntimeMessageSafe<TranscodeResponse>({
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

  const runTranscode = (manual = false) => {
    stopPolling()
    if (manual) {
      button.disabled = true
      button.textContent = '加速中...'
      label.textContent = '正在请求 VIP 加速转码...'
      label.style.color = '#1677ff'
    }

    const frameReady = enableTranscodeFrameFallback ? prepareTranscodeFrame() : Promise.resolve()
    frameReady.then(() => sendRuntimeMessageSafe<TranscodeResponse>({
      type: 'TRANSCODE_ACCELERATE',
      data: { pickCode, batchFolder: true },
    })).then((res) => {
      cleanupTranscodeFrame()
      if (isRuntimeContextInvalidatedResult(res)) {
        setContextInvalidatedState()
        return
      }
      if (res && applyStatus(res)) {
        return
      }

      acceleratedSet.delete(pickCode)
      if (manual) {
        setNativeFallback(res?.error || '手动加速失败，可尝试后台加速')
        return
      }

      label.textContent = '自动加速不可用，可手动重试'
      label.style.color = '#fa8c16'
      button.hidden = false
      button.disabled = false
      button.textContent = 'VIP加速转码'
    }).catch((error) => {
      cleanupTranscodeFrame()
      console.warn(`[115m][transcode] runTranscode exception manual=${String(manual)} error=${error instanceof Error ? error.message : String(error)}`)
      acceleratedSet.delete(pickCode)
      if (manual) {
        setNativeFallback('手动加速异常，可尝试后台加速')
        return
      }

      label.textContent = '自动加速不可用，可手动重试'
      label.style.color = '#fa8c16'
      button.hidden = false
      button.disabled = false
      button.textContent = 'VIP加速转码'
    })
  }

  const runNativeFallback = () => {
    stopPolling()
    button.disabled = true
    button.textContent = '后台加速中...'
    label.textContent = '正在后台打开原生播放页触发加速...'
    label.style.color = '#1677ff'
    sendRuntimeMessageSafe<TranscodeResponse>({
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
    runTranscode(true)
  })

  // 有初始状态（刷新恢复）→ 直接显示进度并开始轮询
  if (initialStatus) {
    applyStatus(initialStatus)
    return
  }

  if (acceleratedSet.has(pickCode)) {
    runStatusCheck()
    return
  }
  acceleratedSet.add(pickCode)

  runTranscode(false)
}
