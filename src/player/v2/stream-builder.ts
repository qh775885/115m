import { resolvePlaybackBundle } from '../core/player-services'
import { sendTypedRuntimeMessageSafe } from '../core/runtime'
import { findVariantInMaster } from '../core/playlist-url'
import { resolveM3u8Url } from '../../lib/m3u8-parser'

export interface PreparedPlaybackSource {
  src: string
  type: string
  label: string
  isBlob: boolean
}

/**
 * 将音视频分离的 115 HLS 流重新组装为带有音频轨道的 Master Playlist Blob
 */
export function buildMasterHlsBlobUrl(masterText: string, selectedUrl: string): string {
  if (!masterText || !/#EXT-X-MEDIA:TYPE=AUDIO/i.test(masterText)) {
    return selectedUrl
  }

  const lines = masterText.split(/\r?\n/)
  const audioTags = lines.filter(line => /#EXT-X-MEDIA:TYPE=AUDIO/i.test(line.trim()))
  if (audioTags.length === 0) {
    return selectedUrl
  }

  const { streamInf: matchedStreamInf, matchedUrl } = findVariantInMaster(masterText, selectedUrl)
  let streamInf = matchedStreamInf

  if (!streamInf.startsWith('#EXT-X-STREAM-INF')) {
    const groupId = audioTags[0].match(/GROUP-ID="([^"]+)"/i)?.[1] || 'Audio-Group'
    streamInf = `#EXT-X-STREAM-INF:BANDWIDTH=3000000,AUDIO="${groupId}",NAME="custom"`
  }
  else if (!/\bAUDIO=/i.test(streamInf)) {
    const groupId = audioTags[0].match(/GROUP-ID="([^"]+)"/i)?.[1] || 'Audio-Group'
    streamInf = `${streamInf},AUDIO="${groupId}"`
  }

  const absoluteAudioTags = audioTags.map(tag =>
    tag.replace(/URI="([^"]+)"/i, (_, uri) => `URI="${resolveM3u8Url(uri)}"`)
  )
  const targetVariantUrl = resolveM3u8Url(matchedUrl || selectedUrl)
  const wrapped = ['#EXTM3U', ...absoluteAudioTags, streamInf, targetVariantUrl].join('\n')
  return URL.createObjectURL(new Blob([wrapped], { type: 'application/vnd.apple.mpegurl' }))
}

/**
 * 准备视频播放源：自动完成鉴权 Cookie 写入、清晰度优选与多音轨组装
 */
export async function preparePlaybackSource(pickCode: string): Promise<PreparedPlaybackSource> {
  const bundle = await resolvePlaybackBundle(sendTypedRuntimeMessageSafe, pickCode)
  const { initialPlayback } = bundle

  const playUrl = initialPlayback.playUrl
  const isM3u8 = /\.m3u8/i.test(playUrl) || initialPlayback.type === 'hls'

  if (!isM3u8) {
    return {
      src: playUrl,
      type: 'video/mp4',
      label: initialPlayback.name || '原画直链',
      isBlob: false,
    }
  }

  // HLS 流：拉取 master playlist 检查是否需要合成独立音频轨
  let finalUrl = playUrl
  let isBlob = false
  try {
    const res = await sendTypedRuntimeMessageSafe({
      type: 'FETCH_M3U8_TEXT',
      data: { pickCode },
    }, 2, 500, 12000)
    const text = res && 'text' in res && res.text ? res.text : null
    if (text) {
      const blobUrl = buildMasterHlsBlobUrl(text, playUrl)
      if (blobUrl !== playUrl) {
        finalUrl = blobUrl
        isBlob = true
      }
    }
  }
  catch (err) {
    console.warn('[115m-v2] 获取 Master M3U8 失败，回退使用原始切片地址', err)
  }

  return {
    src: finalUrl,
    type: 'application/x-mpegurl',
    label: initialPlayback.name || 'HLS 转码流',
    isBlob,
  }
}
