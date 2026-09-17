/**
 * 115m 2.0 · 播放会话控制器（Layer 2）
 * 编排「首播解析 / 加载播放列表 / 切集 / 切清晰度 / 上一下一集 / 播完连播」。
 * 依赖：PlayerCore（能力层）+ 播放列表适配层 + 播放源构建；不涉及任何 DOM。
 */

import { PlayerCore } from './player-core'
import { createContentStore } from '../state/content-state'
import { loadPlaylist } from '../adapters/playlist'
import {
  prepareQualitySource,
  resolvePlaybackSources,
  type PreparedPlaybackSource,
  type ResolvedPlaybackSources,
} from '../stream-builder'
import { getPlaylistPosition } from '../../core/playlist-navigation'
import { buildNavigateToVideoUrl } from '../../core/player-query'
import type { QualityOption } from '../../core/types'

export interface SessionParams {
  pickCode: string
  cid: string
  title: string
  fileSize: string
  isFavorite: boolean
}

export interface SwitchOptions {
  autoPlay?: boolean
  keepPlaylistOpen?: boolean
}

export class PlaybackSession {
  readonly content = createContentStore()

  private qualityOptions: QualityOption[] = []
  private switching = false

  constructor(
    private readonly core: PlayerCore,
    private readonly params: SessionParams,
  ) {}

  /** 首播：解析源 → 装载首播源 → 加载播放列表。返回首播源供状态提示使用。 */
  async start(): Promise<PreparedPlaybackSource> {
    this.content.set({
      pickCode: this.params.pickCode,
      cid: this.params.cid,
      title: this.params.title,
      fileSize: this.params.fileSize,
      isFavorite: this.params.isFavorite,
    })
    this.core.onEnded(() => this.autoAdvance())

    const resolved = await resolvePlaybackSources(this.params.pickCode)
    this.applySources(resolved)
    this.core.load(resolved.initial.src, resolved.initial.type, false)

    if (this.params.cid) void this.loadList()

    return resolved.initial
  }

  /** 切换清晰度。 */
  async setQuality(label: string): Promise<void> {
    if (!label || label === this.content.get().quality) return
    const option = this.qualityOptions.find(entry => entry.label === label)
    if (!option) return
    try {
      const source = await prepareQualitySource(option, this.content.get().pickCode)
      this.core.load(source.src, source.type, true)
      this.content.set({ quality: label })
    }
    catch (error) {
      console.warn('[115m-v2] 切换清晰度失败', error)
    }
  }

  next(autoPlay = true): void {
    const { playlist, pickCode } = this.content.get()
    const pos = getPlaylistPosition(playlist, pickCode)
    if (pos.next) void this.switchTo(pos.next.pickCode, { autoPlay, keepPlaylistOpen: true })
  }

  prev(autoPlay = true): void {
    const { playlist, pickCode } = this.content.get()
    const pos = getPlaylistPosition(playlist, pickCode)
    if (pos.previous) void this.switchTo(pos.previous.pickCode, { autoPlay, keepPlaylistOpen: true })
  }

  async switchTo(pickCode: string, options: SwitchOptions = {}): Promise<void> {
    if (!pickCode || pickCode === this.content.get().pickCode || this.switching) return
    this.switching = true
    this.content.set({ switching: true })
    try {
      const resolved = await resolvePlaybackSources(pickCode)
      const item = this.content.get().playlist.find(entry => entry.pickCode === pickCode)

      this.applySources(resolved)
      this.core.load(resolved.initial.src, resolved.initial.type, options.autoPlay !== false)

      const pos = getPlaylistPosition(this.content.get().playlist, pickCode)
      this.content.set({
        pickCode,
        title: item?.name || this.content.get().title,
        fileSize: item?.size || '',
        currentIndex: pos.index >= 0 ? pos.index + 1 : 0,
        isFavorite: !!item?.isMarked,
      })

      window.history.replaceState(null, '', buildNavigateToVideoUrl(
        window.location.pathname,
        window.location.search,
        pickCode,
        {
          title: item?.name,
          fileId: item?.fileId,
          fileSize: item?.size,
          cid: item?.cid || this.content.get().cid,
          keepPlaylistOpen: options.keepPlaylistOpen,
        },
      ))
    }
    catch (error) {
      console.warn('[115m-v2] 切换集数失败', error)
    }
    finally {
      this.switching = false
      this.content.set({ switching: false })
    }
  }

  private applySources(resolved: ResolvedPlaybackSources): void {
    this.qualityOptions = resolved.options
    this.content.set({
      qualities: resolved.options.map(option => option.label),
      quality: resolved.qualityLabel,
    })
  }

  private async loadList(): Promise<void> {
    try {
      const { items, path } = await loadPlaylist(this.content.get().cid, this.content.get().pickCode)
      const pos = getPlaylistPosition(items, this.content.get().pickCode)
      const current = pos.current
      this.content.set({
        playlist: items,
        path: path.length ? path : this.content.get().path,
        currentIndex: pos.index >= 0 ? pos.index + 1 : 0,
        title: this.content.get().title || current?.name || '',
        fileSize: this.content.get().fileSize || current?.size || '',
      })
    }
    catch (error) {
      console.warn('[115m-v2] 播放列表加载失败', error)
    }
  }

  private autoAdvance(): void {
    const { playlist, pickCode } = this.content.get()
    const pos = getPlaylistPosition(playlist, pickCode)
    if (pos.next) void this.switchTo(pos.next.pickCode, { autoPlay: true, keepPlaylistOpen: true })
  }
}
