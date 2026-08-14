import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FolderPlus,
  FolderTree,
  List,
  Maximize,
  Minus,
  Move,
  Pause,
  Play,
  RotateCw,
  Repeat1,
  Settings,
  SkipBack,
  SkipForward,
  Square,
  Star,
  Trash2,
  Volume2,
  VolumeX,
  X,
  AudioLines,
  type IconNode,
} from 'lucide'

function renderAttributes(attributes: Record<string, string | number | undefined>) {
  return Object.entries(attributes)
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => `${name}="${value}"`)
    .join(' ')
}

function ensureStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById('m115-lucide-styles')) return
  const style = document.createElement('style')
  style.id = 'm115-lucide-styles'
  style.textContent = 'svg.m115-lucide-icon path,svg.m115-lucide-icon circle,svg.m115-lucide-icon rect,svg.m115-lucide-icon line,svg.m115-lucide-icon polyline,svg.m115-lucide-icon polygon{fill:var(--m115-svg-fill,none)!important;}'
  ;(document.head || document.documentElement).appendChild(style)
}

function iconTemplate(node: IconNode, width = 20, height = 20, fill = 'none') {
  ensureStyles()
  const content = node.map(([tag, attributes]) => `<${tag} ${renderAttributes(attributes)}/>`).join('')
  const fillVar = fill !== 'none' ? `--m115-svg-fill: ${fill};` : ''
  return `<svg class="m115-lucide-icon" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:block;flex:none;${fillVar}">${content}</svg>`
}

/** 惰性图标定义：访问时才生成 SVG 并确保样式注入 */
function lazyIcon(node: IconNode, width?: number, height?: number, fill?: string) {
  let cached: string | null = null
  return function () {
    if (cached === null) {
      cached = iconTemplate(node, width, height, fill)
    }
    return cached
  }
}

export const Icons = {
  Play: lazyIcon(Play),
  Pause: lazyIcon(Pause),
  Volume2: lazyIcon(Volume2),
  VolumeX: lazyIcon(VolumeX),
  SkipBack: lazyIcon(SkipBack),
  SkipForward: lazyIcon(SkipForward),
  MediaTrack: lazyIcon(AudioLines),
  Repeat: lazyIcon(Repeat1),
  Stop: lazyIcon(Square),
  RotateCw: lazyIcon(RotateCw, 18, 18),
  Settings: lazyIcon(Settings),
  Fullscreen: lazyIcon(Maximize, 18, 18),
  Speed: lazyIcon(Clock, 18, 18),
  Check: lazyIcon(Check, 14, 14),
  ChevronRight: lazyIcon(ChevronRight, 14, 14),
  ChevronLeft: lazyIcon(ChevronLeft, 16, 16),
  ChevronDown: lazyIcon(ChevronDown),
  Minus: lazyIcon(Minus),
  Star: lazyIcon(Star),
  StarFilled: lazyIcon(Star, 20, 20, 'currentColor'),
  Trash: lazyIcon(Trash2, 18, 18),
  Move: lazyIcon(Move, 15, 15),
  Back: lazyIcon(ArrowLeft),
  Playlist: lazyIcon(List, 18, 18),
  Close: lazyIcon(X, 16, 16),
  FolderPlus: lazyIcon(FolderPlus),
  Clock: lazyIcon(Clock),
  FolderTree: lazyIcon(FolderTree),
}
