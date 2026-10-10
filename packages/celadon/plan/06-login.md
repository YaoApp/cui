# 06 · 产品级登录与注册（实现结果）

- **版本**：v2.1（2026-10-10）· **状态**：已交付（单元 · 浏览器 · 拟人三层用例与门禁全绿）；登录后的默认去向改为 `/inbox`，随布局第一阶段落地
- **上游**：[`architecture/05-data-and-api.md`](../architecture/05-data-and-api.md) · [`architecture/06-state.md`](../architecture/06-state.md) · [`architecture/07-routing.md`](../architecture/07-routing.md) · [`architecture/15-platform.md`](../architecture/15-platform.md) · [`architecture/17-transport.md`](../architecture/17-transport.md) · [`design/prototype/`](../design/prototype/)（草图，评审用）
- **范围**：`/user/entry` 一线的能力归一化为一套产品级实现：一个 `data/user` 域，登录页、注册页、第三方回跳页、服务器选择页与欢迎页五个页面，打开应用时的入口判定与会话失效处置。

本册只记**结果与现行规则**。原先按组件、页面、登录页与入口路由分开的四份分册已并入本册，过程与取舍写在各次提交里。

## 1. 路由与页面

路径都在构建决定的 base 之下（`architecture/04-host-integration.md`）。

| 路径 | 页面 | 现行行为 |
| --- | --- | --- |
| `/login` | `features/auth/login/` | 账号步 → 按 `entryVerify` 的判定分支：密码步（可带一次性口令）或跳注册；第三方入口在当前窗口整页跳转 |
| `/register` | `features/auth/register/` | 账号步与登录页共用判定；密码与确认密码、条款、需要时的一次性口令与页内邀请码步；响应带 `id_token` 才采纳会话，否则回登录页提示「注册成功，请登录」 |
| `/welcome` | `features/auth/welcome/` | 用户信息页：展示本次会话的用户信息（内存里没有时取一次 `GET /user/profile`），点「继续」走入口配置的成功地址，也可在这里退出登录；**不再是登录后的默认去向**，默认见下表的收件箱 |
| `/servers` | `features/auth/servers/` | 官方清单（`platform/portal/`）与自建地址，连接交宿主 `celadon_service_set` 校验并落盘；Web 只读展示当前地址 |
| `/auth/back/:provider` | `features/auth/back/` | 第三方回跳：读 `code` 与 `state` 调 `oauthCallback`，按状态回登录页或走成功收尾 |
| `/` | `routes/entry-gate.tsx` | 入口判定（见第 5 节），不再直接画页面 |
| `*` | `routes/session-guard.tsx` | 未知路径算产品面：未登录带 `next` 去登录页，登录后回 `/` |

五个页面共用 `AuthLayout`（品牌、语言与主题两个全局控件、卡片、页脚、客户端栏），页面之间互相链接时带上已输入的账号与去向。

各页面的状态与现行行为：

| 页面 | 状态与动作 |
| --- | --- |
| 登录 | 账号步（空账号按钮禁用 · 账号无效给字段错误）· 密码步（可加一次性口令，可重发并显示倒计时）· 验证码弹窗（图形与人机两种形态）· 第三方入口 · 失败按码翻四语；入口配置取不到给失败态与「重试」，重试同时重取验签公钥 |
| 注册 | 账号步与登录页同一套判定 · 密码与确认密码（两个输入框作为一组，出错不动其余间距）· 条款勾选 · 需要时的一次性口令步与页内邀请码步 · 注册后不自动登录时回登录页并提示 |
| 欢迎 | 会话用户信息（内存或补取资料）· 资料取数中一行状态 · 取数失败给原因与「重试」· 没有可展示字段时不画空表格 · 继续 · 退出 |
| 服务器 | 官方清单三态（加载中 · 失败给原因与重试 · 空清单仍可填自建）· 自建地址为空时字段级错误且不发请求 · 连接失败按码给原因 |
| 回跳 | 换取会话中给转圈与状态 · 成功走成功收尾 · 失败给原因与回登录页的入口 |

键盘与焦点：表单回车提交、Tab 顺序按视觉顺序、只有键盘聚焦画 `--focus-ring`；验证码弹窗打开时的焦点按内容定（图形验证码进输入框，人机验证不动焦点），规则在 [`design/layout.md`](../design/layout.md)。

脚手架页面（`/scaffold/*`）是**开发面**，与产品面共用外壳但不进两个守卫，地址与形制见 [`05-scaffold.md`](05-scaffold.md)。

## 2. 数据层

