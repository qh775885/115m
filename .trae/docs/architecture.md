# 架构文档

## 项目定位

115 网盘 Chrome 增强扩展。技术栈：Vite + TypeScript + Chrome Manifest V3 + pnpm。

核心能力：列表页增强、图片墙/文件夹墙、独立播放器、播放记忆、字幕、115 云端解压、后台消息协调。

## 架构分层

### `src/content/`

115 页面内容脚本。负责页面增强、DOM 交互、列表页预览、图片/文件夹墙、下载拦截、打开播放器。

- `home.ts`：列表页主入口
- `video-page.ts`：播放器页接管入口，**必须保持播放器模块顶层静态导入**
- `core/media-wall*.ts`：图片墙/文件夹墙
- `core/player-open.ts`：从列表页打开播放器
- `core/unarchive*.ts`：在线解压入口

### `src/player/`

独立播放器。负责播放源、画质、字幕、播放列表、播放记忆、移动文件等。

- `player.ts`：播放器启动
- `core/player-services.ts`：播放源、面包屑、播放列表整理
- `core/player-switch.ts`：切换视频
- `core/player-navigation.ts`：上下集与自动连播
- `core/player-quality.ts`：画质逻辑
- `core/overlay-playlist.ts`：右侧播放列表
- `core/subtitle-manager.ts`、`core/subtitles.ts`：字幕链路
- `core/history.ts`：播放进度记忆
- `core/player-api.ts`：播放器侧后台消息调用

### `src/background/`

扩展后台。负责高权限能力、跨页面协调、115 API 代理、标签页操作、列表刷新。

- `index.ts`：消息入口
- `handlers.ts`：消息处理（barrel 模块）
- `file-operations.ts`：文件移动/删除
- `media-info.ts`：M3U8/字幕/播放列表
- `transcode.ts`：转码状态机

### `src/shared/`

- `messages.ts`：所有 `chrome.runtime` 消息协议入口
- `player-playlist-cache.ts`：播放器列表缓存
- `utils.ts`：共享工具

### `src/platform/115/`

115 页面主世界能力封装。

- `main-world.ts`：MAIN world 调用
- `file-actions.ts`：移动、删除、刷新等文件动作

### `src/lib/`

通用库与 115 接口封装。

- `drive115.ts`、`pro-api.ts`：115 相关 API
- `videoThumbnail.ts`：视频缩略图
- `m3u8-parser.ts`、`clipper/*`：视频流相关能力

## 高风险禁忌

- **不要**把播放器入口改成运行时动态 `import()`，否则会请求 `https://115.com/assets/*`
- **不要**为消除 chunk 体积警告随意拆播放器 chunk
- **不要**绕过 `src/shared/messages.ts` 私自新增消息协议
- **不要**在 content/iframe 里优先直接调用 115 页面对象，列表刷新优先复用 background 链路
- **不要**让自定义图片墙/文件夹墙维护独立选择源，选择态以 115 原生文件项为准
- **不要**把 MKV 默认主动设为无损播放；只尊重用户手动选择并保留降级保护

## 技术决策

### Chrome 扩展加载与安全

- `public/video-page-early.js` 只负责同步写入最小播放器壳，不读取 Vite manifest，不动态 import
- `src/content/video-page.ts` 不应运行时动态 import `../player/player`
- background 高权限消息需要 sender 来源校验；MAIN world 请求代理需要 URL 白名单

### 115 在线解压

- 复用 115 云端接口，不做本地下载解压再上传
- 批量解压默认串行，遇到需要密码的压缩包跳过并汇总提示
- 解压完成后刷新列表优先复用后台刷新链路

### 播放器功能边界

- 缩略图功能必须与主播放链隔离
- 播放列表是右侧外置面板，不遮挡视频
- 字幕控件保持短标签，不展示过长原始字幕名
- 播放列表切换视频时，不能复用旧视频的 hover preview session
- 播放进度记忆以 115 原生 history 接口为准
- 无损播放默认走保守兼容策略：MKV 不默认无损，无声时自动回退

### UI 交互边界

- 文件夹封面收藏角标：已收藏常显，未收藏默认隐藏，悬浮/聚焦时显示
- 图片墙/文件夹墙选择态以 115 原生文件项为准

## 验证

- 普通代码改动：`pnpm typecheck` → `pnpm test` → `pnpm build`
- 构建配置/manifest/资源路径：先 `pnpm build`，再 `pnpm test`
- 仅文档/规则：不默认构建
- 构建中的既有 chunk 体积警告可忽略
