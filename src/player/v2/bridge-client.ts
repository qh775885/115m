let messageIdSeq = 0

/**
 * MAIN 世界调用扩展后台特权 API 的桥接方法
 */
export async function callExtensionBridge<T = unknown>(payload: unknown, timeoutMs = 15000): Promise<T | null> {
  const id = ++messageIdSeq
  console.log(`[115m-v2][Bridge-Client] 发送请求 #${id}:`, payload)

  return new Promise((resolve) => {
    let timer: any = null
    const handler = (event: MessageEvent) => {
      // 跨世界通信中 event.source 引用可能不同，仅校验通道标识与匹配 ID
      if (
        !event.data ||
        typeof event.data !== 'object' ||
        event.data.channel !== '115M_BRIDGE_RESP' ||
        event.data.id !== id
      ) {
        return
      }

      window.removeEventListener('message', handler)
      if (timer) clearTimeout(timer)

      console.log(`[115m-v2][Bridge-Client] 收到响应 #${id}:`, event.data)
      if (event.data.error) {
        console.warn(`[115m-v2][Bridge-Client] 响应报错 #${id}:`, event.data.error)
        resolve(null)
      }
      else {
        resolve(event.data.result)
      }
    }

    window.addEventListener('message', handler)
    timer = setTimeout(() => {
      window.removeEventListener('message', handler)
      console.warn(`[115m-v2][Bridge-Client] 请求超时 #${id}:`, payload)
      resolve(null)
    }, timeoutMs)

    window.postMessage({ channel: '115M_BRIDGE_REQ', id, payload }, '*')
  })
}
