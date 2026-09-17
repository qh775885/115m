export function createCenterCapsule(options: {
  onPrev?: () => void
  onTogglePlay?: () => void
  onNext?: () => void
}) {
  const capsule = document.createElement('div')
  capsule.className = 'm115-v2-center-capsule'

  // 上一集
  const prevBtn = document.createElement('button')
  prevBtn.className = 'm115-v2-step-btn'
  prevBtn.title = '上一集 ( [ )'
  prevBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="19 20 9 12 19 4 19 20"></polygon>
      <line x1="5" y1="19" x2="5" y2="5"></line>
    </svg>
  `
  prevBtn.onclick = (e) => {
    e.stopPropagation()
    options.onPrev?.()
  }

  // 中央主播放暂停大键
  const playBtn = document.createElement('button')
  playBtn.className = 'm115-v2-main-play-btn'
  playBtn.title = '播放 / 暂停 (空格)'
  let isPlaying = false

  const updatePlayIcon = (playing: boolean) => {
    isPlaying = playing
    playBtn.innerHTML = playing ? `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="4" width="4" height="16" rx="1.5"></rect>
        <rect x="14" y="4" width="4" height="16" rx="1.5"></rect>
      </svg>
    ` : `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="margin-left: 2px;">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    `
  }
  updatePlayIcon(false)

  playBtn.onclick = (e) => {
    e.stopPropagation()
    options.onTogglePlay?.()
  }

  // 下一集
  const nextBtn = document.createElement('button')
  nextBtn.className = 'm115-v2-step-btn'
  nextBtn.title = '下一集 ( ] )'
  nextBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="5 4 15 12 5 20 5 4"></polygon>
      <line x1="19" y1="5" x2="19" y2="19"></line>
    </svg>
  `
  nextBtn.onclick = (e) => {
    e.stopPropagation()
    options.onNext?.()
  }

  capsule.appendChild(prevBtn)
  capsule.appendChild(playBtn)
  capsule.appendChild(nextBtn)

  return {
    element: capsule,
    setPlaying(playing: boolean) {
      updatePlayIcon(playing)
    },
  }
}
