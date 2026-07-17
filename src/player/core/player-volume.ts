import { Icons } from '../../shared/icons'
import { saveVolumePreference } from './history'
import { bindClickSelectorBehavior } from './player-selector'
import type Artplayer from 'artplayer'

export const CUSTOM_VOLUME_CONTROL_NAME = 'm115-custom-volume-control'

function getVolumeIconSvg(volume: number, muted: boolean) {
  if (muted || volume === 0) {
    return Icons.VolumeX
  }
  return Icons.Volume2
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

      // Hover 防抖逻辑
      let hoverTimeout: number | null = null
      const enterDelay = 120 // 移入延迟 120ms 展开
      const leaveDelay = 250 // 移出延迟 250ms 收起

      const expandVolume = () => {
        if (hoverTimeout) {
          clearTimeout(hoverTimeout)
          hoverTimeout = null
        }
        container.classList.add('is-expanded')
        $control.classList.add('is-expanded')
      }

      const collapseVolume = () => {
        if (hoverTimeout) {
          clearTimeout(hoverTimeout)
          hoverTimeout = null
        }
        container.classList.remove('is-expanded')
        $control.classList.remove('is-expanded')
      }

      container.addEventListener('mouseenter', () => {
        if (hoverTimeout) clearTimeout(hoverTimeout)
        hoverTimeout = window.setTimeout(expandVolume, enterDelay)
      })

      container.addEventListener('mouseleave', () => {
        if (hoverTimeout) clearTimeout(hoverTimeout)
        hoverTimeout = window.setTimeout(collapseVolume, leaveDelay)
      })

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
          // 主动保存音量
          saveVolumePreference({
            volume: art.video.volume,
            muted: art.video.muted,
          })
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
        // 主动保存音量
        saveVolumePreference({
          volume: art.video.volume,
          muted: art.video.muted,
        })
      })

      updateUI()
    },
  }
}
