export const promiseDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * 带超时的 fetch：超时后通过 AbortController 中断请求。
 * 避免弱网/服务端不响应时 fetch 永久挂起，阻塞整个封面抽帧链路。
 */
export async function fetchWithTimeout(url: string, init: RequestInit | undefined, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  }
  finally {
    clearTimeout(timer)
  }
}