`app/src/data/user/`：**15 条接口声明与 15 个查询包装**（`api.ts` · `queries.ts` · `keys.ts`）。

| 分组 | 接口 |
| --- | --- |
| 入口配置与验证码 | `GET /user/entry` · `GET /user/entry/captcha` |
| 判定与登录注册 | `POST /user/entry/verify` · `POST /user/entry/register` · `POST /user/entry/login` · `POST /user/entry/otp` · `POST /user/entry/invite/verify` |
| 第三方 | `POST /user/oauth/:id/authorize` · `POST /user/oauth/:id/callback` · `GET /oauth/jwks` |
| 设备码 | `POST /oauth/device/authorize` · `POST /user/oauth/:id/device/authorize` · `POST /user/oauth/:id/device/token` |
| 会话 | `POST /user/logout` · `GET /user/profile` |

现行规则：

- **临时令牌**只留在页面状态里，不进凭据存储；`register` / `login` / `otp` / `invite` 的包装以 `token` 为第一个参数，经请求头随每次调用送出。
- **会话的采纳与清除**归 `platform/credential`：`signIn` 采纳令牌族，`signOut` 清本机凭据；换服务地址时 `writeServiceAddress()` 调 `resetSession()` 作废本机凭据（`platform/service/address.ts`）。
- **失败按码翻译**（`data.error.<码>` 与 `platform/i18n/code-key.ts`），四语齐备；**语言由 ctx 统一给**，页面不自己拼 `locale`。
- ID Token 在客户端**验签**（`features/auth/id-token.ts`，只认 RS256），不沿用跳过验签的降级分支。

## 3. 页面与共用件

**页面内部件**在 `features/auth/components/`：`auth-layout` · `auth-provider` · `captcha-dialog` · `locked-account` · `password-input` · `provider-list` · `status-notice` · `terms-note`。

**基础件**取 `components/base/`：`input` · `captcha-field` · `turnstile-field` · `otp-field` · `checkbox` · `button` · `select` · `link` · `spinner` · `dialog` · `alert-dialog` · `segmented-control` · `icon` · `brand-mark`。密码不另立基础件（`type="password"` 的文本输入加可见性按钮）；字段的标签、说明与错误用上游 `field` 的部件；本轮不新增基础件。组件与验收口径见 `architecture/03-boundaries.md` 与 `architecture/14-testing.md`。

**域内纯函数与钩子**在 `features/auth/`：

| 文件 | 作用 |
| --- | --- |
| `account.ts` | 账号形态判定（邮箱或手机号），登录与注册的账号步共用 |
| `id-token.ts` | ID Token 本地验签（RS256），声明另由 `idTokenClaimsForDisplay` 读出供展示 |
| `user-info.ts` | 登录响应与声明 / 用户资料 → 展示用的用户信息；标识优先 |
| `success-address.ts` | 成功地址的落地：同源走路由，外链用 `location.assign` |
| `server-history.ts` | 本机服务器记录（`celadon.servers`，最近 8 条） |
| `entry.ts` · `routes/entry-gate.tsx` | 入口判定的纯函数与它的接线 |
| `session-marker.ts` · `landing-record.ts` · `next.ts` | 本机登录标记、最后落点、登录后去向 |
| `sign-out.ts` · `use-sign-out.ts` | 退出的本机清理与产品动作 |
| `use-auth.ts` · `use-auth-mode.ts` · `use-complete-sign-in.ts` · `use-server-name.ts` · `use-landing-record.ts` | 域状态、客户端内形态判定、登录收尾、客户端栏的服务器名、落点记录 |

## 4. 域状态与本机记录

- **域状态**（`features/auth/auth.store.ts`，`zustand`）：`phase`（账号步 / 密码步 / 邀请码步）· `verifyStatus` · `tempToken` · `otpId` · `needsCode` · `username` · `notice` · 会话用户信息 `user` · 入口配置 `config` 与 `configFailed`；`AuthProvider` 负责取入口配置、登录收尾（验签 · 采纳会话 · 写本机记录 · 跳转）与退出后的状态复位。
- **本机记录**（都按服务 origin 分账，坏数据一律当没有）：

| 键 | 载体 | 内容 |
| --- | --- | --- |
| `celadon.session` | `localStorage` | 登录标记（一笔时间戳）。只决定首屏往哪跳，不是授权依据；存储写不进去时本次打开内留一个内存兜底，免得登录成功那一刻被自己的守卫弹回登录页 |
| `celadon.landing` | `localStorage` | 最后落点，值 `{ path, at }`，只收应用内路径（根地址不算） |
| `celadon.next` | `sessionStorage` | 第三方往返期间暂存的去向，用过即删；没有明确去向时也要写（清掉上一次留下的） |
| `celadon.servers` | `localStorage` | 连过的服务器（最近 8 条），与谁登录无关，退出时不动 |

