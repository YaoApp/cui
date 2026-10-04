# 03 · 数据层（`data/`）

- **版本**：v0.14（计划）
- **最后修改**：2026-10-04 16:09:23
- **说明**：三节 —— **00 代码结构**（先列长什么样）· **0 统一抽象**（要一起定的 7 项）· **1 业务接口清单**（逐域列表 + **WebSocket/流式单列**）
- **事实基础**：[data-legacy-openapi.md](data-legacy-openapi.md)（旧 `openapi/` 71 文件现状报告 · 临时）

> **规则**在 [`../architecture/05-data-and-api.md`](../architecture/05-data-and-api.md) 与 [`17-transport.md`](../architecture/17-transport.md)；本文只回答"先做什么、做到什么算完成"，**不复制规则**。
> **"怎么做"放第二阶段**：先把 §0 的抽象与 §1 的清单定下来，再谈逐域落地顺序。

## 00. 代码结构（先把"长什么样"列出来）

**一句话**：`data/` 只描述「**有哪些接口 · 进出是什么 · 怎么取**」；**发请求的能力全在 `platform/`**。

```text
app/src/
├── data/                         # 接口类型 + 取数（**只声明，不发请求**）
│   ├── index.ts                  # 对外唯一入口（按域再导出）
│   ├── types.ts                  # 公共类型：错误 · 列表/分页（§0 的 0.1–0.3）
│   ├── request/                  # **统一包装**：出站请求只在这里组装（普通请求与订阅同一套 ctx）
│   │   ├── context.ts            # ✅ 请求元数据：类型 `Context` + `context()` / `headers()` / `query()`（§0.4）
│   │   ├── send.ts               # ✅ 普通请求：路径 + 输入/输出 + ctx → 经 platform/transport → 解包裹
│   │   ├── invalidate.ts         # ✅ 前缀失效 + `keyOf`（订阅侧与失效侧同一算法）
│   │   ├── sse.ts                # ⏸ 订阅（SSE）包装：解析 · 重连 · 可续传
│   │   ├── socket.ts             # ⏸ 订阅（WS）包装：双向 · 心跳 · 退避 · 命令应答
│   │   └── channels/             # ⏸ **四条通道的消息形状**（只有形状，没有连接）
│   │       ├── types.ts          # 统一事件形状与事件名（留「序号 / 可否续传」字段）
│   │       ├── chat.ts           # ① 对话流：消息 DSL（从旧 chat/types.ts 搬）
│   │       ├── events.ts         # ② 系统事件：{type, data}（旧 events/useEventStream）
│   │       ├── task.ts           # ③ 任务 WS：命令 read/history/run/retry/repeat/stop/cancel 的类型
│   │       └── vnc.ts            # ④ VNC / 沙箱：通道地址与握手（旧 computer/sandbox）
│   ├── utils/                    # **所有接口共有的不标准**只在这里兜（跟业务无关的三件）
│   │   ├── unwrap.ts             # ✅ 成功包裹：`{data}` / 裸对象 → 一种形状（§0.3）
│   │   ├── paginate.ts           # ✅ 分页归一：引擎的标准键 → `Page`（§0.2）
│   │   └── failure.ts            # ✅ 服务端错误体 → `Failure`（两级消息，§0.1）
│   ├── hooks/                    # **钩子只此一处**
│   │   ├── use-request.ts        # ✅ 查询 / 提交：`idle/loading/ok/error` · 取消 · 重跑（唯一实现）
│   │   ├── use-sse.ts            # ⏸ 订阅（SSE）：事件解析 · 重连 · **可续传**（Last-Event-ID）
│   │   └── use-socket.ts         # ⏸ 订阅（WS）：**双向** · 心跳 · 退避重连 · 命令应答关联
│   ├── helloworld/               # ✅ **脚手架**：第一个端到端样板（见 §1.1）
│   ├── test/                     # ✅ 引擎测试模式的 7 条声明（登录 / 造键 / 列用户…）
│   ├── user/                     # ✅ 起了头：只有 `logout` 一条（真实域与 credential 联动的样板）
│   ├── setting/ · agent/ · workspace/ · llm/ · mcp/ · sandbox/ · computer/ · nodes/ · app/ · captcha/ · file/   # ⏸
└── platform/
    ├── service/                  # ✅ 服务地址：`base.ts`（构建期或**宿主给的**，惰性取一次）· `info.ts`（读 well-known）
    ├── credential/               # ✅ 凭据载体 + `scope.ts`（**键按服务 origin 分账**：协议+域+端口，路径不计）
    └── transport/                # **唯一出口**：fetch / 上传 / 下载 / SSE / WS（能力都在这）
        ├── fetch.ts · errors.ts  # ✅ 已在（两宿主一种接口；浏览器侧先判跨域）
        ├── stream.ts             # ⏸ 待做：SSE 接线（解析归这，形状归 data/request/channels）
        └── socket.ts             # ⏸ 待做：WS 连接 · 心跳 · 重连 · 鉴权（**只有这一处**）
```

