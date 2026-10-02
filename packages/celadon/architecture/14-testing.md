# 14 · 测试（工程落点）

- **状态**：✅ 已落地
- **规则与 QA 流程的权威副本**：[`../plan/20-testing.md`](../plan/20-testing.md)（本册**不复述**，只写工程落点）

## 栈与位置

- 栈：**`vitest`** + `@testing-library/react` · `user-event` · `jest-dom` · `jsdom` · `@vitest/coverage-v8` + **`@playwright/test`**。
- **单元用例与源文件同目录**；**浏览器用例与拟人剧本进 `features/<域>/tests/`**。两条都由 `check-app-layout` 强制（各带正反样本）。
- 后缀即分工：`*.test.ts(x)` · `*.browser.ts` · `<场景>.agent.md` + `<场景>.agent.mjs`；**一个场景一个文件**。
- 拟人只属于 feature：剧本三段（**剧本恒定 · 修改记录 · 测试记录**）+ 同场景的**采集脚本** `<场景>.agent.mjs`（开浏览器走剧本 · 截图 · 报客观测量）；
  每轮结果明细看日志、不复制进剧本；
  截图落 `app/logs/<日期>/shots/<场景>/`，统一走 `scripts/shots.mjs`（见 `02` 脚本表）。
- 共享测试支持放 `app/src/test-support/`，**不放组件目录内** —— 组件目录只放该组件自己的用例。
- **不设覆盖率阈值**（阈值会诱导写无意义断言）。

## 配置与命令

- `vitest.config.ts`：`jsdom` · `include: ['app/src/**/*.test.{ts,tsx}']` · setup 用 `test-support/setup.ts` · 覆盖率排除用例与样式。
- `playwright.config.ts`：`testMatch: '**/tests/**/*.browser.ts'` · `channel: 'chrome'`（不下载浏览器）· `reuseExistingServer` 复用已在跑的 dev。
- **三个 runner 的默认匹配范围会重叠，配置必须显式收窄**，否则互相误抓。
- `test-support/stores.ts`：按 `*.store.ts` 自动发现所有 store、登记初始状态并逐用例复位 ——
  **组件 / feature / 平台层都覆盖**，`setup.ts` 不写清单（`stores.test.ts` 断言它跨层）。
- 命令：`pnpm test` · `pnpm test:browser` · `pnpm test:checkers` · `pnpm test:persona` · `pnpm test:all`。
- **CI**：门禁 + 单元 + 构建进 `celadon-test-build.yml`；浏览器测试单独 `celadon-browser-test.yml`
  （用 runner 自带的 Google Chrome，不必 `playwright install`；失败上传轨迹与截图）。runner 与 action 版本见 `13`。

## 运行时输出一律英文

脚本的 `console` 输出、报错、用例名一律英文（CI 与测试面向所有贡献者）；注释与 `plan/` `design/` `architecture/` 文档仍用中文。

## 日志

落在 **`app/logs/<系统日期>/<名>-<HHMM>.log`**（git 忽略），屏幕与文件双写，退出码原样透传；实现是 `scripts/run-logged.mjs`。

| 日志名 | 命令 |
| --- | --- |
| `gates-1355.log` | `pnpm check`（带日志的外壳，真正的检查链在 `pnpm check:run`）|
| `checkers-1355.log` | `pnpm test:checkers` |
| `unit-1355.log` | `pnpm test` |
| `browser-1355.log` | `pnpm test:browser` |
| `all-1355.log` | `pnpm test:all`（整条链）|
| `<场景>-1355.log` | `pnpm test:persona`（一个场景一份，如 `structure-trial-1355.log`）|

- 时间取系统日期与时分，**不做时区换算**；同一分钟内重跑同名文件会覆盖。
- **保留 14 天**：顺带清理超期的 `YYYY-MM-DD` 日期目录（别的不碰），`CUI_LOG_KEEP_DAYS` 可调。
- 找最新：`ls -1t app/logs/*/*.log | head -1`。
- **CI 摘要**：workflow 末尾 `if: always()` 的步骤把 `app/logs/*/*.log` 折进 `$GITHUB_STEP_SUMMARY`，红绿都能直接读，不必下 artifact。
  **摘要必须纯文本** —— job 级 `FORCE_COLOR=0` 关色（**只设这一个**：与 `NO_COLOR` 同设 node 会告警），
  写摘要时再用 `sed` 剥离转义码并去掉 `\r` 兜底（这一道不依赖工具行为）。
- 日志在 dev 下可按 URL 读到，**可接受**；生产只发 `dist/`（已用哨兵实测：`app/` 下的 `.md`/`.log`/`.txt` 一个都不进 `dist/`）。
  `pnpm test:watch` 是交互式的，不进日志。

## 待做

- 搬入模块补测试 · 拟人剧本覆盖到后续模块（见 [`../plan/01`](../plan/01-infrastructure.md) §3）。
