const HAVE_FUTURE_DATA = 3

export function shouldRetryNativePlayback(params: { retryCount: number, hasStartedPlaying: boolean }) {
  return !params.hasStartedPlaying && params.retryCount < 1
}

export function shouldFallbackNativeBlackVideo(params: {
  currentTime: number
  readyState: number
  videoWidth: number
  videoHeight: number
  totalVideoFrames: number
}) {
  if (params.currentTime < 3) return false
  if (params.readyState < HAVE_FUTURE_DATA) return false
  if (params.videoWidth > 0 && params.videoHeight > 0 && params.totalVideoFrames > 0) return false
  return true
}

const NATIVE_PLAYABLE_EXTENSIONS = new Set([
  'mp4',
  'm4v',
  'webm',
])

const NATIVE_TRYABLE_EXTENSIONS = new Set([
  'mov',
])

function readExtension(value: string) {
  const clean = value.split('?')[0].split('#')[0].trim().toLowerCase()
  const lastDot = clean.lastIndexOf('.')
  if (lastDot < 0 || lastDot === clean.length - 1) return ''
  return clean.slice(lastDot + 1)
}

export function canUseNativeUltraSource(title: string, ultraUrl: string | null) {
  const titleExt = readExtension(title)
  if (titleExt) {
    return NATIVE_PLAYABLE_EXTENSIONS.has(titleExt) || NATIVE_TRYABLE_EXTENSIONS.has(titleExt)
  }

  const urlExt = readExtension(ultraUrl || '')
  if (urlExt) {
    return NATIVE_PLAYABLE_EXTENSIONS.has(urlExt) || NATIVE_TRYABLE_EXTENSIONS.has(urlExt)
  }

  return false
}

export function isConservativeNativeUltraExtension(title: string, ultraUrl: string | null) {
  const titleExt = readExtension(title)
  if (titleExt) return NATIVE_PLAYABLE_EXTENSIONS.has(titleExt)

  const urlExt = readExtension(ultraUrl || '')
  if (urlExt) return NATIVE_PLAYABLE_EXTENSIONS.has(urlExt)

  return false
}

/**
 * 丢帧率过高时应降级：播放已推进一定时间且总帧数足够后，
 * 若 droppedVideoFrames / totalVideoFrames 超阈值则判定硬解失败（典型场景：
 * 竖屏 2160×3840 超出显卡硬解高度上限，被踢到 CPU 软解导致严重丢帧）。
 */
const DROP_FRAME_RATIO_THRESHOLD = 0.15
const DROP_FRAME_MIN_TOTAL_FRAMES = 60

export function shouldFallbackNativeDroppedFrames(params: {
  currentTime: number
  totalVideoFrames: number
  droppedVideoFrames: number
}) {
  if (params.currentTime < 2) return false
  if (params.totalVideoFrames < DROP_FRAME_MIN_TOTAL_FRAMES) return false
  return params.droppedVideoFrames / params.totalVideoFrames > DROP_FRAME_RATIO_THRESHOLD
}

export function shouldFallbackNativeSilentAudio(params: {
  title: string
  ultraUrl: string | null
  nativeUltraConservative: boolean
}) {
  const titleExt = readExtension(params.title)
  const urlExt = readExtension(params.ultraUrl || '')
  return params.nativeUltraConservative || titleExt === 'mkv' || urlExt === 'mkv'
}
