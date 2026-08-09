import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AudioManager } from './audio-manager'
import { loadAudioTrackPreference, saveAudioTrackPreference } from './history'

function createHlsMock(tracks: Array<{ name?: string, lang?: string }>, currentTrack = -1) {
  const hls: any = {
    audioTracks: tracks,
    audioTrack: currentTrack,
    setAudioOption: vi.fn(),
  }
  return hls
}

function createDeps(overrides: Partial<Parameters<AudioManager['attach']>[0]> = {}) {
  const hls = createHlsMock([
    { name: 'stereo', lang: 'chi' },
    { name: 'stereo', lang: 'eng' },
  ], 0)
  const art: any = {
    currentTime: 42,
    video: { paused: false },
  }
  const onRebuildHls = vi.fn().mockResolvedValue(undefined)
  const onRenderRequest = vi.fn()

  const deps = {
    art,
    getHlsInstance: () => hls,
    getCurrentPickCode: () => 'pick-a',
    getCurrentHlsLogicalUrl: () => 'https://example.com/master.m3u8',
    onRebuildHls,
    onShowToast: vi.fn(),
    onRenderRequest,
    ...overrides,
  }
  return { hls, art, onRebuildHls, onRenderRequest, deps }
}

function stubLocalStorage() {
  const store = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value) },
      removeItem: (key: string) => { store.delete(key) },
    },
  })
  return store
}

beforeEach(() => {
  stubLocalStorage()
})

describe('AudioManager 音轨切换', () => {
  it('applyTrack 记录 pending 音轨并触发重建', () => {
    const { deps, onRebuildHls } = createDeps()
    const mgr = new AudioManager()
    mgr.attach(deps as any)
    mgr.syncFromHls()

    mgr.applyTrack(1)

    expect(onRebuildHls).toHaveBeenCalledTimes(1)
    expect(onRebuildHls).toHaveBeenCalledWith(expect.objectContaining({
      id: 1,
      currentTime: 42,
      shouldResume: true,
    }))
  })

  it('syncFromHls 在重建后消费 pending 并应用目标音轨', () => {
    const { hls, deps, onRenderRequest } = createDeps()
    const mgr = new AudioManager()
    mgr.attach(deps as any)
    mgr.syncFromHls()

    // 模拟用户选择第 2 条音轨（eng）
    mgr.applyTrack(1)
    // 模拟 HLS 重建完成后的事件驱动 syncFromHls
    hls.audioTracks = [
      { name: 'stereo', lang: 'chi' },
      { name: 'stereo', lang: 'eng' },
    ]
    hls.audioTrack = -1
    mgr.syncFromHls()

    expect(hls.audioTrack).toBe(1)
    expect(hls.setAudioOption).toHaveBeenCalled()
    expect(mgr.currentTrackId).toBe(1)
    expect(onRenderRequest).toHaveBeenCalled()
  })

  it('syncFromHls 保留首次挂载时已应用的音轨（不重复切换）', () => {
    const { hls, deps } = createDeps()
    const mgr = new AudioManager()
    mgr.attach(deps as any)
    mgr.syncFromHls()

    // 首次挂载，默认音轨 0，不应触发切换
    expect(hls.setAudioOption).not.toHaveBeenCalled()
    expect(hls.audioTrack).toBe(0)
  })

  it('pending 音轨在切换视频后被清除', () => {
    const { deps, onRebuildHls } = createDeps()
    const mgr = new AudioManager()
    mgr.attach(deps as any)
    mgr.syncFromHls()
    mgr.applyTrack(1)
    expect(onRebuildHls).toHaveBeenCalledTimes(1)

    mgr.resetPreferenceFlag()
    const { hls } = createDeps()
    hls.audioTracks = [
      { name: 'stereo', lang: 'chi' },
      { name: 'stereo', lang: 'eng' },
    ]
    hls.audioTrack = 0
    mgr.syncFromHls()
    // pending 已清除，保持 hls 默认音轨
    expect(hls.audioTrack).toBe(0)
    expect(hls.setAudioOption).not.toHaveBeenCalled()
  })

  it('applyTrack 保存音轨偏好到 localStorage', () => {
    const { deps } = createDeps()
    const mgr = new AudioManager()
    mgr.attach(deps as any)
    mgr.syncFromHls()

    mgr.applyTrack(1)

    const pref = loadAudioTrackPreference('pick-a')
    expect(pref?.id).toBe(1)
  })

  it('手动切换音轨后 restorePreference 不会覆盖用户选择', () => {
    saveAudioTrackPreference('pick-a', { id: 0, label: '中文1' })
    const { hls, deps } = createDeps()
    const mgr = new AudioManager()
    mgr.attach(deps as any)
    mgr.syncFromHls()

    // 用户手动切到第 2 条
    mgr.applyTrack(1)
    mgr.syncFromHls()
    expect(hls.audioTrack).toBe(1)
  })
})
