import './theme.css'
import { createTopBar } from './topbar'
import { createEpisodeDrawer } from './drawer'
import { Icons } from '../../../shared/icons'

export interface AuroraShellContext {
  playerEl: HTMLElement
  videoEl?: HTMLVideoElement | null
}

export function mountAuroraShell(ctx: AuroraShellContext) {
  const root = document.createElement('div')
  root.className = 'm115-v2-shell'

  // 上下暗部渐变遮罩
  const maskTop = document.createElement('div')
  maskTop.className = 'm115-v2-mask-top'
  const maskBottom = document.createElement('div')
  maskBottom.className = 'm115-v2-mask-bottom'

  root.appendChild(maskTop)
  root.appendChild(maskBottom)

  // 1. 顶部 Header 骨架（左上角信息与面包屑，右上角三联操作与星标）
  const topbar = createTopBar({
    title: '色，戒 (2007) · 完整无删减版',
    indexText: '01',
    statsText: '33.17 GB · 原画',
    breadcrumbs: [
      { cid: '0', name: '全部文件' },
      { cid: '1', name: '我的影视库' },
      { cid: '2', name: '经典华语电影' },
      { cid: '3', name: '色戒' },
    ],
    isFavorite: false,
    onBack: () => window.history.back(),
    onBreadcrumbClick: (item) => {
      alert(`[2.0 骨架交互] 点击面包屑返回目录: ${item.name} (cid: ${item.cid})`)
    },
    onToggleFavorite: (marked) => {
      alert(`[2.0 骨架交互] ${marked ? '已加入星标收藏' : '已取消星标'}`)
    },
    onMove: () => alert('[2.0 骨架交互] 移动到网盘目录'),
    onDownload: () => alert('[2.0 骨架交互] 下载原画视频'),
    onDelete: () => alert('[2.0 骨架交互] 删除当前视频文件'),
  })
  root.appendChild(topbar.element)

  // 2. 右侧选集抽屉 (Drawer)
  const drawer = createEpisodeDrawer({
    onSelect: (ep) => {
      alert(`[2.0 骨架交互] 点击跳播: ${ep.name}`)
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

  // 3. 底部 Vidstack 官方原生控件层 (Web Components 工业级标准排版)
  const controlsWrapper = document.createElement('div')
  controlsWrapper.className = 'm115-v2-bottom-area'

  controlsWrapper.innerHTML = `
    <!-- 官方原生高精度极光时间轴 (带缓冲显示与拖拽吸附) -->
    <div class="m115-v2-timeline-wrap">
      <media-time-slider class="vds-time-slider"></media-time-slider>
    </div>

    <!-- 官方底栏水平控件行 -->
    <div class="m115-v2-controls-row">
      <!-- 3.1 左侧：时间码与音量 -->
      <div class="m115-v2-left-cluster">
        <div class="m115-v2-time-display">
          <media-time class="vds-time" type="current"></media-time>
          <span style="opacity: 0.4; margin: 0 4px;">/</span>
          <media-time class="vds-time" type="duration"></media-time>
        </div>

        <div class="m115-v2-volume-cluster">
          <media-mute-button class="vds-button m115-mute-btn"></media-mute-button>
          <div class="m115-v2-volume-slider-wrap">
            <media-volume-slider class="vds-volume-slider"></media-volume-slider>
          </div>
        </div>
      </div>

      <!-- 3.2 居中：上一集 + 官方原生 PlayButton + 下一集 -->
      <div class="m115-v2-center-cluster">
        <button class="m115-v2-nav-btn prev" title="上一集 ( [ )">
          ${Icons.SkipBack()}
        </button>
        <media-play-button class="vds-button m115-v2-center-play-btn"></media-play-button>
        <button class="m115-v2-nav-btn next" title="下一集 ( ] )">
          ${Icons.SkipForward()}
        </button>
      </div>

      <!-- 3.3 右侧：官方成熟 Menu 弹层群 + 选集 + 全屏 -->
      <div class="m115-v2-right-cluster">
        <!-- 循环模式 -->
        <button class="m115-v2-ctrl-icon-btn m115-mode-btn" title="播放模式">
          ${Icons.Repeat()}
        </button>

        <!-- 旋转 -->
        <button class="m115-v2-ctrl-icon-btn m115-rotate-btn" title="画面旋转 90°">
          ${Icons.RotateCw()}
        </button>

        <!-- 画质 Menu (官方原生组件) -->
        <media-menu>
          <media-menu-button class="vds-button m115-v2-ctrl-btn">
            <span>画质</span>
          </media-menu-button>
          <media-menu-items class="vds-menu-items">
            <media-quality-radio-group></media-quality-radio-group>
          </media-menu-items>
        </media-menu>

        <!-- 音轨 Menu (官方原生组件) -->
        <media-menu>
          <media-menu-button class="vds-button m115-v2-ctrl-btn">
            ${Icons.MediaTrack()}
            <span>音轨</span>
          </media-menu-button>
          <media-menu-items class="vds-menu-items">
            <media-audio-radio-group></media-audio-radio-group>
          </media-menu-items>
        </media-menu>

        <!-- 字幕 Menu (官方原生组件) -->
        <media-menu>
          <media-menu-button class="vds-button m115-v2-ctrl-btn">
            <span>字幕</span>
          </media-menu-button>
          <media-menu-items class="vds-menu-items">
            <media-captions-radio-group></media-captions-radio-group>
          </media-menu-items>
        </media-menu>

        <!-- 倍速 Menu (官方原生组件) -->
        <media-menu>
          <media-menu-button class="vds-button m115-v2-ctrl-btn">
            <span>倍速</span>
          </media-menu-button>
          <media-menu-items class="vds-menu-items">
            <media-speed-radio-group></media-speed-radio-group>
          </media-menu-items>
        </media-menu>

        <!-- 选集抽屉按钮 -->
        <button class="m115-v2-ctrl-btn m115-playlist-btn">
          ${Icons.Playlist()}
          <span>选集</span>
        </button>

        <!-- 官方原生全屏按钮 -->
        <media-fullscreen-button class="vds-button m115-v2-ctrl-icon-btn"></media-fullscreen-button>
      </div>
    </div>
  `

  root.appendChild(controlsWrapper)

  // 绑定自建按钮事件
  controlsWrapper.querySelector('.m115-v2-nav-btn.prev')?.addEventListener('click', () => {
    alert('[2.0 骨架交互] 播放上一集 ( [ )')
  })
  controlsWrapper.querySelector('.m115-v2-nav-btn.next')?.addEventListener('click', () => {
    alert('[2.0 骨架交互] 播放下一集 ( ] )')
  })
  controlsWrapper.querySelector('.m115-mode-btn')?.addEventListener('click', () => {
    alert('[2.0 骨架交互] 切换循环播放模式')
  })
  controlsWrapper.querySelector('.m115-rotate-btn')?.addEventListener('click', () => {
    alert('[2.0 骨架交互] 画面顺时针旋转 90°')
  })
  controlsWrapper.querySelector('.m115-playlist-btn')?.addEventListener('click', () => {
    drawer.toggle()
  })

  // 4. 鼠标空闲 2.5 秒淡出控制层
  let idleTimer: any = null
  const resetIdle = () => {
    root.classList.remove('idle')
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      const video = ctx.playerEl.querySelector('video') as HTMLVideoElement | null
      const isMenuOpen = !!ctx.playerEl.querySelector('media-menu-items[data-open], .m115-v2-drawer.open')
      if (video && !video.paused && !isMenuOpen) {
        root.classList.add('idle')
      }
    }, 2500)
  }

  ctx.playerEl.addEventListener('mousemove', resetIdle)
  ctx.playerEl.addEventListener('mouseenter', resetIdle)

  // 挂载到容器
  ctx.playerEl.appendChild(root)

  return {
    root,
    topbar,
  }
}
