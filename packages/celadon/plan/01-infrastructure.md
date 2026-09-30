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
| `date-fns` · `@date-fns/tz` | `^4` · `^1` | 日期运算与时区（见 4.12）|
| `pnpm`（**工具**，非依赖）| `10.34.6` | 包管理器，根 `packageManager` 锁死 |

**待定**（推荐列出，未拍）：

| 包 | 当前最新 | 用途 | 备注 |
| --- | --- | --- | --- |
| `zustand` | 5.0.15 | 状态 | |
| `@tanstack/react-virtual` | 3.14.13 | 虚拟列表 | 与 `react-virtuoso` 二选一 |
| `motion` | 13.4.6 | 动效 | |
| `@playwright/test` | 1.63.0 | 浏览器验收 | 与 `scripts/tests/` 的测试策略一起定 |

**不用**：`antd`（见 4.7）

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
| **i18n 构建** | §5 子项 3 —— **运行时已定（i18next，见 4.9）**；剩下：命名空间切分 · 按需加载 · 类型生成 · 翻译流程文档 |
| **图标落地** | §5 子项 4 —— **选型与规格已定（`00` F7：lucide 为源 · 收录 67 · 命名 `i-<域>-<名>` · 档位 14/16/20/24 · 产物为雪碧图）**；剩下：应用侧图标组件与按需引入 |
| **主题映射** | §5 子项 5：同一份 `tokens.less` 生成组件库主题 |
| **运行时壳 · 运行期对比度** | §5 子项 7 · 8 |

**模块外，另行决定**：

- **`cui-desktop` 的包管理器**：现为 npm；统一到 pnpm 需改 `tauri.conf.json` 的 `beforeDevCommand` / `beforeBuildCommand` 两行，并换成 pnpm 锁文件
- **`cui-desktop` 的锁文件**：其 `.gitignore` **把两种锁文件都忽略**了 → 安装结果**不可复现**。这属它原有的选择，收口时与上面的 pnpm 迁移一起做
- **是否需要网站 / 文档侧的构建**（当前不需要）

---

## 4. 决定详情

### 4.1 包名 `@yaoapp/cui`，版本从 2.0.0 起

**为什么**：迁移完成后，**v2 就是 `cui` 这个包** —— 旧包的其余部分会被它取代，不会再有两个并列的东西。
所以名字**现在**就定下来，不要等到发布时再改名。

**版本为什么从 2.0.0 起**：旧包在 `0.10.x`，但 v2 不是它的延续 —— 构建栈、组件、命令全换。
主版本号跨越是**如实**的表达，不是营销。

#### 🔒 发布是单向门，所以加了锁

`npm publish` 到**已存在**的包名上**不可撤回**。因此：

- **`publishConfig.tag: next`** —— 发布默认进 `next` 标签，**不动 `latest`**；
  旧应用按 `latest` 装的仍然是 `0.10.x`，不会被 v2 顶掉。**迁移完成后再**把 `latest` 指过来。
- **发布需要显式登录**（本机 `npm whoami` → `ENEEDAUTH`）—— 不会误发。
- 发布流程（届时执行）：`npm login` → 发布 → 验证 `npm view` → `npm dist-tag add @yaoapp/cui@2.0.0 latest`。

### 4.2 v2 在 celadon 目录内自成一套

**目标**：在 `packages/celadon/` 里 `install` / `dev` / `build` / `check` 全都能跑，
**不改变外层仓库的行为**（根安装不带它、根构建不带它、旧应用零风险）。

**现在的形态**：

```
packages/celadon/
  package.json          @yaoapp/cui@2.0.0 —— 包根就在这里
  pnpm-workspace.yaml   packages: []  ← 让它成为自己的工作区根
  pnpm-lock.yaml        自己的锁文件
  node_modules/         自己的（pnpm store 共享，磁盘影响小）
  vite.config.ts        Vite 配置，root 指向 app/
  app/                  应用源码（Vite 的 root）
  design/ plan/ scripts/  设计资产 · 计划 · 工具（工具零依赖，不需要 manifest）
```

