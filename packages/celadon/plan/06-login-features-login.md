# 06-login-features-login · 登录页实现（2026-10-07）

- **规则**：[`../architecture/SPEC.md`](../architecture/SPEC.md)（自足开发规范）·
  [`03-boundaries.md`](../architecture/03-boundaries.md)（落位）· [`06-state.md`](../architecture/06-state.md)（状态归属）·
  [`07-routing.md`](../architecture/07-routing.md)（路由与地址）· [`08-i18n.md`](../architecture/08-i18n.md)（文案）·
  [`14-testing.md`](../architecture/14-testing.md)（测试分层）· [`15-platform.md`](../architecture/15-platform.md)（宿主差异）
- **上游**：[`06-login.md`](06-login.md) §3（页面与流程）· [`06-login-features.md`](06-login-features.md)（外壳、域状态与页面内部件清单）·
  [`06-login-components.md`](06-login-components.md)（基础件）
- **参考**：`design/prototype/login.html`（界面）· `packages/cui/pages/auth/entry/index.tsx`（1.0 的行为，只读）
- **范围**：登录页一个页面，以及随它落地的共用件（外壳、域状态、四个页面内部件）
- **计划不是规范**：规则只写在 `architecture/`，本文只列实现与判据

## 1. 一句话

登录页是一个路由、一个居中的卡片、三步（账号、密码、邀请码）。共用件跟着这一页落地：
外壳 `AuthLayout`、域状态 `AuthProvider`、`PasswordInput`、`ProviderList`、`StatusNotice`、`TermsNote`。
注册页与服务器页随后接同一套外壳与同一个域状态，不重画。

## 2. 1.0 的行为清点与我们的差异（只读参考）

来源：`packages/cui/pages/auth/entry/index.tsx`（一个页面装下登录与注册，字段按步骤显隐）。
下表逐条对照，**差异列写清我们改了什么**。

| 行为 | 1.0 的做法 | 我们的做法 |
| --- | --- | --- |
| 形态 | 一个页面，`isEmailVerified` 与 `verificationStatus` 决定字段显隐 | 同样三步：账号、密码、邀请码；步骤状态在 `AuthProvider` |
| 账号输入 | 邮箱，验证后 `disabled`，右侧一个「修改」链接回第一步 | 同；「修改」是按钮（不是可点的 `span`），并把焦点送回账号框 |
| 图形验证码 | 账号有效且未验证时显示；`captcha_id` 与输入随 `verify` 回传；verify 失败后换一张 | 同；取图与换图由 `captcha-field` 自己承担，页面只收 `value` 与 `captcha_id` |
| 判定 | `EntryVerify` 返回 `access_token`（临时）、`status`、`otp_id` | 同；临时令牌只存 `AuthProvider` 的内存状态，**不落 sessionStorage** |
| 登录 | `EntryLogin({password, remember_me, locale}, 临时令牌)` | `entryLoginQuery(token, { password, remember_me })` |
| 注册 | `EntryRegister({password, confirm_password, otp_id?, verification_code?, locale}, 临时令牌)` | `entryRegisterQuery(token, { password, confirm_password, otp_id?, verification_code? })` |
| 验证码要求 | `verification_code_required` 为真时显示口令输入与「重发」，重发倒计时 60 秒 | 同；口令输入用 `otp-field`，重发按钮在倒计时内禁用 |
| 重发 | `SendOTP(临时令牌, locale)`，成功后更新 `otp_id` | `entryOtpQuery(token)`，成功后更新 `otp_id` |
| 邀请码 | 跳到独立页 `/auth/entry/invite`，临时令牌放 `sessionStorage` | 做成**页内第三步**；令牌仍在内存；要不要独立页见 §12 |
| 联合状态 | `mfa_required` 跳 `/auth/entry/mfa`，`team_selection_required` 跳 `/team/select` | 未决：入口配置声明时才做，见 §12 |
| 登录成功 | `ValidateIDToken(id_token)` 后 `AfterLogin(...)`，再跳 `success_url` | 验签（已定），成功后 `signIn(响应体)` 并跳 `/welcome`（§7.1），成功地址由欢迎页接手；Web 上 `signIn` 是空操作 |
| 注册成功但没有 `id_token` | 提示注册成功，1.5 秒后回到入口重新登录 | 同样回到第一步并给一条提示（`auto_login` 为假时就是这个分支） |
| 失败 | 直接印服务端 `error_description` | 按错误码取 `failure.text`（语言包 `data.error.<码>`），字段级错误挂字段，其余挂 `StatusNotice` |
| 校验提示 | 弹层提示（`message.warning`） | 字段级错误；按钮在无效时禁用，不弹层 |
| 条款 | 卡片底部一段被动说明 | 按原型做成**勾选**加一行错误；两个链接只在配置给了地址时显示 |
| 主题与语言 | 外壳自带 | 用现成的 `theme-toggle` 与 `locale-switch`，切换不丢已输入内容 |

