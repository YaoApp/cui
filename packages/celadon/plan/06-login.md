# 产品级登录与注册（计划）

- **版本**：v1.0（计划，未开工）
- **上游**：[`04-status.md`](04-status.md) · [`03-data.md`](03-data.md) · [`06-state.md`](../architecture/06-state.md) · [`05-data-and-api.md`](../architecture/05-data-and-api.md)
- **参考**：`cui-desktop`（1.0 桌面壳与其 `cui` 包，只读）· 本仓 `packages/cui`（1.0 的 `cui` 包，只读）
- **目标**：把 1.0 的"入口"能力归一化为一套产品级实现 —— 一个 `data/user` 域、两个独立页面（登录、注册）、一个服务器选择页面，全部走本仓的平台层与设计体系。

## 0. 旧能力盘点（`/user/entry` 相关接口）

### 0.1 接口（来源：`packages/cui/openapi/user/auth.ts`，1.0 实现）

| 端点 | 作用 | 备注 |
| --- | --- | --- |
| `GET /user/entry?locale=` | 统一入口配置 `EntryConfig` | 标题、描述、成功/失败跳转、登出跳转、`form`（用户名占位与字段、密码占位、验证码类型 `image`/`turnstile` 及其选项）。1.0 的入口界面由它驱动 |
| `POST /user/entry/verify` | 判定"登录还是注册"，并返回**临时令牌** | 入参 `{username, captcha_id?, captcha?, locale?}`；出参含 `status`（`login`/`register`）、`access_token`、`expires_in`、`scope`、`user_exists`、`verification_sent`、`otp_id`。注册分支自动发出验证码 |
| `POST /user/entry/register` | 注册 | 需临时令牌（`Authorization: Bearer <temp>`）；入参 `{name?, password, confirm_password?, otp_id?, verification_code?, locale?}`；出参 `EntryAuthResponse` |
| `POST /user/entry/login` | 登录 | 需临时令牌；入参 `{password, remember_me?, locale?}`；出参 `EntryAuthResponse` |
| `POST /user/entry/otp?locale=` | 重发验证码 | 需临时令牌；出参 `{otp_id, expires_in}` |
| `POST /user/entry/invite/verify` | 邀请码校验与兑换 | 需带 `invite_verification` 作用域的临时令牌；成功后直接返回 `EntryAuthResponse` |
| `GET /user/entry/captcha` · `GET /user/entry/captcha?captcha_id=` | 图形或人机验证 | 出参 `{captcha_id, captcha_image, expires_in}` |
| `POST /user/oauth/:id/authorize` · `POST /user/oauth/:id/callback` | 第三方登录 | 1.0 另有设备码流（`/device/authorize`、`/device/token`）与设备授权页 |
| `POST /user/logout` | 服务端登出 | 本仓 `data/user` 已声明 |
| `GET /user/profile`（OIDC UserInfo）| 用户资料 | 与本轮入口流程相邻，暂不展开 |

### 0.2 数据结构（来源：`packages/cui/openapi/user/types.ts`）

- `EntryConfig`：`title` · `description` · `success_url` · `failure_url?` · `logout_redirect?` · `auto_login?` · `role?` · `type?` · `form?`（见上表）。
- `EntryVerifyResponse`：`status: 'login' | 'register'` · `access_token` · `expires_in` · `token_type` · `scope` · `user_exists` · `verification_sent?` · `otp_id?`。
- `EntryRegisterRequest` / `EntryLoginRequest` / `EntrySendOTPResponse` / `EntryAuthResponse`：字段同上表。
- `EntryAuthResponse` 的令牌族：`session_id` · `id_token` · `access_token` · `refresh_token` · `expires_in` · `refresh_token_expires_in` · `mfa_enabled` · `status`。
- `LoginStatus`：`Success` · `MFARequired` · `TeamSelectionRequired` · `InviteVerification`。

### 0.3 1.0 的界面位置（只读参考）

