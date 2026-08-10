import { describe, expect, it } from 'vitest'
import { createVodTabRefCounter } from './main-world'

describe('createVodTabRefCounter', () => {
  it('starts inactive', () => {
    const counter = createVodTabRefCounter()
    expect(counter.isActive()).toBe(false)
  })

  it('becomes active after acquire and inactive after all releases', () => {
    const counter = createVodTabRefCounter()
    counter.acquire()
    counter.acquire()
    expect(counter.isActive()).toBe(true)
    expect(counter.release()).toBe(1)
    expect(counter.isActive()).toBe(true)
    expect(counter.release()).toBe(0)
    expect(counter.isActive()).toBe(false)
  })

  it('never goes negative on release', () => {
    const counter = createVodTabRefCounter()
    counter.release()
    counter.release()
    expect(counter.isActive()).toBe(false)
    expect(counter.release()).toBe(0)
  })
})
