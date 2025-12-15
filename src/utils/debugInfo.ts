import { GM_info } from '$'
import { Logger } from './logger'

/**
 * 调试信息
 */
export class DebugInfo {
  Logger: Logger

  constructor() {
    this.Logger = new Logger('115Master', 'DebugInfo')
  }

  bootstrapInfo() {
    this.Logger.log('bootstrap-info', `${GM_info.script.name} 已启动`)
  }
}

export const debugInfo = new DebugInfo()