- `pages/auth/entry/index.tsx`（登录与注册的统一入口）· `pages/auth/entry/invite/index.tsx`（邀请码）· `pages/auth/token/index.tsx`（验证码/令牌）· `pages/auth/connect/index.tsx`（第三方连接）· `pages/setup/redirect.ts` · `pages/team/invite/$.tsx`。
- **服务器选择**：`cui-desktop/src/pages/servers.ts`（408 行）。它在**应用之外**的桌面壳里用原生 DOM 渲染：`servers` 列表与 `activeServerUrl`、托盘"切换服务器"以 `?switch=1` 进入、首屏自动重连、主题与语言变化时整页重渲染、云端服务器列表异步加载。

### 0.4 归一化要解决的问题

1. **入口界面在 1.0 的应用内，服务器选择在 1.0 的应用外** —— 两套渲染与两套样式。本轮把服务器选择做成应用内页面（无服务地址时由外壳呈现），与登录、注册共用设计体系。
2. **临时令牌没有进入本仓的模型**。本仓 `platform/credential` 已具备 `signIn`（仅在应用托管凭据时采纳令牌）与 `signOut`（清除 `session` 与 `refresh`），入口流程需要在其上补齐"临时令牌只在请求头里用一次"的表达方式。
3. **ID Token 验签在 1.0 里有降级分支**（无 `crypto.subtle` 时跳过验签、直接解载荷）。本轮不沿用该分支；是否在客户端验签，列入 §5 待定。
4. **`EntryConfig` 驱动的动态表单** 与"登录、注册分开两个页面"存在张力：判定登录或注册发生在 `verify` 之后，因此两个页面共用该步，随后各自继续。

## 1. 第一步：草图（纯 HTML，用设计体系 Token）

**状态：已完成**（2026-10-05）。产物：[`login.html`](../design/prototype/login.html) · [`register.html`](../design/prototype/register.html) · [`servers.html`](../design/prototype/servers.html) · [`layout.html`](../design/prototype/layout.html) · [`welcome.html`](../design/prototype/welcome.html) —— 均为占位演示。

## 2. 第二步：接口准备（用啥写啥）

**状态：已完成**（2026-10-05）；交付物为 `app/src/data/user/`（13 条声明，含中英两份 README），字段与路径以 1.0 源码和 `yao/openapi/user/*` handler 为准，临时令牌经 `RequestOptions.headers` 传递，失败按错误码翻译，语言由 ctx 统一提供，单元 fixture 与浏览器层 15 步活体走查均已通过，`api`、`keys`、`queries` 覆盖率四项 100%。

## 3. 第三步：页面实现（登录与注册分开）

### 3.1 路由清单

路径都在构建决定的 base 之下，三个页面都使用独立外壳，不带应用的 Surface 导航。
「设计原型」一列指向第一步的草图，用于对照界面；草图为占位演示，细节随实现推进。

| 路径 | 页面 | 设计原型 | 说明 |
| --- | --- | --- | --- |
| `/login` | `features/auth/login` | [`prototype/login.html`](../design/prototype/login.html) | 从输入用户名开始，调用 `entryVerify`，依据返回的 `status` 在本页切换到密码、一次性口令、邀请码等分支 |
| `/register` | `features/auth/register` | [`prototype/register.html`](../design/prototype/register.html) | 同样从输入用户名开始，与登录共用输入组件，注册成功或需要登录时链接到 `/login` |
| `/servers` | `features/auth/servers` | [`prototype/servers.html`](../design/prototype/servers.html) | 选择内置服务地址或手动填写，没有可用地址时由外壳引导到本页 |
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
**基础组件**进 `components/base/`，包装 `@base-ui/react`，只有视觉与行为；**页面内部件**留在 `features/auth/parts/`，
由基础组件拼成，可以感知本页的流程。两者都遵循一个组件一个目录、样式与组件同名。

先补基础组件。组件名与上游保持一致：上游有同名部件的一律沿用它的名称，上游没有对应部件的，
按上游的命名形状补一个以 `-field` 结尾的名字。

