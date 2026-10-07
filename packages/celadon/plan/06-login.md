# 产品级登录与注册（计划）

- **版本**：v1.1（2026-10-07）。底座已交付，页面未开工，开工判据见 §3.0。
- **上游**：[`04-status.md`](04-status.md) · [`03-data.md`](03-data.md) · [`06-state.md`](../architecture/06-state.md) · [`05-data-and-api.md`](../architecture/05-data-and-api.md)
- **参考**：`cui-desktop`（1.0 桌面壳与其 `cui` 包，只读）· 本仓 `packages/cui`（1.0 的 `cui` 包，只读）
- **目标**：把 1.0 的"入口"能力归一化为一套产品级实现 —— 一个 `data/user` 域、两个独立页面（登录、注册）、一个服务器选择页面，全部走本仓的平台层与设计体系。

## 0. 旧能力盘点（`/user/entry` 相关接口）

### 0.1 接口清单

来源：`packages/cui/openapi/user/auth.ts`（1.0 实现）与 `yao/openapi/user/*` 的处理器。

| 端点 | 作用 | 备注 |
| --- | --- | --- |
| `GET /user/entry?locale=` | 统一入口配置 `EntryConfig` | 标题、描述、成功/失败跳转、登出跳转、`form`（用户名占位与字段、密码占位、验证码类型 `image`/`turnstile` 及其选项）。入口界面由它驱动 |
| `POST /user/entry/verify` | 判定"登录还是注册"，并返回**临时令牌** | 入参 `{username, captcha_id?, captcha?, locale?}`；出参含 `status`（`login`/`register`）、`access_token`、`expires_in`、`scope`、`user_exists`、`verification_sent`、`otp_id`。注册分支自动发出验证码 |
| `POST /user/entry/register` | 注册 | 需临时令牌（`Authorization: Bearer <temp>`）；入参 `{name?, password, confirm_password?, otp_id?, verification_code?, locale?}`；出参 `EntryAuthResponse` |
| `POST /user/entry/login` | 登录 | 需临时令牌；入参 `{password, remember_me?, locale?}`；出参 `EntryAuthResponse` |
| `POST /user/entry/otp?locale=` | 重发验证码 | 需临时令牌；出参 `{otp_id, expires_in}` |
| `POST /user/entry/invite/verify` | 邀请码校验与兑换 | 需带 `invite_verification` 作用域的临时令牌；成功后直接返回 `EntryAuthResponse` |
| `GET /user/entry/captcha` · `GET /user/entry/captcha?captcha_id=` | 图形或人机验证 | 出参 `{captcha_id, captcha_image, expires_in}` |
| `POST /user/oauth/:id/authorize` · `POST /user/oauth/:id/callback` | 第三方登录 | 另有设备码流（`/device/authorize`、`/device/token`）与设备授权页 |
| `POST /user/logout` | 服务端登出 | 本仓 `data/user` 已声明 |
| `GET /user/profile`（OIDC UserInfo）| 用户资料 | 与本轮入口流程相邻，暂不展开 |

### 0.2 数据结构

来源：`packages/cui/openapi/user/types.ts`，本仓 `data/user/types.ts` 已按真实服务校正。

- `EntryConfig`：`title` · `description` · `success_url` · `failure_url?` · `logout_redirect?` · `auto_login?` · `role?` · `type?` · `form?`（见上表）。
- `EntryVerifyResponse`：`status: 'login' | 'register'` · `access_token` · `expires_in` · `token_type` · `scope` · `user_exists` · `verification_sent?` · `otp_id?`。
- `EntryRegisterRequest` / `EntryLoginRequest` / `EntrySendOTPResponse` / `EntryAuthResponse`：字段同上表。
- `EntryAuthResponse` 的令牌族：`session_id` · `id_token` · `access_token` · `refresh_token` · `expires_in` · `refresh_token_expires_in` · `mfa_enabled` · `status`。
- `LoginStatus`：`Success` · `MFARequired` · `TeamSelectionRequired` · `InviteVerification`。

### 0.3 1.0 的界面位置（只读参考）