**挡两个方向，要两条保护**：

| 方向 | 会发生什么 | 保护 |
| --- | --- | --- |
| **由外向内** | 根工作区是 `packages/*`，会把 celadon 当成员 —— 根 `pnpm install` 会装它、根 `turbo run build` 会构建它，v2 构建失败会弄挂根构建 | 根 `pnpm-workspace.yaml` 里显式排除 `!packages/celadon` |
| **由内向外** | 在 celadon 里跑 `pnpm install` 时，pnpm 会**向上**找最近的 workspace 根，找到外层的 —— 于是**装了外层**，并改写外层锁文件| celadon 自带 `pnpm-workspace.yaml`，pnpm 找的永远是**最近**的那个 |

**验证方式（带正向对照）**：往 celadon 放探针 `package.json`，然后数工作区成员 ——
既要"**探针不在里面**"，也要"**其他成员仍在**"。实测：成员 7 个、探针不在其中 ✓

> **改 `pnpm-workspace.yaml` 后必须数一遍工作区成员数**。
> 只看"目标是否被排除"不够：条目**缩进不一致**时 pnpm 会**静默**把整个 `packages` 列表解析成空，此时**全部成员**都会消失，看起来却像"排除成功"。

**为什么不开独立分支 / 独立仓库**：

- **分支不隔离路径**：pnpm 看的是检出后的目录，同一路径在任何分支都一样；而且 v2 的工作已经在 `main` 上，设计资产与计划本来就该在 `main`
- **独立仓库**解决的"外层干扰"问题，靠上面的目录层级已经解决；它的收益（独立发版、权限分开）现在用不上
- **触发条件**（满足任一再拆，用 `git subtree split` 把历史一起带走）：① v2 要独立发版 / 开源 ② 外部协作者只该看到 v2 ③ 团队分工真的分开

### 4.3 框架 React 19 与配套版本

**本地检出的一手数据**（`package.json` 实测）：

| 项目 | React | TypeScript |
| --- | --- | --- |
| 多包仓库 A（103 个子包）| **19.2.7** | 6.0.3 |
| 多包仓库 B（20 个子包）| **19.2.0** | ~5.9.0 |
| 命令行工具 A | **^19.2.4** | ^6.0.2 |
| 多包仓库 C（54 个子包）| ^18.2.0 | ^6.0.3 |
| 我们旧包 `cui` | ^18.2.0 | **^4.9.4** |

**registry 现状**：`react` / `react-dom` / `@types/react` 最新均为 **19.3.0**，**没有 React 20**；
官方说明 19 已稳定且 **minor 之间不破坏**。

**定下来的版本**：

| 包 | 版本 | 理由 |
| --- | --- | --- |
| `react` · `react-dom` | **`^19.3.0`** | 当前主版本；minor 不破坏，用 `^` 安全 |
| `@types/react` · `@types/react-dom` | **`^19.3.0`** | 与运行时严格对齐 |
| `typescript` | **`^6.0.3`** | **同行都还在 6**（含最新的那些）；刚 GA 的 Go 版编译器（7.x）等工具链跟上再说 |
| `vite` | **`^8.3.1`** | 见 4.6 |

**为什么敢直接从 18 跨到 19**：v2 是**新建**，不继承旧应用，没有迁移成本。

**但从旧包复制代码时要注意**：React 18 → 19 有破坏性变更（`ReactDOM.render` 等旧入口、`propTypes`、`ref` 处理），
复制进来的组件**一律按 19 改** —— 这本来就在「四道工序」里。

**同步完成**：`cui-desktop` 已升到 **Vite 8.3.1**，两边现在是同一套工具链（验收见 §2）。

### 4.4 包管理器统一用 pnpm

**为什么是 pnpm**：

