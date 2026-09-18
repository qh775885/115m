import { WEB_API_URL } from '../../lib/constants'
import type { MsgFetchPlaylistResponse, RuntimeDeleteFileResponse, RuntimeMainWorldResponse } from '../../shared/messages'

type RuntimeGetResponse = RuntimeMainWorldResponse

type SendMessage = <T = unknown>(message: unknown) => Promise<T | null>

export async function fetchPlaylistResponse(
  sendMessage: SendMessage,
  cid: string,
  pickCode: string,
): Promise<MsgFetchPlaylistResponse | null> {
  return await sendMessage<MsgFetchPlaylistResponse>({
    type: 'FETCH_PLAYLIST',
    data: { cid, pickCode },
  })
}

export async function fetchFavoriteStatus(
  sendMessage: SendMessage,
  pickCode: string,
): Promise<boolean | null> {
  const url = `${WEB_API_URL}/files/video?pickcode=${encodeURIComponent(pickCode)}&share_id=0&local=1`
  const response = await sendMessage<RuntimeGetResponse>({
    type: 'MAIN_WORLD_GET',
    data: { url },
  })

  if (!response?.ok || !response.text) {
    return null
  }

  try {
    const parsed = JSON.parse(response.text) as { is_mark?: string }
    return parsed.is_mark === '1'
  }
  catch {
    return null
  }
}

export async function updateFavoriteStatus(
  sendMessage: SendMessage,
  fileId: string,
  nextMarked: boolean,
): Promise<boolean> {
  const body = `file_id=${encodeURIComponent(fileId)}&star=${nextMarked ? '1' : '0'}`
  const response = await sendMessage<RuntimeGetResponse>({
    type: 'MAIN_WORLD_FETCH',
    data: {
      url: `${WEB_API_URL}/files/star`,
      body,
    },
  })

  try {
    const parsed = response?.text ? JSON.parse(response.text) as { state?: boolean } : null
    if (response?.ok && parsed?.state === true) {
      return nextMarked
    }
  }
  catch {
    // ignore parse error
  }

  return !nextMarked
}

export async function deleteVideoFile(
  sendMessage: SendMessage,
  fileId: string,
  parentId: string,
  pickCode: string,
): Promise<boolean> {
  const response = await sendMessage<RuntimeDeleteFileResponse>({
    type: 'DELETE_FILE',
    data: { fileId, parentId, pickCode },
  })

  if (response?.ok) {
    return true
  }

  throw new Error(response?.error || '删除失败')
}
