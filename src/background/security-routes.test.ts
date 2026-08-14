import { afterEach, describe, expect, it, vi } from 'vitest'

// index.ts 是 background 入口，import 时会注册 runtime 监听，需先在模块加载前 stub chrome
vi.hoisted(() => {
  const noop = () => {}
  const chromeMock = {
    runtime: {
      id: 'test-extension-id',
      onMessage: { addListener: noop },
    },
    storage: { local: { get: async () => ({}), set: async () => {}, remove: async () => {} } },
    tabs: { create: async () => ({}), query: async () => [], get: async () => ({}) },
    webNavigation: { getAllFrames: async () => [] },
    cookies: { set: async () => ({}), get: async () => ({}), remove: async () => {} },
    scripting: { executeScript: async () => [] },
  }
  ;(globalThis as { chrome: unknown }).chrome = chromeMock
})

import { assertAllowedMainWorldUrl, isTrustedSender, normalizeCookieDomain } from './index'

function makeSender(url?: string): chrome.runtime.MessageSender {
  return { url } as chrome.runtime.MessageSender
}

describe('isTrustedSender', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('accepts 115.com hosts and subdomains', () => {
    expect(isTrustedSender(makeSender('https://115.com/files'))).toBe(true)
    expect(isTrustedSender(makeSender('https://webapi.115.com/files'))).toBe(true)
    expect(isTrustedSender(makeSender('https://a.b.115.com/x'))).toBe(true)
  })

  it('accepts 115vod.com and localhost dev', () => {
    expect(isTrustedSender(makeSender('https://115vod.com/?pickcode=x'))).toBe(true)
    expect(isTrustedSender(makeSender('http://localhost:3000/ws'))).toBe(true)
  })

  it('rejects empty / non-115 hosts / spoofed hosts', () => {
    expect(isTrustedSender(undefined)).toBe(false)
    expect(isTrustedSender(makeSender(''))).toBe(false)
    expect(isTrustedSender(makeSender('https://evil.com/x'))).toBe(false)
    expect(isTrustedSender(makeSender('https://115.com.evil.com/x'))).toBe(false)
    expect(isTrustedSender(makeSender('https://evil115.com/x'))).toBe(false)
    expect(isTrustedSender(makeSender('not a url'))).toBe(false)
  })

  it('accepts extension self url', () => {
    expect(isTrustedSender(makeSender('chrome-extension://test-extension-id/background.js'))).toBe(true)
  })
})

describe('assertAllowedMainWorldUrl', () => {
  it('accepts allowed https paths', () => {
    expect(() => assertAllowedMainWorldUrl('https://webapi.115.com/files')).not.toThrow()
    expect(() => assertAllowedMainWorldUrl('https://webapi.115.com/files/add')).not.toThrow()
    expect(() => assertAllowedMainWorldUrl('https://proapi.115.com/app/chrome/downurl')).not.toThrow()
  })

  it('rejects non-https', () => {
    expect(() => assertAllowedMainWorldUrl('http://webapi.115.com/files')).toThrow(/https/)
  })

  it('rejects hosts outside allowlist', () => {
    expect(() => assertAllowedMainWorldUrl('https://evil.com/files')).toThrow(/not allowed/)
    expect(() => assertAllowedMainWorldUrl('https://webapi.115.com/other')).toThrow(/not allowed/)
  })

  it('rejects invalid url', () => {
    expect(() => assertAllowedMainWorldUrl('not a url')).toThrow()
  })
})

describe('normalizeCookieDomain', () => {
  it('accepts and normalizes 115CDN domains', () => {
    expect(normalizeCookieDomain('.115cdn.net')).toBe('.115cdn.net')
    expect(normalizeCookieDomain(' DL.115CDN.net ')).toBe('dl.115cdn.net')
  })

  it('rejects other domains', () => {
    expect(() => normalizeCookieDomain('115.com')).toThrow(/not allowed/)
    expect(() => normalizeCookieDomain('evil.com')).toThrow(/not allowed/)
  })
})