| # | 理由 |
| --- | --- |
| 1 | **旧仓库根已经是 pnpm**（`pnpm-lock.yaml`），并已配 Turborepo —— 选它=**零迁移** |
| 2 | **monorepo 是它的主场**：非扁平 `node_modules` + 严格依赖隔离（一个包只能 import 自己声明的依赖），这是**正确性与安全**上的实打实好处 |
| 3 | **磁盘**：多包共享一份存储，比传统方式省一半以上 |
| 4 | **同行普遍**：多包仓库几乎都用它 —— 踩坑资料最厚 |

**为什么不改用"更快的"（如 Bun）**：

- Bun 的安装确实快得多，但它是**换运行时**，不只是换包管理器；而**安装速度不是我们的瓶颈**（我们是浏览器应用，装依赖主要发生在 CI）
- 在**多包仓库的管理成熟度**上，pnpm 仍占优
- 我们**暂不引入第二个运行时**；若将来想用，那是**运行时的独立决定**，不是包管理器的升级

**版本**：已升到 **pnpm 10.34.6**，并在根 `package.json` 用 **`packageManager`** 字段锁死 ——
避免"有人用 8、有人用 12，锁文件互相改写"。本次升级前本机是 8.15.9，而仓库锁文件是 `lockfileVersion 9.0`，版本不匹配。

### 4.5 旧包不升级，也不删

旧仓库里的五个包 —— 状态存储 · 事件总线 · 甘特图 · 动作流 · 编辑器插件 —— **v2 不再使用**：
前端的业务逻辑本来就要重做，其中两个（动作流 · 编辑器插件）是**上一代低代码产品**的产物。

但**不升级 ≠ 可以删**：

| 事实 | 结论 |
| --- | --- |
| 其中四个仍被旧应用 `packages/cui` 依赖（状态存储 · 事件总线 · 动作流 · 编辑器插件）| **保留**，不动它们 —— 旧应用还要能跑 |
| **甘特图**没有任何包依赖它 | 记为**候选清理**，但要先查旧应用源码里有没有直接 import |
| 事件总线是**公开包的分叉副本** | 将来若真需要，用**上游 npm 包**，不要再维护分叉 |

**v2 要用到非 UI 能力时的做法**：按 `01` 的一贯原则 —— **按需**从旧包取**能力**，在自己这边**重新实现**，
不复制旧配置、不复活旧包（见 §6 与四道工序）。

### 4.6 构建工具 Vite

| # | 理由 | 说明 |
| --- | --- | --- |
| 1 | **与桌面壳一致** | `cui-desktop` 是 **Vite + Tauri**（照 Tauri 官方配方：端口 1420 / HMR 1421）→ Web 与桌面共用一套工具链，不维护两套 |
| 2 | **构建器不绑框架** | Vite 不要求用哪个框架：现在定了 **React 19**，将来换框架或升大版本都**不用动构建配置**；而有的构建方案与特定框架绑定，直接排除 |
| 3 | **没有历史包袱** | 传统打包器的**兼容层**类方案（为迁移而生）对我们没有价值 —— 我们没有要迁移的旧构建 |
| 4 | **生态与踩坑资料最厚** | 同类产品与开源项目的客户端应用大量使用，遇到问题容易找到答案 |

**版本：Vite 8.3.1**（registry 的 `latest`）。

**为什么是 8 而不是 6**：本地两个最新的多包仓库都已在 8；registry 的 `latest` 就是 8.3.1（beta 另是 8.3.0-beta.1）。
升到 8 后：构建 **42ms**（6 上 76–106ms），五检查与 35 个样本全过。

### 4.7 界面底座：不用 antd

**结论**：**行为**用 **`@base-ui/react`**（headless ✓ 无外观 ✓）· **视觉**用 **Celadon 的 `tokens.less`** ✓；**不用 antd** ✗。

**依据**：

