import { defineConfig } from '@playwright/test'

const PORT = 5199
const BASE_URL = process.env.CUI_BASE_URL || `http://localhost:${PORT}`

/* 远程浏览器：测试机上跑 `playwright run-server`，这里给 WebSocket 端点。
   指定后默认的 browser/context/page 用远端浏览器，`channel` 必须让位、由服务端决定用什么浏览器。
   本机与 CI 不设这个变量，仍走本机 Chrome。 */
const BROWSER_WS = process.env.CUI_BROWSER_WS || process.env.PW_TEST_CONNECT_WS_ENDPOINT

/* 临时起的 dev 服务要绑到浏览器能访问的接口上：远程浏览器在测试机，只绑回环地址它够不着。
   本机（含 CI）保持只绑回环。 */
const DEV_HOST = BROWSER_WS ? '0.0.0.0' : '127.0.0.1'

export default defineConfig({
  testDir: 'app/src',
  // 后缀即分工：只认 *.browser.ts。*.test.* 交给 vitest、*.agent.* 交给 pnpm test:persona
  //（三个 runner 的默认范围会重叠，必须各自收窄）。
  testMatch: '**/tests/**/*.browser.ts',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    ...(BROWSER_WS ? { connectOptions: { wsEndpoint: BROWSER_WS } } : { channel: 'chrome' as const }),
    // 浏览器默认语言固定为基准 zh-CN：语言跟随系统后，首个用例才不会因跑测机器而异；
    // 测"跟随系统"的用例自己用 page.addInitScript 覆盖 navigator.languages。
    locale: 'zh-CN', colorScheme: 'light' as const,
    trace: 'on-first-retry',
  },
  /* 两个服务：应用本体（所有用例的 baseURL）与设计稿预览 —— 比对设计稿的用例要读后者。
     不在这里一起起，CI 上就只有前端，那几条会以「连接被拒」失败（本地常常已经在跑，看不出来）。 */
  webServer: [
    {
      command: `pnpm dev --host ${DEV_HOST} --port ${PORT} --strictPort`,
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
