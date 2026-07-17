import { Icons } from '../../shared/icons'

export function buildNavControlItem(params: {
  controlName: string
  direction: 'prev' | 'next'
  index: number
  enabled: boolean
  title: string
  onClick: () => void
}) {
  const svgIcon = params.direction === 'next'
    ? Icons.SkipForward
    : Icons.SkipBack

  return {
    name: params.controlName,
    position: 'left' as const,
    index: params.index,
    html: `<span class="m115-control-shell m115-nav-control-button ${params.enabled ? '' : 'is-disabled'}" aria-label="${params.title}" title="${params.title}" style="display:inline-flex;align-items:center;justify-content:center;width:100%;height:100%;color:rgba(236, 245, 255, 0.82);opacity:${params.enabled ? '1' : '.38'};cursor:${params.enabled ? 'pointer' : 'default'};transition:opacity .18s ease,background-color .15s ease">${svgIcon}</span>`,
    style: {
      width: 'var(--m115-control-size)',
      minWidth: 'var(--m115-control-size)',
      maxWidth: 'var(--m115-control-size)',
      height: 'var(--m115-control-size)',
      minHeight: 'var(--m115-control-size)',
      maxHeight: 'var(--m115-control-size)',
      marginRight: '2px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: params.enabled ? '1' : '.38',
      cursor: params.enabled ? 'pointer' : 'not-allowed',
    },
    click: () => {
      if (!params.enabled) return false
      params.onClick()
      return false
    },
    mounted: ($control: HTMLElement) => {
      $control.classList.add('m115-nav-control')
      $control.classList.toggle('is-disabled', !params.enabled)
      $control.title = params.title
    },
  }
}
