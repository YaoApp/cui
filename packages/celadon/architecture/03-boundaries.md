# 03 · 目录与边界

- **状态**：✅ **目录与分层已定**（2026-10-01）· 边界强制手段**待确认**
- **依据**：`plan/01` §1.2（界面底座 · 数据 · 状态）+ `00-principles` §2

## 1. 分层职责

| 层 | 目录 | 该做什么 | 不该做什么 |
| --- | --- | --- | --- |
| 组件层 | `app/src/components/` | 纯视觉与行为（`@base-ui/react`）· 受控 props | **不认识业务** · 不发请求 · 不读状态 |
| 能力层 | `app/src/features/` | 按业务切分（chat / inbox / kanban …）· **页面 + 组件 + 状态 + 测试都在里面** | 不直接 `fetch` · 不碰宿主全局 · **feature 之间不互相 import** |
| 数据层 | `app/src/data/` | `openapi/` 客户端 · 取数钩子 · 流式通道 | 不 import 组件 · 不读状态 |
| 平台层 | `app/src/platform/` | 宿主全局 · 挂载与路由 · 主题注入 · 运行时壳 | 不写业务 |
| 工具层 | `app/src/lib/` | 格式化 · 日期 · 工具 · 常量 · 类型 | **无依赖**（不 import 上面任何层）|

> **没有全站 `state/` 层**：状态跟 feature 走（见 `06`）。

> **源码根是 `app/src/`，不是包根** —— 包根是设计体系，应用代码住在 `app/`；`app/` 是 Vite 的 root，
> 它的目录名就是公开 URL，所以源码再下一层，避免与引擎保留前缀同名（见 `04`）。

## 2. 依赖规则

- **只允许向下**：`components ← features ← data ← platform`（箭头指向"被依赖"）。
- `lib/` 任何层可用；`lib/` 自己不许 import 其它层。
- **同层之内也有方向**：`components/<名>/` **可以**用 `components/base/`，**反向不可以**；
  `features/<域>/` 内部自洽，**feature 之间不互相 import**。
- `design/` 与 `scripts/` **不进应用依赖图**。

**判据**：写 `import` 前问一句 **"我是不是在往上引？"** 是，就错了。

## 3. 组件归属判据

`components/` 只有**一个子目录**：`base/` 放**基础组件**（原子控件）；**其余组件直接在 `components/` 下命名**。

| 位置 | 放什么 | 例子 |
| --- | --- | --- |
| `components/base/` | **基础组件**：包装 `@base-ui/react` + token 类，只有视觉与行为，不含业务 | `base/button/` `base/input/` `base/dialog/` `base/menu/` |
| `components/<名>/` | **其余组件**：由基础组件拼成，直接命名 | `page-header/` `empty-state/` `confirm-dialog/` |

**一个组件一个目录**，目录里：

| 文件 | 作用 |
| --- | --- |
| `index.ts` | **出口**（`export { Button } from './button'`）—— 唯一叫 `index` 的文件 |
| `<名>.tsx` | 组件本体 |
| `<名>.less` | 样式（**只在需要时**；能靠 token 类表达就不写） |
| `<域>.page.tsx` · `<域>.store.ts` | 能力层的页面与状态（**文件名里的角色用点分**）|
| `<名>.test.tsx` · `<域>.page.test.tsx` | 单元用例（**强约束：与源文件同目录**，不进 `tests/`，见 `../plan/20-testing.md`） |
| `parts/<子组件>/` | **私有子组件（可选）** —— 它自己也是一个组件，**同样一个目录、同一套结构**（可再递归）|
| `<名>.types.ts` | 可选：类型多到挤占本体时拆出去 |

> **为什么同名**：目录里每个真文件都叫组件名，`grep button.tsx` 直接定位；只有出口按惯例叫 `index`。
> 组件**不必**都有 `.less` —— 能只用 token 类就不加文件。

**所有组件同一套结构**（一个组件一个目录，槽位固定）：

```
components/<名>/
├── index.ts               出口（必有）
├── <名>.tsx               组件本体（必有）
├── <名>.less              样式（可选：能用 token 类就不写）
├── parts/                 私有子组件（可选）—— 里面每一项也是一个组件，同一套结构
│   └── <子组件>/          index.ts · <子组件>.tsx · <子组件>.less · parts/ · tests/
└── tests/
    └── <名>.test.tsx      用例（必有 · 强约束）
```

**`parts/` 是通用槽位，没有例外** —— 任何组件（`base/` 里的也一样）要在内部拆私有子组件，就放自己的 `parts/`。
`components/base/button/` 与 `components/page-header/` 的**目录结构完全相同**；区别只在放什么：
`base/` 放只描述外观、不认识业务的基础件，其余组件放复合件。

**同层方向**：`components/<名>/` → **可以**用 `components/base/`；`base/` → **不可以**用上层组件。
这就是"组件引用组件"的出口。

归属判据（依次问）：

1. 只描述"看起来是什么"、不含业务 → `components/base/`
2. 由基础组件拼成、**仍不认识业务**、会被别的组件或 feature 用 → `components/<名>/`（可拆 `parts/`）
3. 一旦出现业务名词或接口字段 → 留在 `features/<域>/components/`
4. 跨两个 feature 复用 → 先留在原 feature，**出现第三个使用者**再上提到 `components/`

> feature 私有组件**不许**出 `features/<域>/components/`；feature 之间也不许互相 import 组件。

## 4. 边界怎么强制

**只写在文档里的边界一定会破** —— 同行调研里，唯一没做机器强制的那家，层间方向确实靠 review 在守；
做了强制的那家，把每条禁用写成**带人话理由与出路**的 ESLint 错误。我们照后者做。

| 规则 | 手段 | 例子 |
| --- | --- | --- |
| **层间方向** | ESLint `no-restricted-imports`（`allowTypeImports: true` 只放行类型）| `components/base/` 不许 import 上层组件；`data/` 不许 import `features/`；`features/a/` 不许 import `features/b/` |
| **组件不发请求** | 同上 + `no-restricted-syntax` | 禁组件里出现 `fetch(` / `new WebSocket(` |
| **不在 `useEffect` 取数** | 同上 | 取数走数据层钩子（见 `05`）|
| **禁旧包** | 同上 | 禁 `import '@yaoapp/cui'` |
| **路由薄** | 同上 | `routes/` 不许被 `features/` 反向 import |
| **平台差异** | 适配器接口 + 禁直读环境判断 | 禁 `isDesktop` / `isIframe` 散落 |

**写法要求**：每条规则给出**为什么**与**那该怎么办**（例：*"服务端代码不在浏览器里跑 —— 走数据层接口，或把纯函数移到 `lib/`"*）。
没有出路的报错只会被绕过。

## 5. 待讨论

- 层与层之间是否允许**类型**互相引用（只有类型、无运行时代码）—— 边界规则里的 `allowTypeImports` 就是为这件事留的口子。
- `app/src/lib/` 的边界：只放纯函数，还是也放跨层常量与类型定义。
- 是否再加一个 `app/src/routes/`（薄路由）与 `features/` 并列。
- `components/<名>/` 多了之后是否要按域分目录（现在按约定是平铺）。
- 组件的子目录是否要收口为"只允许 `parts/` 与 `tests/`"，以及 `parts/` 下是否只允许目录（不允许散落单文件）—— 现在都是约定，未强制。
- 组件的样式走 `.less`、CSS Modules，还是只用 token 类（现在规则是"能靠 token 类就不加文件"）。
