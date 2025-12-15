import type { VideoCoverRaw } from '../../composables/global/useVideoCover'
import { CacheCore } from './cacheCore'

type VideoCoverCacheValue = VideoCoverRaw

const VIDEO_COVER_CACHE_KEY = 'video_cover_cache_v1'
class VideoCoverCache extends CacheCore<VideoCoverCacheValue> {
  constructor() {
    super({
      storeName: VIDEO_COVER_CACHE_KEY,
    })
  }
}

export const videoCoverCache = new VideoCoverCache()
