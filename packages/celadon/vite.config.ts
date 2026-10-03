import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

/* v2 的应用根在 app/，源码在 app/src/（再下一层是刻意的：app/ 是 Vite root，
   它的目录名就是公开 URL，直接用 components/ 会撞上引擎的保留前缀）。
   产物出到 celadon/dist/ 供桌面壳取用。 */
/* 应用挂在**构建决定的段**下（见 architecture/04 · 07）：段名即 base，根不属于应用。
   默认 'app'（→ /app/）；换一个构建（如 myself）用 CUI_BASE 覆盖。路由 basename 取同一个值，
   **两端一致**：Web 由引擎托管，桌面壳把产物挂到同一段下。 */
const segment = (process.env.CUI_BASE ?? 'app').replace(/^\/+|\/+$/g, '')
const base = `/${segment}/`

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
  server: { port: 5199 },
  preview: { port: 5199 },
})
