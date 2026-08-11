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
const generatedManifestPath = resolve(root, 'dist', 'chrome-mv3', 'manifest.json')
const projectBaselinePath = resolve(root, 'AGENTS.md')
const releaseRulePath = resolve(root, '.rules', 'release.md')
const debuggingRulePath = resolve(root, '.rules', 'debugging.md')
const devMemoryPath = resolve(root, '.rules', '迭代否决项.md')

if (!existsSync(packagePath)) fail('缺少 package.json')

const pkg = readJson(packagePath)
if (pkg.version) ok(`package.json 版本：${pkg.version}`)
else fail('package.json 缺少 version')

if (existsSync(generatedManifestPath)) {
  const manifest = readJson(generatedManifestPath)
  if (pkg.version === manifest.version) ok(`WXT 构建 manifest 版本一致：${pkg.version}`)
  else fail(`版本不一致：package.json=${pkg.version}, 构建 manifest=${manifest.version}`)
}
else warn('尚无 WXT 构建 manifest，执行 pnpm build 后可检查版本')

if (existsSync(projectBaselinePath)) ok('已存在项目核心规则')
else fail('缺少 AGENTS.md')

if (existsSync(releaseRulePath)) ok('已存在发布规则')
else warn('缺少 .rules/release.md')

if (existsSync(debuggingRulePath)) ok('已存在环境调试规则')
else warn('缺少 .rules/debugging.md')

if (existsSync(devMemoryPath)) ok('已存在迭代否决项')
else warn('缺少 .rules/迭代否决项.md')

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
