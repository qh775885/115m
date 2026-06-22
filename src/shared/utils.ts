/**
 * 通用工具函数
 */

/** HTML 转义 */
export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

/** 延迟 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** 判断是否为瞬态 frame 错误（扩展页面导航/销毁时常见） */
export function isTransientFrameError(error: unknown): boolean {
  return /Frame with ID \d+ was removed|No frame with id|The tab was closed|Cannot access contents of url/i.test(String(error))
}

/** 从元素上按优先级读取属性 */
export function readAttr(item: Element, names: string[]): string {
  for (const name of names) {
    const value = item.getAttribute(name)
    if (value) return value
  }
  return ''
}

/** 判断文件名是否为图片扩展名 */
export function isImageExtension(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase()
  if (!ext) return false
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'ico', 'svg', 'tif', 'tiff', 'avif', 'heic', 'heif'].includes(ext)
}
