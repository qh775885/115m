/**
 * 查看器删除操作胶囊组件 (Delete Action)
 * 单一职责：右下角黑曜石晶体微胶囊、悬停浮现、115 后台删除联动与反馈
 */

import { Icons } from '../../../shared/icons'
import type { ViewerStore } from '../state/viewer-store'
import { showToast } from '../../../shared/ui/toast'
import { isRuntimeContextInvalidatedResult } from '../../core/runtime'

export function mountDeleteAction(
  doc: Document,
  store: ViewerStore,
  sendRuntimeMessageSafe: typeof import('../../core/runtime').sendRuntimeMessageSafe,
): HTMLElement {
  const deleteBtn = doc.createElement('button')
  deleteBtn.type = 'button'
  deleteBtn.className = 'm115-viewer-frame-delete m115-v2-delete-capsule delete'
  deleteBtn.title = '删除当前图片'
  deleteBtn.setAttribute('aria-label', '删除当前图片')
  deleteBtn.innerHTML = `${Icons.Trash()} <span>删除</span>`

  const handleDelete = async () => {
    const current = store.getCurrentItem()
    if (!current?.fileId) return
    try {
      const response = await sendRuntimeMessageSafe<{ ok?: boolean, error?: string }>({
        type: 'DELETE_FILE',
        data: {
          fileId: current.fileId,
          parentId: current.parentId,
          pickCode: current.pickCode,
        },
      })
      if (isRuntimeContextInvalidatedResult(response)) throw new Error('扩展已更新，请刷新页面后继续使用')
      if (!response?.ok) throw new Error(response?.error || '删除失败')

      current.sourceItem?.remove()
      showToast(doc, '已删除', { className: 'm115-viewer-toast', duration: 1600 })

      store.removeItem(current.fileId)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '删除失败'
      showToast(doc, msg, { className: 'm115-viewer-toast', duration: 1600 })
    }
  }

  deleteBtn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    handleDelete()
  })

  store.subscribe((state) => {
    if (!state.isOpen) return
    deleteBtn.classList.toggle('thumbs-collapsed', state.isFilmstripCollapsed)
  })

  return deleteBtn
}
