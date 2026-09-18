import { fetchWithTimeout } from '../../lib/promise'

export interface SubtitleItem {
  sid: string
  title: string
  url: string
  type: string
  language?: string
  sha1?: string
}

export interface SubtitleCue {
  start: number
  end: number
  text: string
}

export interface SubtitleListResponse {
  data?: SubtitleItem[]
  list?: SubtitleItem[]
  error?: string
}

const SUBTITLE_MESSAGE_TIMEOUT_MS = 12000

export function normalizeSubtitleList(response: any): SubtitleItem[] {
  const data = response?.data
  let list: any[] = []

  if (Array.isArray(data?.list)) {
    list = data.list
  } else if (Array.isArray(response?.list)) {
    list = response.list
  } else if (Array.isArray(data)) {
    list = data
  }

  // 115 可能会将单条内置字幕直接放在 data.autoload 中
  if (data?.autoload && typeof data.autoload === 'object' && !list.some(item => item.sid === data.autoload.sid)) {
    list = [data.autoload, ...list]
  }

  // 115master-main 参考逻辑：处理 data.sub_list
  if (Array.isArray(data?.sub_list)) {
    data.sub_list.forEach((sub: any) => {
      if (!list.some(item => item.sid === sub.sid)) {
        list.push(sub)
      }
    })
  }

  if (!list.length) return []

  return list
    .map(item => ({
      sid: String(item.sid || item.sha1 || item.url || ''),
      title: String(item.title || item.language || item.name || '字幕'),
      url: String(item.url || ''),
      type: String(item.type || readSubtitleType(item.url) || 'srt').toLowerCase(),
      language: item.language,
      sha1: item.sha1,
    }))
    .filter(item => item.sid && item.url)
}

export function readSubtitleType(url: string | undefined) {
  if (!url) return ''
  try {
    const pathname = new URL(url).pathname
    return pathname.split('.').pop()?.toLowerCase() || ''
  }
  catch {
    return url.split('?')[0]?.split('.').pop()?.toLowerCase() || ''
  }
}

export async function fetchSubtitleList(sendMessage: <T = unknown>(message: unknown, retries?: number, delay?: number, timeoutMs?: number) => Promise<T | null>, pickCode: string) {
  const response = await sendMessage<SubtitleListResponse>({
    type: 'FETCH_SUBTITLES',
    data: { pickCode },
  }, 0, 0, SUBTITLE_MESSAGE_TIMEOUT_MS)
  return normalizeSubtitleList(response)
}

export async function fetchSubtitleText(url: string) {
  const response = await fetchWithTimeout(url, { credentials: 'include' }, 15000)
  if (!response.ok) {
    // 尝试直接获取（处理部分 115 地址可能存在的 CORS 或鉴权差异）
    const retryRes = await fetchWithTimeout(url, undefined, 15000).catch(() => null)
    if (retryRes && retryRes.ok) return await retryRes.text()
    throw new Error(`字幕下载失败：${response.status}`)
  }
  return await response.text()
}

export function parseSubtitleText(text: string, type: string): SubtitleCue[] {
  const normalizedType = normalizeSubtitleType(type, text)
  if (normalizedType === 'ass' || normalizedType === 'ssa') {
    return parseAssSubtitle(text)
  }
  if (normalizedType === 'vtt') {
    return parseVttSubtitle(text)
  }
  if (normalizedType === 'sub') {
    return parseSubSubtitle(text)
  }
  return parseSrtSubtitle(text)
}

export function normalizeSubtitleType(type: string | undefined, text = '') {
  const normalizedType = String(type || '').trim().toLowerCase()
  if (normalizedType === 'webvtt') return 'vtt'
  if (normalizedType) return normalizedType

  const normalizedText = text.replace(/^\uFEFF/, '').trimStart()
  if (/^webvtt\b/i.test(normalizedText)) return 'vtt'
  if (/^\{\d+\}\{\d*\}/m.test(normalizedText)) return 'sub'
  if (/^\[script info\]/i.test(normalizedText) || /^dialogue:/im.test(normalizedText)) return 'ass'
  return 'srt'
}

export function parseSrtSubtitle(text: string): SubtitleCue[] {
  return text
    .replace(/^\uFEFF/, '')
    .replace(/\r/g, '')
    .split(/\n{2,}/)
    .map(block => parseSrtBlock(block))
    .filter((cue): cue is SubtitleCue => !!cue)
}

