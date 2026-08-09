import { describe, expect, it } from 'vitest'
import { isAllowedOpenTabUrl } from './tab-allowlist'

describe('isAllowedOpenTabUrl', () => {
  it('accepts 115.com and its subdomains', () => {
    expect(isAllowedOpenTabUrl('https://115.com/web/lixian/master/video/?pick_code=x')).toBe(true)
    expect(isAllowedOpenTabUrl('https://www.115.com/foo')).toBe(true)
    expect(isAllowedOpenTabUrl('https://webapi.115.com/files')).toBe(true)
  })

  it('accepts 115vod.com and its subdomains', () => {
    expect(isAllowedOpenTabUrl('https://115vod.com/?pickcode=x')).toBe(true)
    expect(isAllowedOpenTabUrl('https://v.115vod.com/play')).toBe(true)
  })

  it('rejects non-115 hosts', () => {
    expect(isAllowedOpenTabUrl('https://evil.com/x')).toBe(false)
    expect(isAllowedOpenTabUrl('https://115.com.evil.com/x')).toBe(false)
    expect(isAllowedOpenTabUrl('https://evil115.com/x')).toBe(false)
    expect(isAllowedOpenTabUrl('https://115com.com/x')).toBe(false)
  })

  it('rejects non-https protocols', () => {
    expect(isAllowedOpenTabUrl('http://115.com/x')).toBe(false)
    expect(isAllowedOpenTabUrl('javascript:alert(1)')).toBe(false)
  })

  it('rejects invalid urls', () => {
    expect(isAllowedOpenTabUrl('')).toBe(false)
    expect(isAllowedOpenTabUrl('not a url')).toBe(false)
  })
})
