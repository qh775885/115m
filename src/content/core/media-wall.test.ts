// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { renderMediaWall } from './media-wall'

function setupDoc(items: Array<{ type: string, title: string, imgUrl?: string }>): Document {
  const doc = document.implementation.createHTMLDocument()
  const list = doc.createElement('div')
  list.className = 'list-contents'
  items.forEach((item) => {
    const li = doc.createElement('li')
    li.setAttribute('rel', 'item')
    li.setAttribute('file_type', item.type)
    li.setAttribute('title', item.title)
    if (item.type === '0' && item.imgUrl) li.setAttribute('img_url', item.imgUrl)
    list.appendChild(li)
  })
  doc.body.appendChild(list)
  return doc
}

function getWallState(doc: Document) {
  const list = doc.querySelector('.list-contents')
  const wall = list?.querySelector('#m115-media-wall')
  return {
    hasWall: !!wall,
    folderCards: wall?.querySelectorAll('.m115-folder-card').length ?? 0,
    hiddenCount: doc.querySelectorAll('.m115-wall-hidden-item').length,
  }
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('renderMediaWall', () => {
  it('renders folder wall on first call', () => {
    const doc = setupDoc([{ type: '0', title: 'A', imgUrl: 'https://x/a.jpg' }])
    renderMediaWall(doc)
    const state = getWallState(doc)
    expect(state.hasWall).toBe(true)
    expect(state.folderCards).toBe(1)
    expect(state.hiddenCount).toBe(1)
  })

  it('does not rebuild wall when list content is unchanged', () => {
    const doc = setupDoc([{ type: '0', title: 'A', imgUrl: 'https://x/a.jpg' }])
    renderMediaWall(doc)
    const firstWall = doc.querySelector('#m115-media-wall')
    const firstCard = doc.querySelector('.m115-folder-card')

    renderMediaWall(doc)
    const secondWall = doc.querySelector('#m115-media-wall')
    const secondCard = doc.querySelector('.m115-folder-card')

    expect(secondWall).toBe(firstWall)
    expect(secondCard).toBe(firstCard)
  })

  it('rebuilds wall when a new item is added', () => {
    const doc = setupDoc([{ type: '0', title: 'A', imgUrl: 'https://x/a.jpg' }])
    renderMediaWall(doc)

    const list = doc.querySelector('.list-contents')
    const li = doc.createElement('li')
    li.setAttribute('rel', 'item')
    li.setAttribute('file_type', '0')
    li.setAttribute('title', 'B')
    li.setAttribute('img_url', 'https://x/b.jpg')
    list?.appendChild(li)

    renderMediaWall(doc)
    const state = getWallState(doc)
    expect(state.folderCards).toBe(2)
  })

  it('force refresh re-renders when star attribute changed but node refs stable', () => {
    const doc = setupDoc([{ type: '0', title: 'A', imgUrl: 'https://x/a.jpg' }])
    renderMediaWall(doc)
    expect(doc.querySelector('.m115-folder-card .m115-folder-action-btn')?.classList.contains('is-active')).toBe(false)

    const li = doc.querySelector('li[rel="item"]')
    const star = doc.createElement('i')
    star.className = 'icon-star'
    star.setAttribute('is_star', '1')
    li?.appendChild(star)

    renderMediaWall(doc, true)
    expect(doc.querySelector('.m115-folder-card .m115-folder-action-btn')?.classList.contains('is-active')).toBe(true)
  })

  it('clears wall when all items removed', () => {
    const doc = setupDoc([{ type: '0', title: 'A', imgUrl: 'https://x/a.jpg' }])
    renderMediaWall(doc)
    const list = doc.querySelector('.list-contents')
    list?.querySelectorAll('li[rel="item"]').forEach(li => li.remove())
    renderMediaWall(doc)
    const state = getWallState(doc)
    expect(state.hasWall).toBe(false)
    expect(state.hiddenCount).toBe(0)
  })
})
