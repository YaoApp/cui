# 03 · 数据层（`data/`）

- **版本**：v0.8（计划）
- **最后修改**：2026-10-04 07:26:15
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
│   ├── types.ts                  # 公共类型：错误 · 列表/分页 · 出站上下文（§0 的 0.1–0.4）
│   ├── hooks/
│   │   └── use-request.ts        # 取数钩子：加载 / 错误 / 取消 / 重试（**唯一实现**，§0.5）
│   ├── helloworld/               # **脚手架**：第一个端到端样板（见 §1.1）
│   │   ├── types.ts
│   │   ├── api.ts                # 方法声明：路径 + 输入/输出类型
│   │   └── index.ts
│   ├── user/                     # 真实域样板（与 platform/credential 联动）
│   ├── setting/ · agent/ · workspace/ · llm/ · mcp/ · sandbox/ · computer/ · nodes/ · app/ · captcha/ · file/
│   └── stream/                   # **四条通道的消息形状**（接线在 platform/transport，§0.6）
│       ├── types.ts              # 统一事件形状与事件名（四条共用）
│       ├── chat.ts               # ① 对话流：消息 DSL（从旧 chat/types.ts 搬）
│       ├── events.ts             # ② 系统事件：{type, data} 与事件名（旧 events/useEventStream）
│       ├── task.ts               # ③ 任务 WS：命令 read/history/run/retry/repeat/stop/cancel 的请求与应答类型
│       ├── vnc.ts                # ④ VNC / 沙箱：通道地址与握手（旧 computer/sandbox）
│       └── use-stream.ts         # ③ 订阅钩子：订阅一份流、取消、断线状态（**唯一实现**，与 use-request 并列）
└── platform/
    ├── service/                  # 服务地址（已在）
    ├── credential/               # 凭据载体（已在）
    └── transport/                # **唯一出口**：fetch / 上传 / 下载 / SSE / WS（能力都在这）
        ├── fetch.ts · errors.ts  # 已在
        ├── stream.ts             # 待做：SSE 接线（解析归这，形状归 data/stream）
        └── socket.ts             # 待做：WS 连接 · 心跳 · 重连 · 鉴权（**只有这一处**）
