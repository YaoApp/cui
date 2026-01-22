# Mission Control - Backend API Requirements

> Frontend UI is complete. Backend needs to implement the following APIs.
> Reference: `TODO.md`, `DESIGN.md`, `types.ts`, `mock/data.ts`
> Backend Implementation: `yao/openapi/agent/robot/`

**Base Path:** `/v1/agent/robots`

> **Note:** Robot API is under `/v1/agent/` namespace, consistent with `/v1/agent/assistants`.
> Robot is a type of Agent (Autonomous Robot Agent).

**File API:** Use existing `@cui/openapi/file.ts` (FileAPI) for attachments

**i18n:** Frontend passes locale via query parameter `?locale=zh-CN` (priority 1) or request body field. Backend returns localized strings accordingly.

---

## Overview

| Category | Endpoint | Description |
|----------|----------|-------------|
| Robot | GET /v1/agent/robots | List all robots (main page grid) |
| Robot | GET /v1/agent/robots/:id | Get robot details with config |
| Robot | POST /v1/agent/robots | Create robot (Add Agent Modal) |
| Robot | PUT /v1/agent/robots/:id | Update robot config (Settings Tab) |
| Robot | DELETE /v1/agent/robots/:id | Delete robot (Advanced Panel) |
| Execution | GET /v1/agent/robots/:id/executions | List executions (Active/History Tab) |
| Execution | GET /v1/agent/robots/:id/executions/:exec_id | Get execution details |
| Execution | POST /v1/agent/robots/:id/trigger | Human trigger - SSE (Assign Task Drawer) |
| Execution | POST /v1/agent/robots/:id/executions/:exec_id/pause | Pause execution |
| Execution | POST /v1/agent/robots/:id/executions/:exec_id/resume | Resume execution |
| Execution | POST /v1/agent/robots/:id/executions/:exec_id/cancel | Cancel execution |
| Execution | POST /v1/agent/robots/:id/executions/:exec_id/retry | Retry failed execution |
| Intervention | POST /v1/agent/robots/:id/intervene | Human intervention - SSE (Guide Drawer) |
| Results | GET /v1/agent/robots/:id/results | List deliverables (Results Tab) |
| Results | GET /v1/agent/robots/:id/results/:result_id | Get deliverable details |
| Activity | GET /v1/agent/robots/activities | List activities (Activity Banner/Modal) |
| SSE | GET /v1/agent/robots/stream | Real-time status updates |
| SSE | GET /v1/agent/robots/:id/executions/:exec_id/stream | Execution progress stream |
| File | (existing) | Use `@cui/openapi/file.ts` FileAPI |

---

## 1. Robot APIs

### 1.1 GET /v1/agent/robots

List all robots with status (for main page Station Grid)

**Query:**

| Param | Type | Description |
|-------|------|-------------|
| locale | string | Optional: `zh-CN`, `en-US` |

**Response:**

```json
{
  "data": [
    {
      "member_id": "robot_001",
      "team_id": "team_001",
      "name": "sales-analyst",
      "display_name": "销售分析师",
      "description": "生成销售报表，分析销售趋势",
      "status": "idle | working | paused | error | maintenance",
      "running": 0,
      "max_running": 2,
      "last_run": "2025-01-21T10:00:00Z",
      "next_run": "2025-01-21T14:00:00Z",
      "running_ids": ["exec_001"]
    }
  ]
}
```

### 1.2 GET /v1/agent/robots/:id

Get robot details with full config (for Settings Tab)

**Query:**

| Param | Type | Description |
|-------|------|-------------|
| locale | string | Optional: `zh-CN`, `en-US` |

**Response:**

