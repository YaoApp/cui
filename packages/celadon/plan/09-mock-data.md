# 09 · Mock 数据、代理与契约

- **状态**：Mock Server 核心可用，自测 11/11，已含认证入口、Apps/Bots 目录、Session Branch 列表、详情、Ctrl 与 Data、会话设置 PATCH；开发网关、CUI 接线与认证随 08 Session 同期完成（2026-10-28 16:30）
- **范围**：CUI 开发网关、Mock Server、接口路由台账、Computer / Workspace / Session / Vault / LLM Provider 契约
- **目标**：Mock 与代理先行；一个入口、一套认证与 OpenAPI；每条接口明确走真实还是 Mock
- **依据**：`plan/08-session.md`、`design/product/notes/`、Tai Transport v2 的 Session / Data Plane 文档、`yao/llm` 与 `yao/openapi/llm` 当前代码

## 1. 结论

采用单一开发入口，不做第二个 Mock API 地址。

```text
CUI / Yao 测试应用
        │
        ▼
  CUI Dev Gateway（同源 /v1）
        ├─ real  → Yao
        ├─ mock  → Mock
        └─ auto  → Yao，404/501 时 Mock
```

- 请求路径、用户、Cookie、Bearer、OpenAPI 与错误格式保持不变。
- 测试应用也走同一网关，不需要为 Mock 改登录或接口地址。
- 每条接口在台账中显式声明；未登记的路径一律走真实 Yao，不自动 Mock。

## 2. 路由筛子

| 模式 | 含义 | 使用时机 |
| --- | --- | --- |
| `real` | 只走 Yao | 已实现且契约稳定 |
| `mock` | 只走 Mock | 后端未实现或正在重构 |
| `auto` | Yao 优先，404/501 回退 Mock | 临时过渡，必须写摘除日期 |
| `removed` | 台账已删除 | 后端验收通过后 |

台账 `mock/registry.ts` 每项包含：

```ts
{
  method: 'GET',
  path: '/v1/computers',
  mode: 'mock',
  owner: 'cui',
  scenario: 'computers',
  removeWhen: 'Yao /v1/computers 契约验收通过',
  addedAt: '2026-10-28'
}
```

- 只做精确方法 + 路径匹配，不做通配。
- 未登记路径默认 `real`。
- `mock` 不请求 Yao；`auto` 只对 404/501 回退；401、403、5xx 原样返回。
- 响应带 `X-CUI-Route: real|mock|fallback`；Mock 另带 `X-CUI-Mock: <scenario>`。
- `/__mock/routes` 展示台账、命中次数与待摘除项。

后端验收通过后：台账改 `real`，删除 handler / fixture / scenario，保留一条 `removed` 记录。

## 3. 认证与 OpenAPI

- 网关原样转发 Cookie 与 `Authorization`，不创建 Mock 专用登录。
- Mock 端点仍要求有效 Yao 会话；网关确认用户后，再把用户上下文交给 Mock。
- 测试应用与 CUI 使用同一账号、同一会话与同一资源权限。
- OpenAPI 仍以 Yao 为准；Mock 只补未实现路径，不另发客户端规范。
- WS 升级与 SSE 透传走同一网关，不单独开 Mock 域名。

## 4. 接口台账

### 4.1 基础与 Session

| 方法 | 路径 | 模式 | 状态 | 摘除条件 |
| --- | --- | --- | --- | --- |
| `GET` | `/.well-known/yao` | `real` | 现有 | 不适用 |
| `GET` | `/v1/events` | `real` | 现有全局 SSE | 不适用 |
| `GET` | `/v1/computers` | `mock` | 待后端 | Computer 列表契约验收 |
| `GET` | `/v1/workspaces` | `mock` | 待后端 | Workspace 列表契约验收 |
| `POST` | `/v1/sessions` | `mock` | 待后端 | Session 创建契约验收 |
| `UPGRADE` | `/v1/sessions/:id/ctrl` | `mock` | 待后端 | Ctrl WS 契约验收 |
| `UPGRADE` | `/v1/sessions/:id/data` | `mock` | 待后端 | Data WS 契约验收 |
| `GET` | `/v1/sessions/:id/branches` | `mock` | 待后端 | Branch 列表契约验收 |
| `POST` | `/v1/sessions/:id/branches` | `mock` | 待后端 | Branch 创建契约验收 |
| `GET` | `/v1/sessions/:id/branches/:branch_id` | `mock` | 待后端 | Branch 详情契约验收 |
| `UPGRADE` | `/v1/sessions/:id/branches/:branch_id/ctrl` | `mock` | 待后端 | Branch Ctrl WS 契约验收 |
| `UPGRADE` | `/v1/sessions/:id/branches/:branch_id/data` | `mock` | 待后端 | Branch Data WS 契约验收 |
| 其他 `/v1/*` | 未登记 | `real` | 默认 | 不适用 |

