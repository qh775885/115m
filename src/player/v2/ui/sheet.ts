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
        itemEl.className = `m115-v2-sheet-item ${item.id === activeId ? 'selected' : ''}`
        itemEl.innerHTML = `
          <span>${item.label}</span>
          ${item.badge ? `<span style="font-size:10px;opacity:0.6">${item.badge}</span>` : ''}
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
