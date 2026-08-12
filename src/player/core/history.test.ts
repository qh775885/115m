// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { buildPlaylistProgressSnapshot, isCompletedPlayback, loadAudioTrackPreference, loadPlayHistoryWhenReady, resetPlayHistory, saveAudioTrackPreference, savePlayHistory, saveSubtitlePreference, saveVideoRotation, loadSubtitlePreference, loadVideoRotation, shouldRestorePlayHistory } from './history'

describe('play history restore guard', () => {
  it('skips restoring progress near the end of playback', () => {
    expect(shouldRestorePlayHistory(118, 120)).toBe(false)
    expect(shouldRestorePlayHistory(99, 100)).toBe(false)
  })

  it('restores progress when enough playback remains', () => {
    expect(shouldRestorePlayHistory(45, 120)).toBe(true)
    expect(shouldRestorePlayHistory(12)).toBe(true)
  })

  it('treats finished playback as completed state', () => {
    expect(isCompletedPlayback(176, 180)).toBe(true)
    expect(isCompletedPlayback(150, 180)).toBe(false)
  })

  it('does not restore empty progress', () => {
    expect(shouldRestorePlayHistory(0, 120)).toBe(false)
  })

  it('builds playlist progress only for resumable history', () => {
    expect(buildPlaylistProgressSnapshot({ currentTime: 45, duration: 120 })).toEqual({
      progressSec: 45,
      progressPercent: 37.5,
    })
    expect(buildPlaylistProgressSnapshot({ currentTime: 118, duration: 120 })).toBeNull()
    expect(buildPlaylistProgressSnapshot({ currentTime: 0, duration: 120 })).toBeNull()
  })
})

describe('native play history write', () => {
  it('writes immediate progress to 115 native history', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ success: true })
    vi.stubGlobal('chrome', { runtime: { sendMessage } })

    savePlayHistory({
      pickCode: 'pick-a',
      fileName: 'pick-a',
      currentTime: 60.8,
      duration: 120,
      quality: '115原画',
      immediate: true,
    })
    await Promise.resolve()
    await Promise.resolve()

    expect(sendMessage).toHaveBeenCalledWith({
      type: 'SET_NATIVE_HISTORY',
      data: {
        pickCode: 'pick-a',
        shareId: '0',
        currentTime: 60.8,
        definition: 0,
      },
    })

    vi.unstubAllGlobals()
  })

  it('persists progress periodically during continuous playback', async () => {
    vi.useFakeTimers()
    const sendMessage = vi.fn().mockResolvedValue({ success: true })
    vi.stubGlobal('chrome', { runtime: { sendMessage } })

    try {
      const base = {
        pickCode: 'pick-throttle',
        fileName: 'pick-throttle',
        duration: 120,
        quality: '115原画',
      }

      savePlayHistory({ ...base, currentTime: 10 })
      await vi.advanceTimersByTimeAsync(0)
      expect(sendMessage).toHaveBeenCalledTimes(1)

      savePlayHistory({ ...base, currentTime: 12 })
      savePlayHistory({ ...base, currentTime: 14 })
      savePlayHistory({ ...base, currentTime: 16 })
      await vi.advanceTimersByTimeAsync(5000)
      expect(sendMessage).toHaveBeenCalledTimes(1)

      await vi.advanceTimersByTimeAsync(10000)
      expect(sendMessage).toHaveBeenCalledTimes(2)
      expect(sendMessage).toHaveBeenLastCalledWith({
        type: 'SET_NATIVE_HISTORY',
        data: {
          pickCode: 'pick-throttle',
          shareId: '0',
          currentTime: 16,
          definition: 0,
        },
      })

      savePlayHistory({ ...base, currentTime: 30 })
      savePlayHistory({ ...base, currentTime: 32 })
      await vi.advanceTimersByTimeAsync(15000)
      expect(sendMessage).toHaveBeenCalledTimes(3)
      expect(sendMessage).toHaveBeenLastCalledWith({
        type: 'SET_NATIVE_HISTORY',
        data: {
          pickCode: 'pick-throttle',
          shareId: '0',
          currentTime: 32,
          definition: 0,
        },
      })
    }
    finally {
      vi.useRealTimers()
      vi.unstubAllGlobals()
    }
  })

  it('resets progress through 115 native history', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ success: true })
    vi.stubGlobal('chrome', { runtime: { sendMessage } })

    resetPlayHistory({
      pickCode: 'pick-a',
      fileName: 'pick-a',
      duration: 120,
      quality: '115原画',
    })
    await Promise.resolve()
    await Promise.resolve()

    expect(sendMessage).toHaveBeenCalledWith({
      type: 'SET_NATIVE_HISTORY',
      data: {
        pickCode: 'pick-a',
        shareId: '0',
        currentTime: 0,
        definition: 0,
      },
    })

    vi.unstubAllGlobals()
  })
})

describe('video rotation storage', () => {
  it('persists per-video rotation in localStorage', () => {
    const store = new Map<string, string>()
    const localStorageMock = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
    }

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: localStorageMock,
    })

    expect(loadVideoRotation('pick-a')).toBe(0)
    saveVideoRotation('pick-a', 90)
    saveVideoRotation('pick-b', 180)

    expect(loadVideoRotation('pick-a')).toBe(90)
    expect(loadVideoRotation('pick-b')).toBe(180)
    expect(loadVideoRotation('pick-c')).toBe(0)
  })
})

describe('subtitle and audio preference storage', () => {
  it('persists per-video subtitle preference including disabled state', () => {
    const store = new Map<string, string>()
    const localStorageMock = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
    }

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: localStorageMock,
    })

    saveSubtitlePreference('pick-a', { sid: 'sid-a', title: '简体中文', type: 'srt', language: 'zh' })
    saveSubtitlePreference('pick-b', { sid: '', title: '', type: '', disabled: true })

    expect(loadSubtitlePreference('pick-a')).toEqual({ sid: 'sid-a', title: '简体中文', type: 'srt', language: 'zh' })
    expect(loadSubtitlePreference('pick-b')).toEqual({ sid: '', title: '', type: '', disabled: true })
    expect(loadSubtitlePreference('pick-c')).toBeNull()
  })

  it('persists per-video audio track preference', () => {
    const store = new Map<string, string>()
    const localStorageMock = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
    }

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: localStorageMock,
    })

    saveAudioTrackPreference('pick-a', { id: 1, label: 'English（eng）' })

    expect(loadAudioTrackPreference('pick-a')).toEqual({ id: 1, label: 'English（eng）' })
    expect(loadAudioTrackPreference('pick-b')).toBeNull()
  })

  it('restores progress after media metadata is ready', async () => {
    const listeners = new Map<string, () => void>()
    const target = {
      readyState: 0,
      currentTime: 0,
      addEventListener: vi.fn((type: 'loadedmetadata' | 'canplay', listener: () => void) => {
        listeners.set(type, listener)
      }),
      removeEventListener: vi.fn(),
    }
    vi.stubGlobal('chrome', { runtime: { sendMessage: vi.fn().mockResolvedValue({ currentTime: 45, duration: 120 }) } })
    vi.stubGlobal('HTMLMediaElement', { HAVE_METADATA: 1 })

    await loadPlayHistoryWhenReady('pick-a', () => target)
    expect(target.currentTime).toBe(0)

    listeners.get('loadedmetadata')?.()
    expect(target.currentTime).toBe(45)

    vi.unstubAllGlobals()
  })
})
