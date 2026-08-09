import { ARCHIVE_EXTENSIONS, isArchiveFileName, stripArchiveExtension } from '../../shared/archive'

const LAST_ARCHIVE_NAME_KEY = 'm115:last-unarchive-name'

function rememberArchiveName(name: string) {
  try {
    sessionStorage.setItem(LAST_ARCHIVE_NAME_KEY, stripArchiveExtension(name))
  }
  catch {
    return
  }
}

function readRememberedArchiveName(): string | null {
  try {
    const value = sessionStorage.getItem(LAST_ARCHIVE_NAME_KEY)?.trim() || ''
    return value || null
  }
  catch {
    return null
  }
}

function getSelectedArchiveName(doc: Document): string | null {
  const remembered = readRememberedArchiveName()
  if (remembered) {
    return remembered
  }

  const selectors = [
    'li.selected[rel="item"]',
    'li.selected[title]',
    'li.selected[pick_code]',
    'li.selected[pickcode]',
    '[rel="item"].selected',
    '.list-contents li.selected',
    '.list-contents li.cur',
    '.list-contents li.hover',
    '.list-contents [rel="item"].selected',
    '.list-contents [rel="item"].cur',
    '.list-contents [rel="item"].hover',
    '.list-contents [pick_code].selected',
    '.list-contents [pick_code].cur',
    '.list-contents [pick_code].hover',
  ]

  for (const selector of selectors) {
    const node = doc.querySelector<HTMLElement>(selector)
    if (!node) continue

    const name = node?.getAttribute('title')
      || node?.querySelector('.file-name .name')?.textContent?.trim()
      || node?.querySelector('.file-name')?.textContent?.trim()
      || ''

    const icon = (node.getAttribute('ico') || '').toLowerCase()
    const isArchive = isArchiveFileName(name)
      || ARCHIVE_EXTENSIONS.includes(icon)
      || /zip|rar|7z|tar|gz|tgz|bz2|xz/i.test(node.querySelector('.file-typename')?.textContent || '')

    if (name && isArchive) {
      return stripArchiveExtension(name)
    }
  }

  return null
}

function getDialogTitle(dialog: HTMLElement): string {
  return dialog.querySelector('[rel="base_title"]')?.textContent?.trim() || ''
}

function isInsideUnarchiveDialog(target: HTMLElement): boolean {
  const dialog = target.closest<HTMLElement>('.dialog-box.file-select')
  return !!dialog && getDialogTitle(dialog) === '解压到'
}

function hasUnarchiveDialog(doc: Document): boolean {
  return Array.from(doc.querySelectorAll<HTMLElement>('.dialog-box.file-select')).some(dialog => getDialogTitle(dialog) === '解压到')
}

function bindDialogActions(doc: Document) {
  const onClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null
    if (!target) return

    const addDirButton = target.closest<HTMLElement>('[btn="add_dir"]')
    if (addDirButton && isInsideUnarchiveDialog(addDirButton)) {
      scheduleEnhanceCreateFolderDialog(doc)
      return
    }

    const item = target.closest<HTMLElement>('li[pick_code],li[pickcode],div[pick_code],div[pickcode],[rel="item"]')
    if (!item) return

    const name = item.getAttribute('title')
      || item.querySelector('.file-name .name')?.textContent?.trim()
      || item.querySelector('.file-name')?.textContent?.trim()
      || ''

    if (name && isArchiveFileName(name)) {
      rememberArchiveName(name)
    }
  }

  doc.addEventListener('click', onClick, true)
  return () => doc.removeEventListener('click', onClick, true)
}

function fillInput(input: HTMLInputElement, value: string) {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
  input.focus()
  input.setSelectionRange(value.length, value.length)
}

function createFillInfo(doc: Document, archiveName: string): HTMLElement {
  const preview = doc.createElement('div')
  preview.className = 'm115-unzip-fill-preview'
  preview.textContent = archiveName
  preview.title = archiveName
  return preview
}