Data WS 路径不带 `turn_id`；`turn_id` 通过首帧或查询参数绑定，与后端设计一致。

### 4.2 Vault

| 方法 | 路径 | 模式 | 用途 |
| --- | --- | --- | --- |
| `GET` | `/v1/vaults` | `mock` | Personal / Team Vault 列表 |
| `GET` | `/v1/vaults/:vault_id/groups` | `mock` | 分组与密钥元数据 |
| `GET` | `/v1/vaults/:vault_id/secrets` | `mock` | 单条密钥元数据，可按 `group_id` 过滤 |
| `GET` | `/v1/sessions/:id/vault-grants` | `mock` | 当前会话授权 |
| `PUT` | `/v1/sessions/:id/vault-grants` | `mock` | 替换当前会话授权 |
| `POST` | `/v1/vaults/:vault_id/groups` | `mock` | 新建分组 |
| `PATCH` | `/v1/vaults/:vault_id/groups/:group_id` | `mock` | 修改分组 |
| `DELETE` | `/v1/vaults/:vault_id/groups/:group_id` | `mock` | 删除分组 |
| `POST` | `/v1/vaults/:vault_id/secrets` | `mock` | 新建密钥，值只写不读 |
| `PATCH` | `/v1/vaults/:vault_id/secrets/:secret_id` | `mock` | 修改密钥元数据或轮换 |
| `DELETE` | `/v1/vaults/:vault_id/secrets/:secret_id` | `mock` | 删除密钥 |
| `GET` | `/v1/vaults/:vault_id/audit` | `mock` | 授权与使用审计 |

所有 Vault 接口只返回名称、类型、范围、状态与引用，不返回密钥值。密钥值只在后端解析，不进入 CUI、Chatbox、日志或 Mock 响应。

### 4.3 LLM Provider

以 `yao/llm` 与 `yao/openapi/llm` 的当前代码为准；v2 是 Provider / Model / Role 的主接口，旧的 `/providers`、`/model-groups`、`/models` 与 `/chat/completions` 保留兼容。

| 方法 | 路径 | 模式 | 用途 |
| --- | --- | --- | --- |
| `GET` | `/v1/llm/model-groups` | `real` | 兼容的模型分组与 effort 档位 |
| `GET` | `/v1/llm/models` | `real` | OpenAI 兼容模型列表 |
| `POST` | `/v1/llm/chat/completions` | `real` | 测试应用的 OpenAI 兼容调用 |
| `GET` | `/v1/llm/v2/providers` | `real` | Provider 列表，API Key 已掩码 |
| `POST` | `/v1/llm/v2/providers` | `real` | 新建 Provider |
| `GET/PUT/DELETE` | `/v1/llm/v2/providers/:id` | `real` | Provider 详情、修改、删除 |
| `GET/POST` | `/v1/llm/v2/providers/:id/models` | `real` | 某 Provider 下的模型列表与新建 |
| `GET/PUT/DELETE` | `/v1/llm/v2/providers/:id/models/:model_id` | `real` | 模型详情、修改、删除 |
| `GET/PUT` | `/v1/llm/v2/roles` | `real` | 角色绑定读取与设置 |
| `GET` | `/v1/llm/v2/models` | `real` | 全部启用模型，带 Provider |
| `GET` | `/v1/llm/v2/resolve/:role` | `real` | 解析 default / heavy / light 等角色 |

- CUI 的模型选择读取 `/v1/llm/v2/models`；默认角色读取 `/v1/llm/v2/roles` 或 `/resolve/:role`。
- Provider API Key 只写不读；接口返回 `APIKey` 时必须保持掩码。
- CUI 不保存 Provider Key，不直接调用供应商。
- 测试应用继续使用 Yao 的 OpenAI 兼容入口；不另做一套 LLM 适配。
- 这些接口已由 Yao 实现，默认 `real`；若字段变更，先改 CUI 类型与契约样本，不进 Mock。

## 5. Vault 数据

```ts
Vault        { id, name, kind: 'personal' | 'team', team_id? }
VaultGroup   { id, vault_id, name, permission, secret_count }
VaultSecret  { id, vault_id, group_id?, name, kind, scope, status, last_used_at? }
VaultGrant   { group_ids: string[], secret_ids: string[] }
```

- 会话授权保存具体密钥引用；分组后来新增的密钥不自动加入已开始会话。
- Chatbox 选择分组时展开为当前密钥；部分选中显示 indeterminate。
- 默认无访问，不能自动套用整个 Vault。
- 授权撤销后，新调用立即失败；已开始会话的下一次请求重新校验。
- 审计记录只追加，普通用户不可修改。

