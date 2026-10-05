# 归档脚手架 + 统一导航与页面样式（2026-10-04）

- **版本**：v1.1（**已实施** 2026-10-04）
- **上级**：[`04-status.md`](04-status.md)（现状：现在有什么 · 缺口 · 下一步）
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
| （新） | `features/scaffold/base` | `/scaffold/base` | **全部基础件按分组的清单页**：输入类 · 选择类 · 勾选类 · 反馈类 · 图标与品牌 · 主题与语言；每组列出默认、悬停、焦点、禁用与错误等状态，供人类验收与浏览器用例断言 |
| （已撤）`/side` 演示路由 | —— | —— | 侧边面与它的 store 一并删除（没有产品页面时它没有消费者）|

- `/hello` · `/world` · `/verify` · `/data-check` 四条旧路径**全部作废**，`*` 兜底重定向到 `/`。

**为什么不用 `/dev`**：`dev` 是个通用词，将来真要用"开发工具"（日志 · 开关 · 诊断）时会撞名；而且路由与目录同一个词（`scaffold`）才能一眼对上。发布与否**不由路径回答** —— 真要"脚手架不进正式包"，那时用构建标记（`import.meta.env.DEV` 或清单里的能力开关），不是靠路径名。
- **首页是占位页**（`features/home`，不是 scaffold）：只摆当前版本信息，等真首页**替换**它（版本卡片届时可以留着当"关于"）。
- **`hello` 的内容成为脚手架索引**（目录 `features/scaffold/overview`，路由 `/scaffold`）：目录不叫 `index` —— 里面 `index.ts` 与 `index.tsx` 会撞名，`overview` 是同一个意思且不打架。
- 品牌/图标样本留在索引页；等真首页来了，如果它们碍事，再挪去 `/scaffold/design`（本轮不做）。
- **`hello` 这个字留在两个地方**：`data/helloworld`（引擎的冒烟端点，归数据层）与 `platform/…` 里的 `helloworld` 文案键 —— 与本轮页面改名无关。

## 4. 导航收到一处

- **`features/scaffold/components/{nav,header}`（搬）**：导航与页头**只为脚手架那四页存在**（全仓只有它们在用），所以它们是脚手架的私有件，不是"真组件" —— 产品页还没有，谈不上产品导航。
- **`features/scaffold/nav.ts`（搬）**：今天 `platform/utils/nav.ts` 里的三样（`NavItem` 类型 · `navWithActive()` · `APP_NAV`）**全部归脚手架** —— 没有产品页之前，它们没有第二个消费方。真导航等真页面来了再设计。
- **`routes/surface-layout.tsx`（改）**：脚手架的导航项**由页面自己传**（`/` 首页与将来的真页面不背脚手架导航）—— 壳只提供 `<main>`/`<aside>` 与 Header 槽位，不提供导航内容。
- **导航项**（脚手架内一份）：`home`（`/`）· `overview`（`/scaffold`）· `routing` · `bridge` · `requests`；五项平铺，不做二级导航。
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
| 2 | `features/scaffold/nav.ts`（搬）· `features/scaffold/components/{nav,header}`（搬） | 脚手架的导航定义与导航/页头件都进脚手架；`platform/utils/nav.ts` 与 `components/{nav,header}` 随之消失 |
| 3 | `routes/surface-layout.tsx` | 渲染 Header+Nav；`surface-layout.test.tsx` 跟着改 |
| 4 | `components/page/*` | 新建页面公共件 + 样式 |
| 5 | `features/home`（新占位页）· `features/scaffold/{overview,routing,bridge,requests}` | 新首页 · 目录搬迁（`hello` → `overview`）· 去掉 Header/Nav/返回按钮 · 语言包跟着目录走 |
| 6 | `scripts/check-bridge-imports.mjs` + `scripts/tests/cases/bridge-imports/**` | 白名单从 `features/verify/**` 改成 `features/scaffold/bridge/**`；违规样本路径同步 |
| 7 | 语言包 | `nav.*`（现在在**全局**包里）搬进**脚手架**的包；新增 `nav.home`/`nav.overview`/`nav.routing`/`nav.bridge`/`nav.requests` · 删旧四条与 `verify.back`/`dataCheck.back` · `header.refresh`/`nav.appLabel` 跟着导航件走 · 页面标题键改名（四语）|
| 8 | 用例 | 四个页面的 `*.test.tsx` 跟着改路径与断言（尤其"点导航"的用例） |
| 9 | 截图脚本 | `celadon-client-verify/scripts/shoot-client-macos.sh` 与 `windows-build-and-run.ps1` 的页面参数与 Tab 数（导航项从 5 个变 4 个） |
| 10 | **删除** `stores/side-panel.ts` · `stores/entry.ts` · `stores/side-panel.test.ts` · `world` 里开侧边那段与它的三条用例（`world.test.tsx`）· `features/world/tests/world-panel.agent.{md,mjs}`（persona）· `world.store.ts` / `world.store.test.ts` / `test-support/stores.ts` 里把它当"公共 store"的注释 · `share-url` 的 `sideEntity` 参数与其用例 | 没有产品消费者的推测结构，删掉（`stores/` 暂时空着，第一个真 store 来了再建）|
| 10b | `components/nav/nav.test.tsx` · `components/header/header.test.tsx` · `platform/utils/nav.test.ts` | 跟着各自的件搬进 `features/scaffold/`；用例里的旧路径（`/world` `/hello`）换成新路径 |
| 10c | `scripts/tests/cases/import-boundaries/**`（样本里 import 了 `@/components/header` 与 `@/platform/utils/nav`）| 换成仍然存在的导入目标（样本是合成的，别指向被搬走的件）|
| 10d | persona 用例：`features/hello/tests/structure-trial.agent.*` · `features/data-check/tests/data-check-trial.agent.*` | 跟着页面搬；`scripts/run-persona.mjs` 的收集方式确认一遍（glob 还是清单）|
| 11 | 文档 | `07-routing.md`（路径表 + 两面能力撤掉）· `15-platform.md:270`（白名单路径）· `00-principles.md:117` 与 `06-state.md:65`（命名例子用的是 `side-panel.ts`，换掉）· `plan/03-data.md:163`（引用 `features/data-check`/`features/verify`）· `plan/04-status.md:29`（`stores/` 现状）· 本文档标完成 |