export function parseVttSubtitle(text: string): SubtitleCue[] {
  return text
    .replace(/^\uFEFF/, '')
    .replace(/\r/g, '')
    .replace(/^WEBVTT[^\n]*\n+/i, '')
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split('\n').map(line => line.trimEnd())
      const timeIndex = lines.findIndex(line => line.includes('-->'))
      if (timeIndex < 0) return null

      const [startRaw, endRaw] = lines[timeIndex].split('-->').map(part => part.trim().split(/\s+/)[0])
      const start = parseSubtitleTime(startRaw)
      const end = parseSubtitleTime(endRaw)
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null

      const cueText = sanitizeSubtitleText(lines.slice(timeIndex + 1).join('\n'))
      if (!cueText) return null
      return { start, end, text: cueText }
    })
    .filter((cue): cue is SubtitleCue => !!cue)
}

function parseSrtBlock(block: string): SubtitleCue | null {
  const lines = block.split('\n').map(line => line.trim()).filter(Boolean)
  if (!lines.length) return null

  const timeIndex = lines.findIndex(line => line.includes('-->'))
  if (timeIndex < 0) return null

  const [startRaw, endRaw] = lines[timeIndex].split('-->').map(part => part.trim().split(/\s+/)[0])
  const start = parseSubtitleTime(startRaw)
  const end = parseSubtitleTime(endRaw)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null

  const text = sanitizeSubtitleText(lines.slice(timeIndex + 1).join('\n'))
  if (!text) return null

  return { start, end, text }
}

export function parseAssSubtitle(text: string): SubtitleCue[] {
  const lines = text.replace(/^\uFEFF/, '').replace(/\r/g, '').split('\n')
  let format: string[] = []
  const cues: SubtitleCue[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (/^Format:/i.test(trimmed)) {
      format = trimmed.slice(trimmed.indexOf(':') + 1).split(',').map(item => item.trim().toLowerCase())
      continue
    }
    if (!/^Dialogue:/i.test(trimmed) || !format.length) continue

    const raw = trimmed.slice(trimmed.indexOf(':') + 1).trim()
    const parts = splitAssDialogue(raw, format.length)
    const startIndex = format.indexOf('start')
    const endIndex = format.indexOf('end')
    const textIndex = format.indexOf('text')
    if (startIndex < 0 || endIndex < 0 || textIndex < 0) continue

    const start = parseSubtitleTime(parts[startIndex])
    const end = parseSubtitleTime(parts[endIndex])
    const cueText = sanitizeSubtitleText(parts.slice(textIndex).join(','))
    if (Number.isFinite(start) && Number.isFinite(end) && end > start && cueText) {
      cues.push({ start, end, text: cueText })
    }
  }

  return cues
}

export function parseSubSubtitle(text: string, fps = 23.976): SubtitleCue[] {
  return text
    .replace(/^\uFEFF/, '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => {
      const match = line.trim().match(/^\{(\d+)\}\{(\d*)\}([\s\S]*)$/)
      if (!match) return null

      const startFrame = Number(match[1])
      const endFrame = match[2] ? Number(match[2]) : startFrame + 1
      if (!Number.isFinite(startFrame) || !Number.isFinite(endFrame) || endFrame <= startFrame) return null

      const cueText = sanitizeSubtitleText(match[3].replace(/\|/g, '\n'))
      if (!cueText) return null

      return {
        start: startFrame / fps,
        end: endFrame / fps,
        text: cueText,
      }
    })
    .filter((cue): cue is SubtitleCue => !!cue)
}

function splitAssDialogue(raw: string, formatLength: number) {
  const parts = raw.split(',')
  if (parts.length <= formatLength) return parts
  return [...parts.slice(0, formatLength - 1), parts.slice(formatLength - 1).join(',')]
}

export function parseSubtitleTime(value: string | undefined) {
  if (!value) return Number.NaN
  const match = value.trim().match(/^(\d+):(\d{1,2}):(\d{1,2})(?:[,.](\d{1,3}))?$/)
  if (!match) return Number.NaN

  const hours = Number(match[1])
  const minutes = Number(match[2])
  const seconds = Number(match[3])
  const fraction = match[4] || '0'
  const milliseconds = Number(fraction.padEnd(3, '0').slice(0, 3))
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000
}

function sanitizeSubtitleText(text: string) {
  return text
    .replace(/\{[^}]*\}/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\\N/g, '\n')
    .replace(/\\n/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n')
}

export function findCueAt(cues: SubtitleCue[], currentTime: number) {
  let left = 0
  let right = cues.length - 1

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const cue = cues[mid]
    if (currentTime < cue.start) {
      right = mid - 1
    }
    else if (currentTime > cue.end) {
      left = mid + 1
    }
    else {
      return cue
    }
  }

  return null
}
