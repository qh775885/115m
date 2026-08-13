import { Icons } from '../../shared/icons'
import type Artplayer from 'artplayer'
import { escapeHtml } from '../../shared/utils'
import { bindClickSelectorBehavior, unbindClickSelectorBehavior } from './player-selector'

export const SETTINGS_MENU_CONTROL_NAME = 'm115-settings-menu-control'

function getSettingsIcon() {
  return Icons.Settings
}

function getFullscreenIcon() {
  return Icons.Fullscreen
}

function getSpeedIcon() {
  return Icons.Speed
}

export interface SettingsMenuControllerDeps {
  art: Artplayer
  currentPlaybackRate: number
  onSelectPlaybackRate: (value: number) => void
}

export class SettingsMenuController {
  private art: Artplayer | null = null
  private deps: SettingsMenuControllerDeps | null = null
  private controlEl: HTMLElement | null = null
  private activeSubMenu: 'speed' | null = null
  private observer: MutationObserver | null = null

  attach(deps: SettingsMenuControllerDeps) {
    this.art = deps.art
    this.deps = deps
  }

  renderControl() {
    if (!this.art) return
    const controlsApi = this.art.controls
    if (!controlsApi) return

    const nextItem = this.buildControl()
    if (!nextItem) return

    if (typeof controlsApi.update === 'function') {
      controlsApi.update(nextItem)
    } else {
      controlsApi.remove(SETTINGS_MENU_CONTROL_NAME)
      controlsApi.add(nextItem)
    }
  }

  buildControl(): any {
    if (!this.deps || !this.art) return null

    // 构建主菜单 HTML
    const mainMenuHtml = `
      <div class="m115-settings-panel" data-menu="main" style="display: ${this.activeSubMenu ? 'none' : 'flex'}">
        <button type="button" class="m115-settings-item" data-action="speed">
          <span class="m115-settings-item-icon">${getSpeedIcon()}</span>
          <span class="m115-settings-item-label">播放速度</span>
          <span class="m115-settings-item-value">${this.deps.currentPlaybackRate === 1 ? '正常' : this.deps.currentPlaybackRate + 'x'}</span>
          <span class="m115-settings-item-arrow">${Icons.ChevronRight}</span>
        </button>
        <div class="m115-settings-divider"></div>
        <button type="button" class="m115-settings-item" data-action="fullscreen">
          <span class="m115-settings-item-icon">${getFullscreenIcon()}</span>
          <span class="m115-settings-item-label">${this.art.fullscreen ? '退出全屏' : '全屏'}</span>
        </button>
      </div>
    `

    // 构建倍速子菜单 HTML
    const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2]
    const speedMenuHtml = `
      <div class="m115-settings-panel" data-menu="speed" style="display: ${this.activeSubMenu === 'speed' ? 'flex' : 'none'}">
        <div class="m115-settings-header">
          <button type="button" class="m115-settings-back" data-action="back">
            ${Icons.ChevronLeft}
          </button>
          <span class="m115-settings-title">播放速度</span>
        </div>
        ${speedOptions.map(rate => `
          <button type="button" class="m115-settings-option ${rate === this.deps!.currentPlaybackRate ? 'is-active' : ''}" data-action="set-speed" data-value="${rate}">
            <span class="m115-settings-check">
              ${rate === this.deps!.currentPlaybackRate ? Icons.Check : ''}
            </span>
            ${rate === 1 ? '正常' : rate + 'x'}
          </button>
        `).join('')}
      </div>
    `

    const listHtml = `
      <div class="m115-settings-container">
        ${mainMenuHtml}
        ${speedMenuHtml}
      </div>
    `

