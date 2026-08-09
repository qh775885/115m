/**
 * 压缩包工具函数（共享）
 * 供解压相关模块统一使用，避免重复实现与行为不一致。
 */

const ARCHIVE_EXTENSIONS = ['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz']
const COMPOUND_ARCHIVE_EXTENSIONS = ['tar.gz', 'tar.bz2', 'tar.xz']

export { ARCHIVE_EXTENSIONS }

export function isArchiveFileName(name: string): boolean {
  const lower = name.trim().toLowerCase()
  return ARCHIVE_EXTENSIONS.some(ext => lower.endsWith(`.${ext}`))
}

export function stripArchiveExtension(name: string): string {
  const trimmed = name.trim()
  const lower = trimmed.toLowerCase()
  for (const ext of COMPOUND_ARCHIVE_EXTENSIONS) {
    if (lower.endsWith(`.${ext}`)) return trimmed.slice(0, trimmed.length - ext.length - 1)
  }
  for (const ext of ARCHIVE_EXTENSIONS) {
    if (lower.endsWith(`.${ext}`)) return trimmed.slice(0, trimmed.length - ext.length - 1)
  }
  return trimmed
}
