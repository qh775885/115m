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

export function shouldFallbackNativeSilentAudio(params: {
  title: string
  ultraUrl: string | null
  nativeUltraConservative: boolean
}) {
  const titleExt = readExtension(params.title)
  const urlExt = readExtension(params.ultraUrl || '')
  return params.nativeUltraConservative || titleExt === 'mkv' || urlExt === 'mkv'
}
