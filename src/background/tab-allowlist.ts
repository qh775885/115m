export const OPEN_TAB_ALLOWED_HOSTS = ['115.com', '115vod.com']

export function isAllowedOpenTabUrl(rawUrl: string) {
  let url: URL
  try {
    url = new URL(rawUrl)
  }
  catch {
    return false
  }
  if (url.protocol !== 'https:') return false
  return OPEN_TAB_ALLOWED_HOSTS.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))
}

export function assertAllowedOpenTabUrl(rawUrl: string) {
  if (!isAllowedOpenTabUrl(rawUrl)) throw new Error('Open tab URL is not allowed')
}
