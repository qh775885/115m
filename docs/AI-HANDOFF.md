# AI-HANDOFF

用于让新 AI 快速接手开发。先按任务路由读取，不要通读全库。

## 接手入口

1. 先读 `.trae/rules/project-baseline.md`
2. 再读本文档
3. 按任务读取对应 memory / runbook / 源码
4. 改代码前必须先读目标文件当前内容

## 项目定位

- 115 网盘 Chrome 增强扩展
- 技术栈：Vite + TypeScript + Chrome Manifest V3 + pnpm
- 核心能力：列表页增强、图片墙/文件夹墙、独立播放器、播放记忆、字幕、115 云端解压、后台消息协调

## 架构分层

### `src/content/`

115 页面内容脚本。负责页面增强、DOM 交互、列表页预览、图片/文件夹墙、下载拦截、打开播放器。

常见入口：

- `home.ts`：列表页主入口
- `video-page.ts`：播放器页接管入口，必须保持播放器模块顶层静态导入
- `core/media-wall*.ts`：图片墙/文件夹墙
- `core/player-open.ts`：从列表页打开播放器
- `core/unarchive*.ts`：在线解压入口

### `src/player/`

独立播放器。负责播放源、画质、字幕、播放列表、播放记忆、移动文件等。

常见入口：

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

常见入口：

- `index.ts`：消息入口
- `handlers.ts`：消息处理
- `helpers.ts`：后台辅助能力
- `native-history.ts`：115 原生播放历史

### `src/shared/`

共享协议与工具。

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
- `logger.ts`：日志

## 任务路由

- 播放器问题：先读 `.trae/memory/pitfalls.md`、`.trae/memory/progress.md`、`docs/runbooks/player.md`
- 消息链路：先读 `docs/runbooks/messages.md` 和 `src/shared/messages.ts`
- content/background/注入脚本：先确认执行环境是 extension、isolated、page 还是 MAIN world
- Vite chunk、`/assets/*`、`chrome-extension://`：先检查静态导入边界和 `dist/.vite/manifest.json`
- 发布：读 `.trae/rules/release.md`
- 提交信息：读 `.trae/rules/git-commit-message.md`

## 智能体路由

当前可用智能体已覆盖本项目主要场景，后续开发默认按下面路由调用，不需要再重新研究智能体配置。

- Chrome 扩展、Manifest V3、content/background/MAIN world、扩展消息异常：`chrome-extension-architect`
- 播放器、播放列表、播放状态、画质切换、播放记忆、无损/原画降级：`player-flow-architect`
- 图片墙、文件夹墙、播放器 UI、交互与样式：`frontend-architect`，纯视觉设计再用 `ui-designer`
- 115 API、background 处理、消息协议、接口边界：`backend-architect`；需要系统性接口验证时用 `api-test-pro`
- 卡顿、加载慢、缩略图并发、播放恢复性能：`performance-expert`
- 扩展权限、消息来源校验、URL 白名单、敏感能力：`compliance-checker` 或安全审查技能
- 大范围代码理解、模块定位、复杂问题初步梳理：`search`

## 高风险禁忌

- 不要把播放器入口改成运行时动态 `import()`，否则可能请求到 `https://115.com/assets/*`
- 不要为消除 chunk 体积警告随意拆播放器 chunk
- 不要绕过 `src/shared/messages.ts` 私自新增消息协议
- 不要在 content/iframe 里优先直接调用 115 页面对象，列表刷新优先复用 background 链路
- 不要让自定义图片墙/文件夹墙维护独立选择源，选择态以 115 原生文件项为准
- 不要把 MKV 默认主动设为无损播放；只尊重用户手动选择并保留降级保护

## 验证

- 普通代码改动：`pnpm typecheck`、`pnpm test`、`pnpm build`
- 构建配置、manifest、资源路径：先 `pnpm build`，再 `pnpm test`
- 仅文档、规则、memory：不默认构建
- 构建中的既有 chunk 体积警告可忽略，除非本轮改动直接相关

## 记忆维护

- 关键进度、验证结果、中断点：写 `.trae/memory/progress.md`
- 已确认踩坑、无效方案、误判：写 `.trae/memory/pitfalls.md`
- 长期决策、模块边界、协作约定：写 `.trae/memory/decisions.md`
- 用户长期偏好：写 `docs/AI-PREFERENCES.md`
- 只合并精炼结论，不写流水账，不重复维护同一条规则
