import { describe, expect, it } from 'vitest'
import { BoundedCache } from './cache'

describe('BoundedCache', () => {
  it('keeps entries within the limit, evicting oldest first', () => {
    const cache = new BoundedCache<string>(3)
    cache.set('a', '1')
    cache.set('b', '2')
    cache.set('c', '3')
    cache.set('d', '4')
    expect(cache.size).toBe(3)
    expect(cache.has('a')).toBe(false)
    expect(cache.has('b')).toBe(true)
    expect(cache.has('c')).toBe(true)
    expect(cache.has('d')).toBe(true)
  })

  it('re-inserting a key refreshes its position', () => {
    const cache = new BoundedCache<string>(2)
    cache.set('a', '1')
    cache.set('b', '2')
    cache.set('a', '1b')
    cache.set('c', '3')
    expect(cache.has('b')).toBe(false)
    expect(cache.has('a')).toBe(true)
    expect(cache.has('c')).toBe(true)
  })

  it('supports delete and clear', () => {
    const cache = new BoundedCache<string>(10)
    cache.set('a', '1')
    cache.delete('a')
    expect(cache.has('a')).toBe(false)
    cache.set('x', '1')
    cache.clear()
    expect(cache.size).toBe(0)
  })

  it('works with zero limit', () => {
    const cache = new BoundedCache<string>(0)
    cache.set('a', '1')
    expect(cache.size).toBe(0)
  })
})
