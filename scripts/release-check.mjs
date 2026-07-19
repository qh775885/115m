import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'

const root = process.cwd()

function step(message) {
  console.log(`[check] ${message}`)
}

function fail(message) {
  console.error(`[fail] ${message}`)
  process.exit(1)
}

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
const manifestPath = resolve(root, 'dist', 'chrome-mv3', 'manifest.json')
if (!existsSync(manifestPath)) {
  fail('缺少 WXT 构建产物：dist/chrome-mv3/manifest.json，请先执行 pnpm zip')
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

if (pkg.version !== manifest.version) {
  fail(`版本不一致：package.json=${pkg.version}, 构建 manifest=${manifest.version}`)
}
step(`构建 manifest 版本一致：${pkg.version}`)

const zipPath = resolve(root, 'release', `115m-v${pkg.version}.zip`)
if (!existsSync(zipPath)) {
  fail(`缺少发布包：release/115m-v${pkg.version}.zip，请先执行 pnpm zip`)
}
step(`发布包存在：release/115m-v${pkg.version}.zip`)

try {
  execSync('gh auth status', { cwd: root, stdio: 'pipe' })
  step('gh 已登录，可继续发布 GitHub Release')
}
catch {
  fail('gh 未登录或已失效，请先执行 gh auth login')
}

const releaseDir = resolve(root, 'release')
const noteFileName = `release-notes-v${pkg.version}.txt`
const notePath = resolve(releaseDir, noteFileName)
if (!existsSync(notePath)) {
  fail(`缺少发布说明：release/${noteFileName}`)
}
const noteContent = readFileSync(notePath, 'utf8').trim()
if (!noteContent) {
  fail(`发布说明为空：release/${noteFileName}`)
}
step(`发布说明存在：release/${noteFileName}`)

const workflowPath = resolve(root, '.github/workflows/release-to-telegram.yml')
if (existsSync(workflowPath)) {
  step('已存在 Telegram 发布通知 workflow')
}

const releaseFiles = existsSync(releaseDir) ? readdirSync(releaseDir) : []
step(`release 目录文件数：${releaseFiles.length}`)
step('release check 通过')
