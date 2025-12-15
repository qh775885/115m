type Base<T> = {
  state: boolean
} & T

export type FilesAppChromeDownurl = Base<{
  url: string
  data: string
}>

// eslint-disable-next-line ts/no-namespace
export namespace Res {
  export type FilesAppChromeDownurl = import('./pro').FilesAppChromeDownurl
}
