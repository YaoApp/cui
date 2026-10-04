/* **客户端开发模式**：与 `build:client` 同一套规则 —— 先把清单改成"这一构建的事实"，
   再起 dev server，**退出时还原**。没有这一步，壳里的应用会把自己当 Web（清单说 client=web）。
 *
 * 用法：`pnpm dev:client`（桌面壳的 `beforeDevCommand` 用它）
 */

import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkg = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = resolve(pkg, 'app/src/platform/manifest.json')
const original = readFileSync(manifestPath, 'utf8')
const { scanLocales } = await import('./build-locales.mjs')

const manifest = JSON.parse(original)
manifest.client = 'desktop'
manifest.os = process.platform === 'darwin' ? 'macos' : process.platform === 'win32' ? 'windows' : ''
manifest.artifact = 'cui'
// **locales 不是手写的**：按语言包目录扫出来（加语言只加目录，见 08-i18n.md）
manifest.locales = scanLocales()
manifest.build = { commit: 'dev', at: new Date().toISOString(), by: 'celadon dev:client' }
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
console.log(`dev:client — client=desktop · os=${manifest.os || '(未知)'}（退出时还原清单）`)

const restore = () => {
  writeFileSync(manifestPath, original)
  console.log('dev:client — 清单已还原')
}
process.on('exit', restore)
process.on('SIGINT', () => process.exit(130))
process.on('SIGTERM', () => process.exit(143))

const dev = spawn(process.execPath, [resolve(pkg, 'node_modules/vite/bin/vite.js')], {
  cwd: pkg,
  stdio: 'inherit',
  env: { ...process.env, CUI_BASE: '' }, // 客户端就是根：base '/' —— dev 的请求路径与生产一致（引擎在站点根下）,
})
dev.on('exit', (code) => process.exit(code ?? 0))
