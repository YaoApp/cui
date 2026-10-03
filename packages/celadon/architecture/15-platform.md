# 15 · 平台层

- **版本**：v1.4
- **最后修改**：2026-10-03 08:40:57
- **说明**：平台层：构成与落位 · 服务信息（well-known）· 会话与鉴权 · 运行环境 · 数据层

## 1. 规则

- **平台层不认识业务词汇**：它只存**通用事实**（主题 · 语言 · 会话 · 环境 · 服务信息），不存某个功能的字段（同 `06-state.md` 的判据）。
- **宿主差异只在这一层消化**：Web 与 Desktop 的差别（鉴权方式 · 能力开关 · 注入的全局）**不许渗到 feature**。
- **单一来源不在这里重定义**：颜色/间距在 `theme/`（源头 `design/`）· 文案在语言包 · 图标产物由脚本生成（见 `09` · `08` · `10`）。
- **服务信息只读**：`/.well-known/yao` 的内容由后端给，应用**只读不写**。
- **鉴权只用 token 直连**：不依赖安全 Cookie，也不要求宿主起代理 —— 同一份调用代码在 Web 与 Desktop 都能跑（见 §4）。

## 2. 构成与落位

| 子目录 | 管什么 | 形态 |
| --- | --- | --- |
| `theme/` | 主题偏好（三态）· 解析后的主题 · 对比度工具 | 公共态 + 纯函数 |
| `router/` | basename · 页标题 · URL 绑定 | 纯函数 + 钩子 |
| `i18n/` | 语言包加载 · 语言偏好 · 语言解析 | 公共态 + 纯函数 |
| `icons/` | 图标产物（生成）· 底座挂载 | 生成物 + 挂载 |
| `utils/` | 纯函数与常量（导航 · 可读色 · 分享链接） | 纯函数 |
| **`service/`** | **服务信息**：读 `/.well-known/yao` 并缓存（见 §3）| 公共态 + 取数 |
| **`session/`** | **会话与用户**：token · 当前用户 · 当前团队（见 §4）| 公共态 |
| **`env/`** | **运行环境**：web / desktop 判定 · 能力开关（见 §5）| 纯函数 + 常量 |
| **`webproxy/`** | **开发期**的后端地址与预览代理规则（见 §4.2；生产同域，不需要）| 常量 + 构造规则 |
| `data/` | **接口类型**与传输原语（见 §6）| 类型 + 传输 |

**落位判据**：平台层内部**向下依赖**（`utils/` 不依赖其它；`service/` `session/` `env/` 可依赖 `data/` 与 `utils/`）。

## 3. 服务信息（well-known）

**启动时读一次** `GET /.well-known/yao`，结果进公共态并缓存。

| 字段 | 用途 |
| --- | --- |
| `name` · `version` · `description` | 关于页 · 上报 |
| **`openapi`** | **接口根**（如 `/v1`）——所有请求以它为前缀 |
| `issuer_url` · `server_url` | 鉴权与接口的服务地址 |
| `webproxy`（`domain` / `prefix` / `protocol`）| **仅开发期**：预览代理域名的构造规则（生产同域，不需要；归 `platform/webproxy/`）|
| `license` | 能力开关（`valid` / `edition`）|
| `tao` | 注册 / 升级入口 |
| `developer` | 关于页署名 |
| `disable_system_setting` | 是否禁掉「系统设置」入口（客户端模型里有此字段）|
| `dashboard` | 后台入口（外链）|

**不消费的字段**：

- **整个 `optional.*`** —— 它服务于**旧版（v0）**，对 **V2 没有任何意义**（`layout` 首屏形态 · `neo` 旧 agent 接口 ·
  `avatar` · `remoteCache` 都在此列）。**应用不读、也不依赖。**
- **`grpc` / `grpc_tls` / `grpc_tls_ca`** —— **不是给前端用的**：**Desktop 也走 http**，gRPC **不暴露到公网**。

- **读失败必须降级**：拿不到 well-known 时应用仍要能起（用默认 `openapi: '/v1'`），**不许白屏**。

## 4. 会话与鉴权

**与 `cui-android` 同一套约定**（OAuth 风格，**不用安全 Cookie、不需要宿主代理**）：

- **一律 `Authorization: Bearer <access_token>`**；调用方已显式带 `Authorization` 时**不覆盖**
  （登录第一步用一次性**临时 token**，覆盖会让服务端报 `token_missing`）。
- **两步登录**：① 验证账号存在 → 拿**临时 token**（可能要先过**验证码**）② 用临时 token 换
  `access_token` + `refresh_token` + `session_id`。
- **续期是机会性的、绝不阻塞**：启动时尽力刷新一次；失败不拦路由、不拦首屏（与未登录同待遇）。
- **接口根**取 well-known 的 `openapi`，**缺省 `/v1`**；服务地址由宿主的配置给（Web 同源 · Desktop 指向服务端）。

