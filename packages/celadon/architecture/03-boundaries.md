# 03 · 目录与边界

- **版本**：v1.48
- **最后修改**：2026-10-10 09:50:00
- **说明**：目录结构 · 分层职责 · 同层方向 · 谁能 import 谁 · 边界怎么强制

## 1. 分层职责

| 层 | 目录 | 该做什么 | 不该做什么 |
| --- | --- | --- | --- |
| 路由 | `app/src/routes/` | 路由表 · 表面（主区 · 侧边）与其布局 | **不写业务** · 不许被 `features/` import |
| 组件层 | `app/src/components/` | 纯视觉与行为（`@base-ui/react`）· 受控 props | **不认识业务** · 不发请求 · 不读状态 |
| 能力层 | `app/src/features/` | 按业务切分（chat / inbox / kanban …）· **页面 + 组件 + 状态 + 测试都在里面** | 不直接 `fetch` · 不碰宿主全局 · **feature 之间不互相 import** |
| 公共态 | `app/src/stores/` | **跨功能的公共状态**（说不清归哪个功能的事实）· 目录即角色，文件**不加后缀** | 不放私有状态（跟 feature 走）· **不许 import 上层**（features / routes / components 都不行）|
| 数据层 | `app/src/data/` | `openapi/` 客户端 · 取数钩子 · 流式通道 | 不 import 组件 · 不读状态 |
| 平台层 | `app/src/platform/` | 宿主全局 · 挂载与**路由机制** · basename 适配 · 主题注入 · 运行时壳 | 不写业务 |
| 工具 | `app/src/platform/utils/` | 格式化 · 日期 · 工具 · 常量 · 类型 | **不 import 任何上层** |

源码根为什么是 `app/src/`、依赖方向怎么画，见 `00-principles.md` §2。**没有全站 `state/` 层**（见 `06-state.md`）。

## 2. 依赖规则

- **只允许向下**：`components ← features ← data ← platform`（箭头指向"被依赖"）。
- `platform/utils/` 任何层可用；它自己不许 import 其它层。
- 同层之内：`components/<名>/` **可以**用 `components/base/`，**反向不可以**；`features/<域>/` 内部自洽，**feature 之间不互相 import**。
- `design/` 与 `scripts/` **不进应用依赖图**。
- **token 的唯一消费入口是 `app/src/platform/theme/`**：应用在**入口引一次**；**组件与 feature 不引设计文件、不写颜色字面量**，只用 token 派生的 CSS 变量与设计类。
- `routes/` 可以 import `features/`；**`features/` 不许 import `routes/`**（单向，同 `components/base/` 的道理）。
- 判据：写 `import` 前问 **"我是不是在往上引？"** 是，就错了。
- **类型可以跨层引用**（编译期的事）；**运行时的值不行** —— 依赖方向管的是值的流动。

## 3. 组件归属判据

`components/` 只有一个子目录 `base/`；其余组件直接在 `components/` 下命名。

| 位置 | 放什么 | 例子 |
| --- | --- | --- |
| `components/base/` | 基础组件：包装 `@base-ui/react` + token 类，只有视觉与行为（**图标例外**：`base/icon/` 与 `base/brand-mark/` 包的是平台层的雪碧图，见 `10-icons.md`）| `base/button/` `base/select/` |
| `components/<名>/` | 其余组件：由基础组件拼成，直接命名；**目录里的 `.less` 必须被同目录的 `.tsx` import** —— 忘了引等于样式一条不生效 | `page-header/` `empty-state/` `confirm-dialog/` |

`base/` 里的基础件**按需新增**：出现真实复用需求才建目录；**已有的一律包装 `@base-ui/react`**，不直接写原生控件。

基础件的**命名与上游部件一致**；上游没有对应部件的，按上游的命名形状补一个名字（例如以 `-field` 结尾）。

基础件的分法**按行为定，不按类型定**：上游的每个部件对应一个目录；同一个部件在行为上分叉时另立目录。

| 情形 | 做法 | 例子 |
| --- | --- | --- |
| 与上游部件一一对应 | 一个部件一个目录 | 复选框 · 选择器 · 开关 |
| 同一部件但行为不同 | 各占一个目录 | 一次性口令（分段输入与粘贴）· 图形验证码（图像与刷新） |
| 差异能用参数或插槽表达 | 不另立目录 | 密码就是 `type="password"` 的文本输入，右侧的可见性按钮是插槽内容；用户名与邮箱靠 `type` 与校验规则区分 |
| 只呈现信息、没有输入，且上游没有对应部件 | 仍是基础件 | 应用自己的提示条 |
| 上游已有对应部件 | 直接用上游的部件，不另立 | 字段的标签、说明与错误用 `field` 的 `Label`、`Description`、`Error` |
| 需要读状态或平台能力 | 不进 `base/`，作为由基础件拼成的组件直接放在 `components/<名>/` | 主题切换与语言切换要读主题与语言状态 |

组件目录里的文件（**所有组件同一套结构**，可选槽位按需留空）：

