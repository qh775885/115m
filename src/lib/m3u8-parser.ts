/**
 * M3U8 解析工具
 * 从 M3U8 文本中提取画质列表
 */
import { qualityCodeMap } from './types'
import type { M3u8Item } from './types'
import { NORMAL_URL } from './constants'

/**
 * 获取 URL 的绝对路径
 * 兼容绝对 URL、协议相对 URL（//host/path）、相对路径
 */
function resolveM3u8Url(url: string): string {
  try {
    return new URL(url, NORMAL_URL).href
  }
  catch {
    return url.startsWith('http') ? url : `${NORMAL_URL}${url}`
  }
}

/**
 * 解析 M3U8 主播放列表文本，提取各画质 URL
 * 供 background 和 drive115 共用
 */
export function parseM3u8Text(text: string): M3u8Item[] {
  const lines = text.split('\n')
  const m3u8List: M3u8Item[] = []

  lines.forEach((line, index) => {
    if (line.includes('NAME="') && line.match(/#EXT-X-STREAM-INF/)) {
      const name = line.match(/NAME="([^"]*)"/)?.[1] ?? ''
      const m3u8Url = lines[index + 1]?.trim()
      if (m3u8Url) {
        m3u8List.push({
          name,
          quality: qualityCodeMap[name] ?? 0,
          url: resolveM3u8Url(m3u8Url),
        })
      }
    }
  })

  m3u8List.sort((a, b) => b.quality - a.quality)
  return m3u8List
}
