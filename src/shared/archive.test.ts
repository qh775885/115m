import { describe, expect, it } from 'vitest'
import { isArchiveFileName, isSecondaryVolume, stripArchiveExtension } from './archive'

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

describe('isSecondaryVolume', () => {
  it('detects non-first split volumes', () => {
    expect(isSecondaryVolume('a.part2.rar')).toBe(true)
    expect(isSecondaryVolume('a.part02.rar')).toBe(true)
    expect(isSecondaryVolume('a.part10.rar')).toBe(true)
  })

  it('excludes the first volume', () => {
    expect(isSecondaryVolume('a.part1.rar')).toBe(false)
    expect(isSecondaryVolume('a.part01.rar')).toBe(false)
    expect(isSecondaryVolume('a.part001.rar')).toBe(false)
  })

  it('treats multi-digit volumes (like part011, part11) as secondary', () => {
    expect(isSecondaryVolume('a.part11.rar')).toBe(true)
    expect(isSecondaryVolume('a.part011.rar')).toBe(true)
    expect(isSecondaryVolume('a.part101.rar')).toBe(true)
    expect(isSecondaryVolume('a.part111.rar')).toBe(true)
  })

  it('does not treat plain numeric suffixes as volumes', () => {
    expect(isSecondaryVolume('photo.042')).toBe(false)
    expect(isSecondaryVolume('backup.123')).toBe(false)
    expect(isSecondaryVolume('a.042')).toBe(false)
  })

  it('does not match non-rar archives', () => {
    expect(isSecondaryVolume('a.part2.zip')).toBe(false)
    expect(isSecondaryVolume('a.zip')).toBe(false)
  })
})
