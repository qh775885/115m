import { UI_LAYER } from './ui-layer'
import { escapeHtml } from '../../shared/utils'
import { Icons } from '../../shared/icons'
import { canUseRuntimeMessaging, getRuntimeApi } from './runtime'
import {
  apiCreateFolder,
  apiFetchFolders,
  apiMoveFile,
  apiSearchFolders,
  type BreadcrumbItem,
  type FolderItem,
} from './move-dialog-api'

// ─── Types ───
interface MoveDialogResult {
  moved: boolean
  targetCid?: string
}

interface RecentMoveRecord {
  cid: string
  name: string
  path: string      // 用于显示的路径文本
  timestamp: number
}

const RECENT_MOVES_KEY = '115m_recent_moves'
const MAX_RECENT = 8

// ─── CSS Styles ───
const DIALOG_STYLES = `
  .move-dialog-mask {
    position: fixed; inset: 0; z-index: ${UI_LAYER.modal};
    background: rgba(0,0,0,.55); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    animation: mdFadeIn .2s ease;
  }
  @keyframes mdFadeIn { from { opacity: 0 } to { opacity: 1 } }
  @keyframes mdSlideUp { from { opacity: 0; transform: translateY(20px) scale(.97) } to { opacity: 1; transform: translateY(0) scale(1) } }

  .move-dialog-box {
    width: 640px; max-width: 92vw; max-height: 80vh;
    background: #f7f8fa; border-radius: 16px;
    box-shadow: 0 24px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.06);
    display: flex; flex-direction: column;
    animation: mdSlideUp .25s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1f2329;
  }

  .move-dialog-header {
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; padding: 18px 24px 12px; border-bottom: 1px solid rgba(15,23,42,.08);
    flex-shrink: 0;
  }
  .move-dialog-header h3 {
    margin: 0; font-size: 16px; font-weight: 600; color: #111827;
  }
  .move-dialog-header-side {
    display: flex; align-items: center; gap: 12px; min-width: 0;
  }
  .move-dialog-close {
    width: 32px; height: 32px; border-radius: 8px; border: none;
    background: transparent; color: rgba(15,23,42,.45);
    cursor: pointer; font-size: 20px; line-height: 1;
    display: flex; align-items: center; justify-content: center;
    transition: all .15s;
  }
  .move-dialog-close:hover { background: rgba(15,23,42,.06); color: #111827; }

  .move-dialog-toolbar {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 12px 24px 10px; flex-shrink: 0;
  }
  .move-dialog-toolbar-left {
    display: flex; align-items: center; gap: 8px;
  }
  .move-dialog-toolbar-tip {
    font-size: 12px; color: rgba(15,23,42,.45); white-space: nowrap;
  }
  .move-dialog-search {
    width: 220px; max-width: 32vw; height: 36px; border-radius: 999px;
    border: 1px solid rgba(15,23,42,.1); background: rgba(255,255,255,.96);
    padding: 0 14px; color: #111827; font-size: 13px;
    outline: none; transition: border-color .15s; box-sizing: border-box;
  }
  .move-dialog-search::placeholder { color: rgba(15,23,42,.35); }
  .move-dialog-search:focus { border-color: rgba(79,140,255,.6); }

  .move-dialog-tbtn {
    height: 36px; padding: 0 14px; border-radius: 8px; border: none;
    background: #fff; color: rgba(15,23,42,.72);
    font-size: 13px; cursor: pointer; white-space: nowrap;
    display: flex; align-items: center; gap: 5px;
    transition: all .15s; box-shadow: inset 0 0 0 1px rgba(15,23,42,.08);
  }
  .move-dialog-tbtn:hover { background: #fdfefe; color: #111827; box-shadow: inset 0 0 0 1px rgba(79,140,255,.28); }
  .move-dialog-tbtn svg { width: 16px; height: 16px; }

  .move-dialog-crumbs {
    display: flex; align-items: center; gap: 2px;
    padding: 0 24px 10px; flex-shrink: 0; flex-wrap: wrap;
    font-size: 13px; min-height: 28px;
  }
  .move-dialog-crumb {
    background: none; border: none; color: rgba(37,99,235,.92);
    cursor: pointer; padding: 2px 6px; border-radius: 4px;
    font-size: 13px; transition: all .12s;
  }
  .move-dialog-crumb:hover { background: rgba(79,140,255,.1); color: #2563eb; }
  .move-dialog-crumb.current {
    color: rgba(15,23,42,.56); cursor: default; pointer-events: none;
  }
  .move-dialog-crumb-sep { color: rgba(15,23,42,.24); font-size: 11px; margin: 0 1px; }

  .move-dialog-list {
    flex: 1; overflow-y: auto; padding: 0 16px 8px;
    min-height: 200px; max-height: 50vh;
    background: #fff; margin: 0 16px; border-radius: 12px;
    box-shadow: inset 0 0 0 1px rgba(15,23,42,.06);
  }
  .move-dialog-list::-webkit-scrollbar { width: 5px; }
  .move-dialog-list::-webkit-scrollbar-track { background: transparent; }
  .move-dialog-list::-webkit-scrollbar-thumb { background: rgba(15,23,42,.12); border-radius: 4px; }

  .move-dialog-item {
    display: flex; align-items: center; gap: 10px;
    padding: 12px; border-radius: 10px; cursor: pointer;
    transition: background .12s; user-select: none;
    border-bottom: 1px solid rgba(15,23,42,.06);
  }
  .move-dialog-item:last-child { border-bottom: none; }
  .move-dialog-item:hover { background: rgba(37,99,235,.04); }
  .move-dialog-item.selected { background: rgba(79,140,255,.12); }

  .move-dialog-item-icon {
    width: 36px; height: 36px; border-radius: 6px;
    background: linear-gradient(180deg, #ffd35c 0%, #ffbf1a 100%);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; box-shadow: inset 0 0 0 1px rgba(204,138,0,.14);
  }
  .move-dialog-item-icon svg { width: 20px; height: 20px; fill: #fff7d1; }

  .move-dialog-item-name {
    flex: 1; font-size: 14px; color: #111827;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .move-dialog-item-meta {
    margin-top: 3px; font-size: 11px; color: rgba(15,23,42,.38);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .move-dialog-item-arrow {
    color: rgba(15,23,42,.2); font-size: 16px; flex-shrink: 0;
    transition: color .12s;
  }
  .move-dialog-item:hover .move-dialog-item-arrow { color: rgba(15,23,42,.42); }

  .move-dialog-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 48px 20px; color: rgba(15,23,42,.3); font-size: 14px; gap: 8px;
  }
  .move-dialog-loading {
    display: flex; align-items: center; justify-content: center;
    padding: 48px 20px; color: rgba(15,23,42,.4); font-size: 14px; gap: 8px;
  }
  .move-dialog-spinner {
    width: 20px; height: 20px; border: 2px solid rgba(15,23,42,.12);
    border-top-color: #5fa0ff; border-radius: 50%;
    animation: mdSpin .7s linear infinite;
  }
  @keyframes mdSpin { to { transform: rotate(360deg) } }

  .move-dialog-footer {
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
    padding: 14px 24px 18px; border-top: 1px solid rgba(15,23,42,.08);
    flex-shrink: 0;
  }
  .move-dialog-footer-tip {
    margin-right: auto; font-size: 12px; color: rgba(15,23,42,.42);
  }
  .move-dialog-btn {
    width: 116px; height: 38px; padding: 0 14px; border-radius: 8px; border: none;
    font-size: 14px; cursor: pointer; font-weight: 500;
    transition: all .15s; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 0 0 116px;
    line-height: 38px;
  }
  .move-dialog-btn span {
    min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .move-dialog-btn.cancel {
    background: #fff; color: rgba(15,23,42,.72); box-shadow: inset 0 0 0 1px rgba(15,23,42,.08);
  }
  .move-dialog-btn.cancel:hover { background: #f3f4f6; }
  .move-dialog-btn.primary {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: #fff; box-shadow: 0 2px 12px rgba(59,130,246,.3);
  }
  .move-dialog-btn.primary:hover {
    box-shadow: 0 4px 20px rgba(59,130,246,.45); transform: translateY(-1px);
  }
  .move-dialog-btn.primary:disabled {
    opacity: .4; cursor: not-allowed; transform: none;
    box-shadow: none;
  }

  .move-dialog-newfolder {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 16px 12px; flex-shrink: 0;
  }
  .move-dialog-newfolder input {
    flex: 1; height: 36px; border-radius: 8px;
    border: 1px solid rgba(79,140,255,.4); background: #fff;
    padding: 0 12px; color: #111827; font-size: 13px;
    outline: none;
  }
  .move-dialog-newfolder input:focus { border-color: rgba(79,140,255,.7); }

  .move-dialog-recent-header {
    padding: 12px 12px 6px; font-size: 12px; color: rgba(15,23,42,.34);
    text-transform: uppercase; letter-spacing: .5px;
  }

  @media (max-width: 720px) {
    .move-dialog-header {
      align-items: flex-start;
      flex-direction: column;
    }
    .move-dialog-header-side {
      width: 100%;
    }
    .move-dialog-search {
      width: 100%;
      max-width: none;
      flex: 1 1 auto;
    }
    .move-dialog-toolbar {
      flex-direction: column;
      align-items: stretch;
    }
    .move-dialog-toolbar-left {
      width: 100%;
      overflow-x: auto;
    }
    .move-dialog-toolbar-tip {
      white-space: normal;
    }
    .move-dialog-footer {
      flex-wrap: wrap;
    }
    .move-dialog-btn {
      width: 104px;
      flex-basis: 104px;
    }
    .move-dialog-footer-tip {
      width: 100%;
      margin-right: 0;
    }
  }
`

