export const promiseDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * 带超时的 fetch：超时后通过 AbortController 中断请求。
 * 避免弱网/服务端不响应时 fetch 永久挂起，阻塞整个封面抽帧链路。
 *
 * 超时覆盖「响应头 + body 读取」两个阶段：服务端发头后挂起 body 时，
 * 超时仍会触发 abort，令 text()/arrayBuffer()/json() 读取立即失败，
 * 而不是永久卡在读 body 的 await 上。
 */
export async function fetchWithTimeout(url: string, init: RequestInit | undefined, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const clearTimer = () => clearTimeout(timer)
  try {
    const response = await fetch(url, { ...init, signal: controller.signal })
    const guardBodyRead = <T>(bodyRead: Promise<T>): Promise<T> => bodyRead.finally(clearTimer)
    if (typeof response.text === 'function') {
      const originalText = response.text.bind(response)
      response.text = () => guardBodyRead(originalText())
    }
    if (typeof response.arrayBuffer === 'function') {
      const originalArrayBuffer = response.arrayBuffer.bind(response)
      response.arrayBuffer = () => guardBodyRead(originalArrayBuffer())
    }
    if (typeof response.json === 'function') {
      const originalJson = response.json.bind(response)
      response.json = () => guardBodyRead(originalJson())
    }
    return response
  }
  catch (error) {
    clearTimer()
    throw error
  }
}
