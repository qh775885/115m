import type { FileInfo } from './types'
import { isRuntimeContextInvalidatedResult, sendRuntimeMessageSafe } from './runtime'
import { fetchBestDownloadResult } from '../../lib/pro-api'

const sendRuntimeMessageForDownload = async <T = unknown>(message: unknown): Promise<T | null> => {
  const response = await sendRuntimeMessageSafe<T>(message)
  if (isRuntimeContextInvalidatedResult(response)) return null
  return response
}

interface BoundDownloadIntercept {
  pickCode: string
  handler: EventListener
}

const boundDownloadNodes = new WeakMap<HTMLElement, BoundDownloadIntercept>()

/**
 * 拦截列表中原生下载按钮，替换为扩展下载（可被 IDM/aria2 等下载器自动接管）
 */
export function addDownloadIntercept(item: HTMLElement, file: FileInfo) {
  const downloadNode = item.querySelector('.file-opr a[menu="download_one"]') as HTMLElement | null
  if (!downloadNode) return

  const existing = boundDownloadNodes.get(downloadNode)
  // 幂等保护：115 复用 li / 扫描去重集合清空后会对同一按钮重复调用，
  // 不拦截会造成监听叠加（单击多次解析直链、多次开窗、旧 pickCode 错误下载）
  if (existing && existing.pickCode === file.pickCode) return
  if (existing) {
    downloadNode.removeEventListener('click', existing.handler, true)
  }

  const handler: EventListener = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()

    try {
      downloadNode.style.opacity = '0.5'

      const res = await fetchBestDownloadResult(sendRuntimeMessageForDownload, file.pickCode)

      if (res.url?.url) {
        // 前台打开直链，IDM/aria2 等下载器可正常拦截
        window.open(res.url.url, '_blank')
      } else {
        throw new Error('未获取到真实下载地址')
      }
    } catch (error) {
      console.error('[115m] 解析下载直链失败:', error)
      alert('解析下载直链失败: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      downloadNode.style.opacity = '1'
    }
  }

  downloadNode.addEventListener('click', handler, true)
  boundDownloadNodes.set(downloadNode, { pickCode: file.pickCode, handler })
}
