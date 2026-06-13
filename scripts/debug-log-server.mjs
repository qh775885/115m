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
      try {
        const { tag, data } = JSON.parse(body)
        const time = new Date().toTimeString().slice(0, 8)
        console.log(`[${time}] [${tag}] ${data}`)
      } catch { console.log('[parse-error]', body) }
      res.writeHead(200); res.end('ok')
    })
  }
})

server.listen(19115, () => console.log('Log server: http://localhost:19115'))
