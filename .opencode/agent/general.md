---
description: 115m 项目核心规则，所有开发行为必须遵循
mode: primary
---
# 115m 核心项目规范

## 全局纪律
- 默认在 `main` 级小步提交，保证可回退和易审查。
- 改代码前先读当前文件，再看依赖代码，勿盲目瞎猜全局依赖。
- 只做当前请求涉及的功能，勿顺手重构或发散扩展。
- 涉及数据、模块、消息、资源加载路径时，务必确认绝对边界。
- 把注意力放在记录、实现、排除死胡同、解决实际问题，而不是写注释。
- 提交代码前，请检查是否符合 `.opencode/agent/git-commit-message.md` 格式。

## Chrome 扩展边界
- 增加/修改 `chrome.runtime` 消息时，同步维护 `src/shared/messages.ts`。
- 修改 content/background/注入脚本时，务必明确执行环境（extension / page / isolated / MAIN world）。
- 涉及动态 `import()`、WXT chunk、`/assets/*` 时，优先检查相对路径。

## WXT 架构构建边界 (非常重要)
- 使用 WXT 框架，只在扩展入口文件存放于 `src/entrypoints/` 目录下。业务代码放在 `src/content/`、`src/player/` 等目录。
- **构建脚本与本地热权（绝对边界）**：
  - `pnpm dev` 的启动、维护与停止**完全由用户手动管理**。
  - AI **绝对禁止**运行 `pnpm dev`。AI 只需要负责修改 `src/` 目录下的业务代码配置，热重载由用户本机的控制台进程自动捕获生成。
  - 如果遇到需要重启配置（如修改了 `wxt.config.ts`），AI 应当**提示用户手动重启本地构建进程**。
- `pnpm build`（AI 验证命令）：
  - AI 在完成阶段性源码修改后应尝试运行 `pnpm build` 命令，作为防低级语法错误的代码验证手段。如果报错，AI 应主动修复后再尝试修改。
  - `pnpm build` 产物将输出到 `dist/chrome-mv3`。
- `pnpm zip` 打包产物，默认在 `.wxt/` 目录下。

## UI 与图标边界
- **外部图标源**：侧边栏 (`src/content/core/sidebar.ts`) 是独立模块，使用 115 官方原始图标资源 (`https://115.com/icons/...`)。请勿引入项目全局图标系统（如 Iconify 或 SVG sprite），文件可直接修改。

## 安全
- 勿泄露密钥、账号、敏感信息。
- 勿删除未确认的旧版兼容代码。
- 勿主动提交 Git，除非用户明确要求。