- **凭据**（会话令牌族）在 `platform/credential`：Web 上由服务端的 HttpOnly Cookie 承担（JS 碰不到），客户端里进系统凭据库；退出时先由服务端吊销，成功后再清本机。
- **开发面的验证页**只探接口：它的「退出登录」走 `logoutQuery()`（服务端吊销并清平台凭据），不动登录域的本机记录（它不引 auth 域，退出的本机清理由 `useSignOut()` 与 `SessionExpiryGuard` 共用 `clearLocalSession()`）。
- **客户端内形态**由 `useAuthMode()` 一处判定（`capabilities().serviceAddress` 为真即 `in-app`），页面之间的链接与跳转过 `withMode()` 带标记；客户端栏的服务器名取本机记录，返回入口写死 `/servers`。

## 5. 入口与默认路由（现行规则）

打开应用时按三个本机信号决定首屏去哪，**不查后端**；判定是一处纯函数（`features/auth/entry.ts`）。

| 信号 | 取值 |
| --- | --- |
| 服务地址 | `serviceBase()` 有没有值（桌面首次由宿主给） |
| 本机登录标记 | `celadon.session` 在本服务这一账上有没有 |
| 最后落点 | `celadon.landing` 在本服务这一账上的路径 |

| 情形 | 首屏 |
| --- | --- |
| 桌面还没选过服务器 | `/servers` |
| 有地址、没有登录标记 | `/login` |
| 有标记、有落点 | 落点路径（含查询串） |
| 有标记、没有落点 | `/inbox`（收件箱，见 `08-layout-base.md`） |
| 留位：以后接「有没有配好」的判断 | 未就绪时按没有落点处理 |

装配是三层：`ServerGuard`（桌面首次去选服务器）→ 产品面（`SessionExpiryGuard` 订 401 · `RequireSession` 管未登录 · `SurfaceLayout` 与根地址的入口判定）与开发面（脚手架）。

**明确地址优先**：受保护页面被未登录访问时，守卫把原地址带进 `next`，登录或注册收尾后去那里。

| 环节 | 约定 |
| --- | --- |
| 参数 | `next`，登录后去向的唯一参数（`from` 是客户端内形态的标记，`redirect_uri` 是第三方授权的事，都不混用） |
| 取值 | 应用命名空间**之内**的路径，不带 base，可带查询串。不合法的一律忽略：绝对地址、以 `//` 开头、带协议、根地址 `/`、以流程页开头（`/login` `/register` `/auth/back` `/servers` `/welcome`）、超长串 |
| 默认进入不算明确意图 | 根地址与不带命名空间的站点根不写 `next`，登录后按落点与收件箱自己决定；`next` 只出现在分享链接与深链这类明确地址上 |
| 传递 | 登录 ↔ 注册 ↔ 第三方之间带着走；第三方往返期间放 `celadon.next`，收尾时用掉并删除 |
| 收尾 | 地址上的 `next` 先看，暂存再看；都没有就去 `/inbox` |

**401 即会话失效**：传输层不再「续期一次、重放一次」，非入口类请求的 401 发一次事件；`SessionExpiryGuard` 收到后清本机标记、落点、待去地址与域状态，跳登录页并带上当前地址。入口类接口（按路径结尾认：`/user/entry` · `/user/oauth` · `/oauth/jwks`，不绑接口根）的 401 排除在外，免得打断正在填的页面；设备授权页的 `/oauth/device/authorize` 是已登录的人批准设备时调的，不在排除之列；重复的 401 只跳一次；已经在登录页时只清状态不跳。令牌的续期是另一条线，不在本册。

**退出登录**（`use-sign-out.ts`）：`POST /user/logout` 服务端吊销并清平台凭据 → `clearLocalSession()` 清登录标记、最后落点、待去地址与域状态 → 回 `/login`。服务端吊销失败就本机不动，页面给原因。

## 6. 文案与四语

- 登录一线的文案在 `features/auth/locales/`，四语各 **95 键**（`zh-CN` · `zh-TW` · `en-US` · `ja`），键类型由 `scripts/build-i18n-types.mjs` 生成到 `platform/i18n/i18n-types.d.ts`。
- 服务端失败的文案不在这个包里：取 `app/src/locales` 的 `data.error.<码>`。
- 基础组件与页面内部件的展示文案放各自目录的 `locales/`。
- 语言切换立即换内容、不刷新、不丢已输入的内容；主题两档，首次跟随系统，点过之后写显式档。

