import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'

const root = process.cwd()

function ok(message) {
  console.log(`[ok] ${message}`)
}

function warn(message) {
  console.log(`[warn] ${message}`)
}

function fail(message) {
  console.error(`[fail] ${message}`)
  process.exitCode = 1
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

const packagePath = resolve(root, 'package.json')
const manifestPath = resolve(root, 'manifest.json')
const projectBaselinePath = resolve(root, '.ai/rules/project-baseline.md')
const releaseRulePath = resolve(root, '.ai/rules/release.md')
const docsRunbookPath = resolve(root, 'docs/runbooks/docs.md')
const messagesRunbookPath = resolve(root, 'docs/runbooks/messages.md')
const playerRunbookPath = resolve(root, 'docs/runbooks/player.md')

if (!existsSync(packagePath)) fail('缺少 package.json')
if (!existsSync(manifestPath)) fail('缺少 manifest.json')

const pkg = readJson(packagePath)
const manifest = readJson(manifestPath)

if (pkg.version === manifest.version) ok(`package.json 与 manifest.json 版本一致：${pkg.version}`)
else fail(`版本不一致：package.json=${pkg.version}, manifest.json=${manifest.version}`)

if (existsSync(projectBaselinePath)) ok('已存在项目核心规则')
else fail('缺少 .ai/rules/project-baseline.md')

if (existsSync(releaseRulePath)) ok('已存在发布规则')
else warn('缺少 .ai/rules/release.md')

if (existsSync(docsRunbookPath)) ok('已存在文档维护 runbook')
else warn('缺少 docs/runbooks/docs.md')

if (existsSync(messagesRunbookPath)) ok('已存在消息链路 runbook')
else warn('缺少 docs/runbooks/messages.md')

if (existsSync(playerRunbookPath)) ok('已存在播放器 runbook')
else warn('缺少 docs/runbooks/player.md')

try {
  const branch = execSync('git branch --show-current', { cwd: root, encoding: 'utf8' }).trim()
  ok(`当前分支：${branch}`)
}
catch {
  warn('当前目录不是可用的 git 环境，或 git 不可用')
}

try {
  const pnpmVersion = execSync('pnpm --version', { cwd: root, encoding: 'utf8' }).trim()
  ok(`pnpm 可用：${pnpmVersion}`)
}
catch {
  fail('pnpm 不可用')
}

try {
  const ghStatus = execSync('gh auth status', { cwd: root, encoding: 'utf8', stdio: 'pipe' })
  ok('gh 已登录')
  if (ghStatus.includes('Active account')) ok('gh 当前账户可用')
}
catch {
  warn('gh 未登录或登录失效，发布 GitHub Release 前需重新认证')
}

const releaseDir = resolve(root, 'release')
if (existsSync(releaseDir)) ok('存在 release 目录')
else warn('release 目录不存在，执行 pnpm zip 后会自动创建')
