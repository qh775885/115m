---
alwaysApply: true
description: 115m 项目核心规则与按需阅读索引
---
# 115m 项目规则

Chrome 增强扩展。Vite + TypeScript + Manifest V3 + pnpm。

## 按需阅读

不要通读全部文档。接到任务后，先判断类型，再按需加载：

| 任务 | 读取 |
|------|------|
| 播放器相关 | `.trae/docs/pitfalls.md` → `.trae/docs/architecture.md` → 对应源码 |
| 消息链路 | `src/shared/messages.ts` → `.trae/rules/messages.md` |
| 版本更新说明 | `.trae/rules/release.md` |
| 提交信息 | `.trae/rules/git-commit-message.md` |
| 调试运行时 bug | `.trae/rules/debugging.md` |
| 115 Open API | `.trae/docs/api.md` |
| 长期偏好/约定 | `.trae/docs/preferences.md` |
| 项目架构全貌 | `.trae/docs/architecture.md` |

## 核心规则

- 默认在 `main` 做小步、可验证的修复与迭代
- 改代码前先读当前文件，再看相关代码，不做无范围全库搜索
- 只改当前需求涉及的功能，不顺手重构或扩展需求
- 涉及共享模块、消息、播放器核心链路时，先确认隔离边界
- 疑难问题先记录事实、排除项、已试无效方案，再动手修
- 多次试错的结论，同步到 `.trae/docs/pitfalls.md`
- 提交代码前，必须先读取 `.trae/rules/git-commit-message.md` 并遵守格式

## Chrome 扩展边界

- 新增/修改 `chrome.runtime` 消息时，同步更新 `src/shared/messages.ts`
- 修改 content/background/注入脚本时，先确认执行环境：extension / page / isolated / MAIN world
- 涉及动态 `import()`、Vite chunk、`/assets/*` 时，先检查运行环境

## 构建与验证

- 普通开发改动（AI 执行规则）：在一个完整需求或 Bug 修复的**所有代码编写完成之后**，AI 必须主动运行一次 `pnpm check` 进行全局验证。不要在零散的单次文件修改后频繁运行。
- 验证失败处理：如果 `pnpm check` 报错，AI 必须优先自行修复错误（包括 lint 格式、类型错误、测试用例），直到检查完全通过，再向用户汇报任务完成。
- 构建配置/manifest/资源路径改动：先执行 `pnpm build`，再执行 `pnpm check`。
- 仅文档/规则：不构建、不验证。
- 构建中的既有 chunk 体积警告可忽略。

## release 目录

- `release/` 已加入 `.gitignore`，不同步到 GitHub
- 只保留最新一版构建产物，旧版本及时清理

## 安全

- 不泄露密钥、账号、环境信息
- 不做未经确认的破坏性操作
- 不主动提交 Git，除非用户明确要求
