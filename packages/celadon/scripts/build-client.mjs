/* **为客户端（桌面壳）构建**一份独立产物 —— 与 Web 那份分开：
 *
 *   pnpm build           → dist/          （Web：清单 client=web，谁都能开）
 *   pnpm build:client    → dist-client/   （客户端：清单注入这一构建的事实，壳只吃这份）
 *
 * 为什么要注入清单：`client` 决定能力开关与"宿主在否"（见 08/15）。**壳不猜**，读清单。
 * 注入走环境（`CUI_CLIENT` 等，见 `vite.config.ts` 的 `manifestOverrides`），**不动源文件**，
 * 于是并行跑着的 Web 构建与单元测试读到的仍是基础清单。
 */

import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkg = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const { scanLocales } = await import('./build-locales.mjs')

/** 目标系统：`--os macos|windows` 或环境 `CELADON_OS`，缺省按构建机。 */
function targetOs() {
  const flag = process.argv.indexOf('--os')
  const asked = flag >= 0 ? process.argv[flag + 1] : process.env.CELADON_OS
  if (asked === 'macos' || asked === 'windows') return asked
  return process.platform === 'darwin' ? 'macos' : process.platform === 'win32' ? 'windows' : ''
}

const os = targetOs()
if (!os) {
  console.error('build:client — 只支持 macOS 与 Windows（用 --os macos|windows 指定）')
  process.exit(1)
}

const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim()
console.log(`build:client — client=desktop · os=${os} · commit=${commit}`)

execFileSync(process.execPath, [resolve(pkg, 'node_modules/vite/bin/vite.js'), 'build'], {
  cwd: pkg,
  stdio: 'inherit',
  env: {
    ...process.env,
    // **桌面：应用就是根**（`CUI_BASE=''` → base `/`，资源在 `/assets/*`）。
    // Web 那份仍挂 `/app/` —— 两份构建本来就分开，各按自己的挂载点来。
    CELADON_OUT_DIR: 'dist-client',
    CUI_BASE: '',
    CUI_CLIENT: 'desktop',
    CUI_OS: os,
    // **locales 不是手写的**：按语言包目录扫出来（加语言只加目录，见 08-i18n.md）
    CUI_LOCALES: scanLocales().join(','),
    CUI_BUILD_COMMIT: commit,
    CUI_BUILD_BY: 'celadon build:client',
  },
})
console.log('build:client — 产物在 dist-client/')