| 基础组件 | 上游对应 | 目录 | 参数 | 说明 |
| --- | --- | --- | --- | --- |
| `input` | `input` | `components/base/input/` | `id`、`label`、`type`、`value`、`onChange`、`error`、`hint`、`autoComplete`、`disabled`、`trailing` | 文本输入；用户名、邮箱与密码都用它，靠 `type` 与校验规则区分，`trailing` 供右侧附加内容 |
| `captcha-field` | 无部件，基于 `input` | `components/base/captcha-field/` | `id`、`image`、`value`、`onChange`、`onRefresh`、`error`、`disabled` | 图形验证码，图像由调用方传入；行为与文本输入不同，因此单列 |
| `otp-field` | `otp-field` | `components/base/otp-field/` | `id`、`value`、`onChange`、`error`、`disabled` | 一次性口令，分段输入，支持整段粘贴 |
| `checkbox` | `checkbox` | `components/base/checkbox/` | `id`、`checked`、`onChange`、`label`、`error` | 勾选项，用于服务条款 |

**密码不另立基础件**。上游只有 `input`，密码就是 `type="password"` 的文本输入，因此沿用同一个基础件。
密码框右侧的可见性切换是组合出来的东西，不放进 `base/`：登录与注册共用它在
`features/auth/parts/` 下放一个 `PasswordInput`，等出现第二个域的使用者再考虑上提为共享组件。

字段的标签、说明与错误不另立组件，直接用上游 `field` 的部件：`Field.Root` 包住一个字段，
`Field.Label` 出标签，`Field.Control` 接控件，`Field.Error` 出字段级错误，`Field.Description` 出说明。

通知方面上游有 `toast`。本轮 auth 不使用瞬态通知，页面级的状态提示由页面内部的 `StatusNotice` 承担；
将来出现真实的通知需求时包装上游的 `toast`，不自造提示组件。

现有的四个件与上游的对应关系如下。`icon` 与 `brand-mark` 上游没有对应部件，架构分册把它们记为例外。

| 现有组件 | 上游对应 | 现状 | 本轮重写要点 |
| --- | --- | --- | --- |
| `button` | `button` | 已包装 Base UI，用设计类，有 `solid`、`soft`、`ghost` 三个变体与两档尺寸，有用例 | 补设计里已有的 `warn` 变体与 `is-loading` 状态，补图标槽与整宽档，核对尺寸档 |
| `select` | `select` | 已包装 Base UI 的触发器、弹层与选项，有用例 | 补错误态与尺寸档，触发器外观与 `input` 统一 |
| `icon` | 无 | 雪碧图引用，四档尺寸，无障碍属性齐，有用例 | 新增 auth 需要的八个图标，尺寸档按设计核对 |
| `brand-mark` | 无 | 品牌与无障碍属性正确 | 补单元用例，它是四件里唯一没有用例的 |

图标沿用 `components/base/icon`。现有图标集已经包含 `i-left`、`i-pc` 与 `i-state-error`；原型还用到的邮件、锁、眼睛、隐藏眼睛、礼盒、地球、太阳与月亮这八个需要新增到 `platform/icons`。

页面内部件留在 `features/auth/parts/`，它们感知登录流程，因此不做成基础组件。

| 组件 | 目录 | 参数 | 说明 |
| --- | --- | --- | --- |
| `PasswordInput` | `features/auth/parts/password-input/` | `id`、`label`、`value`、`onChange`、`error`、`autoComplete`、`disabled` | 文本输入加可见性切换，登录与注册共用 |
| `ProviderList` | `features/auth/parts/provider-list/` | `providers`、`onPick`、`pending` | 第三方登录入口，跳转 `oauthAuthorize` 返回的地址 |
| `ClientHint` | `features/auth/parts/client-hint/` | `serverName`、`onOpen` | 客户端模式下提示回到浏览器或改用设备码 |
| `StatusNotice` | `features/auth/parts/status-notice/` | `code`、`onRetry` | 展示 `entryConfig` 与各接口返回的状态，文案按错误码取 |

### 3.4 主题与语言切换的规格

