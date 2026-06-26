import { saveVolumePreference } from './history'
import { bindClickSelectorBehavior } from './player-selector'
import type Artplayer from 'artplayer'

export const CUSTOM_VOLUME_CONTROL_NAME = 'm115-custom-volume-control'

function getVolumeIconSvg(volume: number, muted: boolean) {
  if (muted || volume === 0) {
    return `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3z"/><path fill="currentColor" d="M4.7 3.3 3.3 4.7l16 16 1.4-1.4-16-16z"/></svg>`
  }
  if (volume < 0.5) {
    return `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8.32v7.36A4.5 4.5 0 0 0 16.5 12z"/></svg>`
  }
  return `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8.32v7.36A4.5 4.5 0 0 0 16.5 12zM19 12a7 7 0 0 0-3-5.71v1.55A5.5 5.5 0 0 1 17.5 12 5.5 5.5 0 0 1 16 16.16v1.55A7 7 0 0 0 19 12z"/></svg>`
}

export function buildCustomVolumeControl() {
  return {
    name: CUSTOM_VOLUME_CONTROL_NAME,
    position: 'left' as const,
    index: 20, // placed after play/pause
    style: {
      padding: '0',
      display: 'flex',
      alignItems: 'center',
    },
    html: `
      <div class="m115-custom-volume-container">
        <button class="m115-volume-btn" type="button" aria-label="音量">
           ${getVolumeIconSvg(1, false)}
        </button>
        <div class="m115-volume-slider-wrapper">
          <input class="m115-volume-slider" type="range" min="0" max="1" step="0.01" value="1">
          <span class="m115-volume-val">100</span>
        </div>
      </div>
    `,
    mounted(this: Artplayer, $control: HTMLElement) {
      const art = this
      $control.classList.add('m115-custom-volume-control')
      const container = $control.querySelector('.m115-custom-volume-container') as HTMLElement
      const btn = $control.querySelector('.m115-volume-btn') as HTMLElement
      const slider = $control.querySelector('.m115-volume-slider') as HTMLInputElement
      const valDisplay = $control.querySelector('.m115-volume-val') as HTMLElement
      
      const updateUI = () => {
        if (!art || !art.video) return
        const v = art.video.muted ? 0 : art.video.volume
        slider.value = v.toString()
        valDisplay.textContent = Math.round(v * 100).toString()
        btn.innerHTML = getVolumeIconSvg(v, art.video.muted)
        container.classList.toggle('is-muted', art.video.muted || v === 0)
        
        // update slider background fill
        const percentage = Math.round(v * 100)
        slider.style.background = percentage === 0
          ? 'rgba(255,255,255,0.2)'
          : `linear-gradient(to right, #1890ff ${percentage}%, rgba(255,255,255,0.2) ${percentage}%)`
      }

      art.on('ready', () => {
         updateUI()
      })

      art.on('video:loadedmetadata', () => {
         updateUI()
      })

      art.on('video:volumechange', () => {
        updateUI()
        saveVolumePreference({
          volume: art.video.volume,
          muted: art.video.muted,
        })
      })

      slider.addEventListener('input', (e) => {
        const v = parseFloat((e.target as HTMLInputElement).value)
        if (art && art.video) {
          art.video.volume = v
          if (v > 0 && art.video.muted) {
            art.video.muted = false
          }
        }
      })

      btn.addEventListener('click', () => {
        if (!art || !art.video) return
        if (art.video.muted || art.video.volume === 0) {
          art.video.muted = false
          if (art.video.volume === 0) art.video.volume = 0.5
        } else {
          art.video.muted = true
        }
      })

      updateUI()
    },
  }
}
