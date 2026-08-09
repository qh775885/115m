import type { FileInfo } from './types'
import { VOD_URL } from '../../lib/constants'

/**
 * 在文件列表项的操作区域注入「115播放」按钮
 */
export function injectActionButtons(item: HTMLElement, file: FileInfo) {
  const oprNode = item.querySelector('.file-opr') as HTMLElement | null
  if (!oprNode) return
  if (oprNode.querySelector('.m115-vod-btn')) return

  const btn = document.createElement('a')
  btn.href = 'javascript:void(0)'
  btn.className = 'm115-vod-btn'
  btn.title = '使用 115 原生播放器播放'

  const span = document.createElement('span')
  span.textContent = '115播放'
  btn.appendChild(span)

  btn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
    const vodUrl = `${VOD_URL}/?pickcode=${file.pickCode}&share_id=0`
    window.open(vodUrl, '_blank')
  })

  btn.addEventListener('mousedown', (e) => {
    e.stopPropagation()
  })

  // 插入到操作栏最前面
  oprNode.insertBefore(btn, oprNode.firstChild)
}
