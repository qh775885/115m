// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getContextMenuAnchor,
  getFileItems,
  getFileListContainer,
  getFileType,
  getFolderCoverUrl,
  getFolderId,
  getHasDesc,
  getImageIv,
  getImageThumbUrl,
  getItemCheckboxes,
  getItemTitle,
  getOpenAnchor,
  getRemarkAction,
  getSelectionTarget,
  getStarAction,
  getStarStateKey,
  isItemStarred,
  isRemarkVisible,
} from './native-dom'

function createItem(html: string): HTMLElement {
  const host = document.createElement('div')
  host.innerHTML = html
  return host.firstElementChild as HTMLElement
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getFileListContainer / getFileItems', () => {
  it('locates the native list container', () => {
    const doc = document.implementation.createHTMLDocument()
    const list = doc.createElement('div')
    list.className = 'list-contents'
    doc.body.appendChild(list)
    expect(getFileListContainer(doc)).toBe(list)
  })

  it('returns all native file items as array', () => {
    const list = document.createElement('div')
    list.innerHTML = '<li rel="item"></li><li rel="item"></li><div></div>'
    const items = getFileItems(list)
    expect(items).toHaveLength(2)
    expect(items.every(item => item.tagName === 'LI')).toBe(true)
  })
})

describe('getFileType / getFolderId / getItemTitle', () => {
  it('reads file_type attribute', () => {
    expect(getFileType(createItem('<li file_type="0"></li>'))).toBe('0')
    expect(getFileType(createItem('<li></li>'))).toBe('')
  })

  it('reads folder id from cate_id', () => {
    expect(getFolderId(createItem('<li cate_id="abc"></li>'))).toBe('abc')
  })

  it('prefers title attribute over name element', () => {
    const item = createItem('<li title="A"><span class="file-name"><span class="name">B</span></span></li>')
    expect(getItemTitle(item)).toBe('A')
  })

  it('falls back to .file-name .name text', () => {
    const item = createItem('<li><span class="file-name"><span class="name"> 文件夹X </span></span></li>')
    expect(getItemTitle(item)).toBe('文件夹X')
  })
})

describe('getFolderCoverUrl / getImageThumbUrl / getImageIv', () => {
  it('reads folder cover from img_url', () => {
    expect(getFolderCoverUrl(createItem('<li img_url="https://x/cover.jpg"></li>'))).toBe('https://x/cover.jpg')
  })

  it('prefers image path attribute over img src', () => {
    const item = createItem('<li path="https://x/a.jpg"><img src="https://x/b.jpg"></li>')
    expect(getImageThumbUrl(item)).toBe('https://x/a.jpg')
  })

  it('falls back to inner img src', () => {
    const item = createItem('<li><img src="https://x/c.jpg"></li>')
    expect(getImageThumbUrl(item)).toBe('https://x/c.jpg')
  })

  it('reads iv flag', () => {
    expect(getImageIv(createItem('<li iv="1"></li>'))).toBe('1')
  })
})

describe('getHasDesc', () => {
  it('reads has_desc attribute', () => {
    expect(getHasDesc(createItem('<li has_desc="1"></li>'))).toBe('1')
    expect(getHasDesc(createItem('<li></li>'))).toBe('')
  })
})

describe('star action helpers', () => {
  it('locates star action element', () => {
    const item = createItem('<li><a menu="star"></a></li>')
    expect(getStarAction(item)?.getAttribute('menu')).toBe('star')
  })

  it('returns null when no star action', () => {
    expect(getStarAction(createItem('<li></li>'))).toBeNull()
  })

  it('reads star state key from action is_star', () => {
    const item = createItem('<li><i class="icon-star" is_star="1"></i></li>')
    expect(getStarStateKey(item)).toBe('1')
  })

  it('treats item as starred when action is_star is 1', () => {
    const item = createItem('<li><i class="icon-star" is_star="1"></i></li>')
    expect(isItemStarred(item)).toBe(true)
  })

  it('treats item as starred via item attributes', () => {
    expect(isItemStarred(createItem('<li star="1"></li>'))).toBe(true)
    expect(isItemStarred(createItem('<li is_star="1"></li>'))).toBe(true)
    expect(isItemStarred(createItem('<li class="is-starred"></li>'))).toBe(true)
    expect(isItemStarred(createItem('<li></li>'))).toBe(false)
  })
})

describe('remark helpers', () => {
  it('locates remark action', () => {
    const item = createItem('<li><a menu="remark"></a></li>')
    expect(getRemarkAction(item)?.getAttribute('menu')).toBe('remark')
  })

  it('treats remark as visible when display is not none', () => {
    vi.stubGlobal('getComputedStyle', () => ({ display: 'block' }))
    expect(isRemarkVisible(createItem('<li><a menu="remark"></a></li>'))).toBe(true)
  })

  it('treats remark as hidden when display is none', () => {
    vi.stubGlobal('getComputedStyle', () => ({ display: 'none' }))
    expect(isRemarkVisible(createItem('<li><a menu="remark"></a></li>'))).toBe(false)
  })

  it('treats remark as hidden when no remark action', () => {
    expect(isRemarkVisible(createItem('<li></li>'))).toBe(false)
  })
})

describe('anchor helpers', () => {
  it('finds open anchor', () => {
    const item = createItem('<li><span class="file-name"><span class="name">N</span></span></li>')
    const anchor = getOpenAnchor(item)
    expect(anchor.classList.contains('name')).toBe(true)
  })

  it('finds context menu anchor with thumb', () => {
    const item = createItem('<li><div class="file-thumb"><img src="x.jpg"></div></li>')
    expect(getContextMenuAnchor(item).tagName).toBe('IMG')
  })

  it('falls back to the item itself', () => {
    const item = createItem('<li></li>')
    expect(getOpenAnchor(item)).toBe(item)
    expect(getContextMenuAnchor(item)).toBe(item)
  })
})

describe('selection helpers', () => {
  it('prefers native checkbox action', () => {
    const item = createItem('<li><input type="checkbox" menu="file_check_one"><input type="checkbox"></li>')
    expect(getSelectionTarget(item).getAttribute('menu')).toBe('file_check_one')
  })

  it('falls back to plain checkbox', () => {
    const item = createItem('<li><input type="checkbox"></li>')
    expect(getSelectionTarget(item).tagName).toBe('INPUT')
  })

  it('falls back to the item itself', () => {
    const item = createItem('<li></li>')
    expect(getSelectionTarget(item)).toBe(item)
  })

  it('returns all inner checkboxes', () => {
    const item = createItem('<li><input type="checkbox"><span><input type="checkbox"></span></li>')
    expect(getItemCheckboxes(item)).toHaveLength(2)
  })
})
