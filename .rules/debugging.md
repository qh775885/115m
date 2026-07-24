# 调试日志规范

## 全局日志收集器

由于需要收集 content script / background / main world 多环境日志时，请使用本地 HTTP 日志服务器，这避免了用户手动收集日志。

### 流程

1. 本地临时日志服务器放在 `temp/<任务名>/debug-log-server.mjs`（或 `.dbg/`），Node.js HTTP，端口 `localhost:19115`。
2. 需要采日志的代码处注入临时 `debugLog` 函数，通过 `fetch POST` 上报。
3. 用终端后台启动日志服务并查看输出（各 AI 客户端用各自的后台命令方式即可）。
4. 调试完成后**务必撤销**所有临时 `debugLog` 与日志服务脚本，并删除本任务临时目录。

### 日志服务器模板

```javascript
// temp/<任务名>/debug-log-server.mjs
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

### 临时文件存放

- 与 `AGENTS.md` 一致：只放 `temp/`、`tmp/`、`.dbg/`（优先 `temp/<任务名>/`），**禁止**项目根目录。
- 日志、会话笔记、env、一次性 server 脚本均按此存放，便于整夹删除。

### 提交前 / 调试结束后清理

- `grep -r "localhost:19115" src/` 确保无残留
- 日志上报脚本不要加入 Git，也不要长期留在 `scripts/`
- 删除本任务产生的 `temp/`、`tmp/`、`.dbg/`、根目录 `debug-*` 等临时产物