- `pages/auth/entry/index.tsx`（登录与注册的统一入口）· `pages/auth/entry/invite/index.tsx`（邀请码）· `pages/auth/token/index.tsx`（验证码/令牌）· `pages/auth/connect/index.tsx`（第三方连接）· `pages/setup/redirect.ts` · `pages/team/invite/$.tsx`。
- **服务器选择**：`cui-desktop/src/pages/servers.ts`（408 行）。它在**应用之外**的桌面壳里用原生 DOM 渲染：`servers` 列表与 `activeServerUrl`、托盘"切换服务器"以 `?switch=1` 进入、首屏自动重连、主题与语言变化时整页重渲染、云端服务器列表异步加载。

### 0.4 归一化要解决的问题与现行结论

1. **入口界面在 1.0 的应用内，服务器选择在 1.0 的应用外**。**结论**：服务器选择做成应用内页面（无服务地址时由外壳呈现），与登录、注册共用设计体系；「没有可用地址时由外壳引导到本页」属于桌面壳那一轮。
2. **临时令牌**。**结论**：临时令牌不进入会话存储，也不占用 `platform/credential`；`entryRegister`、`entryLogin`、`entryOtp`、`entryInvite` 的查询包装都以 `token` 作为第一个参数，由页面持有并经请求头随每次调用送出。会话的采纳与清除仍由 `platform/credential` 的 `signIn`、`signOut`、`forgetService` 承担。
3. **ID Token 验签在 1.0 里有降级分支**（无 `crypto.subtle` 时跳过验签、直接解载荷）。**结论**：验签，接口 `oidcKeys` 已具备，不沿用降级分支。
4. **`EntryConfig` 驱动的动态表单** 与"登录、注册分开两个页面"存在张力：判定登录或注册发生在 `verify` 之后，因此两个页面共用该步，随后各自继续。

## 1. 第一步：草图（结论）

产物为 [`login.html`](../design/prototype/login.html) · [`register.html`](../design/prototype/register.html) · [`servers.html`](../design/prototype/servers.html) · [`layout.html`](../design/prototype/layout.html) · [`welcome.html`](../design/prototype/welcome.html)，均为占位演示，供评审对照界面。草图的细节随实现推进，不作为像素级验收依据。

## 2. 第二步：接口准备（结论）

交付物为 `app/src/data/user/`：

- 14 条端点声明与 14 个查询包装（`api.ts` · `queries.ts` · `keys.ts`），字段与路径以 1.0 源码和 `yao/openapi/user/*` 的处理器为准；
- 临时令牌经 `RequestOptions.headers` 传递，会话令牌由 `signIn` 采纳；
- 失败按错误码翻译（`data.error.<code>` 与 `platform/i18n/code-key.ts`），四语齐备；
- 语言由 ctx 统一提供，页面不需要自己拼 `locale` 参数；
- 单元 fixture 与浏览器层 15 步活体走查均已通过，`api`、`keys`、`queries` 覆盖率四项 100%。

**当前 dev 配置下的已知限制**：五条成功分支不可达（一次性口令 · 邀请码 · OAuth 回调 · 设备码批准与轮询），已有带来源标注的 fixture 记录，属 fixture 证据而非活体验证。

## 3. 第三步：页面实现（登录与注册分开）

### 3.0 开工判据（结论）

页面所需的底座已经就位，剩下的都是页面本身的活：三个页面、四个页面内部件、一个独立外壳；**不需要再新增基础件**。

| 事项 | 结论 | 依据 |
| --- | --- | --- |
| 接口声明与查询包装 | 就绪。入口配置、图形验证码、`verify`、`register`、`login`、`otp`、`invite`、OAuth 两条、设备码三条、OIDC 公钥与登出共 14 条 | `app/src/data/user/index.ts` · `queries.ts` |
| 请求状态与失败文案 | 就绪。取值、进行中与失败三态由 `useRequest` 给，失败按错误码翻四语 | `app/src/data/hooks/use-request.ts` · `platform/i18n/code-key.ts` |
| 临时令牌 | 就绪。`register` / `login` / `otp` / `invite` 的包装都以 `token` 为第一个参数，经请求头随调用送出 | `app/src/data/user/queries.ts` 第 99 至 121 行 |
| 会话采纳与清除 | 就绪。`signIn` 采纳令牌族，`signOut` 清 `session` 与 `refresh`，更换服务地址时用 `forgetService` 作废本机凭据 | `app/src/platform/credential/index.ts` · `session.ts` |
| 基础件 | 就绪。十个基础件（`brand-mark` · `button` · `captcha-field` · `checkbox` · `icon` · `input` · `otp-field` · `segmented-control` · `select` · `spinner`）各有单元用例；页面要用的四件已在清单页按属性、状态、尺寸列出 | `app/src/components/base/index.ts` · `/scaffold/base` |
| 主题与语言切换 | 就绪。按 §3.4 的规格实现，四语齐备 | `app/src/components/theme-toggle/` · `locale-switch/` |
| 页面与页面内部件 | 未开工。`features/` 下现有 `home` 与 `scaffold`；§3.3 的四个页面内部件随页面一并实现 | `app/src/features/` |
| 独立外壳 | 未开工。现有路由表只有一套外壳 `SurfaceLayout`，页面要另立一个不带应用导航的外壳 | `app/src/routes/routes.tsx` |
| 服务器选择的归属 | 页面在本仓做；无服务地址时的引导属于桌面壳那一轮 | §0.4 第 1 条 · §5 第 4 条 |
| 拟人层 | 就绪。两个场景的旧期望已按现行实现订正（主题切换的按钮改为图标反转的方形按钮、图标尺寸取产品默认档 16、受保护请求按码翻成 `data.error.unauthorized`），现在两个场景全部测量通过 | `pnpm test:persona` 当前输出 |

