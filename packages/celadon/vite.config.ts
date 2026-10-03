import { execFileSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

/* v2 的应用根在 app/，源码在 app/src/（再下一层是刻意的：app/ 是 Vite root，
   它的目录名就是公开 URL，直接用 components/ 会撞上引擎的保留前缀）。
   产物出到 celadon/dist/ 供桌面壳取用。 */
/* 应用跑在**构建决定的命名空间**之下（见 architecture/04 · 07）：命名空间即 base，根不属于应用。
   默认 'app'（→ /app/）；换一个构建（如 myself）用 CUI_BASE 覆盖。路由 basename 取同一个值，
   **两端一致**：Web 由引擎托管，桌面壳把产物挂在同一个命名空间下。 */
const ns = (process.env.CUI_BASE ?? 'app').replace(/^\/+|\/+$/g, '')
/* 空命名空间 = 应用就是根（桌面壳把产物挂在根下）：`/` 而不是 `//` */
const base = ns ? `/${ns}/` : '/'

/* 构建收尾：把语言包**另出一份给宿主读**（`<outDir>/locales/*.json` + `index.json`，见 08-i18n.md）。
   放在配置里而不是 package.json，是为了**跟 outDir 走**（产物目录改了它自动跟上）。 */
const emitHostLocales = {
  name: 'celadon-emit-host-locales',
  closeBundle() {
    execFileSync(process.execPath, [resolve(import.meta.dirname, 'scripts/build-locales.mjs')], {
      stdio: 'inherit',
    })
  },
}

export default defineConfig({
  root: resolve(import.meta.dirname, 'app'),
  base,
  plugins: [react(), emitHostLocales],
  resolve: {
    alias: { '@': resolve(import.meta.dirname, 'app/src') },
  },
  build: {
    /* 产物目录可由环境改（客户端那份走 dist-client，见 scripts/build-client.mjs） */
    outDir: resolve(import.meta.dirname, process.env.CELADON_OUT_DIR ?? 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    // 引擎把 /assets 列为保留前缀 —— 产物静态目录不能用默认名
    assetsDir: '_assets',
  },
  server: { port: 5199 },
  preview: { port: 5199 },
})
