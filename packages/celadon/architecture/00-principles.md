# 00 · 铁律与结构总纲

- **版本**：v1.63
- **最后修改**：2026-10-03 11:54:50
- **说明**：八条铁律 · 分层与落位 · 依赖方向 · 命名 · 公共态 · 测试

## 1. 八条铁律

1. **单一来源** —— 颜色/间距只在 `app/src/platform/theme/`（**唯一代码入口**；**例外：品牌官方色**，
   见 `10-icons.md`）·
   改色先改设计规范 `design/tokens.less`，再跑 `scripts/build-css.mjs`）·
   接口类型只在 `app/src/data/`（**手写强类型**）·
   **文案只在语言包**（谁的词跟谁走：feature 私域 `app/src/features/<域>/locales/` · 组件私域 `app/src/components/<名>/locales/` ·
   共用词 `app/src/locales/`，见 `08-i18n.md`）。不许第二份。
2. **零反向依赖** —— 不 `import '@yaoapp/cui'`（旧包）。旧包不升级 · 不复活 · 不删。
3. **依赖单向** —— 只能上层依赖下层（§2）；下层不引上层，同层不互相 import 业务件。
4. **宿主是边界** —— 客户端类型与宿主能力**只在平台层读一次**（`platform/client/`），之后以类型化接口向上暴露。
5. **禁硬编码** —— 颜色 / 间距 / 圆角 / 字号**与用户可见文字**不写字面量（系统色与品牌官方色除外，见 `09-theme.md` / `10-icons.md`）。
6. **全称命名** —— 不缩写（`btn` → `button`）；文件名 kebab-case。
7. **平台差异走能力开关** —— Web 与 Desktop 的差异经 `platform/client/` 的能力开关暴露；不许散落 `if (isDesktop)`。
8. **边界由机器强制** —— 层间方向必须有会让 CI 失败的规则（`03-boundaries.md` §4 · `13-quality-gates.md`）。

## 2. 分层、落位与依赖

本章是**总纲**：结构长什么样 · 东西放哪 · 谁依赖谁。细则在各节里。

**结构图**

源码根 **`app/src/`**：`app/` 是 Vite root，**目录名即公开 URL**，源码再下一层，公开路径才不带源码结构（见 `04-host-integration.md`）。

```
  路由    app/src/routes/      路由表 · 表面布局（**只装配，不写业务**）
    ↑
  组件层  app/src/components/   纯视觉 + 行为 · 不认识业务 · 不发请求 · **独有词随本目录走**
    ↑
  能力层  app/src/features/     按业务切分 · 页面 + 组件 + 状态 + 测试 + 语言包都在里面 · 自洽
    ↑
  公共态  app/src/stores/     跨功能的事实（无主状态）· 文件**不加 `.store` 后缀** · **不许 import 上层**
    ↑
  数据层  app/src/data/         接口类型（手写强类型）· 取数钩子
    ↑
  平台层  app/src/platform/     客户端类型与能力 · **路由机制与挂载** · 主题注入 · 运行时壳
```

箭头 = 允许的依赖方向（上层可依赖下层）。

**不在依赖图里**

| 什么 | 为什么 |
| --- | --- |
| `app/src/platform/utils/`（纯函数 · 常量 · 类型） | 不依赖任何上层 · **所有层可用** —— 跨层共享放这里，不另设 `lib/` |
| `app/src/locales/` | **跨 feature 的公共词**（基础组件词 · 通用词）—— 是内容不是代码，不参与依赖 |
| `design/` | 设计资产（token · 页面），不是代码 |
| `scripts/` | 工具，不进应用依赖图 |

**硬规则**

- `components/<名>/` **可以**引用 `components/base/`；`base/` 不可以引用上层组件。
- `stores/` 只放**公共**状态（说不清归哪个功能的）；能力层与路由可以 import 它，**它不许 import 上层**。
- `features/<域>/` 内部自洽；**feature 之间不许互相 import**。
- **`routes/` 在依赖方向的最上层**（目录上与 `features/` 并列，都在 `app/src/` 下）：
  它可以 import 组件层与能力层，**反过来不行** —— `features/` 与 `components/` 都不许 import `routes/`。
  路由只做装配，业务实现不住 `routes/`（地址语法见 `07-routing.md`）。