## 6.1 不动的地方（想过，决定不动）

**判断标准**：这东西有没有**产品消费者**？没有就是脚手架的。

| 东西 | 产品消费者 | 怎么办 |
| --- | --- | --- |
| `components/{nav,header}` | **没有**（只有脚手架四页在用）| 搬进 `features/scaffold/components/` |
| `platform/utils/nav.ts`（类型 · 纯函数 · `APP_NAV`）| **没有** | 搬进 `features/scaffold/nav.ts` |
| `stores/side-panel.ts` + `side-panel.test.ts` | **没有**：它只为 `/side` 这个能力演示存在，是我按 1.0 的侧边挂载点**推测**出来的 | **删掉**；真产品要侧边时重新设计 |
| `stores/entry.ts` | **没有**（`side-panel` 是它唯一消费者）| **删掉** |
| `features/world` 里"选中即开侧边"那段 | 没有（演示）| 删掉；`world` 本身搬成 `scaffold/routing` |
| `components/{base,locale-switch,theme-toggle}` | **有**：设计体系的原语 · 平台的语言/主题控件（机制，不是页面）| 留 |
| `routes/surface-layout.tsx` 的 `main` 分支 · `platform/shell.less` | **有**：壳是所有页面的住处 | 留（但**不提供导航内容**，导航由脚手架页自己传）|
| `surface-layout.tsx` 的 `aside` 分支 · `/side` 路由 · `platform/utils/surfaces.ts` 的 `side` | **没有**：它唯一的消费者是那个被删掉的侧边面板 | 本轮**一并删掉**（`07-routing.md` 记为"两面能力曾演示过，没有产品页面时撤掉，需要侧边时重新设计"）—— 免得留下一个永远空的 `aside` |

## 7. TODO（一轮做完）

- [x] 1. 建 `components/page/`；把导航件与 `nav.ts` 搬进 `features/scaffold/`；`surface-layout` 收导航槽位（不提供内容）
- [x] 1b. 删掉 `stores/{side-panel,entry}` 与其用例、`world` 的开侧边那段与三条用例、`world-panel.agent.*`、`share-url` 的 `sideEntity`、`surface-layout` 的 `aside` 分支与 `/side` 路由、`surfaces.ts` 的 `side`；清掉三处把它当"公共 store"的注释
- [x] 2. 建 `features/home` 占位页（版本信息）；搬目录：`hello → scaffold/overview`、`world/verify/data-check → scaffold/{routing,bridge,requests}`
- [x] 3. 删各页的 Header/Nav/返回按钮；`.less` 收编到 `page.less`
- [x] 4. 路由表与语言包（四语）改完
- [x] 5. 白名单 · 样本 · 用例 · 截图脚本跟着改
- [x] 6. `pnpm lint` / `check` / 单测 / 检查器自测（85/85）全绿
- [x] 7. macOS 与 Windows 各跑一遍：四个页面都能到、导航只有一份、没有返回按钮，各附一张截图
- [x] 8. 回写 `07-routing.md` · `15-platform.md` · `04-status.md`，然后走隔离 Review → 合并推送

## 8. 验收（能否证）

1. `grep -rn "components/nav\|components/header" app/src/features` 为空（页面不再自造导航）。
2. `grep -rn "navigate(-1)" app/src/features` 为空（返回按钮删净）。
3. **未达成**（2026-10-04 复核实测 363 → 368 行）：公共件抽出来了，但各页仍保留自己的选择器；
   行数不是目标，重复声明才是 —— 下一步真做设计统一时再收。
4. 真客户端：首页显示出当前版本信息；从首页点导航能到索引页与三个工具页，从任一页能回首页；Windows 与 macOS 各一张截图。
5. 路由表里旧的四条路径不再存在（`*` 落回 `/`）。

## 9. 实施记录（与计划的差异）

- **语言包合并成一份**：`features/scaffold/locales/*.json`（140 键）—— 嵌套两层的包不在 i18n 的收集路径里
  （`features/*/locales/*.json` 只扫一层），而"脚手架是一个域"本来就是更干净的读法。全局包里属于脚手架的
  键（`nav.*` · `header.*` · `verify.*`）一并搬了过去；留下的全局键是 `bridge.*`（失败文案）· `surface.*` ·
  `themeToggle.*` · `client.*`。
- **页壳 `ScaffoldPage`**：页头（页面名）+ 导航（五项）+ 正文，各页只传标题与正文；详情页用 `pageTitle`
  把**页签**标题换成对象名（页头仍是页面名 —— 旧行为如此）。
- **`aside` 面一并撤掉**：`surface-layout` 只剩主区，`surfaces.ts` 删除（没有产品页面时，空 `aside` 比没有更糟）。
- **首页加了脚手架入口**：导航住在脚手架页里，而桌面端没有地址栏 —— 首页必须有路过去（真首页来了挪进开发菜单）。
- **`stores/` 留了一份 README**：说明什么时候该有 store；目录本身空着（第一个真 store 等第一个真域）。
