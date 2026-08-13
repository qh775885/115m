const selectorControls = new Set<HTMLElement>()

let sharedListenerBound = false

function closeAllSelectors() {
  selectorControls.forEach((control) => {
    if (!control.isConnected) {
      selectorControls.delete(control)
      return
    }
    control.classList.remove('m115-selector-open')
  })
}

function ensureSharedListeners() {
  if (sharedListenerBound) return
  sharedListenerBound = true

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null
    if (!target) return
    let insideOpen = false
    selectorControls.forEach((control) => {
      if (control.contains(target) && control.classList.contains('m115-selector-open')) {
        insideOpen = true
      }
    })
    if (!insideOpen) {
      closeAllSelectors()
    }
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAllSelectors()
    }
  })
}

export function unbindClickSelectorBehavior(control: HTMLElement | null | undefined) {
  if (!control) return
  selectorControls.delete(control)
  if ((control as any).__m115SelectorBound) {
    ;(control as any).__m115SelectorBound = false
  }
}

export function bindClickSelectorBehavior(control: HTMLElement) {
  if ((control as any).__m115SelectorBound) {
    return
  }
  ;(control as any).__m115SelectorBound = true
  control.classList.add('m115-click-selector')
  selectorControls.add(control)

  ensureSharedListeners()

  const close = () => {
    control.classList.remove('m115-selector-open')
  }

  const open = () => {
    const scope = control.parentElement || document
    scope.querySelectorAll<HTMLElement>('.m115-click-selector.m115-selector-open').forEach((node) => {
      if (node !== control) {
        node.classList.remove('m115-selector-open')
      }
    })
    control.classList.add('m115-selector-open')
  }

  control.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null
    if (target?.closest('.art-selector-item')) {
      close()
      return
    }

    const selectorValue = target?.closest('.art-selector-value')
    if (!selectorValue) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    if (control.classList.contains('m115-selector-open')) {
      close()
    }
    else {
      open()
    }
  })
}
