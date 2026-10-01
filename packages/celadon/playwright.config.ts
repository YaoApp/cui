import { defineConfig } from '@playwright/test'

const PORT = 5199
const BASE_URL = process.env.CUI_BASE_URL || `http://localhost:${PORT}`

export default defineConfig({
  testDir: 'app/src',
  // 后缀即分工：只认 *.browser.ts。*.test.* 交给 vitest、*.agent.* 交给 pnpm test:persona
  //（三个 runner 的默认范围会重叠，必须各自收窄）。
  testMatch: '**/tests/**/*.browser.ts',
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
