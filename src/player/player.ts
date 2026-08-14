/**
 * 播放器页面逻辑
 */

import Artplayer from 'artplayer'
import type HlsType from 'hls.js'
import '../player/style.css'
import playerSkinCss from './core/player-skin.css?inline'
import playerQualityCss from './core/css/player-quality.css?inline'
import playerPlaybackModeCss from './core/css/player-playback-mode.css?inline'
import playerNavigationCss from './core/css/player-navigation.css?inline'
import playerRotationCss from './core/css/player-rotation.css?inline'
import playerPlaylistCss from './core/css/player-playlist.css?inline'
import playerHeaderCss from './core/css/player-header.css?inline'
import playerSelectorCss from './core/css/player-selector.css?inline'
import playerVolumeCss from './core/player-volume.css?inline'
import uiLayerCss from './core/ui-layer.css?inline'
import playerMediaTrackCss from './core/css/player-media-track.css?inline'
import playerSettingsMenuCss from './core/css/player-settings-menu.css?inline'
import { ORIGINAL_PLACEHOLDER_URL } from './core/quality'
import { AudioManager } from './core/audio-manager'
import { fetchM3u8WithRetry } from './core/source'
import { loadPlayHistoryWhenReady, loadVolumePreference, saveQualityPreference, saveVolumePreference } from './core/history'
import { mountCenterCluster } from './core/player-center-controls'
import { buildCustomVolumeControl } from './core/player-volume'
import { loadPlaybackMode, type PlaybackMode } from './core/player-playback-mode'
import { runPlayerSmokeChecks } from './core/smoke'
import { renderPlayerError } from './core/dom'
import { isHlsSupported } from './core/hls'
import { HlsPlayerController } from './core/player-hls'
import { PlayerQualityController } from './core/player-quality-controller'
import { PlayerPlaylistController } from './core/player-playlist'
import { PlayerActionsController } from './core/player-actions'
import { PlayerSwitchController } from './core/player-video-switch'
import { PlayerUIControlsController } from './core/player-ui-controls'
import type { VideoPlaybackQualityLike } from './core/types'
import { HoverPreviewController } from './core/hover-preview'
import { bindPlayerEvents } from './core/events'
import { PlayerOverlayController, readOverlayMetaFromQuery } from './core/overlay'
import { resolvePlaybackBundle } from './core/player-services'
import { MediaTrackController } from './core/player-media-track'
import { SettingsMenuController } from './core/player-settings-menu'
import { applyFallbackToHlsState } from './core/playback-state'
import { ensureServiceWorkerReady, getRuntimeApi, sendRuntimeMessageSafe } from './core/runtime'
import {
  readPlayerBootstrapConfig,
} from './core/player-query'
import { canUseNativeUltraSource, isConservativeNativeUltraExtension } from './core/native-playback'
import { NativePlaybackMonitor } from './core/native-playback-monitor'
import { RotationManager } from './core/rotation-manager'
import { SubtitleController } from './core/subtitle-controller'

function injectPlayerSkinStyles() {
  const style = document.createElement('style')
  style.id = 'm115-player-skin-style'
  style.textContent = `${playerSkinCss}\n${playerQualityCss}\n${playerPlaybackModeCss}\n${playerNavigationCss}\n${playerRotationCss}\n${playerPlaylistCss}\n${playerHeaderCss}\n${playerSelectorCss}\n${playerVolumeCss}\n${uiLayerCss}\n${playerMediaTrackCss}\n${playerSettingsMenuCss}`
  
  const insertStyle = () => {
    if (document.getElementById('m115-player-skin-style')) return
    if (document.head) {
      document.head.appendChild(style)
    } else {
      document.documentElement.appendChild(style)
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertStyle)
  } else {
    insertStyle()
  }
}

injectPlayerSkinStyles()

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

function playerDebug(...args: unknown[]) {
  if (localStorage.getItem('115m-player-debug') === '1') {
    console.debug(...args)
  }
}

bindInterruptedPlayRejectionGuard()

