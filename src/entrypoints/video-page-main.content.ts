import { igniteV2Player } from '../player/v2/ignition'

export default defineContentScript({
  matches: [
    '*://115.com/web/lixian/master/video/*',
    '*://*.115.com/web/lixian/master/video/*'
  ],
  world: 'MAIN',
  runAt: 'document_end',
  allFrames: true,
  matchAboutBlank: true,
  async main() {
    if (window.top !== window) return
    if (!/\/web\/lixian\/master\/video\//.test(window.location.pathname)) return
    if (window.location.search.includes('m115_transcode_fallback=1')) return
    if ((window as any).__115m_v2_main_started) return
    ;(window as any).__115m_v2_main_started = true

    console.log('[115m-v2][MainWorld] 点火主世界就绪，原生 customElements 状态:', !!window.customElements)
    await igniteV2Player()
  },
})
