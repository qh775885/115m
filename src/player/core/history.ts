import { sendTypedRuntimeMessageSafe } from './runtime'

export interface VolumePreference {
  volume: number
  muted: boolean
}

/**
 * 画质偏好记录
 */
export interface QualityPreference {
  label: string
  quality: number
}

export interface SubtitlePreference {
  sid: string
  title: string
  type: string
  language?: string
  disabled?: boolean
}

export interface AudioTrackPreference {
  id: number
  label: string
}

interface PlayHistoryRecord {
  currentTime: number
  duration?: number
  watchEnd?: boolean
}

export interface PlayHistoryRestoreTarget {
  readyState: number
  currentTime: number
  addEventListener: (type: 'loadedmetadata' | 'canplay', listener: () => void, options?: AddEventListenerOptions) => void
  removeEventListener: (type: 'loadedmetadata' | 'canplay', listener: () => void) => void
}

interface PendingPlayHistoryWrite {
  params: {
    pickCode: string
    fileName: string
    currentTime: number
    duration: number
    quality: string
  }
  timer: number | null
}

const pendingPlayHistoryWrites = new Map<string, PendingPlayHistoryWrite>()
const lastPlayHistoryWriteAt = new Map<string, number>()

export interface PlayHistoryMap {
  [pickCode: string]: PlayHistoryRecord | undefined
}

export interface PlaylistProgressSnapshot {
  progressSec: number
  progressPercent: number
}

const QUALITY_PREF_STORAGE_KEY = '115m-quality-preferences'
const SUBTITLE_PREF_STORAGE_KEY = '115m-subtitle-preferences'
const AUDIO_TRACK_PREF_STORAGE_KEY = '115m-audio-track-preferences'
const VIDEO_ROTATION_STORAGE_KEY = '115m-video-rotations'
const VOLUME_PREF_STORAGE_KEY = '115m-volume-preference'
const DEFAULT_VOLUME_PREFERENCE: VolumePreference = {
  volume: 0.6,
  muted: false,
}
const PLAY_HISTORY_COMPLETED_REMAINING_SEC = 15
const PLAY_HISTORY_COMPLETED_RATIO = 0.98
const PLAY_HISTORY_WRITE_DEBOUNCE_MS = 3000
const PLAY_HISTORY_MIN_WRITE_INTERVAL_MS = 15000
const NATIVE_PLAY_HISTORY_ENABLED = true

function normalizeVolumePreference(value: unknown): VolumePreference {
  if (!value || typeof value !== 'object') return DEFAULT_VOLUME_PREFERENCE

  const record = value as Partial<VolumePreference>
  const volume = typeof record.volume === 'number'
    ? Math.max(0, Math.min(1, record.volume))
    : DEFAULT_VOLUME_PREFERENCE.volume
  const muted = typeof record.muted === 'boolean'
    ? record.muted
    : DEFAULT_VOLUME_PREFERENCE.muted

  return { volume, muted }
}