function createFillButton(doc: Document, input: HTMLInputElement, archiveName: string): HTMLAnchorElement {
  const action = doc.createElement('a')
  action.href = 'javascript:;'
  action.className = 'dgac-cancel m115-unzip-fill-button'
  action.textContent = '一键填充'
  action.title = '使用压缩包名作为文件夹名'
  action.addEventListener('click', (event) => {
    event.preventDefault()
    fillInput(input, archiveName)
  })
  return action
}

function ensureActionLayout(dialog: HTMLElement) {
  const actionRow = dialog.querySelector<HTMLElement>('.dialog-action')
  if (!actionRow || actionRow.classList.contains('m115-unzip-dialog-action')) return
  actionRow.classList.add('m115-unzip-dialog-action')
}

function enhanceCreateFolderDialog(doc: Document): boolean {
  if (!hasUnarchiveDialog(doc)) return false

  const dialogs = Array.from(doc.querySelectorAll<HTMLElement>('.dialog-box.dialog-mini.window-current'))
  for (const dialog of dialogs) {
    if (getDialogTitle(dialog) !== '新建文件夹') {
      continue
    }

    const input = dialog.querySelector<HTMLInputElement>('input[rel="txt"], .dialog-input input.text')
    if (!input) {
      continue
    }

    const archiveName = getSelectedArchiveName(doc)
    if (!archiveName) {
      continue
    }

    const existingPreview = dialog.querySelector<HTMLElement>('.m115-unzip-fill-preview')
    if (existingPreview) {
      existingPreview.textContent = archiveName
      existingPreview.title = archiveName
    }
    else {
      const fillInfo = createFillInfo(doc, archiveName)
      input.parentElement?.insertAdjacentElement('beforebegin', fillInfo)
    }

    ensureActionLayout(dialog)

    if (!dialog.querySelector('.m115-unzip-fill-button')) {
      const cancelButton = dialog.querySelector<HTMLElement>('.dialog-action [btn="cancel"], .dialog-action .dgac-cancel:not(.m115-unzip-fill-button)')
      if (cancelButton?.parentElement) {
        const actionButton = createFillButton(doc, input, archiveName)
        cancelButton.insertAdjacentElement('beforebegin', actionButton)
      }
    }

    return true
  }

  return false
}

function scheduleEnhanceCreateFolderDialog(doc: Document) {
  if (doc.querySelector<HTMLElement>('.dialog-box.dialog-mini.window-current')) {
    enhanceCreateFolderDialog(doc)
    return
  }

  const observer = new MutationObserver(() => {
    const target = doc.querySelector<HTMLElement>('.dialog-box.dialog-mini.window-current')
    if (!target) return
    observer.disconnect()
    enhanceCreateFolderDialog(doc)
  })
  observer.observe(doc.body, { childList: true, subtree: true })
  window.setTimeout(() => observer.disconnect(), 5000)
}

function injectStyles(doc: Document) {
  if (doc.getElementById('m115-unzip-fill-style')) {
    return
  }

  const style = doc.createElement('style')
  style.id = 'm115-unzip-fill-style'
  style.textContent = `
    .dialog-box.dialog-mini .m115-unzip-fill-preview {
      box-sizing: border-box;
      width: calc(100% - 80px);
      margin: 0 40px 8px;
      padding: 0 2px;
      color: #2563eb;
      font-size: 12px;
      line-height: 1.6;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dialog-action.m115-unzip-dialog-action {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 12px;
    }

    .dialog-action.m115-unzip-dialog-action .m115-unzip-fill-button,
    .dialog-action.m115-unzip-dialog-action .dgac-cancel,
    .dialog-action.m115-unzip-dialog-action .dgac-confirm {
      float: none;
      margin: 0;
    }
  `
  doc.head?.appendChild(style)
}

export function initUnarchiveHelper(doc: Document) {
  injectStyles(doc)
  const cleanup = bindDialogActions(doc)
  return cleanup
}
