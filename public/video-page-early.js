// 极轻量页面早期接管 - 同步执行，不经过 Vite 打包
// 在 115 原生行内脚本执行之前覆盖页面，阻止 "undefined action!" 渲染
if(window.top===window&&/\/web\/lixian\/master\/video\//.test(window.location.pathname)&&!window.location.search.includes('m115_transcode_fallback=1')){
  console.log('[115m] video-page-early.js executing');
  document.open();
  document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>115m</title><style>html,body{margin:0;padding:0;width:100%;height:100%;background:#000}#m115-app{display:flex;flex-direction:column;height:100vh;color:#fff;font-family:sans-serif}#main-layout{display:flex;width:100%;height:100%;overflow:hidden;flex:1;min-height:0;min-width:0}#artplayer-app{flex:1 1 auto;min-width:0;height:100%;transition:flex .25s ease;display:flex;align-items:center;justify-content:center}#playlist-sidebar{width:0;min-width:0;flex:0 0 0;overflow:hidden;transition:width .25s ease,flex-basis .25s ease;background:#0a0a0a;border-left:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;box-sizing:border-box;height:100%}#loading{position:fixed;inset:0;z-index:40;background:#000;display:flex;align-items:center;justify-content:center}#loading-text{color:rgba(255,255,255,.7);font-size:14px}</style></head><body><div id="m115-app"><div id="main-layout"><div id="artplayer-app"></div><aside id="playlist-sidebar"></aside></div><div id="loading"><p id="loading-text">正在初始化...</p></div><div id="error-overlay" style="display:none"></div></div></body></html>');
  document.close();

  // 动态加载 content script
  // 使用 fetch 获取 manifest，找到正确的资源路径
  (async function() {
    try {
      // 获取 web_accessible_resources 中的文件列表
      // 直接尝试加载已知的模块文件
      const baseUrl = chrome.runtime.getURL('');

      // 尝试加载 video-page 模块（文件名可能带 hash）
      // 先获取 .vite/manifest.json 来找到正确的文件名
      const viteManifestUrl = baseUrl + '.vite/manifest.json';
      const viteManifest = await fetch(viteManifestUrl).then(r => r.json());

      // 找到 video-page.ts 的入口
      const entry = Object.keys(viteManifest).find(k => k.includes('video-page.ts'));
      if (!entry) {
        throw new Error('video-page.ts not found in manifest');
      }

      const moduleFile = viteManifest[entry].file;
      const moduleUrl = baseUrl + moduleFile;

      console.log('[115m] Loading video-page module:', moduleUrl);
      await import(moduleUrl);
      console.log('[115m] video-page module loaded');

    } catch (e) {
      console.error('[115m] Failed to load video-page:', e);
      const loadingText = document.getElementById('loading-text');
      if (loadingText) {
        loadingText.textContent = '加载失败: ' + e.message;
      }
    }
  })();
}