```

**钩子（hook）分几种 · 放哪** —— **这是结构问题**：钩子的位置由**它依赖哪一层**决定，**不是所有钩子塞进一个 `hooks/`**。

| 种类 | 放哪 | 依赖 | 例 |
| --- | --- | --- | --- |
| **取数钩子** | `data/hooks/use-request.ts` | `platform/transport` + 该域类型 | 加载 / 错误 / 取消 / 重试（四态**唯一实现**）|
| **订阅钩子** | `data/stream/use-stream.ts` | `platform/transport` 的 stream/socket | 订阅一条聊天/事件通道、取消、断线状态 |
| **交互钩子** | `components/`（**就近**，跟着用它的人）| 只依赖 React | 开合、焦点陷阱、合并 ref |
| **状态钩子** | `stores/`（store 自己导出选择器/动作）| store 内部 | 主题 · 语言 · 导航 |
| **宿主 / 环境钩子** | `platform/<域>/` | 宿主能力（bridge · client · service）| 页标题（`07 §2` 已定）· 客户端能力 · 服务信息 |

**在 `data/` 里，动作只有三种**：**查询** · **提交** · **订阅** ——

- **查询与提交共用 `use-request.ts`**（提交＝手动触发那一次），**不再写第二个实现**
- **订阅**走 `use-stream.ts`（形状在 `data/stream/*`，连接/心跳/重连在 `transport/`）

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

**所以**：
- **对外一个**：`data/stream/use-stream.ts`（订阅 / 取消 / 断线状态）——上层**不关心底下是哪种**
- **对内两个**：`transport/stream.ts`（SSE 解析 · 关缓冲 · 续传）· `transport/socket.ts`（升级 · 心跳 · 退避 · 命令应答）——**两套状态机不许搅在一起**
- **形状要能表达差异**：`data/stream/types.ts` 给"**序号 / 可否续传**"留字段（SSE 能续、WS 不能）

**每个域里就三件事**（与旧 `<域>/types.ts + api.ts + index.ts` 同形，**内容不同**）：

| 文件 | 放什么 | **不许出现** |
| --- | --- | --- |
| `types.ts` | 手写类型（从旧类型搬，收 `any`）| — |
| `api.ts` | **方法声明**：路径常量 + 输入/输出类型 | `fetch` · `Authorization` · cookie · 自拼 URL · 旧助手 `GetData`/`IsError` |
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
| 0.1 | **错误形状** | 服务端业务错误体字段 · 与 `transport/` 的 `{code,params,message}` 怎么接 · 字段级校验错误（旧：OAuth `{error,error_description}` + `http_error` 回落）| `data/` 公共类型 + `platform/transport/` | ⏸ |
| 0.2 | **列表 / 分页** | 一个包裹形状（旧：**四套命名** `pagecount`/`pagecnt`/`totalPages`/`next+prev`）| `data/` 公共类型 | ⏸ |
| 0.3 | **成功包裹** | 有没有信封；列表 `data` 与实体 `data` 怎么区分（旧：`result.data \|\| result` 反复兜）| 同上 | ⏸ |
| 0.4 | **出站上下文** | locale / timezone / theme / client 怎么带（旧：locale 走 query · `X-Yao-Accept` 头 · 三来源凑 CSRF）| 同上 + `platform/` | ⏸ |
| 0.5 | **取数与订阅钩子** | 加载 / 错误 / 取消 / 重试的**唯一实现**与返回形状；订阅（流式）与它并列（旧：**133 个文件手写四态**）| `data/hooks/use-request.ts`（查询+提交 · `SPEC.md:95`）· `data/stream/use-stream.ts`（订阅）| ⏸ |
| 0.6 | **出口接线** | 一切经 `platform/transport/`；上传/下载/SSE/WS 各归哪一档（`17 §2.2` 三档：`api`/`download`/`stream`）。**SSE 与 WS 同属 `stream` 档，但接线分两处**（见上表）| `platform/transport/{stream.ts,socket.ts}` | ⏸（卡 `17 §2.2` 两档未做）|
| 0.7 | **类型的组织** | 一域一处；类型与方法同文件还是分开；子域（如 `agent/robot`）怎么放（旧：`<域>/types.ts` + `<域>/api.ts` + barrel，且**反向 import 页面层 6 处**）| `app/src/data/<域>/` | ⏸ |

**验收（第一阶段）**：`05 §7` 的未定项逐条**变成已定**（每条有落点）· `data/` 的类型新增**零 `any`** · `features/`/`components/`/`routes/` 里**零** `fetch` / `EventSource` / `new WebSocket` · 四态只有一处实现 · **先拿 `helloworld` 做端到端样板**（它就是对接脚手架，见 §1.1），再拿 `user` 做真实域（与 `credential/` 联动最紧）。

## 1. 业务接口清单（第一阶段的另一半）

> **量级**：旧客户端 71 个 `.ts` / **12,444 行** / 约 **363 个 async 方法**；结论是**约等于重写**——能从旧代码带走的只有**类型**与**协议知识**。
> **已弃用、不迁移**（2026-10-04 定）：**`kb` · `job` · `trace` · `agent/robot`** —— 连同它们的类型（`kb/types.ts` 810 · `job/types.ts` 247 · `trace/types.ts` 98 · `agent/robot/types.ts` 563）与流式通道（机器人 SSE · trace `EventSource`）一并从清单移除。

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

**形状落点**：① → `data/stream/chat.ts` · ② → `events.ts` · ③ → `task.ts` · ④ → `vnc.ts`；
**接线落点**（连接 · 心跳 · 重连 · 鉴权）：`platform/transport/stream.ts` + `socket.ts`（**待做**，见 §00 树）。

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

1 列表/分页形状 · 2 服务端错误体 · 3 成功包裹 · 4 流式事件形状 · 5 上传/下载入口 · 6 换服务后的缓存与在途请求 · 7 类型文件划分 · 8 钩子四态 · 9 `sandbox` 域去留 · 10 Web 端"查会话"端点 · 11 CSRF 是否仍需要（若需要只能注入在 `transport/`）· 12 出站上下文载体。

## 2. 第二阶段（**待 §0/§1 定完再写**）

写什么：逐域落地顺序 · 样板域选谁（建议 `user`）· 旧调用点怎么替换（旧应用 150 个文件 import 它，**新应用不做这种散落**）· 与 `credential/`（登录/查会话）和 `transport/` 两档（下载/流式）的接口划分 · 用例与门禁的落地方式。

## 3. 门禁（随实现长）

- [ ] **组件 / feature 不发请求**：`features/` · `components/` · `routes/` 里不许出现 `fetch` / `EventSource` / `new WebSocket`（配正反样本）
- [x] 依赖方向：已有 `scripts/check-import-boundaries.mjs`（`data/` 不许 import `features/`）
- [ ] `data/` 的类型新增 **零 `any`**；分页/包裹**只有一种命名**

## 4. 完成口径

一项做完 = **实现 + 用例（单测/浏览器，按 `SPEC.md` §8）+ `pnpm check` 通过 + 回写 `05`**；交付前按 [`REVIEW.md`](../architecture/REVIEW.md) 走一轮隔离审核。
