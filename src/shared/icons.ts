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
  Monitor,
  Move,
  Pause,
  Play,
  RefreshCw,
  Repeat,
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
  type IconNode,
} from 'lucide'

function renderAttributes(attributes: Record<string, string | number | undefined>) {
  return Object.entries(attributes)
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => `${name}="${value}"`)
    .join(' ')
}

function iconTemplate(node: IconNode, width = 20, height = 20, fill = 'none') {
  const content = node.map(([tag, attributes]) => `<${tag} ${renderAttributes(attributes)}/>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:block;flex:none;">${content}</svg>`
}

export const Icons = {
  Play: iconTemplate(Play),
  Pause: iconTemplate(Pause),
  Volume2: iconTemplate(Volume2),
  VolumeX: iconTemplate(VolumeX),
  SkipBack: iconTemplate(SkipBack),
  SkipForward: iconTemplate(SkipForward),
  Quality: iconTemplate(Monitor),
  MediaTrack: iconTemplate(ListVideo),
  Repeat: iconTemplate(Repeat),
  Stop: iconTemplate(Square),
  RotateCw: iconTemplate(RefreshCw, 18, 18),
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