```json
{
  "member_id": "robot_001",
  "team_id": "team_001",
  "name": "sales-analyst",
  "display_name": "销售分析师",
  "description": "生成销售报表，分析销售趋势",
  "status": "idle",
  "running": 0,
  "max_running": 2,
  "config": {
    "identity": {
      "role": "Sales Analyst",
      "duties": ["Generate daily/weekly reports", "Analyze trends"],
      "rules": ["Confidentiality"]
    },
    "clock": {
      "mode": "times | interval | daemon",
      "times": ["09:00", "14:00"],
      "days": ["Mon", "Tue", "Wed", "Thu", "Fri"],
      "every": "30m",
      "tz": "Asia/Shanghai"
    },
    "events": [
      { "type": "webhook", "source": "/webhook/sales" },
      { "type": "database", "source": "orders", "filter": { "trigger": "insert" } }
    ],
    "quota": {
      "max": 2,
      "queue": 10,
      "priority": 5
    },
    "resources": {
      "phases": {
        "inspiration": "__yao.inspiration",
        "goals": "__yao.goals",
        "tasks": "__yao.tasks",
        "delivery": "__yao.delivery",
        "learning": "__yao.learning"
      },
      "agents": ["data-analyst", "report-writer"],
      "mcp": [{ "id": "database", "tools": ["query"] }]
    },
    "delivery": {
      "email": {
        "enabled": true,
        "targets": [{ "to": ["manager@example.com"], "template": "report" }]
      },
      "webhook": {
        "enabled": false,
        "targets": [{ "url": "https://...", "secret": "..." }]
      },
      "process": {
        "enabled": false,
        "targets": [{ "process": "scripts.notify.Send" }]
      }
    },
    "triggers": {
      "intervene": { "enabled": true },
      "event": { "enabled": false }
    },
    "learn": {
      "on": true,
      "types": ["execution", "feedback", "insight"],
      "keep": 90
    },
    "executor": {
      "mode": "standard | dryrun",
      "timeout": 30
    }
  }
}
```

### 1.3 POST /v1/agent/robots

Create robot (Add Agent Modal - 2 step wizard)

**Request:**

```json
{
  "locale": "zh-CN",
  "name": "new-robot",
  "display_name": "新机器人",
  "email": "new-robot@team.ai",
  "manager_id": "user_001",
  "work_mode": "autonomous | on-demand",
  "identity": {
    "role": "Role Name",
    "duties": ["Duty 1", "Duty 2"]
  },
  "resources": {
    "agents": ["agent-1", "agent-2"]
  }
}
```

**Response:**

```json
{
  "member_id": "robot_009",
  "success": true
}
```

### 1.4 PUT /v1/agent/robots/:id

Update robot config (Settings Tab - Basic/Identity/Schedule/Advanced panels)

**Request:** Same structure as `config` in GET response

### 1.5 DELETE /v1/agent/robots/:id

Delete robot (Advanced Panel - Danger Zone)

**Response:**

```json
{
  "success": true
}
```

---

## 2. Execution APIs

### 2.1 GET /v1/agent/robots/:id/executions

List executions (Active Tab: running/pending, History Tab: all with filters)

**Query:**

| Param | Type | Description |
|-------|------|-------------|
| locale | string | Optional: `zh-CN`, `en-US` |
| status | string | Filter: `running`, `pending`, `completed`, `failed`, `cancelled`, or comma-separated |
| trigger_type | string | Filter: `clock`, `human`, `event` |
| keyword | string | Search in execution name |
| page | number | Page number (default: 1) |
| pagesize | number | Items per page (default: 20) |

**Response:**

```json
{
  "data": [
    {
      "id": "exec_001",
      "member_id": "robot_001",
      "team_id": "team_001",
      "trigger_type": "clock | human | event",
      "start_time": "2025-01-21T10:00:00Z",
      "end_time": "2025-01-21T10:30:00Z",
      "status": "running | completed | failed | pending | cancelled",
      "phase": "inspiration | goals | tasks | run | delivery | learning",
      "error": "Error message if failed",
      "job_id": "job_001",
      "name": "每日销售报表",
      "current_task_name": "分析数据中",
      "goals": {
        "content": "## Goals\n1. Analyze sales data\n2. Generate report"
      },
      "tasks": [
        {
          "id": "task_001",
          "goal_ref": "goal_1",
          "source": "auto | human | event",
          "executor_type": "assistant | mcp | process",
          "executor_id": "data-analyst",
          "status": "pending | running | completed | failed | skipped | cancelled",
          "order": 1,
          "start_time": "2025-01-21T10:05:00Z",
          "end_time": "2025-01-21T10:10:00Z"
        }
      ],
      "current": {
        "task": { "...current task object..." },
        "task_index": 2,
        "progress": "2/5 tasks"
      },
      "delivery": {
        "content": {
          "summary": "报表摘要...",
          "body": "## 详细内容...",
          "attachments": [
            {
              "title": "销售报表",
              "description": "2025年1月数据",
              "task_id": "task_003",
              "file": "__yao.attachment://file_001"
            }
          ]
        },
        "success": true,
        "sent_at": "2025-01-21T10:31:00Z"
      }
    }
  ],
  "total": 100,
  "page": 1,
  "pagesize": 20
}
```

### 2.2 GET /v1/agent/robots/:id/executions/:exec_id

Get single execution details (Execution Detail Drawer)

**Query:**

| Param | Type | Description |
|-------|------|-------------|
| locale | string | Optional: `zh-CN`, `en-US` |

**Response:** Same structure as single item in list response, with full task details

