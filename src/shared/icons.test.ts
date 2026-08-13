// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { Icons } from './icons'

describe('Icons 惰性图标', () => {
  beforeEach(() => {
    document.getElementById('m115-lucide-styles')?.remove()
  })

  it('图标访问返回 SVG 字符串', () => {
    const svg = Icons.Close()
    expect(svg).toContain('<svg')
    expect(svg).toContain('class="m115-lucide-icon"')
  })

  it('访问时惰性注入样式', () => {
    expect(document.getElementById('m115-lucide-styles')).toBeNull()
    Icons.Play()
    expect(document.getElementById('m115-lucide-styles')).not.toBeNull()
  })

  it('样式只注入一次', () => {
    Icons.Play()
    Icons.Pause()
    const styles = document.querySelectorAll('#m115-lucide-styles')
    expect(styles.length).toBe(1)
  })

  it('同图标结果稳定（缓存）', () => {
    const a = Icons.Trash()
    const b = Icons.Trash()
    expect(a).toBe(b)
  })
})
