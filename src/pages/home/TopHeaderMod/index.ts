import type { TopRootSearchParams } from '../global'
import { unsafeWindow } from '$'
import { getUrlParams } from '../../../utils/url'
import { userSettings } from '../../../utils/userSettings'
import { BaseMod } from '../BaseMod'
import { openOfflineTask } from './openOfflineTask'
import './index.css'
import 'iconify-icon'

/**
 * 顶部导航栏修改器
 * @description
 * 1. 添加自定义的云下载一级按钮
 * 2. 删除官方的云下载按钮
 * 3. 云下载按钮免除刷新重定向
 * 4. 添加预览切换开关
 * 5. 替换新建按钮为直接新建文件夹功能
 */
export class TopHeaderMod extends BaseMod {
  constructor() {
    super()
    this.init()
  }

  /** 顶部导航栏节点 */
  get topHeaderNode() {
    return document.querySelector(unsafeWindow.Main.CONFIG.TopPanelBox)
      ?.firstElementChild as HTMLElement
  }

  /** 销毁 */
  destroy() {}

  /** 初始化 */
  private init() {
    if (!this.topHeaderNode)
      return
    const params = getUrlParams<TopRootSearchParams>(
      top?.window.location.search ?? '',
    )
    if (params.mode === 'search') {
      return
    }
    this.deleteOfficialDownloadButton()
    this.deleteOriginalCreateNewButton()
    this.addMasterOfflineTaskButton()
    this.addPreviewSwitchButton()
    this.replaceUploadButtonWithCreateFolder()
    this.fixContextMenuPosition('upload_btn_add_dir')
    this.fixContextMenuPosition('create_new_add_dir')
  }

  /** 删除官方的离线任务按钮 */
  private deleteOfficialDownloadButton() {
    const downloadButton = this.topHeaderNode?.querySelector(
      '.button[menu=\'offline_task\']',
    )
    if (downloadButton) {
      downloadButton.remove()
    }
  }

  /** 删除原来的新建按钮 */
  private deleteOriginalCreateNewButton() {
    const createNewButton = this.topHeaderNode?.querySelector(
      '.button[data-dropdown-tab="create_new_add_dir"]',
    )
    if (createNewButton) {
      createNewButton.remove()
    }

    /** 同时删除对应的下拉菜单 */
    const dropdownContent = document.querySelector(
      '[data-dropdown-content="create_new_add_dir"]',
    )
    if (dropdownContent) {
      dropdownContent.remove()
    }
  }

  /** 添加 Master 离线任务按钮 */
  private addMasterOfflineTaskButton() {
    const button = this.createMasterOfflineTaskButton()
    this.topHeaderNode?.prepend(button)
  }

  /** 创建 Master 离线任务按钮 */
  private createMasterOfflineTaskButton() {
    const button = document.createElement('a')
    button.classList.add('button', 'master-offline-task-btn')
    button.href = 'javascript:void(0)'

    // 使用带颜色的云朵符号，确保显示
    button.innerHTML = `<span style="margin-right: 4px;">☁️</span><span>云下载</span>`

    // 设置按钮样式，但保持更多原有样式
    button.style.background = 'white'
    button.style.borderColor = '#ddd'
    button.style.borderRadius = '3px'
    button.style.height = '32px'
    button.style.padding = '4px 8px'
    button.style.boxSizing = 'border-box'
    button.style.display = 'inline-flex'
    button.style.alignItems = 'center'

    // 设置文字颜色
    button.style.color = '#333'

    button.onclick = () => {
      openOfflineTask()
    }
    return button
  }

  /** 添加预览切换开关 */
  private addPreviewSwitchButton() {
    const button = this.createPreviewSwitchButton()
    this.topHeaderNode?.append(button)
  }

  /** 创建预览切换开关 */
  private createPreviewSwitchButton() {
    const value = userSettings.value.enableFilelistPreview
    const button = document.createElement('a')
    button.classList.add('button', 'btn-line', 'master-preview-switch-btn')
    if (value) {
      button.classList.add('active')
    }
    button.setAttribute('title', '开启文件预览')
    button.href = 'javascript:void(0)'
    button.innerHTML = `
      <iconify-icon class="preview-off" icon="material-symbols:preview-off" noobserver></iconify-icon>
      <iconify-icon class="preview-on" icon="material-symbols:preview" noobserver></iconify-icon>
    `
    button.onclick = () => {
      userSettings.value.enableFilelistPreview
        = !userSettings.value.enableFilelistPreview
      button.classList.toggle('active')
    }
    return button
  }

