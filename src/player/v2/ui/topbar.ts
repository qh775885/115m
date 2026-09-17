export function createTopBar(options: {
  title?: string
  badgeText?: string
  onBack?: () => void
  onDownload?: () => void
  onMove?: () => void
}) {
  const container = document.createElement('div')
  container.className = 'm115-v2-topbar'

  const titleGroup = document.createElement('div')
  titleGroup.className = 'm115-v2-title-group'

  const backBtn = document.createElement('button')
  backBtn.className = 'm115-v2-back-btn'
  backBtn.title = '返回'
  backBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  `
  backBtn.onclick = () => options.onBack?.()

  const titleText = document.createElement('div')
  titleText.className = 'm115-v2-title'
  titleText.textContent = options.title || '115m 极光影院'

  const badge = document.createElement('span')
  badge.className = 'm115-v2-badge'
  badge.textContent = options.badgeText || '4K 原画'

  titleGroup.appendChild(backBtn)
  titleGroup.appendChild(titleText)
  titleGroup.appendChild(badge)

  const actions = document.createElement('div')
  actions.className = 'm115-v2-top-actions'

  const downloadBtn = document.createElement('button')
  downloadBtn.className = 'm115-v2-icon-btn'
  downloadBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
    <span>下载原画</span>
  `
  downloadBtn.onclick = () => options.onDownload?.()

  const moveBtn = document.createElement('button')
  moveBtn.className = 'm115-v2-icon-btn'
  moveBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
    <span>移动目录</span>
  `
  moveBtn.onclick = () => options.onMove?.()

  actions.appendChild(downloadBtn)
  actions.appendChild(moveBtn)

  container.appendChild(titleGroup)
  container.appendChild(actions)

  return {
    element: container,
    setTitle(title: string) {
      titleText.textContent = title
    },
    setBadge(text: string) {
      badge.textContent = text
    },
  }
}