1. **我们真要用 antd 的那些，旧仓库已经有、而且是零 antd 的** —— 见 4.8；antd 能占的位置只剩「视觉 + 浮层行为」，
   而**视觉是我们的设计** ✓、**行为正是 headless 的活** ✓
2. **同方向已有先例**：工作区内一个同领域的开源 UI 组件库，其新的组件目录已整体建在 `@base-ui/react` 上
   （**42 个组件**），**21 个旧 antd 组件标了 `@deprecated`**、注释直指"改用新目录里的同名组件"，**325 个文件**已引用新目录；
   antd 在那边只剩**主题引擎**角色（把 antd 的 `ThemeConfig` 渲染成 CSS 变量）。
   **我们的 token 是纯 CSS 变量** —— 不需要这一层
3. **采用面已验证**：`@base-ui` 出现在工作区内**两个独立产品**的依赖里（其中一个含桌面应用）；
   而 **React Aria 在工作区 0 个项目使用** ✗

**`@base-ui/react@1.8.0` 的实况**：40 个组件 · `peer: react ^17 || ^18 || ^19` · MIT · 10 个正式版 · 2026-09 仍在更新。
其中 **`direction-provider` 内建 RTL** —— `19 数据格式` 的 RTL 成本可据此下调 ✓

**对照我们的用量**（旧应用 59 种 antd 组件 ✗）：

| 类别 | 结论 |
| --- | --- |
| **有行为、有原生对应**（33 种 ✓）| `message`→`toast` · `Tooltip`→`tooltip` · `Modal`→`dialog` · `Button`→`button` · `Input`→`input`/`number-field` · `Form`→`form`+`field`+`fieldset` · `Select`→`select`/`combobox`/`autocomplete` · `Switch`/`Checkbox`/`Radio` · `Tabs` · `Dropdown`→`menu` · `Popconfirm`→`popover`+`alert-dialog` |
| **纯视觉**（自己写几行 ✓）| `Spin` 49 · `Typography` 13 · `Tag` 6 · `Empty` 5 · `Space` · `Row`/`Col` · `Skeleton` · `Statistic` · `Timeline` |
| **真要自己写 ✗** | `Table`（2 处）· `Upload`（3 处）· `DatePicker`/`TimePicker`/`RangePicker`（共 4 处，`date-fns` 是 Base UI 的**可选** peer ✓）· `Tree`/`Cascader`/`Mentions`/`Image`/`Breadcrumb`/`Anchor`（各 1–2 处）|

**已知代价** ✗：`message`/`Tooltip`/`Modal` 等约有 **2700 处调用点** —— 靠**同名的薄封装**
（`message` → `toast`，API 形状照旧）**机械替换**扛，不逐个重写逻辑。

### 4.8 旧仓库资产取舍：搬什么、不搬什么

**搬**（这三层本来就零 antd ✓，是「搬逻辑、换样式」的典型 ✗）：

| 资产 | 规模 | 现状 |
| --- | --- | --- |
| `components/ui/inputs/`（**15 个原子输入**）| 30–419 行 | **零 antd**、纯 HTML + CSS Modules、**schema 驱动**、受控字段契约（`value`/`onChange`/`onBlur`/`error`/`hasError`）|
| `components/ui/inputs/validation.ts` | 123 行 | 单字段校验（必填 / 长度 / 正则 / 数值 / `errorMessages` 可覆盖）**零依赖** |
| `PropertySchema` 类型契约 | 158 行 | **22 个文件在用**，是设置类表单的底座 |
| `ui/Setting` · `ui/Provider` · `ui/Button` · `ui/Dropdown` | 73–745 行 | `ui/` 下 **26 个 tsx 中 21 个零 antd** ✓ |

**不搬** ✗：

- **`edit/FormBuilder` · `edit/FlowBuilder`** —— 低代码时代的产物，**旧应用里 0 处引用** ✓
- **`DataTable` · `PaginatedTable`** —— 服务佣金 / 余额 / 用量 / 审计 / 账单那套**商业化后台**，新应用不需要 ✗