## 6. Session 通道

### 6.1 Ctrl

- 进入 Session 页面建立，离开关闭；整个 Session 生命周期常连。
- 沿用 1.0 控制协议：`read`、`history`、`run`、`retry`、`repeat`、`stop`、`cancel`。
- `read` / `history` 读取消息历史，返回 `read_complete`、消息数组、`has_more`、`first_id`、`last_seq`。
- `run` 触发新 Turn，返回 `action.accepted`（含 `turn_id`）；`retry` / `repeat` 复用上一条用户消息。
- `stop` / `cancel` 结束当前 Turn；Ctrl 不承载文本增量、工具输出与大附件。
- 服务端状态事件：`session.ready`、`action.accepted`、`action.applied`、`action.rejected`、`live_status`、`read_complete`。

### 6.2 Data

- 每个 Turn 独立建立；Turn 完成、失败或取消时关闭。
- 连接 `/v1/sessions/:id/data`，`turn_id` 在首帧或查询参数中绑定。
- 服务端按 `seq` 推送 Turn 事件；事件名、字段与顺序沿用现有 SSE 事件协议，不定义第二套。
- 客户端可用最后 `seq` 恢复当前 Turn；新 Turn 重新开 Data。

```text
Session 页面
  Ctrl WS（常驻） ── read / history / run / retry / repeat / stop / cancel
  Data WS（每 Turn） ── /v1/sessions/:id/data
全局事件 ── /v1/events SSE（已有）
```

### 6.3 Branch

- Branch 使用与主会话相同的 Chatbox、MessageList 与控制协议，但有自己的 `branch_id`、消息历史与滚动位置。
- 内部路由 `/sessions/:sessionId/branches/:branchId` 打开在 Browser 标签；Browser 仍用现有 `internal` 目标。
- 分支 Ctrl 使用 `/v1/sessions/:id/branches/:branch_id/ctrl`，分支 Data 使用 `/v1/sessions/:id/branches/:branch_id/data`。
- 分支继承主会话的 Workspace、Computer、模型与 Vault 授权；不重复选择资源。
- 打开分支标签时建立分支 Ctrl，关闭标签时关闭；分支 Turn 结束仍按 Data 规则关闭。
- 主会话与分支互不替换；同一分支路由在 Browser 中只保留一个标签。
- Mock 已提供 Branch 列表、详情、创建、Ctrl 与 Data；自动支线与更复杂的创建规则后置。

## 7. Chatbox 与 MessageList

- `Chatbox` 是受控会话壳，不请求接口，不直接建 WS；内部组合独立的 `MessageList` 与 composer。
- `MessageList` 只接收规范化消息、空态与加载状态，负责历史、流式占位、时间分隔和加载更多。
- `features/session` 持有 `use-session-transport`：
  1. HTTP 创建 Session，可带初始 `vault_grants`。
  2. 进入 Session 页面，建立 Ctrl WS。
  3. 发送 `read`，接收 `read_complete` 并填充 `MessageList`。
  4. 发送 `run`，Ctrl 返回 `turn_id`。
  5. 建立该 Turn 的 Data WS，按现有事件协议接收；Turn 结束关闭 Data。
  6. 离开 Session 页面关闭 Ctrl。
- Vault access 选择器打开时读取 `/v1/vaults` 与 groups/secrets；按分组或单条选择，Clear / Done 语义与原型一致。
- 模型选择读取 `/v1/llm/v2/models`，默认角色读取 `/v1/llm/v2/roles` 或 `/resolve/:role`；Chatbox 不接触 Provider Key。
- 已创建会话通过 `PUT /v1/sessions/:id/vault-grants` 更新；新建会话可在创建请求中带初始授权。
- 前端状态：`idle → sending → streaming → tool → completed`；任意阶段可进入 `cancelled` 或 `error`。
- 断线：Ctrl 重连并重新 `read`；当前 Turn 的 Data 按最后 `seq` 重开；不重复追加已收增量。
- `/v1/events` 由现有 EventStream 处理，不混入 Chatbox Turn 状态。

## 8. Mock Server

Mock Server 位于工作区独立目录 `mock-server/`，不属于 CUI 仓库，使用独立 Git 管理。

```text
mock-server/
  package.json
  server.mjs              HTTP / WS / SSE 服务
  lib/ws.mjs              原生 WebSocket 握手与帧
  lib/datasets.mjs        JSONL 加载与关键词匹配
  fixtures/
    computers.json
    workspaces.json
    sessions.json
    vaults.json
    llm.json
  datasets/
    index.json            关键词到 JSONL 的映射
    default.jsonl
    review.jsonl
    planning.jsonl
    slow.jsonl
    error.jsonl
    cancel.jsonl
  tests/server.test.mjs
```