## 3. 文件清单

| 文件 | 职责 | 关键导出 |
| --- | --- | --- |
| `routes/routes.tsx`（改） | 加一个**无路径布局路由**，`element` 是 `AuthLayout`，子路由是 `/login`、`/register`、`/servers`、`/auth/back/:provider` | `routes` |
| `features/auth/login/login.tsx` | 登录页：三步的界面与事件 | `LoginPage` |
| `features/auth/login/login.less` | 卡片内的纵向排布与间距 | 无 |
| `features/auth/login/login.test.tsx` | 单元用例 | 无 |
| `features/auth/login/index.ts` | 出口 | `LoginPage` |
| `features/auth/components/auth-layout/auth-layout.tsx` | 外壳：品牌、两个全局控件、卡片、页脚、客户端栏、`<Outlet />` | `AuthLayout` |
| `features/auth/components/auth-layout/auth-layout.less` | 外壳的排布 | 无 |
| `features/auth/components/auth-provider/auth-provider.tsx` | 域状态与域动作 | `AuthProvider` |
| `features/auth/components/auth-provider/auth-context.ts` | 上下文与 `useAuth()` | `useAuth` |
| `features/auth/components/password-input/password-input.tsx` | 文本输入加可见性切换 | `PasswordInput` |
| `features/auth/components/provider-list/provider-list.tsx` | 第三方入口列表 | `ProviderList` |
| `features/auth/components/status-notice/status-notice.tsx` | 页面级状态提示 | `StatusNotice` |
| `features/auth/components/terms-note/terms-note.tsx` | 条款勾选与链接 | `TermsNote` |
| `features/auth/locales/{zh-CN,zh-TW,en-US,ja}.json` | 四语文案（登录、注册、服务器三页共用一个包） | 无 |
| `features/auth/tests/login.browser.ts` | 浏览器用例 | 无 |

取数落位：**页面与 `AuthProvider` 发请求**（`features → data` 合法）；界面件（`AuthLayout`、`PasswordInput`、
`ProviderList`、`StatusNotice`、`TermsNote`）不发请求、不读状态；`captcha-field` 是个已登记的例外（它自己取图）。

## 4. 状态与数据流

### 4.1 `AuthProvider` 的状态

| 字段 | 类型 | 初值 | 谁改 | 说明 |
| --- | --- | --- | --- | --- |
| `config` | `EntryConfig \| undefined` | 未取回 | 入口配置取回后 | 三个页面共用；`undefined` 时页面给加载态 |
| `phase` | `'account' \| 'password' \| 'invite'` | `'account'` | 动作 | 步骤 |
| `verifyStatus` | `'login' \| 'register' \| undefined` | 未判定 | `submitAccount` 成功 | 决定密码步的字段与按钮文案 |
| `tempToken` | `string` | `''` | `submitAccount` 成功 | 临时令牌，只在请求头里用一次 |
| `otpId` | `string` | `''` | `submitAccount` 成功 · `resendCode` 成功 | 注册用 |
| `needsCode` | `boolean` | `false` | 判定后按 `verification_code_required` | 注册是否要口令 |
| `username` | `string` | `''` | 页面 | 登录与注册之间保留；提交时 `trim()` |
| `notice` | `{ tone: 'info' \| 'danger'; text: string } \| undefined` | 无 | 动作 | 页面级提示，文案来自 `failure.text` 或语言包 |

