export default defineContentScript({
  matches: [
    '*://115.com/web/lixian/master/video/*',
    '*://*.115.com/web/lixian/master/video/*'
  ],
  runAt: 'document_start',
  allFrames: true,
  matchAboutBlank: true,
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
    // 异步加载播放器模块
    await import('../content/video-page.ts')
  },
});