### 3.1 路由清单

路径都在构建决定的 base 之下，三个页面使用独立外壳，不带应用的 Surface 导航。
「设计原型」一列指向第一步的草图，用于对照界面。

| 路径 | 页面 | 设计原型 | 说明 |
| --- | --- | --- | --- |
| `/login` | `features/auth/login` | [`prototype/login.html`](../design/prototype/login.html) | 从输入用户名开始，调用 `entryVerify`，依据返回的 `status` 在本页切换到密码、一次性口令、邀请码等分支 |
| `/register` | `features/auth/register` | [`prototype/register.html`](../design/prototype/register.html) | 同样从输入用户名开始，与登录共用输入组件，注册成功或需要登录时链接到 `/login` |
| `/servers` | `features/auth/servers` | [`prototype/servers.html`](../design/prototype/servers.html) | 选择内置服务地址或手动填写 |
| 兜底 | 既有的 `*` 重定向到 `/` | 无 | 保持不变 |

页面使用的外壳参考 [`prototype/layout.html`](../design/prototype/layout.html) 与 [`prototype/welcome.html`](../design/prototype/welcome.html)。
登录页与注册页之间互相链接，并在跳转时保留已经输入的用户名。

### 3.2 Feature 清单

Feature 是域，位于 `features/` 下，自带 `locales/` 与 `tests/`。本轮新增一个域，下辖三个页面。

| Feature | 目录 | 页面 | 说明 |
| --- | --- | --- | --- |
| `auth` | `features/auth/` | `login`、`register`、`servers` | 登录、注册与服务器选择的域；三个页面共用输入组件与一套四语文案 |

页面属于 Feature，本身不是组件：它持有状态、调用接口，并把界面交给下面的组件渲染。

| 页面 | 目录 | 说明 |
| --- | --- | --- |
| 登录页 | `features/auth/login/` | 持有步骤状态，调用 `entryVerify` 与 `entryLogin` |
| 注册页 | `features/auth/register/` | 调用 `entryVerify` 与 `entryRegister` |
| 服务器页 | `features/auth/servers/` | 写入与清除服务地址 |

### 3.3 Component 清单

组件分两处落位，判据来自 [`architecture/03-boundaries.md`](../architecture/03-boundaries.md) §3。
**基础组件**进 `components/base/`，包装 `@base-ui/react`，只有视觉与行为；**页面内部件**留在 `features/auth/components/`，
由基础组件拼成，可以感知本页的流程。两者都遵循一个组件一个目录、样式与组件同名。

基础件已经交付，页面直接用现成参数，不必再新增；组件名与上游一致，上游没有对应部件的按上游的命名形状补 `-field` 结尾的名字。

