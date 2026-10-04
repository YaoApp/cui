import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
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

/* **不许绕过脚本产出客户端那份**：`dist-client` 里必须是 `client=desktop`。
   直接 `vite build` 到 dist-client 会跳过清单改写（我就这么错过一次），这条把它拦住。 */
function assertClientManifest(outDirName: string | undefined) {
  if (outDirName !== 'dist-client') return
  const manifest = JSON.parse(readFileSync(resolve(import.meta.dirname, 'app/src/platform/manifest.json'), 'utf8'))
  if (manifest.client !== 'desktop') {
    throw new Error(
      `refusing to build into dist-client: the manifest says client=${manifest.client}. ` +
        "Use `pnpm build:client` (it rewrites the manifest for the client build), not vite build.",
    )
  }
}
assertClientManifest(process.env.CELADON_OUT_DIR)



export default defineConfig(({ mode }) => {
  /* 开发期把**引擎的接口路径**转发到后端（`16-development.md` §1/§3）。
     **地址不进代码**：`YAO_SERVER_HOST` 由运行环境给 —— shell 里直接给，或写进 `.env`（**要用 `loadEnv` 读**：
     Vite 只把 `VITE_` 前缀的注进 `import.meta.env`，**不写 `process.env`**，直接读 `process.env` 会静默拿不到）。 */
  const env = loadEnv(mode, import.meta.dirname, '')
  const proxyTarget = process.env.YAO_SERVER_HOST || env.YAO_SERVER_HOST
  const enginePaths = ['.well-known', 'v1']
  /* **代理挂在根路径**：dev 的请求路径必须与生产一致 —— 生产里引擎就在站点根下，
     带应用命名空间（`/app/v1/…`）的请求在生产并不存在。实测：根路径下代理先于 base 中间件生效。 */
  const devProxy: Record<string, ProxyOptions> = proxyTarget
    ? Object.fromEntries(enginePaths.map((path) => [`/${path}`, { target: proxyTarget, changeOrigin: true }]))
    : {}

  return {
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
  // 开发期代理（`YAO_SERVER_HOST` 没给就是空，等于不代理）
  server: { port: 5199, proxy: devProxy },
  preview: { port: 5199 },
}
})
