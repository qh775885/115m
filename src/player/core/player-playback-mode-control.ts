import { Icons } from '../../shared/icons'
import type { PlaybackMode } from './player-playback-mode'
import { getPlaybackModeLabel, getPlaybackModeOptions } from './player-playback-mode'
import { bindClickSelectorBehavior } from './player-selector'

function getPlaybackModeIcon(mode: PlaybackMode) {
  switch (mode) {
    case 'repeat':
      return Icons.Repeat
    case 'stop':
      return Icons.Stop
    case 'next':
    default:
      return Icons.SkipForward
  }
}

function getPlaybackModeSelectorHtml(mode: PlaybackMode) {
  return `<span class="m115-mode-option">${getPlaybackModeIcon(mode)}<span>${getPlaybackModeLabel(mode)}</span></span>`
}

export function buildPlaybackModeControlItem(params: {
  controlName: string
  currentPlaybackMode: PlaybackMode
  onSelectPlaybackMode: (mode: PlaybackMode) => void
}) {
  return {
    name: params.controlName,
    position: 'right' as const,
    index: 10.75,
    tooltip: '播放模式',
    style: {
      marginRight: 'var(--m115-control-gap)',
      width: 'var(--m115-mode-width)',
      minWidth: 'var(--m115-mode-width)',
      maxWidth: 'var(--m115-mode-width)',
      height: 'var(--m115-control-size)',
      minHeight: 'var(--m115-control-size)',
      maxHeight: 'var(--m115-control-size)',
      textAlign: 'center' as const,
    },
    html: getPlaybackModeIcon(params.currentPlaybackMode),
    mounted: ($control: HTMLElement) => {
      $control.classList.add('m115-playback-mode-control')
      bindClickSelectorBehavior($control)
    },
    selector: getPlaybackModeOptions().map(mode => ({
      html: getPlaybackModeSelectorHtml(mode),
      value: mode,
      default: mode === params.currentPlaybackMode,
    })),
    onSelect: async (item: any) => {
      const mode = item.value as PlaybackMode
      if (mode !== 'next' && mode !== 'repeat' && mode !== 'stop') {
        return getPlaybackModeIcon(params.currentPlaybackMode)
      }
      const controlEl = document.querySelector('.m115-playback-mode-control')
      if (controlEl) controlEl.classList.remove('m115-selector-open')
      params.onSelectPlaybackMode(mode)
      return getPlaybackModeIcon(mode)
    },
  }
}