## 7. 测试与读数

- **单元**：与源文件同目录（`account` · `id-token` · `user-info` · `success-address` · `server-history` · `entry` · `session-marker` · `landing-record` · `next` · `sign-out` · `auth.store` 与五个页面的用例）。
- **浏览器**（`features/auth/tests/`）：`login.browser.ts` · `register.browser.ts` · `servers.browser.ts` · `welcome.browser.ts` · `entry.browser.ts` · `login-prototype.browser.ts`，覆盖真渲染、活体验证码、四语换内容、失败按码翻译、客户端内形态、入口判定五条与退出的本机清理。
- **拟人**：`features/scaffold/overview/tests/structure-trial.agent.mjs` 与 `features/scaffold/requests/tests/requests-trial.agent.mjs` 两个场景。
- **读数（2026-10-09）**：`pnpm lint` · `pnpm check` · `pnpm test` 全过（**111 文件 763 例**）；全量 `pnpm test:browser` **84 过 1 跳**；`pnpm test:persona` **2 / 2**；`pnpm build` 通过；`pnpm test:ci-like` 两条都过；本册涉及文件的行与分支覆盖率都不低于九成。

## 8. 未做与待定

1. **联合状态页面**：`mfa_required` 与 `team_selection_required` 按入口配置声明与否决定做不做，现在没做。
2. **桌面的成功地址落地**：入口配置的 `success_url` 是引擎相对路径（实例上是 `/dashboard/inbox`），桌面两端 basename 与引擎不同源，`goToSuccess` 现在把这样的路径当站内路由，会落到应用首页；是改走 `serviceUrl` 打开引擎页，还是由部署配成应用自己的路由，待定。
3. **客户端内第三方登录的回程**：第三方入口在当前窗口整页跳转，提供方报错时整页停在对方的页面，webview 没有后退栏，用户回不到应用；需要深链、本地回调通道或设备码中的一条。
4. **`?redirect=` 参数**：1.0 支持并把目标写进 Cookie；我们是否支持、由谁写、要不要落在 `success_url` 之前，待定。
5. **第三方提供方没有 logo 时的通用图标**：现在按 `SigninProvider.logo` 的地址渲染图片，没有地址时用哪一个待定。
6. **「在宿主内」的能力开关**：`capabilities()` 里还没有这一项，页面形态现由外壳显式传 `mode`。
7. **一次性口令的活体走查**：口令发给收件人，接口读不到，自动化只覆盖到请求体带上 `otp_id` 与 `verification_code`。
8. **按用户信息分流**：欢迎页「继续」之后按用户信息去哪仍未接。
9. **邀请码的形态**：现为页内一步，是否改回独立页面待定。
10. **令牌续期**：桌面静默续期依赖引擎给原生客户端一条刷新路径，属另一条线，与本册不耦合。
11. **设计体系的遗留**：`--brand-solid-active` 等按下换色档在按钮上已无引用，去留待定；选择器未做虚拟滚动（窗口化与键盘可达冲突，保留整表挂载）与多选摘要；`brand-mark` · `icon` · `segmented-control` · `spinner` 四个基础件只有英文文档；两行选项的行高不是 `--row-height` 的整数倍时，弹层只保证可滚。
12. **取数没有超时**：入口配置请求一直不返回时，登录页停在加载态（其余按 `failure` 处理）；回跳页与欢迎页补取资料的那一次同样。

## 9. 变更沿革

| 时间 | 内容 |
| --- | --- |
| 2026-10-05 | 草图进 `design/prototype/`（登录 · 注册 · 服务器 · 外壳 · 欢迎页） |
| 2026-10-06 至 07 | `data/user` 域与四个基础件（`input` · `captcha-field` · `otp-field` · `checkbox`）交付；主题与语言切换按规格补齐；脚手架基础件清单页落地 |
| 2026-10-07 | 登录页与外壳、域状态、四个页面内部件交付；ID Token 本地验签 |
| 2026-10-08 | 注册页交付，验证码弹窗抽成共用件；账号步不整体抽组件，注册不采纳没有 `id_token` 的会话 |
| 2026-10-09 | 服务器选择页与客户端内形态一处判定；入口与默认路由（本机标记 · 最后落点 · `next` · 401 处置）；欢迎页的用户信息（含刷新后补取资料）与产品级退出登录；四份分册并入本册 |
| 2026-10-10 | 登录后的默认去向由 `/welcome` 改为 `/inbox`（收件箱落成后生效，见 `08-layout-base.md`）；欢迎页保留为可直接打开的页，不再是默认第一站 |
