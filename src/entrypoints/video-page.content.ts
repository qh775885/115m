export default defineContentScript({
  matches: [
    '*://115.com/web/lixian/master/video/*',
    '*://*.115.com/web/lixian/master/video/*'
  ],
  runAt: 'document_start',
  allFrames: true,
  matchAboutBlank: true,
  cssInjectionMode: "ui",
  async main(ctx) {
    // 页面接管必须在 content script 自身中同步完成
    // 不能依赖外部动态注册的 early script（时序不可控，manifest 声明的 CS 先于动态注册的 CS 执行）
    if (
      window.top === window &&
      /\/web\/lixian\/master\/video\//.test(window.location.pathname) &&
      !window.location.search.includes('m115_transcode_fallback=1')
    ) {
      ;(window as any).__115m_early_injected = true
      document.open()
      document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>115m</title><style>html,body{margin:0;padding:0;width:100%;height:100%;background:#000}#m115-app{display:flex;flex-direction:column;height:100vh;color:#fff;font-family:sans-serif}#main-layout{display:flex;width:100%;height:100%;overflow:hidden;flex:1;min-height:0;min-width:0}#artplayer-app{flex:1 1 auto;min-width:0;height:100%;transition:flex .25s ease;display:flex;align-items:center;justify-content:center}#playlist-sidebar{width:0;min-width:0;flex:0 0 0;overflow:hidden;transition:width .25s ease,flex-basis .25s ease;background:#0a0a0a;border-left:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;box-sizing:border-box;height:100%}#loading{position:fixed;inset:0;z-index:40;background:#000;display:flex;align-items:center;justify-content:center}#loading-text{color:rgba(255,255,255,.7);font-size:14px}</style></head><body><div id="m115-app"><div id="main-layout"><div id="artplayer-app"></div><aside id="playlist-sidebar"></aside></div><div id="loading"><p id="loading-text">正在初始化...</p></div><div id="error-overlay" style="display:none"></div></div></body></html>')
      document.close()
    }

    // document.write 之后，当前 content script 的执行上下文仍然有效
    // 立即绑定画面点击播放/暂停：此时文档刚重建、无任何其他脚本，
    // 本监听是 window 捕获层第一个注册者，页面后续脚本即使 stopImmediatePropagation 也无法阻止
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

    // 异步加载播放器模块
    await import('../content/video-page.ts')
  },
});
