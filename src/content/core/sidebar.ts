interface SidebarNavItem {
  id: string
  title: string
  icon: string
  href: string
  dataNav?: string
  defaultEnabled: boolean
}

const SIDEBAR_ID = 'm115-sidebar-nav'
const SIDEBAR_SETTINGS_ID = 'm115-sidebar-settings'
const SIDEBAR_PREHIDE_ID = 'm115-sidebar-prehide'
const SIDEBAR_STORAGE_KEY = 'm115_sidebar_enabled'
const ICON_BASE = 'https://115.com/icons'
const NAV_ITEMS: SidebarNavItem[] = [
  { id: 'wangpan', title: '网盘', icon: `${ICON_BASE}/storage_allcloudfiles.svg`, href: 'https://115.com/?cid=0&offset=0&mode=wangpan', defaultEnabled: true },
  { id: 'upload', title: '最近上传', icon: `${ICON_BASE}/storage/channel_recent_upload.svg`, href: '//115.com/?tab=upload&mode=wangpan', dataNav: 'upload', defaultEnabled: true },
  { id: 'star', title: '星标文件', icon: `${ICON_BASE}/storage_starredfiles.svg`, href: '//115.com/?tab=label&label_id=-1&show_label=1&mode=wangpan', dataNav: 'star', defaultEnabled: true },
  { id: 'recyclebin', title: '回收站', icon: `${ICON_BASE}/storage_recyclebin.svg`, href: '//115.com/?tab=rb&mode=wangpan', dataNav: 'rb', defaultEnabled: true },
  { id: 'clouddownload', title: '云下载', icon: `${ICON_BASE}/storage_clouddownload.svg`, href: '//115.com/?tab=offline&mode=wangpan', dataNav: 'offline', defaultEnabled: false },
  { id: 'receive', title: '最近接收', icon: `${ICON_BASE}/storage/channel_recent_receive.svg`, href: '//115.com/?tab=share_save_receive&mode=wangpan', dataNav: 'share_save_receive', defaultEnabled: false },
  { id: 'tags', title: '文件标签', icon: `${ICON_BASE}/storage_filetags.svg`, href: 'javascript:;', dataNav: 'label', defaultEnabled: false },
  { id: 'share', title: '链接分享', icon: `${ICON_BASE}/storage/channel_link_share.svg`, href: '//115.com/?mode=share_save', dataNav: 'share_save', defaultEnabled: false },
]

export function getSortedItems(items: SidebarNavItem[]): SidebarNavItem[] {
  const specialOrder = ['receive', 'upload', 'recyclebin']
  const specialItems: SidebarNavItem[] = []
  const normalItems: SidebarNavItem[] = []

  items.forEach((item) => {
    if (specialOrder.includes(item.id)) specialItems.push(item)
    else normalItems.push(item)
  })

  specialItems.sort((a, b) => specialOrder.indexOf(a.id) - specialOrder.indexOf(b.id))
  return [...normalItems, ...specialItems]
}

function getEnabledIds(doc: Document): Set<string> {
  try {
    const raw = doc.defaultView?.localStorage?.getItem(SIDEBAR_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as string[]
      if (Array.isArray(parsed)) return new Set(parsed)
    }
  }
  catch {
    // ignore
  }
  return new Set(NAV_ITEMS.filter(item => item.defaultEnabled).map(item => item.id))
}

function saveEnabledIds(doc: Document, ids: Set<string>) {
  try {
    doc.defaultView?.localStorage?.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify([...ids]))
  }
  catch {
    // ignore
  }
}

