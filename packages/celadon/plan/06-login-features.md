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

原型用 `?from=connect` 点亮 `body.is-client`。当前规则：**客户端内一律是这个形态**（`capabilities().serviceAddress` 为真就是客户端），Web 只有地址带 `from` 时才是，后者等同于原型的预览入口。
该模式下：不显示品牌区、条款勾选与页脚；两个全局控件移到卡片下方居中；语言弹层向上展开；
卡片上方出现一条客户端栏，返回入口**指向选服务器页**（写死路由，不用浏览历史），当前服务器名取本机记录（见 §5.4）。

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

`mode` 的来源：由 `useAuthMode()` 在一处判定，再显式传给 `AuthLayout`，外壳只认这一个输入，页面不嗅探宿主。**客户端内一律 `in-app`**：`capabilities().serviceAddress` 为真（有宿主、地址由用户选）就是客户端，地址上没有 `from` 也一样，否则桌面用户会看到 Web 的品牌区与页脚。Web 只有地址带 `from` 时才是 `in-app`，这是原型 `?from=connect` 给出的预览入口。登录与注册之间的真链接与跳转用 `withMode()` 把 `from` 带上，形态跟着链接走；选服务器页固定 `standalone`（它就是客户端栏的返回目标）。
**未决**：是否补一个专门的「运行在宿主内」能力开关（当前借 `serviceAddress` 表达同一件事）待定。

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
| `/servers` | `features/auth/servers/` | 云服务器列表（异步）、手填地址、连接；连接由宿主导校验并落盘（见 §5.4） |
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
注册页**已完成**（2026-10-08，见 §11）；服务器选择页已落地（2026-10-09，见 §5.4 与 §11）。

### 5.3 状态归属

| 状态 | 归属 | 说明 |
| --- | --- | --- |
| 入口配置 `entryConfig` | `AuthProvider` | 一次取回，三个页面共用；标题与说明也用它的 |
| 临时令牌与判定结果 | `AuthProvider` | 只在请求头里用一次，不进凭据库 |
| 用户名 | `AuthProvider` | 登录与注册之间跳转时保留 |
| 当前服务信息与服务地址 | `AuthProvider`（读 `platform/service`） | 客户端栏显示名字；换地址后作废页面上的旧结果 |
| 表单字段与勾选 | 页面 | 各页自己的账号、密码、验证码、条款勾选 |
| 会话采纳 | `AuthProvider` 在成功后调 `signIn` | Web 上是空操作，客户端写 OS 凭据库 |

### 5.4 服务器选择页（结论）

客户端内特有。Web 上地址由部署决定，页面只读展示当前地址，不画写入控件。

| 项 | 结论 | 依据 |
| --- | --- | --- |
| 路由 | `/servers`，与登录、注册同在入口页的无路径布局路由下 | §5.1 |
| 官方清单 | `POST {portal}/v1/__yao/sui/v1/run/servers`，体 `{ method: 'ServerList', args: [locale] }`；门户基址按语言取 `https://yaoagents.cn`（简繁中文）或 `https://yaoagents.com`（其余） | 按 1.0 的门户接口 |
| 清单的取数位置 | `platform/portal/`，用出口 `transportFetch` 直发绝对地址：桌面由宿主代发，浏览器被出口的同源判定拒绝 | 引擎接口走 `data/`，门户不是引擎 |
| 自建 | 手填完整地址（含协议） | 原型 |
| 连接与校验 | `writeServiceAddress(url)` → 宿主 `celadon_service_set` 先取 `<url>/.well-known/yao` 校验，通过才落盘；失败回可读原因 | `plan/01-bridge-commands.md` §2 |
| 换地址后的旧数据 | 连接成功后作废 `user` 域的全部取数（`invalidate(userKeys.all)`），登录页按新地址重取入口配置与验签公钥 | 查询 key 不含基址，换服务必须显式失效 |
| 本机记录 | 应用自己管：连接成功与登录成功各记一次 `{ url, label?, lastConnected }` 到 `localStorage` 的 `celadon.servers`（最近 8 条，不给名字时保留原有的）；云条目记清单里的显示名，自建那格不记名字。选服务器页用它预选，清单里没有就回填到自建那一格；客户端栏的服务器名也取它（没有名字就是「自建」，一条记录都没有就退回地址） | `features/auth/server-history.ts` · `use-server-name.ts` |
| 状态 | 清单加载中 · 失败（带重试）· 空 · 就绪（选择器展开 / 自建地址 / 连接中 / 连接失败） | 原型与设计红线 |
| 选择器清空 | 选择器允许把选中项清掉（再点已选项），本页把空值当成"没有变更"、保持原选中：这一页永远得有一项 | 连接要靠它决定去哪个服务 |
| 连上之后 | 进 `/login?from=connect` | 原型 |

与原型不同的两处：清单为空时仍给出自建地址与连接（原型此时是死路）；选择器直接用基础件 `select` 的富选项，不自画列表。

