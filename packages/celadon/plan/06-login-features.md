# 06-login-features · 页面与页面内部件（2026-10-07）

- **规则**：[`../architecture/03-boundaries.md`](../architecture/03-boundaries.md) §3（落位）·
  [`../architecture/07-routing.md`](../architecture/07-routing.md)（路由与外壳）·
  [`../architecture/15-platform.md`](../architecture/15-platform.md)（宿主差异与能力开关）·
  [`../architecture/14-testing.md`](../architecture/14-testing.md)（测试分层）
- **上游**：[`06-login.md`](06-login.md) §3（页面与流程）· [`06-login-components.md`](06-login-components.md)（基础件与验收规矩）
- **界面参考**：`design/prototype/login.html` · `register.html` · `servers.html`（占位演示，细节随实现推进）
- **范围**：登录、注册、服务器选择三个页面的外壳、域状态、目录结构、页面内部件与客户端内模式
- **计划不是规范**：规则只写在 `architecture/`，本文只列待办与判据

## 1. 一句话

三个页面共用两层：一层 `AuthLayout` 画外壳，一层 `AuthProvider` 持域状态。页面只填卡片里的内容，
外壳与流程状态不在页面里各写一遍。客户端内模式是这层外壳的一个变体，不是第二套页面。

## 2. 原型的公共骨架（清点结论）

三个原型的骨架一致：`.page` 是全高的列容器，内距 `--spacing-16` 与 `--spacing-24`；
`.card` 居中，宽 `min(100%, 480px)`，内距 `--spacing-32` 与 `--spacing-24`。
登录与注册的区别只在卡片内容与卡片下方那句链接；服务器选择页把全局控件放在卡片之后。

| 元素 | 内容 | 归属 |
| --- | --- | --- |
| `.brand` | 标记（32）与名称 | 外壳 |
| `.ctrl` | 语言控件（当前语言名 + 地球）与主题控件（方形图标按钮），两者之间一条分隔线 | 外壳 |
| `.menu` | 语言选项弹层（五档，含跟随系统） | 外壳，用现成的 `LocaleSwitch` 与 `ThemeToggle` |
| `.card` | 居中的卡片，含标题与表单 | 外壳给容器，页面给内容 |
| `.title` | 卡片标题，原型里分两行 | 页面 |
| `form` | 账号、密码、确认密码、邀请码、验证码、一次性口令、勾选项与提交 | 页面 |
| `.footnote` | 卡片下方一句链接（去注册 / 去登录） | 页面 |
| `.bottom` | 页脚的条款与隐私链接 | 外壳 |

原型里 `--auth-card: 480px` 与 `--brand-mark: 32px` 是页面局部变量，注释写明进产品时归 token；
实现时把卡片宽度并入 `design/tokens.less` 的尺寸定义，组件内不写像素值。

### 2.1 客户端内模式（原型已有的变体）

原型用 `?from=connect` 点亮 `body.is-client`，从客户端里跳进来的那一次才生效，独立页不生效。
该模式下：不显示品牌区、条款勾选与页脚；两个全局控件移到卡片下方居中；语言弹层向上展开；
卡片上方出现一条客户端栏，含返回服务器选择的入口与当前服务器名。服务器选择页在同一次会话里就是它的返回目标。

## 3. 外壳与域状态：两层都要（结论）

三个页面重复的是外壳与流程状态，不是内容。因此做两层，都落在 `features/auth/components/`（feature 私有组件的位置，
见 `architecture/03-boundaries.md` §3；`parts/` 只用于单个组件目录内部拆零件）：

| 组件 | 目录 | 职责 | 不做 |
| --- | --- | --- | --- |
| `AuthLayout` | `features/auth/components/auth-layout/` | 路由布局（无路径），画 `.page` 外壳、品牌、两个全局控件、卡片容器、页脚与客户端栏，出口是 `<Outlet />` | 不持有业务流程，不调接口 |
| `AuthProvider` | `features/auth/components/auth-provider/` | 域状态与域动作：入口配置、临时令牌与判定结果、两页之间要带的用户名、当前服务信息、登录成功后的采纳；对外是 `useAuth()` | 不画界面，不管表单字段 |

`AuthLayout` 不复用既有的两件，理由写在判据里：`routes/surface-layout.tsx` 是应用导航的外壳（应用页面住在主区里），
`components/page/` 是应用页的内容原语（段落、行、格子），两者都没有品牌、全局控件、卡片与页脚。

