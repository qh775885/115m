# 踩坑记忆

## 用途

- 只记录已验证无效、容易误判、会导致回归的路径
- 不记录普通过程、工具迁移或无后续排查价值的信息

## 播放器 404 与缩略图链路

- 播放器页 `/assets/*` 404 的关键风险是页面环境运行时动态 import，导致 Vite chunk 相对路径按 `https://115.com/assets/*` 请求
- 若看到 `https://115.com/assets/player-*.js`、`player-playlist-cache-*.js`、`m3u8-parser-*.js`，优先复查播放器启动链是否回归动态 import
- 不要把所有 404 都归因到缩略图本身；只禁用进度条预览图、播放列表缩略图、只静态导入 `hls.ts`、只清缓存都已验证不治本
- 缩略图相关方法必须保持顶层静态导入，不要恢复运行时 `import('../../lib/videoThumbnail')`
- `blob:https://115.com/... net::ERR_FILE_NOT_FOUND` 通常是缩略图/VTT 对象 URL 生命周期问题，不是 `/assets/*` chunk 路径错误；缓存和 UI 不应持久使用 `blob:` 图片地址

## 列表刷新链路

- 115 列表页局部刷新不要优先在 content/iframe 内直接调用页面对象，容易因执行环境不一致失败
- 移动、删除、解压等会改变列表内容的功能，优先复用 background 刷新链路，再保留页面内刷新作为兜底

## 图片墙与文件夹墙拖选

- 自定义图片墙/文件夹墙隐藏了 115 原生 `li`，原生拖选不会自动命中墙卡片，必须在自定义墙内实现框选并转发到原生选择
- 拖选起点可能在 `.m115-media-wall`、标题、`.list-contents` 或 grid 空白处，不一定落在卡片本身；只监听卡片/grid 会漏掉用户常用起拖路径
- 选择转发会派发合成 `mousedown/mouseup/click`；document 级拖选监听必须过滤非真实事件，否则会把合成事件误判为新拖选或松手，导致“碰到就断”

## 播放器与无损播放

- 无损源本质是浏览器原生 `<video>` 播放下载直链，能否播放取决于容器和音视频编码，不等于所有格式都能稳定无损
- MKV 不应默认主动走无损；可允许用户手动选择并记住，但必须保留无声检测后切回 115 原画的保护
- 播放源请求 timeout 只是兜底忽略旧结果，不等于底层请求已真正 abort；后续排查请求风控时不要误判
- chunk 体积警告当前不处理；为消除警告拆分 chunk 可能重新触发 Chrome 扩展动态 import 与 `/assets/*` 路径问题

## 加速与转码链路

- `m115_transcode_fallback=1` 作为兜底原生播放页加速参数，必须在 `video-page-early.js` 和 `video-page.ts` 中豁免接管。如果这里也覆盖原生 DOM，会导致兜底页无法执行原生播放逻辑，也就无法成功触发转码。
- 预览图生成失败（封面为空或异常）不等于视频需要转码。封面走 content script 直连 M3U8 + clipper 抽帧，播放走 background 代理或无损直链，两条链路独立。`duration === 0` 和 `M3u8UnavailableError` 都不可靠，正常视频也会命中。当前策略：列表预览所有失败场景只显示手动按钮，不自动触发加速。

## 文件写入风险

- 修改播放器核心文件前必须先读当前文件内容
- 大文件优先小范围替换，避免整文件重写造成截断

## 字幕链路

- `SubtitleManager.loadList()` 若先 `++loadToken` 再调用 `clearTrack()`，会再次递增 token，导致接口返回后始终命中 `token !== this.loadToken` 并被直接丢弃，UI 会长期停留在“无字幕”
- 115 字幕接口即使已返回有效列表，若前端只支持 `srt/ass`，遇到 `webvtt` 或 MicroDVD `.sub` 仍可能表现为“字幕解析为空”；排查时不要只盯接口是否为空
- `src/background/handlers.ts` 当前应从 `src/background/helpers.ts` 引用 `executeInMainWorld`；误从 `src/platform/115/main-world.ts` 直接导入会导致构建失败
- 控制栏字幕文案若直接使用原始标题，像 `[内置字幕]简体中文` 这类名称会挤压右侧按钮；应先去前缀并限制为短标签或固定宽度