### 4.2 页面自己的表单状态

`account` · `captcha` · `captchaId` · `password` · `confirmPassword` · `code` · `remember` · `acceptedTerms` ·
`touched`（记录哪些字段被碰过，用来决定错误何时出现）。这些都留在 `login.tsx` 里，**不进 store**：
它们是这一页的临时输入，刷新即应清空，地址栏也不需要表达。

### 4.3 动作

| 动作 | 前置 | 调用 | 成功 | 失败 |
| --- | --- | --- | --- | --- |
| `submitAccount` | 账号非空且形似邮箱或手机；验证码已填（需要时）；条款已勾 | `entryVerifyQuery({ username, captcha_id, captcha })` | 记 `tempToken`、`verifyStatus`、`otpId`、`needsCode`，`phase = 'password'`，聚焦密码框 | `notice` 取 `failure.text`；需要图形验证码时换一张；`phase` 不动 |
| `submitPassword` | 密码非空；注册时两次一致；需要口令时口令填满 | `entryLoginQuery(token, { password, remember_me })` 或 `entryRegisterQuery(token, { password, confirm_password, otp_id, verification_code })` | `signIn(响应体)`；有 `id_token` 时先验签；跳 `/welcome`（§7.1） | `notice` 取 `failure.text`；`invite_verification_required` 转 `phase = 'invite'` |
| `resendCode` | 倒计时结束 | `entryOtpQuery(token)` | 更新 `otpId`，倒计时 60 秒重新开始 | `notice` 取 `failure.text` |
| `redeemInvite` | 邀请码非空 | `entryInviteQuery(token, { code })` | `signIn(响应体)`；跳 `/welcome`（§7.1） | `notice` 取 `failure.text` |
| `pickProvider` | 无 | `oauthAuthorizeQuery(provider.id, redirectUri)` | 跳授权地址：在当前窗口整页跳转（`platform/client/open-external.ts`），不另开窗口 | `notice` 取 `failure.text` |
| `changeAccount` | 无 | 无 | 清密码、确认密码、口令、验证码与判定结果，`phase = 'account'`，聚焦账号框 | 无 |
| `dismissNotice` | 无 | 无 | 清 `notice` | 无 |

## 5. 步骤与界面映射

| 步 | 显示 | 按钮 | 禁用条件 |
| --- | --- | --- | --- |
| 账号 | 标题与说明（`config.title` 与 `config.description`，为空时用语言包兜底）；`ProviderList`（`config.third_party.providers` 非空时）；账号字段（`type="email"`、`icon` 用邮件图标、`autoComplete="email"`、占位取 `config.form.username.placeholder`）；验证码（`form.captcha.type === 'image'` 且账号形似有效时）；`TermsNote`；卡片下方「还没有账号，去注册」 | 「继续」（`button` 的实心档、整宽） | 账号无效 · 验证码未填（需要时）· 条款未勾 · 请求进行中 |
| 密码 | 账号只读加「修改」；`PasswordInput`（`autoComplete` 按 `verifyStatus` 取 `current-password` 或 `new-password`，占位取 `config.form.password.placeholder`）；注册再给确认密码（占位取 `config.form.confirm_password.placeholder`）；注册且 `needsCode` 给 `otp-field` 与「重发」；登录给 `remember_me` 勾选与忘记密码链接（`config.form.remember_me` 与 `forgot_password_link` 为真时） | `verifyStatus === 'login'` 时「登录」，否则「注册」 | 上面各字段的必填未满足 · 请求进行中 |
| 邀请码 | 账号只读；邀请码输入（占位取 `config.invite?.placeholder`）；`config.invite?.title` 与 `description` 作为标题与说明 | 「兑换」 | 邀请码为空 · 请求进行中 |

