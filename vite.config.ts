import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import manifest from './manifest.json'

const __dirname = dirname(fileURLToPath(import.meta.url))

const autoReloadExtensionPlugin = () => ({
  name: 'auto-reload-extension',
  handleHotUpdate({ server, file }) {
    const isBgOrShared = file.includes('src/background') || file.includes('src/shared') || file.includes('manifest.json')
    if (isBgOrShared) {
      server.ws.send({ type: 'custom', event: 'extension-reload' })
    }
  },
  writeBundle() {
    // 适配 watch 模式，当构建写完文件后，也触发一个刷新信号（如果有 dev server 在运行）
    // 注意：watch 模式没有 websocket client 注入，所以扩展需要别的方式监听
    // 为了支持完全的 watch 模式自动重载，通常需要一个独立的 websocket 服务
  }
})

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@lib': resolve(__dirname, 'src/lib'),
    },
  },
  plugins: [
    tailwindcss(),
    crx({ manifest }),
    autoReloadExtensionPlugin(),
  ],
  build: {
    rollupOptions: {
      input: {
        player: resolve(__dirname, 'src/player/index.html'),
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 5173,
    },
    cors: {
      origin: '*',
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
      preflightContinue: true,
      credentials: true,
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, PUT, PATCH, POST, DELETE',
      'Access-Control-Allow-Headers': '*',
    },
  },
})