这两个组件已经存在，位于 `components/theme-toggle/` 与 `components/locale-switch/`。它们需要读主题与语言状态，
按架构的判据留在 `components/` 而不进 `base/`。本轮只写 auth 页面用到的规格，其余等有实际用法再补。

| 项 | 规格 |
| --- | --- |
| 主题状态 | 三态：跟随系统、浅色、深色，初始为跟随系统 |
| 主题切换的位置 | 登录页、注册页与服务器页的右上角 |
| 主题切换的可访问性 | 用 `aria-pressed` 表达选中状态，键盘可操作，焦点环用 `--focus-ring` |
| 语言范围 | 四语齐备：`zh-CN`、`zh-TW`、`en-US`、`ja` |
| 语言切换的行为 | 切换之后当前页面的文案立即更新，不刷新页面，已经输入的内容不丢失 |
| 语言切换的位置 | 与主题切换同一处，位于页面右上角 |
| 文案归属 | 基础组件与页面内部件的文案放各自目录的 `locales/`，登录流程的文案放 `features/auth/locales/` |

### 3.5 实现约定

1. **状态**：会话的采纳与清除沿用 `platform/credential`，登录成功时采纳，退出时清除 `session` 与 `refresh`；更换服务地址时作废页面上的旧结果，与脚手架「请求」页同一规则。
2. **文案**：四语齐备（`zh-CN`、`zh-TW`、`en-US`、`ja`），按域放在 `features/auth/locales/` 下。
3. **公共件**：输入框与勾选项取 `components/base`，字段级错误用上游 `field` 的 `Error` 部件，页面级提示由页面内部的 `StatusNotice` 承担；不新增页面私有的同类控件。
4. **页面私有的组件与样式**放在 `features/auth/` 自己的目录下；页面使用独立外壳，不复用 `ScaffoldPage` 的导航与页头。

### 3.6 实现顺序

先做能独立验收的底座，再做页面。每一步都跑门禁并本地提交，前一步没有通过不进下一步。

| 顺序 | 内容 | 验收方式 |
| --- | --- | --- |
| 1 | 新增四个基础件（`input`、`captcha-field`、`otp-field`、`checkbox`），并按重写要点修订 `button`、`select`、`icon`、`brand-mark` | 每件一个单元用例；图标走图标脚本生成 |
| 2 | 主题与语言切换按 3.4 的规格补齐 | 单元用例覆盖三态与四语切换；切换不刷新、不丢输入 |
| 3 | 在脚手架里新增基础件清单页 | 浏览器用例打开该页并逐组断言；人类可按页验收 |
| 4 | auth 三个页面与页面内部件 | 单元与浏览器用例；真调用走查对开发后端 |

第 3 步的页面按分组列出全部基础件：输入类、选择类、勾选类、反馈类、图标与品牌、主题与语言。
每组展示默认、悬停、焦点、禁用与错误等状态，作为测试与人类验收的共同入口。
它落在脚手架里（`features/scaffold/`），路由为 `/scaffold/base`，导航项与既有四个页面并列，
具体形制见 [`05-scaffold.md`](05-scaffold.md)。

## 4. 验收与交付

1. 门禁：`lint` · `check`（12 个检查器）· 单元 · 浏览器 · 拟人场景 · `build`，全部通过。
2. 证据：草图（评审用）· 真客户端截图（macOS 与 Windows）· 单元用例覆盖 `verify` 的两个分支与失败码 · 浏览器用例覆盖两个页面的关键路径。
3. 流程：本地逐轮提交，交付前走一轮隔离 Review，通过后合并推送。

## 5. 待定

1. **ID Token 客户端验签**：**已定 —— 验签**；所需接口现已具备。
2. **第三方登录（OAuth）与设备码流**：**已定 —— 本轮做**；接口位置保留。
3. **MFA · 团队选择 · 邀请码**：入口配置若声明，按草图补页面；否则不做。
4. **服务器选择的最终归属**：与登录/注册这条线无关，随桌面壳那一轮一并定。
