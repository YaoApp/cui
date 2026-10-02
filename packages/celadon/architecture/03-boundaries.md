# 03 · 目录与边界

- **版本**：v1.17
- **最后修改**：2026-10-02 13:15:05
- **说明**：目录结构 · 分层职责 · 同层方向 · 谁能 import 谁 · 边界怎么强制

## 1. 分层职责

| 层 | 目录 | 该做什么 | 不该做什么 |
| --- | --- | --- | --- |
| 路由 | `app/src/routes/` | 路由表 · 表面（main / side）与其布局 | **不写业务** · 不许被 `features/` import |
| 组件层 | `app/src/components/` | 纯视觉与行为（`@base-ui/react`）· 受控 props | **不认识业务** · 不发请求 · 不读状态 |
| 能力层 | `app/src/features/` | 按业务切分（chat / inbox / kanban …）· **页面 + 组件 + 状态 + 测试都在里面** | 不直接 `fetch` · 不碰宿主全局 · **feature 之间不互相 import** |
| 数据层 | `app/src/data/` | `openapi/` 客户端 · 取数钩子 · 流式通道 | 不 import 组件 · 不读状态 |
| 平台层 | `app/src/platform/` | 宿主全局 · 挂载与**路由机制** · basename 适配 · 主题注入 · 运行时壳 | 不写业务 |
| 工具 | `app/src/platform/utils/` | 格式化 · 日期 · 工具 · 常量 · 类型 | **不 import 任何上层** |

源码根为什么是 `app/src/`、依赖方向怎么画，见 `00-principles.md` §2。**没有全站 `state/` 层**（见 `06-state.md`）。

## 2. 依赖规则

- **只允许向下**：`components ← features ← data ← platform`（箭头指向"被依赖"）。
- `platform/utils/` 任何层可用；它自己不许 import 其它层。
- 同层之内：`components/<名>/` **可以**用 `components/base/`，**反向不可以**；`features/<域>/` 内部自洽，**feature 之间不互相 import**。
- `design/` 与 `scripts/` **不进应用依赖图**。
- `routes/` 可以 import `features/`；**`features/` 不许 import `routes/`**（单向，同 `components/base/` 的道理）。
- 判据：写 `import` 前问 **"我是不是在往上引？"** 是，就错了。

## 3. 组件归属判据

`components/` 只有一个子目录 `base/`；其余组件直接在 `components/` 下命名。

| 位置 | 放什么 | 例子 |
| --- | --- | --- |
| `components/base/` | 基础组件：包装 `@base-ui/react` + token 类，只有视觉与行为 | `base/button/` `base/input/` `base/dialog/` `base/menu/` |
| `components/<名>/` | 其余组件：由基础组件拼成，直接命名 | `page-header/` `empty-state/` `confirm-dialog/` |

组件目录里的文件（**所有组件同一套结构**，可选槽位按需留空）：

| 文件 | 作用 |
| --- | --- |
| `index.ts` | 出口（`export { Button } from './button'`）—— 唯一叫 `index` 的文件 |
| `<名>.tsx` | 组件本体 |
| `<名>.less` | 样式（**只在需要时**；能靠 token 类表达就不写） |
| `<名>.test.tsx` | 单元用例（**与源文件同目录**，不进 `tests/`） |
| `parts/<子组件>/` | 私有子组件（可选）—— 它自己也是一个组件，同一套结构（可递归） |
| `<名>.store.ts` · `<名>.types.ts` | 可选：私有状态 / 类型多到挤占本体时拆出去 |
| `tests/` | **只在有浏览器或拟人用例时存在**（见 `14-testing.md`） |

文件名规则见 `00-principles.md` §2「文件名里的角色」。`parts/` 是通用槽位，`base/` 里的组件一样可以有。

归属判据（依次问）：

1. 只描述"看起来是什么"、不含业务 → `components/base/`（原子控件）
2. 由基础组件拼成、**仍不认识业务** → `components/<名>/`（可拆 `parts/`）
3. 出现业务名词或接口字段 → 留在 `features/<域>/components/`
4. **业务件**想给别的 feature 用 → 先留在原 feature

**上提阈值**（"几个使用者才值得共享"）按件分档：

| 件 | 阈值 | 为什么 |
| --- | --- | --- |
| **业务件** | **第 3 个使用者** | 提前共享会把两个 feature 绑死在一起 |
| **通用件**（不认识业务） | **第 2 处** | 抽象成本低，重复的代价是各写一套、设计分叉 |
| **基元 → `components/base/`** | **第 3 个使用者**，且必须"包装无头库 + 只有视觉与行为" | 定得太松会攒一堆只有一处用到的原子件 |

feature 私有组件**不许**出 `features/<域>/components/`；feature 之间也不许互相 import 组件。

## 4. 边界怎么强制

| 规则 | 手段 | 例子 |
| --- | --- | --- |
| **层间方向** | ESLint `no-restricted-imports`（`allowTypeImports: true` 只放行类型）| `components/base/` 不许 import 上层组件；`data/` 不许 import `features/`；`features/a/` 不许 import `features/b/` |
| **用基础件，不裸写控件** | `check-base-components.mjs`（`features/` 与 `routes/` 里不许裸 `<button>`）| 按钮用 `components/base/button`；链接、输入框用设计类 `.link` / `.input` |
| **组件不发请求** | 同上 + `no-restricted-syntax` | 禁组件里出现 `fetch(` / `new WebSocket(` |
| **不在 `useEffect` 取数** | 同上 | 取数走数据层钩子（见 `05-data-and-api.md`）|
| **禁旧包** | 同上 | 禁 `import '@yaoapp/cui'` |
| **路由薄** | 同上 | `routes/` 不许被 `features/` 反向 import |
| **平台差异** | 适配器接口 + 禁直读环境判断 | 禁 `isDesktop` / `isIframe` 散落 |

每条规则的报错要写出**为什么**与**那该怎么办**（例："服务端代码不在浏览器里跑 —— 走数据层接口，或把纯函数移到 `platform/utils/`"）。没有出路的报错会被绕过。

## 5. 待讨论

- 层与层之间是否允许**类型**互相引用（`allowTypeImports` 就是为这件事留的口子）。
- 是否加 `routes/`（薄路由）与 `features/` 并列。
- `components/<名>/` 多了之后是否按域分目录（现在平铺）。
- 组件子目录是否收口为"只允许 `parts/` 与 `tests/`"。
- 组件样式走 `.less`、CSS Modules，还是只用 token 类（现在：能靠 token 类就不加文件）。
