export function createBottomControls(options: {
  onTogglePlay?: () => void
  onVolumeChange?: (vol: number) => void
  onToggleMute?: () => void
  onQualityClick?: () => void
  onAudioTrackClick?: () => void
  onSubtitleClick?: () => void
  onSpeedClick?: () => void
  onPlaylistClick?: () => void
  onFullscreenClick?: () => void
}) {
  const container = document.createElement('div')
  container.className = 'm115-v2-bottom-bar'

  // 左侧操作与信息群
  const leftControls = document.createElement('div')
  leftControls.className = 'm115-v2-left-controls'

  // 底部常规小播放按钮
  const miniPlayBtn = document.createElement('button')
  miniPlayBtn.className = 'm115-v2-step-btn'
  miniPlayBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
  `
  miniPlayBtn.onclick = () => options.onTogglePlay?.()

  // 等宽时间显示
  const timeDisplay = document.createElement('div')
  timeDisplay.className = 'm115-v2-time-display'
  timeDisplay.textContent = '00:00 / 00:00'

  // 横向水银微动效音量胶囊
  const volumeCluster = document.createElement('div')
  volumeCluster.className = 'm115-v2-volume-cluster'

  const volumeBtn = document.createElement('button')
  volumeBtn.className = 'm115-v2-step-btn'
  volumeBtn.style.width = '24px'
  volumeBtn.style.height = '24px'
  volumeBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    </svg>
  `
  volumeBtn.onclick = () => options.onToggleMute?.()

  const sliderWrap = document.createElement('div')
  sliderWrap.className = 'm115-v2-volume-bar-wrap'

  const slider = document.createElement('input')
  slider.type = 'range'
  slider.className = 'm115-v2-volume-slider'
  slider.min = '0'
  slider.max = '100'
  slider.value = '100'
  slider.oninput = () => options.onVolumeChange?.(Number(slider.value) / 100)

  sliderWrap.appendChild(slider)
  volumeCluster.appendChild(volumeBtn)
  volumeCluster.appendChild(sliderWrap)

  leftControls.appendChild(miniPlayBtn)
  leftControls.appendChild(timeDisplay)
  leftControls.appendChild(volumeCluster)

  // 右侧高频功能胶囊群
  const rightControls = document.createElement('div')
  rightControls.className = 'm115-v2-right-controls'

  // 画质
  const qualityPill = document.createElement('button')
  qualityPill.className = 'm115-v2-pill-btn'
  qualityPill.id = 'm115-pill-quality'
  qualityPill.textContent = '原画'
  qualityPill.onclick = () => options.onQualityClick?.()

  // 音轨
  const audioPill = document.createElement('button')
  audioPill.className = 'm115-v2-pill-btn'
  audioPill.id = 'm115-pill-audio'
  audioPill.textContent = '音轨'
  audioPill.onclick = () => options.onAudioTrackClick?.()

  // 字幕
  const subtitlePill = document.createElement('button')
  subtitlePill.className = 'm115-v2-pill-btn'
  subtitlePill.id = 'm115-pill-subtitle'
  subtitlePill.textContent = '字幕'
  subtitlePill.onclick = () => options.onSubtitleClick?.()

  // 倍速
  const speedPill = document.createElement('button')
  speedPill.className = 'm115-v2-pill-btn'
  speedPill.id = 'm115-pill-speed'
  speedPill.textContent = '1.0x'
  speedPill.onclick = () => options.onSpeedClick?.()

  // 选集
  const playlistBtn = document.createElement('button')
  playlistBtn.className = 'm115-v2-pill-btn'
  playlistBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
    <span>选集</span>
  `
  playlistBtn.onclick = () => options.onPlaylistClick?.()

  // 全屏
  const fullscreenBtn = document.createElement('button')
  fullscreenBtn.className = 'm115-v2-step-btn'
  fullscreenBtn.title = '全屏 ( F )'
  fullscreenBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
    </svg>
  `
  fullscreenBtn.onclick = () => options.onFullscreenClick?.()

  rightControls.appendChild(qualityPill)
  rightControls.appendChild(audioPill)
  rightControls.appendChild(subtitlePill)
  rightControls.appendChild(speedPill)
  rightControls.appendChild(playlistBtn)
  rightControls.appendChild(fullscreenBtn)

  container.appendChild(leftControls)
  container.appendChild(rightControls)

  return {
    element: container,
    setTime(currentText: string, totalText: string) {
      timeDisplay.textContent = `${currentText} / ${totalText}`
    },
    setPlaying(playing: boolean) {
      miniPlayBtn.innerHTML = playing ? `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1"></rect>
          <rect x="14" y="4" width="4" height="16" rx="1"></rect>
        </svg>
      ` : `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      `
    },
    setQualityLabel(label: string) {
      qualityPill.textContent = label
    },
    setSpeedLabel(label: string) {
      speedPill.textContent = label
    },
    setVolume(value: number) {
      slider.value = String(Math.round(value * 100))
    },
  }
}
