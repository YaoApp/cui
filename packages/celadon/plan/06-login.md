# 产品级登录与注册（计划）

- **版本**：v1.0（计划，未开工）
- **上游**：[`04-status.md`](04-status.md) · [`03-data.md`](03-data.md) · [`06-state.md`](../architecture/06-state.md) · [`05-data-and-api.md`](../architecture/05-data-and-api.md)
- **参考**：`cui-desktop`（1.0 桌面壳与其 `cui` 包，只读）· 本仓 `packages/cui`（1.0 的 `cui` 包，只读）
- **目标**：把 1.0 的"入口"能力归一化为一套产品级实现 —— 一个 `data/user` 域、两个独立页面（登录、注册）、一个服务器选择页面，全部走本仓的平台层与设计体系。

## 0. 旧能力盘点（`/user/entry` 一线）

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

在 `data/user` 域内按现有域形状（`types` · `api` · `keys` · `queries` · `index`）补齐入口一线上真正会用到的声明，不预置用不到的端点。

| 声明 | 用途 | 说明 |
| --- | --- | --- |
| `entryConfig` | `GET /user/entry` | 惰性读取一次；失败不缓存 |
| `entryVerify` | `POST /user/entry/verify` | 返回临时令牌与 `status` |
| `entryRegister` | `POST /user/entry/register` | 请求头带临时令牌 |
| `entryLogin` | `POST /user/entry/login` | 请求头带临时令牌 |
| `entryOtp` | `POST /user/entry/otp` | 重发验证码 |
| `entryCaptcha` | `GET /user/entry/captcha` | 仅在配置要求时使用 |
| `entryInvite` | `POST /user/entry/invite/verify` | 仅在配置要求邀请码时使用 |
| `logout` | `POST /user/logout` | 已存在 |

**规则**：

1. 临时令牌走 `Request.headers` 的 `Authorization`，不进凭据库；成功后的正式令牌交给 `signIn`（它只在应用托管凭据时采纳，Web 由服务端写 Cookie）。
2. 失败以值返回，`code` 与 `params` 由语言包翻成界面文案；引擎原文不上屏。
3. 入口配置与验证码响应的字段一律进类型，页面不猜字段名。
4. 端点的取舍以 §1 草图确定的交互为准：草图上没有的流程，本轮不声明。

## 3. 第三步：页面实现（登录与注册分开）

1. **路由**：`/login` 与 `/register` 各自独立页面；两者都从"输入用户名"开始并调用 `verify`，据其 `status` 继续本页流程或提示切换；`/login` 与 `/register` 互相链接。
2. **服务器选择**：无服务地址时由外壳呈现（应用内页面，走同一套 Token 与公共件）；有地址后进入应用。原桌面壳的原生 DOM 实现退役。
3. **状态**：会话的采纳与清除沿用 `platform/credential`（登录成功采纳、退出清除 `session` 与 `refresh`）；换服务地址时作废页面上的旧结果，与脚手架「请求」页同一规则。
4. **文案**：四语齐（`zh-CN` · `zh-TW` · `en-US` · `ja`），文案按域就近放在 `features/<域>/locales/`。
5. **公共件**：输入框、按钮、提示等优先用 `components/base`，缺什么补什么；不新增页面私有控件。
6. **页面私有的组件与样式**放在该域自己的目录下；导航与页头沿用 `ScaffoldPage` 的收法，产品页面另行设计外壳（见 [`04-status.md`](04-status.md) §3）。

## 4. 验收与交付

1. 门禁：`lint` · `check`（12 个检查器）· 单元 · 浏览器 · 拟人场景 · `build`，全部通过。
2. 证据：草图（评审用）· 真客户端截图（macOS 与 Windows）· 单元用例覆盖 `verify` 的两个分支与失败码 · 浏览器用例覆盖两个页面的关键路径。
3. 流程：本地逐轮提交，交付前走一轮隔离 Review，通过后合并推送。

## 5. 待定

1. **ID Token 是否在客户端验签**：1.0 有"非安全上下文跳过验签"的降级分支；本轮或依赖引擎侧会话与服务端校验，或引入验签，二选一，开工前定。
2. **第三方登录（OAuth）与设备码流**：本轮不做，接口位置保留。
3. **MFA · 团队选择 · 邀请码**：入口配置若声明，按草图补页面；否则不做。
4. **服务器选择的最终归属**：本轮定为应用内页面；是否同时保留托盘入口，随桌面壳那一轮一并定。
