export function createTimeline(options: {
  onSeek?: (percent: number) => void
}) {
  const container = document.createElement('div')
  container.className = 'm115-v2-timeline-container'

  const track = document.createElement('div')
  track.className = 'm115-v2-timeline-track'

  const buffer = document.createElement('div')
  buffer.className = 'm115-v2-timeline-buffer'
  buffer.style.width = '0%'

  const progress = document.createElement('div')
  progress.className = 'm115-v2-timeline-progress'
  progress.style.width = '0%'

  const thumb = document.createElement('div')
  thumb.className = 'm115-v2-timeline-thumb'

  progress.appendChild(thumb)
  track.appendChild(buffer)
  track.appendChild(progress)
  container.appendChild(track)

  let isDragging = false

  const calculatePercent = (e: MouseEvent) => {
    const rect = track.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    return x / rect.width
  }

  container.addEventListener('mousedown', (e) => {
    isDragging = true
    const p = calculatePercent(e)
    progress.style.width = `${p * 100}%`
    options.onSeek?.(p)

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging) return
      const mp = calculatePercent(moveEvent)
      progress.style.width = `${mp * 100}%`
      options.onSeek?.(mp)
    }

    const onMouseUp = () => {
      isDragging = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  })

  return {
    element: container,
    setProgress(percent: number) {
      if (!isDragging) {
        progress.style.width = `${Math.max(0, Math.min(percent, 1)) * 100}%`
      }
    },
    setBuffer(percent: number) {
      buffer.style.width = `${Math.max(0, Math.min(percent, 1)) * 100}%`
    },
  }
}