| 文件 | 作用 |
| --- | --- |
| `index.ts` | 出口（`export { Button } from './button'`）—— 唯一叫 `index` 的文件 |
| `<名>.tsx` | 组件本体 |
| `<名>.less` | 样式（**只在需要时**；能靠 token 类表达就不写） |
| `<名>.test.tsx` | 单元用例（**与源文件同目录**，不进 `tests/`） |
| `parts/<子组件>/` | 私有子组件（可选）—— 它自己也是一个组件，同一套结构（可递归） |
| `hooks/` | 私有 hook（可选）—— 文件在目录里平铺，例如 `hooks/use-click-outside.ts`；只有一个也收在这里 |
| `<名>.store.ts` · `<名>.types.ts` | 可选：私有状态 / 类型多到挤占本体时拆出去 |
| `tests/` | **只在有浏览器或拟人用例时存在**（见 `14-testing.md`） |

文件名规则见 `00-principles.md` §2「文件名里的角色」。`parts/` 是通用槽位，`base/` 里的组件一样可以有。

功能域用同一套槽位：`features/<域>/hooks/` 收该域私有的 hook（`features/auth/hooks/use-sign-out.ts`），`features/<域>/components/` 收该域私有的组件。取数钩子是例外，集中在 `data/hooks/`，见 `05-data-and-api.md`。

**基础件由 `components/base/index.ts` 统一导出**，调用方从 `@/components/base` 引入，不逐个深入到 `components/base/<名>`。
这个出口只做再导出，不带任何逻辑；它导出的名字与各组件目录里的组件同名。

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

- **组件在 `components/` 下平铺**，不按域分目录 —— 组件不含业务，要按域分说明它该回 `features/`。
- 组件目录里**只允许两个子目录**：`parts/`（拆出来的零件）与 `tests/`（浏览器与拟人）。
- 样式：**能靠 token 类就不加 `.less`**；需要布局时用组件自己的 `.less`；**不引入 CSS Modules**。
- 样式归属：一个组件默认**一份**样式文件，与组件同目录同名（`nav/nav.tsx` 配 `nav/nav.less`）。`parts/` 是组件的内部结构，**各部件自己要不要一份 `.less` 由作者判断，不强制拆分**。
- 什么时候拆：部件要脱离父组件单独用（例如菜单给别的栏复用）；部件自己的规则多到能独立成篇（经验值单文件超过六百行，其中部件自己的规则占大头）；部件有自己成套的视觉状态或主题面。
- 什么时候不拆：部件规则很少（十几条以内）；跨部件的状态规则占多数（收起、展开、让位这类由父组件统一管）；条件块（媒体查询、容器查询）与它的基础块必须成对留在一起。检查器的重复选择器判定是**按文件**做的，拆开同一选择器的两处会给检查器制造假重复。

**回调命名**：基础件跟随上游库；组件用语义名，不用 `onChange`；原生 `onChange` 仅用于真透传原生事件。

| 场景 | 命名 | 签名 |
| --- | --- | --- |
| 基础件传递值 | 跟随上游库（值型 `onValueChange`） | `(value) => void` |
| 组件表达语义动作 | 语义名（`onSelect` · `onToggle` · `onSubmit`） | 参数由动作语义定义 |
| 原生事件透传 | 原生名（`onChange`） | `(event) => void` |

## 4. 边界怎么强制

| 规则 | 手段 | 例子 |
| --- | --- | --- |
| **层间方向** | `check-import-boundaries.mjs`（零依赖纯 Node 扫 `app/src/**/*.{ts,tsx}` 的 import；**只放行类型** —— TS 7 下 `typescript-eslint` 还不支持，ESLint 版落不来）| `components/base/` 不许 import 上层组件；`data/` 不许 import `features/`；`features/a/` 不许 import `features/b/` |
| **用基础件，不裸写控件** | `check-base-components.mjs`（`features/` · `routes/` · `components/` 里不许裸 `<button>` / `<select>`，`components/base/` 豁免）| 按钮用 `components/base/button`；下拉用 `components/base/select`；链接、输入框用设计类 `.link` / `.input` |
| **组件不发请求** | 同上（方向）；请求本身**暂无机器强制** | 禁组件里出现 `fetch(` / `new WebSocket(` —— 由**评审**把关，见 §4 末 |
| **不在 `useEffect` 取数** | `check-effect-url-write`（只管"写 URL"那一半）+ **评审** | 取数走数据层钩子（见 `05-data-and-api.md`）；**取数本身暂无机器强制** |
| **禁旧包** | `check-import-boundaries`（`old-package`）| 禁 `import '@yaoapp/cui'` |
| **路由薄** | `check-import-boundaries`（`routes-top`）| `routes/` 不许被 `features/` 反向 import |
| **平台差异** | 适配器接口 + 禁直读环境判断 | 禁 `isDesktop` / `isIframe` 散落 |
| **判断类规则**（表里无机器强制的那类）| **评审 + 拟人层判定** | 「不认识业务」· 命名规范 · 只写规则不写过程；判定三件：看图 · `ocr_recognize` · `decision_decide`（见 `14-testing.md` §4.3）|

**判断类规则没有机器强制** —— 靠评审与拟人层判定兜底；**别为它们硬造检查器**（假阳性会让人绕过去）。

**登记例外**：`components/base/captcha-field/` 直接使用 `@/data/user` 的取图声明。图形验证码的接口固定，
取图与三种过程是控件行为的一部分，因此 `check-import-boundaries.mjs` 按文件与说明符逐条登记，不放宽整层。

每条规则的报错要写出**为什么**与**那该怎么办**（例："服务端代码不在浏览器里跑 —— 走数据层接口，或把纯函数移到 `platform/utils/`"）。没有出路的报错会被绕过。
