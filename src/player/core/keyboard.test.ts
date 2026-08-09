// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import type Artplayer from 'artplayer'
import { bindKeyboardShortcuts } from './keyboard'

function createArtMock() {
  return {
    toggle: vi.fn(),
    seek: 0,
    currentTime: 100,
    volume: 0.5,
    emit: vi.fn(),
    fullscreen: false,
  } as unknown as Artplayer
}

function fireKey(target: HTMLElement | Document, code: string) {
  target.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }))
}

describe('bindKeyboardShortcuts', () => {
  it('toggles playback on Space', () => {
    const art = createArtMock()
    bindKeyboardShortcuts(art)
    fireKey(document, 'Space')
    expect(art.toggle).toHaveBeenCalledTimes(1)
  })

  it('seeks on arrow keys', () => {
    const art = createArtMock()
    bindKeyboardShortcuts(art)
    fireKey(document, 'ArrowLeft')
    expect(art.seek).toBe(95)
    fireKey(document, 'ArrowRight')
    expect(art.seek).toBe(105)
  })

  it('adjusts volume and emits change on arrow up/down', () => {
    const art = createArtMock()
    bindKeyboardShortcuts(art)
    fireKey(document, 'ArrowUp')
    expect(art.volume).toBe(0.6)
    expect(art.emit).toHaveBeenCalledWith('video:volumechange')
    fireKey(document, 'ArrowDown')
    expect(art.volume).toBe(0.5)
  })

  it('does not hijack keys while typing in an input', () => {
    const art = createArtMock()
    bindKeyboardShortcuts(art)
    const input = document.createElement('input')
    document.body.appendChild(input)
    fireKey(input, 'Space')
    fireKey(input, 'ArrowLeft')
    fireKey(input, 'ArrowRight')
    expect(art.toggle).not.toHaveBeenCalled()
    expect(art.seek).toBe(0)
    input.remove()
  })

  it('does not hijack keys in contenteditable elements', () => {
    const art = createArtMock()
    bindKeyboardShortcuts(art)
    const editable = document.createElement('div')
    editable.setAttribute('contenteditable', 'true')
    document.body.appendChild(editable)
    fireKey(editable, 'Space')
    expect(art.toggle).not.toHaveBeenCalled()
    editable.remove()
  })

  it('returns an unsubscribe function', () => {
    const art = createArtMock()
    const unsubscribe = bindKeyboardShortcuts(art)
    unsubscribe()
    fireKey(document, 'Space')
    expect(art.toggle).not.toHaveBeenCalled()
  })
})
