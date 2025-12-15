import fs from 'node:fs'
import path from 'node:path'
import transformer from '@libmedia/cheap/build/transformer'
import typescript from '@rollup/plugin-typescript'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import monkey, { cdn, util } from 'vite-plugin-monkey'
import svgLoader from 'vite-svg-loader'
import PKG from './package.json'

const icons = {
  prod: 'https://115.com/favicon.ico',
  dev: 'https://vitejs.dev/logo.svg',
}
const _cdn = cdn.jsdelivrFastly

// https://vitejs.dev/config/
export default defineConfig({
  // 配置 Vite 缓存目录到 dist 下
  cacheDir: 'dist/.vite',
  build: {
    minify: false, // 开发模式不压缩
    // 不清理输出目录，保留以前的版本
    emptyOutDir: false,
  },
  optimizeDeps: {
    exclude: ['@libmedia/avplayer'],
  },
  plugins: [
    typescript({
      tsconfig: './tsconfig.app.json',
      transformers: {
        before: [
          {
            type: 'program',
            factory: (program) => {
              return transformer.before(program)
            },
          },
        ],
      },
    }),
    vue(),
    tailwindcss(),
    svgLoader(),
    monkey({
      entry: 'src/main.ts',
      userscript: {
        'name': PKG.name,
        'icon': icons.dev,
        'namespace': PKG.name,
        'author': PKG.author,
        'description': PKG.description,
        'run-at': 'document-start',
        'include': [
          'https://115.com/?ct*',
          'https://115.com/web/lixian/master/video/*',
          'https://115.com/?aid*',
          'https://dl.115cdn.net/video/token',
        ],
        'exclude': [
          'https://*.115.com/bridge*',
          'https://*.115.com/static*',
          'https://q.115.com/*',
        ],
        'connect': [
          '115.com',
          '115vod.com',
          'aps.115.com',
          'webapi.115.com',
          'proapi.115.com',
          'cpats01.115.com',
          'dl.115cdn.net',
          'cdnfhnfile.115cdn.net',
          'v.anxia.com',
          'subtitlecat.com',
          'javbus.com',
          'javdb.com',
          'jdbstatic.com',
          'missav.ws',
        ],
        'resource': {
          icon: 'https://115.com/favicon.ico',
        },
      },
      build: {
        // 开发版：生成完整的脚本（包含头部），后续会提取并修改
        fileName: 'script.user.js',
        externalGlobals: {
          'vue': _cdn('Vue', 'dist/vue.global.prod.js'),
          'localforage': _cdn('localforage', 'dist/localforage.min.js'),
          'lodash-es': _cdn('_', 'lodash.min.js'),
          'big-integer': _cdn('bigInt', 'BigInteger.min.js').concat(
            util.dataUrl(';window.bigInt=bigInt;'),
          ),
          'blueimp-md5': _cdn('md5', 'js/md5.min.js'),
          'dayjs': _cdn('dayjs', 'dayjs.min.js').concat(
            util.dataUrl(';window.dayjs=dayjs;'),
          ),
          'hls.js': _cdn('Hls', 'dist/hls.min.js'),
          'm3u8-parser': _cdn('m3u8Parser', 'dist/m3u8-parser.min.js'),
          'photoswipe': _cdn(
            'photoswipe',
            'dist/umd/photoswipe.umd.min.js',
          ).concat(util.dataUrl(';window.photoswipe=PhotoSwipe;')),
          'photoswipe/lightbox': _cdn(
            'PhotoSwipeLightbox',
            'dist/umd/photoswipe-lightbox.umd.min.js',
          ).concat(
            util.dataUrl(';window.PhotoSwipeLightbox=PhotoSwipeLightbox;'),
          ),
        },
      },
    }),
    // 构建完成后：清理缓存
    {
      name: 'manage-cache',
      closeBundle() {
        /** 清理所有缓存 */
        const cachePaths = [
          path.resolve('dist', '.rollup.cache'),
          path.resolve('dist', '.vite'),
          path.resolve('.rollup.cache'),
        ]

        cachePaths.forEach((cachePath) => {
          if (fs.existsSync(cachePath)) {
            try {
              fs.rmSync(cachePath, { recursive: true, force: true })
              // eslint-disable-next-line node/prefer-global/process
              console.log(`🧹 已清理缓存: ${path.relative(process.cwd(), cachePath)}`)
            }
            catch (error) {
              console.warn(`⚠️  清理缓存失败: ${cachePath}`, error)
            }
          }
        })
      },
    },
    // 开发模式构建后：提取脚本头，添加 file:/// 引用，生成开发版脚本头文件
    {
      name: 'dev-userscript-header',
      closeBundle() {
        const pkgInfo = PKG
        const fullScriptPath = path.resolve('dist', 'script.user.js')

        if (!fs.existsSync(fullScriptPath)) {
          console.warn('⚠️  警告: script.user.js 不存在，可能构建失败')
          return
        }

        /** 读取 vite-plugin-monkey 生成的完整脚本（包含完整脚本头） */
        const fullScript = fs.readFileSync(fullScriptPath, 'utf8')

        /** 提取脚本头和主体代码 */
        const headerEndMarker = '// ==/UserScript=='
        const headerEndIndex = fullScript.indexOf(headerEndMarker)

        if (headerEndIndex === -1) {
          console.warn('⚠️  警告: 未找到脚本头结束标记')
          return
        }

        /** 提取完整的脚本头（包含结束标记） */
        const originalHeader = fullScript.substring(0, headerEndIndex + headerEndMarker.length)

        /** 提取主体代码 */
        let scriptBody = fullScript.substring(headerEndIndex + headerEndMarker.length)
        scriptBody = scriptBody.replace(/^\s*\n/, '') // 去掉开头的换行符

        // 保存主体代码到 script.user.js（只保留代码，不包含头部）
        fs.writeFileSync(fullScriptPath, scriptBody, 'utf8')

        /** 修改脚本头：将版本号改为 dev，名称加上 [开发版]，图标改为开发图标 */
        let devHeader = originalHeader
          .replace(/\/\/ @version\s+[^\n]+/i, `// @version      dev`)
          .replace(/\/\/ @name\s+([^\n]+)/i, (match, name) => {
            // 如果已经有 [开发版]，不重复添加
            if (name.includes('[开发版]')) {
              return match
            }
            return `// @name         ${name.trim()} [开发版]`
          })
          .replace(/\/\/ @icon\s+[^\n]+/i, `// @icon         ${icons.dev}`)
          .replace(/\/\/ @description\s+([^\n]+)/i, (match, desc) => {
            /** 添加开发版说明（如果还没有） */
            const trimmedDesc = desc.trim()
            if (!trimmedDesc.includes('开发版')) {
              return `// @description  ${trimmedDesc} [开发版 - 修改代码后重新运行 'pnpm dev:build' 即可热更新]`
            }
            return match
          })

        /** 在 @grant 之前添加 @require file:/// 引用本地文件 */
        const scriptPath = fullScriptPath.replace(/\\/g, '/')
        const fileUrl = `file:///${scriptPath}`

        /** 查找 @grant 的位置，在它之前插入 @require file:/// */
        const grantMatch = devHeader.match(/(\/\/ @grant\s+)/i)
        if (grantMatch) {
          const grantIndex = grantMatch.index!
          devHeader = `${devHeader.substring(0, grantIndex)}// @require      ${fileUrl}\n${devHeader.substring(grantIndex)}`
        }
        else {
          /** 如果没有 @grant，在 @run-at 之前添加 */
          const runAtMatch = devHeader.match(/(\/\/ @run-at\s+)/i)
          if (runAtMatch) {
            const runAtIndex = runAtMatch.index!
            devHeader = `${devHeader.substring(0, runAtIndex)}// @require      ${fileUrl}\n${devHeader.substring(runAtIndex)}`
          }
          else {
            // 如果都没有，在脚本头结束之前添加
            devHeader = devHeader.replace(
              /(\/\/ ==\/UserScript==)/,
              `// @require      ${fileUrl}\n$1`,
            )
          }
        }

        // 添加开发版说明注释
        devHeader += '\n\n// 开发版 - 实际代码将从本地文件加载\n'
        devHeader += `// 文件路径: ${scriptPath}\n`

        /** 写入开发版脚本头文件（只包含脚本头，不包含主体代码） */
        const devScriptPath = path.resolve('dist', `${pkgInfo.name}-dev.user.js`)
        fs.writeFileSync(devScriptPath, devHeader, 'utf8')

        console.log(`✅ 开发版脚本头已生成: ${pkgInfo.name}-dev.user.js`)
        console.log(`✅ 主体代码已提取到: script.user.js`)
        console.log(`🚀 请安装脚本头到油猴，修改代码后重新运行 'pnpm dev:build' 即可热更新`)
      },
    },
  ],
})