function readQualityPreferenceMap(): Record<string, QualityPreference> {
  try {
    const raw = localStorage.getItem(QUALITY_PREF_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, QualityPreference>
    return parsed && typeof parsed === 'object' ? parsed : {}
  }
  catch {
    return {}
  }
}

function writeQualityPreferenceMap(map: Record<string, QualityPreference>) {
  try {
    localStorage.setItem(QUALITY_PREF_STORAGE_KEY, JSON.stringify(map))
  }
  catch {
    // ignore storage errors
  }
}

function readSubtitlePreferenceMap(): Record<string, SubtitlePreference> {
  try {
    const raw = localStorage.getItem(SUBTITLE_PREF_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, SubtitlePreference>
    return parsed && typeof parsed === 'object' ? parsed : {}
  }
  catch {
    return {}
  }
}

function writeSubtitlePreferenceMap(map: Record<string, SubtitlePreference>) {
  try {
    localStorage.setItem(SUBTITLE_PREF_STORAGE_KEY, JSON.stringify(map))
  }
  catch {
    // ignore storage errors
  }
}

function readAudioTrackPreferenceMap(): Record<string, AudioTrackPreference> {
  try {
    const raw = localStorage.getItem(AUDIO_TRACK_PREF_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, AudioTrackPreference>
    return parsed && typeof parsed === 'object' ? parsed : {}
  }
  catch {
    return {}
  }
}

function writeAudioTrackPreferenceMap(map: Record<string, AudioTrackPreference>) {
  try {
    localStorage.setItem(AUDIO_TRACK_PREF_STORAGE_KEY, JSON.stringify(map))
  }
  catch {
    // ignore storage errors
  }
}

function readVideoRotationMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(VIDEO_ROTATION_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, number>
    return parsed && typeof parsed === 'object' ? parsed : {}
  }
  catch {
    return {}
  }
}

function writeVideoRotationMap(map: Record<string, number>) {
  try {
    localStorage.setItem(VIDEO_ROTATION_STORAGE_KEY, JSON.stringify(map))
  }
  catch {
    // ignore storage errors
  }
}

export function loadVolumePreference(): VolumePreference {
  try {
    const raw = localStorage.getItem(VOLUME_PREF_STORAGE_KEY)
    if (!raw) return DEFAULT_VOLUME_PREFERENCE
    const parsed = JSON.parse(raw) as VolumePreference
    return normalizeVolumePreference(parsed)
  }
  catch {
    return DEFAULT_VOLUME_PREFERENCE
  }
}

export function saveVolumePreference(preference: VolumePreference) {
  try {
    localStorage.setItem(VOLUME_PREF_STORAGE_KEY, JSON.stringify(normalizeVolumePreference(preference)))
  }
  catch {
    // ignore storage errors
  }
}

/**
 * 保存用户手动选择的画质偏好（仅手动切换时调用）
 */
export function saveQualityPreference(pickCode: string, label: string, quality: number) {
  if (!pickCode) return
  const prefs = readQualityPreferenceMap()
  prefs[pickCode] = { label, quality }
  writeQualityPreferenceMap(prefs)
}

/**
 * 加载用户之前为该视频选择的画质偏好
 * 返回 null 表示用户从未手动选择过（使用默认无损）
 */
export async function loadQualityPreference(pickCode: string): Promise<QualityPreference | null> {
  if (!pickCode) return null
  const prefs = readQualityPreferenceMap()
  return prefs[pickCode] ?? null
}

export function saveSubtitlePreference(pickCode: string, preference: SubtitlePreference) {
  if (!pickCode) return
  const prefs = readSubtitlePreferenceMap()
  prefs[pickCode] = preference
  writeSubtitlePreferenceMap(prefs)
}

export function loadSubtitlePreference(pickCode: string): SubtitlePreference | null {
  if (!pickCode) return null
  const prefs = readSubtitlePreferenceMap()
  return prefs[pickCode] ?? null
}

export function saveAudioTrackPreference(pickCode: string, preference: AudioTrackPreference) {
  if (!pickCode) return
  const prefs = readAudioTrackPreferenceMap()
  prefs[pickCode] = preference
  writeAudioTrackPreferenceMap(prefs)
}

export function loadAudioTrackPreference(pickCode: string): AudioTrackPreference | null {
  if (!pickCode) return null
  const prefs = readAudioTrackPreferenceMap()
  return prefs[pickCode] ?? null
}

export function loadVideoRotation(pickCode: string): number {
  if (!pickCode) return 0
  const rotations = readVideoRotationMap()
  const value = rotations[pickCode]
  return typeof value === 'number' ? value : 0
}

export function saveVideoRotation(pickCode: string, rotation: number) {
  if (!pickCode) return
  const rotations = readVideoRotationMap()
  rotations[pickCode] = rotation
  writeVideoRotationMap(rotations)
}

export async function loadPlayHistory(pickCode: string, onRestore: (time: number) => void) {
  try {
    const response = await loadNativePlayHistory(pickCode)

    if (response && shouldRestorePlayHistory(response.currentTime, response.duration, response.watchEnd)) {
      setTimeout(() => onRestore(response.currentTime), 500)
    }
  }
  catch {
    // ignore history errors
  }
}

export async function loadPlayHistoryWhenReady(
  pickCode: string,
  getTarget: () => PlayHistoryRestoreTarget | null,
  canRestore: () => boolean = () => true,
) {
  try {
    const response = await loadNativePlayHistory(pickCode)
    if (!response || !shouldRestorePlayHistory(response.currentTime, response.duration, response.watchEnd)) return

    const target = getTarget()
    if (!target) return

    const restore = () => {
      if (!canRestore()) return
      const currentTarget = getTarget()
      if (currentTarget) currentTarget.currentTime = response.currentTime
    }

    if (target.readyState >= HTMLMediaElement.HAVE_METADATA) {
      restore()
      return
    }

    let restored = false
    let fallbackTimer: number | null = null

    const cleanup = () => {
      target.removeEventListener('loadedmetadata', restoreOnce)
      target.removeEventListener('canplay', restoreOnce)
      if (fallbackTimer !== null) {
        window.clearTimeout(fallbackTimer)
        fallbackTimer = null
      }
    }

    const restoreOnce = () => {
      if (restored) return
      restored = true
      cleanup()
      restore()
    }

    target.addEventListener('loadedmetadata', restoreOnce, { once: true })
    target.addEventListener('canplay', restoreOnce, { once: true })
    fallbackTimer = window.setTimeout(restoreOnce, 1200)
  }
  catch {
    // ignore history errors
  }
}

export async function loadNativePlayHistory(pickCode: string): Promise<PlayHistoryRecord | null> {
  if (!NATIVE_PLAY_HISTORY_ENABLED || !pickCode) return null

  const response = await sendTypedRuntimeMessageSafe({
    type: 'GET_NATIVE_HISTORY',
    data: { pickCode, shareId: '0' },
  })
  if (!response?.currentTime || response.currentTime <= 0 || response.watchEnd) return null

  return response
}

export async function loadNativePlayHistoryMap(pickCodes: string[]): Promise<PlayHistoryMap> {
  if (!NATIVE_PLAY_HISTORY_ENABLED || pickCodes.length === 0) return {}

  try {
    const nativeMap = await sendTypedRuntimeMessageSafe({
      type: 'GET_NATIVE_HISTORY_MAP',
      data: { pickCodes, shareId: '0' },
    })
    return nativeMap ?? {}
  }
  catch {
    return {}
  }
}

export function shouldRestorePlayHistory(currentTime: number, duration?: number, watchEnd = false): boolean {
  if (watchEnd) return false
  if (!currentTime || currentTime <= 0) return false
  if (!duration || duration <= 0) return true

  return !isCompletedPlayback(currentTime, duration)
}

export function isCompletedPlayback(currentTime: number, duration: number): boolean {
  if (!duration || duration <= 0) return false
  const remaining = Math.max(0, duration - currentTime)
  return remaining <= PLAY_HISTORY_COMPLETED_REMAINING_SEC || currentTime / duration >= PLAY_HISTORY_COMPLETED_RATIO
}

export function buildPlaylistProgressSnapshot(history?: PlayHistoryRecord): PlaylistProgressSnapshot | null {
  if (!history?.currentTime || !history.duration || history.duration <= 0) {
    return null
  }

  if (!shouldRestorePlayHistory(history.currentTime, history.duration)) {
    return null
  }

  const progressPercent = Math.max(0, Math.min(100, (history.currentTime / history.duration) * 100))
  if (progressPercent <= 0) {
    return null
  }

  return {
    progressSec: history.currentTime,
    progressPercent,
  }
}

function buildPlayHistoryIdentity(params: { pickCode: string, fileName: string }) {
  return `${params.pickCode}::${params.fileName}`
}

async function persistPlayHistory(params: {
  pickCode: string
  fileName: string
  currentTime: number
  duration: number
  quality: string
}) {
  await sendTypedRuntimeMessageSafe({
    type: 'SET_NATIVE_HISTORY',
    data: {
      pickCode: params.pickCode,
      shareId: '0',
      currentTime: Math.max(0, params.currentTime),
      definition: 0,
    },
  })
}

export function savePlayHistory(params: {
  pickCode: string
  fileName: string
  currentTime: number
  duration: number
  quality: string
  immediate?: boolean
}) {
  if (!NATIVE_PLAY_HISTORY_ENABLED || !params.pickCode || !params.fileName) return
  if (!Number.isFinite(params.currentTime) || params.currentTime <= 0) return

  const identity = buildPlayHistoryIdentity(params)
  const current = pendingPlayHistoryWrites.get(identity)
  if (current?.timer) {
    window.clearTimeout(current.timer)
  }

  if (params.immediate) {
    pendingPlayHistoryWrites.delete(identity)
    void persistPlayHistory(params).then(() => {
      lastPlayHistoryWriteAt.set(identity, Date.now())
    }).catch(() => {
      // ignore save errors
    })
    return
  }

  const next: PendingPlayHistoryWrite = {
    params,
    timer: window.setTimeout(async () => {
      const latest = pendingPlayHistoryWrites.get(identity)
      if (!latest) return

      const now = Date.now()
      const lastAt = lastPlayHistoryWriteAt.get(identity) ?? 0
      const elapsed = now - lastAt
      if (elapsed < PLAY_HISTORY_MIN_WRITE_INTERVAL_MS) {
        latest.timer = window.setTimeout(async () => {
          try {
            await persistPlayHistory(latest.params)
            lastPlayHistoryWriteAt.set(identity, Date.now())
          }
          catch {
            // ignore save errors
          }
          finally {
            pendingPlayHistoryWrites.delete(identity)
          }
        }, PLAY_HISTORY_MIN_WRITE_INTERVAL_MS - elapsed)
        pendingPlayHistoryWrites.set(identity, latest)
        return
      }

      try {
        await persistPlayHistory(latest.params)
        lastPlayHistoryWriteAt.set(identity, Date.now())
      }
      catch {
        // ignore save errors
      }
      finally {
        pendingPlayHistoryWrites.delete(identity)
      }
    }, PLAY_HISTORY_WRITE_DEBOUNCE_MS),
  }

  pendingPlayHistoryWrites.set(identity, next)
}

export function resetPlayHistory(params: {
  pickCode: string
  fileName: string
  duration: number
  quality: string
}) {
  if (!NATIVE_PLAY_HISTORY_ENABLED || !params.pickCode || !params.fileName) return

  const identity = buildPlayHistoryIdentity(params)
  const pending = pendingPlayHistoryWrites.get(identity)
  if (pending?.timer) {
    window.clearTimeout(pending.timer)
  }
  pendingPlayHistoryWrites.delete(identity)

  void sendTypedRuntimeMessageSafe({
    type: 'SET_NATIVE_HISTORY',
    data: {
      pickCode: params.pickCode,
      shareId: '0',
      currentTime: 0,
      definition: 0,
    },
  }).catch(() => {
    // ignore reset errors
  })
}
