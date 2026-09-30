# 01 · 基础设施

- **状态**：🔄 **进行中** —— §1 的六项**已定**，`dev` / `build` / `check` **已跑通**（§2）；接线与其余子项**待做**（§3）
- **目标**：把"可以开始写页面"的工程地基铺好 —— 构建工具、后端 SDK、i18n 构建、图标体系、主题映射、质量门禁、运行时壳
- **不包含**：任何业务页面（属 02 起的各模块）
- **依赖**：00 设计规范

---

## 1. 已定（✅ 确定）

**决定日期**：全部 2026-09-30 ｜ 理由与实测见 §4

| # | 决定 | 结论 |
| --- | --- | --- |
| 1 | **包名与版本** | `@yaoapp/cui` · **`2.0.0`** · 发布进 `next` 标签（**不动 `latest`**）|
| 2 | **构建工具** | **Vite 8.3.1** |
| 3 | **框架与语言** | **React 19.3** · **TypeScript 6** · `@types/react*` 19.3 |
| 4 | **包管理器** | **pnpm 10.34.6**，根 `package.json` 用 `packageManager` 字段锁死 |
| 5 | **仓库形态** | v2 在 `packages/celadon/` 内**自成一套**；两道保护：外层排除 + 自带工作区根 |
| 6 | **旧包处置** | **不升级 · 不复活 · 不删**（四个仍被旧应用依赖；甘特图为候选清理）|
| 7 | **界面底座** | **不用 antd**；行为用 **`@base-ui/react` 1.8**，视觉用 **Celadon token** |
| 8 | **旧仓库资产取舍** | **搬**：`components/ui/` 输入层（15 个原子输入 · 零 antd）· `PropertySchema` 契约 · `validation.ts` 校验；**不搬**：`FormBuilder`/`FlowBuilder`（低代码 UI）· `DataTable`/`PaginatedTable`（商业化后台表格）|
| 9 | **i18n 运行时** | **`i18next` + `react-i18next`**；语言包 `locales/<locale>/<namespace>.json`；**新增语言 = 只加一个目录**，不改代码 |
| 10 | **路由** | **React Router 库模式**（`react-router@^8`，不装 `@react-router/dev`）；**`basename` 与 Vite `base` 同源**，取自引擎注入的 `BASE` |
| 11 | **数据请求** | **原生 `fetch`**（不用 axios）；搬旧仓库 `openapi/` 作类型化客户端；**不引数据缓存库**，用自建小钩子管加载 / 错误状态 |
| 12 | **日期运算与时区** | **`date-fns` + `@date-fns/tz`**（Base UI 的官方适配器 · tree-shakable）；**格式化不归它，仍走 `Intl`** |
| 13 | **长列表与表格** | **`virtua`** —— 长列表用 `VList`/`Virtualizer`（容器与行渲染归我们；索引 ↔ 偏移双向可查；尺寸缓存可存可恢复）；**表格类用 `VGrid`**（二维 · 固定表头/列）|
| 14 | **状态管理** | **`zustand`**（不用 mobx；自研的 `storex` 不复活）|
| 15 | **动效** | **CSS 与浏览器原生为默认**（时长/缓动走 Celadon token）；**`motion`** 只在它更强处用（手势 · 编排 · 布局动画）|
| 16 | **测试** | **测试单独成册（`12`）**；本模块定依赖与位置：`vitest` + 测试库 + `jsdom` + `@playwright/test`；`*.test.ts(x)` 与组件 / 页面同目录 |

**三个名字各司其职，不冲突**：包名 `@yaoapp/cui` ｜ 设计体系 **Celadon** ｜ 目录 `packages/celadon/`

### 1.1 依赖清单

**已定**（本模块内落地）：

| 包 | 版本 | 用途 |
| --- | --- | --- |
| `vite` | `^8.3.1` | 构建（已装）|
| `react` · `react-dom` | `^19.3.0` | UI 运行时 |
| `@types/react` · `@types/react-dom` | `^19.3.0` | 类型 |
| `typescript` | `^6.0.3` | 语言 |
| `@base-ui/react` | `^1.8.0` | 行为与无障碍层 |
| `i18next` · `react-i18next` | `^26` · `^17` | i18n 运行时 |
| `react-router` | `^8` | 路由（库模式，配 `basename`）|
| `date-fns` · `@date-fns/tz` | `^4` · `^1` | 日期运算与时区（见 §1.2 的日期规则）|
| `virtua` | `^0.52` | 长列表虚拟滚动（聊天流 · 收件箱 · 看板列；见 §1.2 的列表规则）|
| `zustand` | `^5` | 状态管理（见 §1.2 的状态规则）|
| `motion` | `^13` | 动效（仅用于手势 / 编排 / 布局动画；见 §1.2 的动效规则）|
| `vitest` · `@testing-library/react` · `@testing-library/user-event` · `jsdom` · `@vitest/coverage-v8` · `@playwright/test` | 最新 | **测试**（devDeps；见 §1.2 的测试规则）|
| `pnpm`（**工具**，非依赖）| `10.34.6` | 包管理器，根 `packageManager` 锁死 |