页面标题用 `<h1>`，并把它与卡片的 `aria-labelledby` 关联（原型这里指向了一个不存在的 id，实现时修掉）。
`StatusNotice` 放在表单上方，`tone` 决定颜色（危险色只用于失败）。

## 6. 校验与错误落点

| 项 | 规则 | 落点 |
| --- | --- | --- |
| 账号 | 非空，且形似邮箱或手机（宽松：含 `@` 且有点号，或纯数字且长度在 6 以上） | 账号字段的 `error`（`touched` 之后才出现）；同时禁用按钮 |
| 图形验证码或人机验证 | `form.captcha.type` 为 `image` 或 `turnstile` 时必填 | 验证码字段的 `error`；图形验证码由 `captcha-field` 自己画换图与失败态，人机验证由 `turnstile-field` 管理控件与令牌，两者都放判定请求的 `captcha` 字段 |
| 密码 | 非空 | 密码字段的 `error` |
| 确认密码 | 与密码一致 | 确认密码字段的 `error`（文案「两次输入的密码不一致」） |
| 口令 | 需要时位数填满（`otp-field` 的 `length`），填满即可提交 | 口令字段的 `error` |
| 条款 | 勾选 | `TermsNote` 自己的一行提示，`role="alert"`，勾上即清 |
| 服务端失败 | 按 `failure.code` 落位：能定位到字段的挂字段，其余挂 `StatusNotice` | 文案一律取 `failure.text`（四语），不使用 `message` 与 `rawMessage` |

## 7. 跳转与地址

- 登录与注册成功后先跳 `/welcome`（见 §7.1），由欢迎页再走 `config.success_url`：**同源**时走路由（去掉构建命名空间前缀后 `navigate(path)`），**外链**时用 `location.assign(url)`。
- 失败时留在本页给 `StatusNotice`（字段级错误挂到字段上）；入口配置里的 `failure_url` 尚未接入。
- **不新增地址参数**；读只认 `POP`；**不在 `useEffect` 里写 URL**。
- 真链接（`<a href>`）一律经 `appHref()`；路由路径（`to`）不带命名空间。
- 第三方登录的回跳地址是**路径段**，不是查询参数：发起授权时把 `redirect_uri` 指到 `appHref('/auth/back/<提供方>')` 的绝对地址，提供方回来时把 `code` 与 `state` 带在查询里。回跳页把它们交给 `oauthCallback`，再走与账号登录相同的分支（邀请码、多因素回登录页，其余走成功收尾）。点第三方入口一律**在当前窗口整页跳转**（`platform/client/open-external.ts`），Web 与桌面同一套，不另开窗口、不交系统浏览器。
- **桌面第三方登录的回跳尚未闭环**：在当前窗口跳转后，回跳落在应用自己的来源上；生产里这个来源是资产协议，第三方提供方是否接受这样的 `redirect_uri`、拿到的会话能否写进桌面凭据库，都还没有验证。闭环需要深链或本地回调通道；数据层已经有设备码的接口（`deviceFlowStart` · `deviceFlowToken`），登录页还没有接。
- **入口配置取不到时的两半**：请求失败（有错或非 2xx）时，登录与注册页给失败态与「重试」（`StatusNotice` 的 `retryLabel` + `onRetry`，重试即再取一次入口配置）；请求**一直不返回**时仍停在加载态，因为入口配置的取数没有超时。超时值属于产品决定，未设。
- 1.0 支持 `?redirect=` 并把目标存进 Cookie；我们是否支持见 §12。

### 7.1 欢迎页（占位）

登录或注册成功、会话采纳之后，`use-complete-sign-in` 把本次会话的用户信息写进登录域状态并跳 `/welcome`；欢迎页展示这些信息，点「继续」走 `config.success_url`（没有配置就回应用首页）。直接打开这个地址、或刷新后内存里没有用户信息时回登录页。

