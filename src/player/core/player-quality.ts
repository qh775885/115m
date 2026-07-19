import { Icons } from '../../shared/icons'
import { buildArtplayerQuality } from './quality'
import type { QualityOption } from './types'
import { bindClickSelectorBehavior } from './player-selector'

function getQualityIcon() {
  return Icons.Quality
}

export function buildQualityControlItem(params: {
  controlName: string
  currentQualityLabel: string
  currentUrl: string
  qualityOptions: QualityOption[]
  onSelect: (target: QualityOption) => Promise<void>
}) {
    return {
      name: params.controlName,
      position: 'right' as const,
      index: 10,
      style: {
        marginRight: 'var(--m115-control-gap)',
        width: 'var(--m115-quality-width)',
        minWidth: 'var(--m115-quality-width)',
        maxWidth: 'var(--m115-quality-width)',
        height: 'var(--m115-control-size)',
        minHeight: 'var(--m115-control-size)',
        maxHeight: 'var(--m115-control-size)',
        textAlign: 'center' as const,
      },
      html: getQualityIcon(),
      mounted: ($control: HTMLElement) => {
        $control.classList.add('m115-quality-control')
        bindClickSelectorBehavior($control)
      },
      selector: buildArtplayerQuality(params.qualityOptions, params.currentUrl, params.currentQualityLabel).map(item => ({
        ...item,
      })),
    onSelect: async (item: any) => {
      const label = item.html || ''
      const target = params.qualityOptions.find(opt => opt.label === label || opt.url === item.url)
      if (!target) return getQualityIcon()
      const controlEl = globalThis.document?.querySelector('.m115-quality-control')
      if (controlEl) controlEl.classList.remove('m115-selector-open')
      await params.onSelect(target)
      return getQualityIcon()
    },
  }
}

export function updateArtplayerControl(
  artplayer: any,
  controlName: string,
  nextItem: any,
) {
  const controlsApi = artplayer?.controls
  if (!controlsApi) return

  if (typeof controlsApi.update === 'function') {
    controlsApi.update(nextItem)
    return
  }

  if (typeof controlsApi.remove === 'function') {
    controlsApi.remove(controlName)
  }
  if (typeof controlsApi.add === 'function') {
    controlsApi.add(nextItem)
  }
}
