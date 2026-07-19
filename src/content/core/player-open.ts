import type { FileInfo } from './types'
import { NORMAL_URL } from '../../lib/constants'
import { sendTypedRuntimeMessageSafe } from './runtime'
import { saveTemporaryPlayerPlaylist, type StoredPlayerPlaylistItem } from '../../shared/player-playlist-cache'

export async function openPlayer(file: FileInfo, playlistItems: StoredPlayerPlaylistItem[] = []) {
  const now = Date.now()
  const traceId = `${file.pickCode}-${now}`
  const playlistToken = saveTemporaryPlayerPlaylist(playlistItems)

  const params = new URLSearchParams({
    pick_code: file.pickCode,
    pickCode: file.pickCode,
    title: file.fileName,
    traceId,
    clickTs: String(now),
  })

  if (file.fileId) params.set('fileId', file.fileId)
  if (file.parentId) params.set('cid', file.parentId)
  if (file.fileSize) params.set('fileSize', file.fileSize)
  if (typeof file.isMarked === 'boolean') params.set('marked', file.isMarked ? '1' : '0')
  if (playlistToken) params.set('playlistToken', playlistToken)

  const url = `${NORMAL_URL}/web/lixian/master/video/?${params.toString()}`

  await sendTypedRuntimeMessageSafe({
    type: 'OPEN_TAB',
    url,
  })
}
