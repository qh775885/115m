// 页面已被 video-page-early.js（public/）在 document_start 阶段同步接管
// 这里不再重复 document.write，避免二次覆盖导致的竞态问题

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

async function init() {
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { void init() })
}
else {
  void init()
}
