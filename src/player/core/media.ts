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

/**
 * 重置播放进度：同时清 video.currentTime 与 art.seek，防止复用 video 元素时继承上一集进度。
 */
export function resetVideoProgress(art: Artplayer | null) {
  if (!art) return
  if (art.video) {
    art.video.currentTime = 0
  }
  art.seek = 0
}