用户信息的来源见 `features/auth/user-info.ts`：

| 展示项 | 取值 |
| --- | --- |
| 用户标识 | 响应里的 `user_id`，没有就取 ID Token 声明里的 `yao:user_id`，再退到 `sub` |
| 账号 | 本次登录用的账号（第三方登录没有） |
| 显示名 | 声明里的 `name`，没有就看 `yao:member.display_name` |
| 邮箱 | 声明里的 `email` |

声明由 `idTokenClaimsForDisplay` 从载荷读出，**只用于展示**；是否可信由 `verifyIdToken` 判，验签失败仍走原来的失败路径。缺的字段不占一行。按用户信息分流随后接在这一页的「继续」之后。

「继续」在入口配置还没回来之前不可点；配置明确取不到时照旧可点，按没有成功地址处理，回应用首页。

## 8. 无障碍与键盘

1. 表单是 `<form>`，主操作是 `type="submit"`，回车即提交。
2. 进入密码步后把焦点给密码框，回第一步时把焦点给账号框；「修改」是可聚焦的按钮。
3. 错误与提示经 `aria-describedby` 与控件关联，失败提示是 `role="alert"`。
4. 语言与主题切换后已输入的内容不丢（流程状态在 `AuthProvider`，表单在页面且不随语言重建）。
5. `PasswordInput` 的可见性切换带 `aria-label` 与 `aria-pressed`，四语由语言包给；它不占 Tab 停点，Tab 从密码框直接到下一个字段（确认密码或主操作）。
6. 验证码弹窗打开时的焦点按内容定（规则见 `design/layout.md`）：图形验证码聚焦输入框；人机验证**不动焦点**，焦点留在页面上，不落到右上角的关闭钮。取消、叉、Esc 与遮罩仍照旧关闭。

## 9. 文案键清单（`features/auth/locales/`，四语齐备）

| 键 | 用途 |
| --- | --- |
| `auth.login.title` · `auth.login.description` | 入口配置为空时的标题与说明兜底 |
| `auth.field.account` · `auth.field.password` · `auth.field.confirmPassword` · `auth.field.code` · `auth.field.invite` | 字段标签 |
| `auth.error.accountInvalid` · `auth.error.passwordRequired` · `auth.error.passwordMismatch` · `auth.error.codeRequired` · `auth.error.termsRequired` | 字段级校验 |
| `auth.action.continue` · `auth.action.login` · `auth.action.register` · `auth.action.redeem` · `auth.action.change` | 按钮与链接 |
| `auth.action.resend` · `auth.action.resendIn` | 重发与倒计时（带秒数插值） |
| `auth.provider.continueWith` | 第三方按钮（带提供方名插值） |
| `auth.remember` · `auth.forgotPassword` | 登录选项 |
| `auth.terms.prefix` · `auth.terms.service` · `auth.terms.and` · `auth.terms.privacy` | 条款一行 |
| `auth.notice.registered` | 注册成功但未自动登录时的提示 |
| `auth.switch.toRegister` · `auth.switch.toLogin` | 卡片下方的互相跳转 |
| `auth.welcome.docTitle` · `title` · `lead` · `continue` | 欢迎页的标题、说明与主操作 |
| `auth.welcome.userId` · `account` · `name` · `email` | 欢迎页里用户信息的四个字段名 |

服务端失败的文案不在这个包里：它来自 `app/src/locales` 的 `data.error.<码>`。

## 10. 用例

**单元**（`login.test.tsx`，接口用 mock）：入口配置未取回时给加载态；账号为空时按钮禁用；账号无效时字段出错误；
验证码按配置出现；条款未勾时提示且不提交；提交账号后进入密码步并聚焦密码框；`status = register` 时出确认密码与口令；
口令按 `verification_code_required` 决定出现；两次密码不一致时不提交并出错误；提交成功后 `signIn` 被调用且跳转目标正确；
失败时文案来自语言包（不出现服务端原文）；点「修改」回到第一步并清空密码；重发倒计时内按钮禁用；
`invite_verification_required` 时进入邀请码步；邀请码兑换成功后跳转。

