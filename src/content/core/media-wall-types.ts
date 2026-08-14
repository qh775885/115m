/** 媒体墙隐藏源 item 的 class（渲染卡片后隐藏原生列表项） */
export const WALL_HIDDEN_CLASS = 'm115-wall-hidden-item'

export interface MediaWallFolderItem {
  id: string
  title: string
  coverUrl: string
  sourceItem: HTMLElement
  isStarred: boolean
  hasRemark: boolean
  starAction: HTMLElement | null
  remarkAction: HTMLElement | null
  open: () => void
  select: (event?: MouseEvent) => void
  contextMenu: (event: MouseEvent) => void
}

export interface MediaWallImageItem {
  id: string
  title: string
  thumbUrl: string
  originalUrl: string
  fileId: string
  parentId: string
  pickCode: string
  sourceItem: HTMLElement
  open: () => void
  select: (event?: MouseEvent) => void
  contextMenu: (event: MouseEvent) => void
}

export interface LightboxController {
  open: (items: MediaWallImageItem[], startIndex: number) => void
}