| `AuthLayout` 的输入 | 取值 | 说明 |
| --- | --- | --- |
| `mode` | `'standalone'` · `'in-app'` | 独立访问或从客户端里跳进来；决定品牌、条款、页脚与客户端栏的显隐，以及控件的位置 |
| `title` | `string` | 卡片标题，四语由调用方给 |
| `description` | `string` | 标题下的一句说明，可省略 |
| `serverName` | `string` | 客户端栏里的当前服务器名，`in-app` 时用 |
| `onBack` | `() => void` | 客户端栏返回服务器选择，`in-app` 时用 |

## 4. 客户端内与 Web 的差异（结论）

差异只在平台层消化，页面不判宿主：需要宿主能力时问 `capabilities()`，需要凭据时用 `platform/credential`。

| 项 | Web | 客户端内 | 依据 | 页面怎么处理 |
| --- | --- | --- | --- | --- |
| 服务地址 | 构建期与服务端决定，页面不可写 | 用户可填、跨重启保留 | `capabilities().serviceAddress` | `/servers` 在 Web 只读展示当前地址并说明由部署决定，不画写入控件 |
| 凭据载体 | 服务端下发的 HttpOnly Cookie，脚本不碰 | OS 凭据库，经 `bridge` | `credentialCarrier()` 与 `credential.managedByApp()` | 成功后统一调 `signIn(响应体)`，Web 上是空操作，页面不判载体 |
| 第三方登录 | 当前窗口整页跳转 | 同 Web：当前窗口整页跳转 | `platform/client/open-external.ts` | `ProviderList` 只发动作，跳转走平台面孔，不另开窗口 |
| 品牌区 | 显示 | 收起 | 原型的 `is-client` 规则 | `AuthLayout` 的 `mode` 变体 |
| 条款与页脚 | 显示 | 收起 | 同上 | 同上 |
| 全局控件位置 | 页面右上角 | 卡片下方居中 | 同上 | 同上 |
| 剪贴板与通知 | 特性探测 | 宿主提供 | `capabilities().clipboard` · `notifications` | 本轮不涉及；口令粘贴用原生粘贴事件 |

`mode` 的来源：外壳显式告知（等价于原型的 `?from=connect`），页面不嗅探宿主。
**未决**：`capabilities()` 目前没有「运行在宿主内」这一项开关，是否补一个（例如 `hosted`）待定；
在那之前 `mode` 由外壳传，`AuthLayout` 只认这一个输入。

## 5. 路由与页面架构

### 5.1 路由表

这些页面挂在同一个**无路径布局路由**下（`routes.tsx` 的 `authRoutes` 里，路径在构建决定的 base 之下），
不用应用外壳 `SurfaceLayout`，也不带应用导航。

| 路径 | 页面 | 说明 |
| --- | --- | --- |
| `/login` | `features/auth/login/` | 单页多步：第三方入口、账号、密码、一次性口令、邀请码与条款勾选；`entryVerify` 之后按判定结果切换 |
| `/register` | `features/auth/register/` | 账号、密码、确认密码、邀请码与条款勾选；与登录页共用字段组件，跳转时带用户名 |
| `/auth/back/:provider` | `features/auth/back/` | 第三方登录的回跳页：读地址里的 `code` 与 `state` 调 `oauthCallback`，再按状态回登录页或走成功收尾 |
| `/welcome` | `features/auth/welcome/` | 登录成功后的第一站（占位）：展示本次会话的用户信息，点「继续」走入口配置的成功地址；按用户信息分流随后接在这里 |
| `/servers` | `features/auth/servers/` | 云服务器列表（异步）、手填地址、连接；客户端内模式下是登录页返回的目标 |
| 兜底 | 既有的 `*` 重定向到 `/` | 不变 |

### 5.2 登录页的步骤与取值

判定发生在 `entryVerify` 之后，因此登录与注册是两个页面共用的第一步；下表是登录页内的分支。

