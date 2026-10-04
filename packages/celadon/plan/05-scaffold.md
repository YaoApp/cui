# 归档脚手架 + 统一导航与页面样式（2026-10-04）

- **版本**：v1.0（计划 · 未开工）
- **上级**：[`04-status.md`](04-status.md) §5（归档脚手架）
- **规则**：[`07-routing.md`](../architecture/07-routing.md) · [`03-boundaries.md`](../architecture/03-boundaries.md) · [`13-quality-gates.md`](../architecture/13-quality-gates.md)

## 1. 一句话

把四个开发期页面**物理归拢**到 `features/scaffold/`，路由按功能取名（应用首页 `/` 是**占位页**，只摆版本信息；`hello` 的内容成为脚手架的索引页），
**导航收到一处**（`surface-layout` 渲染一次，页面不再各造一份），**页面样式抽一层公共的**，并删掉页面里的返回按钮。

## 2. 现状（为什么要动）

| 问题 | 证据 |
| --- | --- |
| 导航每个页面各造一份，导航项分散在四个文件里 | `hello.tsx` · `world.tsx` · `verify.tsx` · `data-check.tsx` 各自 `<Header><Nav items={…}>`；`navItems`/`appNav` 各写各的 |
| 页面样式四份各写各的 BEM | `hello.less` 53 行 · `world.less` 78 · `verify.less` 87 · `data-check.less` 145，`__body`/`__heading`/`__cell`/`__notice` 四处重复 |
| 页面自带返回按钮（导航不全时的补丁） | `data-check.tsx:169` · `verify.tsx:114` 的 `<Button variant="ghost" onClick={() => navigate(-1)}>` |
| 路由名不表功能 | `/hello` · `/world` · `/verify` · `/data-check`（`verify`/`data-check` 是过程名，不是功能名） |
| 脚手架与真业务混在 `features/` | `features/{hello,world,verify,data-check}` 与将来的真域平级 |

## 3. 目录与路由（新）

| 现在 | 之后 | 路由 | 它到底在演示什么 |
| --- | --- | --- | --- |
| （新，占位） | `features/home` | `/`（`index: true`） | **当前版本信息**（应用版本 · 客户端 · 宿主 · 命名空间 · 语言/主题）—— 真首页的占位 |
| `features/hello` | `features/scaffold/overview` | `/scaffold`（索引） | 客户端事实 + 品牌/图标样本 = 设计体系的活样本（今天的 `hello`）|
| `features/world` | `features/scaffold/routing` | `/scaffold/routing` · `/scaffold/routing/:worldId` | 路由参数 · URL ↔ store 同步 · 列表/详情 |
| `features/verify` | `features/scaffold/bridge` | `/scaffold/bridge` | 逐条点名调 **18 条桥命令**（唯一允许引桥的页面） |
| `features/data-check` | `features/scaffold/requests` | `/scaffold/requests` | 出口 · 四态 · 失效 · 登录/退出 · 服务地址 |

- `/hello` · `/world` · `/verify` · `/data-check` 四条旧路径**全部作废**，`*` 兜底重定向到 `/`。

**为什么不用 `/dev`**：`dev` 是个通用词，将来真要用"开发工具"（日志 · 开关 · 诊断）时会撞名；而且路由与目录同一个词（`scaffold`）才能一眼对上。发布与否**不由路径回答** —— 真要"脚手架不进正式包"，那时用构建标记（`import.meta.env.DEV` 或清单里的能力开关），不是靠路径名。
- **首页是占位页**（`features/home`，不是 scaffold）：只摆当前版本信息，等真首页**替换**它（版本卡片届时可以留着当"关于"）。
- **`hello` 的内容成为脚手架索引**（目录 `features/scaffold/overview`，路由 `/scaffold`）：目录不叫 `index` —— 里面 `index.ts` 与 `index.tsx` 会撞名，`overview` 是同一个意思且不打架。
- 品牌/图标样本留在索引页；等真首页来了，如果它们碍事，再挪去 `/scaffold/design`（本轮不做）。
- **`hello` 这个字留在两个地方**：`data/helloworld`（引擎的冒烟端点，归数据层）与 `platform/…` 里的 `helloworld` 文案键 —— 与本轮页面改名无关。

## 4. 导航收到一处

- **`platform/utils/nav.ts`（拆）**：`NavItem` 类型与 `navWithActive()`（纯函数）**留在平台**（跨层共享的机制）；`AppNavItem` 与 `APP_NAV` **搬走** —— 应用级导航项不是平台机制，是路由的事。今天那份 `APP_NAV` 装的正是四个脚手架页（`/hello`…`/data-check`），所以它必须跟着走。
- **`routes/nav-items.ts`（新）**：唯一一份导航定义 —— `home`（`/`）· `overview`（`/scaffold`）· `routing` · `bridge` · `requests`；每项给 `href` 与 `titleKey`。五项平铺，不做二级导航。脚手架页自己的二级导航（今天的 `world` 页内那份）**留在脚手架内**，用同一份 `NavItem`/`navWithActive`。
- **`routes/surface-layout.tsx`（改）**：按当前 route 渲染一次 `<Header title={<当前项标题>} onRefresh={() => navigate(0)}><Nav items={navItems} localeSwitch onSelect={…}/></Header>`；`main` 与 `side` 两个面都走它。
- **四个页面（改）**：删掉自己的 `Header`/`Nav`/`navItems`/`useNavigate`（返回按钮一起删），只留正文。
- **标题**：仍走平台层的 `usePageTitle`；`Header` 的标题取当前 `nav-item` 的 `titleKey`（页面不再各传一个标题）。
- **刷新**：统一成 `navigate(0)`（现在的 `hello` 用 store 的 `refresh`、`world` 用 `navigate(0)` —— 取后者，去 `hello.store` 里那层只为刷新而存在的状态）。

