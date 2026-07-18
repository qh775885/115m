---
alwaysApply: false
description: 新增、修改或排查 chrome.runtime 消息链路时使用此规则。
globs:
  - src/shared/messages.ts
  - src/background/**/*.ts
  - src/content/**/*.ts
  - src/player/core/*api*.ts
---
# 消息链路规则

- 消息结构先改 `src/shared/messages.ts`
- 不允许在业务文件里裸写一套新的消息结构
- 后台负责路由和协调，业务能力尽量落回对应模块
- 调用侧和处理侧必须同步更新
- 如果只是普通页面逻辑改动，不要因为命中文件范围就强行套用整套消息链路判断
