# 00 · 铁律与分层

- **状态**：✅ **八条铁律与分层已定**（2026-10-01）· 细则待讨论（见 §3）
- **依据**：`plan/01` §1.2 的散落约束 + 本文整理

## 1. 八条铁律

1. **单一来源** —— 颜色/间距只在 `../design/tokens.less` 定；接口类型只在 `openapi/` 定；语言文案只在 `locales/` 定。任何地方不许出现第二份。
2. **零反向依赖** —— 本包**不得** `import '@yaoapp/cui'`（旧包）。旧包不升级 · 不复活 · 不删。
3. **依赖单向** —— 只能**上层依赖下层**（见 §2）；下层不许反向引用上层，同层之间不许互相 import 业务件。
4. **宿主是边界** —— 引擎全局（`window.$app` / `window.$global`）只允许在**平台层**碰一次，之后以类型化接口向上暴露。
5. **禁硬编码** —— 颜色 / 间距 / 圆角 / 字号不许写字面量（系统色与品牌官方色除外，见 `09` / `10`）。
6. **全称命名** —— 变量、函数、类名不用缩写（`btn` → `button` · `cfg` → `config`）；文件名 kebab-case。
7. **平台差异走适配器** —— 宿主主应用 / `/iframe` 无壳 / 桌面三种挂载的差异，各由**适配器接口**注入（导航 · 存储 · 主题）；
   **不许散落 `if (isDesktop)` / `if (isIframe)`**。
8. **边界由机器强制** —— 层间方向不许只写在文档里；**必须有会让 CI 失败的规则**（见 `03` §4 与 `13`）。

## 2. 分层与依赖方向

**源码根是 `app/src/`** —— 包根（`packages/celadon/`）是设计体系本身，应用代码全部住在 `app/` 下；
`app/` 是 Vite 的 root，所以它的**目录名就是公开 URL**，源码必须再下一层到 `app/src/`
（否则 `/components/*` 会撞上引擎的保留前缀，被代理截走）。

```
  组件层  app/src/components/   纯视觉 + 行为（@base-ui）· 不认识业务 · 不发请求
    ↑
  能力层  app/src/features/     按业务切分 · 页面 + 组件 + 状态 + 测试都在里面 · 自洽
    ↑
  数据层  app/src/data/         openapi 客户端 · 取数钩子 · 流式通道
    ↑
  平台层  app/src/platform/     宿主全局 · 路由与挂载 · 主题注入 · 运行时壳
```

**箭头方向 = 允许的依赖方向**（上层可依赖下层）。`app/src/lib/`（纯函数 · 常量 · 类型）**无依赖**，任何层可用；
`design/` 与 `scripts/` 是资产与工具，**不进应用依赖图**。

**同层之内也有方向** —— 这是"组件引用组件"的出口：

- `components/<名>/` **可以**引用 `components/base/`（基础组件）；**`base/` 不可以**引用上层组件；
- `features/<域>/` **内部自洽**：页面 · 组件 · 状态 · 测试都住在一起 · **feature 之间不许互相 import**。

**判据一句话**：写一个 `import` 前先问 **"我是不是在往上引？"** 是，就错了。

两条落位规则：

- **路由薄** —— 路由只做组合与装配，**业务实现不许住路由目录**；
- **组件不发请求** —— 组件里不出现 `fetch` / `EventSource` / `new WebSocket`，取数走数据层钩子（见 `05`）。

### 每层一个示例

**组件层** —— `base/` 放**基础组件**（原子控件）；**其余组件直接命名**，直接用 `base/` 里的件。

**每个组件都是同一套结构** —— 一个组件一个目录，槽位固定，可选槽位按需留空：

```
app/src/components/<名>/
├── index.ts               出口（必有）
├── <名>.tsx               组件本体（必有）
├── <名>.test.tsx          单元用例（必有 · **与源文件同目录**）
├── <名>.less              样式（可选：能用 token 类就不写）
└── parts/                 私有子组件（可选）—— 里面每一项也是一个组件，同一套结构
    └── <子组件>/          index.ts · <子组件>.tsx · <子组件>.test.tsx · <子组件>.less · parts/
```

**所有组件都用这一套结构，`parts/` 也不例外** —— 谁都可以有私有子组件，没有哪个目录被禁止。两个填充示例：

