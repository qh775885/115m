import './theme.css'
import { createTopBar } from './topbar'
import { createEpisodeDrawer } from './drawer'

export interface OverlayContext {
  playerEl: HTMLElement
}

export function mount115Overlay(ctx: OverlayContext) {
  const root = document.createElement('div')
  root.className = 'm115-overlay-root'

  // 顶部暗部渐变
  const maskTop = document.createElement('div')
  maskTop.className = 'm115-overlay-mask-top'
  root.appendChild(maskTop)

  // 顶部 Header 骨架（左上角信息与面包屑，右上角三联操作与星标）
  const topbar = createTopBar({
    title: '正在读取标题...',
    indexText: '01',
    statsText: '原画',
    breadcrumbs: [
      { cid: '0', name: '全部文件' },
      { cid: '1', name: '我的影视库' },
      { cid: '2', name: '经典华语电影' },
      { cid: '3', name: '色戒' },
    ],
    isFavorite: false,
    onBack: () => window.history.back(),
    onBreadcrumbClick: (item) => {
      alert(`[115 面包屑跳转] 返回目录: ${item.name} (cid: ${item.cid})`)
    },
    onToggleFavorite: (marked) => {
      alert(`[115 收藏] ${marked ? '已加入星标' : '已取消星标'}`)
    },
    onMove: () => alert('[115 移动] 移动到网盘目录'),
    onDownload: () => alert('[115 下载] 下载原画视频'),
    onDelete: () => alert('[115 删除] 删除当前视频文件'),
  })
  root.appendChild(topbar.element)

  // 右侧选集抽屉
  const drawer = createEpisodeDrawer({
    onSelect: (ep) => {
      alert(`[115 选集] 点击切换: ${ep.name}`)
      drawer.close()
    },
  })
  root.appendChild(drawer.element)

  drawer.setEpisodes([
    { id: 1, name: '第 01 集 · 破晓入局', sub: '1080P · 42 分钟' },
    { id: 2, name: '第 02 集 · 暗潮汹涌', sub: '1080P · 45 分钟' },
    { id: 3, name: '第 03 集 · 绝密交锋', sub: '1080P · 48 分钟' },
    { id: 4, name: '第 04 集 · 迷局追踪', sub: '1080P · 41 分钟' },
    { id: 5, name: '第 05 集 · 终极抉择', sub: '1080P · 50 分钟' },
  ], 1)

  // 鼠标空闲自动与播放器控件同步淡出
  let idleTimer: any = null
  const resetIdle = () => {
    root.classList.remove('idle')
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      const video = ctx.playerEl.querySelector('video') as HTMLVideoElement | null
      const isDrawerOpen = drawer.isOpen()
      if (video && !video.paused && !isDrawerOpen) {
        root.classList.add('idle')
      }
    }, 2500)
  }

  ctx.playerEl.addEventListener('mousemove', resetIdle)
  ctx.playerEl.addEventListener('mouseenter', resetIdle)

  // 挂载到播放器容器
  ctx.playerEl.appendChild(root)

  return {
    root,
    topbar,
    drawer,
  }
}
