import {
  ArrowLeft,
  Check,
  CloudDownload,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FolderPlus,
  HardDrive,
  Inbox,
  FolderTree,
  List,
  ListVideo,
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
  Tags,
  Trash2,
  Volume2,
  VolumeX,
  X,
  Share2,
  Upload,
  Gauge,
  AudioLines,
  type IconNode,
} from 'lucide'

function renderAttributes(attributes: Record<string, string | number | undefined>) {
  return Object.entries(attributes)
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => `${name}="${value}"`)
    .join(' ')
}

if (typeof document !== 'undefined') {
  const injectStyles = () => {
    if (document.getElementById('m115-lucide-styles')) return
    const style = document.createElement('style')
    style.id = 'm115-lucide-styles'
    style.textContent = 'svg.m115-lucide-icon path,svg.m115-lucide-icon circle,svg.m115-lucide-icon rect,svg.m115-lucide-icon line,svg.m115-lucide-icon polyline,svg.m115-lucide-icon polygon{fill:var(--m115-svg-fill,none)!important;}'
    ;(document.head || document.documentElement).appendChild(style)
  }
  if (document.head || document.documentElement) {
    injectStyles()
  } else {
    document.addEventListener('DOMContentLoaded', injectStyles)
  }
}

function iconTemplate(node: IconNode, width = 20, height = 20, fill = 'none') {
  const content = node.map(([tag, attributes]) => `<${tag} ${renderAttributes(attributes)}/>`).join('')
  const fillVar = fill !== 'none' ? `--m115-svg-fill: ${fill};` : ''
  return `<svg class="m115-lucide-icon" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:block;flex:none;${fillVar}">${content}</svg>`
}

export const Icons = {
  Play: iconTemplate(Play),
  Pause: iconTemplate(Pause),
  Volume2: iconTemplate(Volume2),
  VolumeX: iconTemplate(VolumeX),
  SkipBack: iconTemplate(SkipBack),
  SkipForward: iconTemplate(SkipForward),
  Quality: iconTemplate(Gauge),
  MediaTrack: iconTemplate(AudioLines),
  Repeat: iconTemplate(Repeat1),
  Stop: iconTemplate(Square),
  RotateCw: iconTemplate(RotateCw, 18, 18),
  Settings: iconTemplate(Settings),
  Fullscreen: iconTemplate(Maximize, 18, 18),
  Speed: iconTemplate(Clock, 18, 18),
  Check: iconTemplate(Check, 14, 14),
  ChevronRight: iconTemplate(ChevronRight, 14, 14),
  ChevronLeft: iconTemplate(ChevronLeft, 16, 16),
  ChevronDown: iconTemplate(ChevronDown),
  Minus: iconTemplate(Minus),
  Star: iconTemplate(Star),
  StarFilled: iconTemplate(Star, 20, 20, 'currentColor'),
  Trash: iconTemplate(Trash2, 18, 18),
  Move: iconTemplate(Move, 15, 15),
  Back: iconTemplate(ArrowLeft),
  Playlist: iconTemplate(List, 18, 18),
  Close: iconTemplate(X, 16, 16),
  FolderPlus: iconTemplate(FolderPlus),
  Clock: iconTemplate(Clock),
  FolderTree: iconTemplate(FolderTree),
  List: iconTemplate(List),
  HardDrive: iconTemplate(HardDrive),
  Upload: iconTemplate(Upload),
  CloudDownload: iconTemplate(CloudDownload),
  Inbox: iconTemplate(Inbox),
  Tags: iconTemplate(Tags),
  Share: iconTemplate(Share2),
}