**钩子（hook）分几种 · 放哪** —— **这是结构问题**：钩子的位置由**它依赖哪一层**决定，**不是所有钩子塞进一个 `hooks/`**。

| 种类 | 放哪 | 依赖 | 例 |
| --- | --- | --- | --- |
| **取数钩子** | `data/hooks/use-request.ts` | `platform/transport` + 该域类型 | 加载 / 错误 / 取消 / 重试（四态**唯一实现**）|
| **订阅钩子（SSE）** | `data/hooks/use-sse.ts` | `transport/stream.ts` | 订阅一条单向事件流 · 重连 · 续传 |
| **订阅钩子（WS）** | `data/hooks/use-socket.ts` | `transport/socket.ts` | 订阅双向通道 · 心跳 · 退避 · 能发命令 |
| **交互钩子** | `components/`（**就近**，跟着用它的人）| 只依赖 React | 开合、焦点陷阱、合并 ref |
| **状态钩子** | `stores/`（store 自己导出选择器/动作）| store 内部 | 主题 · 语言 · 导航 |
| **宿主 / 环境钩子** | `platform/<域>/` | 宿主能力（bridge · client · service）| 页标题（`07 §2` 已定）· 客户端能力 · 服务信息 |

**在 `data/` 里，动作只有三种**：**查询** · **提交** · **订阅**（订阅按协议分 **SSE / WS** 两个钩子，见上表）——

- **查询与提交共用 `use-request.ts`**（提交＝手动触发那一次），**不再写第二个实现**
- **订阅**走 `hooks/use-sse.ts` / `hooks/use-socket.ts`（**形状**在 `data/request/channels/*`，连接/心跳/重连在 `transport/`）

**做事的顺序**：`transport/{stream,socket}.ts`（接线）→ `request/{sse,socket}.ts`（组装）→ `hooks/{use-sse,use-socket}.ts`（React 薄壳）—— **包装没做好，钩子写不出来**。

**SSE 与 WS：对外合一，对内分二**（**别合成一个实现**）

| | **SSE**（`stream.ts`）| **WS**（`socket.ts`）|
| --- | --- | --- |
| 方向 | **单向**（服务端 → 客户端）| **双向** |
| 协议 | 就是 HTTP（`text/event-stream`；GET/POST 都能开）| 独立协议（`ws(s)://`，HTTP 升级握手）|
| 鉴权时机 | **跟普通请求一样**（Cookie 自动带；桌面靠宿主）| **只在握手期**（升级后改不了；token 只能走 query/子协议/首帧）|
| 重连 | `EventSource` 自带；**手写的 fetch 流要自己实现** | **必须自己实现**（心跳 + 退避 + 重订阅）|
| 续传 | 有 `id:` / `Last-Event-ID` 可续 | **没有** → 要自己定序号与补偿 |
| 代理 / 缓冲 | HTTP 语义，**要关缓冲**（dev 代理已 `ws: true`，SSE 另需响应头）| 需要升级放行 |
| 命令型 | 无 | **有**（任务 WS 要"请求-应答关联"）|

