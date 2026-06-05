/**
 * 播放器页面逻辑
 */

import Artplayer from 'artplayer'
import type HlsType from 'hls.js'
import playerSkinCss from './core/player-skin.css?inline'
import uiLayerCss from './core/ui-layer.css?inline'
import type { M3u8Item } from '../lib/types'
import { buildArtplayerQuality, buildQualityOptions, getQualityDisplayName, ORIGINAL_PLACEHOLDER_URL } from './core/quality'
import { buildQualityControlItem as buildQualityControlConfig, updateArtplayerControl } from './core/player-quality'
import { buildSpeedControlItem as buildSpeedControlConfig } from './core/player-speed'
import { buildAudioControlItem as buildAudioControlConfig } from './core/player-audio'
import { buildPlaybackModeControlItem as buildPlaybackModeControlConfig } from './core/player-playback-mode-control'
import { fetchM3u8WithRetry } from './core/source'
import { deletePlayHistory, loadAudioTrackPreference, loadPlayHistory, loadPlayHistoryWhenReady, loadSubtitlePreference, loadVideoRotation, loadVolumePreference, saveAudioTrackPreference, saveQualityPreference, saveSubtitlePreference, saveVideoRotation, saveVolumePreference } from './core/history'
import { buildNavControlItem } from './core/player-center-controls'
import type { AudioTrackOption, QualityOption } from './core/types'
import { buildPlaybackModePlan, getPlaybackModeLabel, loadPlaybackMode, savePlaybackMode, type PlaybackMode } from './core/player-playback-mode'
import { runPlayerSmokeChecks } from './core/smoke'
import { renderPlayerError } from './core/dom'
import { createHlsInstance, isHlsSupported } from './core/hls'
import type { VideoPlaybackQualityLike } from './core/types'
import { HoverPreviewController } from './core/hover-preview'
import { bindPlayerEvents } from './core/events'
import { PlayerOverlayController, readOverlayMetaFromQuery, type OverlayPlaylistItem } from './core/overlay'
import { getNextPlaylistItem, getPlaybackEndCountdownPlan, getPreviousPlaylistItem } from './core/player-navigation'
import { fetchBreadcrumbPath, fetchPlaylistData, resolvePlaybackBundle, type ResolvedPlaybackBundle } from './core/player-services'
import { buildOverlayMetaPatch, buildPlayerHistoryUrl, findPlaylistItemByPickCode } from './core/player-switch'
import { MoveDialog } from './core/move-dialog'
import {
  applyFallbackToHlsState,
  applySelectedQualityOption,
  isOriginalPlaceholderOption,
  type PlaybackState,
  refreshPlaybackQualityState,
  resolveOriginalPlaceholderUrl,
  syncPlaybackStateByUrl,
} from './core/playback-state'
import { ensureServiceWorkerReady, getRuntimeApi, sendRuntimeMessageSafe } from './core/runtime'
import {
  buildUpdatedMarkedUrl,
  readPathFromLocation,
  readPlayerBootstrapConfig,
  readPlaylistCidFromLocation,
} from './core/player-query'
import { deleteVideoFile, fetchFavoriteStatus, updateFavoriteStatus } from './core/player-api'
import { buildPlaybackNavState, getDeleteFallback, getPlaylistPosition } from './core/playlist-navigation'
import { readTemporaryPlayerPlaylist } from '../shared/player-playlist-cache'
import { canUseNativeUltraSource, isConservativeNativeUltraExtension, shouldFallbackNativeBlackVideo, shouldFallbackNativeSilentAudio, shouldRetryNativePlayback } from './core/native-playback'
import { applyRotationToVideo, buildRotateControlItem, getNextRotationDegrees } from './core/player-rotation'
import { bindClickSelectorBehavior } from './core/player-selector'
import { SubtitleManager } from './core/subtitle-manager'
import type { SubtitleItem } from './core/subtitles'

function injectPlayerSkinStyles() {
  if (document.getElementById('m115-player-skin-style')) return
  const style = document.createElement('style')
  style.id = 'm115-player-skin-style'
  style.textContent = `${playerSkinCss}\n${uiLayerCss}`
  document.head.appendChild(style)
}

injectPlayerSkinStyles()

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

interface PlayerConfig {
  pickCode: string
  traceId?: string
  clickTs?: number
  keepPlaylistOpen?: boolean
  playlistToken?: string
}

function isInterruptedPlayError(reason: unknown) {
  if (!(reason instanceof DOMException) && !(reason instanceof Error)) return false
  return reason.name === 'AbortError' && /play\(\).*interrupted|interrupted by a new load request/i.test(reason.message)
}

function bindInterruptedPlayRejectionGuard() {
  window.addEventListener('unhandledrejection', (event) => {
    if (isInterruptedPlayError(event.reason)) {
      event.preventDefault()
    }
  })
}

function safePlay(art: Artplayer | null) {
  if (!art) return
  void art.play().catch(() => {
    // Ignore native play promise rejections during source switches and transient media reloads.
  })
}

function playerDebug(...args: unknown[]) {
  if (localStorage.getItem('115m-player-debug') === '1') {
    console.debug(...args)
  }
}

bindInterruptedPlayRejectionGuard()

class PlayerManager {
  private static readonly QUALITY_CONTROL_NAME = 'm115-quality-control'
  private static readonly SPEED_CONTROL_NAME = 'm115-speed-control'
  private static readonly PLAYBACK_MODE_CONTROL_NAME = 'm115-playback-mode-control'
  private static readonly AUDIO_CONTROL_NAME = 'm115-audio-control'
  private static readonly ROTATE_CONTROL_NAME = 'm115-rotate-control'
  private static readonly PREV_CONTROL_NAME = 'm115-prev-control'
  private static readonly NEXT_CONTROL_NAME = 'm115-next-control'
  private static readonly VIDEO_SWITCH_COOLDOWN_MS = 1200
  private static readonly NATIVE_AUDIO_PROBE_DELAY_MS = 4500
  private static readonly NATIVE_STALL_CHECK_INTERVAL_MS = 1500
  private static readonly NATIVE_STALL_TIME_THRESHOLD_MS = 4500
  private static readonly NATIVE_STALL_MIN_BUFFER_AHEAD_SEC = 6
  private static readonly NATIVE_STALL_MAX_TIME_DRIFT_SEC = 0.12
  private static readonly NATIVE_SEEK_LONG_JUMP_SEC = 45
  private static readonly NATIVE_SEEK_RECOVERY_WINDOW_MS = 8000
  private artplayer: Artplayer | null = null
  private hlsInstance: HlsType | null = null
  private m3u8List: M3u8Item[] = []
  private currentPickCode: string
  private isNativeVideo = false
  private ultraUrl: string | null = null
  private qualityOptions: QualityOption[] = []
  private currentQuality = 0
  private currentQualityLabel = '加载中'
  private infoMenuTimer: number | null = null
  private infoMenuEl: HTMLElement | null = null
  private hoverPreview: HoverPreviewController | null = null
  private overlay: PlayerOverlayController | null = null
  private playlistItemsCache: OverlayPlaylistItem[] = []
  private playlistLoadingPromise: Promise<OverlayPlaylistItem[]> | null = null
  private autoNextTimer: number | null = null
  private switchVideoRequestId = 0
  private traceId = ''
  private clickTs = 0
  private initStartTs = 0
  private perfMarks: Partial<Record<'init' | 'ultraReady' | 'loadedmetadata' | 'canplay' | 'playing', number>> = {}
  private firstPlayingReported = false
  private _initUrl = ''
  private cleanupKeyboard: (() => void) | null = null
  private readonly keepPlaylistOpenOnInit: boolean
  private readonly playlistToken?: string
  private readonly nativeUltraSupported: boolean
  private readonly nativeUltraConservative: boolean
  private readonly title: string
  private currentPlaybackType: 'native' | 'hls' = 'hls'
  private cleanupResize: (() => void) | null = null
  private cleanupRotationContainerObserver: (() => void) | null = null
  private rotationReflowRaf = 0
  private lastPlaylistProgressSyncSec = -1
  private nativePlaybackRetryCount = 0
  private nativeAudioProbeTimer: number | null = null
  private nativeVideoProbeTimer: number | null = null
  private nativeStallCheckTimer: number | null = null
  private nativeStallStartedAt = 0
  private nativeStallLastTime = 0
  private nativeStallLastFrameCount = 0
  private nativeStallFallbackInFlight = false
  private nativeSeekStartedAt = 0
  private nativeSeekFromTime = 0
  private nativeSeekRecoveryUntil = 0
  private currentRotation = 0
  private currentPlaybackRate = 1
  private currentPlaybackMode: PlaybackMode = loadPlaybackMode()
  private audioTrackOptions: AudioTrackOption[] = []
  private currentAudioTrackId = -1
  private currentAudioTrackLabel = '音轨'
  private subtitleManager: SubtitleManager | null = null
  private subtitleControlEl: HTMLElement | null = null
  private audioTrackSyncTimers: number[] = []
  private currentHlsSourceUrl: string | null = null
  private currentHlsLogicalUrl: string | null = null
  private preferredAudioTrackId: number | null = null
  private subtitlePreferenceAppliedForPickCode = ''
  private audioPreferenceAppliedForPickCode = ''
  private isSwitchingVideo = false
  private lastVideoSwitchStartedAt = 0
  private pendingVideoSwitch: { pickCode: string, keepPlaylistOpen: boolean, autoPlay: boolean } | null = null
  private switchCooldownTimer: number | null = null
  private readonly handleRuntimeMessage = (message: any) => {
    if (message?.type === 'MOVE_SUCCESS_REFRESH') {
      void this.refreshBreadcrumbs()
      this.overlay?.showToast('文件已移动')
      return
    }

    if (message?.type === 'DELETE_SUCCESS_REFRESH' && message?.data?.pickCode === this.currentPickCode) {
      this.overlay?.showToast('文件已删除')
    }
  }