**组件**（各自目录）：`auth-layout` 的两种 `mode` 与显隐、`auth-provider` 的状态流转、`password-input` 的可见性切换、
`provider-list` 的渲染与回调、`status-notice` 的两种色调、`terms-note` 的勾选与错误。

**浏览器**（`tests/login.browser.ts`）：真实渲染下从账号走到密码步，断言按钮文案与字段出现；
一条失败码走查，断言文案是四语里的那一句而不是服务端原文；键盘走一遍（Tab 到提交、回车提交）。

## 11. 验收与门禁

1. `pnpm lint` · `pnpm check` · `pnpm test` · `pnpm test:browser` · `pnpm build` 全绿；四语齐备（`check-i18n` 与 `build:i18n`）。
2. 页面内没有裸 `<button>` 与 `<select>`，没有 `fetch`，颜色与间距不写字面值。
3. 对照 [`07-design-review-entry.md`](07-design-review-entry.md)：本页范围内要清掉「注册页状态覆盖为空」与「标题 `aria-labelledby` 指向不存在的 id」两条。
4. 交付前跑 `pnpm test:all` 并执行拟人层，截图附给交付对象。

## 12. 未决

1. **邀请码的位置**：本页先做第三步，与 1.0 的独立页不同；是否改回独立页待定。
2. **联合状态页面**：`mfa_required` 与 `team_selection_required` 按入口配置声明与否决定做不做。
3. **`?redirect=` 参数**：1.0 支持并把目标写进 Cookie；我们是否支持、由谁写、要不要落到 `success_url` 之前，待定。
4. **第三方提供方的标记来源**：`SigninProvider.logo` 是一个图片地址，界面按地址渲染图片；没有地址时用哪一个通用图标待定。

## 13. 实现结果（2026-10-07）

登录页已落地，与它共用的外壳、域状态与四个页面内部件同时到位。

| 位置 | 内容 |
| --- | --- |
| `features/auth/login/` | 页面本体、样式、单元用例与出口 |
| `features/auth/components/auth-layout/` | 外壳：品牌、语言与主题两个全局控件、卡片、页脚、客户端栏 |
| `features/auth/components/auth-provider/` | 域状态与成功收尾（验签、采纳会话、跳转） |
| `features/auth/components/password-input/` · `provider-list/` · `status-notice/` · `terms-note/` | 可见性切换、第三方入口、页面级提示、条款勾选 |
| `features/auth/id-token.ts` | ID Token 本地验签，只认 RS256；用例里的密钥对现生成 |
| `features/auth/locales/` | 四语各 41 键 |
| `features/auth/tests/login.browser.ts` | 真实渲染 7 例：活体配置与验证码、语言换内容、失败按码翻译、注册分支走到口令、客户端内形态、键盘、边界对比度 |
| `routes/routes.tsx` | 无路径布局路由只提供 `AuthProvider`，`/login`、`/register` 与 `/auth/back/:provider` 挂在表面布局之外 |

与本文档原先写法的差异：

| 原写法 | 实际实现 | 依据 |
| --- | --- | --- |
| 外壳作无路径布局路由的元素 | 布局路由只提供 `AuthProvider`，外壳是页面各自使用的组件 | 卡片的标题与说明来自各页面，外壳拿不到；这样不必给卡片再开一个插槽 |
| 动作都住在 `AuthProvider` | 写请求由页面发，域只接住结果并做成功收尾 | 域层的写声明在创建时把入参闭包住了（`data/user/queries.ts`），页面拿着当前值构建声明最直接 |
| `StatusNotice` 收错误码 | 收已翻译的文案，失败取 `failure.text` | 取数层已按码翻好，页面不必再翻一次 |

条件落地与限制：