export function injectSidebarPrehide(doc: Document) {
  if (doc.getElementById(SIDEBAR_PREHIDE_ID)) return
  const style = doc.createElement('style')
  style.id = SIDEBAR_PREHIDE_ID
  style.textContent = `
    .container-leftside .top-side .navigation-ceiling ul,
    .container-leftside .bottom-side .navigation-ceiling ul {
      visibility: hidden !important;
    }

    .container-leftside .top-side .navigation-ceiling ul .m115-nav-item,
    .container-leftside .top-side .navigation-ceiling ul .m115-nav-link,
    .container-leftside .top-side .navigation-ceiling ul #${SIDEBAR_ID},
    .container-leftside .bottom-side .navigation-ceiling ul .m115-sidebar-settings-item,
    .container-leftside .bottom-side .navigation-ceiling ul .m115-nav-link {
      visibility: visible !important;
    }

    .container-leftside .top-side .navigation-ceiling ul li[mode_btn="wangpan"],
    .container-leftside .top-side .navigation-ceiling ul li[mode_btn="home"],
    .container-leftside .top-side .navigation-ceiling ul li[mode_btn="vip"],
    .container-leftside .top-side .navigation-ceiling ul li[mode_btn="add"],
    .container-leftside .bottom-side .navigation-ceiling ul li:has(#js_left_notice),
    .container-leftside .bottom-side .navigation-ceiling ul li:has(#js_feedback_main),
    .container-leftside .bottom-side .navigation-ceiling ul li:has(a[onclick*="CommonHeader.showClientDownLoad"]) {
      display: none !important;
    }
  `
  doc.head?.appendChild(style)
}

function updateSelection(doc: Document) {
  doc.querySelectorAll('.m115-nav-item').forEach(node => node.classList.remove('current'))
  const params = new URLSearchParams(window.location.search)
  const tab = params.get('tab') || ''
  const current = doc.querySelector<HTMLElement>(tab ? `.m115-nav-item[data-nav="${tab}"]` : '.m115-nav-item[data-id="wangpan"]')
  current?.classList.add('current')
}

function closeSettings(doc: Document) {
  doc.getElementById(SIDEBAR_SETTINGS_ID)?.remove()
}

function renderSidebar(doc: Document, enabledIds: Set<string>) {
  const topList = doc.querySelector('.container-leftside .top-side .navigation-ceiling ul') as HTMLElement | null
  const bottomList = doc.querySelector('.container-leftside .bottom-side .navigation-ceiling ul') as HTMLElement | null
  if (!topList || !bottomList) return

  topList.querySelectorAll('.m115-nav-item').forEach(node => node.remove())
  bottomList.querySelectorAll('.m115-sidebar-settings-item').forEach(node => node.remove())

  const visibleItems = NAV_ITEMS.filter(item => item.id === 'wangpan' || enabledIds.has(item.id))
  const orderedItems = visibleItems[0]?.id === 'wangpan'
    ? [visibleItems[0], ...getSortedItems(visibleItems.slice(1))]
    : getSortedItems(visibleItems)

  orderedItems.forEach((item) => {
    const li = doc.createElement('li')
    li.className = 'm115-nav-item'
    li.dataset.id = item.id
    if (item.dataNav) li.dataset.nav = item.dataNav

    const link = doc.createElement('a')
    link.className = 'm115-nav-link'
    link.href = item.href

    const icon = doc.createElement('i')
    icon.className = 'm115-nav-icon'
    icon.style.backgroundImage = `url("${item.icon}")`

    const text = doc.createElement('span')
    text.className = 'm115-nav-text'
    text.textContent = item.title

    link.appendChild(icon)
    link.appendChild(text)
    link.addEventListener('click', (event) => {
      if (item.id === 'wangpan') return
      if (!item.dataNav) return
      event.preventDefault()
      const original = doc.querySelector(`#js_sub_nav_scroller [data-nav="${item.dataNav}"]`) as HTMLElement | null
      if (original) original.click()
      else if (item.href !== 'javascript:;') window.location.href = item.href
    })

    li.appendChild(link)
    topList.appendChild(li)
  })

  const settingsLi = doc.createElement('li')
  settingsLi.className = 'm115-nav-item m115-sidebar-settings-item'
  const settingsBtn = doc.createElement('button')
  settingsBtn.type = 'button'
  settingsBtn.className = 'm115-nav-link m115-nav-settings-btn'
  settingsBtn.innerHTML = `<i class="m115-nav-icon" style="background-image:url('https://115.com/icons/life/life_settings.svg')"></i><span class="m115-nav-text">设置</span>`
  settingsBtn.addEventListener('click', () => openSettings(doc, enabledIds))
  settingsLi.appendChild(settingsBtn)
  bottomList.appendChild(settingsLi)

  updateSelection(doc)
}

