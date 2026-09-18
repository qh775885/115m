/**
 * M3U8 播放列表 URL 匹配工具
 * 用于将选中的画质 URL 与 master 文本中的变体行做容错匹配
 */

/** 归一化播放列表 URL，用于容错匹配（忽略协议/域名/查询串差异） */
export function normalizePlaylistUrl(url: string): string {
  try {
    const clean = url.split('#')[0]
    const parsed = new URL(clean, 'https://115.com')
    // 仅保留主机 + 路径 + 文件名，去掉 query（签名参数会变化）
    return `${parsed.hostname}${parsed.pathname}`
  }
  catch {
    return url
  }
}

/**
 * 从 master 文本中查找与目标 URL 匹配的变体行
 * 返回 { streamInf, matchedUrl }；找不到时 streamInf 为空串
 */
export function findVariantInMaster(
  masterText: string,
  selectedUrl: string,
): { streamInf: string, matchedUrl: string } {
  const lines = masterText.split(/\r?\n/)
  const selectedNorm = normalizePlaylistUrl(selectedUrl)

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]?.trim() || ''
    if (!line || line.startsWith('#')) continue
    if (normalizePlaylistUrl(line) === selectedNorm) {
      return {
        streamInf: lines[i - 1]?.trim() || '',
        matchedUrl: line,
      }
    }
  }

  return { streamInf: '', matchedUrl: '' }
}