**所以：对外也分开**（差异太大，**合成一个钩子就是漏抽象**——一个 API 要同时容忍"能发命令"和"能续传"，两边都不好用）：

| | 钩子 | 接线 | 它的独有语义 |
| --- | --- | --- | --- |
| **SSE** | `data/hooks/use-sse.ts`（包装在 `data/request/sse.ts`）| `transport/stream.ts` | 单向 · 原生/手动重连 · **`Last-Event-ID` 可续** |
| **WS** | `data/hooks/use-socket.ts`（包装在 `data/request/socket.ts`）| `transport/socket.ts` | **双向（能发命令）** · 心跳 + 退避 · **无内建续传** · 握手期鉴权 |

**共用的只有形状**：`data/request/channels/{types,chat,events,task,vnc}.ts` —— `types.ts` 留「**序号 / 可否续传**」字段（SSE 有、WS 没有）。

**后端不标准处的转换**（这一层必须有这个位置）：**公共的进 `utils/`，跟业务的跟域走。**

| 转换 | 放哪 | 为什么 |
| --- | --- | --- |
| **解包裹**（`{data}` / 裸对象）· **分页归一** · **错误体收口** | `data/utils/`（三件）| 所有接口**共有**的不标准 |
| **字段命名 · 时间格式 · 枚举值** | **该域的 `map.ts`**（**需要时才加**）| **跟业务走**：用户域的名字/时间跟助手域不一样，塞进公共 utils 会变成一锅粥 |

- 规矩：**每个域最多一个 `map.ts`**，转换不许散进组件；上层拿到的类型是**干净的**；后端改标准**只删/改对应那一处**
- 旧代码的反面教材：解包裹散 **4 处** · 分页名 **4 套** · 字段映射在页面里又包一层（`kanban/services/api.ts` 336 行）

**每个域默认五件**（实做定下来的形状；**需要转换时加 `map.ts`** —— 至今三个域都没用到）：

| 文件 | 放什么 | **不许出现** |
| --- | --- | --- |
| `types.ts` | 手写类型（从旧类型搬，收 `any`）| — |
| `api.ts` | **方法声明**：路径常量 + 输入/输出类型 | `fetch` · `Authorization` · cookie · 自拼 URL · 旧助手 `GetData`/`IsError` |
| `keys.ts` | **key 归域层**：族根 + 每接口一条（键只在这算，见 §0.5）| 在 feature 里手拼 key |
| `queries.ts` | `{ key, request }` 成对（`useRequest(...Query(), …)` 直接用）| 在 feature 里拼 key + request |
| `index.ts` | 该域的导出 | 跨域 re-export 一大坨 |

**边界（谁 import 谁）**：

| 方向 | 允许 | 依据 |
| --- | --- | --- |
| `features/` · `components/` · `routes/` → `data/` | ✅ | 上层通过**域**与**钩子**取数 |
| `data/` → `platform/` | ✅ | 出口与凭据都在平台层 |
| `data/` → `features/` · `components/` · `pages` | **❌** | 旧代码反向 import 页面层 **6 处**，是反面教材 |
| 组件 / feature 里 `fetch` · `EventSource` · `new WebSocket` | **❌** | 门禁（§3）|

**旧 → 新的搬法**：

| 旧 | 新 |
| --- | --- |
| `openapi/<域>/types.ts` | `data/<域>/types.ts` —— **直接搬** |
| `openapi/<域>/api.ts` | `data/<域>/api.ts` —— **只留路径与类型**，实现重写 |
| `openapi/chat/types.ts` 的消息 DSL | `data/stream/chat.ts` |
| `openapi/helloworld.ts` | `data/helloworld/` —— **脚手架** |
| `openapi/openapi.ts` · `headers.ts` · `lib/` | **丢弃** —— 能力归 `platform/transport/` |

## 0. 统一抽象（第一阶段的一半）

