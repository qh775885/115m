import { Icons } from '../../shared/icons'

const ROTATION_STEP = 90


export function normalizeRotationDegrees(value: number): number {
  const normalized = value % 360
  return normalized < 0 ? normalized + 360 : normalized
}

export function getNextRotationDegrees(current: number): number {
  return normalizeRotationDegrees(current + ROTATION_STEP)
}

export function computeRotationScale(params: {
  containerWidth: number
  containerHeight: number
  videoWidth: number
  videoHeight: number
  rotation: number
}): number {
  const rotation = normalizeRotationDegrees(params.rotation)
  if (rotation % 180 === 0) return 1

  const { containerWidth, containerHeight, videoWidth, videoHeight } = params
  if (containerWidth <= 0 || containerHeight <= 0 || videoWidth <= 0 || videoHeight <= 0) {
    return 1
  }

  const containerRatio = containerWidth / containerHeight
  const videoRatio = videoWidth / videoHeight

  let displayedWidth = containerWidth
  let displayedHeight = containerHeight

  if (containerRatio > videoRatio) {
    displayedWidth = containerHeight * videoRatio
  }
  else {
    displayedHeight = containerWidth / videoRatio
  }

  const rotatedWidth = displayedHeight
  const rotatedHeight = displayedWidth
  return Math.min(containerWidth / rotatedWidth, containerHeight / rotatedHeight)
}

export function applyRotationToVideo(params: {
  video: HTMLVideoElement | null
  container: HTMLElement | null
  rotation: number
}) {
  const { video, container } = params
  if (!video) return

  const rotation = normalizeRotationDegrees(params.rotation)
  const scale = computeRotationScale({
    containerWidth: container?.clientWidth || video.clientWidth,
    containerHeight: container?.clientHeight || video.clientHeight,
    videoWidth: video.videoWidth,
    videoHeight: video.videoHeight,
    rotation,
  })

  video.style.transformOrigin = 'center center'
  video.style.transform = rotation === 0
    ? 'rotate(0deg)'
    : `rotate(${rotation}deg) scale(${scale})`
}

function buildRotateSvg() {
  return Icons.RotateCw()
}

export function buildRotateControlItem(params: {
  controlName: string
  rotation: number
  onRotate: () => void
}) {
  const rotation = normalizeRotationDegrees(params.rotation)
  return {
    name: params.controlName,
    position: 'right' as const,
    index: 12,
    tooltip: rotation === 0 ? '画面旋转' : `画面旋转 ${rotation}°`,
    html: `<span class="m115-control-shell m115-control-button" aria-hidden="true" style="display:inline-flex;align-items:center;justify-content:center;width:100%;height:100%;color:${rotation === 0 ? 'rgba(255,255,255,.92)' : '#54b4ff'};line-height:0;font-size:0;">${buildRotateSvg()}</span>`,
    style: {
      width: 'var(--m115-control-size)',
      minWidth: 'var(--m115-control-size)',
      maxWidth: 'var(--m115-control-size)',
      height: 'var(--m115-control-size)',
      minHeight: 'var(--m115-control-size)',
      maxHeight: 'var(--m115-control-size)',
      marginRight: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: rotation === 0 ? 'rgba(255,255,255,.9)' : '#54b4ff',
    },
    mounted: ($control: HTMLElement) => {
      $control.classList.add('m115-rotate-control')
      $control.classList.toggle('is-active', rotation !== 0)
    },
    click: () => {
      params.onRotate()
      return false
    },
  }
}

