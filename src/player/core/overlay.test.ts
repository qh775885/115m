// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlayerOverlayController, type PlayerOverlayMeta, type PlayerOverlayOptions } from './overlay'

function createOverlay(meta: PlayerOverlayMeta) {
  const el = () => document.createElement('div')
  const options: PlayerOverlayOptions = {
    art: {
      template: {
        $player: el(),
        $controls: el(),
        $bottom: el(),
        $progress: el(),
      },
    } as never,
    meta,
    onMoveFile: vi.fn(),
    onToggleFavorite: vi.fn(),
    onPlaylistToggle: vi.fn(),
    onPlaylistPlay: vi.fn(),
    onPlaylistMove: vi.fn(),
    onPlaylistDelete: vi.fn(),
    onDeleteFile: vi.fn(),
    onPlayPrevious: vi.fn(),
    onPlayNext: vi.fn(),
    onReplay: vi.fn(),
    getCurrentPickCode: () => '',
    shouldKeepPlaylistOpen: () => false,
  }
  return {
    overlay: new PlayerOverlayController(options),
    options,
  }
}

function baseMeta(): PlayerOverlayMeta {
  return {
    title: 'A',
    fileSize: '',
    fileId: '',
    cid: '',
    parentId: '',
    isMarked: false,
    path: [],
  }
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('PlayerOverlayController.updateMeta', () => {
  it('应用 cid 并同步 parentId', () => {
    const { overlay, options } = createOverlay(baseMeta())
    overlay.updateMeta({ cid: 'C9' })
    expect(options.meta.cid).toBe('C9')
    expect(options.meta.parentId).toBe('C9')
  })

  it('空 cid 不覆盖已有 cid', () => {
    const meta = baseMeta()
    meta.cid = 'C1'
    meta.parentId = 'C1'
    const { overlay, options } = createOverlay(meta)
    overlay.updateMeta({ cid: '' })
    expect(options.meta.cid).toBe('C1')
    expect(options.meta.parentId).toBe('C1')
  })

  it('updateMeta 同时更新 title/fileSize/isMarked', () => {
    const { overlay, options } = createOverlay(baseMeta())
    overlay.updateMeta({ title: '新标题', fileSize: '1.5GB', isMarked: true })
    expect(options.meta.title).toBe('新标题')
    expect(options.meta.fileSize).toBe('1.5GB')
    expect(options.meta.isMarked).toBe(true)
  })
})