**目的**：`data/` 这一层长什么样，一次定清；上层只 import 到域，**看不到** URL 拼接 / `fetch` / cookie / 错误分支。

| # | 要统一的 | 要定什么（**旧代码怎么凑合的**）| 落点 | 状态 |
| --- | --- | --- | --- | --- |
| 0.1 | **错误形状** | **已按引擎对齐**：引擎错误体就是 **OAuth 形状** `{error, error_description, error_uri, state, reason, required_scopes, missing_scopes}`（`yao/openapi/oauth/types/types.go:35-45`）——**引擎没有字段级 `fields`/`errors`**（校验信息只拼在 `error_description` 里）→ 我们**不编**结构化字段错误；消息**分两级**：上层 = `code`+`params`（应用按码翻译）+ `message`（由码算的**兜底**）、底层 = `rawMessage`（引擎原文，**不许上屏**） | `data/types.ts` + `utils/failure.ts` | ✅ **已实现** |
| 0.2 | **列表 / 分页** | **已按引擎对齐**：标准键 `data, page, pagesize, pagecount, next, prev, total`（`yao/openapi/agent/assistant.go:184-195`）；chat 会话在 `group_by` 时给 `groups` 而非 `data` | `data/types.ts` + `utils/paginate.ts` | ✅ **已实现** |
| 0.3 | **成功包裹** | 有没有信封；列表 `data` 与实体 `data` 怎么区分（旧：`result.data \|\| result` 反复兜）| 同上 | ✅ **已实现**（`utils/unwrap.ts`）|
| 0.4 | **请求元数据（ctx）** | 语言 / 主题 / 客户端 / 服务怎么带 —— **由统一包装 `request/` 一处注入**：调用时**自动取平台当前值**（`platform/client/context.ts` 的 `currentPreferences()`，读 store，不依赖 React），**只有要覆盖时才传** `preferences`（旧：locale 走 query · `X-Yao-Accept` 头 · 三来源凑 CSRF，散在各处）| `data/request/context.ts`（+ `platform/`）| ✅ **已实现** |
| 0.5 | **取数与订阅钩子** | **声明式钩子**：`useRequest(request, { key?, body?, manual? }) → { state, run }`（四态 `idle/loading/ok/error` · 取消 · 重跑的唯一实现；`run(body?)` 的 Promise **在 state 提交后** resolve，**并把这次的结果回传**（调用方在**动作里**接着做下一步 —— 如登录成功后交给会话 —— 不需要写副作用）；**查询与提交共用**）。**key 由声明推出**（`keyOf(request)` = `[method, path]`），**由域层 `keys.ts` 收口**（族根 + 每接口），**订阅侧与失效侧同一算法**（各算一份会静默不生效）。**`invalidate(prefix)` 前缀失效**：模块级登记表，key 以 prefix 开头就重跑。失败在 `state.failure.text`，**已用平台 i18n 按码翻译**（缺翻译仍回退英文诊断 + 警告）。**不做**：缓存（值由各钩子持有，够用）· 去重（同一份数据两处用由调用方提升共享）· 焦点/重连再取（与这份数据的身份无关）· 乐观更新（提交后由 `invalidate` 再取）· 重试（策略在出口之上，`17 §2.1`）。订阅按协议分两个 | `data/hooks/use-request.ts` · `data/request/invalidate.ts` · `data/<域>/{keys,queries}.ts` | ✅ **已实现**（`use-sse` / `use-socket` **待 transport 两个接线**，见 0.6）|
| 0.6 | **出口接线** | 一切经 `platform/transport/`；上传/下载/SSE/WS 各归哪一档（`17 §2.2` 三档：`api`/`download`/`stream`）。**SSE 与 WS 同属 `stream` 档，但接线分两处**（见上表）| `platform/transport/{stream.ts,socket.ts}` | ⏸ **仍未做**（`stream.ts`/`socket.ts` 都不在；`data/request/{sse,socket}.ts` 与两个订阅钩子同样待做）|
| 0.7 | **类型的组织** | 一域一处；类型与方法同文件还是分开；子域（如 `agent/robot`）怎么放（旧：`<域>/types.ts` + `<域>/api.ts` + barrel，且**反向 import 页面层 6 处**）| `app/src/data/<域>/` | ✅ **已定**：一域五件（`types`/`api`/`keys`/`queries`/`index`），`data/` 里零 `any` |
| 0.8 | **单条（详情）与列表的关系** | **单条不造壳**：服务端同样是 `{data:T}`，`unwrap` 就够；**列表行与详情是否分两个类型按域定**（引擎列表通常就是实体本身），**不预先抽象** | `data/types.ts`（注释）· 各域自己 | ✅ **已定** |