  /** 替换上传按钮为新建文件夹功能 */
  private replaceUploadButtonWithCreateFolder() {
    const uploadButton = this.topHeaderNode?.querySelector<HTMLElement>(
      '[data-dropdown-tab="upload_btn_add_dir"]',
    )

    if (!uploadButton) {
      return
    }

    // 移除所有上传相关的属性和类
    uploadButton.removeAttribute('data-dropdown-tab')
    uploadButton.removeAttribute('menu')
    uploadButton.removeAttribute('hide_status')

    // 移除可能导致样式问题的类
    uploadButton.classList.remove('btn-line')

    // 确保按钮有正确的基础类
    if (!uploadButton.classList.contains('button')) {
      uploadButton.classList.add('button')
    }

    /** 使用Unicode文件夹符号，确保显示 */
    const newButtonHTML = `
      <span style="margin-right: 4px;">📂</span>
      <span>新建文件夹</span>
    `

    // 重新设置按钮内容
    uploadButton.innerHTML = newButtonHTML

    // 设置按钮样式，与筛选按钮大小保持一致
    uploadButton.style.cssText = `
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      text-decoration: none;
      vertical-align: middle;
      background-color: white;
      border: 1px solid #ddd;
      border-radius: 3px;
      font-family: inherit;
      cursor: pointer;
      height: 32px;
      line-height: 1;
      box-sizing: border-box;
      color: #333;
    `

    /** 添加新的点击事件 */
    uploadButton.onclick = (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.createNewFolder()
    }

    // 更新提示文本
    uploadButton.setAttribute('title', '新建文件夹')
    uploadButton.setAttribute('href', 'javascript:void(0)')

    /** 隐藏对应的下拉菜单 */
    const dropdownContent = document.querySelector<HTMLElement>(
      '[data-dropdown-content="upload_btn_add_dir"]',
    )
    if (dropdownContent) {
      dropdownContent.style.display = 'none'
    }
  }

  /** 创建新文件夹 */
  private createNewFolder() {
    try {
      /** 方法1: 查找下拉菜单中的新建文件夹选项 */
      const addDirMenuItem = document.querySelector<HTMLElement>(
        '[data-dropdown-content="create_new_add_dir"] a[menu="add_dir"]',
      )

      if (addDirMenuItem) {
        addDirMenuItem.click()
        return
      }

      /** 方法2: 尝试查找任何新建文件夹菜单项 */
      const anyAddDirMenuItem = document.querySelector<HTMLElement>('a[menu="add_dir"]')
      if (anyAddDirMenuItem) {
        anyAddDirMenuItem.click()
        return
      }

      // 方法3: 使用115的内置API
      if ((unsafeWindow as any).Core && typeof (unsafeWindow as any).Core.add_dir === 'function') {
        (unsafeWindow as any).Core.add_dir()
        return
      }

      /** 方法4: 尝试触发原始按钮的下拉菜单，然后点击文件夹选项 */
      const originalButton = document.querySelector<HTMLElement>(
        '.button[data-dropdown-tab="create_new_add_dir"]',
      )
      if (originalButton) {
        /** 临时显示下拉菜单 */
        const dropdownContent = document.querySelector<HTMLElement>(
          '[data-dropdown-content="create_new_add_dir"]',
        )
        if (dropdownContent) {
          dropdownContent.style.display = 'block'
          const folderOption = dropdownContent.querySelector<HTMLElement>('a[menu="add_dir"]')
          if (folderOption) {
            folderOption.click()
            dropdownContent.style.display = 'none'
            return
          }
          dropdownContent.style.display = 'none'
        }
      }

      // 如果所有方法都失败，显示提示
      alert('无法找到新建文件夹功能，请刷新页面后重试')
    }
    catch (error) {
      console.error('创建文件夹失败:', error)
      alert('新建文件夹功能暂时不可用')
    }
  }

  /** 修正右键菜单位置 */
  private fixContextMenuPosition(name: string) {
    const tabNode = document.querySelector<HTMLElement>(
      `[data-dropdown-tab="${name}"]`,
    )
    const contextMenuNode = document.querySelector<HTMLElement>(
      `[data-dropdown-content="${name}"]`,
    )
    if (!tabNode || !contextMenuNode)
      return
    const tabRect = tabNode.getBoundingClientRect()
    contextMenuNode.style.left = `${tabRect.left}px`
  }
}
