import type { OverlayPathItem } from './overlay-types'

export interface PlayerBootstrapConfig {
  pickCode: string | null
  traceId?: string
  clickTs?: number
  keepPlaylistOpen?: boolean
  playlistToken?: string
}

export interface OverlayMetaQuery {
  title: string
  fileSize: string
  fileId: string
  cid: string
  parentId: string
  isMarked: boolean
  path: OverlayPathItem[]
}

export interface NavigateToVideoOptions {
  title?: string
  fileId?: string
  fileSize?: string
  cid?: string
  isMarked?: boolean
  keepPlaylistOpen?: boolean
}

export function readPlayerBootstrapConfig(search: string): PlayerBootstrapConfig {
  const params = new URLSearchParams(search)
  const pickCode = params.get('pickCode') || params.get('pick_code')
  const traceId = params.get('traceId') || undefined
  const clickTsRaw = params.get('clickTs')
  const clickTs = clickTsRaw ? Number(clickTsRaw) : undefined
  const keepPlaylistOpen = params.get('playlistOpen') === '1'
  const playlistToken = params.get('playlistToken') || undefined

  return { pickCode, traceId, clickTs, keepPlaylistOpen, playlistToken }
}

export function readPlaylistCidFromLocation(search: string): string {
  return new URLSearchParams(search).get('cid') || ''
}

export function readPathFromLocation(search: string): OverlayPathItem[] {
  const rawPath = new URLSearchParams(search).get('path')
  if (!rawPath) return []

  try {
    const parsed = JSON.parse(rawPath) as OverlayPathItem[]
    return Array.isArray(parsed)
      ? parsed.filter(item => !!item?.cid && !!item?.name)
      : []
  }
  catch {
    return []
  }
}

export function readOverlayMetaQuery(search: string): OverlayMetaQuery {
  const params = new URLSearchParams(search)
  const cid = params.get('cid') || ''

  return {
    title: params.get('title') || '视频播放',
    fileSize: params.get('fileSize') || '',
    fileId: params.get('fileId') || '',
    cid,
    parentId: cid,
    // 不从 URL 读取 marked，由 fetchFileFavoriteStatus 异步获取真实状态
    isMarked: false,
    path: readPathFromLocation(search),
  }
}

export function readOverlayMetaFromQuery(): OverlayMetaQuery {
  return readOverlayMetaQuery(window.location.search)
}

export function buildNavigateToVideoUrl(pathname: string, search: string, pickCode: string, options: NavigateToVideoOptions = {}): string {
  const params = new URLSearchParams(search)
  params.set('pick_code', pickCode)
  params.set('pickCode', pickCode)
  if (options.title) {
    params.set('title', options.title)
  }
  if (options.fileId) {
    params.set('fileId', options.fileId)
  }
  if (options.fileSize) {
    params.set('fileSize', options.fileSize)
  }
  if (options.cid) {
    params.set('cid', options.cid)
  }
  if (typeof options.isMarked === 'boolean') {
    params.set('marked', options.isMarked ? '1' : '0')
  }
  if (options.keepPlaylistOpen) {
    params.set('playlistOpen', '1')
  }
  else {
    params.delete('playlistOpen')
  }
  return `${pathname}?${params.toString()}`
}

export function buildUpdatedMarkedUrl(pathname: string, search: string, nextMarked: boolean): string {
  const params = new URLSearchParams(search)
  params.set('marked', nextMarked ? '1' : '0')
  return `${pathname}?${params.toString()}`
}
