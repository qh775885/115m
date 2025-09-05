import { ModManager } from './BaseMod'
import FileListMod from './FileListMod'
import { TopFilePathMod } from './TopFilePathMod'
import './index.css'

/**
 * 首页页面类
 */
class HomePage {
  /** 修改器管理器 */
  private modManager: ModManager | undefined = undefined

  /**
   * 构造函数
   */
  constructor() {
    this.init()
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.modManager?.destroy()
  }

  /**
   * 初始化
   */
  private async init(): Promise<void> {
    this.modManager = new ModManager([
      new FileListMod(),
      new TopFilePathMod(),
    ])
  }
}

export default HomePage
