// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HoverPreviewSession, type HoverCover } from './hover-preview-session'
import type Artplayer from 'artplayer'
import * as videoThumbnail from '../../lib/videoThumbnail'

vi.mock('../../lib/videoThumbnail', () => ({
  getTimelineCovers: vi.fn(),
  getVideoCovers: vi.fn(),
  getVideoCoverAt: vi.fn(),
}))

const mockedThumbnail = vi.mocked(videoThumbnail)

function createArt(duration = 600): Artplayer {
  return {
    duration,
    on: vi.fn(),
    once: vi.fn(),
    off: vi.fn(),
    video: document.createElement('video'),
  } as unknown as Artplayer
}

function setDuration(art: Artplayer, duration: number) {
  Object.defineProperty(art, 'duration', { configurable: true, value: duration })
}

function createSession(duration = 600) {
  const art = createArt(duration)
  const options = {
    art,
    pickCode: 'pc1',
    onCoversChanged: vi.fn(),
    onDisplayRefreshRequested: vi.fn(),
    onPreciseCoverReady: vi.fn(),
    onDebug: vi.fn(),
  }
  const session = new HoverPreviewSession(options)
  return { session, art, options }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('HoverPreviewSession generation guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockedThumbnail.getTimelineCovers.mockResolvedValue([])
    mockedThumbnail.getVideoCovers.mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('丢弃 duration 变化后在途的 loadThumbnails 结果', async () => {
    const { session, art, options } = createSession(100)
    const coversDeferred = deferred<{ time: number, imgUrl: string }[]>()
    mockedThumbnail.getVideoCovers
      .mockReturnValueOnce(coversDeferred.promise as ReturnType<typeof videoThumbnail.getVideoCovers>)

    session.ensureThumbnailsForHover()
    await vi.advanceTimersByTimeAsync(0)
    expect(mockedThumbnail.getVideoCovers).toHaveBeenCalledTimes(1)

    setDuration(art, 200)
    session.handleDurationChange()
    expect(options.onCoversChanged).toHaveBeenCalledWith([], 200)

    coversDeferred.resolve([{ time: 10, imgUrl: 'data:old' }])
    await Promise.resolve()

    expect(session.getDisplayState(10).coarseCover).toBeNull()
    expect(options.onCoversChanged).not.toHaveBeenCalledWith(
      [expect.objectContaining({ time: 10 })],
      100,
    )
  })

  it('duration 未变化时正常加载粗采样封面', async () => {
    const { session, options } = createSession(100)
    mockedThumbnail.getVideoCovers.mockResolvedValue([{ time: 10, imgUrl: 'data:ok', width: 640, height: 360 }])

    session.ensureThumbnailsForHover()
    await vi.advanceTimersByTimeAsync(0)

    const state = session.getDisplayState(10)
    expect(state.coarseCover).not.toBeNull()
    expect(state.coarseCover?.imgUrl).toBe('data:ok')
    expect(options.onCoversChanged).toHaveBeenCalled()
  })

  it('丢弃 duration 变化后在途的 loadPreciseCover 结果', async () => {
    const { session, art, options } = createSession(100)
    mockedThumbnail.getVideoCovers.mockResolvedValue([])
    session.ensureThumbnailsForHover()
    await vi.advanceTimersByTimeAsync(0)

    const preciseDeferred = deferred<HoverCover | null>()
    mockedThumbnail.getVideoCoverAt.mockReturnValue(preciseDeferred.promise as ReturnType<typeof videoThumbnail.getVideoCoverAt>)

    session.schedulePreciseCover(15, null)
    await vi.advanceTimersByTimeAsync(0)
    expect(mockedThumbnail.getVideoCoverAt).toHaveBeenCalledTimes(1)

    setDuration(art, 300)
    session.handleDurationChange()

    preciseDeferred.resolve({ time: 15, imgUrl: 'data:old-precise' })
    await vi.advanceTimersByTimeAsync(0)

    expect(options.onPreciseCoverReady).not.toHaveBeenCalled()
  })

  it('duration 变化后在途精确请求不消费新队列', async () => {
    const { session, art } = createSession(100)
    mockedThumbnail.getVideoCovers.mockResolvedValue([])
    session.ensureThumbnailsForHover()
    await vi.advanceTimersByTimeAsync(0)

    const firstDeferred = deferred<HoverCover | null>()
    mockedThumbnail.getVideoCoverAt.mockReturnValue(firstDeferred.promise as ReturnType<typeof videoThumbnail.getVideoCoverAt>)

    session.schedulePreciseCover(10, null)
    await vi.advanceTimersByTimeAsync(0)
    expect(mockedThumbnail.getVideoCoverAt).toHaveBeenCalledTimes(1)

    setDuration(art, 300)
    session.handleDurationChange()

    firstDeferred.resolve({ time: 10, imgUrl: 'data:a' })
    await vi.advanceTimersByTimeAsync(0)

    expect(mockedThumbnail.getVideoCoverAt).toHaveBeenCalledTimes(1)
  })

  it('精确封面缓存超过上限后淘汰最久写入的 bucket', async () => {
    const { session } = createSession(1000)
    mockedThumbnail.getVideoCovers.mockResolvedValue([])
    session.ensureThumbnailsForHover()
    await vi.advanceTimersByTimeAsync(0)

    mockedThumbnail.getVideoCoverAt.mockImplementation(async (_, bucketTime) => ({
      time: bucketTime as number,
      imgUrl: `data:${bucketTime}`,
      width: 640,
      height: 360,
    }))

    // 模拟依次加载 MAX_PRECISE_COVERS + 1 个不同 bucket
    const internal = session as unknown as {
      preciseCovers: Map<number, unknown>
      loadPreciseCover: (bucketTime: number) => Promise<void>
    }
    for (let i = 0; i < 201; i += 1) {
      await internal.loadPreciseCover(i * 10)
    }

    expect(internal.preciseCovers.size).toBe(200)
    // 最早写入的 bucket 0 已被淘汰
    expect(internal.preciseCovers.has(0)).toBe(false)
    // 最新的 bucket 仍存在
    expect(internal.preciseCovers.has(2000)).toBe(true)
  })
})