  constructor(config: PlayerConfig) {
    this.currentPickCode = config.pickCode
    this.traceId = config.traceId || `${config.pickCode}-${Date.now()}`
    this.clickTs = config.clickTs || 0
    this.keepPlaylistOpenOnInit = config.keepPlaylistOpen === true
    this.playlistToken = config.playlistToken
    this.title = new URLSearchParams(window.location.search).get('title') || ''
    this.nativeUltraSupported = canUseNativeUltraSource(
      this.title,
      null,
    )
    this.nativeUltraConservative = isConservativeNativeUltraExtension(
      this.title,
      null,
    )
    this.initStartTs = performance.now()
    this.perfMarks.init = this.initStartTs
    runPlayerSmokeChecks()
    this.init()
  }

  private perf(stage: string, extra?: Record<string, unknown>) {
    const now = performance.now()
    const payload = {
      stage,
      traceId: this.traceId,
      pickCode: this.currentPickCode,
      clickToNowMs: this.clickTs > 0 ? Math.round(Date.now() - this.clickTs) : -1,
      initCostMs: Math.round(now - this.initStartTs),
      ...extra,
    }
    playerDebug('[115m][Perf]', payload)
  }

  private reportFirstFrameSummary() {
    if (this.firstPlayingReported) return
    const p = this.perfMarks
    if (!p.playing || !p.init) return
    this.firstPlayingReported = true

    const clickToPlay = this.clickTs > 0 ? Math.round(Date.now() - this.clickTs) : -1
    const initToUltra = p.ultraReady ? Math.round(p.ultraReady - p.init) : -1
    const ultraToMeta = p.ultraReady && p.loadedmetadata ? Math.round(p.loadedmetadata - p.ultraReady) : -1
    const metaToPlay = p.loadedmetadata ? Math.round(p.playing - p.loadedmetadata) : -1
    const initToPlay = Math.round(p.playing - p.init)

    playerDebug('[115m][首播耗时]', {
      traceId: this.traceId,
      pickCode: this.currentPickCode,
      clickToPlayMs: clickToPlay,
      initToPlayMs: initToPlay,
      initToUltraMs: initToUltra,
      ultraToLoadedmetadataMs: ultraToMeta,
      loadedmetadataToPlayingMs: metaToPlay,
    })
  }

  private async init() {
    try {
      this.perf('player-init-start')

      // 确保 Service Worker 已就绪（冷启动时可能需要等待）
      const loadingTextEl = document.getElementById('loading-text')
      if (loadingTextEl) {
        loadingTextEl.textContent = '正在初始化...'
      }
      await ensureServiceWorkerReady()

      if (loadingTextEl) {
        loadingTextEl.textContent = '正在获取播放源...'
      }

      const playback = await this.resolvePlaybackForPickCode(this.currentPickCode)
      this.applyResolvedPlayback(playback)
      this.currentRotation = loadVideoRotation(this.currentPickCode)

      this.perfMarks.ultraReady = performance.now()
      this.perf('ultra-source-ready', { ok: !!playback.ultraUrl, m3u8Count: this.m3u8List.length })

      this.createArtplayer(playback.initialPlayback.url, playback.initialPlayback.type)
      this.perf(playback.initialPlayback.type === 'native' ? 'create-player-native' : 'create-player-hls', {
        label: playback.initialPlayback.currentQualityLabel,
        hasPreference: !!playback.qualityPreference,
      })

      const currentUrl = this.artplayer?.url || ''
      this.refreshQualityState(currentUrl)
      this.renderQualityPanel()
      this.renderSubtitleControl()
      this.renderPlaybackNavControls()
      this.renderRotateControl()
      this.renderSpeedControl()

      const initPickCode = this.currentPickCode
      void loadPlayHistory(initPickCode, (time) => {
        if (this.artplayer && this.currentPickCode === initPickCode) {
          this.artplayer.seek = time
        }
      })
    }
    catch (error) {
      this.showError(`播放器初始化失败: ${error instanceof Error ? error.message : String(error)}`)
    }
    finally {
      const loadingEl = document.getElementById('loading')
      if (loadingEl) loadingEl.style.display = 'none'
    }
  }

  private async initHls(video: HTMLVideoElement, url: string): Promise<HlsType> {
    if (this.hlsInstance) {
      this.hlsInstance.destroy()
      this.hlsInstance = null
    }
    if (this.currentHlsSourceUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.currentHlsSourceUrl)
    }
    this.currentHlsSourceUrl = null
    this.currentHlsLogicalUrl = url
    const sourceUrl = await this.buildHlsPlaybackUrl(url)
    this.currentHlsSourceUrl = sourceUrl
    const hls = await createHlsInstance(video, sourceUrl)
    this.hlsInstance = hls

    const applyPreferredAudioTrack = () => {
      const preferredId = this.preferredAudioTrackId
      if (preferredId == null) return
      const anyHls = hls as any
      const tracks = Array.isArray(anyHls.audioTracks) ? anyHls.audioTracks : []
      const track = tracks[preferredId]
      if (!track) return
      try {
        if (typeof anyHls.setAudioOption === 'function') {
          anyHls.setAudioOption(track)
        }
      }
      catch {
        // ignore and continue
      }
      anyHls.audioTrack = preferredId
    }

