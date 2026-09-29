# GAPS — 接口缺口清单（BUILD 工作台原型）

> 原型阶段**全部走 Mock**（见 [`mock.ts`](./mock.ts)）。本文件列出**需要 Yao 工程师补齐**的接口。
> 原则：**不改现有契约**；新增接口尽量复用已有语义（任务 / chat / workspace）。

## 0. 已有、可直接复用（原型已在用或已按契约建模）

| 能力 | 现有实现 | 说明 |
| --- | --- | --- |
| 消息标准 | `@/openapi`：`MessageType` / `Message` / 各 `*Props`（17 种） | 原型消息渲染**按此分派**（`Message.tsx`） |
| 流式解析 | `cui/chatbox/utils/chunkProcessor.ts` | `processChunk` / `newStreamSession`（原型先不接流） |
| Chat 会话 | `@/openapi/chat`（`Chat`） | 发送/接收消息 |
| 任务（看板） | workspace / kanban 现有接口 | **任务 = 后端实体**，看板与 BUILD 共用 |
| 代码编辑 / Diff | `react-monaco-editor`、`components/view/DiffViewer` | 原型先用轻量自绘（避免一次性引入大依赖） |
| 文件 / 沙箱 / 预览 | `components/view/FileViewer`、`/sandbox`、`/preview` | 后续接入 Dev 面板 |

## 1. 缺口（需要新增接口）

### 1.1 构建与门禁（BUILD 特有）— **P0**

```ts
// GET /build/{task_id}
{
  "task_id": "128",
  "app_id": "lucky-fortune",
  "stage": "dev",                 // design | dev | deploy
  "gates": [                       // 9 层门禁（契约：typecheck/lint/unit/contract/route/visual/a11y/e2e/report）
    { "key": "typecheck", "label": "typecheck", "status": "pass" },
    { "key": "visual",    "label": "visual",    "status": "fail", "detail": "2 处差异" }
  ],
  "report_url": "..."              // Delivery Report（可选）
}
```
- 需要：**触发一次门禁** `POST /build/{task_id}/test`，返回 run id + 状态（可轮询/流）。

### 1.2 发布 / 托管 — **P0**

```ts
// POST /build/{task_id}/publish  →  { "url": "...", "job_id": "..." }
// GET  /build/{task_id}/publish/{job_id} → { "status": "building|uploading|done|error", "url": "..." }
```
- 需要：产物形态（static / PWA）、是否公开、分享链接、可选"丢到云"。

### 1.3 Apps 列表与打开 — **P0**

```ts
// GET /apps?source=all|local|cloud|shared
[{ "id":"a1","name":"...","source":"local","status":"published","forms":["H5","MCP"],"owner":"@max","updated_at":"..." }]
// GET /apps/{id}/open  → { "url": "..." }  （点开即用）
```

### 1.4 双面（人面 + Agent 面）— **P0**

```ts
// GET /apps/{id}/faces
{
  "human": { "routes": ["/result"], "deep_links": ["lucky://fortune"], "theme": "..." },
  "agent": { "protocol": "a2ui", "catalog": ["...components..."],
             "adapters": ["mcp"], "actions": ["fortune.get"] }
}
```

### 1.5 能力（Skill / MCP）查看与管理 — **P1**

```ts
// GET  /capabilities            → [{ id, kind:"skill|mcp", name, desc, enabled, faces:["human","agent"], tools:[...] }]
// POST /capabilities/{id}/toggle → { enabled: true|false }
// GET  /capabilities/{id}/grants → 授权范围（作用域 / 权限）
```

### 1.6 任务 ↔ 应用 绑定 — **P1**

```ts
// GET /tasks/{id}/app  → { app_id } | null   （"这个任务已经长成了哪个应用"）
```

### 1.7 Build 会话的"模式分段" — **P1（产品语义，可能不用新接口）**

- 需求：**同一段对话里**，某几轮是"改 UI（Design）"、某几轮是"写代码 / 运行（Dev）"、某几轮是"发布（Deploy）"。
- 可选方案：
  1. 消息里带 `metadata.panel: 'design'|'dev'|'deploy'`（**前端可直接消费**，改动最小）；
  2. 或按 `MessageType` 语义推断（原型当前做法：`inferMode()`，见 `Message.tsx`）。
- **建议**：先用 1（后端在生成消息时打标），前端不再猜。

## 2. 原型里"假"的部分（明早可一眼对照）

| 位置 | Mock | 真实来源 |
| --- | --- | --- |
| 门禁数字 `6/9` | `mockApi.getGates()` | §1.1 |
| 发布步骤 / 链接 | `mockApi.getDeploy()` / `publish()` | §1.2 |
| Apps 卡片 | `mockApi.listApps()` | §1.3 |
| 能力列表与开关 | `mockApi.listCapabilities()` | §1.5 |
| 对话内容 | `mock.ts` 常量 | `@/openapi` chat 流（**已有**） |
| live preview iframe | 内联 HTML | `/sandbox` 或构建产物预览 |
| 代码 diff | 自绘文本 | `components/view/DiffViewer`（已有） |

## 3. 我没擅自做的决定（等确认）

1. **路由 `packages/cui/janus/` + `/janus`** 是否保留？（代号可改，README 已注明 V2）
2. **消息带 `metadata.panel`** —— 需要后端配合打标（§1.7 方案 1）。
3. **门禁对用户暴露到什么粒度**（全 9 层 / 只给"能不能发"）。
4. **Apps 是否区分「我的 / 他人」**（原型给了筛选 chip）。
