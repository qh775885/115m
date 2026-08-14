export interface HoverCover {
  time: number
  imgUrl: string
  width?: number
  height?: number
}

export function formatTimeLabel(seconds: number): string {
  return formatTime(seconds, { padHours: true, padMinutes: true })
}

/** 播放列表进度用紧凑格式：小时位不补零；有小时时分钟补零，无小时时分钟不补零 */
export function formatCompactTime(seconds: number): string {
  const sec = Math.max(0, Math.floor(seconds))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatTime(seconds: number, options: { padHours: boolean, padMinutes: boolean }): string {
  const sec = Math.max(0, Math.floor(seconds))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) {
    const hourText = options.padHours ? String(h).padStart(2, '0') : String(h)
    const minuteText = options.padMinutes ? String(m).padStart(2, '0') : String(m)
    return `${hourText}:${minuteText}:${String(s).padStart(2, '0')}`
  }
  const minuteText = options.padMinutes ? String(m).padStart(2, '0') : String(m)
  return `${minuteText}:${String(s).padStart(2, '0')}`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function blurTime(time: number, interval: number, duration: number): number {
  if (!Number.isFinite(time) || !Number.isFinite(duration) || duration <= 0) {
    return 0
  }
  if (!Number.isFinite(interval) || interval <= 0) {
    return clamp(time, 0, duration)
  }

  const blurred = Math.round(time / interval) * interval
  return clamp(Math.round(blurred * 10) / 10, 0, duration)
}

export function findNearestCover(covers: HoverCover[], hoverTime: number, maxDelta = 30): HoverCover | null {
  if (!covers.length) return null
  let nearest = covers[0]
  let minDelta = Math.abs(nearest.time - hoverTime)
  for (const cover of covers) {
    const delta = Math.abs(cover.time - hoverTime)
    if (delta < minDelta) {
      minDelta = delta
      nearest = cover
    }
  }
  // 如果最近的封面距离超过最大允许距离，返回 null
  // 这样会触发精确封面加载，而不是显示一个过远的封面
  if (minDelta > maxDelta) {
    return null
  }
  return nearest
}