| 步骤 | 触发 | 调用 | 结果 |
| --- | --- | --- | --- |
| 输入账号 | 提交 | `entryVerify` | `status = login` 进密码步；`status = register` 提示去注册页并带上用户名 |
| 图形验证码 | 账号步之前 | 由 `captcha-field` 自己取图 | 输入与 `captcha_id` 一起随 `entryVerify` 回传 |
| 密码 | 提交 | `entryLogin` | `EntryAuthResponse`，成功时采纳会话并跳 `/welcome`（见 `06-login-features-login.md` §7.1），成功地址由欢迎页接手 |
| 一次性口令 | 服务端要求时 | `entryOtp` 重发；`register` 或 `login` 带 `verification_code` | 注册需要验证码由 `verification_code_required` 决定 |
| 邀请码 | 判定或状态要求时 | `entryInvite` | 成功后直接得到 `EntryAuthResponse` |
| 第三方 | 点提供方 | `oauthAuthorize` | 跳授权地址；回调回到应用后走 `oauthCallback` |
| 设备码 | 客户端内且没有浏览器时 | `deviceFlowStart` · `deviceAuthorize` · `deviceFlowToken` | 轮询取令牌（数据层已备，登录页尚未接入，见 `06-login-features-login.md` §7） |
| 联合状态 | `LoginStatus` 声明时 | 按草图补页面 | `ok` · `mfa_required` · `team_selection_required` · `invite_required` · `invite_verification_required` |
| 失败 | 任意一步 | 页内提示（字段级错误挂字段，其余挂页面级提示） | 文案按错误码取，取自语言包；入口配置的 `failure_url` 尚未接入 |
| 自动登录 | 配置 `auto_login` 为真时注册响应带 `id_token` | 注册成功即可采纳会话 | 不带 `id_token` 时是「注册成功但未登录」，回到第一步给一条提示 |

三个页面共用一个域，先把登录页做出来，共用件（外壳、域状态与四个页面内部件）随之落地：
具体到字段、状态、动作与用例的实现见 [`06-login-features-login.md`](06-login-features-login.md)。
登录页与共用件**已完成**（2026-10-07）：外壳 `AuthLayout`、`AuthProvider`、`PasswordInput`、`ProviderList`、
`StatusNotice`、`TermsNote` 与登录页都在 `features/auth/` 下，路由是 `routes/routes.tsx` 里的无路径布局路由。
注册页**已完成**（2026-10-08，见 §11）；服务器选择页仍待做。

### 5.3 状态归属

| 状态 | 归属 | 说明 |
| --- | --- | --- |
| 入口配置 `entryConfig` | `AuthProvider` | 一次取回，三个页面共用；标题与说明也用它的 |
| 临时令牌与判定结果 | `AuthProvider` | 只在请求头里用一次，不进凭据库 |
| 用户名 | `AuthProvider` | 登录与注册之间跳转时保留 |
| 当前服务信息与服务地址 | `AuthProvider`（读 `platform/service`） | 客户端栏显示名字；换地址后作废页面上的旧结果 |
| 表单字段与勾选 | 页面 | 各页自己的账号、密码、验证码、条款勾选 |
| 会话采纳 | `AuthProvider` 在成功后调 `signIn` | Web 上是空操作，客户端写 OS 凭据库 |

## 6. 目录结构

```
features/auth/
├── locales/                     zh-CN.json · zh-TW.json · en-US.json · ja.json（四语齐备）
├── tests/                       login.browser.ts · register.browser.ts · servers.browser.ts · entry-flow.agent.md + .agent.mjs
├── login/                       login.tsx · login.less · login.test.tsx · index.ts
├── register/                    register.tsx · register.less · register.test.tsx · index.ts
├── servers/                     servers.tsx · servers.less · servers.test.tsx · index.ts
└── components/                  feature 私有组件，逐个成目录
    ├── auth-layout/             auth-layout.tsx · auth-layout.less · auth-layout.test.tsx · index.ts
    ├── auth-provider/           auth-provider.tsx · auth-context.ts · auth-provider.test.tsx · index.ts
    ├── captcha-dialog/          captcha-dialog.tsx · captcha-dialog.less · captcha-dialog.test.tsx · index.ts
    ├── password-input/          password-input.tsx · password-input.test.tsx · index.ts
    ├── provider-list/           provider-list.tsx · provider-list.less · provider-list.test.tsx · index.ts
    ├── client-hint/             client-hint.tsx · client-hint.test.tsx · index.ts
    ├── status-notice/           status-notice.tsx · status-notice.less · status-notice.test.tsx · index.ts
    ├── server-list/             server-list.tsx · server-list.test.tsx · index.ts
    └── terms-note/              terms-note.tsx · terms-note.test.tsx · index.ts
```

约定：单元用例与源文件同目录；浏览器与拟人用例在 `features/auth/tests/`；文案放 `features/auth/locales/`，
四语齐备，代码里不出现硬编码文案；feature 私有组件不出 `features/auth/components/`；
样式只在需要布局时才加 `.less`，颜色、间距、字号一律取 token。

