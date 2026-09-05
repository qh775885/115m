import { getVideoCovers, primeThumbnailSourceUrl } from '../../lib/videoThumbnail'
import type { FileInfo } from './types'
import {
  getTranscodeStatusByFileId,
  getTranscodeStatusByPickCode,
} from './transcode-store'
import { isRuntimeContextInvalidatedResult, sendTypedRuntimeMessageSafe } from './runtime'
import {
  Scheduler,
  TaskCancelledError,
  createVisibilityObserver,
  findScrollContainer,
} from './utils'
import { showTranscodeButton } from './transcode-button'
import { openCoverLightbox } from './cover-lightbox'
import { previewObserverRegistry } from './observer-registry'

const coverScheduler = new Scheduler(3)

/**
 * 通过 background FETCH_M3U8 获取可靠的 M3U8 源 URL
 * background 有 cookie 和扩展上下文，比 content script 直连可靠
 * 返回 { ok: false, reason: 'not_transcoded' } 表示视频确实需要转码（M3U8 流不存在）
 * 返回 { ok: false, reason: 'unavailable' } 表示后台不可达/上下文失效，不能判定为需要转码
 * 返回 { ok: true, url } 表示 M3U8 可用，url 为最低画质源地址
 */
async function fetchM3u8ViaBackground(pickCode: string): Promise<{ ok: true, url: string } | { ok: false, reason: 'not_transcoded' | 'unavailable' }> {
  const res = await sendTypedRuntimeMessageSafe({
    type: 'FETCH_M3U8',
    data: { pickCode },
  })
  if (isRuntimeContextInvalidatedResult(res) || !res) {
    return { ok: false, reason: 'unavailable' }
  }
  if (res.error || !res.list || res.list.length === 0) {
    return { ok: false, reason: 'not_transcoded' }
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

const listPreviewCoverOptions = {
  maxWidth: 640,
  maxHeight: 640,
  quality: 0.78,
  cacheScope: 'list-v3',
  deferCacheWrite: true,
  useTimelineCache: false,
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
          if (m3u8Result.reason === 'unavailable') {
            // 后台不可达/上下文失效：不能据此判定"需要转码"，避免误标
            // 不设 isLoaded，允许后续重试（Chrome 更新/重启后 SW 可能稍后恢复）
            showPreviewUnavailable(container, '扩展后台未就绪，暂无法预览')
            state.isLoading = false
            // 5 秒后自动重试，无需用户手动滚动
            if (!state.disposed && item.isConnected && state.isVisible) {
              setTimeout(() => loadCovers(), 5000)
            }
            return
          }
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
