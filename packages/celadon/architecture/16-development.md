# 16 · 开发

- **版本**：v1.5
- **最后修改**：2026-10-04 09:15:06
- **说明**：开发：服务与端口 · 代理 · 环境变量 · 日志

## 1. 规则

- **本册只管开发期**：生产同域、由引擎托管（见 `04-host-integration.md`），这里的地址与代理**不进产物、不进生产**。
- **地址只从环境取**，不编进代码（同 `15-platform.md` §4.2）。
- **开发代理只用 Vite 官方的 `server.proxy`**（写在 `vite.config.ts`）：服务端**不发 CORS 头、不处理预检**（见 `15` §4.1），
  浏览器直连拿不到响应 —— 因此开发期必须把**引擎的接口路径**（如 `/v1`）转发到后端。
  **不引第三方代理、不自己挂中间件** ✗ —— 官方机制能兜住的事，加插件只会多一层要维护的东西。
- **代理键是根路径**：`/.well-known` · `/v1`。**dev 的请求路径必须与生产一致** ——
  生产里应用在 `/app/` 下、**引擎在站点根下** ✓，所以代理挂在根下，不挂 `/app/.well-known`、`/app/v1`。
- **代理键是根路径，`base` 不影响它**：带 base 时 `server.proxy` **照常代理根路径** ✓ —— dev 的请求路径与生产一致（生产里应用在 `/app/` 下、引擎在站点根下）。
  实际原因是当时 curl 打到了**没带 `YAO_SERVER_HOST` 的旧 dev server**：代理压根没建，不是被 base 拦的。
  **不要**为此加插件、加依赖或改 base ✗。
- **`YAO_SERVER_HOST` 必须给**：不给就等于**不建代理**，`/.well-known` 与 `/v1` 会落到 Vite 自己身上 → **404**
  （页面报 `The server is configured with a public base URL of /app/` 就是这个现象）。
- **代理要同时撑住三种流量**：

| 流量 | 代理要做的 |
| --- | --- |
| 普通请求 | 按前缀转发 |
| **WebSocket** | **`ws: true`**（升级请求要转发，不能当普通请求）|
| **SSE** | **流式透传**：不聚合响应体、不做响应压缩，并让 `Cache-Control: no-cache, no-transform` · `Connection: keep-alive` · `X-Accel-Buffering: no` 三个头到得了客户端 |

- **同一组要求，两处都成立**：开发期是 Vite 的代理，生产是托管方（反向代理 / 引擎）——
  三个头即其具体化（见 `04-host-integration.md`）。
- **代理目标来自 `YAO_SERVER_HOST`**，**由运行环境给**（见 §3）：写进 `packages/celadon/.env`（**已 gitignore** ✓，
  例 `YAO_SERVER_HOST=http://<dev 后端>:5099`），或由 pm2 注入（见 §2.1）—— **不写死在配置里、不进产物**。
- **生产不需要代理**：`dist/` 与接口同源，前端只发相对路径。

## 2. 开发服务与端口

**当前由 pm2 管理**，每份服务有固定的应用名与端口（端口只是默认值，换环境时以运行环境为准）：

| 应用（pm2 名）| 端口 | 干什么 |
| --- | --- | --- |
| `cui-dev` | **5199** | Vite dev（HMR），base `/app/`：`pnpm dev`（`--host 0.0.0.0 --port 5199 --strictPort`）|
| `cui-dist` | **5200** | **产物预览**：`vite preview --port 5200 --strictPort --host 0.0.0.0`（**继承 `server.proxy`** ✓，接口在预览里也通 ✓；`--host 0.0.0.0` **必须有** ✗，默认只绑 `localhost`）|
| `celadon-design` | **8080** | 设计预览 `design/serve.mjs` |

- **拟人层测的是 `dist/`**，所以它打的是预览端口（见 `14-testing.md`）。
- **构建不经 pm2**：`pnpm build` → `dist/`。
- **另有两条跑法**：`pnpm dev:client`（客户端跑法，base `/`）—— 不占上表端口；
  `pnpm test:browser` / `pnpm test:persona` **由仓库脚本自己起 server** ✓，跑之前不用手动备一份。
- **上表是当前运行环境的实况**：谁在哪个端口上干什么由本节说清；怎么起、怎么改由运行环境定（见 §2.1）。

### 2.1 改运行环境（pm2）

- **pm2 管的服务不要裸 `kill`** ✗ —— pm2 会把**同一个配置再拉起来**；改行为用 `pm2 restart <name> --update-env`（再 `pm2 save` 存住）。
- **要改行为，改环境变量再 `pm2 restart`** ✓：`YAO_SERVER_HOST=… pm2 restart cui-dev --update-env`
  （`--update-env` 让新变量进进程）；要跨重启保留，再 `pm2 save` ✓。
- **测一个 dev server 前先确认端口空** ✓：`lsof -nP -iTCP:<port> -sTCP:LISTEN` ——
  否则 curl 会打到**上一次没杀干净的**服务上，**结论全假** ✗（代理"不生效"就可能是旧进程在答）。
- **只杀自己起的那个 PID** ✗：**不要顺着父进程往上杀** —— 会连自己所在的进程层一起杀掉。

### 2.2 产物预览的代理（5200 · 待做）

- `cui-dist` **就是 `vite preview`** —— 预览里 `/v1/…` 与 `/.well-known` 与 dev 一致（它继承 `server.proxy`）。
- **正解是用 `vite preview` 的 `preview.proxy`**（官方机制 ✓，配置同样写在 `vite.config.ts` ✓），**不要自己手搓代理** ✗。
- **待做**：`vite.config.ts` 现在只配了 `server.proxy`，**`preview.proxy` 尚未配**；在补上之前，5200 上的产物连不上后端。

## 3. 环境变量

| 变量 | 谁读 | 默认 | 用途 |
| --- | --- | --- | --- |
| `YAO_SERVER_HOST` | 开发代理的目标 | **必须给**（不给 = 不建代理 → 根路径 404）| 开发期后端地址（例 `http://…:5099`）|
| `CUI_BASE` | `vite.config.ts` | `app` | **命名空间**：base 与路由 basename 都取它（见 `04`）；根 `/` 不属于应用 |
| `CUI_BASE_URL` | `playwright.config.ts` · 拟人采集脚本 | 开发服务 `5199` · 拟人 `5200` | 测哪一份 |
| `CUI_HEADED` | 拟人采集脚本 | 空 | `=1` 开真窗口 —— 截图里才有浏览器 |
| `CUI_STEP_TIMEOUT` | 每层超时（`scripts/run-logged.mjs`）| `300` 秒 | 卡住时先看它 |
| `CUI_LOG_KEEP_DAYS` | 日志清理 | `14` 天 | 超期日期目录会被清 |

- **具体的后端地址不进文档、不进代码**：由运行环境给 —— 写进 **`packages/celadon/.env`**（**已 gitignore** ✓，
  例 `YAO_SERVER_HOST=http://<dev 后端>:5099`），或由 pm2 注入（见 §2.1）。

## 4. 本地引擎（可选）

- 桌面壳可以起本地引擎（见 `15` §6.2）；开发期也可以直接连远程后端 —— **切的是地址，不是代码路径**。
- 地址的持有与切换规则见 `15-platform.md` §4.2（一处持有 · 先验证再写入 · 换地址清凭据）。