- 启动：`npm start`，默认 `127.0.0.1:5070`。
- 测试：`npm test`。
- 固定 3 台 Computer、5 个 Workspace，覆盖 Private、Team、Specified members。
- Vault fixtures 覆盖 Personal / Team、Group、单条密钥、会话授权。
- LLM metadata 在本地提供，接入真实 Yao 时以 `/v1/llm` 为准。
- 场景：正常、首字延迟、错误、取消；全局 SSE 独立回放。
- `/__mock/reset` 重置内存；`/__mock/routes` 查看命中次数；只开发可用。

## 9. 实施顺序

1. Mock Server 核心已完成，并通过本地自测。
2. 08 Session 实施时同步完成 CUI 开发代理接线、最小网关、接口台账与认证透传。
3. 在同一 Session 纵向切片中完成 New Session、Chatbox、Vault 选择器与 Ctrl/Data 通道。
4. 后端按台账逐项替换；每项通过后从 Mock 摘除。

## 10. 验收

- CUI 与测试应用不配置第二个 API 地址，仍通过 Yao 域名访问。
- 台账外路径走真实；`mock` 不请求 Yao；`auto` 只在 404/501 回退。
- 401、403、5xx 不被 Mock 吞掉；响应头能看出 real / mock / fallback。
- Ctrl WS 进入 Session 建立、退出关闭；每个 Turn 单独建立 `/v1/sessions/:id/data` 并关闭。
- Data 事件格式与现有 SSE 一致；`/v1/events` 不受影响。
- Vault 分组、单条选择、indeterminate、Clear / Done 与授权保存可跑通；响应不含密钥值。
- 模型选择读取 `/v1/llm/v2/models` 与 `/v1/llm/v2/roles`，Provider Key 不出现在 CUI。
- 每项 Mock 都有摘除条件；后端验收后，台账与 Mock 文件同步删除。

## 11. 未定项

1. 网关最终以 Vite 插件、独立 Node 进程还是桌面宿主代理实现。
2. `auto` 是否保留，还是只允许 `real` / `mock`。
3. Ctrl / Data 的首帧字段与 WS 升级头需与后端重构结果对齐。
4. Vault 管理接口是否本期全部实现，还是只先做 catalog 与 session grants。

## 12. 当前实现

Mock Server 已在工作区独立目录 `mock-server/` 实现，并使用独立 Git 管理。2026-10-28 11:20 复测 `npm test`，8 项全部通过。

| 能力 | 状态 | 说明 |
| --- | --- | --- |
| Computer / Workspace | 可用 | fixtures 返回 3 台 Computer、5 个 Workspace |
| Session HTTP | 可用 | 创建、读取、Vault grants |
| Ctrl WS | 可用 | 常驻，处理 read / history / run / retry / repeat / stop / cancel |
| 消息历史 | 可用 | `read_complete` 返回消息、分页与 has_more；run 后追加用户与 assistant 消息 |
| Data WS | 可用 | 按 Turn 开关，事件沿用 SSE 格式 |
| Branch | 可用 | 列表、详情、创建、独立历史与 Ctrl/Data；自动支线策略后置 |
| JSONL 数据集 | 可用 | 关键词匹配 review、planning、slow、error、cancel，默认回退 |
| Vault | 可用 | catalog、groups、secrets、grants、audit；不返回密钥值 |
| 全局 SSE | 可用 | `/v1/events` |
| LLM metadata | 可用（Mock） | `/v1/llm` 的模型、角色、completion 本地响应 |
| 开发网关 | 部分可用 | CUI 开发代理支持 `YAO_MOCK_HOST` 按域拆分；完整台账与 auto 回退未做 |
| CUI 接线 | 可用 | Session 页面通过开发代理访问 Mock 与真实 Yao |
| 认证 | 可用 | 复用 Yao 登录与 Cookie；Mock 不校验凭据 |

- HTTP：认证入口、Apps、Bots、Computer、Workspace、Session、Vault、LLM metadata、全局 SSE。
- WS：Ctrl 常驻；Data 按 Turn 开关；Data 事件复用 SSE 事件格式。
- 数据：`fixtures/` 提供固定数据；`datasets/*.jsonl` 按关键词匹配回复。
- 测试：`npm test` 覆盖健康检查、服务发现、Session、会话设置更新、Ctrl read/history、Data 流、关键词匹配、取消、错误、Branch、Vault 授权与全局 SSE。
- 限制：当前是 standalone Mock，未实现完整 real/mock 台账与自动回退；开发期可通过 `YAO_MOCK_HOST` 手动按域拆分。
