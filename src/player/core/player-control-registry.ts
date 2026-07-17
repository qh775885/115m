/**
 * 控件注册中心
 *
 * 每个控件只描述自己的能力（图标、标签、构建方法），
 * 由布局配置决定它出现在控制栏上还是设置菜单里。
 *
 * 后续调整控件位置：只需修改 ControlLayout 的 exposed / settings 数组。
 */

/** 控件类型：有子菜单的选择器 或 直接执行动作的按钮 */
export type ControlKind = 'selector' | 'action'

/** 统一的控件描述接口 */
export interface ControlDescriptor {
  /** 唯一标识 */
  id: string
  /** 显示标签（用于设置菜单中的文字、Tooltip） */
  label: string
  /** 控件图标 SVG 字符串 */
  icon: string
  /** 控件类型 */
  kind: ControlKind
  /**
   * 构建 Artplayer control 配置对象。
   * 仅在 exposed 模式下调用，返回值直接传给 Artplayer controls 数组。
   */
  buildControl: () => any
  /**
   * 构建设置菜单中的选项列表 HTML。
   * 仅在 settings 模式下调用。
   * 对于 kind='selector'，返回子菜单内容。
   * 对于 kind='action'，返回 null（由设置菜单直接执行 onAction）。
   */
  buildSettingsContent?: () => HTMLElement | null
  /**
   * 直接执行动作（kind='action' 时使用，如全屏、旋转）
   */
  onAction?: () => void
  /**
   * 控件排序权重（越小越靠左），用于 exposed 模式下的排序
   */
  order: number
  /**
   * 控件是否可见（动态判断，如音轨只有多轨时才显示）
   */
  visible?: () => boolean
}

/** 布局配置：决定哪些控件露出、哪些收进设置菜单 */
export interface ControlLayout {
  /** 直接显示在控制栏上的控件 ID 列表（按显示顺序排列） */
  exposed: string[]
  /** 收进设置菜单的控件 ID 列表（按菜单顺序排列） */
  settings: string[]
}

/**
 * 控件注册中心
 */
export class ControlRegistry {
  private descriptors = new Map<string, ControlDescriptor>()
  private _layout: ControlLayout = { exposed: [], settings: [] }

  /** 注册一个控件 */
  register(descriptor: ControlDescriptor) {
    this.descriptors.set(descriptor.id, descriptor)
  }

  /** 批量注册 */
  registerAll(descriptors: ControlDescriptor[]) {
    for (const d of descriptors) {
      this.register(d)
    }
  }

  /** 设置布局配置 */
  setLayout(layout: ControlLayout) {
    this._layout = layout
  }

  /** 获取当前布局配置 */
  getLayout(): ControlLayout {
    return this._layout
  }

  /** 获取某个控件的描述 */
  get(id: string): ControlDescriptor | undefined {
    return this.descriptors.get(id)
  }

  /** 获取所有需要露出到控制栏的控件描述（按 exposed 顺序） */
  getExposedDescriptors(): ControlDescriptor[] {
    return this._layout.exposed
      .map(id => this.descriptors.get(id))
      .filter((d): d is ControlDescriptor => !!d)
  }

  /** 获取所有需要放入设置菜单的控件描述（按 settings 顺序） */
  getSettingsDescriptors(): ControlDescriptor[] {
    return this._layout.settings
      .map(id => this.descriptors.get(id))
      .filter((d): d is ControlDescriptor => !!d)
  }

  /**
   * 构建所有露出控件的 Artplayer control 配置数组。
   * 直接传给 Artplayer 的 controls 选项。
   */
  buildExposedControls(): any[] {
    return this.getExposedDescriptors()
      .filter(d => !d.visible || d.visible())
      .map(d => d.buildControl())
  }

  /**
   * 将控件从 exposed 移到 settings（或反向）。
   * 返回新的 layout 副本。
   */
  moveToSettings(id: string): ControlLayout {
    const layout = { ...this._layout }
    layout.exposed = layout.exposed.filter(i => i !== id)
    if (!layout.settings.includes(id)) {
      layout.settings.push(id)
    }
    this._layout = layout
    return layout
  }

  moveToExposed(id: string): ControlLayout {
    const layout = { ...this._layout }
    layout.settings = layout.settings.filter(i => i !== id)
    if (!layout.exposed.includes(id)) {
      layout.exposed.push(id)
    }
    this._layout = layout
    return layout
  }
}
