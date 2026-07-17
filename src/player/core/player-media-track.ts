import type Artplayer from 'artplayer'
import { escapeHtml } from '../../shared/utils'
import { bindClickSelectorBehavior } from './player-selector'
import type { SubtitleController } from './subtitle-controller'
import type { AudioManager } from './audio-manager'

export const MEDIA_TRACK_CONTROL_NAME = 'm115-media-track-control'

function getMediaTrackIcon() {
  // 使用一个代表字幕/音轨的 CC 图标
  return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:block;flex:none;"><rect width="18" height="14" x="3" y="5" rx="2" ry="2" fill="none"/><path d="M7 15h2a2 2 0 0 1 2-2v0a2 2 0 0 1-2-2H7a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2m8 0h2a2 2 0 0 0 2-2v0a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2" fill="none"/></svg>'
}

export interface MediaTrackControllerDeps {
  art: Artplayer
  subtitleController: SubtitleController
  audioManager: AudioManager
}

export class MediaTrackController {
  private art: Artplayer | null = null
  private deps: MediaTrackControllerDeps | null = null
  private controlEl: HTMLElement | null = null

  attach(deps: MediaTrackControllerDeps) {
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
      controlsApi.remove(MEDIA_TRACK_CONTROL_NAME)
      controlsApi.add(nextItem)
    }
  }

  buildControl(): any {
    if (!this.deps) return null

    // 1. 获取字幕列表和当前选中状态
    const subtitleCtrl = this.deps.subtitleController as any
    const subtitleManager = subtitleCtrl.subtitleManager
    const subtitleItems: any[] = subtitleManager?.getItems() || []
    const selectedSid = subtitleManager?.getSelectedSid() || ''

    // 2. 获取音轨列表和当前选中状态
    const audioMgr = this.deps.audioManager
    const audioItems = audioMgr.trackOptions || []
    const currentAudioTrackLabel = audioMgr.currentTrackLabel

    // 3. 构建字幕分区 HTML
    let subtitleSectionHtml = ''
    if (subtitleItems.length > 0) {
      subtitleSectionHtml = [
        '<div class="m115-media-section-title">字幕</div>',
        `<button type="button" class="m115-media-option ${selectedSid ? '' : 'is-active'}" data-type="subtitle" data-value="">关闭字幕</button>`,
        ...subtitleItems.map(item => 
          `<button type="button" class="m115-media-option ${item.sid === selectedSid ? 'is-active' : ''}" data-type="subtitle" data-value="${escapeHtml(item.sid)}">${escapeHtml(item.title)}</button>`
        )
      ].join('')
    } else {
      subtitleSectionHtml = [
        '<div class="m115-media-section-title">字幕</div>',
        '<div class="m115-media-empty">无可用字幕</div>'
      ].join('')
    }

    // 4. 构建音轨分区 HTML (仅在音轨数 > 1 时显示)
    let audioSectionHtml = ''
    if (audioItems.length > 1) {
      audioSectionHtml = [
        '<div class="m115-media-section-divider"></div>',
        '<div class="m115-media-section-title">音轨</div>',
        ...audioItems.map(item => 
          `<button type="button" class="m115-media-option ${item.label === currentAudioTrackLabel ? 'is-active' : ''}" data-type="audio" data-value="${item.id}">${escapeHtml(item.label)}</button>`
        )
      ].join('')
    }

    const listHtml = `
      <div class="m115-media-panel">
        <div class="m115-media-section">${subtitleSectionHtml}</div>
        ${audioSectionHtml ? `<div class="m115-media-section">${audioSectionHtml}</div>` : ''}
      </div>
    `

    return {
      name: MEDIA_TRACK_CONTROL_NAME,
      index: 10.4,
      position: 'right',
      style: {
        marginRight: 'var(--m115-control-gap)',
        width: 'var(--m115-subtitle-width)',
        minWidth: 'var(--m115-subtitle-width)',
        maxWidth: 'var(--m115-subtitle-width)',
        height: 'var(--m115-control-size)',
        minHeight: 'var(--m115-control-size)',
        maxHeight: 'var(--m115-control-size)',
        textAlign: 'center' as const,
      },
      html: `
        <div class="m115-media-track-control art-control-selector">
          <span class="art-selector-value m115-media-track-value">${getMediaTrackIcon()}</span>
          <div class="art-selector-list">${listHtml}</div>
        </div>
      `,
      mounted: (el: HTMLElement) => {
        el.classList.add('m115-media-track-control')
        bindClickSelectorBehavior(el)
        this.controlEl = el

        // 绑定点击事件
        el.querySelectorAll<HTMLButtonElement>('.m115-media-option').forEach((button) => {
          button.addEventListener('click', (event) => {
            event.preventDefault()
            event.stopPropagation()
            
            const type = button.dataset.type
            const value = button.dataset.value || ''

            if (type === 'subtitle') {
              el.classList.remove('m115-selector-open')
              void subtitleCtrl.applySelection(value, true)
            } else if (type === 'audio') {
              const trackId = Number(value)
              if (Number.isFinite(trackId)) {
                el.classList.remove('m115-selector-open')
                // 直接调用 AudioManager 提供的公开方法
                void audioMgr.applyTrackSelection(trackId).then(() => {
                  this.renderControl()
                })
              }
            }
          })
        })
      }
    }
  }

  destroy() {
    this.controlEl = null
    this.art = null
    this.deps = null
  }
}
