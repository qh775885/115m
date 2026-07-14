# 踩坑与经验

已验证无效、容易误判、会导致回归的路径。

## 播放器 404 与缩略图

- `/assets/*` 404 的根因是页面环境运行时动态 import，导致 Vite chunk 路径按 `https://115.com/assets/*` 请求
- 看到 `https://115.com/assets/player-*.js` 等，优先复查播放器启动链是否回归动态 import
- `video-page-early.js` 只允许同步 `document.write` 最小壳；禁止动态 `import` 模块
- 不要把所有 404 都归因到缩略图；只禁用进度条预览图、只清缓存都已验证不治本
- 缩略图相关方法必须保持顶层静态导入，不能恢复运行时 `import('../../lib/videoThumbnail')`
- `blob:` URL 是生命周期问题，不是 chunk 路径错误；缓存和 UI 不应持久使用 `blob:` 图片地址

## 列表刷新链路

- content/iframe 内直接调用 115 页面对象容易因执行环境不一致失败
- 移动、删除、解压等操作优先复用 background 刷新链路

## 图片墙拖选

- 自定义墙隐藏了原生 `li`，原生拖选不会自动命中墙卡片，必须在自定义墙内实现框选
- 拖选起点可能在墙空白、标题、`.list-contents`，不一定落在卡片本身
- 选择转发会派发合成事件；document 级监听必须过滤非真实事件

## 115vod.com cookie 在 background 中丢失

- background service worker 里 `fetch` 115vod.com 时，浏览器不自动带上 cookie（即使有 host_permissions）
- 115.com 的 cookie 正常带上，115vod.com 的不带——这是 Chrome 扩展的 cookie 策略行为
- cookie 本身未过期，在 115vod.com 标签页里 fetch 正常
- **history API 应使用 `webapi.115.com/files/history`（115.com 域名），不要用 `115vod.com/webapi/files/history`**
- 参考项目 115Master 用的就是 `webapi.115.com`，无 cookie 问题
- transcode.ts 也有 115vod.com 的 fetch，同样可能受影响（待确认）

## 无损播放

- MKV 不应默认主动走无损；允许用户手动选择并记住，但必须保留无声检测后切回 115 原画的保护
- 播放源请求 timeout 只是兜底忽略旧结果，不等于底层请求已真正 abort
- chunk 体积警告当前不处理；为消除警告拆分 chunk 可能重新触发动态 import 问题

## 加速与转码

- `m115_transcode_fallback=1` 必须在 `video-page-early.js` 和 `video-page.ts` 中豁免接管
- 预览图生成失败不等于视频需要转码，两者必须独立判断
- content script 直连 115 M3U8 API 不可靠（cookie 隔离），必须通过 background FETCH_M3U8 预取
- M3U8 API 不是判断转码的可靠信号，需要最多 2 次重试
- `duration === 0` 是 B 类视频的强烈信号，直接静默触发批量转码；`duration > 0` 且封面失败的是 A 类视频，不自动触发

## 字幕链路

- `SubtitleManager.loadList()` 若先 `++loadToken` 再调用 `clearTrack()`，会再次递增 token，导致接口结果被丢弃
- 115 字幕接口返回有效列表，但前端若只支持 srt/ass，遇到 webvtt 或 MicroDVD `.sub` 仍表现为"解析为空"
- 控制栏字幕文案应去前缀并限制为短标签，避免挤压右侧按钮

## 文件写入

- 修改播放器核心文件前必须先读当前文件内容
- 大文件优先小范围替换，避免整文件重写造成截断

## 当前稳定状态

- `video-page.ts` 保持顶层静态 import 播放器模块
- 进度条预览图、播放列表封面已恢复；缩略图方法保持顶层静态导入
- 缩略图缓存过滤 `blob:` 等非稳定地址，UI 使用稳定 `data:` 地址
- 播放列表为右侧外置面板；移动/删除后保持当前播放链稳定
- 字幕链路已恢复，常见格式解析已补齐测试覆盖
- 图片墙/文件夹墙拖选已恢复，支持从墙空白、标题、列表区域起拖
