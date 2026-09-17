import { Icons } from '../../../shared/icons'

export function createBottomControls(options: {
  onTogglePlay?: () => void
  onPrev?: () => void
  onNext?: () => void
  onVolumeChange?: (vol: number) => void
  onToggleMute?: () => void
  onModeClick?: () => void
  onRotateClick?: () => void
  onQualityClick?: () => void
  onAudioTrackClick?: () => void
  onSubtitleClick?: () => void
  onSpeedClick?: () => void
  onPlaylistClick?: () => void
  onFullscreenClick?: () => void
}) {
  const container = document.createElement('div')
  container.className = 'm115-v2-controls-row'

  // ───────────────────────────────────────────
  // 1. 左侧区域：播放时间码 + 横向水银音量滑块
  // ───────────────────────────────────────────
  const left = document.createElement('div')
  left.className = 'm115-v2-left-cluster'

  const timeDisplay = document.createElement('div')
  timeDisplay.className = 'm115-v2-time-display'
  timeDisplay.textContent = '00:00:00 / 00:00:00'

  const volumeCluster = document.createElement('div')
  volumeCluster.className = 'm115-v2-volume-cluster'

  const volumeBtn = document.createElement('button')
  volumeBtn.className = 'm115-v2-ctrl-icon-btn'
  volumeBtn.style.border = 'none'
  volumeBtn.style.background = 'transparent'
  volumeBtn.style.width = '24px'
  volumeBtn.style.height = '24px'
  volumeBtn.title = '静音 / 取消静音 ( M )'
  volumeBtn.innerHTML = Icons.Volume2()
  volumeBtn.onclick = () => options.onToggleMute?.()

  const sliderWrap = document.createElement('div')
  sliderWrap.className = 'm115-v2-volume-slider-wrap'

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

  left.appendChild(timeDisplay)
  left.appendChild(volumeCluster)

  // ───────────────────────────────────────────
  // 2. 居中区域：黄金中轴三联主控（上一集 / 大播放 / 下一集）
  // ───────────────────────────────────────────
  const center = document.createElement('div')
  center.className = 'm115-v2-center-cluster'

  const prevBtn = document.createElement('button')
  prevBtn.className = 'm115-v2-nav-btn'
  prevBtn.title = '上一集 ( [ )'
  prevBtn.innerHTML = Icons.SkipBack()
  prevBtn.onclick = () => options.onPrev?.()

  const playBtn = document.createElement('button')
  playBtn.className = 'm115-v2-center-play-btn'
  playBtn.title = '播放 / 暂停 ( 空格 )'
  let isPlaying = false

  const updatePlayBtn = (playing: boolean) => {
    isPlaying = playing
    playBtn.innerHTML = playing ? Icons.Pause() : Icons.Play()
  }
  updatePlayBtn(false)

  playBtn.onclick = () => options.onTogglePlay?.()

  const nextBtn = document.createElement('button')
  nextBtn.className = 'm115-v2-nav-btn'
  nextBtn.title = '下一集 ( ] )'
  nextBtn.innerHTML = Icons.SkipForward()
  nextBtn.onclick = () => options.onNext?.()

  center.appendChild(prevBtn)
  center.appendChild(playBtn)
  center.appendChild(nextBtn)

  // ───────────────────────────────────────────
  // 3. 右侧区域：高频功能胶囊群
  // ───────────────────────────────────────────
  const right = document.createElement('div')
  right.className = 'm115-v2-right-cluster'

  // 循环模式
  const modeBtn = document.createElement('button')
  modeBtn.className = 'm115-v2-ctrl-icon-btn'
  modeBtn.title = '播放模式（顺序播放 / 单集循环 / 列表循环）'
  modeBtn.innerHTML = Icons.Repeat()
  modeBtn.onclick = () => options.onModeClick?.()

  // 画面旋转
  const rotateBtn = document.createElement('button')
  rotateBtn.className = 'm115-v2-ctrl-icon-btn'
  rotateBtn.title = '画面旋转 90° ( R )'
  rotateBtn.innerHTML = Icons.RotateCw()
  rotateBtn.onclick = () => options.onRotateClick?.()

  // 画质
  const qualityBtn = document.createElement('button')
  qualityBtn.className = 'm115-v2-ctrl-btn'
  qualityBtn.id = 'm115-btn-quality'
  qualityBtn.textContent = '原画'
  qualityBtn.onclick = () => options.onQualityClick?.()

  // 音轨
  const audioBtn = document.createElement('button')
  audioBtn.className = 'm115-v2-ctrl-btn'
  audioBtn.id = 'm115-btn-audio'
  audioBtn.innerHTML = `${Icons.MediaTrack()} <span>音轨</span>`
  audioBtn.onclick = () => options.onAudioTrackClick?.()

  // 字幕
  const subtitleBtn = document.createElement('button')
  subtitleBtn.className = 'm115-v2-ctrl-btn'
  subtitleBtn.id = 'm115-btn-subtitle'
  subtitleBtn.textContent = '字幕'
  subtitleBtn.onclick = () => options.onSubtitleClick?.()

  // 倍速
  const speedBtn = document.createElement('button')
  speedBtn.className = 'm115-v2-ctrl-btn'
  speedBtn.id = 'm115-btn-speed'
  speedBtn.textContent = '1.0x'
  speedBtn.onclick = () => options.onSpeedClick?.()

  // 选集抽屉
  const playlistBtn = document.createElement('button')
  playlistBtn.className = 'm115-v2-ctrl-btn'
  playlistBtn.innerHTML = `${Icons.Playlist()} <span>选集</span>`
  playlistBtn.onclick = () => options.onPlaylistClick?.()

  // 全屏
  const fullscreenBtn = document.createElement('button')
  fullscreenBtn.className = 'm115-v2-ctrl-icon-btn'
  fullscreenBtn.title = '全屏 ( F )'
  fullscreenBtn.innerHTML = Icons.Fullscreen()
  fullscreenBtn.onclick = () => options.onFullscreenClick?.()

  right.appendChild(modeBtn)
  right.appendChild(rotateBtn)
  right.appendChild(qualityBtn)
  right.appendChild(audioBtn)
  right.appendChild(subtitleBtn)
  right.appendChild(speedBtn)
  right.appendChild(playlistBtn)
  right.appendChild(fullscreenBtn)

  container.appendChild(left)
  container.appendChild(center)
  container.appendChild(right)

  return {
    element: container,
    setTime(currentTime: string, duration: string) {
      timeDisplay.textContent = `${currentTime} / ${duration}`
    },
    setPlaying(playing: boolean) {
      updatePlayBtn(playing)
    },
    setVolume(value: number, muted: boolean) {
      slider.value = String(Math.round(value * 100))
      volumeBtn.innerHTML = (muted || value === 0) ? Icons.VolumeX() : Icons.Volume2()
    },
    setQuality(label: string) {
      qualityBtn.textContent = label
    },
    setSpeed(label: string) {
      speedBtn.textContent = label
    },
  }
}