## 7. 组件清单

页面内部件留在 feature 里，因为它们认识登录流程（出现业务名词与接口字段）。界面控件一律取自 `components/base/`。

| 组件 | 目录 | 输入 | 职责 | 复用与依据 |
| --- | --- | --- | --- | --- |
| `AuthLayout` | `components/auth-layout/` | `mode` · `title` · `description` · `serverName` · `onBack` | 外壳：品牌、两个全局控件、卡片容器、页脚、客户端栏，出口 `<Outlet />` | 品牌用 `brand-mark`，控件用 `theme-toggle` 与 `locale-switch` |
| `AuthProvider` | `components/auth-provider/` | `children` | 域状态与域动作，`useAuth()` 对外 | 接口取 `data/user` 的查询包装 |
| `PasswordInput` | `components/password-input/` | `id` · `label` · `value` · `onValueChange` · `error` · `autoComplete` · `disabled` | 密码输入加可见性切换，登录与注册共用 | `input` 的 `type="password"` 加 `trailing` 槽位 |
| `ProviderList` | `components/provider-list/` | `providers` · `onPick` · `pending` | 第三方入口，按 `entryConfig.third_party.providers` 渲染 | 提供方形状 `{id, label, title, logo?}`；按钮用 `button` |
| `ClientHint` | `components/client-hint/` | `mode` · `onOpenInBrowser` · `onUseDeviceCode` | 客户端内提示回到浏览器或改用设备码 | 依据 `capabilities().externalOpen` |
| `StatusNotice` | `components/status-notice/` | `code` · `onRetry` | 页面级状态提示，文案按错误码取 | 不做瞬态通知（上游 `toast` 留待真实需求） |
| `ServerList` | `components/server-list/` | `servers` · `value` · `onValueChange` · `state` | 云服务器列表：加载中、失败与重试、选中项 | 富选项复用 `select`（标记、名称、地址第二行） |
| `TermsNote` | `components/terms-note/` | `checked` · `onCheckedChange` · `error` · `links` | 条款勾选与链接，登录与注册共用 | `checkbox`；链接地址取 `entryConfig.form` 的两条 |

页面本身不是组件：它持有表单状态、调域动作，并把界面交给上面这些件渲染。

## 8. 页面级判据

1. 三个页面都用 `AuthLayout`，没有一处自己画品牌、全局控件或页脚；`mode` 的两种取值都有界面与用例。
2. 三个页面都从 `useAuth()` 取入口配置与临时令牌，页面之间不通过地址栏传令牌。
3. 页面内不出现裸 `<button>` 与 `<select>`（`check-base-components` 拦），不出现 `fetch`（只有 `transport/` 能对外通信）。
4. 登录与注册之间跳转保留用户名；语言切换后文案立即更新且已输入内容不丢。
5. 客户端内的差异只体现在 `mode` 与能力开关上，页面代码里没有宿主判断。

### 8.1 原型已记录的 24 条问题怎么归

[`07-design-review-entry.md`](07-design-review-entry.md) 对三个原型记了 24 条（阻塞 2 · 重要 9 · 次要 11 · 建议 2），
实现时逐条核对。其中一部分由现行件直接解决，另一部分仍是页面与设计的事：

| 复核项 | 现在的归属 | 依据 |
| --- | --- | --- |
| 焦点环不统一 | 已由现行件解决：基础件的聚焦一律画 `--focus-ring` | 各基础件的状态规则 |
| 语言项把 `system` 这类技术词显示到界面 | 已由现行件解决：选项显示的是解析出的语言名（跟随系统一项带当前语言） | `locale-switch` |
| 选择器浮层的键盘与遮挡 | 已由现行件解决：键盘可达、选项整行取整、滚动箭头不压选项；实现时用 `select` 而不是原型的自绘层 | `select` 的用例与文档 |
| 注册页没有错误、加载与成功态 | 页面的事：字段错误取调用方的 `error`，提交中给加载态 | 本册 §7 与 §9 |
| 标题的 `aria-labelledby` 指向不存在的 id | 页面的事：`AuthLayout` 的标题与卡片按同一个 id 关联 | 本册 §3 |
| 输入框的控件边界对比度 | **待定夺**：复选框的未选中边界已取达标档（实测 3.45:1 与 3.74:1），输入框的字段边界仍是 1.54:1 与 1.67:1，属已记录的豁免 | 基础件文档与状态实测 |

## 9. 验收

