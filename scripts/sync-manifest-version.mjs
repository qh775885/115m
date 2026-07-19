import { copyFileSync, mkdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const packagePath = resolve(root, 'package.json')
const manifestPath = resolve(root, 'dist', 'chrome-mv3', 'manifest.json')

const pkg = JSON.parse(readFileSync(packagePath, 'utf8'))
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

if (!pkg.version) {
  throw new Error('package.json version is missing')
}

if (manifest.version !== pkg.version) {
  throw new Error(`generated manifest version mismatch: package.json=${pkg.version}, manifest.json=${manifest.version}`)
}

const zipName = `115m-v${pkg.version}.zip`
const zipPath = resolve(root, 'dist', zipName)
const releaseDir = resolve(root, 'release')
mkdirSync(releaseDir, { recursive: true })
copyFileSync(zipPath, resolve(releaseDir, zipName))
console.log(`[115m] published ${zipName} to release/`)
