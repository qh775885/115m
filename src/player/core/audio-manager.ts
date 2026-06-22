/**
 * 音频管理器：音轨状态、偏好持久化、音轨同步
 */
import type HlsType from 'hls.js'
import type Artplayer from 'artplayer'
import type { AudioTrackOption } from './types'
import { loadAudioTrackPreference, saveAudioTrackPreference } from './history'
import { buildAudioControlItem } from './player-audio'
import { updateArtplayerControl } from './player-quality'

const AUDIO_CONTROL_NAME = 'm115-audio-control'

export interface AudioManagerDeps {
  art: Artplayer
  getHlsInstance: () => HlsType | null
  getCurrentPickCode: () => string
  getCurrentHlsLogicalUrl: () => string | null
  onRebuildHls: (params: {
    id: number
    currentTime: number
    shouldResume: boolean
    track: any
  }) => Promise<void>
  onShowToast: (msg: string) => void
}

export class AudioManager {
  private art: Artplayer | null = null
  private deps: AudioManagerDeps | null = null

  private audioTrackOptions: AudioTrackOption[] = []
  private currentAudioTrackId = -1
  private currentAudioTrackLabel = '音轨'
  private preferredAudioTrackId: number | null = null
  private audioPreferenceAppliedForPickCode = ''
  private syncTimers: number[] = []

  /** 当前音轨选项（供外部读取） */
  get trackOptions(): AudioTrackOption[] {
    return this.audioTrackOptions
  }

  /** 当前音轨 ID */
  get currentTrackId(): number {
    return this.currentAudioTrackId
  }

  /** 当前音轨标签 */
  get currentTrackLabel(): string {
    return this.currentAudioTrackLabel
  }

  /** 绑定依赖 */
  attach(deps: AudioManagerDeps) {
    this.art = deps.art
    this.deps = deps
  }

  /** 初始化时重置音轨状态（native 模式） */
  resetForNative() {
    this.audioTrackOptions = []
    this.currentAudioTrackId = -1
    this.currentAudioTrackLabel = '音轨'
  }

  /** 清除偏好应用标记（视频切换时调用） */
  resetPreferenceFlag() {
    this.audioPreferenceAppliedForPickCode = ''
    this.preferredAudioTrackId = null
  }

  /** 同步音轨列表从 HLS 实例 */
  syncFromHls() {
    const hls = this.deps?.getHlsInstance() as any
    const tracks = Array.isArray(hls?.audioTracks) ? hls.audioTracks : []
    if (tracks.length === 0) return

    this.audioTrackOptions = tracks.map((track: any, index: number) => ({
      id: index,
      label: this.getTrackLabel(track, index),
    }))
    this.currentAudioTrackId = typeof hls?.audioTrack === 'number' ? hls.audioTrack : -1
    const active = this.audioTrackOptions.find(track => track.id === this.currentAudioTrackId)
    this.currentAudioTrackLabel = active?.label || (this.audioTrackOptions.length > 0 ? this.audioTrackOptions[0].label : '音轨')
    this.restorePreference()
    this.renderControl()
  }

