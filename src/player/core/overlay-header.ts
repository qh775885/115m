import { UI_LAYER } from './ui-layer'
import { Icons } from '../../shared/icons'

export function createHeaderActionButton(title: string, icon: string) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'm115-header-action'
  button.title = title
  button.style.cssText = 'display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:999px;border:none;background:transparent;color:rgba(255,255,255,.82);cursor:pointer;transition:background .15s,color .15s,opacity .15s;'
  button.innerHTML = icon
  button.addEventListener('mouseenter', () => {
    if (!button.disabled) button.style.background = 'rgba(255,255,255,.1)'
  })
  button.addEventListener('mouseleave', () => {
    button.style.background = 'transparent'
  })
  return button
}

export function getFavoriteButtonIcon(marked: boolean) {
  return marked ? Icons.StarFilled() : Icons.Star()
}

export function createOverlayHeaderScaffold() {
  const header = document.createElement('div')
  header.classList.add('m115-layer-header')
  header.style.cssText = [
    'position:absolute',
    'top:0',
    'left:0',
    'right:0',
    `z-index:${UI_LAYER.header}`,
    'display:flex',
    'align-items:flex-start',
    'padding:16px 20px 28px',
    'background:transparent',
    'opacity:0',
    'pointer-events:none',
    'transition:opacity .2s ease',
    'box-sizing:border-box',
  ].join(';')
  const left = document.createElement('div')
  left.className = 'm115-header-main'
  left.style.cssText = 'min-width:0;max-width:min(72vw,800px);display:flex;align-items:flex-start;gap:12px;'

  const back = document.createElement('button')
  back.type = 'button'
  back.className = 'm115-header-back'
  back.title = '返回'
  back.style.cssText = [
    'pointer-events:auto',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'width:40px',
    'height:40px',
    'border-radius:999px',
    'border:1px solid rgba(255,255,255,.18)',
    'background:transparent',
    'color:rgba(255,255,255,.88)',
    'cursor:pointer',
    'flex-shrink:0',
  ].join(';')
  back.innerHTML = Icons.Back()

  const info = document.createElement('div')
  info.className = 'm115-header-info'
  info.style.cssText = 'min-width:0;flex:0 1 auto;padding-top:2px;max-width:min(62vw,760px);'

  const titleRow = document.createElement('div')
  titleRow.className = 'm115-header-title-row'
  titleRow.style.cssText = 'display:inline-flex;align-items:center;gap:10px;min-width:0;max-width:100%;vertical-align:top;'

  const title = document.createElement('div')
  title.className = 'm115-header-title'
  title.style.cssText = [
    'flex:0 1 auto',
    'min-width:0',
    'font-size:16px',
    'font-weight:700',
    'line-height:1.35',
    'color:#fff',
    'text-shadow:none',
    'white-space:nowrap',
    'overflow:hidden',
    'text-overflow:ellipsis',
    'user-select:text',
    'pointer-events:auto',
  ].join(';')

  const index = document.createElement('div')
  index.className = 'm115-header-index'
  index.style.cssText = [
    'display:none',
    'align-items:center',
    'justify-content:center',
    'height:22px',
    'padding:0 8px',
    'border-radius:999px',
    'background:rgba(255,255,255,.1)',
    'border:1px solid rgba(255,255,255,.14)',
    'font-size:12px',
    'font-weight:700',
    'line-height:1',
    'color:rgba(255,255,255,.84)',
    'white-space:nowrap',
    'flex:0 0 auto',
    'pointer-events:auto',
  ].join(';')

  const stats = document.createElement('div')
  stats.className = 'm115-header-stats'
  stats.style.cssText = [
    'flex:0 0 auto',
    'font-size:12px',
    'font-weight:600',
    'line-height:1.2',
    'color:rgba(255,255,255,.72)',
    'text-shadow:none',
    'white-space:nowrap',
    'user-select:text',
    'pointer-events:auto',
  ].join(';')

  const breadcrumbs = document.createElement('div')
  breadcrumbs.className = 'm115-header-breadcrumbs'
  breadcrumbs.style.cssText = [
    'margin-top:6px',
    'font-size:12px',
    'line-height:1.5',
    'color:rgba(255,255,255,.8)',
    'text-shadow:none',
    'white-space:nowrap',
    'overflow:hidden',
    'text-overflow:ellipsis',
    'user-select:text',
    'pointer-events:auto',
  ].join(';')

  const right = document.createElement('div')
  right.className = 'm115-header-actions-wrap'
  right.style.cssText = 'display:flex;align-items:center;gap:8px;margin-left:auto;flex-shrink:0;pointer-events:auto;padding-top:2px;'

  const pillGroup = document.createElement('div')
  pillGroup.className = 'm115-header-pill-group'
  pillGroup.style.cssText = 'display:flex;align-items:center;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.42);padding:2px;gap:0;'

  titleRow.appendChild(index)
  titleRow.appendChild(title)
  titleRow.appendChild(stats)
  info.appendChild(titleRow)
  info.appendChild(breadcrumbs)
  left.appendChild(back)
  left.appendChild(info)
  right.appendChild(pillGroup)
  header.appendChild(left)
  header.appendChild(right)

  return {
    header,
    back,
    titleRow,
    title,
    index,
    stats,
    breadcrumbs,
    right,
    pillGroup,
  }
}

