/**
 * Overlay 可见性决策纯函数：与 DOM 状态机解耦，便于单元测试。
 */

/** 计算播放列表侧边栏宽度（窄屏适配移动端） */
export function getPlaylistSidebarWidth(viewportWidth: number): number {
  if (viewportWidth <= 640) {
    return Math.min(320, Math.max(240, viewportWidth - 32))
  }
  return Math.min(360, Math.max(260, Math.round(viewportWidth * 0.32)))
}

export interface OverlayVisibilityContext {
  isPointerInsideOverlay: boolean
  isPointerOnProgress: boolean
  playlistOpen: boolean
}

/** 判断鼠标离开后是否需要隐藏 overlay */
export function shouldHideOverlayOnLeave(ctx: OverlayVisibilityContext): boolean {
  return !ctx.playlistOpen && !ctx.isPointerInsideOverlay && !ctx.isPointerOnProgress
}

/** 判断定时隐藏到期后是否真正隐藏（考虑指针/进度/播放列表状态） */
export function shouldHideOverlayOnTimer(ctx: OverlayVisibilityContext): boolean {
  return shouldHideOverlayOnLeave(ctx)
}
