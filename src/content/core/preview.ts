import { getVideoCovers, primeThumbnailSourceUrl } from '../../lib/videoThumbnail'
import type { VideoThumbnail } from '../../lib/videoThumbnail'
import type { FileInfo } from './types'
import type { RuntimeTranscodeResponse } from '../../shared/messages'
import {
  getTranscodeStatusByFileId,
  getTranscodeStatusByPickCode,
  saveTranscodeStatus,
  subscribeTranscodeStatus,
} from '../../shared/transcode-store'
import { isRuntimeContextInvalidatedResult, sendTypedRuntimeMessageSafe } from './runtime'
import {
  Scheduler,
  TaskCancelledError,
  createVisibilityObserver,
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
  const res = await sendTypedRuntimeMessageSafe({
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

function showPreviewUnavailable(container: HTMLElement, hint?: string) {
  if (hint) {
    container.innerHTML = `<div style="font-size:11px;color:rgba(0,0,0,.38);line-height:1.6;text-align:center;">${hint}</div>`
    return
  }
  container.innerHTML = ''
}

type TranscodeResponse = RuntimeTranscodeResponse

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
let lightboxDoc: Document | null = null

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
  if (lightboxDoc) {
    lightboxDoc.removeEventListener('keydown', handleLightboxKeydown, true)
    lightboxDoc = null
  }
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

function openCoverLightbox(doc: Document, covers: VideoThumbnail[], index: number) {
  if (!covers.length) return

  closeCoverLightbox()

  lightboxDoc = doc
  lightboxCovers = covers
  lightboxIndex = index

  const root = doc.createElement('div')
  root.className = 'm115-cover-lightbox'

  const image = doc.createElement('img')
  image.className = 'm115-cover-lightbox-img'

  const time = doc.createElement('div')
  time.className = 'm115-cover-lightbox-time'

  const closeButton = doc.createElement('button')
  closeButton.type = 'button'
  closeButton.className = 'm115-cover-lightbox-close'
  closeButton.textContent = '×'

  const prevButton = doc.createElement('button')
  prevButton.type = 'button'
  prevButton.className = 'm115-cover-lightbox-nav is-prev'
  prevButton.textContent = '‹'

  const nextButton = doc.createElement('button')
  nextButton.type = 'button'
  nextButton.className = 'm115-cover-lightbox-nav is-next'
  nextButton.textContent = '›'

  root.appendChild(image)
  root.appendChild(time)
  root.appendChild(closeButton)
  root.appendChild(prevButton)
  root.appendChild(nextButton)
  doc.documentElement.appendChild(root)

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
  doc.addEventListener('keydown', handleLightboxKeydown, true)
}

/** 预览图加载状态 */
interface PreviewState {
  isLoading: boolean
  isLoaded: boolean
  error: boolean
  isVisible: boolean
  disposed: boolean
  cancelTask?: () => void
  visibilityObserver?: { destroy: () => void }
  scrollObserver?: { destroy: () => void }
  dispose?: () => void
}

const previewStates = new WeakMap<HTMLElement, PreviewState>()
export class PreviewObserverRegistry {
  private readonly scrollCallbacks = new Map<HTMLElement | Window, Set<() => void>>()
  private readonly scrollListeners = new Map<HTMLElement | Window, () => void>()
  private readonly registeredItemsByDoc = new Map<Document, Map<HTMLElement, () => void>>()
  private readonly removalObservers = new Map<Document, MutationObserver>()

  registerScrollStop(target: HTMLElement | Window, callback: () => void) {
    let callbacks = this.scrollCallbacks.get(target)
    if (!callbacks) {
      callbacks = new Set()
      this.scrollCallbacks.set(target, callbacks)

      let timer: number | undefined
      const listener = () => {
        if (typeof timer === 'number') window.clearTimeout(timer)
        timer = window.setTimeout(() => {
          timer = undefined
          callbacks?.forEach(onScrollStop => onScrollStop())
        }, 120)
      }
      const eventTarget = target === window ? window : target
      const onScroll = typeof eventTarget.addEventListener === 'function'
        ? () => eventTarget.addEventListener('scroll', listener, { passive: true })
        : () => {}
      onScroll()
      this.scrollListeners.set(target, () => {
        if (typeof timer === 'number') window.clearTimeout(timer)
        if (typeof eventTarget.removeEventListener === 'function') {
          eventTarget.removeEventListener('scroll', listener)
        }
      })
    }
    callbacks.add(callback)

    return () => {
      const currentCallbacks = this.scrollCallbacks.get(target)
      if (!currentCallbacks) return
      currentCallbacks.delete(callback)
      if (currentCallbacks.size > 0) return
      this.scrollListeners.get(target)?.()

      this.scrollListeners.delete(target)
      this.scrollCallbacks.delete(target)
    }
  }

  registerItem(item: HTMLElement, dispose: () => void) {
    const doc = item.ownerDocument
    let items = this.registeredItemsByDoc.get(doc)
    if (!items) {
      items = new Map()
      this.registeredItemsByDoc.set(doc, items)

      const observer = new MutationObserver(() => {
        const map = this.registeredItemsByDoc.get(doc)
        if (!map) return
        map.forEach((onDispose, registeredItem) => {
          if (!registeredItem.isConnected) {
            map.delete(registeredItem)
            onDispose()
          }
        })
        if (map.size === 0) {
          observer.disconnect()
          this.removalObservers.delete(doc)
          this.registeredItemsByDoc.delete(doc)
        }
      })
      observer.observe(doc.documentElement, { childList: true, subtree: true })
      this.removalObservers.set(doc, observer)
    }
    items.set(item, dispose)

    return () => {
      items?.delete(item)
      if (items && items.size === 0) {
        this.removalObservers.get(doc)?.disconnect()
        this.removalObservers.delete(doc)
        this.registeredItemsByDoc.delete(doc)
      }
    }
  }

  /** 文档被整体替换/销毁时，强制清理该文档下的全部预览资源与观察器 */
  clearDocument(doc: Document) {
    const items = this.registeredItemsByDoc.get(doc)
    if (items) {
      items.forEach(onDispose => onDispose())
      items.clear()
      this.registeredItemsByDoc.delete(doc)
    }
    this.removalObservers.get(doc)?.disconnect()
    this.removalObservers.delete(doc)
  }
}

const previewObserverRegistry = new PreviewObserverRegistry()
export { previewObserverRegistry }

/**
 * 渲染预览图（带可见性检测和滚动优化）
 */
export function renderPreview(item: HTMLElement, file: FileInfo) {
  // 115 列表复用同一 DOM 节点展示新文件：先销毁该节点旧预览的所有资源
  // （可见性/滚动观察器、转码轮询与订阅、封面任务），防止残留监听继续发请求。
  const existing = previewStates.get(item)
  if (existing && !existing.disposed) {
    existing.dispose?.()
  }
  item.querySelector('.m115-cover-container')?.remove()
  item.classList.remove('with-ext-video-cover')

  const doc = item.ownerDocument

  item.classList.add('with-ext-video-cover')

  const container = doc.createElement('div')
  container.className = 'm115-cover-container'

  const skeleton = doc.createElement('div')
  skeleton.className = 'm115-cover-skeleton'
  container.appendChild(skeleton)
  item.appendChild(container)

  const state: PreviewState = {
    isLoading: false,
    isLoaded: false,
    error: false,
    isVisible: false,
    disposed: false,
  }
  previewStates.set(item, state)

  /** 加载预览图 */
  const loadCovers = async () => {
    if (state.disposed || !item.isConnected || state.isLoading || state.isLoaded || state.error) return

    state.isLoading = true

    const { promise, cancel } = coverScheduler.add(async () => {
      try {
        // 1. 通过 background 获取可靠的 M3U8 源 URL
        // 仅 M3U8 不可用时判定为需要转码，并展示手动按钮（不自动触发）
        const m3u8Result = await fetchM3u8ViaBackground(file.pickCode)
        if (state.disposed || !item.isConnected) return
        if (!m3u8Result.ok) {
          // 检查是否有本地/会话保存的转码状态
          const savedRecord = await getTranscodeStatusByPickCode(file.pickCode) || (file.fileId ? await getTranscodeStatusByFileId(file.fileId) : null)
          showTranscodeButton(container, file.pickCode, file.fileId, savedRecord?.status)
          state.isLoaded = true
          return
        }

        // 2. 注入缓存，跳过 content script 不可靠的 M3U8 直连
        primeThumbnailSourceUrl(file.pickCode, m3u8Result.url)

        // 3. duration 缺失或抽帧失败：流已可用，只是预览不可用，不触发转码
        if (file.duration === 0) {
          showPreviewUnavailable(container)
          state.isLoaded = true
          return
        }

        // 4. 生成封面
        const covers = await getVideoCovers(file.pickCode, file.duration, 5, listPreviewCoverOptions)
        if (state.disposed || !item.isConnected) return
        if (!covers.length) {
          showPreviewUnavailable(container)
          state.isLoaded = true
          return
        }

        const row = doc.createElement('div')
        row.className = 'm115-cover-loaded'

        covers.forEach((cover, index) => {
          const thumb = doc.createElement('span')
          thumb.className = 'm115-cover-thumb'

          const img = doc.createElement('img')
          img.className = 'm115-cover-img'
          img.src = cover.imgUrl
          img.alt = `预览 ${Math.floor(cover.time)}s`

          thumb.appendChild(img)
          thumb.addEventListener('click', (event) => {
            event.preventDefault()
            event.stopPropagation()
            openCoverLightbox(doc, covers, index)
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
        // 封面生成失败但 M3U8 可能仍可用，不误触发转码
        console.warn('[115m] 封面抽帧失败:', e)
        showPreviewUnavailable(container, '封面预览失败，可能网络不佳')
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
      state.isVisible = true
      // 可见时，等待滚动停止后加载
      if (!state.isLoaded && !state.error) {
        scheduleLoadAfterScrollStop()
      }
    },
    () => {
      state.isVisible = false
      // 不可见时，取消加载
      cancelLoad()
    }
  )

  const unregisterScrollStop = previewObserverRegistry.registerScrollStop(scrollTarget, () => {
    // 滚动停止后，如果元素可见且未加载，则加载
    if (!state.isLoaded && !state.error && !state.isLoading) {
      if (state.isVisible) {
        loadCovers()
      }
    }
  })
  state.scrollObserver = { destroy: unregisterScrollStop }

  // 清理函数（元素移除时调用）
  const cleanup = () => {
    if (state.disposed) return
    state.disposed = true
    if (typeof scrollStopTimer === 'number') {
      window.clearTimeout(scrollStopTimer)
      scrollStopTimer = undefined
    }
    state.visibilityObserver?.destroy()
    state.scrollObserver?.destroy()
    cancelLoad()
    unregisterItem()
    previewStates.delete(item)
  }
  state.dispose = cleanup
  const unregisterItem = previewObserverRegistry.registerItem(item, cleanup)
}

/**
 * 已触发过加速的 pickCode 集合（避免重复请求）
 */
const acceleratedSet = new Set<string>()

/**
 * 预览区手动 VIP 加速转码：
 * - 仅在判定需要转码时展示按钮，不自动触发
 * - 点击后提交当前视频，并顺带批量同文件夹需转码项（官方 batch_push）
 */
function showTranscodeButton(container: HTMLElement, pickCode: string, fileId?: string, initialStatus?: TranscodeResponse) {
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
  let transcodeFrame: HTMLIFrameElement | undefined
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

  const cleanupTranscodeFrame = () => {
    transcodeFrame?.remove()
    transcodeFrame = undefined
  }

  const prepareTranscodeFrame = async () => {
    cleanupTranscodeFrame()

    const frame = doc.createElement('iframe')
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
    doc.documentElement.appendChild(frame)

    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('115vod iframe load timeout')), 8000)
      frame.addEventListener('load', () => {
        window.clearTimeout(timer)
        resolve()
      }, { once: true })
    })

    const ready = await sendTypedRuntimeMessageSafe({
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

    const frameReady = enableTranscodeFrameFallback ? prepareTranscodeFrame() : Promise.resolve()
    frameReady.then(() => sendTypedRuntimeMessageSafe({
      type: 'TRANSCODE_ACCELERATE',
      data: { pickCode, batchFolder: true },
    })).then((res) => {
      cleanupTranscodeFrame()
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
      cleanupTranscodeFrame()
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