- 写 `import` 前问一句：**我是不是在往上引？** 是，就错了。

### 2.1 路由

**`routes/` 在依赖方向最上层**（目录上与 `features/` 并列），**只装配**：

| 放什么 | 住哪 |
| --- | --- |
| 路由表（URL → 元素）· 表面布局（主区在命名空间之下 · 侧边带 `side/` 前缀）| `routes/` |
| 机制：router 实例 · basename 适配器 · 文档标题 | `platform/router/` |
| 导航项 · "哪条 URL 是当前"的比较 | `platform/utils/nav.ts`（`routes/` 与 feature 都要用）|

地址语法：**对象在路径 · 侧边是一层前缀（`side/`）· 面板与选中项在具名 query**（见 `07-routing.md`）。

### 2.2 组件层

`base/` 放基础组件（原子控件 · 只描述外观）；其余组件直接在 `components/` 下命名。
**所有组件目录结构相同**，可选槽位按需留空：

```
app/src/components/<名>/
├── index.ts               出口
├── <名>.tsx               组件本体
├── <名>.test.tsx          单元用例（与源文件同目录）
├── <名>.less              样式（可选：能用设计类就不写）
├── <名>.store.ts          私有状态（可选：只服务这个组件 · 单测是 <名>.store.test.ts）
└── parts/                 私有子组件（可选）—— 每项也是一个组件，同一套结构
    └── <子组件>/          index.ts · <子组件>.tsx · <子组件>.test.tsx · <子组件>.less · <子组件>.store.ts · parts/
```

```
base/button/                    基础件
├── index.ts       export { Button } from './button'
├── button.tsx     variant × size，颜色全走 --brand-* token
├── button.test.tsx
└── button.less

page-header/                    复合件（内部用 base/button）
├── index.ts · page-header.tsx · page-header.test.tsx · page-header.less
└── parts/
    ├── title/                  index.ts · title.tsx · title.test.tsx
    └── actions/                index.ts · actions.tsx
```

**组件不发请求** —— 组件里不出现 `fetch` / `EventSource` / `new WebSocket`，取数走数据层钩子（`05-data-and-api.md`）。

### 2.3 公共态（`stores/`）

**说不清归哪个功能的事实**住这里；私有状态跟 feature 走。

| 项 | 规则 |
| --- | --- |
| 位置 | `app/src/stores/`（与 `features/` 并列）|
| 命名 | **事实名**（`current-team.ts` · `side-panel.ts`）；目录即角色，**不加 `.store` 后缀** |
| 方向 | 谁都可以 import；**它不许 import 上层** |
| 词汇 | **不许出现功能的词汇**；值指向对象时用通用条目（**只此一种情形**，形状见 `06-state.md`）|

细则（判据 · 谁绑地址栏 · 什么不进 store）见 `06-state.md`。

### 2.4 能力层

一个业务一个目录，**页面 · 状态 · 测试都在里面**。

```
app/src/features/inbox/
├── components/inbox-list/       私有组件
├── inbox.tsx                    页面
├── inbox.less                   样式（可选）
├── inbox.test.tsx               单元用例
├── inbox.store.ts               状态（zustand + persist · 只服务本 feature）
├── inbox.store.test.ts          单元用例
├── tests/                       整体场景：浏览器与拟人（细分见 `14-testing.md`）
│   ├── main-path.browser.ts     浏览器用例（一个场景一个文件）
│   └── main-path.agent.md       拟人剧本（三段：剧本 · 修改记录 · 测试记录）
│       main-path.agent.mjs      同场景的采集脚本（开浏览器走剧本 · 截图 · 报客观测量）
└── index.ts                     出口：只导出页面与必要类型
```

