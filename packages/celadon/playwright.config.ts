import { defineConfig } from '@playwright/test'

const PORT = 5199
const BASE_URL = process.env.CUI_BASE_URL || `http://localhost:${PORT}`

export default defineConfig({
  testDir: 'app/src',
  // 只认浏览器用例。*.test.* 是单元用例，交给 vitest（两边默认范围重叠，必须收窄）。
  testMatch: '**/tests/**/*.spec.ts',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    channel: 'chrome', // 用本机 Chrome，避免下载 Playwright 自带浏览器
    trace: 'on-first-retry',
  },
  webServer: {
    command: `pnpm dev --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: true, // pm2 已经在同一端口跑着 dev
    timeout: 30_000,
  },
})
