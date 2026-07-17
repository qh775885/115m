/**
 * 全局统一的 Lucide 图标集
 *
 * 所有图标都遵循 24x24 viewBox, stroke-width="2", fill="none"
 * 尺寸由 CSS 控制，颜色由 stroke="currentColor" 继承
 */

const iconTemplate = (content: string, width = 20, height = 20) => `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="${width}"
  height="${height}"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  style="display:block;flex:none;"
>${content}</svg>
`

export const Icons = {
  // Player Controls
  Play: iconTemplate('<polygon points="6 3 20 12 6 21 6 3" fill="currentColor"/>'),
  Pause: iconTemplate('<rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/>'),
  Volume2: iconTemplate('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="none"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none"/>'),
  VolumeX: iconTemplate('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="none"/><line x1="23" x2="17" y1="9" y2="15" fill="none"/><line x1="17" x2="23" y1="9" y2="15" fill="none"/>'),
  SkipBack: iconTemplate('<polygon points="19 20 9 12 19 4 19 20" fill="currentColor"/><line x1="5" x2="5" y1="19" y2="5" fill="none"/>'),
  SkipForward: iconTemplate('<polygon points="5 4 15 12 5 20 5 4" fill="currentColor"/><line x1="19" x2="19" y1="5" y2="19" fill="none"/>'),
  Quality: iconTemplate('<rect width="20" height="14" x="2" y="3" rx="2" fill="none"/><line x1="8" x2="16" y1="21" y2="21" fill="none"/><line x1="12" x2="12" y1="17" y2="21" fill="none"/>'),
  MediaTrack: iconTemplate('<rect width="20" height="14" x="2" y="5" rx="2" ry="2" fill="none"/><path d="M7 13h4" fill="none"/><path d="M15 13h2" fill="none"/><path d="M7 9h2" fill="none"/><path d="M13 9h4" fill="none"/>'),
  Repeat: iconTemplate('<path d="m17 2 4 4-4 4" fill="none"/><path d="M3 11v-1a4 4 0 0 1 4-4h14" fill="none"/><path d="m7 22-4-4 4-4" fill="none"/><path d="M21 13v1a4 4 0 0 1-4 4H3" fill="none"/>'),
  Stop: iconTemplate('<rect width="18" height="18" x="3" y="3" rx="2" ry="2" fill="none"/><rect width="8" height="8" x="8" y="8" fill="currentColor"/>'),
  RotateCw: iconTemplate('<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" fill="none"/><path d="M21 3v5h-5" fill="none"/>'),
  Settings: iconTemplate('<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" fill="none"/><circle cx="12" cy="12" r="3" fill="none"/>'),
  Fullscreen: iconTemplate('<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" fill="none"/>', 18, 18),
  Speed: iconTemplate('<circle cx="12" cy="12" r="10" fill="none"/><polyline points="12 6 12 12 16 14" fill="none"/>', 18, 18),
  Check: iconTemplate('<path d="M20 6 9 17l-5-5" fill="none"/>', 14, 14),
  ChevronRight: iconTemplate('<path d="m9 18 6-6-6-6" fill="none"/>', 14, 14),
  ChevronLeft: iconTemplate('<path d="m15 18-6-6 6-6" fill="none"/>', 16, 16),

  // UI Icons
  Star: iconTemplate('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'),
  Trash: iconTemplate('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>', 18, 18),
  Move: iconTemplate('<path d="M5 9l-3 3 3 3"/><path d="M2 12h14"/><path d="M12 5V2h10v20H12v-3"/>', 15, 15),
  Back: iconTemplate('<path d="M19 12H5M12 19l-7-7 7-7"/>'),
  Playlist: iconTemplate('<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h10"/>', 18, 18),
  Close: iconTemplate('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', 16, 16),
  FolderPlus: iconTemplate('<path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>'),
  Clock: iconTemplate('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
  FolderTree: iconTemplate('<rect width="8" height="8" x="3" y="3" rx="1"/><rect width="8" height="8" x="13" y="13" rx="1"/><path d="M3 11v1a1 1 0 0 0 1 1h2"/><path d="M13 11v-1a1 1 0 0 0-1-1h-2"/>'),
  List: iconTemplate('<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>'),
}
