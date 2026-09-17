/**
 * 115m 2.0 · 播放会话控制器（Layer 2）
 * 编排「加载播放列表 / 切集 / 上一下一集 / 播完自动连播」。
 * 依赖：PlayerCore（能力层）+ 播放列表适配层；不涉及任何 DOM。
 */

import { PlayerCore } from './player-core'
import { createContentStore } from '../state/content-state'
import { loadPlaylist } from '../adapters/playlist'
import { preparePlaybackSource } from '../stream-builder'
import { getPlaylistPosition } from '../../core/playlist-navigation'
import { buildNavigateToVideoUrl } from '../../core/player-query'

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
  private switching = false

  constructor(
    private readonly core: PlayerCore,
    private readonly params: SessionParams,
  ) {}

  async init(): Promise<void> {
    this.content.set({
      pickCode: this.params.pickCode,
      cid: this.params.cid,
      title: this.params.title,
      fileSize: this.params.fileSize,
      isFavorite: this.params.isFavorite,
    })
    this.core.onEnded(() => this.autoAdvance())
    if (this.params.cid) void this.loadList()
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
      const source = await preparePlaybackSource(pickCode)
      const item = this.content.get().playlist.find(entry => entry.pickCode === pickCode)

      this.core.load(source.src, source.type, options.autoPlay !== false)

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

  private async loadList(): Promise<void> {
    try {
      const { items, path } = await loadPlaylist(this.content.get().cid, this.content.get().pickCode)
      const pos = getPlaylistPosition(items, this.content.get().pickCode)
      this.content.set({
        playlist: items,
        path: path.length ? path : this.content.get().path,
        currentIndex: pos.index >= 0 ? pos.index + 1 : 0,
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
