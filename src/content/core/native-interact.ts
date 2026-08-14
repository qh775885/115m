import { getContextMenuAnchor, getOpenAnchor, getSelectionTarget } from './native-dom'

function dispatchMouseSequence(target: HTMLElement, events: Array<{ type: string, init: MouseEventInit }>) {
  events.forEach(({ type, init }) => {
    target.dispatchEvent(new MouseEvent(type, init))
  })
}

function withVisibleSourceItem(sourceItem: HTMLElement, hiddenClass: string, apply: () => void) {
  sourceItem.classList.remove(hiddenClass)

  const previousStyle = sourceItem.getAttribute('style') || ''
  sourceItem.style.setProperty('position', 'fixed', 'important')
  sourceItem.style.setProperty('width', '1px', 'important')
  sourceItem.style.setProperty('height', '1px', 'important')
  sourceItem.style.setProperty('overflow', 'hidden', 'important')
  sourceItem.style.setProperty('opacity', '0', 'important')

  apply()

  window.setTimeout(() => {
    if (previousStyle) sourceItem.setAttribute('style', previousStyle)
    else sourceItem.removeAttribute('style')
    sourceItem.classList.add(hiddenClass)
  }, 0)
}

function buildMouseInit(event?: MouseEvent, button = 0): MouseEventInit {
  return {
    bubbles: true,
    cancelable: true,
    view: window,
    button,
    buttons: button === 2 ? 2 : 1,
    clientX: event?.clientX ?? 0,
    clientY: event?.clientY ?? 0,
    screenX: event?.screenX ?? 0,
    screenY: event?.screenY ?? 0,
    ctrlKey: event?.ctrlKey ?? false,
    metaKey: event?.metaKey ?? false,
    shiftKey: event?.shiftKey ?? false,
    altKey: event?.altKey ?? false,
  }
}

function toggleNativeFolderSelection(sourceItem: HTMLElement, hiddenClass: string, event?: MouseEvent) {
  withVisibleSourceItem(sourceItem, hiddenClass, () => {
    const target = getSelectionTarget(sourceItem)
    const rect = target.getBoundingClientRect()
    const init = buildMouseInit(event)
    init.clientX = rect.left + Math.max(4, rect.width / 2 || 8)
    init.clientY = rect.top + Math.max(4, rect.height / 2 || 8)

    dispatchMouseSequence(target, [
      { type: 'mousedown', init },
      { type: 'mouseup', init },
      { type: 'click', init },
    ])
  })
}

export function selectNativeFolder(sourceItem: HTMLElement, hiddenClass: string, event?: MouseEvent) {
  toggleNativeFolderSelection(sourceItem, hiddenClass, event)
}

export function openNativeFolder(sourceItem: HTMLElement, hiddenClass: string) {
  const anchor = getOpenAnchor(sourceItem)

  withVisibleSourceItem(sourceItem, hiddenClass, () => {
    sourceItem.style.setProperty('left', '-9999px', 'important')
    sourceItem.style.setProperty('top', '0', 'important')
    sourceItem.style.setProperty('pointer-events', 'none', 'important')

    dispatchMouseSequence(anchor, [
      {
        type: 'mousedown',
        init: {
          bubbles: true,
          cancelable: true,
          view: window,
          button: 0,
          buttons: 1,
        },
      },
      {
        type: 'mouseup',
        init: {
          bubbles: true,
          cancelable: true,
          view: window,
          button: 0,
          buttons: 1,
        },
      },
      {
        type: 'click',
        init: {
          bubbles: true,
          cancelable: true,
          view: window,
          button: 0,
          buttons: 1,
        },
      },
    ])
  })
}

export function openNativeFolderContextMenu(sourceItem: HTMLElement, hiddenClass: string, event: MouseEvent) {
  const anchor = getOpenAnchor(sourceItem)

  withVisibleSourceItem(sourceItem, hiddenClass, () => {
    sourceItem.style.setProperty('left', `${event.clientX}px`, 'important')
    sourceItem.style.setProperty('top', `${event.clientY}px`, 'important')
    sourceItem.style.removeProperty('pointer-events')

    const init = buildMouseInit(event, 2)

    dispatchMouseSequence(anchor, [
      {
        type: 'mouseenter',
        init,
      },
      {
        type: 'mousedown',
        init,
      },
      {
        type: 'mouseup',
        init,
      },
      {
        type: 'contextmenu',
        init,
      },
    ])
  })
}

/**
 * 通用原生右键菜单转发：对已隐藏的源元素临时显示并定位到光标处，派发右键序列后恢复。
 * 供媒体墙等场景复用（区别于 openNativeFolderContextMenu 使用打开锚点，这里使用右键菜单锚点）。
 */
export function forwardNativeContextMenu(sourceItem: HTMLElement, hiddenClass: string, event: MouseEvent) {
  const anchor = getContextMenuAnchor(sourceItem)
  sourceItem.classList.remove(hiddenClass)

  const previousStyle = sourceItem.getAttribute('style') || ''
  sourceItem.style.setProperty('position', 'fixed', 'important')
  sourceItem.style.setProperty('left', `${event.clientX}px`, 'important')
  sourceItem.style.setProperty('top', `${event.clientY}px`, 'important')
  sourceItem.style.setProperty('width', '1px', 'important')
  sourceItem.style.setProperty('height', '1px', 'important')
  sourceItem.style.setProperty('overflow', 'hidden', 'important')
  sourceItem.style.setProperty('opacity', '0', 'important')
  sourceItem.style.setProperty('pointer-events', 'none', 'important')

  const init: MouseEventInit = {
    bubbles: true,
    cancelable: true,
    view: window,
    button: 2,
    buttons: 2,
    clientX: event.clientX,
    clientY: event.clientY,
    screenX: event.screenX,
    screenY: event.screenY,
  }

  anchor.dispatchEvent(new MouseEvent('mousedown', init))
  anchor.dispatchEvent(new MouseEvent('mouseup', init))
  anchor.dispatchEvent(new MouseEvent('contextmenu', init))

  window.setTimeout(() => {
    if (previousStyle) sourceItem.setAttribute('style', previousStyle)
    else sourceItem.removeAttribute('style')
    sourceItem.classList.add(hiddenClass)
  }, 0)
}
