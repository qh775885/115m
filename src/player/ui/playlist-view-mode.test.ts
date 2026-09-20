// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getPlaylistViewMode,
  setPlaylistViewMode,
  togglePlaylistViewMode,
  onPlaylistViewModeChange,
  renderPlaylistViewModeToggleBtn,
  renderPlaylistViewModeSwitch,
  PLAYLIST_VIEW_MODE_STORAGE_KEY,
} from './playlist-view-mode'

describe('playlist-view-mode', () => {
  let store: Record<string, string> = {}

  beforeEach(() => {
    store = {}
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = String(v) },
      removeItem: (k: string) => { delete store[k] },
      clear: () => { store = {} },
    })
  })

  it('默认模式为 card', () => {
    expect(getPlaylistViewMode()).toBe('card')
  })

  it('正确保存与切换视图模式', () => {
    setPlaylistViewMode('compact')
    expect(getPlaylistViewMode()).toBe('compact')
    expect(store[PLAYLIST_VIEW_MODE_STORAGE_KEY]).toBe('compact')

    const next = togglePlaylistViewMode()
    expect(next).toBe('card')
    expect(getPlaylistViewMode()).toBe('card')
  })

  it('模式切换触发订阅监听', () => {
    const cb = vi.fn()
    const unsubscribe = onPlaylistViewModeChange(cb)

    togglePlaylistViewMode()
    expect(cb).toHaveBeenCalledWith('compact')

    unsubscribe()
    togglePlaylistViewMode()
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('正确渲染按钮并附加相应属性', () => {
    const btnHtml = renderPlaylistViewModeToggleBtn('card')
    expect(btnHtml).toContain('m115-playlist-view-toggle')
    expect(btnHtml).toContain('active')
    expect(btnHtml).toContain('切换为紧凑列表')

    const compactBtnHtml = renderPlaylistViewModeToggleBtn('compact')
    expect(compactBtnHtml).not.toContain(' active')
    expect(compactBtnHtml).toContain('切换为图文列表')
  })

  it('正确渲染微型扁条 Switch 开关 HTML', () => {
    const cardSwitchHtml = renderPlaylistViewModeSwitch('card')
    expect(cardSwitchHtml).toContain('m115-pl-switch-toggle')
    expect(cardSwitchHtml).toContain('is-checked')
    expect(cardSwitchHtml).toContain('aria-checked="true"')
    expect(cardSwitchHtml).toContain('播放列表预览图开关')

    const compactSwitchHtml = renderPlaylistViewModeSwitch('compact')
    expect(compactSwitchHtml).toContain('m115-pl-switch-toggle')
    expect(compactSwitchHtml).not.toContain('is-checked')
    expect(compactSwitchHtml).toContain('aria-checked="false"')
  })
})
