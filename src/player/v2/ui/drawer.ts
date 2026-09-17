export interface DrawerEpisode {
  id: string | number
  name: string
  sub?: string
}

export function createEpisodeDrawer(options: {
  onSelect?: (ep: DrawerEpisode) => void
  onClose?: () => void
}) {
  const drawer = document.createElement('div')
  drawer.className = 'm115-v2-drawer'

  const header = document.createElement('div')
  header.className = 'm115-v2-drawer-header'
  header.innerHTML = `
    <span class="m115-v2-drawer-title">选集列表</span>
    <button class="m115-v2-step-btn" id="m115-close-drawer" style="width:32px;height:32px;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `
  header.querySelector('#m115-close-drawer')?.addEventListener('click', () => {
    drawer.classList.remove('open')
    options.onClose?.()
  })

  const list = document.createElement('div')
  list.className = 'm115-v2-drawer-list'

  drawer.appendChild(header)
  drawer.appendChild(list)

  let activeId: string | number | null = null

  return {
    element: drawer,
    setEpisodes(episodes: DrawerEpisode[], currentId: string | number) {
      activeId = currentId
      list.innerHTML = ''
      episodes.forEach((ep) => {
        const card = document.createElement('div')
        card.className = `m115-v2-episode-card ${ep.id === activeId ? 'active' : ''}`
        card.innerHTML = `
          <div class="m115-v2-episode-name">${ep.name}</div>
          ${ep.sub ? `<div class="m115-v2-episode-sub">${ep.sub}</div>` : ''}
        `
        card.onclick = () => {
          activeId = ep.id
          options.onSelect?.(ep)
        }
        list.appendChild(card)
      })
    },
    toggle() {
      drawer.classList.toggle('open')
    },
    open() {
      drawer.classList.add('open')
    },
    close() {
      drawer.classList.remove('open')
    },
    isOpen() {
      return drawer.classList.contains('open')
    },
  }
}
