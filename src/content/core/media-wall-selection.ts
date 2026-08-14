export type MediaWallSelectableItem = {
  sourceItem: HTMLElement
  select: (event?: MouseEvent) => void
}

export function isWallSourceItemSelected(sourceItem: HTMLElement): boolean {
  const nativeInput = sourceItem.querySelector<HTMLInputElement>('input[type="checkbox"]')
  return !!nativeInput?.checked
    || sourceItem.classList.contains('selected')
    || sourceItem.classList.contains('cur')
    || sourceItem.getAttribute('selected') === 'selected'
    || sourceItem.getAttribute('check') === '1'
    || sourceItem.getAttribute('is_selected') === '1'
    || sourceItem.getAttribute('data-selected') === 'true'
    || sourceItem.getAttribute('aria-selected') === 'true'
}

function buildSelectionRect(startX: number, startY: number, currentX: number, currentY: number): DOMRect {
  const left = Math.min(startX, currentX)
  const top = Math.min(startY, currentY)
  const width = Math.abs(currentX - startX)
  const height = Math.abs(currentY - startY)
  return new DOMRect(left, top, width, height)
}

function intersectsRect(a: DOMRect, b: DOMRect): boolean {
  return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top
}

function getElementCenterRect(element: HTMLElement): DOMRect {
  const rect = element.getBoundingClientRect()
  const size = 8
  return new DOMRect(rect.left + rect.width / 2 - size / 2, rect.top + rect.height / 2 - size / 2, size, size)
}

function buildDragSelectEvent(event: MouseEvent | null): MouseEvent {
  return new MouseEvent('mousedown', {
    bubbles: true,
    cancelable: true,
    view: window,
    button: 0,
    buttons: 1,
    clientX: event?.clientX ?? 0,
    clientY: event?.clientY ?? 0,
    screenX: event?.screenX ?? 0,
    screenY: event?.screenY ?? 0,
    ctrlKey: true,
    metaKey: event?.metaKey ?? false,
    shiftKey: event?.shiftKey ?? false,
    altKey: event?.altKey ?? false,
  })
}

export function installWallDragSelection<T extends MediaWallSelectableItem>(
  doc: Document,
  host: HTMLElement,
  itemSelector: string,
  getItemByElement: (element: HTMLElement) => T | undefined,
  syncSelectionState: () => void,
) {
  let startX = 0
  let startY = 0
  let dragging = false
  let pointerDown = false
  let selectBox: HTMLElement | null = null
  let latestEvent: MouseEvent | null = null
  let suppressClickUntil = 0
  let selectedDuringDrag = new WeakSet<HTMLElement>()

  const removeSelectBox = () => {
    selectBox?.remove()
    selectBox = null
  }

  const updateSelectBox = (rect: DOMRect) => {
    if (!selectBox) {
      selectBox = doc.createElement('div')
      selectBox.className = 'm115-wall-drag-select-box'
      doc.body.appendChild(selectBox)
    }
    selectBox.style.left = `${rect.left}px`
    selectBox.style.top = `${rect.top}px`
    selectBox.style.width = `${rect.width}px`
    selectBox.style.height = `${rect.height}px`
  }

  const syncSoon = () => {
    syncSelectionState()
    window.setTimeout(syncSelectionState, 0)
    window.setTimeout(syncSelectionState, 80)
  }

  const selectElement = (element: HTMLElement) => {
    const item = getItemByElement(element)
    if (!item || selectedDuringDrag.has(item.sourceItem) || isWallSourceItemSelected(item.sourceItem)) return false
    selectedDuringDrag.add(item.sourceItem)
    item.select(buildDragSelectEvent(latestEvent))
    window.setTimeout(() => {
      syncSelectionState()
    }, 90)
    window.setTimeout(syncSelectionState, 160)
    return true
  }

  const applyDragSelection = (rect: DOMRect, event: MouseEvent) => {
    host.querySelectorAll<HTMLElement>(itemSelector).forEach((element) => {
      if (!intersectsRect(rect, element.getBoundingClientRect()) && !intersectsRect(rect, getElementCenterRect(element))) return
      selectElement(element)
    })
    const pointedElement = doc.elementFromPoint(event.clientX, event.clientY)?.closest(itemSelector) as HTMLElement | null
    if (pointedElement) selectElement(pointedElement)
    syncSoon()
  }

  const onMouseMove = (event: MouseEvent) => {
    if (!pointerDown) return
    latestEvent = event
    const dx = event.clientX - startX
    const dy = event.clientY - startY
    if (!dragging && Math.hypot(dx, dy) < 6) return
    dragging = true
    event.preventDefault()
    event.stopPropagation()
    const rect = buildSelectionRect(startX, startY, event.clientX, event.clientY)
    updateSelectBox(rect)
    applyDragSelection(rect, event)
  }

  const startDragTracking = (event: MouseEvent) => {
    startX = event.clientX
    startY = event.clientY
    latestEvent = event
    pointerDown = true
    dragging = false
    selectedDuringDrag = new WeakSet<HTMLElement>()
    doc.addEventListener('mousemove', onMouseMove, true)
    doc.addEventListener('mouseup', onMouseUp, true)
  }

  const onMouseUp = (event: MouseEvent) => {
    if (!event.isTrusted) return
    if (!pointerDown) return
    latestEvent = event
    if (dragging) {
      event.preventDefault()
      suppressClickUntil = Date.now() + 220
    }
    pointerDown = false
    dragging = false
    removeSelectBox()
    syncSoon()
    doc.removeEventListener('mousemove', onMouseMove, true)
    doc.removeEventListener('mouseup', onMouseUp, true)
  }

  const onHostMouseDown = (event: MouseEvent) => {
    if (event.button !== 0 || !event.isTrusted) return
    const target = event.target as HTMLElement | null
    if (!target || target.closest('.m115-folder-actions,.m115-folder-action-btn')) return
    if (!target.closest(itemSelector) && !target.closest('.m115-folder-grid,.m115-image-grid,.m115-media-wall')) return
    startDragTracking(event)
  }

  const onDocumentMouseDown = (event: MouseEvent) => {
    if (event.button !== 0 || pointerDown || !event.isTrusted) return
    const target = event.target as HTMLElement | null
    if (!target || target.closest('.m115-folder-actions,.m115-folder-action-btn')) return
    const pointedElement = doc.elementFromPoint(event.clientX, event.clientY)
    const inWall = !!target.closest('.m115-media-wall,.list-contents') || !!pointedElement?.closest('.m115-media-wall,.list-contents')
    if (!inWall) return
    startDragTracking(event)
  }

  const onHostClick = (event: MouseEvent) => {
    if (Date.now() > suppressClickUntil) return
    event.preventDefault()
    event.stopPropagation()
  }

  host.addEventListener('mousedown', onHostMouseDown, true)
  doc.addEventListener('mousedown', onDocumentMouseDown, true)
  host.addEventListener('click', onHostClick, true)

  return () => {
    pointerDown = false
    removeSelectBox()
    host.removeEventListener('mousedown', onHostMouseDown, true)
    doc.removeEventListener('mousedown', onDocumentMouseDown, true)
    doc.removeEventListener('mousemove', onMouseMove, true)
    doc.removeEventListener('mouseup', onMouseUp, true)
    host.removeEventListener('click', onHostClick, true)
  }
}
