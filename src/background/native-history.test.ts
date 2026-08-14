import { describe, expect, it } from 'vitest'
import { parseNativeRecord } from './native-history'

describe('parseNativeRecord 多形状解析', () => {
  it('解析完整记录', () => {
    expect(parseNativeRecord({ pick_code: 'pc1', time: 123, watch_end: true }, 'pc1')).toEqual({
      pickCode: 'pc1',
      currentTime: 123,
      watchEnd: true,
    })
  })

  it('time 支持字符串', () => {
    expect(parseNativeRecord({ time: '45.5' }, 'pc1')?.currentTime).toBe(45.5)
  })

  it('watch_end 支持数字/字符串/缺省', () => {
    expect(parseNativeRecord({ watch_end: 1 }, 'pc1')?.watchEnd).toBe(true)
    expect(parseNativeRecord({ watch_end: '1' }, 'pc1')?.watchEnd).toBe(true)
    expect(parseNativeRecord({ watch_end: 0 }, 'pc1')?.watchEnd).toBe(false)
    expect(parseNativeRecord({}, 'pc1')?.watchEnd).toBe(false)
  })

  it('pick_code 缺失时回退 fallbackPickCode', () => {
    expect(parseNativeRecord({ time: 5 }, 'fallback')?.pickCode).toBe('fallback')
  })

  it('undefined 输入返回 null', () => {
    expect(parseNativeRecord(undefined, 'pc1')).toBeNull()
  })

  it('非法 time 返回 null', () => {
    expect(parseNativeRecord({ time: 'abc' }, 'pc1')).toBeNull()
  })
})