**验收（第一阶段）**：`05 §7` 的未定项逐条**变成已定**（每条有落点）· `data/` 的类型新增**零 `any`** · `features/`/`components/`/`routes/` 里**零** `fetch` / `EventSource` / `new WebSocket` · 四态只有一处实现 · **先拿 `helloworld` 做端到端样板**（它就是对接脚手架，见 §1.1），再拿 `user` 做真实域（与 `credential/` 联动最紧）。

## 1. 业务接口清单（第一阶段的另一半）

> **量级**：旧客户端 71 个 `.ts` / **12,444 行** / 约 **363 个 async 方法**；结论是**约等于重写**——能从旧代码带走的只有**类型**与**协议知识**。
> **已弃用、不迁移**（2026-10-04 定）：**`kb` · `job` · `trace` · `agent/robot`** —— 连同它们的类型（`kb/types.ts` 810 · `job/types.ts` 247 · `trace/types.ts` 98 · `agent/robot/types.ts` 563）与流式通道（机器人 SSE · trace `EventSource`）一并从清单移除。

### 1.0 现状（2026-10-04 核）

**已落地**（`app/src/data/`，共 3 个域）：

| 域 | 落了什么 | 备注 |
| --- | --- | --- |
| `helloworld` | 4 条声明（公开/受保护 × GET/POST）+ `keys` + `queries` | 脚手架；公开两条能真跑，受保护两条先失败再谈 |
| `test` | 7 条声明（`login/web` · `login/token` · `createServerKey` · `listUsers` · `listTeams` · `readOtp` · `readCaptcha`）| 引擎**测试模式**才有；开发实例用 |
| `user` | 1 条声明（`logout`：服务端吊销令牌并清 Cookie）| 真实域刚起头 |

组件侧：`features/data-check`（登录 + 接口调用 + 取数状态）与 `features/verify`（桥的自检页，含服务地址一节）都在用这套。

**还没做的**（按依赖排）：

1. **订阅三条线**：`transport/{stream,socket}.ts` → `data/request/{sse,socket}.ts` → `data/hooks/{use-sse,use-socket}.ts`（§0.6；`channels/` 四个形状同样没建）。
2. **登录 / 会话**（2026-10-04 起）：**已落地** —— 令牌写进载体（桌面 OS 凭据库 / Web 空操作）·
   出口按 origin 取出来附上 `Authorization`（有就带、不覆盖显式给的）· 401 **续期重放一次**（刷新能力注入）·
   "忘记这台服务"删该 origin 下所有用途的凭据。数据检查页登录成功后把令牌交给会话，入口启动读一次。
   **凭据自动装填（2026-10-04）**：收令牌归**登录动作**（按凭据载体选端点，成功后平台收下）、
   丢凭据归**退出动作**（服务端吊销成功后清本机 `session` + `refresh`）；声明上没有通用标记，其它接口不管凭据。
   登录端点由数据层按 `credentialCarrier()` 选，业务层只调一个 `login`。
   **还差**：引擎真登录（`/user/entry/*` 那套 OTP/邀请/两步）与刷新端点的声明 —— 现在用的是引擎**测试模式**的
   `login/token`；另：会话的**公共 store**（`stores/session.ts`，`06 §2.3`）等真登录进来再加。
