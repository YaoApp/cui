/* **客户端开发模式**：与 `build:client` 同一套规则，把这一构建的事实（`client=desktop` 等）用环境
   交给 vite 注入（见 `vite.config.ts` 的 `manifestOverrides`），**不动源文件**。这样 Web 的开发服务
   可以同时在跑，两边各自的清单互不干扰；单元测试读到的也仍是源文件里的 `client=web`。

   客户端开发服务默认 5210，与 Web 的 5199 分开（可用 `CUI_DEV_PORT` 覆盖）。

   用法：要 HMR 时手动 `pnpm dev:client`，再把壳的 `devUrl` 临时指过来；壳默认不调它，
   默认路线是 `pnpm build:client` 产出的 `dist-client`（见 `celadon-desktop/README.md`）。
 */

import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkg = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const { scanLocales } = await import('./build-locales.mjs')

/* 桌面目标系统：打包与开发用同一个映射 */
const os = process.platform === 'darwin' ? 'macos' : process.platform === 'win32' ? 'windows' : ''
const port = process.env.CUI_DEV_PORT || '5210'
console.log(`dev:client — client=desktop · os=${os || '(未知)'} · port=${port}`)

const dev = spawn(process.execPath, [resolve(pkg, 'node_modules/vite/bin/vite.js')], {
  cwd: pkg,
  stdio: 'inherit',
  env: {
    ...process.env,
    CUI_BASE: '', // 客户端就是根：base '/' —— dev 的请求路径与生产一致（引擎在站点根下）,
    CUI_CLIENT: 'desktop',
    CUI_OS: os,
    // **locales 不是手写的**：按语言包目录扫出来（加语言只加目录，见 08-i18n.md）
    CUI_LOCALES: scanLocales().join(','),
    CUI_BUILD_BY: 'celadon dev:client',
    CUI_DEV_PORT: port,
  },
})
dev.on('exit', (code) => process.exit(code ?? 0))
