import { describe, expect, it } from 'vitest'
import { createVodTabRefCounter, resolveVodFetchModeSteps } from './main-world'

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

describe('resolveVodFetchModeSteps 模式回退决策', () => {
  it('direct 模式只走 direct', () => {
    expect(resolveVodFetchModeSteps('direct', true)).toEqual(['direct'])
    expect(resolveVodFetchModeSteps('direct', false)).toEqual(['direct'])
  })

  it('main_world 模式只走 main_world', () => {
    expect(resolveVodFetchModeSteps('main_world', false)).toEqual(['main_world'])
  })

  it('page 模式只走 page', () => {
    expect(resolveVodFetchModeSteps('page', false)).toEqual(['page'])
  })

  it('auto 无 body（GET）时 direct → main_world', () => {
    expect(resolveVodFetchModeSteps('auto', true)).toEqual(['direct', 'main_world'])
  })

  it('auto 有 body（POST）时只走 direct', () => {
    expect(resolveVodFetchModeSteps('auto', false)).toEqual(['direct'])
  })
})