| 层 | 内容 |
| --- | --- |
| 单元 | `AuthLayout` 两种 `mode` 的显隐与控件位置；`AuthProvider` 的判定两个分支与成功后采纳；`PasswordInput` 的可见性切换；`ProviderList` 的渲染与回调；`ServerList` 的三态；`TermsNote` 的勾选与错误 |
| 浏览器 | 三页各一条关键路径（`features/auth/tests/*.browser.ts`）；客户端内模式一条，量与 `mode` 相关的显隐与控件位置 |
| 拟人 | 一条入口流程采集（`features/auth/tests/entry-flow.agent.md` + `.agent.mjs`），交付前附截图 |
| 文案 | 四语齐备，`check-i18n` 与 `build:i18n` 通过 |
| 门禁 | `pnpm lint` · `pnpm check` · `pnpm test` · `pnpm test:browser` · `pnpm build` · `pnpm test:persona` 全绿 |

## 10. 未决

1. **「在宿主内」的能力开关**：`capabilities()` 目前没有这一项，`mode` 暂由外壳传；是否补一个待定。
2. **人机验证 `turnstile`**：`form.captcha.type` 可为 `image` 或 `turnstile`。本轮先做 `image`（现成 `captcha-field`）；
   `turnstile` 需要第三方脚本与站点密钥，是否做、做到什么程度待定。
3. **联合状态页面**：`mfa_required` 与 `team_selection_required` 按入口配置声明与否决定做不做。
4. **邀请码的位置**：独立一步或独立页面，按草图的邀请码页文案（配置里的 `invite`）定。
5. **云服务器列表的来源**：1.0 里由桌面壳异步取回；本仓要不要拉、拉哪个接口待定，本轮先按「传入列表 + 手填地址」实现。

## 11. 实现结果（2026-10-08）

注册页已落地，与登录页共用外壳、域状态、基础件与文案包；验证码弹窗抽成共用件。

| 位置 | 内容 |
| --- | --- |
| `features/auth/register/` | 页面本体、样式、单元用例与出口 |
| `features/auth/components/captcha-dialog/` | 验证码弹窗（图形与人机两种形态），登录与注册共用 |
| `features/auth/account.ts` | 账号形态判定，两个页面的账号步共用 |
| `features/auth/locales/` | 四语各 61 键（新增 `auth.register.exists`，去掉通道版的 `auth.register.pending`） |
| `features/auth/tests/register.browser.ts` | 真实渲染 5 例：注册表单、口令不一致、注册后回登录、语言换内容、活体验证码弹窗 |

与本文档原写法的差异：

| 原写法 | 实际实现 | 依据 |
| --- | --- | --- |
| 三个页面共用「第一步」 | 第一步没有整体抽成组件：登录页与注册页各写账号步，验证码弹窗抽成 `captcha-dialog` 共用 | 账号步判定后的去向两页不同（进密码步或跳注册），先共用其中确定相同的一块 |
| 注册页有「邀请码」输入框（草图） | 表单里没有邀请码输入：`EntryRegisterRequest` 没有这个字段；服务端要求时按 `invite_required` 进页内邀请码步，由 `entryInvite` 兑换 | `data/user/types.ts` |
| 注册成功一律采纳会话 | 响应带 `id_token` 才采纳；不带时回登录页并给「注册成功，请登录」 | §5.2 自动登录一行 |
| 账号输入框用邮件类型 | 用 `type="text"` 与 `autocomplete="username"`：账号可以是邮箱或手机号，`type="email"` 会让手机号过不了浏览器约束校验 | `features/auth/account.ts` 的账号形态判定 |
| 密码与确认密码之间按字段档留白 | 两个密码框作为一组（`.register__password-pair`）：两个输入框之间与账号到密码取同一档（实测都是 16）。第一个字段的消息位绝对定位落在这一档里，出错时间距不变、确认密码与下面内容不动 | `register.less` 与 `register.browser.ts` 的用例实测 |
| 客户端内第三方登录交系统浏览器打开，或改走设备码 | 与 Web 同一套：在当前窗口整页跳转（`platform/client/open-external.ts`），不另开窗口；`systemBrowser` 能力与宿主开浏览器命令不再用于这条路径 | 跳转发生在当前页 |

限制：一次性口令的活体走查仍取不到（口令发给收件人，接口读不到），自动化只覆盖到请求体带上 `otp_id` 与 `verification_code`；服务器选择页未做；`mode` 的能力开关与联合状态页仍按 §10。
