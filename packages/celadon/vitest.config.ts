import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': resolve(import.meta.dirname, 'app/src') } },
  test: {
    environment: 'jsdom',
    // 只认单元用例。*.spec.ts 是浏览器用例，交给 Playwright ——
    // 两个工具的默认范围都同时含 test 与 spec，不收窄就会互相误抓（见 plan/20）。
    // 单元用例与源文件同目录，所以不限定 tests/；*.browser.ts 与 *.agent.* 另有归属，不会误抓
    include: ['app/src/**/*.test.{ts,tsx}'],
    setupFiles: ['app/src/test-support/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['app/src/**'],
      exclude: ['app/src/**/tests/**', 'app/src/test-support/**', 'app/src/main.tsx', '**/*.less', '**/*.css'],
    },
  },
})
