# 06-login-components · 组件与验收（2026-10-06）

- **规则**：[`../architecture/03-boundaries.md`](../architecture/03-boundaries.md) §3（基础件分法与归属）·
  [`../architecture/09-theme.md`](../architecture/09-theme.md)（主题）·
  [`../architecture/14-testing.md`](../architecture/14-testing.md)（测试分层）
- **上游**：`@base-ui/react` 1.8.0。组件名与上游一致：上游有同名部件的一律沿用，没有对应部件的按上游的命名形状补。
- **范围**：登录与注册所需的基础件、页面内部件，以及主题与语言切换。路由、页面流程与状态见 [`06-login.md`](06-login.md) §3。
- **计划不是规范**：规则只写在 `architecture/`，本文只列待办与验收判据。

## 1. 一句话

先把基础件与主题语言切换做到产品级，再用脚手架里的清单页做人类验收与浏览器断言，最后才做 auth 的三个页面。

## 2. 待办清单

### 2.1 新增基础件

| # | 组件 | 上游对应 | 目录 | 参数 | 状态 |
| --- | --- | --- | --- | --- | --- |
| 1 | `input` | `input` | `components/base/input/` | `id`、`label`、`type`、`value`、`onChange`、`error`、`hint`、`icon`、`trailing`、`autoComplete`、`disabled`、`state`、`shake` | **已完成**（2026-10-06，单元用例 7 条；七个状态与错误抖动在清单页有浏览器断言） |
| 2 | `captcha-field` | 无，基于 `input` | `components/base/captcha-field/` | `id`、`image`、`value`、`onChange`、`onRefresh`、`error`、`disabled` | 未开始 |
| 3 | `otp-field` | `otp-field` | `components/base/otp-field/` | `id`、`value`、`onChange`、`error`、`disabled` | 未开始 |
| 4 | `checkbox` | `checkbox` | `components/base/checkbox/` | `id`、`checked`、`onChange`、`label`、`error` | 未开始 |
| 19 | `spinner` | 无 | `components/base/spinner/` | `className` | **已完成**（2026-10-06；两瓣圆环，头端圆帽、尾端收尖，尺寸 16，一周 `--duration-loop`，减动效停转；输入框与按钮共用） |

字段的标签、说明与错误不另立组件，用上游 `field` 的 `Label`、`Control`、`Description` 与 `Error`。
密码不另立基础件，它是 `type="password"` 的 `input`，可见性切换由页面内部的 `PasswordInput` 组合。

### 2.2 修订现有基础件

| # | 组件 | 上游对应 | 要补的东西 | 状态 |
| --- | --- | --- | --- | --- |
| 5 | `button` | `button` | 七个变体（实心 · 浅底 · 幽灵 · 琥珀 · 成功 · 危险 · 反色）× 四态（默认 · 悬停 · 按下 · 聚焦）+ 禁用与加载；三档尺寸 24 / 32 / 40；两种形态（常规圆角与胶囊）；整宽档 | **已完成**（2026-10-06；加载态共用 `spinner`，图标槽仍未做，见 2.6） |
| 6 | `select` | `select` | 错误态与尺寸档；触发器外观与 `input` 统一 | 未开始 |
| 7 | `icon` | 无 | 新增邮件、锁、眼睛、隐藏眼睛、礼盒、地球、太阳与月亮八个图标；改 `design/icons/manifest.json` 后跑生成脚本 | 未开始 |
| 8 | `brand-mark` | 无 | 补单元用例，它是四件里唯一没有用例的 | 未开始 |

### 2.3 主题与语言切换

| # | 事项 | 判据 | 状态 |
| --- | --- | --- | --- |
| 9 | 主题三态 | 跟随系统、浅色、深色；初始为跟随系统 | 未开始 |
| 10 | 语言四语 | `zh-CN`、`zh-TW`、`en-US`、`ja`；切换不刷新页面、不丢已输入内容 | 未开始 |
| 11 | 可访问性 | `aria-pressed` 表达选中状态；键盘可操作；焦点环用 `--focus-ring` | 未开始 |

### 2.4 统一出口与清单页

| # | 事项 | 判据 | 状态 |
| --- | --- | --- | --- |
| 12 | `components/base/index.ts` | 只做再导出，不带逻辑；调用方从 `@/components/base` 引入 | **已完成** |
| 13 | 脚手架清单页 | `features/scaffold/base`，路由 `/scaffold/base`，按分组列出全部基础件与状态 | **已完成** |
| 18 | 按现行字号与字重档位复量全部基础件 | 档位现为 12 · 14 · 16 · 20 · 24、字重 400 / 500 / 600。逐件量被绘制元素的字号、字重、行盒与溢出，判据用实测值 | 进行中：按钮与输入框已按档位复量（按钮三档字号 12 / 14 / 16，行高取整 20 / 24，实测高度 24 / 32 / 40）；`select`、`icon`、`brand-mark` 未量 |

### 2.5 页面内部件

