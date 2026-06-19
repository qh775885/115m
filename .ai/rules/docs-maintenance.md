# 文档与规则整理规则

- 先判断内容归属，再决定写入 `.ai/rules/*`、`.ai/memory/*` 或 `docs/*`
- `.ai/rules/project-baseline.md` 只保留必须始终遵守的短规则
- `.ai/rules/*.md` 放特定任务才需要的规则，不重复维护同一条规则
- `.ai/memory/*.md` 只保留会影响后续工作的结论、边界、进度、踩坑
- `docs/runbooks/*.md` 只保留固定流程或复杂步骤清单
- 已废弃入口、工具迁移、普通流水账不要写入记忆
- 规则文案尽量短、能直接执行；复杂解释放 runbook
