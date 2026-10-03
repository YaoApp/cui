# 旧 OpenAPI 对接代码 · 现状报告（**临时工作稿**，做完 `data/` 后可删）

- **范围**：`packages/cui/openapi/**` —— 71 个 `.ts`（**12,444 行**）+ `chat/README.md`（3,555 行协议说明），合计 15,999 行
- **对照**：`architecture/05-data-and-api.md` · `15-platform.md` · `17-transport.md`
- **日期**：2026-10-04 · **性质**：临时（为 `plan/03-data.md` 提供事实基础）

## 0. 一句话结论

**不值得整体移植，也不值得整体重写。** 值钱的是**手写类型**与**协议知识**：
- **约 4,900 行手写类型**（`chat/types.ts` 1,018 + 10 个域 `types.ts` 3,842）+ **123 行纯类型守卫** → **可直接搬**
- **约 900–1,000 行逻辑**（分片上传协议 · SSE 解析 · WS 客户端 · 两步登录/JWT）→ **参照重写**
- `openapi.ts`(632) + 30 个 `*/api.ts`(4,677) + barrel(67) **丢弃** —— 它们实现的是"一个类自己调 fetch、自己读 cookie、自己拼 URL"的旧范式，与 `17 §1`（唯一出口）· `15 §4`（前端不碰凭据）正面冲突

## 1. 体量与分布

| 部分 | 行数 | 说明 |
| --- | --- | --- |
| 类型（10 域 + 核心）| 5,205 | 手写，**无生成脚本**（无 codegen、无 `openapi.json` 痕迹）|
| 域 API 逻辑（30 文件）| 4,677 | `agent/ kb/ user/ setting/ job/ …`，约 **363 个 async 方法** |
| `chat/` | 1,817 | 消息 DSL 1,018 + API 672 + 守卫 123 |
| `file.ts` | 655 | 单文件/分片上传 + 下载（4 处下载实现之一）|
| `events/` | 291 | WS 单例（心跳 + 指数退避）|
| 传输核心 `openapi.ts` + `headers.ts` + `lib/` | 750 | 五份 fetch + cookie/CSRF + 解包 |
| barrel / shim | 67 | 19 个 |
| `chat/README.md` | 3,555 | 协议说明（仅参考，不进代码）|

**17 处绕过封装的裸请求**：`chat/api.ts:190,327,402,432,473,507,567,612,654` · `agent/robot/robots.ts:422` · `file.ts:211,449,525` · `trace/api.ts:46`（EventSource）· `events/useEventStream.ts:36`（WebSocket）；`openapi/` 之外另有 2 处（`pages/kanban/hooks/useTaskWS.ts:359`、`pages/task-settings/.../TaskApiAccess.tsx:57`）。

## 2. 请求怎么发

- **底层只有一处**：`openapi.ts` 的五份 fetch（GET `:240` · POST `:271` · PUT `:314` · DELETE `:353` · Upload `:373`），都带 `credentials: 'include'`
- **基址**：`OpenAPIConfig.baseURL`（`types.ts:5`）由调用方注入；实例化在 `context/app/model.ts:148–161` 三分支（`well-known.openapi` → `app_info.openapi` → 兜底 `/v1`）。**确实读了 `/.well-known/yao`，但用的是同步 XHR**（`services/wellknown.ts:43–67`，`xhr.open(..., false)` `:46`）**且在启动时就读**，结果缓存进 `localStorage`（`context/app/model.ts:99`）—— 与 `15 §3`「第一次需要时读一次」相反；**没有用 `platform/service/`，没有 `transport/`**
- **请求头**：`headers.ts` 只是 `Headers` 链式包装，无统一注入；CSRF 头 `X-CSRF-Token` 由**三来源凑**（cookie → localStorage → meta，`openapi.ts:527–568`）
- **超时/重试**：`OpenAPIConfig.timeout`（`types.ts:6`）**声明了但从未使用**；全仓无重试；仅流式用 `AbortController`
- **上传**：单文件 FormData 或 **>2MB 自动分片**（`file.ts:51`），XHR + `Content-Range/Content-Sync/Content-Uid`（`:498–500`）+ `xhr.upload.progress`
- **下载**：`fetch` 后 `response.blob()` **整份进内存**（`file.ts:211–216`）—— 与 `17 §2.2`「下载不整份进内存」冲突；**共 4 处下载实现**
- **流式**：SSE-over-POST **手写解析两份**（`chat/api.ts:210–261` · `robots.ts:445–477`）· `EventSource` 一处（`trace/api.ts:46`，预列 12 事件名）· `WebSocket` 一处（`events/useEventStream.ts:36`，心跳 `:129` + 退避 `:144`）；另有 **两条重复的 `buildWSUrl`**

