import { bindVideoPlayPause } from '../content/core/video-play-pause-binder'

export default defineContentScript({
  matches: [
    '*://115.com/web/lixian/master/video/*',
    '*://*.115.com/web/lixian/master/video/*'
  ],
  runAt: 'document_start',
  allFrames: true,
  matchAboutBlank: true,
  cssInjectionMode: 'ui',
  async main(_ctx) {
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

    bindVideoPlayPause()

    // 开启后台通信 Bridge：接收来自主世界的特权请求并转发给 chrome.runtime
    window.addEventListener('message', async (event) => {
      if (
        !event.data ||
        typeof event.data !== 'object' ||
        event.data.channel !== '115M_BRIDGE_REQ'
      ) {
        return
      }

      const { id, payload } = event.data
      console.log(`[115m-v2][Bridge-Server] 收到转发请求 #${id}:`, payload)
      try {
        const result = await chrome.runtime.sendMessage(payload)
        console.log(`[115m-v2][Bridge-Server] 后台成功返回 #${id}:`, result)
        window.postMessage({ channel: '115M_BRIDGE_RESP', id, result }, '*')
      }
      catch (error: any) {
        console.warn(`[115m-v2][Bridge-Server] 后台返回异常 #${id}:`, error)
        window.postMessage({ channel: '115M_BRIDGE_RESP', id, error: error?.message || String(error) }, '*')
      }
    })

    // 主动注入主世界脚本与样式，确保 document.write 之后主世界代码绝对可靠执行
    try {
      const script = document.createElement('script')
      script.src = chrome.runtime.getURL('content-scripts/video-page-main.js')
      script.async = false
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = chrome.runtime.getURL('content-scripts/video-page-main.css')
      const targetHead = document.head || document.documentElement
      targetHead.appendChild(link)
      targetHead.appendChild(script)
      console.log('[115m-v2][Sandbox] 已向页面主世界注入播放器脚本')
    }
    catch (err) {
      console.error('[115m-v2][Sandbox] 注入主世界播放器脚本失败:', err)
    }
  },
})
