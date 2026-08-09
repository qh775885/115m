import type { FileItem } from '../../lib/api/types'
import type { OverlayPlaylistItem } from './overlay'

type RawPlaylistItem = FileItem & {
  pc?: string
  file_id?: string
  m?: number
  play_long?: number
  n?: string
}

export function normalizePlaylistItems(
  list: RawPlaylistItem[],
  formatFileSize: (size: number) => string,
): OverlayPlaylistItem[] {
  return list
    .filter(item => !!(item.pc || item.pick_code))
    .map(item => {
      const size = item.s || item.fs || 0
      return {
        pickCode: item.pc || item.pick_code,
        fileId: String(item.fid || item.file_id || item.cid || ''),
        name: item.n || item.fn || '',
        size: size > 0 ? formatFileSize(size) : '',
        isMarked: item.m === 1 || item.iv === 1,
        duration: item.play_long || 0,
        sha: item.sha || '',
        cid: item.cid || item.pid || '',
      }
    })
}