## 5. 页面样式抽一层

- **`components/page/`（新）**：`page.tsx` 导出 `Page`（正文容器）· `PageSection`（带标题的一段）· `PageRow`（一行卡片）· `PageNotice`（一行提示）；`page.less` 收这四类。
- **四个页面的 `.less` 只留自己特有的**：品牌/图标网格（overview）· 版本卡片（home）· 世界列表（routing）· 命令树（bridge）· 四态与表格（requests）。
- 名字仍用现有的设计类（`celadon` 体系里的 `nav-item` · `input` · `link` · `Button` 等），**不新造 token**；`platform/shell.less` 只留底座，不放页面级样式。
- 目标：四份 `.less` 从 53/78/87/145 行降到各自 30 行以内，重复的 `__body`/`__heading`/`__cell`/`__notice` 只剩一份。

## 6. 要跟着改的地方（清单）

| # | 位置 | 改什么 |
| --- | --- | --- |
| 1 | `routes/routes.tsx` | 新路径（`/` 首页占位 + `/scaffold` 索引 + `/scaffold/{routing,bridge,requests}`）；入口重定向从 `hello` 改成 `/` |
| 2 | `routes/nav-items.ts`（新）· `platform/utils/nav.ts`（拆） | 应用级导航项搬进 `routes/`；平台只留 `NavItem` 与 `navWithActive` |
| 3 | `routes/surface-layout.tsx` | 渲染 Header+Nav；`surface-layout.test.tsx` 跟着改 |
| 4 | `components/page/*` | 新建页面公共件 + 样式 |
| 5 | `features/home`（新占位页）· `features/scaffold/{overview,routing,bridge,requests}` | 新首页 · 目录搬迁（`hello` → `overview`）· 去掉 Header/Nav/返回按钮 · 语言包跟着目录走 |
| 6 | `scripts/check-bridge-imports.mjs` + `scripts/tests/cases/bridge-imports/**` | 白名单从 `features/verify/**` 改成 `features/scaffold/bridge/**`；违规样本路径同步 |
| 7 | 语言包 | 新增 `nav.home`/`nav.overview`/`nav.routing`/`nav.bridge`/`nav.requests` · 删 `nav.hello`/`nav.world`/`nav.verify`/`nav.dataCheck` 与 `verify.back`/`dataCheck.back` · 页面标题键改名（四语） |
| 8 | 用例 | 四个页面的 `*.test.tsx` 跟着改路径与断言（尤其"点导航"的用例） |
| 9 | 截图脚本 | `celadon-client-verify/scripts/shoot-client-macos.sh` 与 `windows-build-and-run.ps1` 的页面参数与 Tab 数（导航项从 5 个变 4 个） |
| 10 | 文档 | `07-routing.md`（路径表）· `15-platform.md` §5.4 的白名单路径 · `04-status.md` §5/§6 标完成 |

## 6.1 不动的地方（想过，决定不动）

| 东西 | 为什么不搬进 scaffold |
| --- | --- |
| `stores/side-panel.ts` + `side-panel.test.ts` | 它是**应用级的侧边挂载点**（`06-state.md`：谁都可以往里放东西），不是脚手架的私有状态；`surface-layout` 的 `side` 面就是它的正经消费方。`world` 页只是**第一个用它的人**，搬页面时它照样留在 `stores/`。 |
| `stores/entry.ts` | 同上：`Entry` 是应用级条目的形状，`side-panel` 的类型就来自它。 |
| `components/{nav,header,locale-switch,theme-toggle,base}` | 它们是**真组件**（导航、页头、语言、主题、基座），产品与脚手架共用；本轮只让 `surface-layout` 统一渲染它们，不搬。 |
| `platform/utils/nav.ts` 的类型与 `navWithActive` | 跨层共享的**机制**（类型 + 纯函数），不是某一页的东西。 |

## 7. TODO（一轮做完）

- [ ] 1. 建 `components/page/` 与 `routes/nav-items.ts`（把 `APP_NAV`/`AppNavItem` 从 `platform/utils/nav.ts` 搬过来），`surface-layout` 接上 Header+Nav
- [ ] 2. 建 `features/home` 占位页（版本信息）；搬目录：`hello → scaffold/overview`、`world/verify/data-check → scaffold/{routing,bridge,requests}`
- [ ] 3. 删各页的 Header/Nav/返回按钮；`.less` 收编到 `page.less`
- [ ] 4. 路由表与语言包（四语）改完
- [ ] 5. 白名单 · 样本 · 用例 · 截图脚本跟着改
- [ ] 6. `pnpm lint` / `check` / 单测 / 检查器自测（85/85）全绿
- [ ] 7. macOS 与 Windows 各跑一遍：四个页面都能到、导航只有一份、没有返回按钮，各附一张截图
- [ ] 8. 回写 `07-routing.md` · `15-platform.md` · `04-status.md`，然后走隔离 Review → 合并推送

## 8. 验收（能否证）

1. `grep -rn "components/nav\|components/header" app/src/features` 为空（页面不再自造导航）。
2. `grep -rn "navigate(-1)" app/src/features` 为空（返回按钮删净）。
3. 四个页面的 `.less` 合计行数下降 ≥ 40%，且 `__body`/`__heading`/`__cell`/`__notice` 只在 `page.less` 里出现。
4. 真客户端：首页显示出当前版本信息；从首页点导航能到索引页与三个工具页，从任一页能回首页；Windows 与 macOS 各一张截图。
5. 路由表里旧的四条路径不再存在（`*` 落回 `/`）。
