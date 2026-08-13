import { describe, expect, it } from 'vitest'
import { BoundedCache, ByteBudgetCache } from './cache'

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

describe('ByteBudgetCache', () => {
  it('evicts oldest entries when byte budget is exceeded', () => {
    const cache = new ByteBudgetCache<number>(10, value => value)
    cache.set('a', 3)
    cache.set('b', 4)
    cache.set('c', 4)
    expect(cache.size).toBe(2)
    expect(cache.has('a')).toBe(false)
    expect(cache.has('b')).toBe(true)
    expect(cache.has('c')).toBe(true)
    expect(cache.byteUsage).toBe(8)
  })

  it('re-inserting a key adjusts bytes and refreshes position', () => {
    const cache = new ByteBudgetCache<number>(10, value => value)
    cache.set('a', 5)
    cache.set('b', 4)
    cache.set('a', 1)
    cache.set('c', 6)
    expect(cache.has('b')).toBe(false)
    expect(cache.has('a')).toBe(true)
    expect(cache.has('c')).toBe(true)
    expect(cache.byteUsage).toBe(7)
  })

  it('supports delete and clear and keeps byteUsage accurate', () => {
    const cache = new ByteBudgetCache<number>(100, value => value)
    cache.set('a', 3)
    cache.set('b', 5)
    cache.delete('a')
    expect(cache.byteUsage).toBe(5)
    cache.set('c', 7)
    cache.clear()
    expect(cache.size).toBe(0)
    expect(cache.byteUsage).toBe(0)
  })

  it('evicts an oversized single entry entirely', () => {
    const cache = new ByteBudgetCache<number>(4, value => value)
    cache.set('big', 10)
    expect(cache.size).toBe(0)
    expect(cache.byteUsage).toBe(0)
  })
})
