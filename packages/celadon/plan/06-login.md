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

**状态：已完成**（2026-10-05）。产物 `login.html` · `register.html` · `servers.html` —— 占位演示，细节随产品迭代再改。

实际做法与下列原始要求的差异（以实际为准）：

- 草图**带少量交互脚本**（主题 · 语言 · 密码显隐 · 禁用与加载 · 错误定位 · 页面间跳转），目的是"能用起来看"，而非只画静态形态。这是应要求加的，与原第 5 条「不含交互脚本」不同。
- 主题不再只靠平台偏好：页面右上/卡下有语言与主题控件，**点击直接切换**（规范仍要求浅暗成对出图）。
- 状态未拆成"一页一态"的文件：错误 · 禁用 · 加载 · 客户端内语境都做在**同一页的可用状态**里，靠参数与交互触发；`plan/07-design-review-entry.md` 记了这轮的复核问题。
- 新增语境：`?from=connect`（客户端内）——隐藏品牌与协议、控件移到卡下、卡上方显示返回入口与所选服务器。
- 状态覆盖仍不完整（注册页尤其）、控件边界取值未定档，见 `plan/07`。


**产物**：`design/prototype/` 下的**产品级静态设计图**（`login.html` · `register.html` · `servers.html`），只引 `design/tokens.css`，不引应用代码、不写产品样式；草图与 `design/AGENTS.md` 一并进仓库。

**要求**：

1. 只用设计体系已发布的 Token（颜色、间距、字号、圆角、描边、阴影），不出现字面量色值与自造尺寸。
2. 每张草图覆盖完整状态，而不是只画成功路径：
   - 登录：空闲 · 提交中 · 用户名不存在（引导注册）· 密码错误 · 需要验证码 · 需要 MFA。
   - 注册：空闲 · 验证码待发/已发（含重发倒计时）· 验证码错误 · 密码强度不足 · 两次密码不一致 · 需要邀请码 · 成功。
   - 服务器选择：无历史服务器 · 有列表且当前项可达 · 当前项不可达（可改、可试）· 校验中 · 校验失败。
3. 明写交互说明（焦点顺序、回车提交、错误定位、禁用态、加载态、最大宽度与断点行为），作为 UE 评审的依据。
4. 设计图与产品**同构**：同一套类名（`.input` · `.btn-primary` · `.hint-error` · `.link`）与同一套文案来源
   （`design/i18n/*.json` 的 `ui.entry.*`），LOGO 用 `design/logo-mark-celadon.svg`；可 1:1 映射进产品。
5. **只做设计，不做功能**：设计图不含交互脚本，不演示状态切换；状态用**分开的页面**表达，一页一个状态，一个一个设计。
   顺序：`login.html`（登录）→ `register.html`（注册）→ `servers.html`（服务器选择）。
   主题由平台偏好决定：浅色即页面原样，深色是同一页加 `data-theme="dark"`。

## 1.1 追加：`layout.html`（登录之后的界面布局稿）

**状态：已完成**（2026-10-05）。产物 `layout.html` 与 `welcome.html` —— 都是**占位演示**，细节等产品迭代时再改。

做法：整页取自 `design/mock.html`（同一套类名与 token、同一细节密度），只改三处 —— 去掉演示用的窗口红绿灯、窗口铺满视口、插入组件边界注释；另修三处路径（`../tokens.css`、`../i18n/bundle.js`、`../icons/`），因为文件从 `design/` 移到了 `design/prototype/`。

**导航与两个视图（2026-10-05 按 `design/foundations.md` F6 落地）**

