import { sendRuntimeMessageSafe } from '../runtime/runtime'

export interface ExitPlayerOptions {
  cid?: string
  sendMessage?: (message: unknown) => Promise<any>
  closeWindow?: () => void
  navigate?: (url: string) => void
  historyBack?: () => void
}

/**
 * 优雅退出播放器：
 * 1. 若处于全屏状态，先退出全屏；
 * 2. 优先通知后台关闭当前播放器标签页（115m 播放器为新标签页打开模式）；
 * 3. 尝试 window.close() 前端关闭；
 * 4. 兜底方案：若标签页无法关闭，回退到历史上一页或重定向至视频所属网盘目录。
 */
export async function exitPlayer(options: ExitPlayerOptions = {}): Promise<void> {
  if (typeof document !== 'undefined' && document.fullscreenElement) {
    try {
      await document.exitFullscreen()
    }
    catch {
      // 忽略全屏退出异常
    }
  }

  const sender = options.sendMessage || ((msg: unknown) => sendRuntimeMessageSafe(msg, 1, 100, 1000))

  try {
    const res = await sender({ type: 'CLOSE_TAB' })
    if (res?.success) {
      return
    }
  }
  catch {
    // 忽略扩展后台关闭异常
  }

  const closeWindow = options.closeWindow || (() => window.close())
  try {
    closeWindow()
  }
  catch {
    // 忽略
  }

  const cid = options.cid
  const targetUrl = cid
    ? `https://115.com/?cid=${encodeURIComponent(cid)}&offset=0&tab=&mode=wangpan`
    : 'https://115.com/'

  const navigate = options.navigate || ((url: string) => {
    window.location.href = url
  })

  if (typeof window !== 'undefined' && window.history.length > 1 && typeof document !== 'undefined' && document.referrer) {
    const historyBack = options.historyBack || (() => window.history.back())
    historyBack()
  }
  else {
    navigate(targetUrl)
  }
}
