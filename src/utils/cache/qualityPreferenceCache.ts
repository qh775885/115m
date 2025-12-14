import { AppLogger } from '../logger'
import { CacheCore } from './core'

interface QualityPreferenceItem {
  /** 画质值 */
  quality: number
  /** 显示画质 */
  displayQuality?: string | number
  /** 更新时间 */
  updatedAt: number
}

/**
 * 画质偏好缓存
 * 用于记录用户对特定视频的画质选择偏好
 */
export class QualityPreferenceCache extends CacheCore<QualityPreferenceItem> {
  /** 日志 */
  private logger = new AppLogger('Utils QualityPreferenceCache')
  /** 缓存前缀 */
  private readonly CACHE_PREFIX = '115master_quality_preference_'
  /** 默认缓存时间：永久不过期 */
  private readonly DEFAULT_EXPIRES_IN = Number.POSITIVE_INFINITY

  constructor() {
    super({
      storeName: 'quality_preference_cache',
    })
  }

  /**
   * 获取画质偏好
   * @param videoId 视频标识符（pickCode 或 sha1）
   * @returns 画质偏好配置
   */
  async getPreference(videoId: string): Promise<QualityPreferenceItem | null> {
    try {
      const cacheKey = this.CACHE_PREFIX + videoId
      const cached = await this.get(cacheKey)

      if (!cached) {
        this.logger.log('getPreference', `画质偏好缓存未找到: ${videoId}`)
        return null
      }

      /** 检查是否过期 */
      const now = Date.now()
      if (now - cached.createdAt > this.DEFAULT_EXPIRES_IN) {
        this.logger.log('getPreference', `画质偏好缓存已过期: ${videoId}`)
        await this.remove(cacheKey)
        return null
      }

      this.logger.log('getPreference', `画质偏好缓存命中: ${videoId}，画质: ${cached.value.quality}`)
      return cached.value
    }
    catch (error) {
      this.logger.error('获取画质偏好失败:', error)
      return null
    }
  }

  /**
   * 保存画质偏好
   * @param videoId 视频标识符（pickCode 或 sha1）
   * @param quality 画质值
   * @param displayQuality 显示画质
   */
  async setPreference(
    videoId: string,
    quality: number,
    displayQuality?: string | number,
  ): Promise<void> {
    try {
      const cacheKey = this.CACHE_PREFIX + videoId
      const preference: QualityPreferenceItem = {
        quality,
        displayQuality,
        updatedAt: Date.now(),
      }

      await this.set(cacheKey, preference)
      this.logger.log('setPreference', `画质偏好已保存: ${videoId}，画质: ${quality}`)
    }
    catch (error) {
      this.logger.error('保存画质偏好失败:', error)
    }
  }

  /**
   * 删除画质偏好
   * @param videoId 视频标识符（pickCode 或 sha1）
   */
  async removePreference(videoId: string): Promise<void> {
    try {
      const cacheKey = this.CACHE_PREFIX + videoId
      await this.remove(cacheKey)
      this.logger.log('removePreference', `画质偏好已删除: ${videoId}`)
    }
    catch (error) {
      this.logger.error('删除画质偏好失败:', error)
    }
  }

  /**
   * 清理过期的画质偏好
   */
  async cleanExpired(): Promise<void> {
    try {
      const now = Date.now()
      /** 使用 storage.keys() 方法获取所有键 */
      const allKeys = await this.storage.keys()

      for (const key of allKeys) {
        if (key.startsWith(this.CACHE_PREFIX)) {
          const cached = await this.storage.getItem<{
            value: QualityPreferenceItem
            createdAt: number
            updatedAt: number
          }>(key)
          if (cached && cached.createdAt && now - cached.createdAt > this.DEFAULT_EXPIRES_IN) {
            await this.remove(key)
            this.logger.log('cleanExpired', `已清理过期画质偏好: ${key}`)
          }
        }
      }
    }
    catch (error) {
      this.logger.error('清理过期画质偏好失败:', error)
    }
  }
}

/** 画质偏好缓存实例 */
export const qualityPreferenceCache = new QualityPreferenceCache()
