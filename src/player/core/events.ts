import type Artplayer from 'artplayer'
import { resetPlayHistory, savePlayHistory } from './history'
import { bindKeyboardShortcuts } from './keyboard'
import { INTERACTIVE_SELECTOR } from './ui-layer'

export interface BindPlayerEventsOptions {
  art: Artplayer
  getType: () => 'native' | 'hls'
  getPickCode: () => string
  getQualityLabel: () => string
  onPerf: (stage: string, extra?: Record<string, unknown>) => void
  onLoadedmetadata: () => void
  onCanplay: () => void
  onPlaying: () => void
  onVolumeChange?: () => void
  onEnded: () => void
  onReady: () => void
  onError: () => void
}

export function bindPlayerEvents(options: BindPlayerEventsOptions): () => void {
  const {
    art,
    getType,
    getPickCode,
    getQualityLabel,
    onPerf,
    onLoadedmetadata,
    onCanplay,
    onPlaying,
    onVolumeChange,
    onEnded,
    onReady,
    onError,
  } = options
  const root = art.template.$player as HTMLDivElement

  /** 点击目标是否位于播放器容器内 */
  const isInsidePlayer = (target: EventTarget | null): boolean =>
    target instanceof Element && root.contains(target)

  art.on('ready', () => {
    onPerf('art-ready', { type: getType() })
    onReady()
  })

  const saveCurrentPlayHistory = (immediate = false) => {
    savePlayHistory({
      pickCode: getPickCode(),
      fileName: getPickCode(),
      currentTime: art.currentTime || 0,
      duration: art.duration || 0,
      quality: getQualityLabel(),
      immediate,
    })
  }

  art.on('video:timeupdate', () => {
    saveCurrentPlayHistory()
  })

  art.on('video:seeked', () => {
    saveCurrentPlayHistory(true)
  })

  art.on('video:pause', () => {
    saveCurrentPlayHistory(true)
  })

  art.on('video:loadedmetadata', () => {
    onPerf('video-loadedmetadata', { type: getType() })
    onLoadedmetadata()
  })

  art.on('video:canplay', () => {
    onPerf('video-canplay', { type: getType() })
    onCanplay()
  })

  art.on('video:playing', () => {
    onPerf('video-playing', { type: getType() })
    onPlaying()
  })

  art.on('video:volumechange', () => {
    onVolumeChange?.()
  })

  art.on('video:ended', () => {
    resetPlayHistory({
      pickCode: getPickCode(),
      fileName: getPickCode(),
      duration: art.duration || 0,
      quality: getQualityLabel(),
    })
    onPerf('video-ended', { type: getType() })
    onEnded()
  })

  art.on('error', onError)



  /**
   * 判断点击目标是否属于真正的交互元素（按钮、滑块、链接等）。
   * 注意：只检查具体的交互元素，不检查 $controls/$bottom/$progress 容器本身，
   * 因为这些容器有大片空白区域，点击空白处应该触发播放/暂停。
   */
  const isInteractiveTarget = (target: EventTarget | null): boolean => {
    if (!target || !(target instanceof Element)) return false
    // 按钮、输入框、链接、滑块等具体交互元素
    if (target.closest('button, a, input, [role="button"]')) return true
    // ArtPlayer 设置面板（播放速度、画面比例、画面旋转等）
    if (target.closest('.art-settings, .art-setting, .art-setting-item, .art-setting-inner, .art-setting-body, .art-setting-radio, .art-radio-item, .art-setting-range, .art-setting-checkbox')) return true
    // ArtPlayer 画质/字幕选择面板（两种类名都兼容）
    if (target.closest('.art-control-selector, .art-selector, .art-selector-item, .art-qualitys, .art-quality-item')) return true
    // ArtPlayer 通知提示、信息面板
    if (target.closest('.art-notice, .art-info, .art-info-item, .art-info-close')) return true
    // ArtPlayer 音量面板和滑块
    if (target.closest('.art-volume-panel, .art-volume-slider, .art-volume-handle, .art-volume-indicator')) return true
    // ArtPlayer 右键菜单
    if (target.closest('.art-contextmenus, .art-contextmenu')) return true
    // SVG 图标（音量、全屏、设置等）的父元素是控件容器
    if (target instanceof SVGElement) {
      // SVG 图标本身是可点击的控件
      const parent = target.parentElement
      if (parent && parent.closest('.art-controls-left, .art-controls-right, .art-controls-center')) return true
    }
    // 进度条区域（滑块拖拽区域）→ 交互控件
    const progress = art.template.$progress as HTMLElement
    if (progress?.contains(target)) return true
    // 播放列表面板及自定义覆盖层元素
    if (target.closest(INTERACTIVE_SELECTOR)) return true
    return false
  }

  /**
   * 画面点击播放/暂停已由入口 content script（document.write 后最先注册的 window 捕获监听）处理，
   * 此处只保留双击拦截与右键菜单逻辑。
   */
  const handleRootDoubleClick = (event: MouseEvent) => {
    const target = event.target
    if (!isInsidePlayer(target)) return
    if (isInteractiveTarget(target)) return
    event.stopImmediatePropagation()
  }

  // Toggle contextmenu: first right-click → ArtPlayer menu, second → browser menu
  const handleContextmenu = (event: MouseEvent) => {
    if (!isInsidePlayer(event.target)) return
    if (art.contextmenu.show) {
      // ArtPlayer menu is visible → close it and let browser default through
      art.contextmenu.show = false
    } else {
      // ArtPlayer menu is hidden → block browser menu, ArtPlayer will handle it
      return
    }
    // Stop ArtPlayer's own handler from re-opening the menu
    event.stopImmediatePropagation()
  }

  window.addEventListener('contextmenu', handleContextmenu, true)
  window.addEventListener('dblclick', handleRootDoubleClick, true)

  const cleanupKeyboard = bindKeyboardShortcuts(art)

  return () => {
    window.removeEventListener('contextmenu', handleContextmenu, true)
    window.removeEventListener('dblclick', handleRootDoubleClick, true)
    cleanupKeyboard()
  }
}
