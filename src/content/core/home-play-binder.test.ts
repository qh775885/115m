// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HomePlayBinder } from './home-play-binder'
import { isPlayIntentTarget } from './extractors'
import type { FileInfo } from './types'
import type { StoredPlayerPlaylistItem } from '../../shared/player-playlist-cache'

function createVideoItem(doc: Document): HTMLLIElement {
  const li = doc.createElement('li')
  li.setAttribute('rel', 'item')
  li.setAttribute('pick_code', 'P1')
  li.setAttribute('iv', '1')
  li.setAttribute('title', 'video.mp4')
  li.innerHTML = `
    <div class="file-thumb"><i class="icon-play"></i></div>
    <div class="file-name"><input type="checkbox" class="check"><span class="name">video.mp4</span></div>
    <div class="file-opr"><a class="btn-download">下载</a></div>
  `
  return li
}

describe('HomePlayBinder dblclick', () => {
  let doc: Document
  let openPlayer: (file: FileInfo, playlist: StoredPlayerPlaylistItem[]) => Promise<unknown> | void

  beforeEach(() => {
    doc = document.implementation.createHTMLDocument()
    openPlayer = vi.fn()
  })

  function dispatchDblclick(el: Element) {
    el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }))
  }

  it('双击文件名区域触发播放器', () => {
    const li = createVideoItem(doc)
    doc.body.appendChild(li)
    new HomePlayBinder(openPlayer).bindItemPlay(li)
    dispatchDblclick(li.querySelector('.file-name')!)
    expect(openPlayer).toHaveBeenCalledTimes(1)
  })

  it('双击缩略图区域触发播放器', () => {
    const li = createVideoItem(doc)
    doc.body.appendChild(li)
    new HomePlayBinder(openPlayer).bindItemPlay(li)
    dispatchDblclick(li.querySelector('.file-thumb')!)
    expect(openPlayer).toHaveBeenCalledTimes(1)
  })

  it('双击下载按钮不触发播放器', () => {
    const li = createVideoItem(doc)
    doc.body.appendChild(li)
    new HomePlayBinder(openPlayer).bindItemPlay(li)
    dispatchDblclick(li.querySelector('.btn-download')!)
    expect(openPlayer).not.toHaveBeenCalled()
  })

  it('双击勾选框不触发播放器', () => {
    const li = createVideoItem(doc)
    doc.body.appendChild(li)
    new HomePlayBinder(openPlayer).bindItemPlay(li)
    dispatchDblclick(li.querySelector('.check')!)
    expect(openPlayer).not.toHaveBeenCalled()
  })

  it('双击 li 空白区域不触发播放器', () => {
    const li = createVideoItem(doc)
    doc.body.appendChild(li)
    new HomePlayBinder(openPlayer).bindItemPlay(li)
    dispatchDblclick(li)
    expect(openPlayer).not.toHaveBeenCalled()
  })

  it('重复绑定同一 item 只绑一次（不重复触发）', () => {
    const li = createVideoItem(doc)
    doc.body.appendChild(li)
    const binder = new HomePlayBinder(openPlayer)
    binder.bindItemPlay(li)
    binder.bindItemPlay(li)
    dispatchDblclick(li.querySelector('.file-name')!)
    expect(openPlayer).toHaveBeenCalledTimes(1)
  })

  it('115 复用 li 展示新文件后，点击打开新文件而非旧文件', () => {
    const li = createVideoItem(doc)
    doc.body.appendChild(li)
    const binder = new HomePlayBinder(openPlayer)
    binder.bindItemPlay(li)

    li.setAttribute('pick_code', 'P2')
    li.setAttribute('title', 'video2.mp4')
    binder.bindItemPlay(li)

    dispatchDblclick(li.querySelector('.file-name')!)
    expect(openPlayer).toHaveBeenCalledTimes(1)
    expect((openPlayer as ReturnType<typeof vi.fn>).mock.calls[0][0].pickCode).toBe('P2')
  })

  it('li 复用后不再是视频时解除旧的播放绑定', () => {
    const li = createVideoItem(doc)
    doc.body.appendChild(li)
    const binder = new HomePlayBinder(openPlayer)
    binder.bindItemPlay(li)

    li.removeAttribute('pick_code')
    binder.bindItemPlay(li)

    dispatchDblclick(li.querySelector('.file-name')!)
    expect(openPlayer).not.toHaveBeenCalled()
  })
})

describe('isPlayIntentTarget', () => {
  let doc: Document

  beforeEach(() => {
    doc = document.implementation.createHTMLDocument()
  })

  it('排除 .file-opr 内元素', () => {
    const btn = doc.createElement('a')
    btn.className = 'btn-download'
    const opr = doc.createElement('div')
    opr.className = 'file-opr'
    opr.appendChild(btn)
    doc.body.appendChild(opr)
    expect(isPlayIntentTarget(btn)).toBe(false)
  })

  it('排除 [menu] 属性节点', () => {
    const menu = doc.createElement('i')
    menu.setAttribute('menu', '')
    doc.body.appendChild(menu)
    expect(isPlayIntentTarget(menu)).toBe(false)
  })

  it('排除 .m115-cover-container 内元素', () => {
    const cover = doc.createElement('div')
    cover.className = 'm115-cover-container'
    const inner = doc.createElement('span')
    cover.appendChild(inner)
    doc.body.appendChild(cover)
    expect(isPlayIntentTarget(inner)).toBe(false)
  })

  it('排除 .file-name 容器内的裸 checkbox（无 menu）', () => {
    const check = doc.createElement('input')
    check.type = 'checkbox'
    const nameWrap = doc.createElement('div')
    nameWrap.className = 'file-name'
    nameWrap.appendChild(check)
    doc.body.appendChild(nameWrap)
    expect(isPlayIntentTarget(check)).toBe(false)
  })

  it('排除 .file-thumb 容器内的勾选框', () => {
    const check = doc.createElement('i')
    check.className = 'checkbox'
    const thumb = doc.createElement('div')
    thumb.className = 'file-thumb'
    thumb.appendChild(check)
    doc.body.appendChild(thumb)
    expect(isPlayIntentTarget(check)).toBe(false)
  })

  it('命中文名/缩略图区域', () => {
    const name = doc.createElement('span')
    name.className = 'name'
    doc.body.appendChild(name)
    expect(isPlayIntentTarget(name)).toBe(true)
  })

  it('命中带 menu 属性的文件名链接（115 原生 view_file_one）', () => {
    const link = doc.createElement('a')
    link.className = 'name'
    link.setAttribute('menu', 'view_file_one')
    const wrap = doc.createElement('span')
    wrap.className = 'file-name'
    wrap.appendChild(link)
    doc.body.appendChild(wrap)
    expect(isPlayIntentTarget(link)).toBe(true)
    const inner = doc.createElement('span')
    link.appendChild(inner)
    expect(isPlayIntentTarget(inner)).toBe(true)
  })

  it('排除带 menu 属性的星标等操作按钮', () => {
    const star = doc.createElement('a')
    star.className = 'icon-star'
    star.setAttribute('menu', 'star')
    const wrap = doc.createElement('span')
    wrap.className = 'file-name'
    wrap.appendChild(star)
    doc.body.appendChild(wrap)
    expect(isPlayIntentTarget(star)).toBe(false)
  })
})
