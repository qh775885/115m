---
alwaysApply: true
---
# 115m 项目核心规则

## 定位

- Chrome 扩展项目，统一使用 `pnpm`
- 默认在 `main` 做小步、可验证的修复与迭代
- 本文件是唯一始终生效规则入口

## 项目记忆

- `.ai/memory/` 是项目内 AI 记忆，随 Git 同步
- 新对话或上下文丢失后，按需读取：
  - `.ai/memory/progress.md`：进度与中断点
  - `.ai/memory/pitfalls.md`：踩坑与无效方案
  - `.ai/memory/decisions.md`：长期决策与边界
- 确认根因、踩坑、长期决策、关键进度后，主动更新对应记忆文件

## 智能联动

- 接到任务后，先判断任务类型，再读取相关 memory、规则、文档
- 播放器任务：优先读取 `.ai/memory/pitfalls.md`、`.ai/memory/progress.md`、`docs/runbooks/player.md`
- 消息链路任务：优先读取 `docs/runbooks/messages.md` 和 `src/shared/messages.ts`
- 发布任务：读取 `.ai/rules/release.md`
- 提交信息任务：读取 `.ai/rules/git-commit-message.md`
- 调试运行时 bug：读取 `.ai/rules/debugging.md`，用本地日志服务器收集日志
- 任务中断、验证结果、下一步计划写入 `.ai/memory/progress.md`
- 已确认无效方案、误判、踩坑写入 `.ai/memory/pitfalls.md`
- 长期稳定决策、模块边界、协作约定写入 `.ai/memory/decisions.md`

## 职责划分

- `.ai/rules/project-baseline.md`：必须遵守的核心规则
- `.ai/memory/*.md`：项目 AI 记忆，不放硬规则
- `docs/`：项目说明、模块地图、runbook，不放强制执行规则
- `README.md`：面向用户的简介与使用说明
- 其他 `.ai/rules/*.md`：发布、提交信息等按需规则

## 工作原则

- 改代码前先看当前文件，再看相关代码，不做无范围全库搜索
- 先理解再改；优先小改、稳改
- 只改当前需求涉及的功能与边界，不顺手重构或扩展需求
- 涉及共享模块、稳定功能、消息、状态、播放器核心链路时，先确认隔离边界
- 疑难问题先记录事实、排除项、已试无效方案，再动手修
- 多次试错或会影响后续排查的结论，必须同步 `.ai/memory/pitfalls.md`

## Chrome 扩展边界

- 新增或修改 `chrome.runtime` 消息时，同步更新 `src/shared/messages.ts`
- 修改 content script、background、注入脚本时，先确认执行环境：extension / page / isolated / MAIN world
- 涉及动态 `import()`、Vite chunk、`chrome-extension://`、`/assets/*` 时，先检查运行环境与 `dist/.vite/manifest.json`

## 验证

- 普通功能、UI、业务逻辑修改后，先执行 `pnpm test`，再执行 `pnpm build`
- 构建配置、manifest、入口加载、动态 import、资源路径相关修改后，先执行 `pnpm build`，再执行 `pnpm test`
- 仅修改文档、`.ai/rules/*.md`、`.ai/memory/*.md` 时，不默认构建，除非影响构建判断或用户要求
- 构建汇报用中文，包含：结果 / 命令 / 关键报错 / 是否继续修复

## 安全

- 不泄露密钥、账号、环境信息
- 不做未经确认的破坏性操作
- 不主动提交 Git，除非用户明确要求