**不用**：`antd`（见 §1.2 的界面底座）

**不需要包**：**数据请求** —— 旧仓库的 `openapi/`（71 文件）本身就建在 `fetch` 上，无 axios；
其中流式用 `EventSource`（GET + cookie）与 fetch 流（`body.getReader()`），WebSocket 另有实现 —— 这些都不归数据缓存库管。

**不需要包**：**图标** —— `00` 的 F7 已定"采用 lucide（ISC）作为源、产物为雪碧图"，
应用侧用 `<use>` 引用 `icons/lucide-sprite.svg`（67 个符号，命名 `i-<域>-<名>`），
**不引任何图标库依赖**

**零依赖**：设计资产与检查器（`design/` · `scripts/`）不引任何运行时依赖

## 2. 已跑通（✅ 实测）

| 项 | 结果 |
| --- | --- |
| **生产构建** | `pnpm build` ✓ **42–47ms**（Vite 8 上；Vite 6 时为 76–106ms）|
| **六个检查** | `check-i18n` · `check-readme-values` · `check-tokens` · `check-generated` · `check-css-conventions` **全绿** |
| **检查器自测** | `scripts/tests/run.mjs` **35 / 35** 用例（每条规则一个样本）|
| **dev / preview** | dev 端口 5199 ✓ · preview HTTP **200** ✓ |
| **隔离 · 装到本地** | `node_modules` 19M · 自己的 `pnpm-lock.yaml` · Vite 8.3.1 在本地 |
| **隔离 · 外层没被碰** | 外层锁文件无改动 · 外层工作区成员仍 7 个 · 外层 git 状态干净 |
| **桌面壳** | `cui-desktop` 同步升到 **Vite 8.3.1**：生产构建（含类型检查）通过 · **32 / 32** 测试 · 安装 0 漏洞 |

## 3. 待做（⏳ 未定 / 未做）

**本模块内**（对应 §5 子项）：

| 项 | 内容 |
| --- | --- |
| **代理** | 按 4.10 的 12 个前缀转发给引擎；**SSE 不缓冲**（三个头照旧）+ **WebSocket upgrade**（`server.proxy` 的 `ws: true`）—— `cui-desktop` 现在**没有任何 proxy** |
| **产物布局** | 定"源码直连"还是"产物拉取"（现状：`pull-cui` / `build-cui` 拉产物，并 `watch.ignored` 掉整个 `cui/`）|
| **构建期门禁接线** | §5 的 6b：stylelint · TS 类型约束 · 反向依赖边界 · 接进 CI / pre-commit |
| **后端 SDK** | §5 子项 2 |
| **取数钩子** | 自建 `useRequest` 级小钩子（加载 / 错误 / 取消 / 重试各一处实现），避免散落的 `useEffect` + `fetch` |
| **测试落地** | 按 `12 测试` 接入：`vitest` 配置（`jsdom` · 就近放）· 搬入模块补测试 · Playwright 跑主路径 · 首条拟人剧本 |
| **i18n 构建** | §5 子项 3 —— **运行时已定（i18next，见 §1.2 的 i18n 规则）**；剩下：命名空间切分 · 按需加载 · 类型生成 · 翻译流程文档 |
| **图标落地** | §5 子项 4 —— **选型与规格已定（`00` F7：lucide 为源 · 收录 67 · 命名 `i-<域>-<名>` · 档位 14/16/20/24 · 产物为雪碧图）**；剩下：应用侧图标组件与按需引入 |
| **主题映射** | §5 子项 5：同一份 `tokens.less` 生成组件库主题 |
| **运行时壳 · 运行期对比度** | §5 子项 7 · 8 |

**模块外，另行决定**：

- **`cui-desktop` 的包管理器**：现为 npm；统一到 pnpm 需改 `tauri.conf.json` 的 `beforeDevCommand` / `beforeBuildCommand` 两行，并换成 pnpm 锁文件
- **`cui-desktop` 的锁文件**：其 `.gitignore` **把两种锁文件都忽略**了 → 安装结果**不可复现**。这属它原有的选择，收口时与上面的 pnpm 迁移一起做
- **是否需要网站 / 文档侧的构建**（当前不需要）

