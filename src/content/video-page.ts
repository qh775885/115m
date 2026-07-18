// 页面已被 video-page.content.ts 在 document_start 阶段同步接管（document.write）
// 这里只负责加载播放器模块和启动初始化

import '../player/player'

function clearNativeVideoRequests() {
  try {
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    entries
      .filter(e => /proapi\.115\.com\/app\/chrome\/downurl/.test(e.name))
      .forEach(e => performance.clearResourceTimings())
  }
  catch {
    // ignore
  }
}

function init() {
  if (window.top !== window) return
  if (!/\/web\/lixian\/master\/video\//.test(window.location.pathname)) return
  if (window.location.search.includes('m115_transcode_fallback=1')) return

  clearNativeVideoRequests()

  const params = new URLSearchParams(window.location.search)
  const pickCode = params.get('pickCode') || params.get('pick_code') || ''
  if (!pickCode) return
  if (!params.get('pickCode')) {
    params.set('pickCode', pickCode)
  }

  window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)

  // 确保 initPlayer 被调用（防止 player.ts 底部的条件检查失败）
  if (typeof window.__115m_initPlayer === 'function') {
    window.__115m_initPlayer()
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { init() })
}
else {
  init()
}
