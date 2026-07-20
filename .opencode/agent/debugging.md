---
description: 用于追踪和记录调试日志。当需要收集前端、后台、插件环境的日志时使用
mode: subagent
---
# 调试日志规范

## 全局日志收集器

由于需要收集 content script / background / main world 多环境日志时，请使用本地 HTTP 日志服务器，这避免了用户手动收集日志。

### 流程

1. 本地临时日志服务器在 `scripts/debug-log-server.mjs`，Node.js HTTP服务，端口 `localhost:19115`。
2. 需要采日志的代码处注入临时 `debugLog` 函数，通过 `fetch POST` 上报
3. 用 `RunCommand`（blocking: false）后台运行，用 `CheckCommandStatus` 实时查看日志
4. 调试完成后**务必撤销所有临时 debugLog 函数和日志上报脚本**，不要提交测试代码设施

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

### 提交前清理

- `grep -r "localhost:19115" src/` 确保无残留
- `grep -r "debug-log-server" scripts/` 确保无残留
- 日志上报脚本不要加入 Git