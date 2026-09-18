import './runtime/lit-shield'
import './runtime/runtime-shim-install'
import 'vidstack/player'
import 'vidstack/player/ui'
import Hls from 'hls.js'
import { mountCleanView } from './ui/clean-view'
import { PlayerCore } from './controller/player-core'
import { PlaybackSession } from './controller/session'
import { bindKeyboard } from './adapters/keyboard'

let currentBlobUrl: string | null = null

export async function ignitePlayer() {
  const params = new URLSearchParams(window.location.search)
  const pickCode = params.get('pickCode') || params.get('pick_code') || ''

  if (!pickCode) {
    console.warn('[115m-v2] 未找到有效的 pickCode')
    return
  }

  const container = document.getElementById('media-player-container') || document.getElementById('artplayer-app') || document.body
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
    if (loadingText) loadingText.textContent = '正在获取视频播放源与鉴权凭证...'

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

    // 能力层：挂载播放内核，向内回写状态，向 UI 暴露标准动作
    const core = new PlayerCore()
    core.attach(player)

    // 会话控制器：播放列表加载、切集、上一下一集、播完连播
    const titleParam = params.get('title')
    const fileSizeParam = params.get('fileSize')
    const session = new PlaybackSession(core, {
      pickCode,
      cid: params.get('cid') || '',
      title: titleParam ? decodeURIComponent(titleParam) : '',
      fileSize: fileSizeParam || '',
      isFavorite: params.get('marked') === '1',
    })

    // 专业现代影院视口装配，每一个元素像素级对齐，底层 Vidstack 纯净驱动
    const view = mountCleanView({
      container,
      playerEl: player,
      core,
      content: session.content,
      subtitles: session.subtitles,
      onBack: () => window.history.back(),
      onBreadcrumbClick: (item) => {
        const url = `https://115.com/?cid=${encodeURIComponent(item.cid)}&offset=0&tab=&mode=wangpan`
        window.open(url, '_blank', 'noopener')
      },
      onMove: () => void session.moveEpisode(session.content.get().pickCode),
      onDownload: () => void session.download(),
      onDelete: () => void session.removeCurrent(),
      onToggleFavorite: (marked) => void session.toggleFavorite(marked),
      onPrev: () => session.prev(true),
      onNext: () => session.next(true),
      onRotate: () => core.rotate(),
      onSelectEpisode: (code) => session.switchTo(code, { autoPlay: true, keepPlaylistOpen: true }),
      onMoveEpisode: (code) => void session.moveEpisode(code),
      onDeleteEpisode: (code) => void session.deleteEpisode(code),
      onSelectQuality: (label) => void session.setQuality(label),
      onSelectAudioTrack: (id) => core.selectAudioTrack(id),
      onSelectSubtitle: (sid) => void session.setSubtitle(sid),
      onSelectMode: (mode) => session.setMode(mode as 'sequence' | 'loop-one' | 'loop-all'),
      requestPreview: (time, duration, onUpdate) => session.getCoverAt(time, duration, onUpdate),
    })

    // 全局快捷键：空格播放暂停 / 左右步进 / 上下音量 / M 静音 / F 全屏 / [ ] 切集 / R 旋转
    bindKeyboard({
      togglePlay: () => core.toggle(),
      seekBy: (delta) => core.seekBy(delta),
      volumeBy: (delta) => core.adjustVolume(delta),
      toggleMute: () => core.toggleMute(),
      toggleFullscreen: () => {
        if (!document.fullscreenElement) {
          view.viewport.requestFullscreen().catch(() => {})
        }
        else {
          document.exitFullscreen().catch(() => {})
        }
      },
      prev: () => session.prev(true),
      next: () => session.next(true),
      rotate: () => core.rotate(),
    })

    // 会话启动：解析播放源（含清晰度全集）→ 装载首播源 → 加载播放列表
    const initial = await session.start()
    if (initial.isBlob) {
      if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl)
      currentBlobUrl = initial.src
    }

    statusBadge.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px #22c55e;"></span> 2.0 底座已就绪 · ${initial.label}`
    statusBadge.style.color = '#4ade80'

    // 移除点火阶段左上角临时指示条
    statusBadge.remove()

    // 移除 loading
    const loading = document.getElementById('loading')
    if (loading) loading.style.display = 'none'

    console.log('[115m-v2] 经典成熟架子挂载成功，Vidstack 底座驱动中:', initial)
  }
  catch (error: any) {
    console.error('[115m-v2] 点火失败:', error)
    statusBadge.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ef4444;box-shadow:0 0 8px #ef4444;"></span> 点火失败: ${error?.message || '未知错误'}`
    statusBadge.style.color = '#f87171'

    const loadingText = document.getElementById('loading-text')
    if (loadingText) loadingText.textContent = `加载失败: ${error?.message || '无法解析视频源'}`
  }
}

export { ignitePlayer as igniteV2Player }