### 2.3 POST /v1/agent/robots/:id/trigger (SSE)

Human trigger new execution (Assign Task Drawer - chat UI)

**Request:**

```json
{
  "locale": "zh-CN",
  "messages": [
    { "role": "user", "content": "请生成本周销售报表" }
  ],
  "attachments": [
    { "file": "__yao.attachment://file_001", "name": "data.xlsx" }
  ]
}
```

**Response (SSE stream):**

```
event: received
data: {"message": "Task received, creating execution..."}

event: execution
data: {"execution_id": "exec_002", "status": "pending"}

event: message
data: {"role": "assistant", "content": "好的，我开始处理本周销售报表..."}

event: phase
data: {"phase": "goals", "message": "正在生成目标..."}

event: complete
data: {"execution_id": "exec_002", "status": "running"}
```

### 2.4 POST /v1/agent/robots/:id/executions/:exec_id/pause

Pause running execution

**Response:**

```json
{
  "success": true,
  "status": "paused"
}
```

### 2.5 POST /v1/agent/robots/:id/executions/:exec_id/resume

Resume paused execution

**Response:**

```json
{
  "success": true,
  "status": "running"
}
```

### 2.6 POST /v1/agent/robots/:id/executions/:exec_id/cancel

Cancel execution

**Response:**

```json
{
  "success": true,
  "status": "cancelled"
}
```

### 2.7 POST /v1/agent/robots/:id/executions/:exec_id/retry

Retry failed execution (History Tab - failed row action)

**Response:**

```json
{
  "execution_id": "exec_003",
  "status": "pending"
}
```

---

## 3. Intervention API (SSE)

### 3.1 POST /v1/agent/robots/:id/intervene (SSE)

Human intervention during execution (Guide Execution Drawer - chat UI)

**Request:**

```json
{
  "locale": "zh-CN",
  "execution_id": "exec_001",
  "action": "task.add | goal.adjust | instruct",
  "messages": [
    { "role": "user", "content": "请先完成任务A再做B" }
  ],
  "priority": "high | normal | low",
  "position": "first | last | next | at"
}
```

**Response (SSE stream):**

```
event: received
data: {"message": "Instruction received"}

event: message
data: {"role": "assistant", "content": "好的，我来调整任务顺序..."}

event: processing
data: {"message": "正在调整任务顺序..."}

event: message
data: {"role": "assistant", "content": "完成！任务A会在任务B之前执行。"}

event: complete
data: {"success": true, "message": "Task order updated"}
```

---

## 4. Results API

### 4.1 GET /v1/agent/robots/:id/results

List deliverables (Results Tab - table with filters)

**Query:**

| Param | Type | Description |
|-------|------|-------------|
| locale | string | Optional: `zh-CN`, `en-US` |
| trigger_type | string | Filter: `clock`, `human`, `event` |
| keyword | string | Search in result name |
| page | number | Page number |
| pagesize | number | Items per page |

**Response:**

```json
{
  "data": [
    {
      "id": "result_001",
      "member_id": "robot_001",
      "execution_id": "exec_001",
      "name": "每日销售报表.pdf",
      "type": "pdf",
      "size": 102400,
      "created_at": "2025-01-21T10:30:00Z",
      "trigger_type": "clock",
      "execution_name": "每日报表生成"
    }
  ],
  "total": 50,
  "page": 1,
  "pagesize": 20
}
```

### 4.2 GET /v1/agent/robots/:id/results/:result_id

Get deliverable details (Result Detail Modal - Content + Attachments tabs)

**Query:**

| Param | Type | Description |
|-------|------|-------------|
| locale | string | Optional: `zh-CN`, `en-US` |

**Response:**

```json
{
  "id": "result_001",
  "execution_id": "exec_001",
  "name": "每日销售报表",
  "created_at": "2025-01-21T10:30:00Z",
  "trigger_type": "clock",
  "delivery": {
    "content": {
      "summary": "报表摘要文本...",
      "body": "## 详细报表\n\nMarkdown 内容...",
      "attachments": [
        {
          "title": "销售报表 PDF",
          "description": "2025年1月销售数据",
          "task_id": "task_003",
          "file": "__yao.attachment://file_001"
        }
      ]
    },
    "success": true,
    "sent_at": "2025-01-21T10:31:00Z"
  }
}
```

### 4.3 File Download (Use FileAPI)

Use existing `@cui/openapi/file.ts` FileAPI:

```typescript
import { FileAPI } from '@/openapi/file'

// Download attachment
const response = await fileAPI.Download(fileId, '__yao.attachment')

// Get file content URL for preview
const url = `/file/__yao.attachment/${fileId}/content`
```