| 基础组件 | 上游对应 | 目录 | 现行参数 | 状态 |
| --- | --- | --- | --- | --- |
| `input` | `input` | `components/base/input/` | `id`、`label`、`type`、`value`、`onChange`、`error`、`hint`、`icon`、`trailing`、`autoComplete`、`disabled`、`size`（`small` · `medium` · `large`）、`state`、`shake` | 结论：已交付，尺寸小 24 · 中 32 · 大 40 |
| `captcha-field` | 无部件，基于 `input` | `components/base/captcha-field/` | `id`、`value`、`onValueChange`、`onCaptchaIdChange`、`label`、`placeholder`、`hint`、`error`、`disabled`、`required`、`name`、`size`、`refreshLabel`、`imageAlt`、`autoComplete`、`className` | 结论：已交付，自己取图并把 `captcha_id` 交给调用方，尾部槽位按档定宽 72 · 96 · 120 |
| `otp-field` | `otp-field` | `components/base/otp-field/` | `id`、`value`、`onValueChange`、`onComplete`、`label`、`hint`、`error`、`disabled`、`readOnly`、`required`、`name`、`length`、`size`、`autoComplete`、`cellLabel`、`state`、`className` | 结论：已交付，一位一格、边长等于该档控件高度，支持整段粘贴 |
| `checkbox` | `checkbox` | `components/base/checkbox/` | `id`、`label`、`hint`、`error`、`checked`、`defaultChecked`、`onCheckedChange`、`indeterminate`、`disabled`、`readOnly`、`required`、`name`、`value`、`size`、`state`、`className` | 结论：已交付，选中与不确定态取反色族 |

**密码不另立基础件**。上游只有 `input`，密码就是 `type="password"` 的文本输入，因此沿用同一个基础件。
密码框右侧的可见性切换是组合出来的东西，不放进 `base/`：登录与注册共用它在
`features/auth/components/` 下放一个 `PasswordInput`，等出现第二个域的使用者再考虑上提为共享组件。

字段的标签、说明与错误不另立组件，直接用上游 `field` 的部件：`Field.Root` 包住一个字段，
`Field.Label` 出标签，控件本体用上游 `input` 的部件，`Field.Error` 出字段级错误，`Field.Description` 出说明。
`otp-field` 是例外，它是多控件字段，自己按同一套 `.field*` 类搭结构（见该组件文档的已知限制）。

通知方面上游有 `toast`。本轮 auth 不使用瞬态通知，页面级的状态提示由页面内部的 `StatusNotice` 承担；
将来出现真实的通知需求时包装上游的 `toast`，不自造提示组件。

现有的四个件与上游的对应关系如下。`icon` 与 `brand-mark` 上游没有对应部件，架构分册把它们记为例外。

| 现有组件 | 上游对应 | 结论 |
| --- | --- | --- |
| `button` | `button` | 八个变体（实心 · 浅底 · 幽灵 · 纯文字 · 琥珀 · 成功 · 危险 · 反色）、三档尺寸 24 · 32 · 40、整宽档、加载态、方形图标按钮与 `icon` 加 `iconPosition` 的图标加文字形态都已交付 |
| `select` | `select` | 触发器用自己的类，与输入框同梯 24 · 32 · 40；分组、富选项、多选、筛选、纯文字档、反色档与取消选择都已交付 |
| `icon` | 无 | 界面图标 81 个，含登录要用的邮件、锁、眼睛、隐藏眼睛、礼盒、地球、太阳与月亮；取值链路为 `scripts/vendor-lucide.mjs` 加 `build-icons.mjs` |
| `brand-mark` | 无 | 单元用例 5 条，尺寸档与无障碍属性齐 |

页面内部件留在 `features/auth/components/`，它们感知登录流程，因此不做成基础组件。四个件随页面一并实现。

| 组件 | 目录 | 参数 | 说明 |
| --- | --- | --- | --- |
| `PasswordInput` | `features/auth/components/password-input/` | `id`、`label`、`value`、`onValueChange`、`error`、`autoComplete`、`disabled` | 文本输入加可见性切换，登录与注册共用 |
| `ProviderList` | `features/auth/components/provider-list/` | `providers`、`onPick`、`pending` | 第三方登录入口，跳转 `oauthAuthorize` 返回的地址 |
| `ClientHint` | `features/auth/components/client-hint/` | `mode`、`onOpenInBrowser`、`onUseDeviceCode` | 客户端内提示回到浏览器或改用设备码 |
| `StatusNotice` | `features/auth/components/status-notice/` | `code`、`onRetry` | 展示 `entryConfig` 与各接口返回的状态，文案按错误码取 |

三个页面的外壳、域状态、目录结构、页面内部件清单与客户端内模式的完整清单见
[`06-login-features.md`](06-login-features.md)。

### 3.4 主题与语言切换的规格

这两个组件已经存在，位于 `components/theme-toggle/` 与 `components/locale-switch/`。它们读主题与语言状态，
按架构的判据留在 `components/` 而不进 `base/`。下表是页面依赖的规格，现已按此实现。

