import { AppLogger } from '../logger'
import { CacheCore } from './core'

/** 旋转翻转偏好项 */
interface TransformPreferenceItem {
  /** 旋转角度 */
  rotate: number
  /** 水平翻转 */
  flipX: boolean
  /** 垂直翻转 */
  flipY: boolean
  /** 创建时间戳 */
  createdAt: number
}

/**
 * 旋转翻转偏好缓存
 * 用于记录用户对特定视频的旋转翻转设置偏好
 */
export class TransformPreferenceCache extends CacheCore<TransformPreferenceItem> {
  /** 日志 */
  private logger = new AppLogger('Utils TransformPreferenceCache')
  /** 缓存前缀 */
  private readonly CACHE_PREFIX = '115master_transform_preference_'
  /** 默认缓存时间：永久不过期 */
  private readonly DEFAULT_EXPIRES_IN = Number.POSITIVE_INFINITY

  constructor() {
    super({
      storeName: 'transform_preference_cache',
      enableQuotaManagement: true,
    })
  }

  /**
   * 获取旋转翻转偏好
   * @param videoId 视频标识符（pickCode 或 sha1）
   * @returns 旋转翻转偏好配置
   */
  async getPreference(videoId: string): Promise<TransformPreferenceItem | null> {
    try {
      const cacheKey = this.CACHE_PREFIX + videoId
      const cached = await this.get(cacheKey)

      if (!cached) {
        this.logger.log('getPreference', `旋转翻转偏好缓存未找到: ${videoId}`)
        return null
      }

      /** 检查是否过期 */
      const now = Date.now()
      if (now - cached.createdAt > this.DEFAULT_EXPIRES_IN) {
        this.logger.log('getPreference', `旋转翻转偏好缓存已过期: ${videoId}`)
        await this.remove(cacheKey)
        return null
      }

      this.logger.log('getPreference', `旋转翻转偏好缓存命中: ${videoId}，旋转: ${cached.value.rotate}°，水平翻转: ${cached.value.flipX}，垂直翻转: ${cached.value.flipY}`)
      return cached.value
    }
    catch (error) {
      this.logger.error('获取旋转翻转偏好失败:', error)
      return null
    }
  }

  /**
   * 保存旋转翻转偏好
   * @param videoId 视频标识符（pickCode 或 sha1）
   * @param rotate 旋转角度
   * @param flipX 水平翻转状态
   * @param flipY 垂直翻转状态
   */
  async setPreference(videoId: string, rotate: number, flipX: boolean, flipY: boolean): Promise<void> {
    try {
      const cacheKey = this.CACHE_PREFIX + videoId
      const now = Date.now()

      const preference: TransformPreferenceItem = {
        rotate,
        flipX,
        flipY,
        createdAt: now,
      }

      await this.set(cacheKey, preference)
      this.logger.log('setPreference', `旋转翻转偏好已保存: ${videoId}，旋转: ${rotate}°，水平翻转: ${flipX}，垂直翻转: ${flipY}`)
    }
    catch (error) {
      this.logger.error('保存旋转翻转偏好失败:', error)
    }
  }

  /**
   * 删除旋转翻转偏好
   * @param videoId 视频标识符
   */
  async removePreference(videoId: string): Promise<void> {
    try {
      const cacheKey = this.CACHE_PREFIX + videoId
      await this.remove(cacheKey)
      this.logger.log('removePreference', `旋转翻转偏好已删除: ${videoId}`)
    }
    catch (error) {
      this.logger.error('删除旋转翻转偏好失败:', error)
    }
  }

  /**
   * 清理过期的旋转翻转偏好
   */
  async cleanExpired(): Promise<void> {
    try {
      const now = Date.now()
      /** 使用 storage.keys() 方法获取所有键 */
      const allKeys = await this.storage.keys()

      for (const key of allKeys) {
        if (key.startsWith(this.CACHE_PREFIX)) {
          const cached = await this.storage.getItem(key) as any
          if (cached && cached.createdAt && now - cached.createdAt > this.DEFAULT_EXPIRES_IN) {
            await this.remove(key)
            this.logger.log('cleanExpired', `已清理过期旋转翻转偏好: ${key}`)
          }
        }
      }
    }
    catch (error) {
      this.logger.error('清理过期旋转翻转偏好失败:', error)
    }
  }
}

/** 旋转翻转偏好缓存实例 */
export const transformPreferenceCache = new TransformPreferenceCache()