桌面首次进入（宿主还没有地址）时不报错，先去 `/servers`：入口在装填客户端事实之后读一次宿主地址，`needsServerChoice()` 为真就把地址换成选服务器页（`main.tsx`）。

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
2. **人机验证 `turnstile`**：`form.captcha.type` 可为 `image` 或 `turnstile`，两种形态都已实现（`components/base/turnstile-field` 与 `captcha-field`，弹窗按配置选一个）。
3. **联合状态页面**：`mfa_required` 与 `team_selection_required` 按入口配置声明与否决定做不做。
4. **邀请码的位置**：独立一步或独立页面，按草图的邀请码页文案（配置里的 `invite`）定。
5. **云服务器列表的来源**：已定，按 1.0 的门户接口取（见 §5.4）；Web 上跨域会被出口拒绝，因此这条路只在客户端内走。
6. **桌面登录后的落地**：入口配置的 `success_url` 是**引擎相对路径**（实例上是 `/dashboard/inbox`）；桌面两端 basename 与引擎不同源，`goToSuccess` 现在把这样的路径当站内路由，会落到应用首页。是改走 `serviceUrl` 打开引擎页，还是由部署把 `success_url` 配成应用自己的路由，待定。
7. **客户端内第三方登录的回程**：第三方入口在当前窗口整页跳转，提供方报错时（例如客户端 id 未登记的回调地址）整页停在对方的报错页，客户端的 webview 没有后退栏，用户回不到应用。需要一条回程（深链、本地回调通道或设备码，见 `06-login-features-login.md` §7）。

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

限制：一次性口令的活体走查仍取不到（口令发给收件人，接口读不到），自动化只覆盖到请求体带上 `otp_id` 与 `verification_code`；`mode` 的能力开关与联合状态页仍按 §10。

## 12. 实现结果（2026-10-09）

服务器选择页已落地，客户端内模式与验证码弹窗按下面的规则收口；登录与注册两条流程在桌面壳里逐屏实跑过一遍。

| 位置 | 内容 |
| --- | --- |
| `features/auth/servers/` | 服务器选择页：官方清单（`platform/portal/`）、自建地址、连接（宿主 `celadon_service_set` 校验并落盘）、三态与错误提示 |
| `features/auth/server-history.ts` | 本机记录（`localStorage` 的 `celadon.servers`，最近 8 条）：连接与登录各记一次，不给名字时保留原有名字；选服务器页用它预选并回填 |
| `features/auth/use-auth-mode.ts` | 客户端内模式的**唯一判定**：`capabilities().serviceAddress` 为真即 `in-app`；`withMode()` 让页面之间的链接带上标记 |
| `features/auth/use-server-name.ts` | 客户端栏的服务器名：本机记录里的显示名，没有名字取「自建」，一条记录都没有退回地址；Web 取服务信息里的名字 |
| `app/src/platform/portal/` | 官方清单的取数（1.0 的门户接口，只读） |
| `features/auth/components/captcha-dialog/` | 打开时的焦点按内容定：图形验证码进输入框，人机验证不动焦点（规则见 `design/layout.md`） |
| `features/auth/tests/servers.browser.ts` | Web 上的服务器选择页：只读地址、无写入控件 |

与本文档原写法的差异：

| 原写法 | 实际实现 | 依据 |
| --- | --- | --- |
| `AuthLayout` 自己从地址里读 `?from=` 判形态 | 形态由外壳显式传给 `AuthLayout`（`mode`），判定集中在 `useAuthMode()` | 客户端内页面的链接与跳转一旦不带标记，判定就会退回 Web 形态 |
| 客户端栏的名字取 `/.well-known/yao` 的 `name` | 取本机记录里与该地址同址那条的显示名（自建那格显示「自建」，没有记录退回地址） | 原型 `login.html` 的 `renderClientBar()` 用的就是所选条目名 |
| 客户端栏的返回用浏览历史 | 写死路由 `navigate('/servers')` | 桌面壳直接停在某一页时，历史里没有上一条 |

实跑（桌面壳读 `dist-client`，宿主地址 `https://service.example.com`，实例入口声明 `turnstile`）：清空宿主地址 → 首屏进 `/servers` → 选自建并连接 → `/login` 客户端形态（客户端栏「自建」）→ 注册（验证码弹窗 → 密码步 → 创建账号）→ `/welcome`（会话进系统凭据库，键为 `<服务 origin>#session`）→ 删掉会话后同一路径登录成功 → 「继续」按 §10 第 6 条落到应用首页。客户端栏在两种形态、两种语言下都与原型一致。

限制：客户端内的第三方入口只走到提供方报错页（§10 第 7 条）；`success_url` 的落地仍按 §10 第 6 条；服务器选择页的连接失败、空清单两态由单元用例覆盖，未在壳里逐态实跑。
