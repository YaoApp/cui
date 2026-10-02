# 14 · 测试（工程落点）

- **版本**：v1.29
- **最后修改**：2026-10-02 14:44:55
- **说明**：测试分层（规则见 plan/20）

## 分层与分工

| 层 | 工具 | 判定者 | 测什么 | 命令 → 日志 |
| --- | --- | --- | --- | --- |
| **规范门禁** | `scripts/check-*.mjs`（**零依赖**）+ lints | 确定性代码 | 设计规范（token · i18n · 样式约定 · 文档结构）· 类型 · 依赖边界 | `pnpm check` → `gates-<HHMM>.log` |
| **检查器自测** | `scripts/tests/run.mjs` | 确定性代码 | 每条检查规则一个正例 + 一个违规例 | `pnpm test:checkers` → `checkers-<HHMM>.log` |
| **单元 / 组件** | `vitest` · Testing Library · `jsdom` | 确定性代码 | 纯逻辑 · 状态与数据层 · 组件行为 | `pnpm test` → `unit-<HHMM>.log` |
| **浏览器** | `@playwright/test` | 确定性代码 | 关键交互主路径 · 中文输入法 · 全键盘 · 视觉回归 | `pnpm test:browser` → `browser-<HHMM>.log` |
| **拟人** | 剧本 + 真浏览器 + 看图 · `ocr_recognize` · `decision_decide` | **执行者判定，按需转人** | 真实使用路径 · 极端数据 · 环境差异 | `pnpm test:persona` → `<场景>-<HHMM>.log` |

**`pnpm test:all`** 一把跑：门禁 + 检查器自测 + 单元 + 浏览器 + **构建** + 拟人 ——
**构建放在拟人之前**，因为拟人层测的是**构建产物**（`dist/`），不是 dev 源码；
整条链另留一份 `all-<HHMM>.log`（断在哪一步只有它说得清）。

## 配置与命令

- `vitest.config.ts`：`jsdom` · `include: ['app/src/**/*.test.{ts,tsx}']` · setup 用 `test-support/setup.ts` · 覆盖率排除用例与样式。
- `playwright.config.ts`：`testMatch: '**/tests/**/*.browser.ts'` · `channel: 'chrome'`（不下载浏览器）· `reuseExistingServer` 复用已在跑的 dev。
- **`vitest` 与 `playwright` 的默认匹配范围会重叠**，配置必须显式收窄，否则互相误抓（拟人是我们自己的脚本，不在其中）。
- `test-support/stores.ts`：**按文件名自动发现** store、登记初始状态并**逐用例复位** ——
  两种命名都认：私有的 `*.store.ts`（组件 / feature / 平台层）与公共的 `stores/*.ts`（无后缀）。
  `setup.ts` 不写清单（`stores.test.ts` 断言它跨层）。**改发现规则只改这里。**
- 命令：`pnpm test` · `pnpm test:browser` · `pnpm test:checkers` · `pnpm test:persona` · `pnpm test:all`。
- **CI**：门禁 + 单元 + 构建进 `celadon-test-build.yml`；浏览器测试单独 `celadon-browser-test.yml`
  （用 runner 自带的 Google Chrome，不必 `playwright install`；失败上传轨迹与截图）。runner 与 action 版本见 `13-quality-gates.md`。

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

## 卡住时的排查

**同步死循环会占死事件循环，用例自身的超时拦不住它**（同步代码不让出事件循环）。按这个顺序查：

1. **确认是死循环** —— `CUI_STEP_TIMEOUT`（默认 300s）会把超时的一步 `SIGKILL` 掉、退出码 **124**，
   日志里出现 `ABORTED after` 就是它；逐步加载包装器之前，它会先替你止损。
2. **绕过 pnpm 直跑** —— `./node_modules/.bin/vitest run <文件>`。仍卡 → 与 pnpm / 锁无关。
3. **按用例名二分** —— `vitest run <文件> -t "<用例名>"`，一步一个。**别写新探针去猜**：
   本次事故里探针"过了"只是因为漏了那条带 query 的路径。
4. **要看卡在哪一行** —— 用 `fs.appendFileSync('/tmp/x.log', …)` 写标记：vitest 会拦截 `console`，
   通过用例的输出不显示，同步死循环时更刷不出来。
5. 拿到具体用例后，先问一句 **"哪两个状态在互相追"** —— 本项目踩过的就是 URL 与 store 的互相追写
   （见 `07-routing.md` 的「谁说了算」，那条规则的机器强制是 `check-effect-url-write.mjs`）。

`scripts/run-logged.mjs` 就是这层看门狗；`CUI_STEP_TIMEOUT=0` 可关掉。

## 待做

- 搬入模块补测试 · 拟人剧本覆盖到后续模块（见 [`../plan/01`](../plan/01-infrastructure.md) §3）。