3. **其余 12 个业务域**：setting · agent · workspace · llm · mcp · sandbox · computer · nodes · app · captcha · file（§1.1 的清单照旧；`kb`/`job`/`trace`/`agent/robot` 已弃用不迁）。
4. **门禁**：`features/`/`components/`/`routes/` 里"零 fetch / EventSource / new WebSocket"这条**还没有检查器**（§3 第一条仍未勾）——`check-import-boundaries.mjs` 只管依赖方向。

### 1.1 普通接口（按域）

| 域 | 旧位置 | 方法数（约）| 行数 | 判定 | 备注 |
| --- | --- | --- | --- | --- | --- |
| user | `user/{auth,api,account,credits,mfa,preferences,profile,subscription,teams}.ts` | ~90 | 1,456 | **改写** | `auth.ts` 两步登录/JWT 与 `credential/` 联动 |
| setting | `setting/api.ts` | ~55 | 296 | **改写** | 唯一依赖 `@umijs/max` 取 locale（`:1/:87`）|
| agent | `agent/{assistants,boards,call,inbox,tags,tasks}.ts` | ~60 | 762 | **改写** | 子域 `robot/` **已弃用，不迁移** |
| workspace | `workspace/api.ts` | ~30 | 210 | **改写** | `ContentURL` 自拼地址（`:13` 反向 import 页面）|
| llm | `llm/api.ts` | ~6 | 59 | **改写** | |
| mcp | `mcp/api.ts` | ~4 | 28 | **改写** | `data \|\| []` **吞错**（`:19`）|
| sandbox | `sandbox/api.ts` | ~8 | 82 | **改写**（域去留待定）| 混了盒管理/exec/心跳/VNC |
| computer | `computer/api.ts` | ~4 | 76 | **改写** | 含 VNC WS 地址拼装 |
| nodes | `nodes/api.ts` | 1 | 15 | **改写** | 反向 import `pages/*`（`:3`）|
| app | `app.ts`（GetMenu）| 1 | 31 | **改写** | 反向 import `@/types`（`:3`）|
| captcha | `captcha.ts` | ~2 | 80 | **改写** | 几乎可搬 |
| file | `file.ts` | ~12 | 655 | **改写** | 分片协议留、实现重写（见 §1.2/1.4）|
| **helloworld** | `helloworld.ts` | 2–3 | 32 | **保留（脚手架）** | **对接时的脚手架**：联通/自检冒烟用；新层拿它做**第一个端到端样板**（跑通类型 → 出口 → 钩子 → 页面）|
| **小计** | **27 个 api 文件** | **≈277** | **≈3,130** | | （已减去 4 个弃用域；helloworld 保留作脚手架）|

### 1.2 **WebSocket / 流式接口**（别漏，共 6 条通道）

| # | 通道 | 旧位置 | 协议形态 | 行数 | 判定 |
| --- | --- | --- | --- | --- | --- |
| 1 | **chat 对话流** | `chat/api.ts:210–261` | SSE-over-POST（手写逐字节解析 `data:` / `[DONE]`）| ~110 | **改写** → `transport/stream` |
| 2 | **系统事件 WS** | `events/useEventStream.ts:36` | `WebSocket` 单例 + 心跳（`:129`）+ **指数退避**（`:144`）+ `type`/`*` 分发 | 197 | **改写**（重连归 `transport/`）|
| 3 | **任务 WS（命令协议）** | `pages/kanban/hooks/useTaskWS.ts:29–87` | `WebSocket` + 命令 `read/history/run/retry/repeat/stop/cancel` + **重复的 `buildWSUrl`** | ~360 | **需清点**（在 `openapi/` **之外**，属旧应用层）|
| 4 | **VNC / 沙箱 WS** | `computer/api.ts` + `sandbox/api.ts:42–67` | WS 地址拼装（盒/心跳/exec）| ~120 | **改写** |
| — | 另有裸 WS | `pages/task-settings/.../TaskApiAccess.tsx:57` | 直接 `new WebSocket` | — | **丢弃/归并** |
| **小计** | | | | **≈790** | （已减去机器人 SSE 与 trace）|

