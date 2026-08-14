// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { getSortedItems } from './sidebar'

const item = (id: string) => ({ id, title: id, icon: '', href: '', defaultEnabled: true })

describe('getSortedItems 侧边栏排序', () => {
  it('特殊项（receive/upload/recyclebin）排在最后且保持顺序', () => {
    const items = [item('wangpan'), item('recyclebin'), item('receive'), item('upload')]
    const sorted = getSortedItems(items)
    const ids = sorted.map(i => i.id)
    expect(ids).toEqual(['wangpan', 'receive', 'upload', 'recyclebin'])
  })

  it('普通项保持原有相对顺序', () => {
    const items = [item('b'), item('a'), item('wangpan')]
    const sorted = getSortedItems(items)
    expect(sorted.map(i => i.id)).toEqual(['b', 'a', 'wangpan'])
  })

  it('无特殊项时原序返回', () => {
    const items = [item('a'), item('b')]
    expect(getSortedItems(items).map(i => i.id)).toEqual(['a', 'b'])
  })

  it('空列表返回空', () => {
    expect(getSortedItems([])).toEqual([])
  })
})
