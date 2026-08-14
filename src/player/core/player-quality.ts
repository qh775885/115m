import { buildArtplayerQuality } from './quality'
import type { QualityOption } from './types'
import { bindClickSelectorBehavior } from './player-selector'

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
        width: 'auto',
        minWidth: '0',
        maxWidth: 'none',
        height: 'var(--m115-control-size)',
        minHeight: 'var(--m115-control-size)',
        maxHeight: 'var(--m115-control-size)',
        textAlign: 'center' as const,
        background: 'transparent',
        backgroundColor: 'transparent',
        backgroundImage: 'none',
        boxShadow: 'none',
        border: 'none',
        padding: '0',
        margin: '0',
        borderRadius: '0',
        overflow: 'visible',
      },
      html: params.currentQualityLabel || '画质',
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
      if (!target) return params.currentQualityLabel || '画质'
      const controlEl = globalThis.document?.querySelector('.m115-quality-control')
      if (controlEl) controlEl.classList.remove('m115-selector-open')
      await params.onSelect(target)
      return target.label
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