  /** 从 master playlist 解析音轨标签（HLS 实例尚未就绪时的 fallback） */
  async hydrateFromMasterPlaylist() {
    if (!this.deps) return
    try {
      const pickCode = this.deps.getCurrentPickCode()
      const response = await fetch(`https://115.com/api/video/m3u8/${pickCode}.m3u8`, {
        credentials: 'include',
      })
      const text = await response.text()
      const tags = text.match(/#EXT-X-MEDIA:TYPE=AUDIO[^\n]*/ig) || []
      if (tags.length <= 1) return

      const fallbackTracks: AudioTrackOption[] = tags.map((tag, index) => {
        const name = tag.match(/NAME="([^"]+)"/i)?.[1] || ''
        const lang = tag.match(/LANGUAGE="([^"]+)"/i)?.[1] || ''
        const normalizedLang = lang.toLowerCase()
        const languageLabel = normalizedLang === 'chi' || normalizedLang === 'zh' || normalizedLang === 'zho'
          ? '中文'
          : (lang || '未知语言')
        const label = name.toLowerCase() === 'stereo'
          ? `${languageLabel}${index + 1}`
          : (name ? `${name}（${languageLabel}）` : `${languageLabel}${index + 1}`)
        return { id: index, label }
      })

      if (this.audioTrackOptions.length === 0) {
        this.audioTrackOptions = fallbackTracks
        this.currentAudioTrackId = 0
        this.currentAudioTrackLabel = fallbackTracks[0]?.label || '音轨'
        this.renderControl()
      }
    }
    catch (error) {
      console.warn('[115m][audio] hydrateFromMasterPlaylist failed', error)
    }
  }

  /** 切换音轨 */
  applyTrack(id: number) {
    const hls = this.deps?.getHlsInstance() as any
    if (!hls || typeof hls.audioTrack !== 'number') {
      this.deps?.onShowToast('当前播放链路暂不支持切换音轨')
      return
    }
    const art = this.deps?.art
    const currentTime = art?.currentTime || 0
    const shouldResume = !!art && !art.video.paused
    const track = Array.isArray(hls.audioTracks) ? hls.audioTracks[id] : null
    this.preferredAudioTrackId = id
    this.currentAudioTrackId = id
    const active = this.audioTrackOptions.find(t => t.id === id)
    if (active) {
      this.currentAudioTrackLabel = active.label
      saveAudioTrackPreference(this.deps!.getCurrentPickCode(), active)
    }
    this.renderControl()

    void this.deps?.onRebuildHls({
      id,
      currentTime,
      shouldResume,
      track,
    })
  }

  /** 构建音轨控件配置 */
  buildControl() {
    return buildAudioControlItem({
      controlName: AUDIO_CONTROL_NAME,
      currentAudioTrackLabel: this.currentAudioTrackLabel,
      audioTrackOptions: this.audioTrackOptions,
      visible: this.audioTrackOptions.length > 1,
      onSelectAudioTrack: id => this.applyTrack(id),
    })
  }

  /** 更新 artplayer 中的音轨控件 */
  renderControl() {
    if (!this.art) return
    updateArtplayerControl(this.art, AUDIO_CONTROL_NAME, this.buildControl())
  }

  /** 清理同步定时器 */
  clearSyncTimers() {
    this.syncTimers.forEach(timer => window.clearTimeout(timer))
    this.syncTimers = []
  }

  /** 调度延迟音轨同步 */
  scheduleSync() {
    this.clearSyncTimers()
    const delays = [200, 800, 2000]
    this.syncTimers = delays.map(delay => window.setTimeout(() => {
      this.syncFromHls()
    }, delay))
  }

  destroy() {
    this.clearSyncTimers()
    this.art = null
    this.deps = null
  }

  // ─── 内部方法 ───

  private getTrackLabel(track: any, index: number): string {
    const name = String(track?.name || '').trim()
    const lang = String(track?.lang || track?.attrs?.LANGUAGE || '').trim()
    const normalizedLang = lang.toLowerCase()
    const languageLabel = normalizedLang === 'chi' || normalizedLang === 'zh' || normalizedLang === 'zho'
      ? '中文'
      : (lang || '未知语言')

    if (name.toLowerCase() === 'stereo') {
      return `${languageLabel}${index + 1}`
    }

    if (name && languageLabel) {
      return `${name}（${languageLabel}）`
    }

    if (name) {
      return `${name} ${index + 1}`
    }

    return `${languageLabel}${index + 1}`
  }

  private restorePreference() {
    if (!this.deps) return
    const pickCode = this.deps.getCurrentPickCode()
    if (this.audioPreferenceAppliedForPickCode === pickCode) return
    const preference = loadAudioTrackPreference(pickCode)
    if (!preference) return
    const option = this.audioTrackOptions.find(item => item.id === preference.id && item.label === preference.label)
      || this.audioTrackOptions.find(item => item.label === preference.label)
    if (!option || option.id === this.currentAudioTrackId) {
      this.audioPreferenceAppliedForPickCode = pickCode
      return
    }
    const hls = this.deps.getHlsInstance() as any
    if (!hls || typeof hls.audioTrack !== 'number') return
    this.audioPreferenceAppliedForPickCode = pickCode
    this.preferredAudioTrackId = option.id
    this.currentAudioTrackId = option.id
    this.currentAudioTrackLabel = option.label
    try {
      const track = Array.isArray(hls.audioTracks) ? hls.audioTracks[option.id] : null
      if (track && typeof hls.setAudioOption === 'function') {
        hls.setAudioOption(track)
      }
    }
    catch {
      // ignore and continue
    }
    hls.audioTrack = option.id
  }
}
