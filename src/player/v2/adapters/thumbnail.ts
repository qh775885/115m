/**
 * 115m 2.0 · 缩略图业务适配层（Layer 1）
 * 复用 core 的抽帧实现（M3U8 切片 + WebCodecs），自带缓存与在途去重。
 */

import { getVideoCoverAt, type VideoThumbnail } from '../../../lib/videoThumbnail'

export type { VideoThumbnail }

export async function loadCoverAt(pickCode: string, time: number, duration: number): Promise<VideoThumbnail | null> {
  if (!pickCode || !duration) return null
  try {
    return await getVideoCoverAt(pickCode, time, duration)
  }
  catch {
    return null
  }
}
