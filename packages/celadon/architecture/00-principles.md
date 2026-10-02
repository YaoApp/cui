# 00 · 铁律与结构总纲

- **版本**：v1.26
- **最后修改**：2026-10-02 13:47:38
- **说明**：八条铁律 + 结构总纲（分层 · 落位 · 依赖 · 命名 · 测试 · 公共态）+ 一个组件一个目录

## 1. 八条铁律

1. **单一来源** —— 颜色/间距只在 `../design/tokens.less` · 接口类型只在 `openapi/` · 文案只在 `locales/`。不许第二份。
2. **零反向依赖** —— 不 `import '@yaoapp/cui'`（旧包）。旧包不升级 · 不复活 · 不删。
3. **依赖单向** —— 只能上层依赖下层（§2）；下层不引上层，同层不互相 import 业务件。
4. **宿主是边界** —— `window.$app` / `window.$global` 只在平台层碰一次，之后以类型化接口向上暴露。
5. **禁硬编码** —— 颜色 / 间距 / 圆角 / 字号不写字面量（系统色与品牌官方色除外，见 `09-theme.md` / `10-icons.md`）。
6. **全称命名** —— 不缩写（`btn` → `button`）；文件名 kebab-case。
7. **平台差异走适配器** —— 宿主 / `/iframe` 无壳 / 桌面三端的差异由适配器接口注入（导航 · 存储 · 主题）；不许散落 `if (isDesktop)`。
8. **边界由机器强制** —— 层间方向必须有会让 CI 失败的规则（`03-boundaries.md` §4 · `13-quality-gates.md`）。

## 2. 分层、落位与依赖

本章是**总纲**：结构长什么样 · 东西放哪 · 谁依赖谁。细则在各节里。

**结构图**

源码根 **`app/src/`**：`app/` 是 Vite root，**目录名即公开 URL**，源码再下一层才避开引擎保留前缀（见 `04-host-integration.md`）。

```
  路由    app/src/routes/      路由表 · 表面布局（**只装配，不写业务**）
    ↑
  组件层  app/src/components/   纯视觉 + 行为 · 不认识业务 · 不发请求
    ↑
  能力层  app/src/features/     按业务切分 · 页面 + 组件 + 状态 + 测试都在里面 · 自洽
    ↑
  公共态  app/src/stores/     跨功能的事实（无主状态）· 文件**不加 `.store` 后缀** · **不许 import 上层**
    ↑
  数据层  app/src/data/         openapi 客户端 · 取数钩子 · 流式通道
    ↑
  平台层  app/src/platform/     宿主全局 · **路由机制与挂载** · 主题注入 · 运行时壳
```

箭头 = 允许的依赖方向（上层可依赖下层）。

**不在依赖图里**

| 什么 | 为什么 |
| --- | --- |
| `platform/utils/`（纯函数 · 常量 · 类型） | 不依赖任何上层，**所有层可用** —— 跨层共享放这里，**不另设 `lib/`** |
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
| 路由表（URL → 元素）· 表面布局（`main` 主区 · `side` 侧边）| `routes/` |
| 机制：router 实例 · basename 适配器 · 文档标题 | `platform/router/` |
| 导航项 · "哪条 URL 是当前"的比较 | `platform/utils/nav.ts`（`routes/` 与 feature 都要用）|

地址语法：**对象在路径 · 表面在首段 · 面板与选中项在具名 query**（见 `07-routing.md`）。

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

**公共状态**：说不清归哪个功能的跨功能事实（例：侧边面板里开着谁）。判据是**有没有自然所有者**，
不是"用的人多不多"。

| 放什么 | 住哪 |
| --- | --- |
| **私有**状态（只归一个功能） | `features/<域>/<域>.store.ts`（带 `.store` 后缀）|
| **公共**状态（无主） | `stores/<事实>.ts`（目录即角色，**不加后缀**）|

两组正交的问题，别混：**① 归谁（私有 / 公共）→ ② 要不要进地址栏**。私有的自己绑地址栏（`?q=`），
公共的由**路由层**替它绑一次（`?sideEntity=`，见 `07-routing.md`）。两者共用同一套测试复位（自动发现）。

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

**全站只有这一层发请求。**

```
app/src/data/
├── openapi/client.ts            fetch 封装（cookie + CSRF + 错误归一）
├── openapi/inbox.ts             某域的接口方法
├── hooks/use-request.ts         加载 / 错误 / 取消 / 重试的唯一实现
└── stream/session-events.ts     SSE 与 WebSocket 通道
```

### 2.6 平台层

**只有这一层碰宿主全局**；三端差异做成适配器，上层只拿接口。

```
app/src/platform/
├── host/globals.ts              window.$app / $global 的类型化封装与初始化
├── navigation/adapter.ts        导航适配器（宿主 / 无壳 / 桌面各一实现）
├── theme/theme.store.ts         主题状态（写根元素 data-theme）
├── utils/                       纯函数 · 常量 · 类型（不依赖上层 · 所有层可用）
└── mount.tsx                    挂载入口
```

### 2.7 文件名里的角色

- **主文件不带角色后缀** —— `<名>.tsx`（组件）与 `<域>.tsx`（能力层）形状一致；样式 `<名>.less` / `<域>.less`；单测 `<名>.test.tsx` / `<域>.test.tsx`。
- **辅文件用点分角色，任何一层都能用** —— `<>.store.ts`（组件也可以有自己的私有 store）· `*.browser.ts` · `*.agent.md` · `*.agent.mjs`。

### 2.8 测试

用例按**测什么**分四层，各自有固定的家：

| 层 | 住哪 |
| --- | --- |
| 单元 / 组件 | **与源文件同目录**（`<名>.test.tsx`）—— 不许进 `tests/` |
| 浏览器 | `features/<域>/tests/<场景>.browser.ts` |
| 拟人 | 同一目录：`<场景>.agent.md`（剧本）+ `<场景>.agent.mjs`（采集脚本）|
| 检查器自测 | `scripts/tests/`（每条规则一个正例 + 一个违规例）|

共享支持放 `test-support/`（`setup.ts` 每个用例后复位 · `stores.ts` 按 `*.store.ts` 自动发现 store）。
命令与日志见 `14-testing.md`。
