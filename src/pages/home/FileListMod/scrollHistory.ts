import type { FileMainReInstanceSetting } from '../global'
import { unsafeWindow } from '$'
import { throttle } from 'lodash'

/**
 * 文件列表滚动位置记录
 */
export class FileListScrollHistory {
  /** 滚动容器 */
  protected scrollBox: Element | null = null
  /** 存储实例 */
  protected storage = new FileListScrollHistoryStorage()

  /**
   * 滚动事件处理函数
   */
  private handleScroll = throttle(
    () => {
      const scrollTop = this.scrollBox?.scrollTop ?? 0
      this.save(unsafeWindow.FileMainReInstanceSetting, scrollTop)
    },
    1000 / 60,
    {
      leading: true,
      trailing: true,
    },
  )

  /** 清除所有数据 */
  clearAll() {
    this.storage.clear()
  }

  /** 销毁 */
  destroy() {
    this.clearAll()
    this.scrollBox?.removeEventListener('scroll', this.handleScroll)
  }

  /**
   * 设置滚动容器
   * @param scrollBox 滚动容器
   */
  setScrollBox(scrollBox: Element) {
    if (this.scrollBox) {
      this.scrollBox.removeEventListener('scroll', this.handleScroll)
    }
    this.scrollBox = scrollBox
    this.restore(unsafeWindow.FileMainReInstanceSetting, scrollBox)
    this.scrollBox.addEventListener('scroll', this.handleScroll)
  }

  /**
   * 保存滚动位置
   */
  private save(settings: FileMainReInstanceSetting, position: number) {
    this.storage.set(
      settings.cid.toString(),
      Number(settings.offset),
      Number(settings.limit),
      position,
    )
  }

  /**
   * 恢复滚动位置
   */
  private restore(settings: FileMainReInstanceSetting, scrollBox: Element) {
    /** 先尝试精确匹配 */
    let position = this.storage.get(
      settings.cid.toString(),
      Number(settings.offset),
      Number(settings.limit),
    )

    /** 如果精确匹配失败，尝试使用相同 cid 下的其他 offset 值 */
    if (!position || position <= 0) {
      position = this.storage.getNearestPosition(
        settings.cid.toString(),
        Number(settings.offset),
        Number(settings.limit),
      )
    }

    if (position && position > 0) {
      scrollBox.scrollTo({
        top: position,
        behavior: 'instant',
      })
      return true
    }
    return false
  }
}

/**
 * 文件列表滚动位置记录存储
 */
export class FileListScrollHistoryStorage {
  /** 存储 key */
  private STORAGE_KEY = '115_master_file_list_scroll_history'
  /** 存储实例 */
  private store = window.sessionStorage

  /** 存储数据 */
  get storeData() {
    return JSON.parse(this.store.getItem(this.STORAGE_KEY) ?? '{}')
  }

  /**
   * 设置存储数据
   * @param data 存储数据
   */
  set storeData(data: Record<string, number>) {
    this.store.setItem(this.STORAGE_KEY, JSON.stringify(data))
  }

  /**
   * 获取滚动位置
   * @param cid 目录id
   * @param offset 页偏移量
   * @param limit 页大小
   * @returns 滚动位置
   */
  get(cid: string, offset: number, limit: number) {
    const storeData = this.storeData
    return storeData[this.getDataKey(cid, offset, limit)] ?? 0
  }

  /**
   * 获取最接近的滚动位置（用于移动文件后 offset 可能变化的情况）
   * @param cid 目录id
   * @param currentOffset 当前页偏移量
   * @param limit 页大小
   * @returns 最接近的滚动位置
   */
  getNearestPosition(cid: string, currentOffset: number, limit: number) {
    const storeData = this.storeData
    const prefix = `${cid}-`
    let nearestPosition = 0
    let minDiff = Infinity

    /** 遍历所有存储的位置，找到相同 cid 下的最接近的 offset */
    for (const [key, position] of Object.entries(storeData)) {
      if (key.startsWith(prefix)) {
        /** 解析 key 格式: cid-offset-limit */
        const parts = key.split('-')
        if (parts.length >= 3) {
          const storedOffset = Number.parseInt(parts[1])
          const storedLimit = Number.parseInt(parts[2])

          /** 只匹配相同 limit 的记录 */
          if (storedLimit === limit && typeof position === 'number' && position > 0) {
            const diff = Math.abs(storedOffset - currentOffset)
            /** 找到 offset 差值最小的记录 */
            if (diff < minDiff) {
              minDiff = diff
              nearestPosition = position
            }
          }
        }
      }
    }

    /** 如果找到了接近的位置（差值不超过 2 页），则返回它，这样可以处理移动文件后 offset 变化不大的情况 */
    if (nearestPosition > 0 && minDiff <= limit * 2) {
      return nearestPosition
    }

    return 0
  }

  /**
   * 设置滚动位置
   * @param cid 目录id
   * @param offset 页偏移量
   * @param limit 页大小
   * @param position 滚动位置
   */
  set(cid: string, offset: number, limit: number, position: number) {
    const storeData = this.storeData
    storeData[this.getDataKey(cid, offset, limit)] = position
    this.storeData = storeData
  }

  /** 清除所有数据 */
  clear() {
    this.storeData = {}
  }

  /**
   * 获取数据 key
   * @param cid 目录id
   * @param offset 页偏移量
   * @param limit 页大小
   * @returns 数据 key
   */
  private getDataKey(cid: string, offset: number, limit: number) {
    return `${cid}-${offset}-${limit}`
  }
}
