/**
 * 播放模式常量定义
 */

/** 播放模式枚举 */
export enum PlayMode {
  /** 停止播放 */
  STOP = 'stop',
  /** 单集循环 */
  REPEAT_ONE = 'repeat_one',
  /** 自动下一集 */
  AUTO_NEXT = 'auto_next',
}

/** 播放模式显示名称映射 */
export const PLAY_MODE_NAMES = {
  [PlayMode.STOP]: '播放完停止',
  [PlayMode.REPEAT_ONE]: '单集循环',
  [PlayMode.AUTO_NEXT]: '自动下一集',
} as const

/** 播放模式图标映射 */
export const PLAY_MODE_ICONS = {
  [PlayMode.STOP]: 'material-symbols:pause-rounded',
  [PlayMode.REPEAT_ONE]: 'material-symbols:restart-alt-rounded',
  [PlayMode.AUTO_NEXT]: 'material-symbols:fast-forward-rounded',
} as const

/** 播放模式描述 */
export const PLAY_MODE_DESCRIPTIONS = {
  [PlayMode.STOP]: '播放完成后暂停',
  [PlayMode.REPEAT_ONE]: '播放完成后重新播放当前视频',
  [PlayMode.AUTO_NEXT]: '播放完成后自动播放下一集',
} as const
