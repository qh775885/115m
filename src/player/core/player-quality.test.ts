import { describe, expect, it, vi } from 'vitest'
import { buildQualityControlItem, updateArtplayerControl } from './player-quality'

describe('player quality helpers', () => {
  it('builds control item and resolves selected option', async () => {
    const onSelect = vi.fn(async () => {})
    const item = buildQualityControlItem({
      controlName: 'quality',
      currentQualityLabel: '1080P',
      currentUrl: 'https://a',
      qualityOptions: [
        { label: '1080P', quality: 1080, url: 'https://a' },
        { label: '720P', quality: 720, url: 'https://b' },
      ],
      onSelect,
    })

    expect(item.name).toBe('quality')
    const result = await item.onSelect({ html: '720P', url: 'https://b' })
    expect(result).toBe('720P')
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('updates existing control when update api exists', () => {
    const update = vi.fn()
    updateArtplayerControl({ controls: { update } }, 'quality', { name: 'quality' })
    expect(update).toHaveBeenCalledTimes(1)
  })

  it('falls back to remove and add', () => {
    const remove = vi.fn()
    const add = vi.fn()
    updateArtplayerControl({ controls: { remove, add } }, 'quality', { name: 'quality' })
    expect(remove).toHaveBeenCalledWith('quality')
    expect(add).toHaveBeenCalledTimes(1)
  })
})