class PlayerManager {
  private artplayer: Artplayer | null = null
  private currentPickCode: string
  private quality = new PlayerQualityController()
  private infoMenuTimer: number | null = null
  private infoMenuEl: HTMLElement | null = null
  private hoverPreview: HoverPreviewController | null = null
  private overlay: PlayerOverlayController | null = null
  private playlist = new PlayerPlaylistController()
  private actions = new PlayerActionsController()
  private switchController = new PlayerSwitchController()
  private uiControls = new PlayerUIControlsController()
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
  private rotationManager: RotationManager | null = null
  private nativeMonitor: NativePlaybackMonitor | null = null
  private audioManager: AudioManager | null = null
  private currentPlaybackRate = 1
  private currentPlaybackMode: PlaybackMode = loadPlaybackMode()
  private subtitleController: SubtitleController | null = null
  private mediaTrackController: MediaTrackController | null = null
  private settingsMenuController: SettingsMenuController | null = null
  private hlsController = new HlsPlayerController()
  private isSwitchingVideo = false
  /** switchUrl/switchQuality 执行期间置位，用于 hls fatal 错误时打破 artplayer 内部 Promise 挂起 */
  private switchUrlInFlight = false
  private readonly handleRuntimeMessage = (message: any) => {
    if (message?.type === 'MOVE_REFRESHED') {
      void this.actions.refreshBreadcrumbs().catch(error => {
        console.error('[115m] 刷新面包屑失败:', error)
      })
      this.overlay?.showToast('文件已移动')
      return
    }

    if (message?.type === 'DELETE_REFRESHED' && message?.data?.pickCode === this.currentPickCode) {
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

  /** 调试辅助：在页面内显示日志 */
  private debugLogToPage(msg: string) {
    if (localStorage.getItem('115m-player-debug') !== '1') return
    let el = document.getElementById('m115-debug-log')
    if (!el) {
      el = document.createElement('div')
      el.id = 'm115-debug-log'
      el.style.cssText = 'position:fixed;top:10px;right:10px;z-index:999999;background:rgba(0,0,0,.85);color:#0f0;font-size:12px;font-family:monospace;padding:10px;max-height:300px;overflow:auto;white-space:pre-wrap;'
      document.body.appendChild(el)
    }
    el.textContent += `[${new Date().toLocaleTimeString()}] ${msg}\n`
  }

  private async init() {
    const debugMode = localStorage.getItem('115m-player-debug') === '1'
    if (debugMode) this.debugLogToPage('init() called')
    try {
      this.perf('player-init-start')

      const loadingTextEl = document.getElementById('loading-text')
      if (loadingTextEl) {
        loadingTextEl.textContent = '正在初始化...'
      }

      if (debugMode) this.debugLogToPage('calling ensureServiceWorkerReady')
      await ensureServiceWorkerReady(10, 1000)
      if (debugMode) this.debugLogToPage('ensureServiceWorkerReady done')

      if (loadingTextEl) {
        loadingTextEl.textContent = '正在获取播放源...'
      }

      if (debugMode) this.debugLogToPage('calling resolvePlaybackForPickCode')
      const playback = await this.resolvePlaybackForPickCode(this.currentPickCode)
      if (debugMode) this.debugLogToPage(`resolvePlaybackForPickCode done: ultra=${!!playback.ultraUrl}, m3u8=${playback.m3u8List.length}, type=${playback.initialPlayback.type}`)
      this.quality.applyResolvedPlayback(playback, this.currentPickCode, this.nativeUltraSupported)

      this.perfMarks.ultraReady = performance.now()
      this.perf('ultra-source-ready', { ok: !!playback.ultraUrl, m3u8Count: this.quality.m3u8ListValue.length })

      if (debugMode) this.debugLogToPage(`calling createArtplayer: type=${playback.initialPlayback.type}`)
      this.createArtplayer(playback.initialPlayback.url, playback.initialPlayback.type)
      if (debugMode) this.debugLogToPage(`createArtplayer done: hasArtplayer=${!!this.artplayer}`)
      this.perf(playback.initialPlayback.type === 'native' ? 'create-player-native' : 'create-player-hls', {
        label: playback.initialPlayback.currentQualityLabel,
        hasPreference: !!playback.qualityPreference,
      })

      const currentUrl = this.artplayer?.url || ''
      this.quality.refreshQualityState(currentUrl)
      this.quality.renderQualityPanel()
      this.subtitleController?.renderControl()
      this.uiControls.renderPlaybackNavControls()
      this.rotationManager?.renderControl()
      this.uiControls.renderSpeedControl()

      const initPickCode = this.currentPickCode
      void loadPlayHistoryWhenReady(
        initPickCode,
        () => this.currentPickCode === initPickCode && this.artplayer ? this.artplayer.video as HTMLVideoElement : null,
        () => this.currentPickCode === initPickCode,
      )
    }
    catch (error) {
      if (debugMode) this.debugLogToPage(`ERROR: ${error instanceof Error ? error.message : String(error)}`)
      this.showError(`播放器初始化失败: ${error instanceof Error ? error.message : String(error)}`)
    }
    finally {
      if (debugMode) this.debugLogToPage('finally block - hiding loading')
      const loadingEl = document.getElementById('loading')
      if (loadingEl) loadingEl.style.display = 'none'
    }
  }

  /** 委托给 HlsPlayerController：初始化 HLS 实例 */
  private async initHls(video: HTMLVideoElement, url: string): Promise<HlsType | undefined> {
    return await this.hlsController.init(video, url)
  }

  /** 委托给 HlsPlayerController：销毁 HLS 实例（切到原生源前） */
  private disposeHlsInstance() {
    this.hlsController.dispose()
  }

  /** 委托给 HlsPlayerController：稳态 HLS fatal 错误自愈 */
  private handleSteadyHlsFatalError(hls: HlsType, data: any) {
    this.hlsController.handleSteadyHlsFatalError(hls, data)
  }

  /** 委托给 HlsPlayerController：拉取 master 播放列表文本（带内存缓存） */
  private fetchMasterPlaylistText(): Promise<string | null> {
    return this.hlsController.fetchMasterPlaylistText()
  }

  private createArtplayer(videoUrl: string, type: 'native' | 'hls') {
    const container = document.getElementById('artplayer-app')
    if (!container) throw new Error('找不到播放器容器')
    const volumePreference = loadVolumePreference()

    // 记录初始 URL，用于区分初始化和用户手动切换
    this._initUrl = videoUrl

    this.quality.refreshQualityState(videoUrl)

    // 提前初始化管理器（控件构建依赖它们，attach 在 artplayer 创建后调用）
    this.rotationManager?.destroy()
    this.rotationManager = new RotationManager(
      (msg) => this.overlay?.showToast(msg),
      () => this.currentPickCode,
    )
    this.rotationManager.loadPreference(this.currentPickCode)

    this.audioManager?.destroy()
    this.audioManager = new AudioManager()

    this.subtitleController?.destroy()
    this.subtitleController = new SubtitleController()

    this.mediaTrackController?.destroy()
    this.mediaTrackController = new MediaTrackController()

    this.settingsMenuController?.destroy()
    this.settingsMenuController = new SettingsMenuController()

    this.quality.attach({
      getArtplayer: () => this.artplayer,
      getCurrentPickCode: () => this.currentPickCode,
      isReady: () => !!this.perfMarks.loadedmetadata,
      getSwitchUrlInFlight: () => this.switchUrlInFlight,
      setSwitchUrlInFlight: value => { this.switchUrlInFlight = value },
      withSwitchTimeout: <T>(promise: Promise<T>, timeoutMs?: number, message?: string) => this.withSwitchTimeout(promise, timeoutMs, message),
      resetNativeRetry: () => this.nativeMonitor?.resetRetryCount(),
      disposeHls: () => this.hlsController.dispose(),
      onShowToast: msg => this.overlay?.showToast(msg),
      onShowError: msg => this.showError(msg),
    })

    this.playlist.attach({
      getArtplayer: () => this.artplayer,
      getCurrentPickCode: () => this.currentPickCode,
      getPlaylistToken: () => this.playlistToken,
      getIsSwitchingVideo: () => this.isSwitchingVideo,
      getCurrentPlaybackMode: () => this.currentPlaybackMode,
      onRenderPlaybackNavControls: () => this.uiControls.renderPlaybackNavControls(),
      navigateToVideo: (pickCode, keepPlaylistOpen, autoPlay) => this.switchController.navigateToVideo(pickCode, keepPlaylistOpen, autoPlay),
      updatePlaybackNav: state => this.overlay?.updatePlaybackNav(state),
      updateCurrentPlaylistProgress: (pickCode, progressSec, duration) => this.overlay?.updateCurrentPlaylistProgress(pickCode, progressSec, duration),
      updateBreadcrumbs: path => this.overlay?.updateBreadcrumbs(path),
      showPlaybackEndPanel: state => this.overlay?.showPlaybackEndPanel(state),
      hidePlaybackEndPanel: () => this.overlay?.hidePlaybackEndPanel(),
      isPlaylistExpanded: () => this.overlay?.isPlaylistExpanded() === true,
      onShowToast: msg => this.overlay?.showToast(msg),
      formatFileSize: size => this.formatFileSize(size),
    })

    this.actions.attach({
      getCurrentPickCode: () => this.currentPickCode,
      getPlaylist: () => this.playlist,
      getKeepPlaylistOpenOnInit: () => this.keepPlaylistOpenOnInit,
      navigateToVideo: (pickCode, keepPlaylistOpen, autoPlay) => this.switchController.navigateToVideo(pickCode, keepPlaylistOpen, autoPlay),
      updatePlaylist: items => this.overlay?.updatePlaylist(items),
      updateBreadcrumbs: path => this.overlay?.updateBreadcrumbs(path),
      updateFavoriteStatus: isMarked => this.overlay?.updateFavoriteStatus(isMarked),
      isPlaylistExpanded: () => this.overlay?.isPlaylistExpanded() === true,
      onShowToast: msg => this.overlay?.showToast(msg),
    })

    this.switchController.attach({
      getArtplayer: () => this.artplayer,
      getCurrentPickCode: () => this.currentPickCode,
      setCurrentPickCode: pickCode => { this.currentPickCode = pickCode },
      getIsSwitchingVideo: () => this.isSwitchingVideo,
      setIsSwitchingVideo: value => { this.isSwitchingVideo = value },
      setSwitchUrlInFlight: value => { this.switchUrlInFlight = value },
      clearTransientPlaybackWatchers: () => this.clearTransientPlaybackWatchers(),
      disposeHls: () => this.hlsController.dispose(),
      resetPlaybackRate: () => this.applyPlaybackRate(1),
      setupProgressHoverPreview: (url, type) => this.setupProgressHoverPreview(url, type),
      renderQualityPanel: () => this.quality.renderQualityPanel(),
      renderPlaybackNavControls: () => this.uiControls.renderPlaybackNavControls(),
      applyResolvedPlayback: (playback, pickCode, nativeUltraSupported) => this.quality.applyResolvedPlayback(playback, pickCode, nativeUltraSupported),
      getCurrentPlaybackType: () => this.quality.currentPlaybackTypeValue,
      getNativeUltraSupported: () => this.nativeUltraSupported,
      playlist: {
        clearPlaybackEndState: () => this.playlist.clearPlaybackEndState(),
        resetProgressSyncBase: () => this.playlist.resetProgressSyncBase(),
        items: this.playlist.items,
        syncOverlayPlaybackNav: () => this.playlist.syncOverlayPlaybackNav(),
      },
      actions: {
        fetchBreadcrumbs: pickCode => this.actions.fetchBreadcrumbs(pickCode),
        fetchFileFavoriteStatus: fileId => this.actions.fetchFileFavoriteStatus(fileId),
      },
      onVideoSwitched: pickCode => {
        this.rotationManager?.switchVideo(pickCode)
        this.subtitleController?.resetPreferenceFlag()
        this.audioManager?.resetPreferenceFlag()
      },
      updateOverlayMeta: patch => this.overlay?.updateMeta(patch),
      updateHistoryUrl: url => window.history.replaceState(null, '', url),
      updatePlaylist: items => this.overlay?.updatePlaylist(items),
      onShowToast: msg => this.overlay?.showToast(msg),
      resolvePlaybackForPickCode: pickCode => this.resolvePlaybackForPickCode(pickCode),
      withSwitchTimeout: <T>(promise: Promise<T>, timeoutMs?: number, message?: string) => this.withSwitchTimeout(promise, timeoutMs, message),
      resetPerfMarks: () => { this.perfMarks = { init: performance.now() } },
      resetFirstPlaying: () => { this.firstPlayingReported = false },
    })

    this.uiControls.attach({
      getArtplayer: () => this.artplayer,
      getCurrentPickCode: () => this.currentPickCode,
      getIsSwitchingVideo: () => this.isSwitchingVideo,
      getPlaylist: () => ({
        items: this.playlist.items,
        playPrevious: () => void this.playlist.playPrevious(),
        playNext: () => void this.playlist.playNext(),
      }),
      getCurrentPlaybackMode: () => this.currentPlaybackMode,
      onPlaybackModeSelected: mode => { this.currentPlaybackMode = mode },
      renderSpeedControl: () => this.settingsMenuController?.renderControl(),
      onShowToast: msg => this.overlay?.showToast(msg),
    })

    this.hlsController.attach({
      getArtplayer: () => this.artplayer,
      getCurrentPickCode: () => this.currentPickCode,
      getSwitchUrlInFlight: () => this.switchUrlInFlight,
      failSwitchUrl: reason => this.failSwitchUrl(reason),
      onShowToast: msg => this.overlay?.showToast(msg),
      getAudioTrackLabel: () => this.audioManager?.currentTrackLabel || '音轨',
      onAudioTracksUpdated: () => this.audioManager?.syncFromHls(),
      onAudioScheduleSync: () => this.audioManager?.scheduleSync(),
      onAudioHydrateFromMaster: () => void this.audioManager?.hydrateFromMasterPlaylist(),
    })

    // YouTube-like idle delay: keep controls visible for a few seconds after mouse movement.
    Artplayer.CONTROL_HIDE_TIME = 6000

    this.artplayer = new Artplayer({
      container: container as HTMLDivElement,
      url: videoUrl,
      volume: volumePreference.volume,
      muted: volumePreference.muted, // set muted state on creation
      autoplay: true,
      pip: false,
      autoMini: true,
      screenshot: false,
      setting: false,
      hotkey: false,
      controls: [
        this.uiControls.buildPrevControlItem(),
        this.uiControls.buildNextControlItem(),
        buildCustomVolumeControl(),
      ],
      loop: false,
      playbackRate: false,
      aspectRatio: false,
      fullscreen: false,
      fullscreenWeb: false,
      miniProgressBar: true,
      theme: '#1890ff',
      lang: 'zh-cn',
      contextmenu: [],
      customType: {
        m3u8: async (video, url) => {
          try {
            if (url === ORIGINAL_PLACEHOLDER_URL) {
              const resolvedUrl = await this.quality.ensureOriginalSourceLoaded()
              if (!resolvedUrl) {
                this.showError('115原画加载失败，请稍后重试')
                this.failSwitchUrl('115原画加载失败')
                return
              }
              // 原画源加载成功后才记录偏好，避免源持续不可用时每次自动加载都带着失败偏好重试
              saveQualityPreference(this.currentPickCode, '115原画', 9999)
              // 立即更新内部状态，以便后续 UI 同步正常工作
              const opt = this.quality.qualityOptionsValue.find(o => o.url === url)
              if (opt) {
                this.quality.applySelectedOption(opt)
              }
              url = resolvedUrl
            }
            else {
              const opt = this.quality.qualityOptionsValue.find(o => o.url === url)
              if (opt) {
                // 只要是手动切换（非首次加载且已就绪），就记录偏好
                if (this.perfMarks.loadedmetadata) {
                  saveQualityPreference(this.currentPickCode, opt.label, opt.quality)
                }
                this.quality.applySelectedOption(opt)
              }
            }

            if (this.artplayer && await isHlsSupported()) {
              await this.initHls(video as HTMLVideoElement, url)
            }
            else {
              this.showError('您的浏览器不支持 HLS 播放')
              // 主动触发 video error，打破 artplayer switchUrl 的永久挂起，避免播放器卡死
              this.failSwitchUrl('您的浏览器不支持 HLS 播放')
            }
          }
          catch (error) {
            console.error('[115m] HLS 初始化失败:', error)
            this.showError('视频源加载失败，请稍后重试')
            // 主动触发 video error，打破 artplayer switchUrl 的永久挂起，避免播放器卡死
            this.failSwitchUrl(error instanceof Error ? error.message : 'HLS init failed')
          }
        },
      },
    })

    // 尽早把 上一集/播放/下一集 搬进居中簇，避免 ready 前闪现在左侧
    mountCenterCluster(this.artplayer)

    // 强制覆盖 Artplayer 内部的 storage 音量，防止它覆盖我们的全局偏好
    this.artplayer.video.volume = volumePreference.volume
    this.artplayer.video.muted = volumePreference.muted
    
    // Don't use ArtPlayer's fullscreenWeb — it uses position:fixed + moves to body,
    // which covers #playlist-sidebar. Instead the player fills its flex container naturally.
    Artplayer.FULLSCREEN_WEB_IN_BODY = false

    this.artplayer.on('restart', (url) => {
      if (typeof url !== 'string' || url === ORIGINAL_PLACEHOLDER_URL) return
      const opt = this.quality.qualityOptionsValue.find(o => o.url === url)
      if (opt && this.perfMarks.loadedmetadata) {
        saveQualityPreference(this.currentPickCode, opt.label, opt.quality)
        this.quality.applySelectedOption(opt)
      }
      this.setupProgressHoverPreview(url, this.quality.currentPlaybackTypeValue)
    })

    this.artplayer.on('video:pause', () => {
      this.playlist.syncCurrentPlaylistProgress(true)
      this.nativeMonitor?.onPause()
    })

    this.artplayer.on('video:seeking', () => {
      this.nativeMonitor?.onSeeking()
    })

    this.artplayer.on('video:seeked', () => {
      this.nativeMonitor?.onSeeked()
    })

    this.artplayer.on('video:play', () => {})

    this.artplayer.on('video:timeupdate', () => {
      this.playlist.syncCurrentPlaylistProgress()
    })

    this.rotationManager.attach(this.artplayer)

    // 创建原生播放监控器
    this.nativeMonitor?.destroy()
    this.nativeMonitor = new NativePlaybackMonitor()
    this.nativeMonitor.attach({
      art: this.artplayer,
      getIsNativeVideo: () => this.quality.isNativeVideoValue,
      getCurrentPlaybackType: () => this.quality.currentPlaybackTypeValue,
      getUltraUrl: () => this.quality.ultraUrlValue,
      getTitle: () => this.title,
      getNativeUltraConservative: () => this.nativeUltraConservative,
      getPerfMarksPlaying: () => this.perfMarks.playing,
      onFallbackToHls: (reason, rememberOriginal) => this.fallbackToHls(reason, rememberOriginal),
      onRetry: () => {},
      onShowToast: (msg) => this.overlay?.showToast(msg),
      fetchMasterPlaylistText: () => this.fetchMasterPlaylistText(),
    })

    // 绑定音频管理器
    this.audioManager.attach({
      art: this.artplayer,
      getHlsInstance: () => this.hlsController.instance,
      getCurrentPickCode: () => this.currentPickCode,
      getCurrentHlsLogicalUrl: () => this.hlsController.logicalUrl,
      onRebuildHls: (params) => this.hlsController.rebuildForAudioTrack(params),
      onShowToast: (msg) => this.overlay?.showToast(msg),
      onRenderRequest: () => this.mediaTrackController?.renderControl(),
      fetchMasterPlaylistText: () => this.fetchMasterPlaylistText(),
    })

    if (type === 'native') {
      this.quality.markNative()
      this.audioManager?.resetForNative()
    }

    this.setupTopNav()
    this.setupProgressHoverPreview(videoUrl, type)
    this.subtitleController.attach({
      art: this.artplayer,
      getCurrentPickCode: () => this.currentPickCode,
      onShowToast: (msg) => this.overlay?.showToast(msg),
      onRenderRequest: () => this.mediaTrackController?.renderControl(),
    })

    this.mediaTrackController?.attach({
      art: this.artplayer,
      subtitleController: this.subtitleController,
      audioManager: this.audioManager,
    })

    this.settingsMenuController?.attach({
      art: this.artplayer,
      currentPlaybackRate: this.currentPlaybackRate,
      onSelectPlaybackRate: (value) => this.applyPlaybackRate(value),
    })

    // 添加合并后的右侧控件
    this.artplayer.controls.add(this.quality.buildQualityControlItem())
    if (this.mediaTrackController) {
      this.artplayer.controls.add(this.mediaTrackController.buildControl()!)
    }
    this.artplayer.controls.add(this.uiControls.buildPlaybackModeControlItem())
    this.artplayer.controls.add(this.rotationManager.buildControl())
    if (this.settingsMenuController) {
      this.artplayer.controls.add(this.settingsMenuController.buildControl()!)
    }

    void this.actions.fetchBreadcrumbs()

    if (this.artplayer) {
      this.setupStatsMenu()

      if (this.cleanupKeyboard) {
        this.cleanupKeyboard()
      }
      this.cleanupKeyboard = bindPlayerEvents({
        art: this.artplayer,
        getType: () => this.quality.currentPlaybackTypeValue,
        getPickCode: () => this.currentPickCode,
        getQualityLabel: () => this.quality.currentQualityLabelValue,
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
          this.quality.renderQualityPanel()
          this.mediaTrackController?.renderControl()
          this.uiControls.renderPlaybackModeControl()
          this.uiControls.renderPlaybackNavControls()
          this.rotationManager?.renderControl()
          this.uiControls.renderSpeedControl()
        },
        onLoadedmetadata: () => {
          this.perfMarks.loadedmetadata = performance.now()
          this.quality.updateQualityByUrl(this.artplayer?.url || '')
          this.quality.renderQualityPanel()
          this.mediaTrackController?.renderControl()
          this.uiControls.renderPlaybackModeControl()
          this.uiControls.renderSpeedControl()
          this.rotationManager?.apply()
          this.hoverPreview?.updateSize()
        },
        onCanplay: () => {
          this.perfMarks.canplay = performance.now()
        },
        onPlaying: () => {
          this.playlist.clearPlaybackEndState()
          this.hlsController.resetSteadyRecoverCount()
          this.nativeMonitor?.resetRetryCount()
          this.nativeMonitor?.onPlaying()
          this.perfMarks.playing = performance.now()
          this.reportFirstFrameSummary()
        },
        onVolumeChange: () => {
          if (!this.artplayer) return
          saveVolumePreference({
            volume: this.artplayer.video.volume, // changed to this.artplayer.video.volume
            muted: this.artplayer.video.muted,
          })
        },
        onEnded: () => {
          this.playlist.handlePlaybackEnded()
        },
        onError: () => {
          if (this.quality.isNativeVideoValue) {
            void this.nativeMonitor?.onError()
          }
        },
      })
    }
  }



  private safeRemoveContextmenuItem(name: string) {
    try {
      this.artplayer?.contextmenu.remove(name)
    }
    catch {
      // Some built-in items only exist when the related feature is enabled.
    }
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
    this.uiControls.renderSpeedControl()
  }

  private setupTopNav() {
    if (!this.artplayer) return
    this.overlay?.destroy()
    const meta = readOverlayMetaFromQuery()
    this.overlay = new PlayerOverlayController({
      art: this.artplayer,
      meta,
      onMoveFile: async (fileId, cid) => await this.actions.moveFile(fileId, cid),
      onToggleFavorite: async (fileId, nextMarked) => await this.actions.toggleFavorite(fileId, nextMarked),
      onPlaylistToggle: async (open) => {
        if (!open) return []
        const items = await this.playlist.fetchPlaylistItems()
        this.playlist.syncOverlayPlaybackNav()
        return items
      },
      onPlaylistOpenChange: () => {
        this.hoverPreview?.refresh()
      },
      onPlaylistPlay: (pickCode, keepPlaylistOpen) => {
        if (pickCode && pickCode !== this.currentPickCode) {
          this.switchController.navigateToVideo(pickCode, keepPlaylistOpen)
        }
      },
      onPlaylistMove: async item => await this.actions.movePlaylistVideo(item),
      onPlaylistDelete: async item => await this.actions.deletePlaylistVideo(item),
      onDeleteFile: async (fileId, parentId, pickCode) => await this.actions.deleteCurrentVideo(fileId, parentId, pickCode),
      onPlayPrevious: () => this.playlist.playPrevious(),
      onPlayNext: () => this.playlist.playNext(),
      onReplay: () => this.playlist.replayCurrent(),
      getCurrentPickCode: () => this.currentPickCode,
      shouldKeepPlaylistOpen: () => this.keepPlaylistOpenOnInit,
    })
    this.overlay.init()
    const runtime = getRuntimeApi()
    runtime?.onMessage?.removeListener(this.handleRuntimeMessage)
    runtime?.onMessage?.addListener(this.handleRuntimeMessage)
    this.playlist.syncOverlayPlaybackNav()
    void this.playlist.prefetchPlaylistItems()
    // 异步获取最新的收藏状态
    if (meta.fileId) {
      void this.actions.fetchFileFavoriteStatus(meta.fileId)
    }
  }


  private setupProgressHoverPreview(previewSourceUrl?: string, _previewSourceType?: 'native' | 'hls') {
    if (!this.artplayer) return

    const currentUrl = previewSourceUrl || this.artplayer.url || ''
    const fallbackThumbnailSource = [...this.quality.m3u8ListValue].sort((a, b) => a.quality - b.quality)[0]?.url

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

  private fpsLastTime = 0
  private fpsLastFrames = 0
  private currentFps = 0

  private calcFps(): string {
    const video = this.artplayer?.video
    if (!video) return ''
    const q = (video.getVideoPlaybackQuality?.() || {}) as VideoPlaybackQualityLike
    let total = q.totalVideoFrames ?? 0
    if (!total) {
      total = (video as HTMLVideoElement & { webkitDecodedFrameCount?: number }).webkitDecodedFrameCount ?? 0
    }
    
    if (total === 0) return ''

    const now = performance.now()
    if (this.fpsLastTime === 0) {
      this.fpsLastTime = now
      this.fpsLastFrames = total
      return ''
    }

    const dt = (now - this.fpsLastTime) / 1000
    if (dt >= 1) { // 至少间隔 1 秒才刷新数据
      const df = total - this.fpsLastFrames
      this.currentFps = Math.max(0, df / dt)
      this.fpsLastTime = now
      this.fpsLastFrames = total
    }

    return this.currentFps > 0 ? this.currentFps.toFixed(1) : ''
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
    this.nativeMonitor?.clearAll()
    playerDebug('[115m] fallbackToHls triggered', { m3u8Count: this.quality.m3u8ListValue.length, reason })
    
    if (!this.artplayer) {
      this.showError('播放失败，无可用的视频源')
      return
    }

    // 确保有 m3u8 列表
    if (this.quality.m3u8ListValue.length === 0) {
      playerDebug('[115m] m3u8List empty, fetching...')
      const fetched = await fetchM3u8WithRetry(this.currentPickCode).catch((e) => {
        console.error('[115m] fetchM3u8WithRetry failed:', e)
        return null
      })
      if (fetched && fetched.length > 0) {
        this.quality.setM3u8List(fetched)
      }
    }

    if (this.quality.m3u8ListValue.length === 0) {
      console.error('[115m] fallbackToHls: no m3u8 sources available')
      this.showError('播放失败，无可用的视频源')
      return
    }

    const { url: bestQualityUrl, patch } = applyFallbackToHlsState(this.quality.getPlaybackState())
    this.quality.applyPlaybackStatePatch(patch)
    this.quality.forceHlsType()
    if (rememberOriginal) {
      saveQualityPreference(this.currentPickCode, '115原画', 9999)
    }
    if (!bestQualityUrl) {
      this.showError('播放失败，无可用的视频源')
      return
    }
    
    playerDebug('[115m] fallbackToHls: switching to HLS')
    this.quality.renderQualityPanel()
    this.overlay?.showToast(`${reason}，已切换 115原画`)
    try {
      this.switchUrlInFlight = true
      try {
        await this.withSwitchTimeout(this.artplayer.switchUrl(bestQualityUrl))
      }
      finally {
        this.switchUrlInFlight = false
      }
    }
    catch (error) {
      console.error('[115m] fallbackToHls switchUrl failed:', error)
      this.showError('播放失败，无可用的视频源')
    }
  }

  private clearTransientPlaybackWatchers() {
    this.nativeMonitor?.clearAll()
    this.audioManager?.clearSyncTimers()
  }

  /**
   * 给 artplayer.switchUrl/switchQuality 增加超时兜底。
   * artplayer 内部 switchUrl 依赖 video:canplay resolve / video:error reject，
   * HLS 源加载失败时可能永远不会触发这两个事件，导致 Promise 永久挂起、播放器卡死。
   * 超时后主动 reject，交由调用方 catch 提示，避免卡死。
   */
  private withSwitchTimeout<T>(promise: Promise<T>, timeoutMs = 15000, message = '视频切换超时'): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error(message)), timeoutMs)
      promise.then(
        (value) => {
          window.clearTimeout(timer)
          resolve(value)
        },
        (error) => {
          window.clearTimeout(timer)
          reject(error)
        },
      )
    })
  }

  /**
   * 主动触发 video 的 error 事件，打破 artplayer switchUrl 的内部挂起（它会 reject switchUrl 的 Promise）。
   * 仅在 HLS 加载失败/初始化异常且 switchUrl 在途时调用，避免播放器永久停在"切换中"。
   */
  private failSwitchUrl(reason: string) {
    const video = this.artplayer?.video
    if (!video) return
    video.dispatchEvent(new ErrorEvent('error', { message: reason }))
  }

  private showError(message: string) {
    renderPlayerError(message)
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

  private formatFileSize(size: number): string {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
    if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`
    return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`
  }

  destroy() {
    this.playlist.clearPlaybackEndState()
    this.nativeMonitor?.destroy()
    this.nativeMonitor = null
    this.audioManager?.destroy()
    this.audioManager = null
    this.switchController.destroy()
    this.playlist.destroy()
    this.actions.destroy()
    this.uiControls.destroy()
    this.quality.destroy()
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
    this.subtitleController?.destroy()
    this.subtitleController = null
    if (this.cleanupKeyboard) {
      this.cleanupKeyboard()
      this.cleanupKeyboard = null
    }
    this.rotationManager?.destroy()
    this.rotationManager = null
    this.settingsMenuController?.destroy()
    this.settingsMenuController = null
    this.mediaTrackController?.destroy()
    this.mediaTrackController = null
    this.hlsController.destroy()
    if (this.artplayer) {
      this.artplayer.destroy()
      this.artplayer = null
    }
  }
}

let playerManager: PlayerManager | null = null

function initPlayer() {
  if (playerManager) return // 防止重复初始化

  const { pickCode, traceId, clickTs, keepPlaylistOpen, playlistToken } = readPlayerBootstrapConfig(window.location.search)

  if (!pickCode) {
    const showError = () => {
      const el = document.getElementById('artplayer-app')
      if (el) {
        el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#ff4d4f;font-size:18px;">缺少 pickCode 参数</div>'
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showError)
    } else {
      showError()
    }
    return
  }

  playerManager = new PlayerManager({ pickCode, traceId, clickTs, keepPlaylistOpen, playlistToken })
}

// content script 暴露 initPlayer 供 video-page.ts 的 init() 调用
;(window as any).__115m_initPlayer = initPlayer
// 页面接管已在 video-page.content.ts 中同步完成，此处直接检查 DOM 就绪状态
if (document.getElementById('loading-text')) {
  initPlayer()
}

window.addEventListener('beforeunload', () => {
  playerManager?.destroy()
})

;(window as any).playerManager = playerManager








