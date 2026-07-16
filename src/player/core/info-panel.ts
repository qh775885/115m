import type Artplayer from 'artplayer'
import type { VideoPlaybackQualityLike } from './types'

const INFO_TITLE_MAP = [
  '播放器版本：',
  '视频地址：',
  '音量：',
  '当前时间：',
  '总时长：',
  '分辨率：',
]

export function patchArtInfoPanel(art: Artplayer, isNativeVideo: boolean): () => void {
  const template = art.template
  const info = template.$info
  const titleNodes = info.querySelectorAll('.art-info-title')

  titleNodes.forEach((node, index) => {
    const text = INFO_TITLE_MAP[index]
    if (text) {
      node.textContent = text
    }
  })

  const urlField = info.querySelector('[data-video="currentSrc"]') as HTMLElement | null
  if (urlField) {
    const raw = (urlField.textContent || '').replace(/\s*（[^）]+）\s*$/, '')
    const sourceMark = isNativeVideo ? '（无损链路）' : '（115原画链路）'
    urlField.textContent = `${raw} ${sourceMark}`
  }

  const closeBtn = info.querySelector('.art-info-close') as HTMLElement | null
  if (closeBtn) {
    closeBtn.textContent = '关闭'
  }

  const panel = info.querySelector('.art-info-panel')
  if (!panel) {
    return () => {}
  }

  let fpsItem = info.querySelector('[data-115m="fps"]') as HTMLElement | null
  if (!fpsItem) {
    fpsItem = document.createElement('div')
    fpsItem.className = 'art-info-item'
    fpsItem.setAttribute('data-115m', 'fps')
    fpsItem.innerHTML = '<div class="art-info-title">当前帧率：</div><div class="art-info-content" data-115m-fps>-- FPS</div>'
    panel.appendChild(fpsItem)
  }

  const fpsTarget = info.querySelector('[data-115m-fps]') as HTMLElement | null
  const video = art.video as HTMLVideoElement

  const getTotalFrames = () => {
    const qualityInfo = (video.getVideoPlaybackQuality?.() || {}) as VideoPlaybackQualityLike
    if (qualityInfo.totalVideoFrames && qualityInfo.totalVideoFrames > 0) {
      return qualityInfo.totalVideoFrames
    }
    const decoded = (video as HTMLVideoElement & { webkitDecodedFrameCount?: number }).webkitDecodedFrameCount
    if (typeof decoded === 'number' && decoded > 0) {
      return decoded
    }
    return 0
  }

  let lastTime = performance.now()
  let lastFrame = getTotalFrames()

  const update = () => {
    const total = getTotalFrames()
    const now = performance.now()
    const dt = (now - lastTime) / 1000
    const df = total - lastFrame
    let fps = dt > 0 ? Math.max(0, df / dt) : 0

    if (fpsTarget && dt >= 1) { // 至少间隔 1 秒才更新 UI，避免跳动且排除暂停期间的异常数值
      fpsTarget.textContent = `${fps.toFixed(1)} FPS`
      lastTime = now
      lastFrame = total
    }
  }

  update()
  // 每 2 秒统计一次即可，1 秒可能太快导致数值波动
  const timer = window.setInterval(update, 2000)
  return () => {
    window.clearInterval(timer)
  }
}