    return {
      name: SETTINGS_MENU_CONTROL_NAME,
      index: 13,
      position: 'right',
      style: {
        marginRight: '0',
        width: 'var(--m115-control-size)',
        minWidth: 'var(--m115-control-size)',
        maxWidth: 'var(--m115-control-size)',
        height: 'var(--m115-control-size)',
        minHeight: 'var(--m115-control-size)',
        maxHeight: 'var(--m115-control-size)',
        textAlign: 'center' as const,
      },
      html: `
        <div class="m115-settings-menu-control art-control-selector">
          <span class="art-selector-value m115-control-shell m115-control-button" style="display:inline-flex;align-items:center;justify-content:center;width:100%;height:100%;">${getSettingsIcon()}</span>
          <div class="art-selector-list">${listHtml}</div>
        </div>
      `,
      mounted: (el: HTMLElement) => {
        this.teardownControl()
        this.observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
              if (!el.classList.contains('m115-selector-open') && this.activeSubMenu) {
                this.activeSubMenu = null
                const mainPanel = el.querySelector('.m115-settings-panel[data-menu="main"]') as HTMLElement
                const speedPanel = el.querySelector('.m115-settings-panel[data-menu="speed"]') as HTMLElement
                if (mainPanel && speedPanel) {
                  mainPanel.style.display = 'flex'
                  speedPanel.style.display = 'none'
                }
              }
            }
          })
        })
        el.classList.add('m115-settings-menu-control')
        bindClickSelectorBehavior(el)
        this.controlEl = el

        // 绑定主菜单点击事件
        el.querySelectorAll<HTMLButtonElement>('.m115-settings-item').forEach((button) => {
          button.addEventListener('pointerdown', (event) => {
            event.preventDefault()
            event.stopPropagation()
            
            const action = button.dataset.action
            if (action === 'speed') {
              this.activeSubMenu = 'speed'
              const mainPanel = el.querySelector('.m115-settings-panel[data-menu="main"]') as HTMLElement
              const speedPanel = el.querySelector('.m115-settings-panel[data-menu="speed"]') as HTMLElement
              if (mainPanel && speedPanel) {
                mainPanel.style.display = 'none'
                speedPanel.style.display = 'flex'
              }
            } else if (action === 'fullscreen') {
              if (this.art) {
                this.art.fullscreen = !this.art.fullscreen
              }
              // 关闭菜单
              el.classList.remove('m115-selector-open')
            }
          })
        })

        // 绑定子菜单返回事件
        el.querySelectorAll<HTMLButtonElement>('.m115-settings-back').forEach((button) => {
          button.addEventListener('pointerdown', (event) => {
            event.preventDefault()
            event.stopPropagation()
            this.activeSubMenu = null
            const mainPanel = el.querySelector('.m115-settings-panel[data-menu="main"]') as HTMLElement
            const speedPanel = el.querySelector('.m115-settings-panel[data-menu="speed"]') as HTMLElement
            if (mainPanel && speedPanel) {
              mainPanel.style.display = 'flex'
              speedPanel.style.display = 'none'
            }
          })
        })

        // 绑定倍速选择事件
        el.querySelectorAll<HTMLButtonElement>('.m115-settings-option').forEach((button) => {
          button.addEventListener('pointerdown', (event) => {
            event.preventDefault()
            event.stopPropagation()
            
            const action = button.dataset.action
            if (action === 'set-speed') {
              const value = Number(button.dataset.value)
              if (Number.isFinite(value) && this.deps) {
                this.deps.onSelectPlaybackRate(value)
                this.activeSubMenu = null // 选择后重置状态
                el.classList.remove('m115-selector-open') // 关闭整个菜单
                this.renderControl() // 全局重新渲染以更新“播放速度”右侧的显示值
              }
            }
          })
        })

        // 监听面板关闭，重置子菜单状态
        this.observer.observe(el, { attributes: true })
      }
    }
  }

  private teardownControl() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    unbindClickSelectorBehavior(this.controlEl)
    this.controlEl = null
  }

  destroy() {
    this.teardownControl()
    this.art = null
    this.deps = null
  }
}