**搬迁时要修的** ✗（以 `validation.ts` 为例，这是四道工序落到具体文件的样子）：

| 动作 | 内容 |
| --- | --- |
| **换** ✗ | 7 条硬编码英文报错 → `ui.*` 的 i18n key（四语）|
| **补** ✗ | `new RegExp(schema.pattern)` 无保护 —— schema 来自**服务端**定义，正则非法会抛异常，要 `try/catch` |
| **删** ✗ | `custom: 'Invalid value'` 有文案无实现 · `getErrorClasses` 0 处调用 |
| **留** ✓ | 函数形状（单字段 · schema 驱动 · `errorMessages` 可覆盖）|

### 4.9 i18n 运行时：i18next

**结论**：应用侧用 **`i18next` + `react-i18next`**；语言包按 **`locales/<locale>/<namespace>.json`** 组织；
设计页沿用现有零依赖方案（`design/i18n/*.json` + `tr()` + `check-i18n.mjs`）。

**依据**：

- 工作区内两个已做 i18n 的产品都用它，其中一个做到 **18 种语言 / 56 个命名空间**
- 自带**命名空间 · 按需加载 · 复数（英文 `_one`/`_other`）· 插值**，成熟度最高
- **可直接读现有嵌套 JSON**，不必改文件格式

**硬要求：新增语言 = 只加一个目录，不改代码**

| 项 | 做法 |
| --- | --- |
| 语言包与命名空间 | 用 **`import.meta.glob('../locales/*/*.json')` 发现**，不在 TS 里逐个 `import` |
| 类型 | 只从**基准语言**生成 → 加语言不动类型 |
| 检查器 | 通用规则（key 完整性 / 缺 key / 漏翻）按**目录发现**执行；**语言专属规则**（繁中夹简体 · 日文同中文）仍按语言声明 |

**命名空间**：按功能域切（`chat` / `settings` / `inbox` …），与使用它的代码就近放置。
当前 579 key 先单文件即可，切分随页面模块推进。

**格式化**：**规则只有一份 —— `19 数据格式`**。`i18next` **自带 `datetime` / `number` / `currency` / `relativetime`** ✗（底层就是 `Intl`）→ **文案里嵌的日期与数字优先走它** ✓；`19` 要求而它不覆盖的（**周起始日 `Intl.Locale.weekInfo`** ✓ **列表 `Intl.ListFormat`** ✗）**直接调 `Intl`** ✓。两条路的**参数必须一致** ✗（`hourCycle: 'h23'` 等）；**语言取当前生效语言** ✓ —— i18next 自身即如此，直调时用 `i18n.resolvedLanguage` ✗。

**翻译流程**（`01` 内落地）：术语表 · 翻译规则 · 给 AI 的翻译提示词 · 风格样例，与 `check-i18n.mjs` 的自动检查配套。

### 4.10 路由与宿主集成

**结论**：**React Router 库模式** —— 装 `react-router@^8`，**不装** `@react-router/dev`；路由写在代码里。

**依据**：

- Vite + React 的项目里它是事实标准（工作区内两个不同产品分别用它的框架模式与库模式）
- 不需要 SSR（PWA + Tauri），框架模式的主要收益用不上
- 框架模式自带 dev server 并接管构建，会与「子路径挂载 + 引擎代理」争控制权；库模式下一套 Vite 配置管到底

**旧应用现在的形态（迁移约束的来源）**：

