import './lit-shield'
import 'vidstack/player'
import 'vidstack/player/ui'
import Hls from 'hls.js'
import { preparePlaybackSource } from './stream-builder'
import { mountAuroraShell } from './ui/shell'

let currentBlobUrl: string | null = null

export async function igniteV2Player() {
  const params = new URLSearchParams(window.location.search)
  const pickCode = params.get('pickCode') || params.get('pick_code') || ''

  if (!pickCode) {
    console.warn('[115m-v2] 未找到有效的 pickCode')
    return
  }

  const container = document.getElementById('artplayer-app') || document.body
  container.innerHTML = ''

  // 创建极简状态提示指示器（置于左上角，点火阶段专用）
  const statusBadge = document.createElement('div')
  statusBadge.id = 'v2-ignition-badge'
  statusBadge.style.cssText = `
    position: fixed;
    top: 14px;
    left: 16px;
    z-index: 9999;
    padding: 6px 14px;
    background: rgba(10, 10, 10, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(12px);
    border-radius: 9999px;
    font-size: 13px;
    color: #38bdf8;
    font-weight: 500;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    pointer-events: none;
  `
  statusBadge.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#38bdf8;box-shadow:0 0 8px #38bdf8;"></span> 115m 2.0 底座点火中...`
  document.body.appendChild(statusBadge)

  const loadingText = document.getElementById('loading-text')
  if (loadingText) loadingText.textContent = '正在获取视频播放源与鉴权凭证...'

  try {
    const source = await preparePlaybackSource(pickCode)
    if (source.isBlob) {
      if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl)
      currentBlobUrl = source.src
    }

    if (loadingText) loadingText.textContent = `视频源获取成功 (${source.label})，正在挂载 Vidstack...`

    statusBadge.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px #22c55e;"></span> 2.0 底座已就绪 · ${source.label}`
    statusBadge.style.color = '#4ade80'

    // 构造 Vidstack 播放器 Web Component
    const player = document.createElement('media-player') as any
    player.style.width = '100%'
    player.style.height = '100%'
    player.style.background = '#000'
    player.setAttribute('playsinline', '')
    player.setAttribute('autoplay', '')
    player.setAttribute('crossorigin', '')

    player.addEventListener('provider-change', (event: any) => {
      const provider = event.detail
      if (provider?.type === 'hls') {
        provider.library = Hls
        provider.config = {
          xhrSetup(xhr: XMLHttpRequest) {
            xhr.withCredentials = true
          },
        }
      }
    })

    player.innerHTML = `
      <media-provider></media-provider>
    `

    container.appendChild(player)
    player.src = {
      src: source.src,
      type: source.type,
    }

    // 装配 2.0 极光纯 UI 壳子
    const shell = mountAuroraShell({ playerEl: player })
    const titleParam = params.get('title')
    const fileSizeParam = params.get('fileSize')
    if (titleParam) {
      shell.topbar.setTitle(decodeURIComponent(titleParam))
    }
    const statText = fileSizeParam ? `${fileSizeParam} · ${source.label}` : source.label
    shell.topbar.setStats(statText)
    if (params.get('marked') === '1') {
      shell.topbar.setFavorite(true)
    }

    // 移除点火阶段左上角临时指示条，正式交接给 2.0 极光 UI
    statusBadge.remove()

    // 移除 loading
    const loading = document.getElementById('loading')
    if (loading) loading.style.display = 'none'

    console.log('[115m-v2] 2.0 极光 UI 壳子装配成功，当前源:', source)
  }
  catch (error: any) {
    console.error('[115m-v2] 点火失败:', error)
    statusBadge.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ef4444;box-shadow:0 0 8px #ef4444;"></span> 点火失败: ${error?.message || '未知错误'}`
    statusBadge.style.color = '#f87171'

    const loadingText = document.getElementById('loading-text')
    if (loadingText) loadingText.textContent = `加载失败: ${error?.message || '无法解析视频源'}`
  }
}
