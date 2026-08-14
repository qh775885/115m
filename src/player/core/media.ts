import type Artplayer from 'artplayer'

/**
 * 静默触发播放：忽略切换/重载期间的 play() promise 拒绝，避免 unhandled rejection。
 */
export function safePlay(art: Artplayer | null) {
  if (!art) return
  void art.play().catch(() => {
    // Ignore native play promise rejections during source switches and transient media reloads.
  })
}
