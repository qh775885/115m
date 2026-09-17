let messageIdSeq = 0

/**
 * MAIN 世界调用扩展后台特权 API 的桥接方法
 */
export async function callExtensionBridge<T = unknown>(payload: unknown, timeoutMs = 15000): Promise<T | null> {
  const id = ++messageIdSeq
  return new Promise((resolve) => {
    let timer: any = null
    const handler = (event: MessageEvent) => {
      if (
        event.source !== window ||
        !event.data ||
        typeof event.data !== 'object' ||
        event.data.channel !== '115M_BRIDGE_RESP' ||
        event.data.id !== id
      ) {
        return
      }

      window.removeEventListener('message', handler)
      if (timer) clearTimeout(timer)
      if (event.data.error) {
        console.warn('[115m-v2][Bridge] 错误响应:', event.data.error)
        resolve(null)
      }
      else {
        resolve(event.data.result)
      }
    }

    window.addEventListener('message', handler)
    timer = setTimeout(() => {
      window.removeEventListener('message', handler)
      console.warn('[115m-v2][Bridge] 调用超时:', payload)
      resolve(null)
    }, timeoutMs)

    window.postMessage({ channel: '115M_BRIDGE_REQ', id, payload }, '*')
  })
}
