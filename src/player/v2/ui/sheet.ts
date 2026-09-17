import { Icons } from '../../../shared/icons'

export interface SheetItem {
  id: string | number
  label: string
  subLabel?: string
  badge?: string
}

export function createFloatingSheet() {
  const sheet = document.createElement('div')
  sheet.className = 'm115-v2-sheet'

  const header = document.createElement('div')
  header.className = 'm115-v2-sheet-header'
  sheet.appendChild(header)

  const listContainer = document.createElement('div')
  sheet.appendChild(listContainer)

  let activeId: string | number | null = null
  let onSelectCallback: ((item: SheetItem) => void) | null = null

  return {
    element: sheet,
    open(title: string, items: SheetItem[], currentId: string | number, onSelect: (item: SheetItem) => void) {
      header.textContent = title
      activeId = currentId
      onSelectCallback = onSelect
      listContainer.innerHTML = ''

      items.forEach((item) => {
        const itemEl = document.createElement('div')
        const isSelected = item.id === activeId
        itemEl.className = `m115-v2-sheet-item ${isSelected ? 'selected' : ''}`
        itemEl.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="width:14px;height:14px;display:flex;align-items:center;justify-content:center;opacity:${isSelected ? '1' : '0'};color:var(--m115-primary);">
              ${Icons.Check()}
            </span>
            <span>${item.label}</span>
          </div>
          ${item.badge ? `<span style="font-size:10px;padding:2px 6px;border-radius:4px;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);">${item.badge}</span>` : ''}
        `
        itemEl.onclick = (e) => {
          e.stopPropagation()
          activeId = item.id
          onSelectCallback?.(item)
          sheet.classList.remove('open')
        }
        listContainer.appendChild(itemEl)
      })

      sheet.classList.add('open')
    },
    close() {
      sheet.classList.remove('open')
    },
    isOpen() {
      return sheet.classList.contains('open')
    },
  }
}