```
base/button/                            基础件
├── index.ts       export { Button } from './button'
├── button.tsx     variant × size，颜色全走 --brand-* token
├── button.test.tsx
└── button.less

page-header/                            复合件（内部用 base/button）
├── index.ts
├── page-header.tsx
├── page-header.test.tsx
├── page-header.less
└── parts/
    ├── title/                        子组件：同样一个目录、一套结构
    │   ├── index.ts
    │   ├── title.tsx
    │   └── title.test.tsx
    └── actions/
        ├── index.ts
        └── actions.tsx
```

> **store 的测试复位是全自动的**：测试支持用 `import.meta.glob` 发现所有 `*.store.ts`，登记初始状态、逐用例复位 ——
> 新增 store 不必改任何配置（`theme.store.test.ts` 里有一条依赖顺序的守卫证明这张网还在）。

> `parts/` 是**通用槽位**：组件内部要拆的私有子组件放这里，按需建、不需要就留空。
> 区别只在**放什么**（`base/` 放只描述外观的基础件），不在**怎么放**。

**文件名里的角色**（点分只在"同一目录里不止一个同名角色"时才需要）：

- **主文件不带角色后缀** —— 组件的 `<名>.tsx` 与能力层的 `<域>.tsx` **形状一致**；样式 `<名>.less` / `<域>.less`；
  单测 `<名>.test.tsx` / `<域>.test.tsx`。`.page` 之类的后缀是啰嗦，不要。
- **辅文件用点分角色，任何一层都能用** —— `<>.store.ts`（**组件也可以有自己的私有 store**）·
  测试产物 `*.browser.ts` · `*.agent.md` · `*.agent.mjs`。
- store 的测试复位是**按 `*.store.ts` 自动发现**的，所以组件、feature、平台层放哪都覆盖得到。

**能力层** —— 一个业务一个目录，**页面 · 状态 · 测试都在里面**；人和 Agent 都在同一处找齐。

```
app/src/features/inbox/          ← 示例：收件箱
├── components/inbox-list/       私有组件（一个组件一个目录；单测在它旁边）
├── inbox.tsx                    页面：组合状态 + 组件（主文件不带角色后缀）
├── inbox.less                   页面样式（可选）
├── inbox.test.tsx               单元用例：与源文件同目录
├── inbox.store.ts               状态：只服务本 feature（zustand + persist）
├── inbox.store.test.ts          单元用例：同上
├── tests/                       整体场景：浏览器与拟人（强约束）
│   ├── main-path.browser.ts
│   └── main-path.agent.md · main-path.agent.mjs
└── index.ts                     出口：只导出页面与必要类型
```

**数据层** —— **全站只有这一层发请求**。

```
app/src/data/
├── openapi/client.ts            ← 示例：fetch 封装（cookie + CSRF + 错误归一）
├── openapi/inbox.ts             ← 示例：某域的接口方法
├── hooks/use-request.ts         加载 / 错误 / 取消 / 重试的唯一实现
└── stream/session-events.ts     SSE 与 WebSocket 通道
```

**平台层** —— **只有这一层碰宿主全局**；三端差异在这里做成适配器，上层只拿接口。

```
app/src/platform/
├── host/globals.ts              ← 示例：window.$app / $global 的类型化封装与初始化
├── navigation/adapter.ts        ← 示例：导航适配器（宿主 / 无壳 / 桌面各一实现）
├── theme/apply-theme.ts         ← 示例：把 tokens.css 的主题挂到根容器
└── mount.tsx                    挂载入口
```

> **没有全站 `state/` 目录** —— 状态跟 feature 走。真出现"多个 feature 都要用"的状态时按 `06` 的判据落位，**不预设**。
>
> **一个组件一个目录**：目录里放它的本体 · 样式，用例进 `tests/`，**名字都用组件名**（只有出口叫 `index`）。
> 这样 `.less` 与用例都有地方放，人和 Agent 也不必在"文件还是目录"之间猜。
>
## 3. 已定 / 待讨论

**已定**（2026-10-01）：

- 分层就是上面**四层 + 工具层**（`lib/`），**源码根是 `app/src/`**（包根是设计体系，不是应用）；
- `components/base/` 放**基础组件**（只描述外观、不认识业务）；其余组件**直接在 `components/` 下命名**（判据见 `03` §3）—— **所有组件目录结构完全相同**。

**待讨论**：

- `components/base/` 的**上提阈值**是否就定"第三个使用者"。
- `app/src/lib/` 是否收窄为"纯函数"，还是也放跨层常量与类型。
- 是否再加一个 `app/src/routes/`（薄路由）与 `features/` 并列。
