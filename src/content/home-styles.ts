import baseCss from './home.css?inline'
import wallSharedCss from './media-wall-shared.css?inline'
import wallFoldersCss from './media-wall-folders.css?inline'
import wallImagesCss from './media-wall-images.css?inline'

export const homeStyles = [baseCss, wallSharedCss, wallFoldersCss, wallImagesCss].join('\n')