    hls.on('hlsAudioTracksUpdated' as any, () => {
      applyPreferredAudioTrack()
      this.syncAudioTracksFromHls()
    })
    hls.on('hlsAudioTrackSwitched' as any, () => {
      this.syncAudioTracksFromHls()
    })
    hls.on('hlsManifestParsed' as any, () => {
      applyPreferredAudioTrack()
      this.syncAudioTracksFromHls()
    })
    this.scheduleAudioTrackSync()
    void this.hydrateAudioTracksFromMasterPlaylist()
    return hls
  }

  private async fetchMasterPlaylistText(): Promise<string | null> {
    try {
      const response = await fetch(`https://115.com/api/video/m3u8/${this.currentPickCode}.m3u8`, {
        credentials: 'include',
      })
      const text = await response.text()
      return text.startsWith('#EXTM3U') ? text : null
    }
    catch {
      return null
    }
  }

  private async buildHlsPlaybackUrl(selectedUrl: string): Promise<string> {
    const masterText = await this.fetchMasterPlaylistText()
    if (!masterText || !/#EXT-X-MEDIA:TYPE=AUDIO/i.test(masterText)) {
      return selectedUrl
    }

    const lines = masterText.split(/\r?\n/)
    const audioTags = lines.filter(line => /#EXT-X-MEDIA:TYPE=AUDIO/i.test(line.trim()))
    if (audioTags.length === 0) {
      return selectedUrl
    }

    let streamInf = ''
    for (let i = 0; i < lines.length; i += 1) {
      if (lines[i]?.trim() === selectedUrl.trim()) {
        streamInf = lines[i - 1]?.trim() || ''
        break
      }
    }

    if (!streamInf.startsWith('#EXT-X-STREAM-INF')) {
      const groupId = audioTags[0].match(/GROUP-ID="([^"]+)"/i)?.[1] || 'Audio-Group'
      streamInf = `#EXT-X-STREAM-INF:BANDWIDTH=3000000,AUDIO="${groupId}",NAME="custom"`
    }
    else if (!/\bAUDIO=/i.test(streamInf)) {
      const groupId = audioTags[0].match(/GROUP-ID="([^"]+)"/i)?.[1] || 'Audio-Group'
      streamInf = `${streamInf},AUDIO="${groupId}"`
    }

    const wrapped = ['#EXTM3U', ...audioTags, streamInf, selectedUrl].join('\n')
    return URL.createObjectURL(new Blob([wrapped], { type: 'application/vnd.apple.mpegurl' }))
  }

  private clearAudioTrackSyncTimers() {
    this.audioTrackSyncTimers.forEach(timer => window.clearTimeout(timer))
    this.audioTrackSyncTimers = []
  }

  private scheduleAudioTrackSync() {
    this.clearAudioTrackSyncTimers()
    const delays = [0, 300, 1000, 2500]
    this.audioTrackSyncTimers = delays.map(delay => window.setTimeout(() => {
      this.syncAudioTracksFromHls()
    }, delay))
  }

  private createArtplayer(videoUrl: string, type: 'native' | 'hls') {
    const container = document.getElementById('artplayer-app')
    if (!container) throw new Error('找不到播放器容器')
    const volumePreference = loadVolumePreference()

    // 记录初始 URL，用于区分初始化和用户手动切换
    this._initUrl = videoUrl

    this.refreshQualityState(videoUrl)

    // YouTube-like idle delay: keep controls visible for a few seconds after mouse movement.
    Artplayer.CONTROL_HIDE_TIME = 6000

    this.artplayer = new Artplayer({
      container: container as HTMLDivElement,
      url: videoUrl,
      volume: volumePreference.volume,
      autoplay: true,
      pip: false,
      autoMini: true,
      screenshot: false,
      setting: false,
      controls: [
        this.buildPrevControlItem(),
        this.buildNextControlItem(),
        this.buildRotateControlItem(),
        this.buildQualityControlItem(),
        this.buildAudioControlItem(),
        this.buildSubtitleControlItem(),
        this.buildPlaybackModeControlItem(),
        this.buildSpeedControlItem(),
      ],
      loop: false,
      playbackRate: false,
      aspectRatio: false,
      fullscreen: true,
      miniProgressBar: true,
      theme: '#1890ff',
      lang: 'zh-cn',
      contextmenu: [],
      customType: {
        m3u8: async (video, url) => {
          if (url === ORIGINAL_PLACEHOLDER_URL) {
            saveQualityPreference(this.currentPickCode, '115原画', 9999)
            // 立即更新内部状态，以便后续 UI 同步正常工作
            const opt = this.qualityOptions.find(o => o.url === url)
            if (opt) {
              this.applyPlaybackStatePatch(applySelectedQualityOption(this.getPlaybackState(), opt))
              this.renderQualityPanel()
            }

            const resolvedUrl = await this.ensureOriginalSourceLoaded()
            if (!resolvedUrl) {
              this.showError('115原画加载失败，请稍后重试')
              return
            }
            url = resolvedUrl
          }
          else {
            const opt = this.qualityOptions.find(o => o.url === url)
            if (opt) {
              // 只要是手动切换（非首次加载且已就绪），就记录偏好
              if (this.perfMarks.loadedmetadata) {
                saveQualityPreference(this.currentPickCode, opt.label, opt.quality)
              }
              this.applyPlaybackStatePatch(applySelectedQualityOption(this.getPlaybackState(), opt))
              this.renderQualityPanel()
            }
          }

          if (this.artplayer && await isHlsSupported()) {
            await this.initHls(video as HTMLVideoElement, url)
          }
          else {
            this.showError('您的浏览器不支持 HLS 播放')
          }
        },
      },
    })

    this.artplayer.video.muted = volumePreference.muted

    // Don't use ArtPlayer's fullscreenWeb — it uses position:fixed + moves to body,
    // which covers #playlist-sidebar. Instead the player fills its flex container naturally.
    Artplayer.FULLSCREEN_WEB_IN_BODY = false

    this.artplayer.on('restart', (url) => {
      if (typeof url !== 'string' || url === ORIGINAL_PLACEHOLDER_URL) return
      const opt = this.qualityOptions.find(o => o.url === url)
      if (opt && this.perfMarks.loadedmetadata) {
        saveQualityPreference(this.currentPickCode, opt.label, opt.quality)
        this.applyPlaybackStatePatch(applySelectedQualityOption(this.getPlaybackState(), opt))
        this.renderQualityPanel()
      }
      this.setupProgressHoverPreview(url, this.currentPlaybackType)
    })

    this.artplayer.on('video:pause', () => {
      this.syncCurrentPlaylistProgress(true)
    })

    this.artplayer.on('video:seeking', () => {
      if (!this.artplayer || !this.isNativeVideo || this.currentPlaybackType !== 'native') return
      this.nativeSeekStartedAt = Date.now()
      this.nativeSeekFromTime = this.nativeStallLastTime || this.artplayer.currentTime || 0
      this.nativeStallStartedAt = 0
    })

    this.artplayer.on('video:seeked', () => {
      if (!this.artplayer || !this.isNativeVideo || this.currentPlaybackType !== 'native') return
      const targetTime = this.artplayer.currentTime || 0
      const jumpDistance = Math.abs(targetTime - this.nativeSeekFromTime)
      this.nativeSeekRecoveryUntil = jumpDistance >= PlayerManager.NATIVE_SEEK_LONG_JUMP_SEC
        ? Date.now() + PlayerManager.NATIVE_SEEK_RECOVERY_WINDOW_MS
        : 0
      this.nativeStallStartedAt = 0
      this.nativeStallLastTime = targetTime
      this.nativeStallLastFrameCount = this.getTotalVideoFrames(this.artplayer.video as HTMLVideoElement)
      this.scheduleNativeStallCheck()
    })

    this.artplayer.on('video:play', () => {})

    this.artplayer.on('video:timeupdate', () => {
      this.syncCurrentPlaylistProgress()
    })

    this.bindWindowResize()
    this.bindRotationContainerObserver()
    this.applyVideoRotation()

    if (type === 'native') {
      this.currentQuality = 9999
      this.currentQualityLabel = '无损'
      this.audioTrackOptions = []
      this.currentAudioTrackId = -1
      this.currentAudioTrackLabel = '音轨'
    }

    this.setupTopNav()
    this.setupProgressHoverPreview(videoUrl, type)
    this.setupSubtitles()
    void this.fetchBreadcrumbs()

    if (this.artplayer) {
      this.setupStatsMenu()

      if (this.cleanupKeyboard) {
        this.cleanupKeyboard()
      }
      this.cleanupKeyboard = bindPlayerEvents({
        art: this.artplayer,
        getType: () => this.currentPlaybackType,
        getPickCode: () => this.currentPickCode,
        getQualityLabel: () => this.currentQualityLabel,
        onPerf: (stage, extra) => this.perf(stage, extra),
        onReady: () => {
          this.safeRemoveContextmenuItem('playbackRate')
          this.safeRemoveContextmenuItem('aspectRatio')
          this.safeRemoveContextmenuItem('flip')
          this.safeRemoveContextmenuItem('info')
          this.safeRemoveContextmenuItem('close')
          this.artplayer!.contextmenu.add({
            name: 'videoStats',
            index: 40,
            html: this.buildStatsHtml(),
            mounted: ($el: HTMLElement) => { this.infoMenuEl = $el },
          })
          this.renderQualityPanel()
          this.renderAudioControl()
          this.renderSubtitleControl()
          this.renderPlaybackModeControl()
          this.renderPlaybackNavControls()
          this.renderRotateControl()
          this.renderSpeedControl()
        },
        onLoadedmetadata: () => {
          this.perfMarks.loadedmetadata = performance.now()
          this.updateQualityByUrl(this.artplayer?.url || '')
          this.renderQualityPanel()
          this.renderAudioControl()
          this.renderSubtitleControl()
          this.renderPlaybackModeControl()
          this.renderSpeedControl()
          this.applyVideoRotation()
          this.hoverPreview?.updateSize()
        },
        onCanplay: () => {
          this.perfMarks.canplay = performance.now()
        },
        onPlaying: () => {
          this.clearPlaybackEndState()
          this.nativePlaybackRetryCount = 0
          this.clearNativeAudioProbe()
          this.resetNativeStallState()
          this.scheduleNativeStallCheck()
          this.perfMarks.playing = performance.now()
          this.reportFirstFrameSummary()
          if (this.isNativeVideo) {
            this.scheduleNativeAudioProbe()
            this.scheduleNativeVideoProbe()
          }
        },
        onVolumeChange: () => {
          if (!this.artplayer) return
          saveVolumePreference({
            volume: this.artplayer.volume,
            muted: this.artplayer.video.muted,
          })
        },
        onEnded: () => {
          this.handlePlaybackEnded()
        },
        onError: () => {
          if (this.isNativeVideo) {
            void this.handleNativePlaybackError()
          }
        },
      })
    }
  }


  private updateQualityByUrl(url: string) {
    this.applyPlaybackStatePatch(syncPlaybackStateByUrl(this.getPlaybackState(), url))
  }

  private refreshQualityState(currentUrl: string) {
    this.applyPlaybackStatePatch(refreshPlaybackQualityState(this.getPlaybackState(), currentUrl))
  }

  private getPlaybackState(): PlaybackState {
    return {
      ultraUrl: this.ultraUrl,
      m3u8List: this.m3u8List,
      qualityOptions: this.qualityOptions,
      currentQuality: this.currentQuality,
      currentQualityLabel: this.currentQualityLabel,
      isNativeVideo: this.isNativeVideo,
    }
  }

  private applyPlaybackStatePatch(state: Partial<PlaybackState>) {
    Object.assign(this, state)
  }

  private buildQualityControlItem(): any {
    return buildQualityControlConfig({
      controlName: PlayerManager.QUALITY_CONTROL_NAME,
      currentQualityLabel: this.currentQualityLabel,
      currentUrl: this.artplayer?.url || '',
      qualityOptions: this.qualityOptions,
      onSelect: async target => await this.switchQuality(target),
    })
  }

  private renderQualityPanel() {
    this.updateQualityControl()
  }

  private buildSpeedControlItem(): any {
    return buildSpeedControlConfig({
      controlName: PlayerManager.SPEED_CONTROL_NAME,
      currentPlaybackRate: this.currentPlaybackRate,
      onSelectPlaybackRate: value => this.applyPlaybackRate(value),
    })
  }

  private buildPlaybackModeControlItem(): any {
    return buildPlaybackModeControlConfig({
      controlName: PlayerManager.PLAYBACK_MODE_CONTROL_NAME,
      currentPlaybackMode: this.currentPlaybackMode,
      onSelectPlaybackMode: mode => this.applyPlaybackModeSelection(mode),
    })
  }

  private renderPlaybackModeControl() {
    if (!this.artplayer) return
    updateArtplayerControl(this.artplayer, PlayerManager.PLAYBACK_MODE_CONTROL_NAME, this.buildPlaybackModeControlItem())
  }

  private buildAudioControlItem(): any {
    return buildAudioControlConfig({
      controlName: PlayerManager.AUDIO_CONTROL_NAME,
      currentAudioTrackLabel: this.currentAudioTrackLabel,
      audioTrackOptions: this.audioTrackOptions,
      visible: this.audioTrackOptions.length > 1,
      onSelectAudioTrack: id => this.applyAudioTrack(id),
    })
  }

  private renderAudioControl() {
    if (!this.artplayer) return
    updateArtplayerControl(this.artplayer, PlayerManager.AUDIO_CONTROL_NAME, this.buildAudioControlItem())
  }

  private buildSubtitleControlItem(): any {
    const items = this.subtitleManager?.getItems() || []
    const selectedSid = this.subtitleManager?.getSelectedSid() || ''
    const selected = items.find(item => item.sid === selectedSid)
    const currentSubtitleLabel = selected?.title || (items.length ? '字幕' : '无字幕')
    const compactSubtitleLabel = getSubtitleControlLabel(selected?.title || '', items.length > 0)
    const listHtml = [
      `<button type="button" class="m115-subtitle-option ${selectedSid ? '' : 'is-active'}" data-sid="">关闭字幕</button>`,
      ...items.map(item => `<button type="button" class="m115-subtitle-option ${item.sid === selectedSid ? 'is-active' : ''}" data-sid="${this.escapeAttr(item.sid)}">${this.escapeHtml(item.title)}</button>`),
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
        <span class="art-selector-value m115-subtitle-value" title="${this.escapeAttr(currentSubtitleLabel)}">${this.escapeHtml(compactSubtitleLabel)}</span>
        <div class="art-selector-list">${listHtml}</div>
      </div>`,
      mounted: (el: HTMLElement) => {
        el.classList.add('m115-subtitle-control')
        bindClickSelectorBehavior(el)
        el.style.display = items.length > 0 ? 'flex' : 'inline-flex'
        this.subtitleControlEl = el
        el.querySelectorAll<HTMLButtonElement>('.m115-subtitle-option').forEach((button) => {
          button.addEventListener('click', (event) => {
            event.preventDefault()
            event.stopPropagation()
            void this.applySubtitleSelection(button.dataset.sid || '', true)
          })
        })
      },
    }
  }

  private renderSubtitleControl() {
    if (!this.artplayer) return
    updateArtplayerControl(this.artplayer, 'm115-subtitle-control', this.buildSubtitleControlItem())
  }

  private setupSubtitles() {
    if (!this.artplayer || this.subtitleManager) return
    const container = this.artplayer.video.parentElement as HTMLElement | null
    if (!container) return

    this.subtitleManager = new SubtitleManager({
      container,
      getVideo: () => this.artplayer?.video || null,
      sendMessage: sendRuntimeMessageSafe,
      onListChange: () => this.renderSubtitleControl(),
      onTrackChange: () => this.renderSubtitleControl(),
      onListLoaded: () => this.restoreSubtitlePreferenceForCurrentVideo(),
      onError: message => this.overlay?.showToast(message),
    })
    void this.subtitleManager.loadList(this.currentPickCode)
  }

  private resetSubtitlesForCurrentVideo() {
    this.subtitleManager?.clearTrack()
    void this.subtitleManager?.loadList(this.currentPickCode)
  }

  private async applySubtitleSelection(sid: string, remember = false) {
    if (!this.subtitleManager) return
    const items = this.subtitleManager.getItems()
    const item = sid ? items.find(entry => entry.sid === sid) : null
    await this.subtitleManager.select(sid)
    if (remember) {
      saveSubtitlePreference(this.currentPickCode, item
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

  private restoreSubtitlePreferenceForCurrentVideo() {
    if (!this.subtitleManager || this.subtitlePreferenceAppliedForPickCode === this.currentPickCode) return
    const preference = loadSubtitlePreference(this.currentPickCode)
    if (!preference) return
    this.subtitlePreferenceAppliedForPickCode = this.currentPickCode
    if (preference.disabled) {
      void this.applySubtitleSelection('', false)
      return
    }
    const item = this.findPreferredSubtitleItem(this.subtitleManager.getItems(), preference)
    if (item) {
      void this.applySubtitleSelection(item.sid, false)
    }
  }

  private findPreferredSubtitleItem(items: SubtitleItem[], preference: { sid: string, title: string, type: string, language?: string }) {
    return items.find(item => item.sid === preference.sid)
      || items.find(item => item.title === preference.title && item.type === preference.type && (item.language || '') === (preference.language || ''))
      || items.find(item => item.title === preference.title)
  }

  private escapeHtml(value: string) {
    return value.replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char] || char)
  }

  private escapeAttr(value: string) {
    return this.escapeHtml(value).replace(/'/g, '&#39;')
  }

  private renderSpeedControl() {
    if (!this.artplayer) return
    updateArtplayerControl(this.artplayer, PlayerManager.SPEED_CONTROL_NAME, this.buildSpeedControlItem())
  }

  private buildRotateControlItem(): any {
    return buildRotateControlItem({
      controlName: PlayerManager.ROTATE_CONTROL_NAME,
      rotation: this.currentRotation,
      onRotate: () => this.rotateVideoClockwise(),
    })
  }

  private renderRotateControl() {
    if (!this.artplayer) return
    updateArtplayerControl(this.artplayer, PlayerManager.ROTATE_CONTROL_NAME, this.buildRotateControlItem())
  }

  private safeRemoveContextmenuItem(name: string) {
    try {
      this.artplayer?.contextmenu.remove(name)
    }
    catch {
      // Some built-in items only exist when the related feature is enabled.
    }
  }

  private buildPrevControlItem(): any {
    const state = buildPlaybackNavState(getPlaylistPosition(this.playlistItemsCache, this.currentPickCode))
    const enabled = state.hasPrevious && !this.isSwitchingVideo
    return buildNavControlItem({
      controlName: PlayerManager.PREV_CONTROL_NAME,
      direction: 'prev',
      index: 9,
      enabled,
      title: this.isSwitchingVideo ? '正在切换视频' : (state.previousTitle ? `上一集：${state.previousTitle}` : '没有上一集'),
      onClick: () => { void this.playPrevious() },
    })
  }

  private buildNextControlItem(): any {
    const state = buildPlaybackNavState(getPlaylistPosition(this.playlistItemsCache, this.currentPickCode))
    const enabled = state.hasNext && !this.isSwitchingVideo
    return buildNavControlItem({
      controlName: PlayerManager.NEXT_CONTROL_NAME,
      direction: 'next',
      index: 11,
      enabled,
      title: this.isSwitchingVideo ? '正在切换视频' : (state.nextTitle ? `下一集：${state.nextTitle}` : '没有下一集'),
      onClick: () => { void this.playNext() },
    })
  }

  private bindWindowResize() {
    if (this.cleanupResize) return
    const handleResize = () => this.scheduleVideoRotationReflow()
    window.addEventListener('resize', handleResize)
    this.cleanupResize = () => {
      window.removeEventListener('resize', handleResize)
      this.cleanupResize = null
    }
  }

  private bindRotationContainerObserver() {
    if (this.cleanupRotationContainerObserver || !this.artplayer?.video) return
    const container = this.artplayer.video.parentElement as HTMLElement | null
    if (!container || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => {
      this.scheduleVideoRotationReflow()
    })
    observer.observe(container)

    this.cleanupRotationContainerObserver = () => {
      observer.disconnect()
      this.cleanupRotationContainerObserver = null
    }
  }

  private scheduleVideoRotationReflow() {
    if (this.rotationReflowRaf) {
      window.cancelAnimationFrame(this.rotationReflowRaf)
    }

    const run = () => {
      this.applyVideoRotation()
      this.rotationReflowRaf = window.requestAnimationFrame(() => {
        this.applyVideoRotation()
        this.rotationReflowRaf = 0
      })
    }

    this.rotationReflowRaf = window.requestAnimationFrame(run)
  }

  private applyVideoRotation() {
    if (!this.artplayer) return
    applyRotationToVideo({
      video: this.artplayer.video,
      container: this.artplayer.video.parentElement as HTMLElement | null,
      rotation: this.currentRotation,
    })
  }

  private rotateVideoClockwise() {
    this.currentRotation = getNextRotationDegrees(this.currentRotation)
    saveVideoRotation(this.currentPickCode, this.currentRotation)
    this.applyVideoRotation()
    this.renderRotateControl()
    this.overlay?.showToast(this.currentRotation === 0 ? '画面旋转已重置' : `画面已旋转 ${this.currentRotation}°`)
  }

  private applyPlaybackRate(value: number) {
    this.currentPlaybackRate = value
    if (this.artplayer) {
      this.artplayer.video.playbackRate = value
      try {
        ;(this.artplayer as any).playbackRate = value
      }
      catch {
        // Fallback to direct video playbackRate when the public setter is unavailable.
      }
    }
    this.renderSpeedControl()
  }

  private applyPlaybackModeSelection(mode: PlaybackMode) {
    this.currentPlaybackMode = mode
    savePlaybackMode(mode)
    this.renderPlaybackModeControl()
    this.overlay?.showToast(`播放模式：${getPlaybackModeLabel(mode)}`)
  }

  private getAudioTrackLabel(track: any, index: number) {
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

  private syncAudioTracksFromHls() {
    const hls = this.hlsInstance as any
    const tracks = Array.isArray(hls?.audioTracks) ? hls.audioTracks : []
    if (tracks.length === 0) {
      return
    }
    this.audioTrackOptions = tracks.map((track: any, index: number) => ({
      id: index,
      label: this.getAudioTrackLabel(track, index),
    }))
    this.currentAudioTrackId = typeof hls?.audioTrack === 'number' ? hls.audioTrack : -1
    const active = this.audioTrackOptions.find(track => track.id === this.currentAudioTrackId)
    this.currentAudioTrackLabel = active?.label || (this.audioTrackOptions.length > 0 ? this.audioTrackOptions[0].label : '音轨')
    this.restoreAudioPreferenceForCurrentVideo()
    this.renderAudioControl()
    playerDebug('[115m][audio] tracks', {
      count: this.audioTrackOptions.length,
      currentAudioTrackId: this.currentAudioTrackId,
      options: this.audioTrackOptions,
      rawTracks: tracks.map((track: any, index: number) => ({
        index,
        id: track?.id,
        name: track?.name,
        lang: track?.lang,
        groupId: track?.groupId,
        url: track?.url,
        default: track?.default,
      })),
    })
  }

  private async hydrateAudioTracksFromMasterPlaylist() {
    try {
      const response = await fetch(`https://115.com/api/video/m3u8/${this.currentPickCode}.m3u8`, {
        credentials: 'include',
      })
      const text = await response.text()
      const tags = text.match(/#EXT-X-MEDIA:TYPE=AUDIO[^\n]*/ig) || []
      if (tags.length <= 1) {
        return
      }

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
        this.renderAudioControl()
        playerDebug('[115m][audio] fallback tracks from master playlist', fallbackTracks)
      }
    }
    catch (error) {
      console.warn('[115m][audio] hydrateAudioTracksFromMasterPlaylist failed', error)
    }
  }

  private applyAudioTrack(id: number) {
    const hls = this.hlsInstance as any
    if (!hls || typeof hls.audioTrack !== 'number') {
      this.overlay?.showToast('当前播放链路暂不支持切换音轨')
      return
    }
    const currentTime = this.artplayer?.currentTime || 0
    const shouldResume = !!this.artplayer && !this.artplayer.video.paused
    const track = Array.isArray(hls.audioTracks) ? hls.audioTracks[id] : null
    this.preferredAudioTrackId = id
    this.currentAudioTrackId = id
    const active = this.audioTrackOptions.find(track => track.id === id)
    if (active) {
      this.currentAudioTrackLabel = active.label
      saveAudioTrackPreference(this.currentPickCode, active)
    }
    this.renderAudioControl()

    void this.rebuildHlsForAudioTrack({
      id,
      currentTime,
      shouldResume,
      track,
    })
  }

  private restoreAudioPreferenceForCurrentVideo() {
    if (this.audioPreferenceAppliedForPickCode === this.currentPickCode) return
    const preference = loadAudioTrackPreference(this.currentPickCode)
    if (!preference) return
    const option = this.audioTrackOptions.find(item => item.id === preference.id && item.label === preference.label)
      || this.audioTrackOptions.find(item => item.label === preference.label)
    if (!option || option.id === this.currentAudioTrackId) {
      this.audioPreferenceAppliedForPickCode = this.currentPickCode
      return
    }
    const hls = this.hlsInstance as any
    if (!hls || typeof hls.audioTrack !== 'number') return
    this.audioPreferenceAppliedForPickCode = this.currentPickCode
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

  private async rebuildHlsForAudioTrack(params: {
    id: number
    currentTime: number
    shouldResume: boolean
    track: any
  }) {
    if (!this.artplayer || !this.currentHlsLogicalUrl) {
      this.overlay?.showToast('当前播放链路暂不支持切换音轨')
      return
    }

    const video = this.artplayer.video as HTMLVideoElement
    const targetUrl = this.currentHlsLogicalUrl

    try {
      await this.initHls(video, targetUrl)
      if (!this.hlsInstance) {
        return
      }

      const restore = () => {
        if (!this.artplayer) return
        try {
          this.artplayer.seek = params.currentTime
        }
        catch {
          // ignore seek restore errors
        }
        if (params.shouldResume) {
          safePlay(this.artplayer)
        }
      }

      this.artplayer.once('video:loadedmetadata', restore)
      this.artplayer.once('video:canplay', restore)

      playerDebug('[115m][audio] rebuild track', {
        id: params.id,
        currentTime: params.currentTime,
        track: params.track,
        targetUrl,
      })
      this.overlay?.showToast(`已切换到${this.currentAudioTrackLabel}`)
    }
    catch (error) {
      console.warn('[115m][audio] rebuild track failed', error)
      this.overlay?.showToast('切换音轨失败，请重试')
    }
  }

  private renderPlaybackNavControls() {
    if (!this.artplayer) return
    updateArtplayerControl(this.artplayer, PlayerManager.PREV_CONTROL_NAME, this.buildPrevControlItem())
    updateArtplayerControl(this.artplayer, PlayerManager.NEXT_CONTROL_NAME, this.buildNextControlItem())
  }

  private updateQualityControl() {
    if (!this.artplayer) return
    updateArtplayerControl(this.artplayer, PlayerManager.QUALITY_CONTROL_NAME, this.buildQualityControlItem())
  }

  private async switchQuality(opt: QualityOption) {
    if (!this.artplayer) return

    if (isOriginalPlaceholderOption(opt)) {
      const resolvedUrl = await this.ensureOriginalSourceLoaded()
      if (!resolvedUrl) {
        this.showError('115原画加载失败，请稍后重试')
        return
      }
      opt = { ...opt, url: resolvedUrl }
    }

    if (this.artplayer.url === opt.url) return

    this.nativePlaybackRetryCount = 0
    this.currentPlaybackType = !!this.ultraUrl && opt.url === this.ultraUrl ? 'native' : 'hls'

    this.applyPlaybackStatePatch(applySelectedQualityOption(this.getPlaybackState(), opt))
    this.renderQualityPanel()

    // 记住用户手动选择的画质
    saveQualityPreference(this.currentPickCode, opt.label, opt.quality)

    try {
      await this.artplayer.switchQuality(opt.url)
    }
    catch (error) {
      if (!this.artplayer) return
      this.updateQualityByUrl(this.artplayer.url || '')
      this.renderQualityPanel()
      this.overlay?.showToast(error instanceof Error ? error.message : '切换画质失败')
    }
  }

  private setupTopNav() {
    if (!this.artplayer) return
    this.overlay?.destroy()
    const meta = readOverlayMetaFromQuery()
    this.overlay = new PlayerOverlayController({
      art: this.artplayer,
      meta,
      onMoveFile: async (fileId, cid) => await this.moveFile(fileId, cid),
      onToggleFavorite: async (fileId, nextMarked) => await this.toggleFavorite(fileId, nextMarked),
      onPlaylistToggle: async (open) => {
        if (!open) return []
        const items = await this.fetchPlaylistItems()
        this.syncOverlayPlaybackNav()
        return items
      },
      onPlaylistOpenChange: () => {
        this.hoverPreview?.refresh()
      },
      onPlaylistPlay: (pickCode, keepPlaylistOpen) => {
        if (pickCode && pickCode !== this.currentPickCode) {
          this.navigateToVideo(pickCode, keepPlaylistOpen)
        }
      },
      onPlaylistMove: async item => await this.movePlaylistVideo(item),
      onPlaylistDelete: async item => await this.deletePlaylistVideo(item),
      onDeleteFile: async (fileId, parentId, pickCode) => await this.deleteCurrentVideo(fileId, parentId, pickCode),
      onPlayPrevious: () => this.playPrevious(),
      onPlayNext: () => this.playNext(),
      onReplay: () => this.replayCurrent(),
      getCurrentPickCode: () => this.currentPickCode,
      shouldKeepPlaylistOpen: () => this.keepPlaylistOpenOnInit,
    })
    this.overlay.init()
    const runtime = getRuntimeApi()
    runtime?.onMessage?.removeListener(this.handleRuntimeMessage)
    runtime?.onMessage?.addListener(this.handleRuntimeMessage)
    this.syncOverlayPlaybackNav()
    void this.prefetchPlaylistItems()
    // 异步获取最新的收藏状态
    if (meta.fileId) {
      void this.fetchFileFavoriteStatus(meta.fileId)
    }
  }

  private async fetchFileFavoriteStatus(fileId: string): Promise<void> {
    const requestPickCode = this.currentPickCode
    try {
      const favoriteStatus = await fetchFavoriteStatus(sendRuntimeMessageSafe, requestPickCode)
      if (requestPickCode !== this.currentPickCode) return
      if (favoriteStatus !== null) {
        this.overlay?.updateFavoriteStatus(favoriteStatus)
      }
    } catch (error) {
      playerDebug('[115m] fetchFileFavoriteStatus failed:', error)
    }
  }

  private setupProgressHoverPreview(previewSourceUrl?: string, previewSourceType?: 'native' | 'hls') {
    if (!this.artplayer) return

    const currentUrl = previewSourceUrl || this.artplayer.url || ''
    const fallbackThumbnailSource = [...this.m3u8List].sort((a, b) => a.quality - b.quality)[0]?.url

    this.hoverPreview?.destroy()
    this.hoverPreview = new HoverPreviewController(
      this.artplayer,
      this.currentPickCode,
      currentUrl || fallbackThumbnailSource || null,
    )
    this.hoverPreview.setup()
  }

  private buildStatsHtml(): string {
    const video = this.artplayer?.video
    if (!video) return '统计信息'
    const w = video.videoWidth
    const h = video.videoHeight
    const res = w && h ? `${w}×${h}` : '--'
    const fps = this.calcFps()
    return `统计信息 <span style="opacity:.5;margin-left:8px">${res}${fps ? ` · ${fps}fps` : ''}</span>`
  }

  private calcFps(): string {
    const video = this.artplayer?.video
    if (!video) return ''
    const q = (video.getVideoPlaybackQuality?.() || {}) as VideoPlaybackQualityLike
    let total = q.totalVideoFrames ?? 0
    if (!total) {
      total = (video as HTMLVideoElement & { webkitDecodedFrameCount?: number }).webkitDecodedFrameCount ?? 0
    }
    if (total > 0 && video.currentTime > 0) {
      return (total / video.currentTime).toFixed(1)
    }
    return ''
  }

  private setupStatsMenu() {
    if (!this.artplayer) return
    if (this.infoMenuTimer != null) window.clearInterval(this.infoMenuTimer)
    this.infoMenuTimer = window.setInterval(() => {
      if (this.infoMenuEl) {
        this.infoMenuEl.innerHTML = this.buildStatsHtml()
      }
    }, 2000)
  }


  private async fallbackToHls(reason = '播放失败', rememberOriginal = false) {
    this.resetNativeStallState()
    this.clearNativeAudioProbe()
    this.clearNativeVideoProbe()
    playerDebug('[115m] fallbackToHls triggered', { m3u8Count: this.m3u8List.length, reason })
    
    if (!this.artplayer) {
      this.showError('播放失败，无可用的视频源')
      return
    }

    // 确保有 m3u8 列表
    if (this.m3u8List.length === 0) {
      playerDebug('[115m] m3u8List empty, fetching...')
      const fetched = await fetchM3u8WithRetry(this.currentPickCode).catch((e) => {
        console.error('[115m] fetchM3u8WithRetry failed:', e)
        return null
      })
      if (fetched && fetched.length > 0) {
        this.m3u8List = fetched
      }
    }

    if (this.m3u8List.length === 0) {
      console.error('[115m] fallbackToHls: no m3u8 sources available')
      this.showError('播放失败，无可用的视频源')
      return
    }

    const { url: bestQualityUrl, patch } = applyFallbackToHlsState(this.getPlaybackState())
    this.applyPlaybackStatePatch(patch)
    this.currentPlaybackType = 'hls'
    if (rememberOriginal) {
      saveQualityPreference(this.currentPickCode, '115原画', 9999)
    }
    if (!bestQualityUrl) {
      this.showError('播放失败，无可用的视频源')
      return
    }
    
    playerDebug('[115m] fallbackToHls: switching to HLS')
    this.renderQualityPanel()
    this.overlay?.showToast(`${reason}，已切换 115原画`)
    try {
      await this.artplayer.switchUrl(bestQualityUrl)
    }
    catch (error) {
      console.error('[115m] fallbackToHls switchUrl failed:', error)
      this.showError('播放失败，无可用的视频源')
    }
  }

  private clearNativeAudioProbe() {
    if (this.nativeAudioProbeTimer != null) {
      window.clearTimeout(this.nativeAudioProbeTimer)
      this.nativeAudioProbeTimer = null
    }
  }

  private clearNativeVideoProbe() {
    if (this.nativeVideoProbeTimer != null) {
      window.clearTimeout(this.nativeVideoProbeTimer)
      this.nativeVideoProbeTimer = null
    }
  }

  private clearNativeStallCheck() {
    if (this.nativeStallCheckTimer != null) {
      window.clearTimeout(this.nativeStallCheckTimer)
      this.nativeStallCheckTimer = null
    }
  }

  private resetNativeStallState() {
    this.clearNativeStallCheck()
    this.nativeStallStartedAt = 0
    this.nativeStallLastTime = 0
    this.nativeStallLastFrameCount = 0
    this.nativeStallFallbackInFlight = false
    this.nativeSeekStartedAt = 0
    this.nativeSeekFromTime = 0
    this.nativeSeekRecoveryUntil = 0
  }

  private clearTransientPlaybackWatchers() {
    this.clearNativeAudioProbe()
    this.clearNativeVideoProbe()
    this.resetNativeStallState()
    this.clearAudioTrackSyncTimers()
  }

  private scheduleNativeStallCheck() {
    this.clearNativeStallCheck()
    if (!this.artplayer || !this.isNativeVideo || this.currentPlaybackType !== 'native') return
    this.nativeStallCheckTimer = window.setTimeout(() => {
      this.nativeStallCheckTimer = null
      void this.checkNativePlaybackStall()
    }, PlayerManager.NATIVE_STALL_CHECK_INTERVAL_MS)
  }

  private getBufferedAhead(video: HTMLVideoElement) {
    const currentTime = video.currentTime || 0
    for (let i = 0; i < video.buffered.length; i += 1) {
      const start = video.buffered.start(i)
      const end = video.buffered.end(i)
      if (currentTime >= start && currentTime <= end) {
        return Math.max(0, end - currentTime)
      }
    }
    return 0
  }

  private getTotalVideoFrames(video: HTMLVideoElement) {
    const quality = (video.getVideoPlaybackQuality?.() || {}) as VideoPlaybackQualityLike
    const total = quality.totalVideoFrames
    if (typeof total === 'number' && total > 0) return total
    return (video as HTMLVideoElement & { webkitDecodedFrameCount?: number }).webkitDecodedFrameCount ?? 0
  }

  private async checkNativePlaybackStall() {
    if (!this.artplayer || !this.isNativeVideo || this.currentPlaybackType !== 'native') return
    if (this.nativeStallFallbackInFlight) return

    const video = this.artplayer.video as HTMLVideoElement
    if (video.paused || video.ended || video.seeking) {
      this.nativeStallStartedAt = 0
      this.nativeStallLastTime = video.currentTime || 0
      this.nativeStallLastFrameCount = this.getTotalVideoFrames(video)
      this.scheduleNativeStallCheck()
      return
    }

    if (!this.perfMarks.playing || video.currentTime < 3) {
      this.nativeStallStartedAt = 0
      this.nativeStallLastTime = video.currentTime || 0
      this.nativeStallLastFrameCount = this.getTotalVideoFrames(video)
      this.scheduleNativeStallCheck()
      return
    }

    const bufferedAhead = this.getBufferedAhead(video)
    const currentTime = video.currentTime || 0
    const totalFrames = this.getTotalVideoFrames(video)
    const timeDrift = Math.abs(currentTime - this.nativeStallLastTime)
    const frameDrift = Math.abs(totalFrames - this.nativeStallLastFrameCount)
    const hasEnoughBuffer = bufferedAhead >= PlayerManager.NATIVE_STALL_MIN_BUFFER_AHEAD_SEC
    const mediaLikelyStalled = video.readyState <= HTMLMediaElement.HAVE_CURRENT_DATA
    const inSeekRecovery = this.nativeSeekRecoveryUntil > Date.now()
    const stallThresholdMs = inSeekRecovery
      ? Math.max(2500, PlayerManager.NATIVE_STALL_TIME_THRESHOLD_MS - 1500)
      : PlayerManager.NATIVE_STALL_TIME_THRESHOLD_MS

    if (hasEnoughBuffer && mediaLikelyStalled && timeDrift <= PlayerManager.NATIVE_STALL_MAX_TIME_DRIFT_SEC && frameDrift === 0) {
      if (!this.nativeStallStartedAt) {
        this.nativeStallStartedAt = Date.now()
      }
      else if (Date.now() - this.nativeStallStartedAt >= stallThresholdMs) {
        this.nativeStallFallbackInFlight = true
        console.warn('[115m][native] stall detected, fallback to HLS', {
          currentTime,
          bufferedAhead,
          readyState: video.readyState,
          networkState: video.networkState,
          totalFrames,
          inSeekRecovery,
        })
        await this.fallbackToHls(inSeekRecovery ? '无损远跳后恢复失败，已改用 115原画' : '无损播放卡死，已改用 115原画', true)
        return
      }
    }
    else {
      this.nativeStallStartedAt = 0
    }

    this.nativeStallLastTime = currentTime
    this.nativeStallLastFrameCount = totalFrames
    this.scheduleNativeStallCheck()
  }

  private scheduleNativeAudioProbe() {
    this.clearNativeAudioProbe()
    this.nativeAudioProbeTimer = window.setTimeout(() => {
      this.nativeAudioProbeTimer = null
      void this.checkNativeAudioDecode()
    }, PlayerManager.NATIVE_AUDIO_PROBE_DELAY_MS)
  }

  private scheduleNativeVideoProbe() {
    this.clearNativeVideoProbe()
    if (!this.artplayer || !this.isNativeVideo || this.currentPlaybackType !== 'native') return
    this.nativeVideoProbeTimer = window.setTimeout(() => {
      this.nativeVideoProbeTimer = null
      void this.checkNativeVideoDecode()
    }, PlayerManager.NATIVE_AUDIO_PROBE_DELAY_MS)
  }

  private async checkNativeVideoDecode() {
    if (!this.artplayer || !this.isNativeVideo || this.currentPlaybackType !== 'native') return
    if (this.nativeStallFallbackInFlight) return

    const video = this.artplayer.video as HTMLVideoElement
    if (video.paused || video.ended || video.seeking || video.currentTime < 1) {
      this.scheduleNativeVideoProbe()
      return
    }

    const totalFrames = this.getTotalVideoFrames(video)
    if (!shouldFallbackNativeBlackVideo({
      currentTime: video.currentTime || 0,
      readyState: video.readyState,
      videoWidth: video.videoWidth || 0,
      videoHeight: video.videoHeight || 0,
      totalVideoFrames: totalFrames,
    })) {
      return
    }

    this.nativeStallFallbackInFlight = true
    playerDebug('[115m][native] black video detected, fallback to HLS', {
      currentTime: video.currentTime,
      readyState: video.readyState,
      networkState: video.networkState,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      totalFrames,
    })
    await this.fallbackToHls('无损视频编码不兼容，已改用 115原画', true)
  }

  private async checkNativeAudioDecode() {
    if (!this.artplayer || !this.isNativeVideo || this.currentPlaybackType !== 'native') return
    const video = this.artplayer.video as HTMLVideoElement & { webkitAudioDecodedByteCount?: number }
    if (video.paused || video.currentTime < 1) {
      this.scheduleNativeAudioProbe()
      return
    }
    const decodedBytes = video.webkitAudioDecodedByteCount
    if (typeof decodedBytes !== 'number' || decodedBytes > 0) return
    if (video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA || video.currentTime < 3) {
      this.scheduleNativeAudioProbe()
      return
    }
    if (!shouldFallbackNativeSilentAudio({
      title: this.title,
      ultraUrl: this.ultraUrl,
      nativeUltraConservative: this.nativeUltraConservative,
    })) return
    const hasHlsAudioTracks = await this.masterPlaylistHasAudioTracks()
    if (!hasHlsAudioTracks) return
    await this.fallbackToHls('无损音频不兼容，已改用 115原画', true)
  }

  private async masterPlaylistHasAudioTracks() {
    const masterText = await this.fetchMasterPlaylistText()
    return !!masterText && /#EXT-X-MEDIA:TYPE=AUDIO/i.test(masterText)
  }

  private async handleNativePlaybackError() {
    if (!this.artplayer) return

    const hasStartedPlaying = !!this.perfMarks.playing
    if (shouldRetryNativePlayback({ retryCount: this.nativePlaybackRetryCount, hasStartedPlaying })) {
      this.nativePlaybackRetryCount += 1
      this.retryNativePlayback()
      return
    }

    if (hasStartedPlaying) {
      this.overlay?.showToast('无损播放出现波动，已保留当前无损源，可手动切换 115原画')
      return
    }

    if (!this.artplayer.video.error || this.artplayer.video.networkState !== HTMLMediaElement.NETWORK_NO_SOURCE) {
      this.overlay?.showToast('无损播放异常，已重试保留无损源，可手动切换 115原画')
      return
    }

    await this.fallbackToHls()
  }

  private retryNativePlayback() {
    if (!this.artplayer) return

    this.resetNativeStallState()
    const retryUrl = this.ultraUrl || this.artplayer.url || ''
    if (!retryUrl) return

    const currentTime = this.artplayer.currentTime || 0
    const shouldResume = !this.artplayer.video.paused || currentTime <= 0

    this.artplayer.once('video:loadedmetadata', () => {
      if (!this.artplayer) return
      if (currentTime > 0) {
        this.artplayer.seek = currentTime
      }
      if (shouldResume) {
        safePlay(this.artplayer)
      }
    })

    this.artplayer.url = retryUrl
  }

  private async ensureOriginalSourceLoaded(): Promise<string | null> {
    if (this.m3u8List.length === 0) {
      try {
        const list = await fetchM3u8WithRetry(this.currentPickCode)
        if (list && list.length > 0) {
          this.m3u8List = list
        }
      } catch (e) {
        console.error('[115m] fetchM3u8WithRetry error:', e)
      }
    }

    if (this.m3u8List.length === 0) {
      return null
    }

    const currentUrl = this.artplayer?.url || ''
    this.refreshQualityState(currentUrl)
    this.renderQualityPanel()
    return resolveOriginalPlaceholderUrl(this.getPlaybackState())
  }


  private showError(message: string) {
    renderPlayerError(message)
  }

  private async prefetchPlaylistItems() {
    try {
      await this.fetchPlaylistItems()
      this.syncOverlayPlaybackNav()
    }
    catch (error) {
      playerDebug('[115m] prefetchPlaylistItems failed:', error)
    }
  }

  private async fetchPlaylistItems(): Promise<OverlayPlaylistItem[]> {
    if (this.playlistItemsCache.length > 0) {
      return this.playlistItemsCache
    }
    if (this.playlistLoadingPromise) {
      return await this.playlistLoadingPromise
    }

    this.playlistLoadingPromise = this.fetchPlaylistItemsInternal()
    try {
      this.playlistItemsCache = await this.playlistLoadingPromise
      return this.playlistItemsCache
    }
    finally {
      this.playlistLoadingPromise = null
    }
  }

  private async fetchPlaylistItemsInternal(): Promise<OverlayPlaylistItem[]> {
    const temporaryPlaylist = readTemporaryPlayerPlaylist(this.playlistToken)
    if (temporaryPlaylist.some(item => item.pickCode === this.currentPickCode)) {
      return temporaryPlaylist
    }

    const cid = readPlaylistCidFromLocation(window.location.search)

    return await fetchPlaylistData({
      sendMessage: sendRuntimeMessageSafe,
      cid,
      pickCode: this.currentPickCode,
      formatFileSize: size => this.formatFileSize(size),
      onPath: path => this.overlay?.updateBreadcrumbs(path),
    })
  }

  private syncOverlayPlaybackNav() {
    this.renderPlaybackNavControls()
    const state = buildPlaybackNavState(
      getPlaylistPosition(this.playlistItemsCache, this.currentPickCode),
    )
    this.overlay?.updatePlaybackNav({
      ...state,
      hasPrevious: state.hasPrevious && !this.isSwitchingVideo,
      hasNext: state.hasNext && !this.isSwitchingVideo,
      previousTitle: this.isSwitchingVideo ? '正在切换视频' : state.previousTitle,
      nextTitle: this.isSwitchingVideo ? '正在切换视频' : state.nextTitle,
    })
  }

  private syncCurrentPlaylistProgress(force = false) {
    if (!this.artplayer) return

    const currentTime = this.artplayer.currentTime || 0
    const duration = this.artplayer.duration || 0
    if (!duration || duration <= 0) return

    const roundedSec = Math.floor(currentTime)
    if (!force && roundedSec === this.lastPlaylistProgressSyncSec) return
    this.lastPlaylistProgressSyncSec = roundedSec

    const progressPercent = Math.max(0, Math.min(100, currentTime / duration * 100))
    const item = this.playlistItemsCache.find(entry => entry.pickCode === this.currentPickCode)
    if (item) {
      item.progressSec = currentTime
      item.progressPercent = progressPercent
    }

    this.overlay?.updateCurrentPlaylistProgress(this.currentPickCode, currentTime, duration)
  }

  private clearPlaybackEndState() {
    if (this.autoNextTimer) {
      window.clearTimeout(this.autoNextTimer)
      this.autoNextTimer = null
    }
    this.overlay?.hidePlaybackEndPanel()
  }

  private async handlePlaybackEnded() {
    this.clearPlaybackEndState()
    const items = await this.fetchPlaylistItems().catch(() => [])
    const plan = getPlaybackEndCountdownPlan(items, this.currentPickCode)
    const next = plan.next

    const playbackPlan = buildPlaybackModePlan(this.currentPlaybackMode, !!next)
    if (playbackPlan === 'repeat') {
      this.replayCurrent()
      return
    }
    if (playbackPlan === 'next' && next) {
      this.navigateToVideo(next.pickCode, this.overlay?.isPlaylistExpanded() === true, true)
      return
    }
    if (playbackPlan === 'stop') {
      return
    }

    if (next) {
      let countdown = plan.countdownSec
      this.overlay?.showPlaybackEndPanel({
        mode: 'autoplay-next',
        nextTitle: next.name,
        countdownSec: countdown,
      })
      this.autoNextTimer = window.setInterval(() => {
        countdown -= 1
        if (countdown <= 0) {
          this.clearPlaybackEndState()
          this.navigateToVideo(next.pickCode)
          return
        }
        this.overlay?.showPlaybackEndPanel({
          mode: 'autoplay-next',
          nextTitle: next.name,
          countdownSec: countdown,
        })
      }, 1000) as unknown as number
      return
    }

    this.overlay?.showPlaybackEndPanel({ mode: 'ended' })
  }

  private async playPrevious() {
    const items = await this.fetchPlaylistItems().catch(() => [])
    const previous = getPreviousPlaylistItem(items, this.currentPickCode)
    if (!previous) {
      this.overlay?.showToast('已经是第一集')
      return
    }
    this.navigateToVideo(previous.pickCode)
  }

  private async playNext() {
    const items = await this.fetchPlaylistItems().catch(() => [])
    const next = getNextPlaylistItem(items, this.currentPickCode)
    if (!next) {
      this.overlay?.showToast('已经是最后一集')
      return
    }
    this.navigateToVideo(next.pickCode)
  }

  private replayCurrent() {
    this.clearPlaybackEndState()
    if (!this.artplayer) return
    this.artplayer.seek = 0
    safePlay(this.artplayer)
  }

  /**
   * 主动通过 API 获取面包屑，不依赖 DOM 提取或 URL 参数
   */
  private async fetchBreadcrumbs(expectedPickCode = this.currentPickCode): Promise<void> {
    const pathFromQuery = readPathFromLocation(window.location.search)
    if (expectedPickCode !== this.currentPickCode) return
    if (pathFromQuery.length > 0) {
      this.overlay?.updateBreadcrumbs(pathFromQuery)
      return
    }

    // 通过 API 获取（需要 cid 或 pickCode）
    const cid = readPlaylistCidFromLocation(window.location.search)
    const path = await fetchBreadcrumbPath(sendRuntimeMessageSafe, cid, expectedPickCode)

    if (expectedPickCode !== this.currentPickCode) return
    if (path.length > 0) {
      this.overlay?.updateBreadcrumbs(path)
    }
  }

  /**
   * 刷新面包屑（移动文件后调用）
   */
  private async refreshBreadcrumbs(): Promise<void> {
    // 强制通过 API 获取最新路径
    const path = await fetchBreadcrumbPath(sendRuntimeMessageSafe, '', this.currentPickCode)

    if (path.length > 0) {
      this.overlay?.updateBreadcrumbs(path)
    }
  }

  private async moveFile(fileId: string, cid: string): Promise<void> {
    if (!fileId) throw new Error('fileId missing')

    const dialog = new MoveDialog(
      fileId,
      cid || '0',
      () => this.refreshBreadcrumbs(),
    )
    const result = await dialog.show()
    if (result.moved) {
      this.handleCurrentVideoMoved()
    }
  }

  private async movePlaylistVideo(item: OverlayPlaylistItem): Promise<void> {
    if (!item.fileId) {
      this.overlay?.showToast('文件 ID 缺失')
      return
    }

    const parentId = this.getPlaylistItemParentId(item)
    const dialog = new MoveDialog(
      item.fileId,
      parentId || '0',
      () => item.pickCode === this.currentPickCode ? this.refreshBreadcrumbs() : undefined,
    )
    const result = await dialog.show()
    if (result.moved) {
      this.handlePlaylistVideoMoved(item.pickCode)
    }
  }

  private handleCurrentVideoMoved() {
    this.handlePlaylistVideoMoved(this.currentPickCode)
  }

  private handlePlaylistVideoMoved(movedPickCode: string) {
    if (!movedPickCode) return

    const beforeCount = this.playlistItemsCache.length
    this.playlistItemsCache = this.playlistItemsCache.filter(item => item.pickCode !== movedPickCode)
    if (this.playlistItemsCache.length === beforeCount) return

    this.syncOverlayPlaybackNav()
    this.overlay?.updatePlaylist(this.playlistItemsCache)
  }

  private getPlaylistItemParentId(item: OverlayPlaylistItem): string {
    if (item.pickCode === this.currentPickCode) {
      return this.currentParentId()
    }
    return readPlaylistCidFromLocation(window.location.search) || this.currentParentId()
  }

  private currentParentId(): string {
    const meta = readOverlayMetaFromQuery()
    return meta.cid || meta.parentId || '0'
  }

  private async toggleFavorite(fileId: string, nextMarked: boolean): Promise<boolean> {
    if (!fileId) return !nextMarked

    const result = await updateFavoriteStatus(sendRuntimeMessageSafe, fileId, nextMarked)
    if (result === nextMarked) {
      window.history.replaceState(null, '', buildUpdatedMarkedUrl(window.location.pathname, window.location.search, nextMarked))
    }
    return result
  }

  private async deleteCurrentVideo(fileId: string, parentId: string, pickCode: string): Promise<void> {
    await this.deleteVideoFromPlaylist({ fileId, parentId, pickCode, navigateAfterDelete: true })
  }

  private async deletePlaylistVideo(item: OverlayPlaylistItem): Promise<void> {
    if (!item.fileId || !item.pickCode) {
      this.overlay?.showToast('缺少删除参数')
      return
    }
    await this.deleteVideoFromPlaylist({
      fileId: item.fileId,
      parentId: this.getPlaylistItemParentId(item),
      pickCode: item.pickCode,
      navigateAfterDelete: item.pickCode === this.currentPickCode,
    })
  }

  private async deleteVideoFromPlaylist(params: {
    fileId: string
    parentId: string
    pickCode: string
    navigateAfterDelete: boolean
  }): Promise<void> {
    const { fileId, parentId, pickCode, navigateAfterDelete } = params
    const items = await this.fetchPlaylistItems().catch(() => this.playlistItemsCache)
    const { nextPickCode } = getDeleteFallback(items, pickCode)
    const keepPlaylistOpen = this.keepPlaylistOpenOnInit || this.overlay?.isPlaylistExpanded() === true

    await deleteVideoFile(sendRuntimeMessageSafe, fileId, parentId, pickCode)
    await deletePlayHistory(pickCode)

    this.playlistItemsCache = this.playlistItemsCache.filter(item => item.pickCode !== pickCode)
    this.syncOverlayPlaybackNav()
    this.overlay?.updatePlaylist(this.playlistItemsCache)

    if (!navigateAfterDelete) {
      this.overlay?.showToast('已删除')
      return
    }

    if (nextPickCode) {
      this.navigateToVideo(nextPickCode, keepPlaylistOpen, true)
      return
    }

    if (window.history.length > 1) {
      window.history.back()
      return
    }

    window.close()
  }

  private navigateToVideo(pickCode: string, keepPlaylistOpen = false, autoPlay = false) {
    if (!pickCode || pickCode === this.currentPickCode) return

    this.pendingVideoSwitch = { pickCode, keepPlaylistOpen, autoPlay }
    this.schedulePendingVideoSwitch()
  }

  private schedulePendingVideoSwitch() {
    if (this.isSwitchingVideo || !this.pendingVideoSwitch) return

    const elapsed = Date.now() - this.lastVideoSwitchStartedAt
    const delay = Math.max(0, PlayerManager.VIDEO_SWITCH_COOLDOWN_MS - elapsed)

    if (this.switchCooldownTimer != null) {
      window.clearTimeout(this.switchCooldownTimer)
      this.switchCooldownTimer = null
    }

    if (delay > 0) {
      this.switchCooldownTimer = window.setTimeout(() => {
        this.switchCooldownTimer = null
        this.schedulePendingVideoSwitch()
      }, delay)
      return
    }

    const next = this.pendingVideoSwitch
    this.pendingVideoSwitch = null
    void this.switchToVideo(next.pickCode, next.keepPlaylistOpen, next.autoPlay)
  }

  private setVideoSwitching(switching: boolean) {
    if (this.isSwitchingVideo === switching) return
    this.isSwitchingVideo = switching
    this.syncOverlayPlaybackNav()
  }

  private async switchToVideo(pickCode: string, keepPlaylistOpen = false, autoPlay = false) {
    if (!this.artplayer || !pickCode || pickCode === this.currentPickCode) return

    const requestId = ++this.switchVideoRequestId
    const targetItem = findPlaylistItemByPickCode(this.playlistItemsCache, pickCode)

    this.clearPlaybackEndState()
    this.clearTransientPlaybackWatchers()
    this.lastVideoSwitchStartedAt = Date.now()
    this.setVideoSwitching(true)

    try {
      const playback = await this.resolvePlaybackForPickCode(pickCode)
      if (requestId !== this.switchVideoRequestId || !this.artplayer) return

      this.currentPickCode = pickCode
      this.currentRotation = loadVideoRotation(pickCode)
      this.subtitlePreferenceAppliedForPickCode = ''
      this.audioPreferenceAppliedForPickCode = ''
      this.preferredAudioTrackId = null
      this.perfMarks = { init: performance.now() }
      this.firstPlayingReported = false
      this.lastPlaylistProgressSyncSec = -1
      this.applyResolvedPlayback(playback)
      const metaPatch = buildOverlayMetaPatch(targetItem)
      if (metaPatch) {
        this.overlay?.updateMeta(metaPatch)
      }
      window.history.replaceState(null, '', buildPlayerHistoryUrl({
        pathname: window.location.pathname,
        search: window.location.search,
        pickCode,
        targetItem,
        keepPlaylistOpen,
      }))
      this.syncOverlayPlaybackNav()
      this.overlay?.updatePlaylist(this.playlistItemsCache)
      await this.artplayer.switchUrl(playback.initialPlayback.url)
      if (requestId !== this.switchVideoRequestId || !this.artplayer) return

      this.setupProgressHoverPreview(playback.initialPlayback.url, playback.initialPlayback.type)
      this.resetSubtitlesForCurrentVideo()
      this.renderQualityPanel()
      this.renderSubtitleControl()
      this.renderPlaybackNavControls()
      this.renderRotateControl()
      this.applyVideoRotation()

      if (autoPlay) {
        safePlay(this.artplayer)
      }

      void loadPlayHistoryWhenReady(
        pickCode,
        () => requestId === this.switchVideoRequestId && this.artplayer ? this.artplayer.video as HTMLVideoElement : null,
        () => requestId === this.switchVideoRequestId && this.currentPickCode === pickCode,
      )

      void this.fetchBreadcrumbs(pickCode)

      if (targetItem?.fileId) {
        void this.fetchFileFavoriteStatus(targetItem.fileId)
      }
    }
    catch (error) {
      if (requestId !== this.switchVideoRequestId) return
      this.overlay?.showToast(error instanceof Error ? error.message : '切换视频失败')
    }
    finally {
      if (requestId === this.switchVideoRequestId) {
        this.setVideoSwitching(false)
        this.schedulePendingVideoSwitch()
      }
    }
  }

  private async resolvePlaybackForPickCode(pickCode: string) {
    const playback = await resolvePlaybackBundle(sendRuntimeMessageSafe, pickCode, this.nativeUltraSupported)

    playerDebug('[115m] Source fetch result:', {
      ultraOk: !!playback.ultraUrl,
      m3u8Ok: playback.m3u8List.length > 0,
      m3u8Count: playback.m3u8List.length,
      qualityPreference: playback.qualityPreference,
    })

    return playback
  }

  private applyResolvedPlayback(playback: ResolvedPlaybackBundle) {
    this.nativePlaybackRetryCount = 0
    this.ultraUrl = playback.ultraUrl
    this.m3u8List = playback.m3u8List
    this.isNativeVideo = playback.initialPlayback.isNativeVideo
    this.currentPlaybackType = playback.initialPlayback.type
    this.currentQuality = playback.initialPlayback.currentQuality
    this.currentQualityLabel = playback.initialPlayback.currentQualityLabel
    this.qualityOptions = buildQualityOptions(
      '',
      this.nativeUltraSupported ? (playback.initialPlayback.type === 'native' ? playback.initialPlayback.url : playback.ultraUrl) : null,
      this.m3u8List,
      this.currentQuality,
      this.currentQualityLabel,
    )
  }

  private formatFileSize(size: number): string {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
    if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`
    return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`
  }

  destroy() {
    this.clearPlaybackEndState()
    this.clearNativeAudioProbe()
    if (this.switchCooldownTimer != null) {
      window.clearTimeout(this.switchCooldownTimer)
      this.switchCooldownTimer = null
    }
    const runtime = getRuntimeApi()
    runtime?.onMessage?.removeListener(this.handleRuntimeMessage)
    this.overlay?.destroy()
    this.overlay = null
    this.hoverPreview?.destroy()
    this.hoverPreview = null
    if (this.infoMenuTimer != null) {
      window.clearInterval(this.infoMenuTimer)
      this.infoMenuTimer = null
    }
    this.infoMenuEl = null
    this.subtitleManager?.destroy()
    this.subtitleManager = null
    this.subtitleControlEl = null
    if (this.cleanupKeyboard) {
      this.cleanupKeyboard()
      this.cleanupKeyboard = null
    }
    if (this.cleanupResize) {
      this.cleanupResize()
    }
    if (this.hlsInstance) {
      this.hlsInstance.destroy()
      this.hlsInstance = null
    }
    if (this.currentHlsSourceUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.currentHlsSourceUrl)
    }
    this.currentHlsSourceUrl = null
    this.currentHlsLogicalUrl = null
    this.clearAudioTrackSyncTimers()
    if (this.artplayer) {
      this.artplayer.destroy()
      this.artplayer = null
    }
  }
}

let playerManager: PlayerManager | null = null

function initPlayer() {
  const { pickCode, traceId, clickTs, keepPlaylistOpen, playlistToken } = readPlayerBootstrapConfig(window.location.search)

  if (!pickCode) {
    const el = document.getElementById('artplayer-app')
    if (el) {
      el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#ff4d4f;font-size:18px;">缺少 pickCode 参数</div>'
    }
    return
  }

  playerManager = new PlayerManager({ pickCode, traceId, clickTs, keepPlaylistOpen, playlistToken })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPlayer)
}
else {
  initPlayer()
}

window.addEventListener('beforeunload', () => {
  playerManager?.destroy()
})

;(window as any).playerManager = playerManager