| 项 | 现状 |
| --- | --- |
| 「去注册」与「忘记密码」两条链接 | 登录页不渲染：注册页与忘记密码页还没有路由，指过去会落到兜底重定向 |
| 邀请码步 | 已实现，但开发服务的入口配置没有声明 `invite_required`，未做活体走查 |
| 联合状态 | 收到 `mfa_required` 或 `team_selection_required` 时给一条提示，不跳页 |
| 服务端错误码的字段级映射 | 服务端失败一律走 `StatusNotice`，字段级错误只来自本地校验；映射等错误码清单齐了再补 |

验签的判定：只在入口配置声明了安全 Cookie（`secure_cookie` 不为假）且平台有 WebCrypto 时才做。开发服务给的是
`secure_cookie: false`，该环境因此跳过验签，并且不把未验签的结果当成已验证；一旦验签不通过就拦住，不进凭据库。

实测（证据在 `app/logs/2026-10-07/`）：入口页字段的静止边界浅色 3.45:1（rgb(141,138,128) 对白底）、
暗色 3.74:1（rgb(124,119,107) 对 rgb(31,30,26)），都过控件边界要求的 3:1；语言切换后提交按钮由「继续」变「Continue」；
失败路径的提示是语言包的「请求不合法」，不含服务端原文。

活体走查用 `data/test` 的两个测试接口：图形验证码的答案按 `captcha_id` 从 `GET /test/captcha` 读到，
因此第一步的判定走的是真实服务而不是打桩（用例 `walks the first step against the live service with the captcha
read from the test interface`，实测拿到 `status = register`、`verification_sent = true` 与真实的 `otp_id`）。
需要真实服务的用例先探入口配置，探不到就整条跳过，因此在只起前端的 CI 里不会判为失败。

邮件与短信的一次性口令**取不到**：`data/test` 的 `readOtp` 走 `GET /test/otp?code=…`，而后端那条接口的 `code`
是口令本身（按口令查它自己的状态），入口一线发出的口令存在另一处存储里，没有对外路由。因此注册最后一步的
验证码要由收件人从邮箱或短信取，自动化只覆盖到「请求体带上 `otp_id` 与 `verification_code`」这一层。

## 14. 后续逻辑：后续两步进弹窗，账号不存在去注册（2026-10-07）

形态改为：**账号留在页面上，后续两步在弹窗里**，账号不存在时**跳注册**。

| 动作 | 现在的行为 |
| --- | --- |
| 点「下一步」 | 校验账号与条款；入口配置要求验证码（`form.captcha.type` 为 `image` 或 `turnstile`）时弹窗收，不要求就直接判定 |
| 提交验证码 | 带 `captcha` 调 `entryVerify`，图形验证码还要 `captcha_id`；失败按错误码翻译后显示在**弹窗内**（模态打开时背景被标成 `aria-hidden`，页面上的提示读不到） |
| 判定为存在（`user_exists` 且 `status === 'login'`） | 弹窗转到密码步：账号只读加「修改」、密码框、记住我（配置声明时）；确认后调 `entryLogin`，邀请码与多因素分支照旧 |
| 判定为不存在 | 带账号跳 `/register?username=…`，注册页把账号显示出来，接着填密码与条款 |
| 「修改」/关闭弹窗 | 回到账号步并清空密码与已触碰状态 |

弹窗用基础件 `DialogPage`：宽度取 `--dialog-width`（480），遮罩 `--scrim`，圆角 `--radius-large`，底部操作右对齐，
动效取 `modal` 场景；底部的主按钮用 `form` 属性关联到弹窗内的表单。文案新增
`auth.dialog.*` · `auth.action.cancel` · `auth.captcha.*` · `auth.error.captchaRequired` · `auth.register.*`，四语齐备。

与本文档上文的差异：

