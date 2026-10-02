# 00 · 铁律与分层

- **状态**：✅ 已定（2026-10-01）

## 1. 八条铁律

1. **单一来源** —— 颜色/间距只在 `../design/tokens.less` · 接口类型只在 `openapi/` · 文案只在 `locales/`。不许第二份。
2. **零反向依赖** —— 不 `import '@yaoapp/cui'`（旧包）。旧包不升级 · 不复活 · 不删。
3. **依赖单向** —— 只能上层依赖下层（§2）；下层不引上层，同层不互相 import 业务件。
4. **宿主是边界** —— `window.$app` / `window.$global` 只在平台层碰一次，之后以类型化接口向上暴露。
5. **禁硬编码** —— 颜色 / 间距 / 圆角 / 字号不写字面量（系统色与品牌官方色除外，见 `09` / `10`）。
6. **全称命名** —— 不缩写（`btn` → `button`）；文件名 kebab-case。
7. **平台差异走适配器** —— 宿主 / `/iframe` 无壳 / 桌面三端的差异由适配器接口注入（导航 · 存储 · 主题）；不许散落 `if (isDesktop)`。
8. **边界由机器强制** —— 层间方向必须有会让 CI 失败的规则（`03` §4 · `13`）。

## 2. 分层与依赖方向

源码根 **`app/src/`**：`app/` 是 Vite root，**目录名即公开 URL**，源码再下一层才避开引擎保留前缀（见 `04`）。

```
  组件层  app/src/components/   纯视觉 + 行为 · 不认识业务 · 不发请求
    ↑
  能力层  app/src/features/     按业务切分 · 页面 + 组件 + 状态 + 测试都在里面 · 自洽
    ↑
  数据层  app/src/data/         openapi 客户端 · 取数钩子 · 流式通道
    ↑
  平台层  app/src/platform/     宿主全局 · 路由与挂载 · 主题注入 · 运行时壳
```

箭头 = 允许的依赖方向（上层可依赖下层）。`app/src/lib/`（纯函数 · 常量 · 类型）无依赖，任何层可用。
`design/` 与 `scripts/` 是资产与工具，不进应用依赖图。

同层之内：

- `components/<名>/` **可以**引用 `components/base/`；`base/` 不可以引用上层组件。
- `features/<域>/` 内部自洽；**feature 之间不许互相 import**。

写 `import` 前问一句：**我是不是在往上引？** 是，就错了。

两条落位规则：

- **路由薄** —— 路由只做装配，业务实现不住路由目录。
- **组件不发请求** —— 组件里不出现 `fetch` / `EventSource` / `new WebSocket`，取数走数据层钩子（`05`）。

### 组件层

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

### 文件名里的角色

- **主文件不带角色后缀** —— `<名>.tsx`（组件）与 `<域>.tsx`（能力层）形状一致；样式 `<名>.less` / `<域>.less`；单测 `<名>.test.tsx` / `<域>.test.tsx`。
- **辅文件用点分角色，任何一层都能用** —— `<>.store.ts`（组件也可以有自己的私有 store）· `*.browser.ts` · `*.agent.md` · `*.agent.mjs`。

### 能力层

一个业务一个目录，**页面 · 状态 · 测试都在里面**。

```
app/src/features/inbox/
├── components/inbox-list/       私有组件
├── inbox.tsx                    页面
├── inbox.less                   样式（可选）
├── inbox.test.tsx               单元用例
├── inbox.store.ts               状态（zustand + persist · 只服务本 feature）
├── inbox.store.test.ts          单元用例
├── tests/                       整体场景：浏览器与拟人（强约束）
│   ├── main-path.browser.ts
│   └── main-path.agent.md · main-path.agent.mjs
└── index.ts                     出口：只导出页面与必要类型
```

### 数据层

**全站只有这一层发请求。**

```
app/src/data/
├── openapi/client.ts            fetch 封装（cookie + CSRF + 错误归一）
├── openapi/inbox.ts             某域的接口方法
├── hooks/use-request.ts         加载 / 错误 / 取消 / 重试的唯一实现
└── stream/session-events.ts     SSE 与 WebSocket 通道
```

### 平台层

**只有这一层碰宿主全局**；三端差异做成适配器，上层只拿接口。

```
app/src/platform/
├── host/globals.ts              window.$app / $global 的类型化封装与初始化
├── navigation/adapter.ts        导航适配器（宿主 / 无壳 / 桌面各一实现）
├── theme/theme.store.ts         主题状态（写根元素 data-theme）
└── mount.tsx                    挂载入口
```

## 3. 待讨论

- `components/base/` 的上提阈值是否定"第三个使用者"。
- `app/src/lib/` 收窄为"纯函数"，还是也放跨层常量与类型。
- 是否加 `app/src/routes/`（薄路由）与 `features/` 并列。
