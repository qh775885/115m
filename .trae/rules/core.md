---
alwaysApply: true
description: 115m 项目核心规则，所有开发必须遵循
---
# 115m 核心开发规则

## 全局纪律
- 默认在 `main` 做小步、可验证的修复与迭代。
- 改代码前先读当前文件，再看相关代码，不做无范围全库搜索。
- 只改当前需求涉及的功能，不顺手重构或扩展需求。
- 涉及共享模块、消息、播放器核心链路时，先确认隔离边界。
- 疑难问题先记录事实、排除项、已试无效方案，再动手修。
- 提交代码前，必须阅读并遵守 `.trae/rules/git-commit-message.md` 格式。

## Chrome 扩展边界
- 新增/修改 `chrome.runtime` 消息时，同步更新 `src/shared/messages.ts`。
- 修改 content/background/注入脚本时，先确认执行环境：extension / page / isolated / MAIN world。
- 涉及动态 `import()`、WXT chunk、`/assets/*` 时，先检查运行环境。

## WXT 架构与编译边界 (极度重要)
- 使用 WXT 框架后，只有扩展入口文件才放在 `src/entrypoints/` 目录下。业务代码放在 `src/content/`、`src/player/` 等目录。
- **开发服务器归属权（核心边界）**：
  - `pnpm dev` 的运行、维护、重启**完全由用户自行管理**。
  - AI **绝对禁止**运行 `pnpm dev`。AI 只需要负责修改 `src/` 目录下的业务代码或配置，保存后依赖用户本地的开发服务器进行热更新即可。
  - 如遇必须重启的情况（如修改了 `wxt.config.ts`），AI 应当**提示用户手动重启开发服务器**。
- `pnpm build`（AI 验证命令）：
  - AI 在完成阶段性代码修改后，应当主动运行 `pnpm build` 命令作为自我代码规范和打包验证机制。如果报错，AI 必须优先自行修复。
  - `pnpm build` 会输出稳定版到 `dist/chrome-mv3`。
- `pnpm zip` 的压缩包产物默认在 `.wxt/` 目录下。

## UI 与视图边界
- **左侧栏独立性**：左侧栏 (`src/content/core/sidebar.ts`) 是独立模块，使用 115 网盘原生图标资源 (`https://115.com/icons/...`)，不参与项目全局图标系统（如 Iconify 或 SVG sprite）的集成或修改。

## 安全
- 不泄露密钥、账号、环境信息。
- 不做未经确认的破坏性操作。
- 不主动提交 Git，除非用户明确要求。