---

## 5. Activity API

### 5.1 GET /v1/agent/robots/activities

List recent activities (Activity Banner at bottom + Activity Modal)

**Query:**

| Param | Type | Description |
|-------|------|-------------|
| locale | string | Optional: `zh-CN`, `en-US` |
| limit | number | Max items (default: 50) |
| since | string | ISO timestamp, get activities after this time |

**Response:**

```json
{
  "data": [
    {
      "id": "act_001",
      "type": "completed | file | error | started | paused",
      "member_id": "robot_001",
      "robot_name": "SEO内容专员",
      "title": "完成了 \"AI应用开发指南\"",
      "description": "2500字，覆盖12个关键词",
      "file_id": "file_001",
      "timestamp": "2025-01-21T17:02:00Z"
    }
  ]
}
```

**Activity Types:**

| Type | Icon | Description |
|------|------|-------------|
| completed | check_circle | Execution completed successfully |
| file | description | New file/deliverable generated |
| error | error | Execution failed |
| started | play_circle | Execution started |
| paused | pause_circle | Execution paused |

---

## 6. Real-time Updates (SSE)

### 6.1 GET /v1/agent/robots/stream

SSE stream for robot status updates (main page grid real-time updates)

**Query:**

| Param | Type | Description |
|-------|------|-------------|
| locale | string | Optional: `zh-CN`, `en-US` |

**Event Types:**

```
event: robot_status
data: {"member_id": "robot_001", "status": "working", "running": 1}

event: execution_start
data: {"member_id": "robot_001", "execution_id": "exec_001", "name": "每日报表生成"}

event: execution_complete
data: {"member_id": "robot_001", "execution_id": "exec_001", "status": "completed"}

event: activity
data: {"id": "act_001", "type": "completed", "member_id": "robot_001", ...}
```

### 6.2 GET /v1/agent/robots/:id/executions/:exec_id/stream

SSE stream for single execution progress (Execution Detail Drawer)

**Query:**

| Param | Type | Description |
|-------|------|-------------|
| locale | string | Optional: `zh-CN`, `en-US` |

**Event Types:**

```
event: phase
data: {"phase": "tasks", "progress": "2/5 tasks"}

event: task_start
data: {"task_id": "task_002", "order": 2}

event: task_complete
data: {"task_id": "task_002", "status": "completed"}

event: message
data: {"role": "assistant", "content": "正在分析数据..."}

event: delivery
data: {"summary": "...", "attachments": [...]}

event: complete
data: {"status": "completed"}

event: error
data: {"error": "Something went wrong", "phase": "run"}
```

---

## 7. Types Reference

### 7.1 Enums

| Enum | Values |
|------|--------|
| RobotStatus | `idle`, `working`, `paused`, `error`, `maintenance` |
| ExecStatus | `pending`, `running`, `completed`, `failed`, `cancelled` |
| Phase | `inspiration`, `goals`, `tasks`, `run`, `delivery`, `learning` |
| TriggerType | `clock`, `human`, `event` |
| ClockMode | `times`, `interval`, `daemon` |
| TaskStatus | `pending`, `running`, `completed`, `failed`, `skipped`, `cancelled` |
| ExecutorType | `assistant`, `mcp`, `process` |
| TaskSource | `auto`, `human`, `event` |
| Priority | `high`, `normal`, `low` |
| InsertPosition | `first`, `last`, `next`, `at` |
| ActivityType | `completed`, `file`, `error`, `started`, `paused` |
| InterventionAction | `task.add`, `goal.adjust`, `instruct` |
| ExecutorMode | `standard`, `dryrun` |
| WorkMode | `autonomous`, `on-demand` |
| EventType | `webhook`, `database` |

### 7.2 Core Types (from types.ts)

