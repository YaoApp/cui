import { defineConfig } from 'vite'
import { resolve } from 'node:path'

/* v2 的应用根在 app/，产物出到 celadon/dist/（供桌面壳取用）。
   这一版**刻意不引入任何框架** —— 框架选型是独立决策，先证明工具链本身通。 */
export default defineConfig({
  root: resolve(__dirname, 'app'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
  },
  server: { port: 5199 },
  preview: { port: 5199 },
})