| 项 | 规格 |
| --- | --- |
| 主题状态 | 两档：浅色与深色；首次访问跟随系统，用户点过主题按钮之后写显式档 |
| 主题切换的形态 | 一个方形图标按钮（纯文字档，边长 24 / 32 / 40）；**图标反转**，显示的是点击后会变成的那一档（浅色画月亮、深色画太阳） |
| 主题切换的位置 | 登录页、注册页与服务器页的右上角 |
| 主题切换的可访问性 | 可访问名写动作（「切换到深色」/「切换到浅色」），与图标表达同一件事；键盘可操作，只有键盘聚焦画 `--focus-ring` |
| 语言范围 | 四语齐备：`zh-CN`、`zh-TW`、`en-US`、`ja` |
| 语言切换的行为 | 切换之后当前页面的文案立即更新，不刷新页面，已经输入的内容不丢失 |
| 语言切换的形态 | 纯文字档的下拉，当前语言名在前、地球图标在末尾，关掉下拉指示器；「跟随系统」是一等的选项，文案里带当前解析出的语言名 |
| 语言切换的位置 | 与主题切换同一处，位于页面右上角 |
| 文案归属 | 基础组件与页面内部件的文案放各自目录的 `locales/`，登录流程的文案放 `features/auth/locales/` |

### 3.5 实现约定

1. **状态**：会话的采纳与清除沿用 `platform/credential`，登录成功时采纳，退出时清除 `session` 与 `refresh`；更换服务地址时作废页面上的旧结果，与脚手架「请求」页同一规则。临时令牌只留在页面状态里，不进凭据存储。
2. **文案**：四语齐备（`zh-CN`、`zh-TW`、`en-US`、`ja`），按域放在 `features/auth/locales/` 下。
3. **公共件**：输入框与勾选项取 `components/base`，字段级错误用上游 `field` 的 `Error` 部件，页面级提示由页面内部的 `StatusNotice` 承担；不新增页面私有的同类控件。
4. **页面私有的组件与样式**放在 `features/auth/` 自己的目录下；页面使用独立外壳，不复用 `ScaffoldPage` 的导航与页头。

### 3.6 实现顺序

第 1 至第 3 步已经完成，是页面开工的前提；第 4 步是页面本身，页面内部件与页面一并实现。每一步都跑门禁并本地提交，前一步没有通过不进下一步。

| 顺序 | 内容 | 状态与验收 |
| --- | --- | --- |
| 1 | 新增四个基础件（`input`、`captcha-field`、`otp-field`、`checkbox`），并按重写要点修订 `button`、`select`、`icon`、`brand-mark` | 结论：已完成。每件有单元用例，图标由脚本生成并纳入 `sprite.test.ts` 与图标浏览器用例 |
| 2 | 主题与语言切换按 §3.4 的规格补齐 | 结论：已完成。切换立即生效、不刷新、不丢已输入内容，浏览器用例覆盖主题图标反转与四语切换 |
| 3 | 在脚手架里新增基础件清单页 | 结论：已完成。落到 `features/scaffold/`，路由 `/scaffold/base`，导航项与既有页面并列，形制见 [`05-scaffold.md`](05-scaffold.md)；九组共列全部基础件与状态，浏览器用例逐组断言 |
| 4 | auth 三个页面与页面内部件 | 待办：页面内部件随页面一并实现，完成后单元与浏览器用例覆盖关键路径，真调用走查对开发后端 |

## 4. 验收与交付

1. 门禁：`lint` · `check`（12 个检查器）· 单元 · 浏览器 · 拟人场景 · `build`，全部通过。
2. 证据：草图（评审用）· 真客户端截图（macOS 与 Windows）· 单元用例覆盖 `verify` 的两个分支与失败码 · 浏览器用例覆盖两个页面的关键路径。
3. 流程：本地逐轮提交，交付前走一轮隔离 Review，通过后合并推送。

## 5. 待定与已定

1. **ID Token 客户端验签**：已定，验签；所需接口 `oidcKeys` 已具备。
2. **第三方登录（OAuth）与设备码流**：已定，本轮做；接口声明与查询包装已具备，页面与页面内部件随之实现。
3. **MFA · 团队选择 · 邀请码**：入口配置若声明，按草图补页面；否则不做。
4. **服务器选择的最终归属**：与登录、注册这条线无关，随桌面壳那一轮一并定。
