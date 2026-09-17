import { resolvePlaybackBundle } from '../core/player-services'
import { callExtensionBridge } from './bridge-client'
import { findVariantInMaster } from '../core/playlist-url'
import { resolveM3u8Url } from '../../lib/m3u8-parser'
import { buildQualityOptions, ORIGINAL_PLACEHOLDER_URL } from '../core/quality'
import type { QualityOption } from '../core/types'

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
  const { initial } = await resolvePlaybackSources(pickCode)
  return initial
}

const bridgeSender = async (message: unknown) => await callExtensionBridge(message)

/** 由单个 URL 构建可播放源：原画直链直传；HLS 拉取 master 合成音频轨 Blob。 */
async function buildPreparedSource(playUrl: string, pickCode: string, label = ''): Promise<PreparedPlaybackSource> {
  if (!playUrl) {
    throw new Error('无效的播放源地址')
  }

  const isM3u8 = /\.m3u8/i.test(playUrl)
  if (!isM3u8) {
    return { src: playUrl, type: 'video/mp4', label: label || '原画直链', isBlob: false }
  }

  let finalUrl = playUrl
  let isBlob = false
  try {
    const res = await callExtensionBridge<any>({
      type: 'FETCH_M3U8_TEXT',
      data: { pickCode },
    }, 12000)
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
    label: label || 'HLS 转码流',
    isBlob,
  }
}

export interface ResolvedPlaybackSources {
  initial: PreparedPlaybackSource
  options: QualityOption[]
  qualityLabel: string
}

/**
 * 解析播放源全集：首播源 + 全部可选画质（供清晰度切换）。
 */
export async function resolvePlaybackSources(pickCode: string): Promise<ResolvedPlaybackSources> {
  const bundle = await resolvePlaybackBundle(bridgeSender as never, pickCode)
  const { initialPlayback } = bundle
  const initial = await buildPreparedSource(initialPlayback.url, pickCode, initialPlayback.currentQualityLabel)

  const options = buildQualityOptions(
    initialPlayback.url,
    bundle.ultraUrl,
    bundle.m3u8List,
    initialPlayback.currentQuality,
    initialPlayback.currentQualityLabel,
  ).filter(option => !!option.url && option.url !== ORIGINAL_PLACEHOLDER_URL)

  return { initial, options, qualityLabel: initialPlayback.currentQualityLabel }
}

/** 按所选画质构建播放源（切清晰度用）。 */
export async function prepareQualitySource(option: QualityOption, pickCode: string): Promise<PreparedPlaybackSource> {
  return await buildPreparedSource(option.url, pickCode, option.label)
}

