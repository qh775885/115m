---
alwaysApply: false
description: 当排查复杂 Bug、需要注入临时代码收集浏览器或扩展日志、或启动本地日志服务器时，请智能应用此规则
---
# 调试日志规则

## 本地日志服务器

调试需要收集 content script / background / main world 的运行时日志时，使用本地 HTTP 日志服务器，避免让用户手动复制日志。

### 流程

1. 创建临时日志服务器 `scripts/debug-log-server.mjs`（Node.js HTTP，监听 `localhost:19115`）
2. 在需要采集日志的代码中注入临时 `debugLog` 函数，通过 `fetch POST` 上报
3. 用 `RunCommand`（blocking: false）启动服务器，用 `CheckCommandStatus` 实时查看日志
4. 调试完成后，**必须清除所有临时 debugLog 代码和日志服务器脚本**，不提交调试基础设施

### 日志服务器模板

```javascript
// scripts/debug-log-server.mjs
import { createServer } from 'node:http'

const server = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }
  if (req.method === 'POST' && req.url === '/log') {
    let body = ''
    req.on('data', c => body += c)
    req.on('end', () => {
      const { tag, data } = JSON.parse(body)
      const time = new Date().toTimeString().slice(0, 8)
      console.log(`[${time}] [${tag}] ${data}`)
      res.writeHead(200); res.end('ok')
    })
  }
})

server.listen(19115, () => console.log('Log server: http://localhost:19115'))
```

### 临时 debugLog 模板

```typescript
function debugLog(tag: string, data: unknown) {
  try {
    fetch('http://localhost:19115/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag, data: typeof data === 'string' ? data : JSON.stringify(data) }),
    }).catch(() => {})
  } catch { /* ignore */ }
}
```

### 提交前检查

- `grep -r "localhost:19115" src/` 确认无残留
- `grep -r "debug-log-server" scripts/` 确认无残留
- 日志服务器脚本不纳入 Git