| 上文写法 | 现在的实现 | 依据 |
| --- | --- | --- |
| 密码与邀请码都是**页面上的步骤**（`phase` 驱动显隐） | 密码步在弹窗里，邀请码步仍在页面上 | 弹窗承载「判定后的一次交互」，页面始终显示账号步，关闭弹窗即回来 |
| 注册在本页走「确认密码 + 一次性口令」 | 登录页不再有注册分支，账号不存在即跳注册页 | 注册是独立页面（见 `plan/06-login-features.md`），登录页只负责判定与登录 |
| 「去注册」链接与「账号不存在」跳转的落地页 | 注册页已完成：账号步、密码与确认密码、条款、邀请码步（见 [`06-login-features.md`](06-login-features.md) §11）|
| 条款勾选在账号步（草稿如此） | 移到注册页 | 同意条款属于注册行为，回头登录的人不必再同意一次 |

`features/auth/register/` 是注册页，`/register` 与 `/login` 挂在同一个只提供 `AuthProvider` 的布局路由下。
条款与隐私政策的勾选、两个链接与错误态都在注册页上，登录页的判定不再以它为条件；草图的 `login.html` 同步删掉了这一块与它的事件处理。

实测（`app/logs/2026-10-07/shots/`）：

| 用例 | 读数 |
| --- | --- |
| `opens the password step in the dialog for an account that exists, drawn from the tokens` | 弹窗标题「输入登录密码」、账号只读、`修改` 与`记住我`在框内；面板宽 = `--dialog-width`、遮罩 = `--scrim`、圆角 = `--radius-large`、底部 `justify-content: flex-end` |
| `sends an account that does not exist to the register form with the account in the query` | 跳到 `/app/register?username=new-user%40example.com`，注册页显示该账号 |
| `walks the first step against the live service with the captcha read from the test interface` | 进入页面不取图；点「下一步」后弹窗标题「输入图形验证码」；答案从 `GET /test/captcha` 读到并回填；真实判定 `status = register`，随后跳到注册通道 |

单元用例 13 例（登录页 10 · 注册页 3），浏览器用例 9 例。

## 15. 实现结果（2026-10-09）

客户端内模式与服务器选择页接入后，登录页这一侧收口到下面的规则。

| 项 | 现在的行为 |
| --- | --- |
| 页面形态 | 由 `useAuthMode()` 一处判定并显式传给外壳：客户端内（`capabilities().serviceAddress` 为真）一律 `in-app`，Web 只在地址带 `from=connect` 时是；页面之间的链接与跳转过 `withMode()` 带上标记 |
| 客户端栏 | 左侧返回入口写死 `navigate('/servers')`；右侧是所选服务器的名字，取本机记录（自建那格显示「自建」，没有记录退回地址），Web 取服务信息里的名字 |
| 换服务器 | 服务器选择页连接成功即 `invalidate(userKeys.all)`，本页按新地址重取入口配置 |
| 入口配置取不到 | 失败（有错或非 2xx）给失败态与「重试」；一直不返回时仍停在加载态（取数没有超时，见 §7 末段） |
| 验证码弹窗 | 两种形态都支持；打开时的焦点按 §8 第 6 条 |
| 服务器选择页 | 只列官方清单与自建地址，连接结果由宿主校验并落盘；桌面没地址时首屏导到该页（`needsServerChoice()`） |

桌面壳里逐屏实跑（壳读 `dist-client`，实例入口声明 `turnstile`，验证码是官方 dummy 密钥）：`/servers` 选自建 `https://service.example.com` → 连接 → `/login`（客户端形态，客户端栏「自建」）→ 注册（弹窗验证码 → 密码步 → 创建账号）→ `/welcome` → 删掉会话后同一路径登录 → `/welcome`；「继续」按 `06-login-features.md` §10 第 6 条落到应用首页。客户端栏在两种形态、两种语言下都与原型一致；人机验证弹窗打开后焦点留在页面上，关闭钮没有焦点框。

限制：客户端内的第三方入口只走到提供方报错页（同 §7 末段与 `06-login-features.md` §10 第 7 条）；服务器选择页的连接失败、空清单两态由单元用例覆盖，未在壳里逐态实跑。