---

## 2. 已跑通（✅ 实测）

| 项 | 结果 |
| --- | --- |
| **生产构建** | `pnpm build` ✓ **42–47ms**（Vite 8 上；Vite 6 时为 76–106ms）|
| **六个检查** | `check-i18n` · `check-readme-values` · `check-tokens` · `check-generated` · `check-css-conventions` **全绿** |
| **检查器自测** | `scripts/tests/run.mjs` **35 / 35** 用例（每条规则一个样本）|
| **dev / preview** | dev 端口 5199 ✓ · preview HTTP **200** ✓ |
| **隔离 · 装到本地** | `node_modules` 19M · 自己的 `pnpm-lock.yaml` · Vite 8.3.1 在本地 |
| **隔离 · 外层没被碰** | 外层锁文件无改动 · 外层工作区成员仍 7 个 · 外层 git 状态干净 |
| **桌面壳** | `cui-desktop` 同步升到 **Vite 8.3.1**：生产构建（含类型检查）通过 · **32 / 32** 测试 · 安装 0 漏洞 |

## 3. 待做（⏳ 未定 / 未做）

**本模块内**（对应 §5 子项）：

| 项 | 内容 |
| --- | --- |
| **代理** | 按 4.10 的 12 个前缀转发给引擎；**SSE 不缓冲**（三个头照旧）+ **WebSocket upgrade**（`server.proxy` 的 `ws: true`）—— `cui-desktop` 现在**没有任何 proxy** |
| **产物布局** | 定"源码直连"还是"产物拉取"（现状：`pull-cui` / `build-cui` 拉产物，并 `watch.ignored` 掉整个 `cui/`）|
| **构建期门禁接线** | §5 的 6b：stylelint · TS 类型约束 · 反向依赖边界 · 接进 CI / pre-commit |
| **后端 SDK** | §5 子项 2 |
| **取数钩子** | 自建 `useRequest` 级小钩子（加载 / 错误 / 取消 / 重试各一处实现），避免散落的 `useEffect` + `fetch` |
| **测试落地** | 按 `12 测试` 接入：`vitest` 配置（`jsdom` · 就近放）· 搬入模块补测试 · Playwright 跑主路径 · 首条拟人剧本 |
| **i18n 构建** | §5 子项 3 —— **运行时已定（i18next，见 §1.2 的 i18n 规则）**；剩下：命名空间切分 · 按需加载 · 类型生成 · 翻译流程文档 |
| **图标落地** | §5 子项 4 —— **选型与规格已定（`00` F7：lucide 为源 · 收录 67 · 命名 `i-<域>-<名>` · 档位 14/16/20/24 · 产物为雪碧图）**；剩下：应用侧图标组件与按需引入 |
| **主题映射** | §5 子项 5：同一份 `tokens.less` 生成组件库主题 |
| **运行时壳 · 运行期对比度** | §5 子项 7 · 8 |

**模块外，另行决定**：

- **`cui-desktop` 的包管理器**：现为 npm；统一到 pnpm 需改 `tauri.conf.json` 的 `beforeDevCommand` / `beforeBuildCommand` 两行，并换成 pnpm 锁文件
- **`cui-desktop` 的锁文件**：其 `.gitignore` **把两种锁文件都忽略**了 → 安装结果**不可复现**。这属它原有的选择，收口时与上面的 pnpm 迁移一起做
- **是否需要网站 / 文档侧的构建**（当前不需要）

---

### 1.2 规则与约束

**包与仓库**

- `celadon` **自成一套**：自己的 `package.json` · `pnpm-workspace.yaml`（`packages: []`）· `pnpm-lock.yaml` · `node_modules`
- 根工作区用 `!packages/celadon` **排除**；**缺了它自己的 `pnpm-workspace.yaml`，在 celadon 里 install 会改到根锁文件**
- 旧包**不升级 · 不复活 · 不删**；新代码不引用它们
- 版本用 **caret**（`^`），不锁小版本；根 `packageManager` 锁死 pnpm，不引 npm / yarn

**界面底座**

- **行为**用 `@base-ui/react`（headless）· **视觉**用 Celadon `tokens.less`；**不引 antd**
- 纯视觉组件（Spin · Typography · Tag · Empty · Space · Row/Col · Skeleton）**自己写**；缺的能力先在 `03 组件` 里列，再决定自写或补包
- 组件**不得**直接写颜色 / 间距字面量，一律走 token

