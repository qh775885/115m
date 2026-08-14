/**
 * 115 视频画质映射
 */
export const qualityCodeMap: Record<string, number> = {
  '3G': 360,
  'SD': 480,
  'HD': 720,
  'UD': 1080,
  'BD': 2160,
  'YH': 9999,
}

export interface M3u8Item {
  name: string
  quality: number
  url: string
}