### 4.1 直连与跨域（客户端宿主）

**能否直连取决于"请求从哪一层发出"，不取决于宿主是 web 还是 app**：

| 宿主 | 发出请求的层 | 跨域 |
| --- | --- | --- |
| Android | **native HTTP**（OkHttp）| **无跨域** —— 直连服务端即可 |
| Desktop | **native HTTP**（Tauri `http` 插件 → Rust 侧）| **无跨域** —— 直连服务端即可 |
| Desktop | webview 里的 `fetch()` | **有跨域**（标准浏览器语义）|
| Web | 浏览器 `fetch()` | **有跨域** —— 需同源部署或服务端 CORS |

- 服务端**不发 CORS 头、不处理预检**（实测 `Access-Control-*` 全无、`OPTIONS` 返回 404）。
- **结论**：走客户端方式时,**Desktop 必须用 Tauri 的 `http` 插件发请求**（Rust 侧），
  **不要用 webview 的 `fetch()`** —— 否则仍需一个加 CORS 的本地代理（`cui-desktop` 现状即是此，其
  `tower-http` 的 `cors` 就用在那个代理上）。走 native 之后**代理与隧道都可以去掉**。

### 4.2 后端地址与代理（**仅开发期**）

- **生产同域**：`dist` 集成进 yao 后由服务端托管，**前端与接口同源** → 接口一律用**相对路径**
  （`${openapi}/...`），**应用代码不感知后端地址**。
- **开发期才需要指向别处**：由 **`.env`** 给后端地址（dev server 的代理目标），应用代码不变。
  - `.env` 里的键名由 dev server 读（当前约定 `YAO_SERVER_HOST`，见 `.agent/ENVIRONMENT.md`）。
  - **不要**把后端地址编进应用代码，也不要用 `import.meta.env` 在业务里拼绝对地址。
- **`webproxy/` 的存在理由只有开发与预览**：把某个端口/预览按 `webproxy` 的
  `domain` / `prefix` / `protocol` 规则挂成可访问域名。**生产同域，用不到它。**
- **公共态只存通用事实**：当前用户（`id` · 显示名 · 头像）· 当前团队（`team_id`）· 令牌状态。
  **不存**业务角色/权限字段 —— 那是功能自己的事。
- **未登录不是错误**：公共态为 `null`，界面按未登录渲染，不抛异常、不阻塞路由。

## 5. 运行环境（web / desktop）

- **判定**：存在 **`window.__TAURI_INTERNALS__`** 或 **`window.__TAURI__`** → **desktop**；否则 **web**。
  （Tauri 注入；另有 `window.__yao_dl_lang` / `window.__yaoDownloadToast` 是桌面下载提示，不参与判定。）
- **`platform/env/` 暴露**：`runtime`（`'web' | 'desktop'`）· 能力开关（剪贴板 · 文件 · 通知 · 外部打开）·
  宿主版本（desktop 从 Tauri 取）。
- **能力开关是唯一分支点**：feature 不许自己判 `window.__TAURI__`；要用能力就问 `env`。
- **不判定 UA 猜宿主**：UA 可伪造且会漂，**以注入的全局为准**。

## 6. 数据层

- `app/src/data/` 放**接口类型**与**传输原语**：类型来自 `openapi`（生成或手写，**待定**）；
  传输原语 = 带鉴权与续期的 `fetch` 封装（依赖 `session/` 与 `service/`）。
- **feature 只拿类型与取数钩子**，不许自己拼 URL、不许自己读 token。

## 7. 测试

- 层与落位按 `14-testing.md`：纯函数与公共态用单元；**跨宿主差异用浏览器层**（mock 注入的全局）；
  真实登录与真实数据用**拟人层**。
- **测试后端**：`http://<dev-backend-host>:5099`（**绝不可指向 `127.0.0.1:5099`** —— 生产，也是本 Agent 自身运行时）。
  测试接口（`--test-mode` 开启时注册，实现见 `trheyi/yao` 的 `openapi/testmode/testmode.go`）：
  `POST /v1/test/login/token`（体 `{"user":"<email>"}` → `access_token`）· `POST /v1/test/login/web` ·
  `POST /v1/test/server-key` · `GET /v1/test/users` · `GET /v1/test/teams` · `GET /v1/test/otp?code=` · `GET /v1/test/captcha?id=`。
- **测试里只许用 token 方式登录**（与生产同一条路径），不测安全 Cookie。

## 8. 待定项（本稿需你确认的点）

1. **`data/` 的类型来源**：`cui-android` 是**手写的强类型模型**（`data class`）；我们跟它一致，还是从 `openapi` 生成？
2. **`service/` 与 `session/` 的命名**：是否就叫这两个（android 侧是 `core/network` + `data/auth`）。
3. **`disable_system_setting` 要不要进 V2**：android 的 well-known 模型里有，V2 是否消费？