**i18n**

- 运行时不引第三方之外的封装；语言包按 `locales/<locale>/<namespace>.json`（**嵌套 JSON**）
- **新增语言 = 只加一个目录**，不改代码；用 `import.meta.glob` 发现语言
- 类型只从**基准语言**生成；格式化的归属见 `19 数据格式`

**宿主集成（硬约束）**

| 约束 | 内容 |
| --- | --- |
| `basename` | 应用挂在 `/<BASE>/` 下；React Router 的 `basename` 与 Vite 的 `base` **取同一变量**；PWA 的 `scope` / `start_url` 同步 |
| 保留前缀 | **12 个前缀归引擎，路由不得占用**：`/api` `/v1` `/assets` `/components` `/tools` `/agents` `/admin` `/brands` `/docs` `/ai` `/.well-known` `/iframe` |
| 无外壳模式 | `/iframe` 路径下**不渲染外壳**，保留 |
| 代理 | 按上表前缀转发；**WS upgrade 用 `server.proxy` 的 `ws: true`**；SSE 三个头照旧（`Cache-Control: no-cache, no-transform` · `Connection: keep-alive` · `X-Accel-Buffering: no`）|

**数据与状态**

- 传输用**原生 `fetch`**（不用 axios）；类型化客户端**搬旧仓库 `openapi/`**（本身建在 fetch 上）
- **不引数据缓存库**；加载 / 错误 / 取消 / 重试由**自建小钩子**统一实现
- **禁止**在页面里散落 `useEffect` + `fetch`
- 状态用 **`zustand`**；不用 mobx；自研 `storex` 不复活（存储用 `persist` 中间件）

**日期 · 列表 · 动效**

- **显示**日期 / 数字 / 货币 / 相对时间 → `Intl`（或 i18next 的 formatter），规则见 `19`
- **运算 / 区间 / 日历网格 / 时区换算** → `date-fns` + `@date-fns/tz`；存储与传输一律 **UTC**，客户端上送 `clientTimeZone`
- 长列表与表格用 **`virtua`**：**容器 DOM 与行渲染归我们**，库只算位置；表格用 `VGrid`；`@tanstack/react-virtual` 不采用
- 动效**默认 CSS + token**；入场 / 退场用 `@starting-style`；视图切换用 View Transitions；**只有手势 / 编排 / 布局动画用 `motion`**
- `03 组件` 的每个动效场景**必须标注归属**（CSS / 原生 / motion），不允许"顺手引个库"

**测试**：单独成册 —— 见 `12 测试`。



## 4. 子项与交付物

| # | 子项 | 交付物 | 验收 |
| --- | --- | --- | --- |
| 1 | **构建工具与开发服务器** | **选型已定：Vite 8** · **框架已定：React 19**（见 4.3）· `BASE` / publicPath · **代理（SSE 流式 + WebSocket upgrade）** · 产物布局（供桌面壳与 CDN 消费）| 一条命令起 dev；`/api` 与 `/v1` 的 SSE 增量不缓冲；WS 能连上；生产构建产物可被桌面壳直接消费 |
| 2 | **后端 SDK** | 引擎接口的**类型化客户端**：认证 / 会话 / 消息流（SSE）/ WebSocket；按页面需要增量补齐 | 认证、拉会话列表、跑一轮流式对话三条链路全通；错误与超时有统一形状 |
| 3 | **i18n 构建** | 四语 JSON → 构建产物 · 运行时切换与持久化 · 组件库 locale 对接 · **缺 key / 漏翻检查进 CI** | 四语切换即时生效且刷新后保持；缺 key 与漏翻让 CI 失败（检查脚本已就绪）|
| 4 | **图标落地** | **选型与规格见 `00` 的 F7**（lucide 为源 · 产物为 `icons/*-sprite.svg`）· 应用侧图标组件 · 按需引入 | 应用渲染与 `design/icons.html` 一致；打包只含用到的图标 |
| 5 | **主题映射** | **同一份 `tokens.less`** 生成组件库主题（构建期）· 浅/暗两套 | 改一处 token → 组件库主题与色卡**同步**变化；不引入第二份颜色来源 |
| 6a | **扫描型门禁（不依赖构建工具，现在就能做）** | 纯 Node 脚本：禁硬编码色 · **禁装饰/填充 token 当文字用** · 关键配对对比度（色卡）· i18n 缺 key/漏翻（**已有**）· README 色值（**已有**）· **物理方向属性**（**已有** `check-css-conventions.mjs`）| 故意写入硬编码色 / 错配对 / 缺 key / 装饰色当文字时，脚本退出码非 0；**检查器自身有样本测试**（`scripts/tests/run.mjs`，**35 个用例**，每条规则一个）|
| 6b | **构建期门禁（选定构建工具后接线）** | **禁组件外写内联边框**（会露浏览器默认焦点环）—— 需要"组件边界"这个概念，静态扫描认不出，留给构建期按组件目录判定；stylelint 自定义规则（只允许 `var(--token)` · 禁物理方向属性 —— 扫描版已在 `../scripts/check-css-conventions.mjs`，此处升级为构建期拦截）· TS 类型约束（如 `type Color = \`var(--${string})\`` 让裸色值无法通过类型）· **反向依赖边界**（禁 `import '@yaoapp/cui'`）· 接进 CI job / pre-commit | 违规**让构建或 CI 失败**（不只是脚本失败）—— 规范要能拦住人，而不是只写在文档里 |
| 7 | **运行时壳** | 引擎全局（`window.$app` / `window.$global`）的**类型化封装与初始化**；显式声明，禁止隐式依赖 | 全局对象有类型；未初始化时给出明确报错而不是白屏 |
| 8 | **运行期对比度校验** | `readableColorOn(fg, bg)`：按**实际绘制的背景**算对比度并给出可读替代色；开发期断言 + 关键组件接入（设计期已有色卡门禁，这里是运行期兜底）| 传入低对比组合时开发期直接报错/降级；主题切换后仍保证可读 |

