// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { buildFolderItem } from './media-wall-folders'

function makeFolderItem(attrs: Record<string, string>, children: HTMLElement[] = []): HTMLElement {
  const li = document.createElement('li')
  Object.entries(attrs).forEach(([k, v]) => li.setAttribute(k, v))
  children.forEach(child => li.appendChild(child))
  return li
}

describe('buildFolderItem 文件夹解析', () => {
  it('识别文件夹并解析标题/封面', () => {
    const item = makeFolderItem({ file_type: '0', title: '我的视频', img_url: 'https://x/c.jpg' })
    const folder = buildFolderItem(item)
    expect(folder).not.toBeNull()
    expect(folder!.title).toBe('我的视频')
    expect(folder!.coverUrl).toBe('https://x/c.jpg')
  })

  it('非文件夹返回 null', () => {
    const item = makeFolderItem({ file_type: '1', title: 'a.jpg', img_url: 'https://x/a.jpg' })
    expect(buildFolderItem(item)).toBeNull()
  })

  it('无封面返回 null', () => {
    const item = makeFolderItem({ file_type: '0', title: '无封面文件夹' })
    expect(buildFolderItem(item)).toBeNull()
  })

  it('无标题时用默认名', () => {
    const item = makeFolderItem({ file_type: '0', img_url: 'https://x/c.jpg' })
    const folder = buildFolderItem(item)
    expect(folder).not.toBeNull()
    expect(folder!.title).toBe('文件夹')
  })

  it('星标状态解析', () => {
    const star = document.createElement('i')
    star.className = 'icon-star'
    star.setAttribute('is_star', '1')
    const item = makeFolderItem({ file_type: '0', title: '收藏', img_url: 'https://x/c.jpg' }, [star])
    const folder = buildFolderItem(item)
    expect(folder!.isStarred).toBe(true)
  })
})
