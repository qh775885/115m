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

// eslint-disable-next-line node/prefer-global/process
const env = process.env

const icons = {
  prod: 'https://115.com/favicon.ico',
  dev: 'https://vitejs.dev/logo.svg',
}
const isProd = env.NODE_ENV === 'production'
const _cdn = cdn.jsdelivrFastly

// https://vitejs.dev/config/
export default defineConfig({
  // 配置 Vite 缓存目录到 dist 下
  cacheDir: 'dist/.vite',
  build: {
    minify: 'terser',
    // 不清理输出目录，保留以前的版本
    emptyOutDir: false,
    terserOptions: {
      format: {
        // 保持合理的代码格式，避免单行过长
        max_line_len: 120,
        beautify: false,
        // 保持一定的换行，方便调试
        semicolons: true,
      },
      compress: {
        // 生产版：移除所有console（生产模式优化）
        drop_console: true,
        drop_debugger: true,
        // 其他压缩优化
        unused: true,
        dead_code: true,
        // 新增压缩选项
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2, // 多次压缩以获得更好的效果
        arrows: true, // 优化箭头函数
        arguments: true, // 优化 arguments
        booleans: true, // 优化布尔值
        collapse_vars: true, // 折叠变量
        comparisons: true, // 优化比较运算
        computed_props: true, // 优化计算属性
        conditionals: true, // 优化条件语句
        evaluate: true, // 求值常量表达式
        hoist_funs: true, // 提升函数声明
        hoist_vars: false, // 不提升变量声明（避免潜在问题）
        if_return: true, // 优化 if return
        join_vars: true, // 合并变量声明
        loops: true, // 优化循环
        negate_iife: true, // 优化立即执行函数
        properties: true, // 优化属性访问
        reduce_vars: true, // 减少变量引用
        sequences: true, // 使用逗号运算符合并语句
        side_effects: true, // 移除无副作用代码
        switches: true, // 优化 switch
        typeofs: true, // 优化 typeof
        unsafe: false, // 不使用不安全的优化
        unsafe_arrows: false, // 不使用不安全的箭头函数优化
        unsafe_comps: false, // 不使用不安全的比较优化
        unsafe_math: false, // 不使用不安全的数学优化
        unsafe_proto: false, // 不使用不安全的原型优化
      },
      mangle: {
        // 混淆变量名以减小体积
        safari10: true, // 修复 Safari 10 的 bug
        // 保留必要的导出
        reserved: ['exports', 'require', 'module'],
      },
    },
  },
  optimizeDeps: {
    exclude: ['@libmedia/avplayer'],
  },
  plugins: [
    typescript({
      // ref: https://zhaohappy.github.io/libmedia/docs/guide/quick-start#%E7%BC%96%E8%AF%91%E9%85%8D%E7%BD%AE
      // 配置使用的 tsconfig.json 配置文件
      // include 中需要包含要处理的文件
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
        'icon': isProd ? icons.prod : icons.dev,
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
        // 自动允许脚本跨域访问的域名
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
        fileName: `${PKG.name}-v${PKG.version}.user.js`,
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
  ],
})
