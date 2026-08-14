/**
 * 字幕控制器：字幕偏好持久化、控件渲染、SubtitleManager 生命周期管理
 */
import type Artplayer from 'artplayer'
import { escapeHtml } from '../../shared/utils'
import { SubtitleManager } from './subtitle-manager'
import type { SubtitleItem } from './subtitles'
import { loadSubtitlePreference, saveSubtitlePreference } from './history'
import { updateArtplayerControl } from './player-quality'
import { bindClickSelectorBehavior, unbindClickSelectorBehavior } from './player-selector'
import { sendRuntimeMessageSafe } from './runtime'

function getSubtitleControlLabel(title: string, hasItems: boolean) {
  if (!hasItems) return '无字幕'
  if (!title) return '字幕'

  const cleanedTitle = title.replace(/^\s*\[(?:内置字幕|外挂字幕)\]\s*/i, '').trim() || title.trim()
  const normalizedTitle = cleanedTitle.toLowerCase()
  if (normalizedTitle.includes('简') && normalizedTitle.includes('中')) return '简中'
  if (normalizedTitle.includes('繁') && normalizedTitle.includes('中')) return '繁中'
  if (normalizedTitle.includes('英')) return '英文'
  if (normalizedTitle.includes('日')) return '日文'
  if (normalizedTitle.includes('双语')) return '双语'

  return cleanedTitle.length > 4 ? `${cleanedTitle.slice(0, 4)}…` : cleanedTitle
}

function escapeAttr(value: string) {
  return escapeHtml(value)
}

export interface SubtitleControllerDeps {
  art: Artplayer
  getCurrentPickCode: () => string
  onShowToast: (msg: string) => void
  onRenderRequest?: () => void
}

export class SubtitleController {
  private art: Artplayer | null = null
  private deps: SubtitleControllerDeps | null = null
  private subtitleManager: SubtitleManager | null = null
  private controlEl: HTMLElement | null = null
  private preferenceAppliedForPickCode = ''

  /** 绑定依赖并初始化字幕 */
  attach(deps: SubtitleControllerDeps) {
    this.art = deps.art
    this.deps = deps
    this.setup()
  }

  /** 当前字幕列表（供媒体轨控件读取；无管理器时为空） */
  getSubtitleItems() {
    return this.subtitleManager?.getItems() || []
  }

  /** 当前选中字幕 sid（供媒体轨控件读取） */
  getSelectedSubtitleSid() {
    return this.subtitleManager?.getSelectedSid() || ''
  }

  /** 视频切换时重置字幕 */
  resetForNewVideo() {
    this.subtitleManager?.clearTrack()
    void this.subtitleManager?.loadList(this.deps!.getCurrentPickCode())
  }

  /** 渲染字幕控件 */
  renderControl() {
    if (!this.art) return
    if (this.deps?.onRenderRequest) {
      this.deps.onRenderRequest()
    } else {
      updateArtplayerControl(this.art, 'm115-subtitle-control', this.buildControl())
    }
  }

  /** 清除偏好应用标记（视频切换时调用） */
  resetPreferenceFlag() {
    this.preferenceAppliedForPickCode = ''
  }

  destroy() {
    this.subtitleManager?.destroy()
    this.subtitleManager = null
    unbindClickSelectorBehavior(this.controlEl)
    this.controlEl = null
    this.art = null
    this.deps = null
  }

  // ─── 内部方法 ───

  private setup() {
    if (!this.art || this.subtitleManager || !this.deps) return
    const container = this.art.video.parentElement as HTMLElement | null
    if (!container) return

    this.subtitleManager = new SubtitleManager({
      container,
      getVideo: () => this.art?.video || null,
      sendMessage: sendRuntimeMessageSafe,
      onListChange: () => this.renderControl(),
      onTrackChange: () => this.renderControl(),
      onListLoaded: () => this.restorePreference(),
      onError: message => this.deps?.onShowToast(message),
    })
    void this.subtitleManager.loadList(this.deps.getCurrentPickCode())
  }

  buildControl() {
    const items = this.subtitleManager?.getItems() || []
    const selectedSid = this.subtitleManager?.getSelectedSid() || ''
    const selected = items.find(item => item.sid === selectedSid)
    const currentSubtitleLabel = selected?.title || (items.length ? '字幕' : '无字幕')
    const compactSubtitleLabel = getSubtitleControlLabel(selected?.title || '', items.length > 0)
    const listHtml = [
      `<button type="button" class="m115-subtitle-option ${selectedSid ? '' : 'is-active'}" data-sid="">关闭字幕</button>`,
      ...items.map(item => `<button type="button" class="m115-subtitle-option ${item.sid === selectedSid ? 'is-active' : ''}" data-sid="${escapeAttr(item.sid)}">${escapeHtml(item.title)}</button>`),
    ].join('')

    return {
      name: 'm115-subtitle-control',
      index: 10.3,
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
      html: `<div class="m115-subtitle-control art-control-selector">
        <span class="art-selector-value m115-subtitle-value" title="${escapeAttr(currentSubtitleLabel)}">${escapeHtml(compactSubtitleLabel)}</span>
        <div class="art-selector-list">${listHtml}</div>
      </div>`,
      mounted: (el: HTMLElement) => {
        el.classList.add('m115-subtitle-control')
        bindClickSelectorBehavior(el)
        el.style.display = items.length > 0 ? 'flex' : 'inline-flex'
        this.controlEl = el
        el.querySelectorAll<HTMLButtonElement>('.m115-subtitle-option').forEach((button) => {
          button.addEventListener('click', (event) => {
            event.preventDefault()
            event.stopPropagation()
            void this.applySelection(button.dataset.sid || '', true)
          })
        })
      },
    }
  }

  async applySelection(sid: string, remember = false) {
    if (!this.subtitleManager || !this.deps) return
    const items = this.subtitleManager.getItems()
    const item = sid ? items.find(entry => entry.sid === sid) : null
    await this.subtitleManager.select(sid)
    if (remember) {
      saveSubtitlePreference(this.deps.getCurrentPickCode(), item
        ? {
            sid: item.sid,
            title: item.title,
            type: item.type,
            language: item.language,
          }
        : {
            sid: '',
            title: '',
            type: '',
            disabled: true,
          })
    }
  }

  private restorePreference() {
    if (!this.subtitleManager || !this.deps) return
    const pickCode = this.deps.getCurrentPickCode()
    if (this.preferenceAppliedForPickCode === pickCode) return
    const preference = loadSubtitlePreference(pickCode)
    if (!preference) return
    this.preferenceAppliedForPickCode = pickCode
    if (preference.disabled) {
      void this.applySelection('', false)
      return
    }
    const item = this.findPreferredItem(this.subtitleManager.getItems(), preference)
    if (item) {
      void this.applySelection(item.sid, false)
    }
  }

  private findPreferredItem(items: SubtitleItem[], preference: { sid: string, title: string, type: string, language?: string }) {
    return items.find(item => item.sid === preference.sid)
      || items.find(item => item.title === preference.title && item.type === preference.type && (item.language || '') === (preference.language || ''))
      || items.find(item => item.title === preference.title)
  }
}