## 3. 鉴权（与 `15 §4` 的异同）

- **两步登录** ✓ 方向一致：`EntryVerify`（拿一次性临时 token，`user/auth.ts:43`）→ `EntryLogin`/`EntryRegister`（**显式 `Authorization: Bearer <临时>`** 换正式凭据 `:51–65`）
- **载体方向一致**：**Web 用 Cookie**（`__Secure-`/`__Host-` 校验 `openapi.ts:512–524`）
- **但三处与规范冲突**：① **前端读 cookie 判登录**（`IsAuthenticated` → `api.AccessToken()` → `getSecureCookie`，`user/auth.ts:398` + `openapi.ts:384–400`）—— HttpOnly 根本读不到，**这段是死逻辑**；② **写 `localStorage` 存 CSRF/清令牌**（`openapi.ts:595–610`）；③ **前端验 JWT**（`GetJWKs` + `jose.jwtVerify`，`user/auth.ts:193–276`；无 `crypto.subtle` 时**跳过验签只解码** `:201–204`）
- **刷新：完全没有**（无 refresh 接口、无定时器）

## 4. 失败与类型

- **错误形状**：`ApiResponse<T> = { data?, error?, status, headers }`（`types.ts:45–50`）；`ErrorResponse` 是 **OAuth 形状** `{error, error_description?, …}`（`:20–29`）；非 OAuth 回落 `http_error`/`parse_error`（`openapi.ts:172–196`）—— **与 `17 §2` 的 `{code, params, message}` 不是一种形状**
- **成功包裹不统一**：有的 `{data:...}`、有的裸对象 → 旧代码反复 `result.data || result`（`chat/api.ts:448,583,628,670`）；`mcp/api.ts:19` 直接 `data || []` **吞错**
- **类型来源**：**全部手写** ✓（与新规范一致）；宽松处集中：`kb/types.ts` 16 · `chat/api.ts` 12 · `job/types.ts` 11 · `robot/types.ts` 10 · `chat/types.ts` 9 处 `any`/`@ts-ignore`
- **分页四套命名**：`page/pagesize/pagecount`（agent/chat）· `pagecnt`（kb）· `total/page/pageSize/totalPages`（file）· `offset/next_offset`（kb 分段）
- **流式三套并存**：chat `Message` DSL · trace 具名 SSE · events `{type,data}` + 任务 WS 命令协议

## 5. 旧应用怎么用它（耦合程度）

- **调用极散**：约 **150 个文件** `from '@/openapi...'`（`pages/settings` 62 · `pages/mission-control` 38 · `pages/kb` 28 · `pages/auth` 13 …）；**`window.$app.openapi` 545 处**、`new <API>(window.$app.openapi)` **98 处**
- **重复实现**：`pages/kanban/services/api.ts`(336) 与 `pages/inbox/services/api.ts`(139) 各自再包一层做字段映射（"翻译层叠翻译"）
- **反向依赖**（数据层依赖应用层 ✗）：`openapi/nodes/api.ts:3` · `sandbox/api.ts:4` · `workspace/api.ts:13` · `app.ts:3` · `chat/api.ts:2` · `setting/api.ts:1`（`@umijs/max`）
- **四态手写 133 个文件**（`hooks/useRobots.ts` 615 行是典型）——无统一取数钩子
- **死代码/假数据**：`chatbox/services/mock.ts`（"最近会话"是 mock）· `services/loginMock.ts` 373 行

## 6. 逐域可移植性判定

> **弃用功能，不迁移**（2026-10-04 定）：`kb` · `job` · `trace` · `agent/robot` —— 下列表中仍照实记录它们的体量与判定，仅作事实留档。

| 域 | 行数 | 判定 | 理由 |
| --- | --- | --- | --- |
| `chat/types.ts` + `chat/guards.ts` | 1,141 | **直接搬** | 手写强类型 + 纯守卫（统一分页、收 `any`）|
| 其余 10 个域 `types.ts`（agent/robot/job/kb/llm/mcp/sandbox/setting/trace/user）| 3,842 | **直接搬** | 手写接口；去 `any`、统一分页 |
| 核心 `JWK/JWKs`（`types.ts:201–345`）+ `File*`（`:52–181`）| ~275 | **直接搬** | 纯结构；`File*` 归 `data/file` |
| 30 个 `*/api.ts`（含 `agent/robot/robots.ts` 483）| 4,677 | **需改写** | 路径+方法+类型可用 → 落成声明式 `data/`，去掉 `OpenAPI` 类/`GetData`/自拼 URL |
| `file.ts` 分片上传协议（`:353–514`）| ~160 | **需改写** | 协议知识有价值 → `transport/` 上传档 |
| `file.ts` 下载（`:206–241`）| ~35 | **需改写** | 不许整份进内存；桌面走宿主 |
| SSE 解析（`chat/api.ts:210–261` + `robots.ts:445–477`）| ~110 | **需改写** | 解析参照 → `transport/stream` |
| `events/useEventStream.ts` | 197 | **需改写** | 心跳/退避参照；重连归 `transport/` |
| `user/auth.ts` 两步登录 + JWT/JWKS | ~300 | **需改写** | 流程参照 → `credential/` + `data/user`（Web 不碰 token）|
| `openapi.ts` + `headers.ts` + `lib/utils.ts` | 750 | **丢弃** | 与 `17 §1`、`05 §1` 正面冲突 |
| `events/eventStore.ts` | 91 | **丢弃** | 直接操作旧 store |
| 19 个 barrel/shim | 67 | **丢弃** | 样板 |
| `chat/README.md` | 3,555 | **仅参考** | 协议说明 |