```typescript
// Robot state for list
interface RobotState {
  member_id: string
  team_id: string
  name: string              // unique identifier: 'seo-content-specialist'
  display_name: string      // localized: "SEO内容专员"
  description?: string      // localized
  status: RobotStatus
  running: number           // current running count
  max_running: number       // quota max
  last_run?: string         // ISO timestamp
  next_run?: string         // ISO timestamp
  running_ids?: string[]    // execution IDs
}

// Task in execution
interface Task {
  id: string
  goal_ref?: string
  source: TaskSource
  executor_type: ExecutorType
  executor_id: string
  status: TaskStatus
  order: number
  start_time?: string
  end_time?: string
}

// Execution current state
interface CurrentState {
  task?: Task
  task_index: number
  progress?: string         // "2/5 tasks"
}

// Delivery attachment
interface DeliveryAttachment {
  title: string
  description?: string
  task_id?: string
  file: string              // "__yao.attachment://fileID"
}

// Delivery content
interface DeliveryContent {
  summary: string
  body: string              // markdown
  attachments?: DeliveryAttachment[]
}

// Delivery result
interface DeliveryResult {
  content?: DeliveryContent
  success: boolean
  sent_at?: string
}

// Full execution
interface Execution {
  id: string
  member_id: string
  team_id: string
  trigger_type: TriggerType
  start_time: string
  end_time?: string
  status: ExecStatus
  phase: Phase
  error?: string
  job_id: string
  name?: string             // localized execution name
  current_task_name?: string // localized current task
  goals?: { content: string }
  tasks?: Task[]
  current?: CurrentState
  delivery?: DeliveryResult
}

// Result file for Results Tab
interface ResultFile {
  id: string
  member_id: string
  execution_id: string
  name: string              // localized file name
  type: string              // pdf, xlsx, csv, json, md, etc.
  size: number              // bytes
  created_at: string
  trigger_type?: TriggerType
  execution_name?: string   // localized
}

// Activity for Activity Banner/Modal
interface Activity {
  id: string
  type: ActivityType
  member_id: string
  robot_name: string        // localized
  title: string             // localized
  description?: string      // localized
  file_id?: string
  timestamp: string
}
```

---

## 8. UI → API Mapping

| UI Component | API Endpoints |
|--------------|---------------|
| Main Page - Station Grid | GET /v1/agent/robots, SSE /v1/agent/robots/stream |
| Main Page - Activity Banner | GET /v1/agent/robots/activities (limit=10), SSE activity events |
| Main Page - Activity Modal | GET /v1/agent/robots/activities (limit=50) |
| Add Agent Modal | POST /v1/agent/robots |
| Agent Modal - Active Tab | GET /v1/agent/robots/:id/executions?status=running,pending |
| Agent Modal - History Tab | GET /v1/agent/robots/:id/executions (with filters) |
| Agent Modal - Results Tab | GET /v1/agent/robots/:id/results |
| Agent Modal - Settings Tab | GET/PUT /v1/agent/robots/:id |
| Execution Card - Pause | POST /v1/agent/robots/:id/executions/:exec_id/pause |
| Execution Card - Resume | POST /v1/agent/robots/:id/executions/:exec_id/resume |
| Execution Card - Stop | POST /v1/agent/robots/:id/executions/:exec_id/cancel |
| Execution Card - Guide | POST /v1/agent/robots/:id/intervene (SSE) |
| History Tab - Retry | POST /v1/agent/robots/:id/executions/:exec_id/retry |
| Execution Detail Drawer | GET /v1/agent/robots/:id/executions/:exec_id, SSE stream |
| Assign Task Drawer | POST /v1/agent/robots/:id/trigger (SSE) |
| Guide Execution Drawer | POST /v1/agent/robots/:id/intervene (SSE) |
| Result Detail Modal | GET /v1/agent/robots/:id/results/:result_id |
| Download Attachment | FileAPI.Download(fileId, '__yao.attachment') |
| Delete Agent | DELETE /v1/agent/robots/:id |

---

## 9. Notes for Backend

1. **i18n**: All user-facing strings (`display_name`, `description`, `name`, `title`, etc.) should be returned in the language specified by:
   - **Query parameter**: `?locale=zh-CN` (priority 1)
   - **Request body field**: `locale: "zh-CN"` (for POST/PUT requests)
   - Supported values: `zh-CN`, `en-US`

2. **File References**: Use format `__yao.attachment://fileID` for attachment file references. Frontend uses existing FileAPI to download.

3. **SSE Endpoints**: `/v1/agent/robots/:id/trigger` and `/v1/agent/robots/:id/intervene` should return SSE streams for chat-like interaction. Other SSE endpoints (`/stream`) are for real-time updates.

4. **Pagination**: Use `page` and `pagesize` query params. Return `total`, `page`, `pagesize` in response for infinite scroll.

5. **Task has no name**: Task object doesn't have a `name` field. The `current_task_name` in Execution is a separate localized string describing what's happening now.

6. **Execution Phases**: 
   - `inspiration`: Only in autonomous mode (clock trigger)
   - `goals`: Generate goals
   - `tasks`: Split into tasks
   - `run`: Execute tasks
   - `delivery`: Format & deliver results
   - `learning`: Extract insights (async)

7. **Route Namespace**: All robot APIs are under `/v1/agent/robots` namespace, consistent with `/v1/agent/assistants`. Implementation is in `yao/openapi/agent/robot/`.