## 5. 素材来源（旧包，按需复制）

| 素材 | 规模 | 用途 |
| --- | --- | --- |
| `openapi/` | 71 文件 / 12 444 行 | **搬**作后端 SDK（本身建在 `fetch` 上，见 §1.2 的数据规则）：按需子集，去掉旧框架耦合 |
| `utils/` | 27 文件 / 1 018 行 | 请求封装 / 格式化 / 存储 |
| `hooks/` | 16 文件 / 1 352 行 | 通用 hooks |
| `components/ui/` | 26 个 tsx（**21 个零 antd**）| **搬输入层与 schema 契约**：15 个原子输入 + `validation.ts` + `PropertySchema` + `Setting`/`Provider`/`Button`/`Dropdown`；详见 4.8 |
| `components/**` 业务件 | `AgentPicker` 597 行 · `SecretsManager` · `TOTP` · `WelcomeWizard` | 带真实业务逻辑 → **搬逻辑、换外观**；`AgentPicker` 是否保留待 08 专家页定 |
| ~~`edit/FormBuilder` · `edit/FlowBuilder` · `DataTable`/`PaginatedTable`~~ | — | **不搬** ✗：低代码 UI（旧应用 0 引用）与商业化后台表格，见 4.8 |
| 构建期配置 | 主题链 · 代理 · 图标字体 | 只取能力，**重新实现**（不复制旧配置）|

> 旧构建链里明确**不照搬**的三件事：① 主题变量命令行生成链 ② 自定义"原始文本"loader（shadow DOM 动态注入用）③ 编辑器 worker 的打包方式 —— 见 [../MIGRATION.md](../MIGRATION.md)。

## 6. 验收（Done）

1. 新包**一条命令**可以起 dev、可以出生产构建；
2. 后端三条链路（认证 / 会话列表 / 流式对话）跑通，含 WebSocket；
3. 四语切换可用 + 缺 key/漏翻检查在 CI 生效；
4. 图标三档规格可用且按需打包；
5. 改一处设计 token → 组件库主题与色卡同步；
6. 质量门禁能拦住硬编码色 / 错配对 / 缺 key / 装饰色当文字；
7. **运行期**对比度校验可用（不只是设计期色卡）；
8. 反向依赖边界（禁 `@yaoapp/cui`）在构建期生效。
9. 测试按 `12 测试` 落地：搬入模块与状态层有测试；主路径有浏览器用例；拟人剧本执行并留档（预期执行前写死 · 证据为外部产物 · 看不清与失败都要写）。

## 7. 台账

> 规则：每从旧包复制一个文件，登记：**源 → 目标 → 改了什么 → 为什么**（也可记在 `../MIGRATION.md`）。
> 复制的文件必须过四道：① 删掉没用到的分支 ② 换成语义 token（禁硬编码）③ 文案走 `ui.*` ④ 命名全称化。

| 源 | 目标 | 改动 | 原因 |
| --- | --- | --- | --- |
| —（本阶段为**新建**：`package.json` / `vite.config.ts` / `app/` / `pnpm-workspace.yaml`，未从旧包复制代码）| | | |
