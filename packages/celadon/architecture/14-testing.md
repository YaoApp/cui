# 14 · 测试（工程落点）

- **状态**：✅ 依赖与位置已定 · ⏳ 落地待做
- **规则与 QA 流程的权威副本**：[`../plan/20-testing.md`](../plan/20-testing.md)（本册**不复述**）

## 规则

- 栈：**`vitest`** + `@testing-library/react` + `@testing-library/user-event` + **`jsdom`** + `@vitest/coverage-v8` + **`@playwright/test`**。
- **位置（强约束）**：用例一律放所在单元的 `tests/` 目录内 —— 组件是 `components/<名>/tests/`，
  feature 是 `features/<域>/tests/`；**源码目录里不得出现 `*.test.*` / `*.spec.*`**。
- **后缀即分工**：单元 / 组件 `*.test.ts(x)` · 浏览器 `*.spec.ts`。
- **两个工具的默认匹配范围重叠** —— `vitest` 默认 `**/*.{test,spec}.?(c|m)[jt]s?(x)` · `playwright` 默认 `**/*.@(spec|test).?(c|m)[jt]s?(x)`：
  **两边配置都要显式收窄**（`vitest` 的 `include` 只留 `*.test.*` · `playwright` 的 `testMatch` 只留 `*.spec.ts`），否则会互相误抓。
- **共享测试支持放 `app/src/test-support/`**（setup · 跨组件夹具 · 全局 store 重置），**不放组件目录内** —— 组件目录只放该组件自己的用例。
- **不设覆盖率阈值**（阈值会诱导写无意义断言）。
- 分层：规范门禁 → 单元/组件 → 浏览器 → 拟人剧本（判定权与工具见 `../plan/20-testing.md`）。

## 已落地（2026-10-01）

- `vitest.config.ts`：`jsdom` · `include: ['app/src/**/tests/**/*.test.{ts,tsx}']`（**只认单元用例**）·
  setup 用 `app/src/test-support/setup.ts` · 覆盖率排除用例与样式。
- `playwright.config.ts`：`testMatch: '**/tests/**/*.spec.ts'`（**只认浏览器用例**）· `channel: 'chrome'`（不下载浏览器）·
  `reuseExistingServer` 复用已在跑的 dev。
- `app/src/test-support/setup.ts`：`jest-dom` 匹配器 + 每个用例后卸载 DOM 与重置 store。
- 命令：`pnpm test` · `pnpm test:browser` · `pnpm test:checkers` · `pnpm test:all`。
- **CI**：规范门禁与单元测试进 `celadon-test-build.yml`（再进构建）；浏览器测试单独一份
  `celadon-browser-test.yml`（自带环境准备 —— 用 runner 自带的 Google Chrome，因此不必 `playwright install`；
  失败时上传轨迹与截图）。

## 运行时输出一律英文

CI 与测试的输出面向**所有贡献者**（含海外），因此脚本的 `console` 输出、报错、用例名一律英文；
注释与 `plan/` `design/` `architecture/` 文档仍用中文。检查器与用例都按这条写。

## 日志

三层各写一份，落在 **`app/logs/<本地日期>/<名>-<HHMM>.log`**（git 忽略），屏幕与文件双写，退出码原样透传：

| 日志名 | 命令 |
| --- | --- |
| `gates-1355.log` | `pnpm check`（七个检查器）|
| `checkers-1355.log` | `pnpm test:checkers` |
| `unit-1355.log` | `pnpm test` |
| `browser-1355.log` | `pnpm test:browser` |

> `pnpm check` 是带日志的外壳，真正的检查链在 `pnpm check:run` —— 这样它能和其它三层一样留痕。

实现是 `scripts/run-logged.mjs`（写命令 · 起止时间 · 退出码 · 用时）。

- **目录取系统日期、文件名取系统时分（精确到分钟），不做时区换算** —— 开发者侧日志，
  时间戳就是 `2026-10-01 13:56:32`，看日志的人自己知道那是几点。
- **同一分钟内重复跑同一层会覆盖同名文件**（精确到分钟即此意）；要更细就加秒，但会成倍产生小文件。
- **保留 14 天**：每次运行顺带清理超期的日期目录（只认 `YYYY-MM-DD` 形状的目录，别的不碰）；
  可用 `CUI_LOG_KEEP_DAYS` 调。
- 找最新：`ls -1t app/logs/*/*.log | head -1`。
- **CI 里这些日志会自动进运行摘要**：两份 workflow 最后都有一句 `if: always()` 的步骤，
  把 `app/logs/*/*.log` 折进 `$GITHUB_STEP_SUMMARY`（折叠块包住），红绿都能在运行页直接读到，
  不必下载 artifact。artifact 里另带 `test-results/` 的轨迹与截图。
- **摘要里必须是纯文本**：vitest 在 CI 上会着色，ANSI 转义码在 Markdown 视图里变成可见的乱码字符。
  两道处理 —— job 级 `NO_COLOR=1` + `FORCE_COLOR=0` 从源头关色；写摘要时再用 `sed` 剥掉转义码
  并去掉 `\r`（**这一道不依赖任何工具行为，是兜底**）。注意本地复现不出这个问题：stdout 是管道时
  vitest 自己就关色了，只有 CI 上才着色。
- 体积：一天约十几份、几十 KB，14 天量级在几 MB 内。

> **dev 下 `app/logs/` 能被 URL 直接读到，这是可以接受的** —— 它绑在 `0.0.0.0`，root 内文件按 URL 可取。
> **真正的保证在生产：只发 `dist/`** —— 已用哨兵实测：往 `app/` 下放 `.md` / `.log` / `.txt`，
> 构建后 `dist/` 里只有 `index.html` 与 `_assets` 下的产物，一个都没进去。
> `pnpm test:watch` 是交互式的，不进日志。

## 待做

- 搬入模块补测试 · 首条拟人剧本（见 `../plan/01` §3）。
- **新增 store 时要在 `test-support/setup.ts` 补一行重置** —— 目前是显式列出，没有自动化。
