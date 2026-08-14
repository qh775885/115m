import { describe, expect, it } from 'vitest'
import { getPlaylistSidebarWidth, shouldHideOverlayOnLeave, shouldHideOverlayOnTimer } from './overlay-visibility'

describe('getPlaylistSidebarWidth', () => {
  it('窄屏移动端：限制在 240-320 之间', () => {
    expect(getPlaylistSidebarWidth(360)).toBe(320)
    expect(getPlaylistSidebarWidth(640)).toBe(320)
    expect(getPlaylistSidebarWidth(272)).toBe(240)
  })

  it('宽屏：按 32% 计算限制在 260-360', () => {
    expect(getPlaylistSidebarWidth(1280)).toBe(360)
    expect(getPlaylistSidebarWidth(900)).toBe(288)
    expect(getPlaylistSidebarWidth(800)).toBe(260)
  })
})

describe('shouldHideOverlayOnLeave / onTimer', () => {
  it('指针离开且无任何保持条件时隐藏', () => {
    expect(shouldHideOverlayOnLeave({ isPointerInsideOverlay: false, isPointerOnProgress: false, playlistOpen: false })).toBe(true)
  })

  it('播放列表打开时保持可见', () => {
    expect(shouldHideOverlayOnLeave({ isPointerInsideOverlay: false, isPointerOnProgress: false, playlistOpen: true })).toBe(false)
  })

  it('指针在 overlay 或进度条上时保持可见', () => {
    expect(shouldHideOverlayOnLeave({ isPointerInsideOverlay: true, isPointerOnProgress: false, playlistOpen: false })).toBe(false)
    expect(shouldHideOverlayOnLeave({ isPointerInsideOverlay: false, isPointerOnProgress: true, playlistOpen: false })).toBe(false)
  })

  it('定时隐藏与离开判断语义一致', () => {
    expect(shouldHideOverlayOnTimer({ isPointerInsideOverlay: false, isPointerOnProgress: false, playlistOpen: false })).toBe(true)
    expect(shouldHideOverlayOnTimer({ isPointerInsideOverlay: false, isPointerOnProgress: false, playlistOpen: true })).toBe(false)
  })
})
