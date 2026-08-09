import { describe, expect, it } from 'vitest'
import { isArchiveFileName, stripArchiveExtension } from './archive'

describe('isArchiveFileName', () => {
  it('detects common archive extensions', () => {
    expect(isArchiveFileName('a.zip')).toBe(true)
    expect(isArchiveFileName('a.rar')).toBe(true)
    expect(isArchiveFileName('a.7z')).toBe(true)
    expect(isArchiveFileName('a.tar.gz')).toBe(true)
    expect(isArchiveFileName('archive.tar.bz2')).toBe(true)
  })

  it('rejects non-archive names', () => {
    expect(isArchiveFileName('a.txt')).toBe(false)
    expect(isArchiveFileName('a.mp4')).toBe(false)
    expect(isArchiveFileName('noext')).toBe(false)
  })
})

describe('stripArchiveExtension', () => {
  it('strips single extensions', () => {
    expect(stripArchiveExtension('a.zip')).toBe('a')
    expect(stripArchiveExtension('a.rar')).toBe('a')
    expect(stripArchiveExtension('a.7z')).toBe('a')
  })

  it('strips compound tar.* extensions entirely', () => {
    expect(stripArchiveExtension('a.tar.gz')).toBe('a')
    expect(stripArchiveExtension('b.tar.bz2')).toBe('b')
    expect(stripArchiveExtension('c.tar.xz')).toBe('c')
  })

  it('keeps names without archive extensions unchanged', () => {
    expect(stripArchiveExtension('a.txt')).toBe('a.txt')
    expect(stripArchiveExtension('plain')).toBe('plain')
  })

  it('trims surrounding whitespace', () => {
    expect(stripArchiveExtension('  a.zip  ')).toBe('a')
  })
})