// ─── SVG Icons ───
const ICON_FOLDER = Icons.FolderTree
const ICON_FOLDER_PLUS = Icons.FolderPlus
const ICON_CLOCK = Icons.Clock

// ─── Recent Moves Storage ───
function getRecentMoves(): RecentMoveRecord[] {
  try {
    const raw = localStorage.getItem(RECENT_MOVES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRecentMove(record: Omit<RecentMoveRecord, 'timestamp'>) {
  const recent = getRecentMoves().filter(r => r.cid !== record.cid)
  recent.unshift({ ...record, timestamp: Date.now() })
  if (recent.length > MAX_RECENT) recent.length = MAX_RECENT
  localStorage.setItem(RECENT_MOVES_KEY, JSON.stringify(recent))
}

function getLastMoveRecord(): RecentMoveRecord | null {
  return getRecentMoves()[0] || null
}

// ─── Dialog Class ───
export class MoveDialog {
  private mask!: HTMLDivElement
  private listEl!: HTMLDivElement
  private crumbsEl!: HTMLDivElement
  private searchInput!: HTMLInputElement
  private moveBtn!: HTMLButtonElement
  private newFolderRow!: HTMLDivElement
  private styleEl!: HTMLStyleElement

  private currentCid = '0'
  private selectedCid: string | null = null
  private breadcrumbs: BreadcrumbItem[] = [{ cid: '0', name: '根目录' }]
  private folders: FolderItem[] = []
  private isSearchMode = false
  private isRecentMode = false
  private isNewFolderVisible = false

  private resolvePromise!: (result: MoveDialogResult) => void

  constructor(
    private fileId: string,
    private initialCid: string,
    private onMoved: () => void,
  ) {}

  show(): Promise<MoveDialogResult> {
    return new Promise((resolve) => {
      this.resolvePromise = resolve
      this.injectStyles()
      this.buildDOM()
      const lastMove = getLastMoveRecord()
      this.loadFolder(lastMove?.cid || this.initialCid || '0')
    })
  }

  private injectStyles() {
    this.styleEl = document.createElement('style')
    this.styleEl.textContent = DIALOG_STYLES
    document.head.appendChild(this.styleEl)
  }

  private buildDOM() {
    // ── Mask ──
    this.mask = document.createElement('div')
    this.mask.className = 'move-dialog-mask m115-interactive'
    this.mask.addEventListener('pointerdown', (e) => e.stopPropagation())
    this.mask.addEventListener('mousedown', (e) => e.stopPropagation())
    this.mask.addEventListener('click', (e) => {
      if (e.target === this.mask) this.close({ moved: false })
    })

    // ── Dialog Box ──
    const box = document.createElement('div')
    box.className = 'move-dialog-box m115-interactive'
    box.addEventListener('pointerdown', (e) => e.stopPropagation())
    box.addEventListener('mousedown', (e) => e.stopPropagation())
    box.addEventListener('click', (e) => e.stopPropagation())

    // ── Header ──
    const header = document.createElement('div')
    header.className = 'move-dialog-header'
    header.innerHTML = `<h3>打开要移动的目标文件夹</h3>`

    const headerSide = document.createElement('div')
    headerSide.className = 'move-dialog-header-side'

    this.searchInput = document.createElement('input')
    this.searchInput.className = 'move-dialog-search'
    this.searchInput.type = 'text'
    this.searchInput.placeholder = '搜索文件夹'
    let searchTimer: ReturnType<typeof setTimeout>
    this.searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer)
      searchTimer = setTimeout(() => this.onSearch(), 400)
    })
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.searchInput.value = ''
        this.exitSearchMode()
      }
    })

    const closeBtn = document.createElement('button')
    closeBtn.className = 'move-dialog-close'
    closeBtn.innerHTML = '✕'
    closeBtn.addEventListener('click', () => this.close({ moved: false }))
    headerSide.append(this.searchInput, closeBtn)
    header.appendChild(headerSide)

    // ── Toolbar ──
    const toolbar = document.createElement('div')
    toolbar.className = 'move-dialog-toolbar'
    const toolbarLeft = document.createElement('div')
    toolbarLeft.className = 'move-dialog-toolbar-left'
    const toolbarTip = document.createElement('div')
    toolbarTip.className = 'move-dialog-toolbar-tip'
    toolbarTip.textContent = '单击文件夹进入，底部按钮默认移动到当前目录'

    const newFolderBtn = document.createElement('button')
    newFolderBtn.className = 'move-dialog-tbtn'
    newFolderBtn.innerHTML = `${ICON_FOLDER_PLUS}<span>新建文件夹</span>`
    newFolderBtn.addEventListener('click', () => this.toggleNewFolder())

    const recentBtn = document.createElement('button')
    recentBtn.className = 'move-dialog-tbtn'
    recentBtn.innerHTML = `${ICON_CLOCK}<span>最近移动记录</span>`
    recentBtn.addEventListener('click', () => this.showRecent())

    toolbarLeft.append(newFolderBtn, recentBtn)
    toolbar.append(toolbarLeft, toolbarTip)

    // ── New Folder Row (hidden by default) ──
    this.newFolderRow = document.createElement('div')
    this.newFolderRow.className = 'move-dialog-newfolder'
    this.newFolderRow.style.display = 'none'
    const nfInput = document.createElement('input')
    nfInput.placeholder = '输入新文件夹名称'
    nfInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.createFolder(nfInput.value.trim())
      if (e.key === 'Escape') this.toggleNewFolder()
    })
    const nfConfirm = document.createElement('button')
    nfConfirm.className = 'move-dialog-btn primary'
    nfConfirm.textContent = '创建'
    nfConfirm.style.width = '88px'
    nfConfirm.style.flexBasis = '88px'
    nfConfirm.style.height = '36px'
    nfConfirm.style.fontSize = '13px'
    nfConfirm.addEventListener('click', () => this.createFolder(nfInput.value.trim()))
    const nfCancel = document.createElement('button')
    nfCancel.className = 'move-dialog-btn cancel'
    nfCancel.textContent = '取消'
    nfCancel.style.width = '72px'
    nfCancel.style.flexBasis = '72px'
    nfCancel.style.height = '36px'
    nfCancel.style.fontSize = '13px'
    nfCancel.addEventListener('click', () => this.toggleNewFolder())
    this.newFolderRow.append(nfInput, nfConfirm, nfCancel)

    // ── Breadcrumbs ──
    this.crumbsEl = document.createElement('div')
    this.crumbsEl.className = 'move-dialog-crumbs'

    // ── Folder List ──
    this.listEl = document.createElement('div')
    this.listEl.className = 'move-dialog-list'

    // ── Footer ──
    const footer = document.createElement('div')
    footer.className = 'move-dialog-footer'
    const footerTip = document.createElement('div')
    footerTip.className = 'move-dialog-footer-tip'
    footerTip.textContent = '当前目录就是移动目标，不需要再额外选中'
    const cancelBtn = document.createElement('button')
    cancelBtn.className = 'move-dialog-btn cancel'
    cancelBtn.textContent = '取消'
    cancelBtn.addEventListener('click', () => this.close({ moved: false }))

    this.moveBtn = document.createElement('button')
    this.moveBtn.className = 'move-dialog-btn primary'
    this.moveBtn.textContent = '移动到此'
    this.moveBtn.addEventListener('click', () => this.doMove())

    footer.append(footerTip, cancelBtn, this.moveBtn)

    // ── Assemble ──
    box.append(header, toolbar, this.newFolderRow, this.crumbsEl, this.listEl, footer)
    this.mask.appendChild(box)
    document.body.appendChild(this.mask)

    // Focus search
    setTimeout(() => this.searchInput.focus(), 100)
  }

  // ─── Loading & Rendering ───

  private showLoading() {
    this.listEl.innerHTML = `<div class="move-dialog-loading"><div class="move-dialog-spinner"></div>加载中...</div>`
  }

  private async loadFolder(cid: string) {
    this.isSearchMode = false
    this.isRecentMode = false
    this.currentCid = cid
    this.selectedCid = null
    this.showLoading()

    const { folders, path, error } = await apiFetchFolders(cid)
    this.folders = folders
    if (path.length > 0) {
      this.breadcrumbs = path
    }
    this.renderBreadcrumbs()
    if (error) {
      this.renderLoadError(error)
      return
    }
    this.renderFolders()
    this.updateMoveButtonLabel()
  }

  private renderLoadError(message: string) {
    this.listEl.innerHTML = ''
    const wrap = document.createElement('div')
    wrap.className = 'move-dialog-error'
    wrap.innerHTML = `
      <span style="font-size:32px">⚠️</span>
      <span>加载失败：${this.escapeHtml(message)}</span>
    `
    const retryBtn = document.createElement('button')
    retryBtn.className = 'move-dialog-btn cancel'
    retryBtn.textContent = '重试'
    retryBtn.style.marginTop = '12px'
    retryBtn.addEventListener('click', () => this.loadFolder(this.currentCid))
    wrap.appendChild(retryBtn)
    this.listEl.appendChild(wrap)
  }

  private renderBreadcrumbs() {
    this.crumbsEl.innerHTML = ''
    if (this.isSearchMode) {
      const tag = document.createElement('span')
      tag.className = 'move-dialog-crumb current'
      tag.textContent = '🔍 搜索结果'
      this.crumbsEl.appendChild(tag)

      const backBtn = document.createElement('button')
      backBtn.className = 'move-dialog-crumb'
      backBtn.textContent = '← 返回'
      backBtn.style.marginLeft = '8px'
      backBtn.addEventListener('click', () => this.exitSearchMode())
      this.crumbsEl.appendChild(backBtn)
      return
    }
    if (this.isRecentMode) {
      const tag = document.createElement('span')
      tag.className = 'move-dialog-crumb current'
      tag.textContent = '🕐 最近移动'
      this.crumbsEl.appendChild(tag)

      const backBtn = document.createElement('button')
      backBtn.className = 'move-dialog-crumb'
      backBtn.textContent = '← 返回'
      backBtn.style.marginLeft = '8px'
      backBtn.addEventListener('click', () => this.exitSearchMode())
      this.crumbsEl.appendChild(backBtn)
      return
    }

    this.breadcrumbs.forEach((bc, i) => {
      if (i > 0) {
        const sep = document.createElement('span')
        sep.className = 'move-dialog-crumb-sep'
        sep.textContent = '›'
        this.crumbsEl.appendChild(sep)
      }
      const btn = document.createElement('button')
      btn.className = 'move-dialog-crumb'
      if (i === this.breadcrumbs.length - 1) btn.classList.add('current')
      btn.textContent = bc.name
      btn.addEventListener('click', () => {
        if (i < this.breadcrumbs.length - 1) this.loadFolder(bc.cid)
      })
      this.crumbsEl.appendChild(btn)
    })
  }

  private renderFolders() {
    this.listEl.innerHTML = ''
    if (this.folders.length === 0) {
      this.listEl.innerHTML = `<div class="move-dialog-empty"><span style="font-size:32px">📂</span><span>当前目录下没有文件夹</span></div>`
      return
    }

    for (const folder of this.folders) {
      const row = document.createElement('div')
      row.className = 'move-dialog-item'
      row.innerHTML = `
        <div class="move-dialog-item-icon">${ICON_FOLDER}</div>
        <div class="move-dialog-item-name">${this.escapeHtml(folder.name)}</div>
        <div class="move-dialog-item-arrow">›</div>
      `

      // Single click = enter
      row.addEventListener('click', (e) => {
        e.stopPropagation()
        this.loadFolder(folder.cid)
      })

      this.listEl.appendChild(row)
    }
  }

  private updateMoveButtonLabel() {
    if (!this.moveBtn) return
    if (this.isRecentMode) {
      this.moveBtn.textContent = '进入后再移动'
      this.moveBtn.title = '进入后再移动'
      this.moveBtn.disabled = true
      return
    }

    if (this.isSearchMode) {
      this.moveBtn.textContent = '进入结果后再移动'
      this.moveBtn.title = '进入结果后再移动'
      this.moveBtn.disabled = true
      return
    }

    this.moveBtn.textContent = '移动到此'
    this.moveBtn.title = `移动到：${this.getTargetName(this.selectedCid || this.currentCid)}`
    this.moveBtn.disabled = false
  }

  // ─── Actions ───

  private async onSearch() {
    const keyword = this.searchInput.value.trim()
    if (!keyword) {
      this.exitSearchMode()
      return
    }

    this.isSearchMode = true
    this.isRecentMode = false
    this.selectedCid = null
    this.showLoading()

    const folders = await apiSearchFolders(keyword)
    this.folders = folders
    this.renderBreadcrumbs()
    this.renderFolders()

    if (folders.length === 0) {
      this.listEl.innerHTML = `<div class="move-dialog-empty"><span style="font-size:32px">🔍</span><span>没有找到匹配的文件夹</span></div>`
    }
  }

  private exitSearchMode() {
    this.searchInput.value = ''
    this.isSearchMode = false
    this.isRecentMode = false
    this.loadFolder(this.currentCid)
  }

  private showRecent() {
    this.isRecentMode = true
    this.isSearchMode = false
    this.selectedCid = null

    const recent = getRecentMoves()
    this.renderBreadcrumbs()
    this.updateMoveButtonLabel()

    this.listEl.innerHTML = ''
    if (recent.length === 0) {
      this.listEl.innerHTML = `<div class="move-dialog-empty"><span style="font-size:32px">🕐</span><span>暂无最近移动记录</span></div>`
      return
    }

    const header = document.createElement('div')
    header.className = 'move-dialog-recent-header'
    header.textContent = '最近移动到'
    this.listEl.appendChild(header)

    for (const record of recent) {
      const row = document.createElement('div')
      row.className = 'move-dialog-item'
      row.innerHTML = `
        <div class="move-dialog-item-icon">${ICON_FOLDER}</div>
        <div style="flex:1;overflow:hidden;">
          <div class="move-dialog-item-name">${this.escapeHtml(record.name)}</div>
          <div class="move-dialog-item-meta">${this.escapeHtml(record.path)}</div>
        </div>
        <div class="move-dialog-item-arrow">›</div>
      `
      row.addEventListener('click', (e) => {
        e.stopPropagation()
        this.loadFolder(record.cid)
      })
      this.listEl.appendChild(row)
    }
  }

  private toggleNewFolder() {
    this.isNewFolderVisible = !this.isNewFolderVisible
    this.newFolderRow.style.display = this.isNewFolderVisible ? 'flex' : 'none'
    if (this.isNewFolderVisible) {
      const input = this.newFolderRow.querySelector('input') as HTMLInputElement
      input.value = ''
      setTimeout(() => input.focus(), 50)
    }
  }

  private async createFolder(name: string) {
    if (!name) return

    const parentCid = this.selectedCid || this.currentCid
    const confirmBtn = this.newFolderRow.querySelector('.primary') as HTMLButtonElement
    confirmBtn.textContent = '创建中...'
    confirmBtn.disabled = true

    const result = await apiCreateFolder(parentCid, name)
    confirmBtn.textContent = '创建'
    confirmBtn.disabled = false

    if (result.ok) {
      this.toggleNewFolder()
      // If parent is current browsing dir, reload to show new folder
      if (parentCid === this.currentCid) {
        await this.loadFolder(this.currentCid)
      }
      // Auto-select newly created folder
      if (result.cid) {
        this.selectedCid = result.cid
        const items = this.listEl.querySelectorAll('.move-dialog-item')
        items.forEach(item => {
          const nameEl = item.querySelector('.move-dialog-item-name')
          if (nameEl?.textContent === name) {
            item.classList.add('selected')
          }
        })
        this.updateMoveButtonLabel()
      }
    } else {
      this.showInlineError(result.error || '创建失败')
    }
  }

  private async doMove() {
    // Target = selected folder, or current browsing folder
    const targetCid = this.selectedCid || this.currentCid

    if (!targetCid || targetCid === '0') {
      // 不建议移动到根目录，但允许
    }

    this.moveBtn.textContent = '移动中...'
    this.moveBtn.disabled = true

    const result = await apiMoveFile(this.fileId, targetCid)

    if (result.ok) {
      // Save to recent
      const targetName = this.getTargetName(targetCid)
      const pathStr = this.breadcrumbs.map(b => b.name).join(' > ')
      saveRecentMove({ cid: targetCid, name: targetName, path: pathStr })

      // Notify background to refresh 115 wangpan tabs
      if (canUseRuntimeMessaging()) {
        getRuntimeApi()?.sendMessage({ type: 'REQUEST_MOVE_REFRESH' }).catch(() => {})
      }

      this.close({ moved: true, targetCid })
      this.onMoved()
    } else {
      this.updateMoveButtonLabel()
      this.moveBtn.disabled = false
      this.showInlineError(result.error || '移动失败')
    }
  }

  private getTargetName(cid: string): string {
    // Check if it's one of the displayed folders
    const folder = this.folders.find(f => f.cid === cid)
    if (folder) return folder.name
    // Check breadcrumbs
    const crumb = this.breadcrumbs.find(b => b.cid === cid)
    if (crumb) return crumb.name
    return '未知文件夹'
  }

  private showInlineError(msg: string) {
    // Show a temporary toast within the dialog
    const toast = document.createElement('div')
    toast.style.cssText = `
      position: absolute; bottom: 70px; left: 50%; transform: translateX(-50%);
      background: #e74c3c; color: #fff; padding: 8px 20px; border-radius: 8px;
      font-size: 13px; box-shadow: 0 4px 16px rgba(231,76,60,.4);
      animation: mdFadeIn .2s ease; z-index: 10;
    `
    toast.textContent = msg
    this.mask.querySelector('.move-dialog-box')!.appendChild(toast)
    setTimeout(() => toast.remove(), 3000)
  }

  private close(result: MoveDialogResult) {
    this.mask.style.opacity = '0'
    this.mask.style.transition = 'opacity .15s'
    setTimeout(() => {
      this.mask.remove()
      this.styleEl.remove()
    }, 150)
    this.resolvePromise(result)
  }

  private escapeHtml(str: string): string {
    return escapeHtml(str)
  }
}
