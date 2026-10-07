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
    // 浏览器默认语言固定为基准 zh-CN：语言跟随系统后，首个用例才不会因跑测机器而异；
    // 测"跟随系统"的用例自己用 page.addInitScript 覆盖 navigator.languages。
    locale: 'zh-CN', colorScheme: 'light' as const,
    trace: 'on-first-retry',
  },
  /* 两个服务：应用本体（所有用例的 baseURL）与设计稿预览 —— 比对设计稿的用例要读后者。
     不在这里一起起，CI 上就只有前端，那几条会以「连接被拒」失败（本地常常已经在跑，看不出来）。 */
  webServer: [
    {
      command: `pnpm dev --host 127.0.0.1 --port ${PORT} --strictPort`,
      url: BASE_URL,
      reuseExistingServer: true, // pm2 已经在同一端口跑着 dev
      timeout: 30_000,
    },
    {
      command: 'node design/serve.mjs',
      url: 'http://127.0.0.1:8080/',
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
})
