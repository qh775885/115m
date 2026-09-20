import { getSettings, subscribeSettings } from '../../shared/settings'
import { openSettingsModal } from '../ui/settings-modal'

interface SidebarNavItem {
  id: string
  title: string
  icon: string
  href: string
  dataNav?: string
  defaultEnabled: boolean
}

const SIDEBAR_ID = 'm115-sidebar-nav'
const SIDEBAR_PREHIDE_ID = 'm115-sidebar-prehide'
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
  settingsBtn.addEventListener('click', () => {
    openSettingsModal(doc, {
      activeTab: 'nav',
      onSidebarChange: (nextIds) => {
        renderSidebar(doc, nextIds)
      },
    })
  })
  settingsLi.appendChild(settingsBtn)
  bottomList.appendChild(settingsLi)

  updateSelection(doc)
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

  const settings = getSettings()
  const enabledIds = new Set(settings.sidebarEnabledIds)
  renderSidebar(doc, enabledIds)

  subscribeSettings((nextSettings) => {
    renderSidebar(doc, new Set(nextSettings.sidebarEnabledIds))
  })

  if (!doc.body.dataset.m115SidebarObserved) {
    doc.body.dataset.m115SidebarObserved = '1'
    const observer = new MutationObserver(() => updateSelection(doc))
    observer.observe(doc.body, { childList: true, subtree: true })
  }
}