function openSettings(doc: Document, enabledIds: Set<string>) {
  closeSettings(doc)

  const overlay = doc.createElement('div')
  overlay.id = SIDEBAR_SETTINGS_ID
  overlay.className = 'm115-sidebar-settings-overlay'

  const panel = doc.createElement('div')
  panel.className = 'm115-sidebar-settings-panel'

  const header = doc.createElement('div')
  header.className = 'm115-sidebar-settings-header'
  const title = doc.createElement('strong')
  title.textContent = '115左侧栏设置'
  const closeX = doc.createElement('button')
  closeX.type = 'button'
  closeX.className = 'm115-sidebar-settings-close'
  closeX.textContent = '×'
  closeX.addEventListener('click', () => closeSettings(doc))
  header.appendChild(title)
  header.appendChild(closeX)

  const body = doc.createElement('div')
  body.className = 'm115-sidebar-settings-body'

  getSortedItems(NAV_ITEMS.filter(item => item.id !== 'wangpan')).forEach((item) => {
    const row = doc.createElement('label')
    row.className = 'm115-sidebar-settings-row'

    const itemMain = doc.createElement('span')
    itemMain.className = 'm115-sidebar-settings-item-main'

    const itemIcon = doc.createElement('i')
    itemIcon.className = 'm115-sidebar-settings-item-icon'
    itemIcon.style.backgroundImage = `url("${item.icon}")`

    const checkbox = doc.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.checked = enabledIds.has(item.id)
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) enabledIds.add(item.id)
      else enabledIds.delete(item.id)
      saveEnabledIds(doc, enabledIds)
      renderSidebar(doc, enabledIds)
    })

    const text = doc.createElement('span')
    text.textContent = item.title

    itemMain.appendChild(itemIcon)
    itemMain.appendChild(text)
    row.appendChild(itemMain)
    row.appendChild(checkbox)
    body.appendChild(row)
  })

  const footer = doc.createElement('div')
  footer.className = 'm115-sidebar-settings-footer'

  const resetBtn = doc.createElement('button')
  resetBtn.type = 'button'
  resetBtn.textContent = '重置默认'
  resetBtn.addEventListener('click', () => {
    const next = new Set(NAV_ITEMS.filter(item => item.defaultEnabled).map(item => item.id))
    enabledIds.clear()
    next.forEach(id => enabledIds.add(id))
    saveEnabledIds(doc, enabledIds)
    renderSidebar(doc, enabledIds)
    closeSettings(doc)
  })

  const closeBtn = doc.createElement('button')
  closeBtn.type = 'button'
  closeBtn.textContent = '关闭'
  closeBtn.addEventListener('click', () => closeSettings(doc))

  footer.appendChild(resetBtn)
  footer.appendChild(closeBtn)

  panel.appendChild(header)
  panel.appendChild(body)
  panel.appendChild(footer)
  overlay.appendChild(panel)
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeSettings(doc)
  })
  doc.body.appendChild(overlay)
}

export function initSidebar(doc: Document) {
  injectSidebarPrehide(doc)

  const leftSidebar = doc.querySelector('.container-leftside')
  const topList = doc.querySelector('.container-leftside .top-side .navigation-ceiling ul') as HTMLElement | null
  if (!leftSidebar || !topList) return

  ;['wangpan', 'home', 'vip', 'add'].forEach((id) => {
    const node = leftSidebar.querySelector(`li[mode_btn="${id}"]`) as HTMLElement | null
    if (node) node.style.display = 'none'
  })

  leftSidebar.querySelectorAll('#js_left_notice, #js_feedback_main, a[onclick*="CommonHeader.showClientDownLoad"]').forEach((node) => {
    (node.parentElement as HTMLElement | null)?.style.setProperty('display', 'none')
  })

  const enabledIds = getEnabledIds(doc)
  renderSidebar(doc, enabledIds)

  if (!doc.body.dataset.m115SidebarObserved) {
    doc.body.dataset.m115SidebarObserved = '1'
    const observer = new MutationObserver(() => updateSelection(doc))
    observer.observe(doc.body, { childList: true, subtree: true })
  }
}
