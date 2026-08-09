// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Logger } from './logger'

describe('Logger 分级行为', () => {
  let spies: Record<string, ReturnType<typeof vi.spyOn>>

  beforeEach(() => {
    spies = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('默认 logger 四级别均输出且带前缀', () => {
    const log = new Logger('Test')
    log.debug('a')
    log.info('b')
    log.warn('c')
    log.error('d')
    expect(spies.debug).toHaveBeenCalledWith('[Test]', 'a')
    expect(spies.info).toHaveBeenCalledWith('[Test]', 'b')
    expect(spies.warn).toHaveBeenCalledWith('[Test]', 'c')
    expect(spies.error).toHaveBeenCalledWith('[Test]', 'd')
  })

  it('enableSilentMode 后 debug/info 静音，warn/error 仍保留', () => {
    const log = new Logger('Test')
    log.enableSilentMode()
    log.debug('a')
    log.info('b')
    log.warn('c')
    log.error('d')
    expect(spies.debug).not.toHaveBeenCalled()
    expect(spies.info).not.toHaveBeenCalled()
    expect(spies.warn).toHaveBeenCalledTimes(1)
    expect(spies.error).toHaveBeenCalledTimes(1)
  })

  it('sub 子 logger 继承 silent 状态', () => {
    const parent = new Logger('Parent')
    parent.enableSilentMode()
    const child = parent.sub('Child')
    child.debug('a')
    child.warn('b')
    expect(spies.debug).not.toHaveBeenCalled()
    expect(spies.warn).toHaveBeenCalledWith('[Parent:Child]', 'b')
  })

  it('sub 子 logger 默认跟随非 silent 父级', () => {
    const child = new Logger('Parent').sub('Child')
    child.debug('a')
    expect(spies.debug).toHaveBeenCalledWith('[Parent:Child]', 'a')
  })
})
