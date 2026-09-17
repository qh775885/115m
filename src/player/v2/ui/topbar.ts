import { Icons } from '../../../shared/icons'

export interface BreadcrumbItem {
  cid: string
  name: string
}

export function createTopBar(options: {
  title?: string
  indexText?: string
  statsText?: string
  breadcrumbs?: BreadcrumbItem[]
  isFavorite?: boolean
  onBack?: () => void
  onBreadcrumbClick?: (item: BreadcrumbItem) => void
  onToggleFavorite?: (marked: boolean) => void
  onMove?: () => void
  onDownload?: () => void
  onDelete?: () => void
}) {
  const container = document.createElement('div')
  container.className = 'm115-v2-topbar'

  // 左侧复合信息区
  const left = document.createElement('div')
  left.className = 'm115-v2-header-left'

  const backBtn = document.createElement('button')
  backBtn.className = 'm115-v2-back-btn'
  backBtn.title = '返回'
  backBtn.innerHTML = Icons.Back()
  backBtn.onclick = () => options.onBack?.()

  const info = document.createElement('div')
  info.className = 'm115-v2-header-info'

  // 第一行：编号徽章 + 标题 + 大小清晰度
  const titleRow = document.createElement('div')
  titleRow.className = 'm115-v2-header-title-row'

  const indexEl = document.createElement('span')
  indexEl.className = 'm115-v2-ep-index'
  indexEl.textContent = options.indexText || '01'

  const titleEl = document.createElement('div')
  titleEl.className = 'm115-v2-header-title'
  titleEl.textContent = options.title || '正在加载视频标题...'

  const statsEl = document.createElement('div')
  statsEl.className = 'm115-v2-header-stats'
  statsEl.textContent = options.statsText || '33.17 GB · 原画'

  titleRow.appendChild(indexEl)
  titleRow.appendChild(titleEl)
  titleRow.appendChild(statsEl)

  // 第二行：面包屑导航
  const breadcrumbsEl = document.createElement('div')
  breadcrumbsEl.className = 'm115-v2-breadcrumbs'

  const renderBreadcrumbs = (items: BreadcrumbItem[]) => {
    breadcrumbsEl.innerHTML = ''
    items.forEach((item, idx) => {
      const crumb = document.createElement('span')
      crumb.className = 'm115-v2-breadcrumb-item'
      crumb.textContent = item.name
      crumb.onclick = () => options.onBreadcrumbClick?.(item)
      breadcrumbsEl.appendChild(crumb)

      if (idx < items.length - 1) {
        const sep = document.createElement('span')
        sep.className = 'm115-v2-breadcrumb-sep'
        sep.textContent = '>'
        breadcrumbsEl.appendChild(sep)
      }
    })
  }

  renderBreadcrumbs(options.breadcrumbs || [
    { cid: '0', name: '根目录' },
    { cid: '1', name: '影视' },
    { cid: '2', name: '华语经典' },
  ])

  info.appendChild(titleRow)
  info.appendChild(breadcrumbsEl)
  left.appendChild(backBtn)
  left.appendChild(info)

  // 右侧操作区：星标收藏 + 三联操作胶囊
  const right = document.createElement('div')
  right.className = 'm115-v2-header-right'

  const favBtn = document.createElement('button')
  favBtn.className = `m115-v2-fav-btn ${options.isFavorite ? 'active' : ''}`
  favBtn.title = '星标收藏'
  favBtn.innerHTML = options.isFavorite ? Icons.StarFilled() : Icons.Star()
  let isFav = !!options.isFavorite
  favBtn.onclick = () => {
    isFav = !isFav
    favBtn.className = `m115-v2-fav-btn ${isFav ? 'active' : ''}`
    favBtn.innerHTML = isFav ? Icons.StarFilled() : Icons.Star()
    options.onToggleFavorite?.(isFav)
  }

  const pillGroup = document.createElement('div')
  pillGroup.className = 'm115-v2-top-pill-group'

  const moveBtn = document.createElement('button')
  moveBtn.className = 'm115-v2-top-action-btn'
  moveBtn.title = '移动到网盘目录'
  moveBtn.innerHTML = `${Icons.Move()} <span>移动</span>`
  moveBtn.onclick = () => options.onMove?.()

  const downloadBtn = document.createElement('button')
  downloadBtn.className = 'm115-v2-top-action-btn'
  downloadBtn.title = '下载原画文件'
  downloadBtn.innerHTML = `${Icons.Download()} <span>下载</span>`
  downloadBtn.onclick = () => options.onDownload?.()

  const deleteBtn = document.createElement('button')
  deleteBtn.className = 'm115-v2-top-action-btn delete'
  deleteBtn.title = '删除文件'
  deleteBtn.innerHTML = `${Icons.Trash()} <span>删除</span>`
  deleteBtn.onclick = () => options.onDelete?.()

  pillGroup.appendChild(moveBtn)
  pillGroup.appendChild(downloadBtn)
  pillGroup.appendChild(deleteBtn)

  right.appendChild(favBtn)
  right.appendChild(pillGroup)

  container.appendChild(left)
  container.appendChild(right)

  return {
    element: container,
    setTitle(title: string) {
      titleEl.textContent = title
    },
    setIndex(text: string) {
      indexEl.textContent = text
    },
    setStats(text: string) {
      statsEl.textContent = text
    },
    setBreadcrumbs(items: BreadcrumbItem[]) {
      renderBreadcrumbs(items)
    },
    setFavorite(marked: boolean) {
      isFav = marked
      favBtn.className = `m115-v2-fav-btn ${marked ? 'active' : ''}`
      favBtn.innerHTML = marked ? Icons.StarFilled() : Icons.Star()
    },
  }
}