- 三栏改 **grid 列轨**（mock 用 flex，导航宽度写死 225 → 现填满列轨）：Web `280 / 760 / 400`（1440 视口），客户端 `0 / 1040 / 400`。
- **`?view=client`** 为客户端视图：窗口左上浮「红绿灯 + 收起键」（红绿灯在最左、与 `--column-header-height` 顶行居中对齐），**收起键可点击切换**导航 0 ↔ 280，切换中红绿灯位置不动（实测恒为 x=16 / 收起键 x=76）。
- 踩坑两条（都写进注释）：① 收起导航若用 `display:none` 会退出 grid，中栏滑进 0 宽列被压没 —— 规范说的是"收起为 0"，导航必须留在列轨里（改 `visibility:hidden`）；② 中栏内容会把列轨撑开、把右栏推出视口 —— 三列需 `min-inline-size:0`，面板内容超出应可滚动。

**布局原则（2026-10-05 定，写在页面注释里）**：三栏各自是一条固定轨道，**列内除「滚动区」外所有块 `flex: none`** —— 高度变化只改变滚动区的可视高度，任何组件的尺寸与位置都不随之变形。三个滚动区：导航会话列表 · 中栏消息流 · 右栏面板正文。实测在 900 / 620 / 420 / 320 四个高度下，顶行 40 · 品牌行 44 · 菜单项 32 · 搜索框 34 · 筛选 chip 27 · 会话行 54 · 用户行 50 · composer 82 · 面板头 41，**全部不变**。

**两视图的导航（2026-10-05 第二批）**：**Web 也有收起键**（按 F6：Web ≥1024 收起为 0、768–1023 图标轨、<768 抽屉 —— 目前接入的是 ≥1024 收起为 0 这一档，客户端才有红绿灯），两个视图默认展开；**LOGO 提到顶行**（与菜单项图标同一左边界 8px），**版本徽标移除** —— 那个位置让给图标按钮区。

**用户行「…」菜单（2026-10-05）**：点击导航底部用户行的 `…` 弹出菜单，切换**语言**（四语）与**主题**（浅色 / 暗色 / 跟随系统）。语言用页内 `data-i18n` 键 + `CELADON_I18N`，主题改 `data-theme`。踩坑两条：① 取值函数把 `dict()`（已到 `ui` 层）又拼了一次 `ui.`，键永远取不到 —— 现在剥前缀；② 语言包里的模板键带 `{count}` / `{time}`，直接写回会把页面上的具体数字抹掉 —— 现在含 `{` 的键跳过。四语包补了 `ui.newTask` · `ui.theme.light/dark/system` · `ui.layout.language/theme`。

**登录后布局稿的后续修订（2026-10-05，`design/prototype/layout.html`）**

- **字体按规范**（`design/AGENTS.md` 红线 1 · 7）：清掉 mock 留下的 8 处写死字体用法，全部改走 `--font-family-ui` / `--font-family-monospace` / `--font-size-11/12/13`。**注意**：仅替换 token 不够 —— 体系里 `.celadon, [data-theme] .celadon { font-family: inherit }`（0,2,0）会压过 `body{…}`（0,0,1），正文会回退到浏览器默认字体；用 `[data-theme] body.celadon`（0,2,1）落一次才生效。验收判据：页面无写死字族与字面量字号，且 `body` 计算字族为 token 值。
- **输入区层级**（F3）：L2（`--shadow-floating` + `--elevation-surface-2` + `--z-overlay`）与 L1 都试过，最终取 **L2**；描边另取 **`--border-subtle`**（比 default 轻）。暗色下阴影不可见，层级靠面阶表达，故阴影与面阶必须同时给。
- **用户行「…」菜单**：语言（四语）与主题（浅色 / 暗色 / 跟随系统），向上展开。
- **导航**：两视图都有收起键、默认展开；收起为 0 时控制区落在中栏顶上，中栏头按视图留位（Web 16 / 客户端 116），避免标题被压。
- **LOGO**：Web 在顶行、客户端在图标与红绿灯的**下一行**；两视图均与菜单项图标**同一左边界 16**（量的是图形 `.brand-mark`，不是容器）。
- **字体栈按语言切换**由 `--font-family-ui` 的 `:lang` 分栈负责，页面不写死。