**带走量总结**：**≈4,900 行类型 + 123 行守卫**可直接搬；**≈900–1,000 行**逻辑参照重写；其余约 6,600 行由 `transport/` + 声明式 `data/` 覆盖。

## 7. 规范缺口（做 `data/` 必须先定 · 旧代码是怎么凑合的）

| # | 必须定 | 旧代码怎么凑合 |
| --- | --- | --- |
| 1 | **列表/分页形状**（一个包裹）| 四套命名并存（§4）|
| 2 | **服务端业务错误的 JSON 体**（与 `{code,params,message}` 的关系；字段级校验错误）| OAuth `{error,error_description}` + `http_error` 回落 |
| 3 | **成功包裹**（是否信封；列表 `data` 与实体 `data` 怎么区分）| `result.data \|\| result` 反复兜 |
| 4 | **流式事件形状与事件名**（含命令型 WS 的请求类型）| 三套并存 + 任务 WS 自带命令协议 |
| 5 | **上传/下载的前端调用面**（下载返回 `URL` 还是宿主命令 · 进度传递 · 分片归属）| 4 处下载、2 处上传各写一份 |
| 6 | **换服务后 `data/` 的内存缓存与在途请求**怎么办 | well-known 缓存进 `localStorage` 且**无失效路径** |
| 7 | **手写类型的文件划分**（类型/方法是否同文件 · 子域如 `agent/robot` 怎么处理）| `<域>/types.ts` + `<域>/api.ts` + barrel，且反向 import |
| 8 | **取数钩子的返回形状**（`05 §7` 未定项 1）| 133 个文件手写四态；`SPEC.md:95` 已给落点 `app/src/data/hooks/use-request.ts` |
| 9 | **`sandbox` 域去留**（`05 §7` 未定项 2）| `sandbox/api.ts:42–67` 混了盒管理/exec/心跳/VNC |
| 10 | **"查会话"端点**（`15 §4` 要求问服务端）| 旧代码没有这个调用，只能读 cookie |
| 11 | **CSRF 是否仍需要**（若需要，注入点只能在 `transport/`）| 三来源凑 `X-CSRF-Token` |
| 12 | **出站上下文载体**（locale/timezone/theme/client 怎么带）| 散落：locale 走 query、`X-Yao-Accept` 头、`setting/api.ts:87` 取 `getLocale` |

## 8. 证据索引（关键行）

- 传输：`openapi/openapi.ts:135–200,206–208,240–400,488–568,595–610`
- 基址：`openapi/types.ts:5–6` · `context/app/model.ts:95–105,148–161` · `services/wellknown.ts:43–67`
- 上传下载：`openapi/file.ts:51,100,206–241,353–514,519–597` · `hooks/useFileDownload.ts` · `utils/fileWrapper.ts`
- 流式：`openapi/chat/api.ts:155–269` · `agent/robot/robots.ts:356–483` · `trace/api.ts:40–92` · `events/useEventStream.ts:31–177` · `pages/kanban/hooks/useTaskWS.ts:72–87`
- 鉴权：`openapi/user/auth.ts:43–166,193–276,311–402` · `openapi/openapi.ts:512–524`
- 类型：`openapi/types.ts:20–50,145–156` · `chat/types.ts:420–470,927–933` · `agent/types.ts:256–268` · `kb/types.ts:160–164,427–444`
- 调用点：`grep -rl "from '@/openapi" packages/cui`（149 文件）· `context/app/model.ts:34,151` · `pages/kanban/services/api.ts` · `pages/inbox/services/api.ts`
- 反向依赖：`openapi/{nodes,sandbox,workspace}/api.ts` · `openapi/app.ts:3` · `openapi/chat/api.ts:2` · `openapi/setting/api.ts:1`
