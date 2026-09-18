import type { M3u8Item } from '../../lib/types'
import type { QualityOption } from '../types/types'

export const ORIGINAL_PLACEHOLDER_URL = 'm115://original'

export function getQualityDisplayName(quality: number, fromM3u8 = false): string {
  const map: Record<number, string> = {
    9999: fromM3u8 ? '115原画' : '无损',
    2160: '4K',
    1080: '1080P',
    720: '720P',
    480: '480P',
    360: '360P',
  }
  return map[quality] || '自动'
}

export function buildQualityOptions(
  currentUrl: string,
  ultraUrl: string | null,
  m3u8List: M3u8Item[],
  currentQuality: number,
  currentQualityLabel: string,
): QualityOption[] {
  const options: QualityOption[] = []

  if (ultraUrl) {
    options.push({
      label: '无损',
      quality: 9999,
      url: ultraUrl,
    })
  }

  const original = m3u8List.find(item => item.quality === 9999) || m3u8List[0]
  if (original) {
    options.push({
      label: '115原画',
      quality: 9999,
      url: original.url,
    })
  }
  else if (ultraUrl) {
    options.push({
      label: '115原画',
      quality: 9999,
      url: ORIGINAL_PLACEHOLDER_URL,
    })
  }

  // 添加 HLS 列表中的其他画质
  const existingQualities = new Set(options.map(o => o.quality))
  m3u8List.forEach((item) => {
    if (!existingQualities.has(item.quality)) {
      options.push({
        label: getQualityDisplayName(item.quality, true),
        quality: item.quality,
        url: item.url,
      })
      existingQualities.add(item.quality)
    }
  })

  if (options.length === 0 && currentUrl) {
    options.push({
      label: currentQualityLabel,
      quality: currentQuality,
      url: currentUrl,
    })
  }

  const dedup = new Map<string, QualityOption>()
  options.forEach((opt) => {
    if (!dedup.has(opt.url)) {
      dedup.set(opt.url, opt)
    }
  })

  return Array.from(dedup.values()).sort((a, b) => {
    const rank = (label: string, quality: number) => {
      if (label === '无损') return 10000
      if (label === '115原画') return 9999
      return quality
    }
    return rank(b.label, b.quality) - rank(a.label, a.quality)
  })
}

export function buildArtplayerQuality(
  qualityOptions: QualityOption[],
  currentUrl: string,
  currentQualityLabel: string,
): { html: string, url: string, default: boolean }[] {
  // 优先通过当前的画质标签来匹配默认项，这是最准确的（尤其是在 115原画 和 无损 之间区分）
  return qualityOptions.map(opt => ({
    html: opt.label,
    url: opt.url,
    default: opt.label === currentQualityLabel,
  }))
}