| 项 | 现状 |
| --- | --- |
| 路由 | 引擎框架的**约定式（文件）路由**：`pages/**` 目录即路由 |
| 挂载 | **子路径**：`base` = `publicPath` = `/${process.env.BASE}/`，构建期注入 |
| 模式 | **browser history**（非 hash）|
| 跳转调用 | `history.push` 68 · `useNavigate` 18 · `useLocation` 16 · `useParams` 10 |
| 引擎集成 | dev 时把 **12 个前缀**转发给引擎：`/api` `/v1` `/assets` `/components` `/tools` `/agents` `/admin` `/brands` `/docs` `/ai` `/.well-known` `/iframe` |
| WS | **单独插件**处理 upgrade（原框架的 proxy 不管 WS）|
| SSE | proxy 上显式设 `Cache-Control: no-cache, no-transform` · `Connection: keep-alive` · **`X-Accel-Buffering: no`** |

**由此确定的硬约束**：

1. **`basename`**：应用挂在 `/<BASE>/` 下，React Router 必须配 `basename`，且与 Vite 的 `base` **取自同一变量**；PWA 的 `scope` 与 `start_url` 同步
2. **保留前缀**：上表 12 个前缀归**宿主引擎**，新应用路由**不得占用**
3. **`/iframe` 是无外壳模式**：旧应用有 `/iframe` 页面，布局在路径含 `/iframe` 时**不渲染外壳** —— 保留
4. **WS upgrade**：用 Vite `server.proxy` 的 `ws: true`；SSE 三个头照旧
5. **路由 API 替换**：搬迁页面时 `history.push` / `useNavigate` / `useLocation` / `useParams` 一律换成 React Router 的对应 API（计入 `MIGRATION.md` 第 5 类改动）

### 4.11 数据请求：原生 fetch + 搬 openapi

**结论**：传输用**原生 `fetch`**（不用 axios）；类型化客户端**搬旧仓库的 `openapi/`**；
**不引入数据缓存库**（如 react-query）；组件侧用**自建小钩子**统一加载与错误状态。

**依据**：

- 旧仓库 71 个文件、12 444 行的 `openapi/` **本身就建在 `fetch` 上**（`openapi.ts` · `file.ts`），全仓无 axios
- 鉴权是 **cookie**：`credentials: 'include'`，SSE 用 `EventSource(url, { withCredentials: true })`，另有 CSRF token ——
  这也是**子路径挂载 + 同源代理**必须成立的原因
- 流式有两套（`EventSource` / fetch 流的 `body.getReader()`）+ WebSocket 一套 —— **数据缓存库管不到它们**
- 工作区内两个 **Vite** 项目（含最接近我们的那个）**都不用请求库**；用 react-query 的两家都是 Next 应用

**边界**：

| 归谁 | 内容 |
| --- | --- |
| `fetch` + `openapi/` | 请求、错误形状、超时、鉴权头、CSRF |
| 自建 `useRequest` 钩子 | 加载 / 错误 / 取消 / 重试 / 依赖变化 |
| 手写 | SSE（`EventSource` 或 fetch 流）· WebSocket |
| **先不引** | 缓存 / 失效 / 乐观更新 —— 等"同一份数据被多个页面重复取"成为日常再评估 |

**不要**：在页面里散落 `useEffect` + `fetch`（旧仓库有 15 个文件这样，其余 139 个走 `openapi/` 封装）。

### 4.12 日期运算与时区：date-fns

**结论**：日期**运算**与**时区换算**用 **`date-fns` + `@date-fns/tz`**；**格式化不归它** —— 格式化归 `Intl`（见 `19` 的 §3.7）。

**为什么需要库**（原生不够）：

- **原生 `Temporal` 尚不可用**：本机 Node 22 里 `typeof Temporal === 'undefined'`，浏览器/WebView 同样不能作为基线
- **加减 / 区间 / 日历网格 / 跨时区换算**都要自己写；`Intl.DateTimeFormat({ timeZone })` 只能**显示**，不能**运算**
- **唯一不需要库的**是相对时间：`Intl.RelativeTimeFormat` ✓

**为什么是 `date-fns`（而不是 `dayjs` / `luxon`）**：

