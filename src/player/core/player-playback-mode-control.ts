import type { PlaybackMode } from './player-playback-mode'
import { getPlaybackModeLabel, getPlaybackModeOptions } from './player-playback-mode'
import { bindClickSelectorBehavior } from './player-selector'

function getPlaybackModeIcon(mode: PlaybackMode) {
  switch (mode) {
    case 'repeat':
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 7h8.59l-1.3-1.29 1.42-1.42L19.41 8l-3.7 3.71-1.42-1.42L15.59 9H7a3 3 0 0 0-3 3v1H2v-1a5 5 0 0 1 5-5Zm10 4h2v1a5 5 0 0 1-5 5H8.41l1.3 1.29-1.42 1.42L4.59 16l3.7-3.71 1.42 1.42L8.41 15H14a3 3 0 0 0 3-3v-1Z"/></svg>'
    case 'stop':
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 7h10v10H7z"/></svg>'
    case 'next':
    default:
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 6.5v11l8-5.5-8-5.5Zm9 0h2v11h-2z"/></svg>'
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
