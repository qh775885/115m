/**
 * 播放器页面画面点击播放/暂停拦截
 * 必须在 content script 自身同步执行（document.write 重建文档后立即绑定，
 * 早于页面其他脚本，捕获层第一个注册者不会被 stopImmediatePropagation 阻止）。
 * 与入口文件分离，保持入口轻薄。
 */
export function bindVideoPlayPause() {
  const playPauseExcludeSelector = '.art-controls, .art-controls-left, .art-controls-right, .art-controls-center, .art-progress, .art-control-progress, .art-header, .art-settings, .art-info, .art-contextmenus, .art-control, .art-selector, .art-selector-item, .art-volume-panel, .m115-interactive, .m115-playlist-sidebar, .move-dialog-mask, .move-dialog-box'
  const isWithinVideoRect = (video: HTMLVideoElement, x: number, y: number) => {
    const rect = video.getBoundingClientRect()
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
  }
  // pointerdown 抢先 toggle 后，需吞掉本次手势后续的 click：
  // pointerdown 的 preventDefault 不会阻止 click 触发，而 Artplayer clickInit
  // 会在 $video 的 click 上再 art.toggle() 一次，两次 toggle 相互抵消，
  // 表现为"点好几下没反应、偶尔点一下才有用"
  let suppressFollowClickUntil = 0
  window.addEventListener('pointerdown', (event) => {
    const video = document.querySelector('.art-video') as HTMLVideoElement | null
    if (!video || event.button !== 0) return
    // 右键菜单显示时点击只用于关闭菜单（交由 Artplayer 的 click 处理），不 toggle
    if (document.querySelector('.art-video-player')?.classList.contains('art-contextmenu-show')) return
    const target = event.target
    if (!(target instanceof Element)) return
    // 排除播放器控件容器与扩展交互 UI。
    // 注意：不能排除 .art-bottom（它覆盖整个画面，暂停时 pointer-events 为 auto，排除会导致画面点击失效），
    // 只需排除其内部的进度条/控制栏等控件区域。
    if (target.closest(playPauseExcludeSelector)) return
    // 点击位置必须落在视频画面可视区域内
    if (!isWithinVideoRect(video, event.clientX, event.clientY)) return
    event.preventDefault()
    event.stopImmediatePropagation()
    if (video.paused) {
      void video.play().catch(() => {})
    }
    else {
      video.pause()
    }
    suppressFollowClickUntil = Date.now() + 600
  }, true)

  window.addEventListener('click', (event) => {
    if (Date.now() > suppressFollowClickUntil) return
    const video = document.querySelector('.art-video') as HTMLVideoElement | null
    if (!video) return
    const target = event.target
    // 交互控件不是上面 pointerdown 的处理对象，对应的 click 不能吞
    if (target instanceof Element && target.closest(playPauseExcludeSelector)) return
    if (!isWithinVideoRect(video, event.clientX, event.clientY)) return
    event.preventDefault()
    event.stopImmediatePropagation()
  }, true)
}
