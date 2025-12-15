type ResBase<T> = {
  state: boolean
  code: number
  errNo: number
  error: string
} & T

export type VideoM3u8 = ResBase<string>

export type FilesDownload = ResBase<{
  file_url: string
}>

// eslint-disable-next-line ts/no-namespace
export namespace Res {
  export type VideoM3u8 = import('./normal').VideoM3u8
  export type FilesDownload = import('./normal').FilesDownload
}