| # | 组件 | 目录 | 说明 | 状态 |
| --- | --- | --- | --- | --- |
| 14 | `PasswordInput` | `features/auth/parts/password-input/` | 文本输入加可见性切换，登录与注册共用 | 未开始 |
| 15 | `ProviderList` | `features/auth/parts/provider-list/` | 第三方登录入口，跳转 `oauthAuthorize` 返回的地址 | 未开始 |
| 16 | `ClientHint` | `features/auth/parts/client-hint/` | 客户端模式下提示回到浏览器或改用设备码 | 未开始 |
| 17 | `StatusNotice` | `features/auth/parts/status-notice/` | 页面级状态提示，文案按错误码取 | 未开始 |

### 2.6 设计体系同步与本轮遗留（2026-10-06）

| # | 事项 | 现状 |
| --- | --- | --- |
| 20 | 控件状态表 | `design/typography.md` 第 2 节按边框、描边、底色三列列出全部状态，含只读与加载 |
| 21 | 悬停与按下的取值 | 悬停取同族更亮一档或更淡的虚影；按下只做 `transform: scale(.94)`，不改颜色，也不加描边 |
| 22 | 控件圆角 | 按档位取同名 token：小档 `--radius-small` 6px · 中档 `--radius-medium` 8px · 大档 `--radius-large` 12px；输入框属中档；`--radius-xl` 归大输入区与大容器 |
| 23 | 按钮形态 | 品牌档与反色档不带边框（有意弱化边界，理由见 `foundations.md` F5）；幽灵档与语义三档带 1px 同族或中性边框，边框对底满足 1.4.11 |
| 24 | 色卡 | 已登记悬停底、反色档与四个色系焦点环的浅暗实测值；暗色悬停值待按 `#2C2718` / `#12261A` / `#2A1614` 更新 |

遗留事项，逐条做完再销：

- `button` 仍缺单元用例，其余基础件都有；要覆盖 props 分支（加载禁用、`state` 与 `shape` 生成的类、错误与禁用）。
- 按钮的**图标槽**未做，图标目前只能由调用方塞进 `children`。
- 色卡里 `--brand-solid-active` 等按下换色档在按钮上已无引用（设计类按下改为只缩放），去留待定。
- `--radius-medium` 在按钮上已不再使用（改由尺寸档给圆角），但它仍是卡片、面板与弹层的档位，不是无引用。

## 3. 验收规矩

### 3.1 每个组件都要满足

| 项 | 规矩 | 谁来卡 |
| --- | --- | --- |
| 包装上游 | 控件包装 `@base-ui/react`，不出现裸 `<button>` 与 `<select>` | `check-base-components` |
| 设计来源 | 视觉只用 `design/tokens.less` 的设计类与 token，不出现字面颜色与尺寸 | `check-tokens` |
| 样式引入 | 目录里的 `.less` 被同目录的 `.tsx` 引入 | `check-base-components` |
| 单元用例 | 与源文件同目录的 `<名>.test.tsx`，覆盖各个 props 分支、禁用、错误与键盘操作 | 隔离 Review |
| 无障碍 | 有可访问名；键盘可达；焦点环用 `--focus-ring`；错误文本经 `aria-describedby` 关联 | 隔离 Review |
| 文案 | 文案进各自 `locales/`，四语齐备，不硬编码中文 | `check-i18n` |
| 导出 | 基础件经 `components/base/index.ts` 统一导出 | 隔离 Review |

### 3.2 断言的口径

- 断言**用户看得见的东西**：可见文字、角色与可访问状态，不测内部结构与实现细节。
- 渲染类结果（图标、图形）要断言它**真的画出来**：缩放、描边与可见性，不满足于元素存在。
- 网络、时间与存储可以 mock；**真实渲染引擎不 mock**，它属于浏览器层的范围。
- 一个场景一个文件；浏览器与拟人用例放在 `features/<域>/tests/` 下。

### 3.3 每一步的完成判据

| 步骤 | 完成判据 |
| --- | --- |
| 基础件 | 四件新增与四件修订完成，每件有单元用例；`pnpm lint`、`pnpm check`、`pnpm test` 全绿；图标由脚本生成且 `check-generated` 通过 |
| 主题与语言 | 2.3 的三项判据都有对应用例；切换之后主题与文案立即生效，已输入内容不丢失 |
| 清单页 | 页面按分组列出全部基础件与状态；每组的状态逐个摆出并带静态态样例；浏览器用例逐组断言；人类可以打开 `/scaffold/base` 验收 |
| 页面内部件 | 四件完成并有单元用例；auth 页面接入之后浏览器用例覆盖关键路径 |
| 交付前 | 门禁全绿、拟人层执行并附截图、隔离 Review 通过 |

### 3.4 不可接受的证据

- 「元素存在」不算验证，要断言可见文字、角色或可访问状态。
- 「已执行」不算证据，浏览器与拟人层要附截图与日志。
- 门禁全绿不构成交付条件，交付前必须执行拟人层并把截图附给交付对象。
