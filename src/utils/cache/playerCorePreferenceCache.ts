import type { PlayerCoreType } from '../../composables/player/playerCore/types'
import { AppLogger } from '../logger'
import { CacheCore } from './cacheCore'

interface PlayerCorePreferenceItem {
  /** 播放器核心类型 */
  coreType: PlayerCoreType
  /** 更新时间 */
  updatedAt: number
}

/**
 * 播放器核心偏好缓存
 * 用于记录用户对特定视频的播放器核心选择偏好
 */
export class PlayerCorePreferenceCache extends CacheCore<PlayerCorePreferenceItem> {
  /** 日志 */
  private logger = new AppLogger('Utils PlayerCorePreferenceCache')
  /** 缓存前缀 */
  private readonly CACHE_PREFIX = '115master_player_core_preference_'
  /** 默认缓存时间：永久不过期 */
  private readonly DEFAULT_EXPIRES_IN = Number.POSITIVE_INFINITY

  constructor() {
    super({
      storeName: 'player_core_preference_cache',
    })
  }

  /**
   * 获取播放器核心偏好
   * @param videoId 视频标识符（pickCode 或 sha1）
   * @returns 播放器核心偏好配置
   */
  async getPreference(videoId: string): Promise<PlayerCorePreferenceItem | null> {
    try {
      const cacheKey = this.CACHE_PREFIX + videoId
      const cached = await this.get(cacheKey)

      if (!cached) {
        this.logger.log('getPreference', `播放器核心偏好缓存未找到: ${videoId}`)
        return null
      }

      /** 检查是否过期 */
      const now = Date.now()
      if (now - cached.createdAt > this.DEFAULT_EXPIRES_IN) {
        this.logger.log('getPreference', `播放器核心偏好缓存已过期: ${videoId}`)
        await this.remove(cacheKey)
        return null
      }

      this.logger.log('getPreference', `播放器核心偏好缓存命中: ${videoId}，核心: ${cached.value.coreType}`)
      return cached.value
    }
    catch (error) {
      this.logger.error('获取播放器核心偏好失败:', error)
      return null
    }
  }

  /**
   * 保存播放器核心偏好
   * @param videoId 视频标识符（pickCode 或 sha1）
   * @param coreType 播放器核心类型
   */
  async setPreference(
    videoId: string,
    coreType: PlayerCoreType,
  ): Promise<void> {
    try {
      const cacheKey = this.CACHE_PREFIX + videoId
      const preference: PlayerCorePreferenceItem = {
        coreType,
        updatedAt: Date.now(),
      }

      await this.set(cacheKey, preference)
      this.logger.log('setPreference', `播放器核心偏好已保存: ${videoId}，核心: ${coreType}`)
    }
    catch (error) {
      this.logger.error('保存播放器核心偏好失败:', error)
    }
  }

  /**
   * 删除播放器核心偏好
   * @param videoId 视频标识符（pickCode 或 sha1）
   */
  async removePreference(videoId: string): Promise<void> {
    try {
      const cacheKey = this.CACHE_PREFIX + videoId
      await this.remove(cacheKey)
      this.logger.log('removePreference', `播放器核心偏好已删除: ${videoId}`)
    }
    catch (error) {
      this.logger.error('删除播放器核心偏好失败:', error)
    }
  }
}

/** 播放器核心偏好缓存实例 */
export const playerCorePreferenceCache = new PlayerCorePreferenceCache()