### 2.5 数据层

**只放接口类型 · 取数/订阅钩子 · 这一层范围内的转换工具**；**请求一律经 `platform/transport/`**。

```
app/src/data/
├── <域>.ts                      该域的接口类型（手写强类型）
├── hooks/use-request.ts         加载 / 错误 / 取消 / 重试的唯一实现
└── utils/                       共有不标准处的转换（解包裹 · 分页归一 · 错误收口；字段映射跟域走）
```

### 2.6 平台层

**宿主差异只在这一层消化**；上层只拿接口，不碰宿主。构成见 `15-platform.md` §2。

```
app/src/platform/
├── manifest.json        构建清单（客户端类型 · 版本 · 构建信息）
├── theme/               主题状态（写根元素 data-theme）
├── router/              路由机制与挂载
├── i18n/                语言包加载与解析
├── icons/               图标产物与底座挂载
├── client/              客户端类型 · 能力开关 · UA · 客户端标识
├── service/             服务信息（well-known）
├── credential/          凭据的存取与消费
├── transport/           对外通信的唯一出口
├── bridge/              桌面端宿主能力的唯一接入入口
├── webproxy/            agent sandbox 服务访问代理的域名构造规则
└── utils/               纯函数 · 常量 · 类型（不依赖上层 · 所有层可用）
```

### 2.7 文件名里的角色

| 文件 | 命名 |
| --- | --- |
| **主文件**（组件 · 能力层） | 不带角色后缀：`<名>.tsx` / `<域>.tsx`；样式 `<名>.less` / `<域>.less`；单测 `<名>.test.tsx` / `<域>.test.tsx` |
| **辅文件**（任何一层） | 点分角色：`<>.store.ts`（组件也可以有自己的私有 store）· `*.browser.ts` · `*.agent.md` · `*.agent.mjs` |
| **语言包** | `<locale>.json`（**BCP-47 规范形式**：`zh-CN.json`）；谁的词跟谁走：`features/<域>/locales/` · `components/<名>/locales/`；共用词在 `src/locales/` |

### 2.8 语言包

**谁的词跟谁走** —— feature 与组件都把**自己独有**的词放在自己目录里，两处以上共用的放公共包。
细则（加载 · 基准语言 · 后端边界 · 校验）见 `08-i18n.md`。

| 位置 | 是谁的词 |
| --- | --- |
| `app/src/features/<域>/locales/<locale>.json` | 该 feature **私有**的词（命名空间 = 域）|
| `app/src/components/<名>/locales/<locale>.json` | 该组件 **私有**的词（`components/base/` 基础件不放这里）|
| `app/src/locales/<locale>.json` | **两处以上共用**的词（基础件词 · 通用词）|

- 文件名是 **BCP-47 规范形式**（`zh-CN.json`），**检查器强制**。
- **用户可见文字必须走语言包** —— 组件 / store / 路由里不许写字面量（铁律 1 · 5）。

## 3. 测试

用例按**测什么**分四层，各自有固定的家（**基础语法**那一层没有用例 —— 它是成熟工具的规则集，
配置在 `eslint.config.js` / `.stylelintrc.json`，见 `13-quality-gates.md`）：

| 层 | 住哪 |
| --- | --- |
| 单元 / 组件 | **与源文件同目录**（`<名>.test.tsx`）—— 不许进 `tests/` |
| 浏览器 | `features/<域>/tests/<场景>.browser.ts` |
| 拟人 | 同一目录：`<场景>.agent.md`（剧本）+ `<场景>.agent.mjs`（采集脚本）|
| 检查器自测 | `scripts/tests/`（每条规则一个正例 + 一个违规例）|

共享支持放 `test-support/`（`setup.ts` 每个用例后复位 · `stores.ts` 按 `*.store.ts` 自动发现 store）。
**交付前必须过拟人并附截图** —— 机器层全绿不等于能交付，见 `14-testing.md`。
命令与日志见 `14-testing.md`。
