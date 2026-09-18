/**
 * 115m 2.0 · 播放历史控制器（Layer 2）
 * 断点续播读取 + 观看进度节流回存（15s leading/trailing，暂停与播完即时落库）。
 */

import { PlayerCore } from './player-core'
import { loadHistory, saveHistory } from '../adapters/history'
import { isCompletedPlayback } from '../services/history'

const MIN_WRITE_INTERVAL_MS = 15000

export interface HistoryMeta {
  pickCode: string
  fileName: string
}

export class HistoryController {
  private lastWriteAt = 0
  private timer: ReturnType<typeof setTimeout> | null = null
  private unsubscribe: (() => void) | null = null
  private stopped = false

  constructor(
    private readonly core: PlayerCore,
    private readonly getMeta: () => HistoryMeta,
  ) {}

  start(): void {
    this.stopped = false
    this.unsubscribe = this.core.store.subscribe((state, prev) => {
      // 暂停瞬间即时落库，保证关页签前进度不丢
      if (state.paused && !prev.paused) {
        void this.flush()
        return
      }
      if (state.currentTime === prev.currentTime) return
      if (state.dragging) return
      this.schedule()
    })
  }

  stop(): void {
    this.stopped = true
    this.unsubscribe?.()
    this.unsubscribe = null
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  /** 切集时重置节流窗口，避免上一集的写入节流影响新集。 */
  resetWindow(): void {
    this.lastWriteAt = 0
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  /** 读取并恢复断点。 */
  async restore(pickCode: string): Promise<void> {
    try {
      const record = await loadHistory(pickCode)
      if (!record?.currentTime) return
      this.core.restoreTime(record.currentTime)
    }
    catch (error) {
      console.warn('[115m-v2] 断点续播读取失败', error)
    }
  }

  /** 立即落库（暂停 / 播完 / 切集前调用）。 */
  async flush(): Promise<void> {
    const { pickCode, fileName } = this.getMeta()
    const state = this.core.store.get()
    if (!pickCode || !state.currentTime || !state.duration) return
    if (isCompletedPlayback(state.currentTime, state.duration)) return
    this.lastWriteAt = Date.now()
    try {
      await saveHistory({ pickCode, currentTime: state.currentTime, duration: state.duration })
    }
    catch {
      // 忽略落库错误
    }
  }

  private schedule(): void {
    if (this.stopped) return
    const elapsed = Date.now() - this.lastWriteAt
    if (elapsed >= MIN_WRITE_INTERVAL_MS) {
      if (this.timer) {
        clearTimeout(this.timer)
        this.timer = null
      }
      void this.flush()
      return
    }
    if (this.timer) return
    this.timer = setTimeout(() => {
      this.timer = null
      void this.flush()
    }, MIN_WRITE_INTERVAL_MS - elapsed)
  }
}