**形状落点**：① → `data/request/channels/chat.ts` · ② → `events.ts` · ③ → `task.ts` · ④ → `vnc.ts`；
**接线落点**（连接 · 心跳 · 重连 · 鉴权）：`platform/transport/stream.ts` + `socket.ts`（**待做**，见 §00 树）；
**包装落点**：普通请求 `data/request/send.ts` · SSE `data/request/sse.ts` · WS `data/request/socket.ts`；
**钩子落点**：① → `data/hooks/use-sse.ts` · ②③④ → `data/hooks/use-socket.ts`（SSE 是单向流，其余三条是双向通道）。

**这 4 条要一起定的**：统一事件形状与事件名 · 命令型 WS 的请求类型 · 重连/心跳只在一处（`transport/`）· 鉴权怎么带上。

### 1.3 类型清单（**可直接搬**，约 3,500 行）

| 类型文件 | 行数 | 判定 |
| --- | --- | --- |
| `chat/types.ts` + `chat/guards.ts` | 1,018 + 123 | **直接搬**（消息 DSL + 纯守卫；统一分页、收 `any`）|
| `user/types.ts` | 1,009 | **直接搬**（去 3 处 `any`）|
| `agent/types.ts` | 512 | **直接搬**（去 `any`；`agent/robot` 已弃用）|
| `setting/types.ts` | 440 | **直接搬** |
| `llm/types.ts` · `mcp/types.ts` · `sandbox/types.ts` | 90+33+40 | **直接搬** |
| 核心 `JWK/JWKs`（`types.ts:201–345`）· `File*`（`:52–181`）| ~275 | **直接搬**（`File*` 归 `data/file`）|
| `chat/README.md`（协议说明）| 3,555 | **仅参考**，不进代码 |

### 1.4 明确丢弃（实现不要，只留知识）

`openapi.ts`(632) · `headers.ts`(66) · `lib/utils.ts`(52) · 19 个 barrel/shim(67) · `events/eventStore.ts`(91)
另：**同一件事的多份实现**——**4 处下载**（`file.ts:206` · `hooks/useFileDownload.ts` · `utils/fileWrapper.ts`）· **2 处上传**（`file.ts:353,519`）· **2 套流式**（机器人/trace 已弃用） · **2 条 `buildWSUrl`**：**实现丢，协议知识留**。

### 1.5 清单顺带要定掉的（**回写 `05 §7`**）

1 列表/分页形状 · 2 服务端错误体 · 3 成功包裹 · 4 流式事件形状 · 5 上传/下载入口 · 6 换服务后的缓存与在途请求 · 7 类型文件划分 · 8 钩子四态 · 9 `sandbox` 域去留 · 10 Web 端"查会话"端点 · 11 CSRF 是否仍需要（若需要只能注入在 `transport/`）· 12 请求元数据载体。

## 2. 第二阶段（**待 §0/§1 定完再写**）

写什么：逐域落地顺序 · 样板域选谁（建议 `user`）· 旧调用点怎么替换（旧应用 150 个文件 import 它，**新应用不做这种散落**）· 与 `credential/`（登录/查会话）和 `transport/` 两档（下载/流式）的接口划分 · 用例与门禁的落地方式。

## 3. 门禁（随实现长）

- [ ] **组件 / feature 不发请求**：`features/` · `components/` · `routes/` 里不许出现 `fetch` / `EventSource` / `new WebSocket`（配正反样本）
- [x] 依赖方向：已有 `scripts/check-import-boundaries.mjs`（`data/` 不许 import `features/`）
- [x] `data/` 的类型新增 **零 `any`**（`grep -rn ": any" app/src/data` 无命中）；分页/包裹各只有一处（`utils/{paginate,unwrap}.ts`）

## 4. 完成口径

一项做完 = **实现 + 用例（单测/浏览器，按 `SPEC.md` §8）+ `pnpm check` 通过 + 回写 `05`**；交付前按 [`REVIEW.md`](../architecture/REVIEW.md) 走一轮隔离审核。
