---
alwaysApply: true
description: 115m 项目核心规则与按需阅读索引
---
# 115m 项目规则

Chrome 增强扩展。WXT 框架 + TypeScript + Tailwind CSS。

## 按需阅读

不要通读全部文档。接到任务后，先判断类型，再按需加载：

| 任务 | 读取 |
|------|------|
| 播放器相关 | `.ai/player.md` → 对应源码 |
| 消息链路 | `src/shared/messages.ts` → `.ai/messages.md` |
| 版本更新说明 | `.ai/release.md` |
| 提交信息 | `.ai/git-commit-message.md` |
| 调试运行时 bug | `.ai/debugging.md` |

## 核心规则

- 默认在 `main` 做小步、可验证的修复与迭代
- 改代码前先读当前文件，再看相关代码，不做无范围全库搜索
- 只改当前需求涉及的功能，不顺手重构或扩展需求
- 涉及共享模块、消息、播放器核心链路时，先确认隔离边界
- 疑难问题先记录事实、排除项、已试无效方案，再动手修
- 多次试错的结论，同步到 `.ai/debugging.md`
- 提交代码前，必须先读取 `.ai/rules/git-commit-message.md` 并遵守格式

## Chrome 扩展边界

- 新增/修改 `chrome.runtime` 消息时，同步更新 `src/shared/messages.ts`
- 修改 content/background/注入脚本时，先确认执行环境：extension / page / isolated / MAIN world
- 涉及动态 `import()`、WXT chunk、`/assets/*` 时，先检查运行环境

## 构建与验证

- **开发服务器归属权（核心边界）**：
  - `pnpm dev` 的运行、维护、重启**完全由用户自行管理**。
  - AI **绝对禁止**运行 `pnpm dev`。AI 只需要负责修改 `src/` 目录下的业务代码或配置，保存后依赖用户本地的开发服务器进行热更新即可。
  - 如遇必须重启的情况（如修改了 `wxt.config.ts`），AI 应当**提示用户手动重启开发服务器**。
- `pnpm build`（AI 验证命令）：
  - AI 在完成阶段性代码修改后，应当主动运行 `pnpm build` 命令。
  - 此命令作为 AI 的自我代码规范和打包验证机制。如果 `build` 报错，AI 必须优先自行修复代码，直到构建通过后再向用户汇报。
  - 只有当用户明确需要“发布”或“打包压缩文件”时，AI 才需要运行 `pnpm zip`，产物默认位于 `.wxt/` 目录下。

## WXT 与打包产物

- 使用 WXT 框架后，入口文件都在 `src/entrypoints/` 下。
- `pnpm dev` 会输出测试版到 `dist/chrome-mv3-dev`（仅用于开发测试，关闭终端会失效）。
- `pnpm build` 会输出稳定版到 `dist/chrome-mv3`（用于日常使用和发布）。
- `pnpm zip` 的压缩包产物默认在 `.wxt/` 目录下。
- 旧的 `release/` 目录约定已废弃。

## 安全

- 不泄露密钥、账号、环境信息
- 不做未经确认的破坏性操作
- 不主动提交 Git，除非用户明确要求