**两项实验（2026-10-05，均在页面注释里标明，撤回只需删对应几行）**

- **中栏/右栏底色交换**：中栏改 `--background-surface`（白）、右栏改 `--background-content`（浅灰），即原分工的反面。未回写 F6。
- **选中态中性化**：导航当前项与会话选中行从品牌浅底 `--background-selected` 改为中性 `--background-hover`（比过 `--background-active`，最终取 hover 更轻的一档）；会话行的品牌左竖条保留，选中仍可辨。与 hover 同色，靠竖条区分。

**`welcome.html`（首次进入的首屏，2026-10-05）**：以 `layout.html` 为基座 —— **保留导航、无右栏**（列轨 `280 + 剩余`），中栏是引导语 + 大输入区（`--radius-xl` 的 composer，L2 层级）。导航下半区为空（无未读徽标），激活项为「新任务」，底部保留用户行（语言/主题菜单在其 `…` 上），用户行上方是新手指引卡（胶囊按钮）。右上角有「打开右栏」键（**仅形态，未接行为**；图标暂用 `i-collapse` 镜像，待体系补面板类图标）。文案为自写四语（`ui.welcome.*`）。

**遗留**（写在页面注释里，未修）：

- ~~顶部演示控件~~ 已删除（2026-10-05）：那排「简 繁 EN 日 浅色 暗色」是 mock 用来评审的控件，产品级页面不该有；连同它的脚本一并清掉。产品里的语言与主题属于平台层，不在页面内。
- mock 的**展示壳**已按产品级要求拍平：去掉外面那层框的圆角 · 阴影 · 描边与 body 的四周留白（`.window` 现在 1440×900 铺满、无横向溢出），页面即应用本身的形态；mock 的演示控件（语言/主题那排）也已删除。
- 会话与右栏的内容是 **mock 的演示数据**（合同审阅那套），不是产品真实数据形态；接真数据时逐块替换。
- 组件边界只在注释里标了 `[base]/[shell]/[feature]`，尚未真正拆成 `components/base` 与 `features/<域>`。
- **导航三档只做了「客户端/Web 宽屏」这一档**：Web 768–1023 的 56px 图标轨目前仅隐藏文字，图标未按轨重排；<768 的抽屉（浮层 + 遮罩 + 汉堡按钮 + Esc 关闭）尚未实现。
- 侧栏最小 300 与拖拽把手（`--side-resize-handle` 6px）未接；收起偏好未持久化（规范要求持久化偏好 + 临时标志两级）。
- 右栏内层卡片（diff 卡）仍可能横向超出面板，需内层 `min-inline-size:0` 或换行处理。

**踩坑记录**（同类问题第三次出现，写在这里备忘）：这页最初没接进设计体系 —— `class="celadon"`（token 作用域）漏了、`../i18n/bundle.js` 没引、token 路径写成 `tokens.css`。三处叠加导致整页样式失效（`var()` 全部解析失败，声明被整条丢弃）。教训：**新页面先照抄一个已跑通页面的头部（html 标签 · token · i18n 三行），再写内容。**目的：让"登录 → 进入产品"在体感上连贯，同时定下**组件怎么切**。

要求：

- 一张登录后的主界面布局稿（纯 HTML + Token，放 `design/prototype/layout.html`）：左侧导航 + 顶栏 + 内容区，含至少一种内容形态（列表或空态），并把「返回服务器选择」「当前服务器」这类客户端内元素放进顶栏。
- 在页面注释里标出**组件边界**：哪些区块对应 `app/src/components/base/*`（按钮 · 输入 · 菜单 · 面包屑等），哪些是 `features/<域>` 的页面级组合，哪些先留空。
- 与入口三页同构：同一套类名与文案来源（`design/i18n/*.json`），四语齐；浅暗成对出图。
- 一并给出断点行为（窄屏时导航怎么收）与焦点顺序说明。

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