| 候选 | 判断 |
| --- | --- |
| **`date-fns` + `@date-fns/tz`** | **选它** —— Base UI 的**官方适配器**（`temporal-adapter-date-fns`），用它的日期组件无需自己接线；tree-shakable，实际进包的只有用到的函数；`@date-fns/tz` 的 `TZDate` 直接吃 **IANA 时区**，与 `19` 的时区契约同口径 |
| `luxon` | Base UI 也有适配器，但 **4.5 MB 且不可 tree-shake** |
| `dayjs` | 本地用得最多（9 个项目）且最小（666 KB），但 **Base UI 无适配器**；时区需额外插件；对象可变 |

**分工（两处不要混）**：

| 场景 | 用什么 |
| --- | --- |
| 显示日期 / 时间 / 数字 / 货币 / 相对时间 | **`Intl`**（或 i18next 的 formatter），规则见 `19` |
| 加减 · 区间 · 日历网格 · 时区换算 | **`date-fns`** |
| 存储与传输 | **UTC**（`19` 的铁律），客户端上送 `clientTimeZone` |

---

## 5. 子项与交付物

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

## 6. 素材来源（旧包，按需复制）

| 素材 | 规模 | 用途 |
| --- | --- | --- |
| `openapi/` | 71 文件 / 12 444 行 | **搬**作后端 SDK（本身建在 `fetch` 上，见 4.11）：按需子集，去掉旧框架耦合 |
| `utils/` | 27 文件 / 1 018 行 | 请求封装 / 格式化 / 存储 |
| `hooks/` | 16 文件 / 1 352 行 | 通用 hooks |
| `components/ui/` | 26 个 tsx（**21 个零 antd**）| **搬输入层与 schema 契约**：15 个原子输入 + `validation.ts` + `PropertySchema` + `Setting`/`Provider`/`Button`/`Dropdown`；详见 4.8 |
| `components/**` 业务件 | `AgentPicker` 597 行 · `SecretsManager` · `TOTP` · `WelcomeWizard` | 带真实业务逻辑 → **搬逻辑、换外观**；`AgentPicker` 是否保留待 08 专家页定 |
| ~~`edit/FormBuilder` · `edit/FlowBuilder` · `DataTable`/`PaginatedTable`~~ | — | **不搬** ✗：低代码 UI（旧应用 0 引用）与商业化后台表格，见 4.8 |
| 构建期配置 | 主题链 · 代理 · 图标字体 | 只取能力，**重新实现**（不复制旧配置）|

> 旧构建链里明确**不照搬**的三件事：① 主题变量命令行生成链 ② 自定义"原始文本"loader（shadow DOM 动态注入用）③ 编辑器 worker 的打包方式 —— 见 [../MIGRATION.md](../MIGRATION.md)。

## 7. 验收（Done）

1. 新包**一条命令**可以起 dev、可以出生产构建；
2. 后端三条链路（认证 / 会话列表 / 流式对话）跑通，含 WebSocket；
3. 四语切换可用 + 缺 key/漏翻检查在 CI 生效；
4. 图标三档规格可用且按需打包；
5. 改一处设计 token → 组件库主题与色卡同步；
6. 质量门禁能拦住硬编码色 / 错配对 / 缺 key / 装饰色当文字；
7. **运行期**对比度校验可用（不只是设计期色卡）；
8. 反向依赖边界（禁 `@yaoapp/cui`）在构建期生效。

## 8. 台账

> 规则：每从旧包复制一个文件，登记：**源 → 目标 → 改了什么 → 为什么**（也可记在 `../MIGRATION.md`）。
> 复制的文件必须过四道：① 删掉没用到的分支 ② 换成语义 token（禁硬编码）③ 文案走 `ui.*` ④ 命名全称化。

| 源 | 目标 | 改动 | 原因 |
| --- | --- | --- | --- |
| —（本阶段为**新建**：`package.json` / `vite.config.ts` / `app/` / `pnpm-workspace.yaml`，未从旧包复制代码）| | | |
