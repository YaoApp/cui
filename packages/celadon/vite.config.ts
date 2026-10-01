import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

/* v2 的应用根在 app/，源码在 app/src/（再下一层是刻意的：app/ 是 Vite root，
   它的目录名就是公开 URL，直接用 components/ 会撞上引擎的保留前缀）。
   产物出到 celadon/dist/ 供桌面壳取用。 */
/* 宿主按前缀挂载（见 architecture/04）—— 产物的资源路径必须跟着前缀走，
   否则只会在根路径下能跑、放到 /cui/ 这类子路径下就整页空白（实测过）。
   默认 '/' 让本地 dev / preview / 根路径部署不变；部署到前缀时用 CUI_BASE 覆盖，
   路由的 basename 取同一个值。 */
const base = process.env.CUI_BASE ?? '/'

export default defineConfig({
  root: resolve(import.meta.dirname, 'app'),
  base,
  plugins: [react()],
  resolve: {
    alias: { '@': resolve(import.meta.dirname, 'app/src') },
  },
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    // 引擎把 /assets 列为保留前缀 —— 产物静态目录不能用默认名
    assetsDir: '_assets',
  },
  /* dev 下 app/ 是 Vite root，root 内的文件按 URL 直接可取（含 app/logs）——
     这是开发期可接受的；**生产只发 dist/**，日志与源码都不进产物。 */
  server: { port: 5199 },
  preview: { port: 5199 },
})
