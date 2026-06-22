/**
 * 旋转管理器：视频画面旋转、ResizeObserver 绑定、控件渲染
 */
import type Artplayer from 'artplayer'
import { loadVideoRotation, saveVideoRotation } from './history'
import { applyRotationToVideo, buildRotateControlItem, getNextRotationDegrees } from './player-rotation'
import { updateArtplayerControl } from './player-quality'

const ROTATE_CONTROL_NAME = 'm115-rotate-control'

export class RotationManager {
  private art: Artplayer | null = null
  private currentRotation = 0
  private cleanupResize: (() => void) | null = null
  private cleanupContainerObserver: (() => void) | null = null
  private reflowRaf = 0

  constructor(
    private showToast: (msg: string) => void,
    private getPickCode: () => string,
  ) {}

  /** 当前旋转角度 */
  get rotation(): number {
    return this.currentRotation
  }

  /** 加载旋转偏好（可在 artplayer 创建前调用） */
  loadPreference(pickCode: string) {
    this.currentRotation = loadVideoRotation(pickCode)
  }

  /** 绑定 artplayer 实例 + 启动 resize/observer 监听 + 应用旋转 */
  attach(art: Artplayer) {
    this.art = art
    this.bindWindowResize()
    this.bindContainerObserver()
    this.apply()
  }

  /** 视频切换时：重载旋转偏好 + 重绑 observer */
  switchVideo(pickCode: string) {
    this.currentRotation = loadVideoRotation(pickCode)
    this.renderControl()
    this.apply()
  }

  /** 应用旋转到 video 元素 */
  apply() {
    if (!this.art) return
    applyRotationToVideo({
      video: this.art.video,
      container: this.art.video.parentElement as HTMLElement | null,
      rotation: this.currentRotation,
    })
  }

  /** 顺时针旋转 90°，保存偏好，更新 UI */
  rotate() {
    this.currentRotation = getNextRotationDegrees(this.currentRotation)
    saveVideoRotation(this.getPickCode(), this.currentRotation)
    this.apply()
    this.renderControl()
    this.showToast(this.currentRotation === 0 ? '画面旋转已重置' : `画面已旋转 ${this.currentRotation}°`)
  }

  /** 构建旋转控件配置（供 Artplayer controls 使用） */
  buildControl() {
    return buildRotateControlItem({
      controlName: ROTATE_CONTROL_NAME,
      rotation: this.currentRotation,
      onRotate: () => this.rotate(),
    })
  }

  /** 更新 artplayer 中的旋转控件 */
  renderControl() {
    if (!this.art) return
    updateArtplayerControl(this.art, ROTATE_CONTROL_NAME, this.buildControl())
  }

  /** 清理所有监听器 */
  destroy() {
    if (this.cleanupResize) {
      this.cleanupResize()
      this.cleanupResize = null
    }
    if (this.cleanupContainerObserver) {
      this.cleanupContainerObserver()
      this.cleanupContainerObserver = null
    }
    if (this.reflowRaf) {
      window.cancelAnimationFrame(this.reflowRaf)
      this.reflowRaf = 0
    }
    this.art = null
  }

  // ─── 内部方法 ───

  private bindWindowResize() {
    if (this.cleanupResize) return
    const handleResize = () => this.scheduleReflow()
    window.addEventListener('resize', handleResize)
    this.cleanupResize = () => {
      window.removeEventListener('resize', handleResize)
      this.cleanupResize = null
    }
  }

  private bindContainerObserver() {
    if (this.cleanupContainerObserver || !this.art?.video) return
    const container = this.art.video.parentElement as HTMLElement | null
    if (!container || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => {
      this.scheduleReflow()
    })
    observer.observe(container)

    this.cleanupContainerObserver = () => {
      observer.disconnect()
      this.cleanupContainerObserver = null
    }
  }

  private scheduleReflow() {
    if (this.reflowRaf) {
      window.cancelAnimationFrame(this.reflowRaf)
    }

    const run = () => {
      this.apply()
      this.reflowRaf = window.requestAnimationFrame(() => {
        this.apply()
        this.reflowRaf = 0
      })
    }

    this.reflowRaf = window.requestAnimationFrame(run)
  }
}
