# Mission Control - Implementation TODO

> Based on DESIGN.md
> Use Mock data first, then integrate API later

---

## ⚠️ Design Guidelines

### 1. Color System

**ONLY use CSS variables from `@cui/packages/cui/styles/preset/vars.less`**

```less
// Primary colors
var(--color_main)       // main brand color
var(--color_primary)    // primary action color

// Text colors
var(--color_text)       // primary text
var(--color_text_grey)  // secondary text
var(--color_text_light) // light/muted text

// Status colors
var(--color_success)    // working/completed - green
var(--color_warning)    // idle/pending - yellow
var(--color_danger)     // error/failed - red
var(--color_info)       // info - blue

// Background & borders
var(--color_bg)         // page background
var(--color_bg_nav)     // card/panel background
var(--color_border)     // borders
var(--color_border_soft)// subtle borders

// Neo Design System (sci-fi feel)
var(--color_neo_bg)
var(--color_neo_text)
var(--color_neo_border)

// Mission Control Design System (for this page)
var(--color_mission_bg_start)           // gradient start
var(--color_mission_bg_end)             // gradient end
var(--color_mission_text)               // primary text
var(--color_mission_text_secondary)     // secondary text
var(--color_mission_text_muted)         // muted text
var(--color_mission_accent_cyan)        // accent cyan
var(--color_mission_accent_purple)      // accent purple
var(--color_mission_accent_green)       // success/running
var(--color_mission_accent_orange)      // warning/paused
var(--color_mission_glow_cyan)          // glow effect
var(--color_mission_card_bg)            // card background
var(--color_mission_card_border)        // card border
var(--color_mission_glass_bg)           // glass effect bg
var(--color_mission_glass_border)       // glass border
var(--color_mission_ring)               // progress track

// Mission Control Modal (inside AgentModal)
var(--color_mission_modal_bg)           // modal background
var(--color_mission_modal_border)       // modal border
var(--color_mission_modal_header_bg)    // header background
var(--color_mission_modal_content_bg)   // content area background
var(--color_mission_modal_card_bg)      // card inside modal
var(--color_mission_modal_card_border)  // card border
var(--color_mission_modal_card_shadow)  // card shadow
var(--color_mission_modal_card_shadow_hover) // card hover shadow
var(--color_mission_modal_card_blur)    // backdrop blur (dark mode)
```

**DO NOT hardcode colors like `#3b82f6` or `rgba(0,0,0,0.5)`**

### 2. Visual Style - Sci-Fi / Mission Control

This is NOT a typical admin dashboard. Design like a **space mission control center**.

**DO:**
- Rich animations (pulse, glow, scan lines, data streams)
- Subtle particle effects or grid backgrounds
- Glowing borders and status indicators
- Smooth transitions (300-500ms ease)
- Skeuomorphic elements (dials, gauges, radar-like displays)
- Typography with tech/mono feel for data
- Depth through shadows and layering

**DON'T:**
- Static flat cards with no life
- Generic Bootstrap/Ant Design look
- Boring tables and lists
- Instant state changes without animation

**Visual References:**
- NASA Mission Control
- Sci-fi movie interfaces (Minority Report, Iron Man)
- Gaming HUDs
- Real-time monitoring dashboards

**Animation Ideas:**
- Station cards: breathing glow when working, scan line effect
- Clock: digit flip animation, subtle pulse on seconds
- Progress bars: flowing gradient, particle trail
- Status changes: smooth color transitions with flash
- Hover: elevation + glow intensify
- Data updates: fade/slide transitions

---

## Workflow

```
Phase 1: UI Design with Mock Data
    │
    ├── 1.1 Main Page (confirm visual style)
    │       - Header, Clock, Stations Grid
    │       - Station Card (all states & animations)
    │       - Theme, Responsive, Fullscreen
    │
    ├── 1.2 Agent Modal (4 Tabs)
    ├── 1.3 Drawers (Assign Task, Execution Detail, Intervention)
    └── 1.4 Add Agent Wizard
    │
    ▼
Phase 2: API Integration
    │
    ├── 2.1 Robot API
    ├── 2.2 Execution API
    ├── 2.3 Results API
    └── 2.4 Polling (2min refresh)
```

### Complete Interaction Flow (Closed Loop)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  User clicks Station Card                                                   │
│      ↓                                                                      │
│  Agent Modal opens (Active Tab)                                             │
│      ↓                                                                      │
│  User clicks [📤 Assign Task]                                               │
│      ↓                                                                      │
│  Assign Task Drawer slides in                                               │
│      ↓                                                                      │
│  User types: "帮我分析竞品最新动态" + Send                                   │
│      ↓                                                                      │
│  API: POST /api/robots/:id/trigger (type: human)                            │
│      ↓                                                                      │
│  New Execution created (P1 → P2 → P3 → P4 → P5)                             │
│      ↓                                                                      │
│  Active Tab shows new Execution card                                        │
│      ↓                                                                      │
│  User can: Watch progress / Intervene / Pause / Stop                        │
│      ↓                                                                      │
│  Execution completes                                                        │
│      ↓                                                                      │
│  History Tab: execution record                                              │
│  Results Tab: output files                                                  │
└─────────────────────────────────────────────────────────────────────────────┘

Assign Task vs Intervene:
┌─────────────────────┬─────────────────────┐
│  Assign Task        │  Intervene          │
├─────────────────────┼─────────────────────┤
│ Creates NEW exec    │ Modifies EXISTING   │
│ Like sending email  │ Like replying/edit  │
│ Modal header button │ Execution card btn  │
└─────────────────────┴─────────────────────┘
```

---

## Phase 1: Static UI with Mock Data

### 1.1 Main Page Layout

> **Goal:** Establish visual style and overall layout. Get approval before continuing.

**Structure:**
- [x] Create page structure (`index.tsx`, `index.less`)
- [x] Header component
  - [x] Logo "任务指挥中心" with sci-fi style
  - [x] Stats display (Working: X, Idle: X, Error: X)
  - [x] Filter dropdown (search by keyword, filter by status)
  - [x] Fullscreen toggle button
  - [x] Dark/Light mode toggle
- [x] Clock component (center, prominent)
  - [x] Large time display (HH:MM:SS)
  - [x] Digit flip animation with blur/glow
  - [x] Blinking colon separator
- [x] Stations Grid container
  - [x] Responsive grid layout
  - [x] Custom scrollbar (hover to show)
- [x] Mock data setup (`mock/data.ts`)
  - [x] Sample robots with different statuses
  - [x] Sample executions
  - [x] Sample results/files
  - [x] i18n robot names
  - [x] Activity records

**Station Card:**
- [x] Station Card component
  - [x] Creature avatar (animated blob)
  - [x] Agent name and role
  - [x] Status text
  - [x] Progress indicator (if working)
  - [x] Next scheduled run (if idle)
- [x] Visual states & animations
  - [x] Working: green glow + pulse animation
  - [x] Idle: yellow indicator
  - [x] Paused: grey + opacity
  - [x] Error: red + blink animation
  - [x] Hover effect (elevation + glow)
- [ ] Click handler (open Agent Modal)
- [ ] "Add Agent" card (placeholder)

**Activity Banner & Modal:**
- [x] Fixed activity banner at bottom
  - [x] Auto-rotating activity display
  - [x] Click to open full activity modal
- [x] Activity Modal (custom Modal component)
  - [x] Glassmorphism effect
  - [x] Responsive width (65vw, min 400px, max 720px)
  - [x] Activity list with icons
  - [x] Download button for file attachments
  - [x] Custom scrollbar (hover to show)

**Visual Design:**
- [x] Theme support (light/dark via Mission Control CSS variables)
- [x] Responsive breakpoints
  - [x] Grid columns responsive to viewport
- [~] Fullscreen mode (skipped for now)
  - [ ] Toggle button functionality
  - [ ] Larger clock in fullscreen
  - [ ] Auto-hide header (show on hover)
  - [ ] Larger cards and fonts
- [x] Animations
  - [x] Clock digit flip animation
  - [x] Hover state transitions
  - [x] Creature breathing/pulse effects

**Custom Components Created:**
- [x] `components/Modal/` - Custom modal with glassmorphism effect
- [x] `@/widgets/Creature` - Animated blob avatar (global widget)

**Review Point:** Confirm visual style before proceeding to 1.2

### 1.2 Agent Modal

- [x] Modal container with backdrop + open/close animation (using antd Modal)
- [x] Modal header
  - [x] Agent name (i18n support)
  - [x] Creature avatar (status-based color)
  - [x] **[🚀] Assign Task button** (icon button + Tooltip)
  - [x] Close button [×]
- [x] Tabs navigation + switch transition
  - [x] Active (with count badge)
  - [x] History
  - [x] Results
  - [x] Config
- [x] Tab: Active (Redesigned - simplified view)
  - [x] Execution Card component
    - [x] Execution name (from goals or human input)
    - [x] Current task description (what's happening NOW)
    - [x] Progress bar with shimmer animation (running state)
    - [x] Status icon in title (play/pause/error)
    - [x] Trigger icon + label (🕐 定时/Clock / 👤 手动/Manual / ⚡ 事件/Event)
    - [x] Dynamic elapsed time (updates every second)
    - [x] Control buttons: Pause [⏸], Stop [⏹], Detail [→]
    - [x] Visual states: running (shimmer), paused (orange border), error (red border)
    - [x] Card quality: shadows, hover effects, light/dark theme support
  - [x] Empty state with "Assign Task" button (positioned higher)
  - [x] Mock data: dynamic start_time relative to page load
  - [x] Grid layout for execution cards
  - [x] Mission Control themed variables for modal (header, content, card)
  - [ ] Pause/Stop API integration
- [x] Tab: History (table layout, not card)
  - [x] Table layout with columns: Status | Goal | Result | Trigger | Time | Duration | Actions
  - [x] Scroll container with custom scrollbar
  - [x] Infinite scroll loading (reference: assistants/index.tsx)
    - [x] useRef for container
    - [x] handleScroll: load more when 50px from bottom
    - [x] hasMore / loadingMore states
    - [x] Loading indicator at bottom
    - [x] "All loaded" message when done
    - [x] Auto-load for large screens (fill viewport before requiring scroll)
  - [x] Filter pills (All/Running/Completed/Failed/Cancelled)
  - [x] Search input (custom styled)
  - [x] Action buttons per row:
    - [x] Running: Pause + Stop
    - [x] Completed (with attachments): Download
    - [x] Failed: Retry
  - [x] Status-based styling (color-coded icons)
  - [x] Mock data: 90+ history executions across all robots
  - [x] Empty state
  - [ ] Time range filter (Last 7 days / Last 30 days / All) - deferred
- [x] Execution Detail Drawer (right-side, slides in) **COMPLETED**
  - [x] Drawer container (580px width, 60% max, 450px min)
  - [x] Header: title only + minimal close button (icon only, hover: cyan + scale)
  - [x] Meta bar: trigger type + start time + live duration | status badge (right aligned)
  - [x] Running state layout:
    - [x] Progress indicator (灵感→目标→任务→执行→交付→学习, user-friendly labels)
    - [x] Current Task section with pulse animation
    - [x] Progress bar with shimmer effect
    - [x] Goals section (expanded)
    - [x] Tasks list with status icons
    - [x] Control buttons (Pause/Resume/Stop)
  - [x] Completed state layout:
    - [x] Results section (Summary + Body + Delivery status badge)
    - [x] Attachments list with download icons
    - [x] Goals section (collapsible, default closed)
    - [x] Tasks section (collapsible, default closed)
    - [x] Action buttons (Re-run/Download)
  - [x] Failed state layout:
    - [x] Error section (prominent with warning icon)
    - [x] Progress showing failure point (collapsible, default closed)
    - [x] Goals section (collapsible, default closed)
    - [x] Tasks section (collapsible, show failure point with red highlight)
    - [x] Retry button
  - [x] Cancelled state layout:
    - [x] Cancelled notice with icon
    - [x] Re-run button
  - [x] Collapsible sections (<details>/<summary> with expand icon animation)
  - [x] Attachment download handler
  - [x] Custom scrollbar (themed)
  - [x] Accessible from both Active Tab and History Tab
  - [x] Slide-in animation (cubic-bezier)
  - [x] Keyboard support (Escape to close)
  - [x] Click overlay to close
  - [x] Mock data: enhanced executions with goals and tasks (active + history)
- [x] Tab: Results ✅ **COMPLETED**
  - [x] Results List (Table Layout)
    - [x] Table structure (Title | Trigger | Time | Attachments | Action)
    - [x] Search input (filter by title/summary)
    - [x] Trigger type filter dropdown (All/Clock/Human/Event)
    - [x] Infinite scroll loading (same pattern as History Tab)
    - [x] Row click → open Result Detail Modal
    - [x] Action column: Download button if has attachments
    - [x] Row hover highlight
    - [x] Empty state
    - [x] Mock data: deliveries with summary + body + attachments
    - [x] Circular badge for attachment count (consistent with list page)
  - [x] Result Detail Modal (top-level, same level as AgentModal)
    - [x] Modal container (90vh height, 90% width, same as AgentModal)
    - [x] Header with tabs: Content | Attachments (with count badge)
    - [x] Content Tab:
      - [x] Meta bar (trigger type + time, sticky, matches table header style)
      - [x] Summary box (card style, cyan left border)
      - [x] Article content - Markdown rendered (custom renderer)
        - [x] Headers (h1-h4), tables, code blocks, lists, blockquotes
        - [x] Inline code, bold/italic, links, horizontal rules
      - [x] Max-width: min(960px, 90%) for optimal reading
    - [x] Attachments Tab:
      - [x] File cards with icon + name + description + size
      - [x] Preview button (eye icon)
      - [x] Download button (cyan accent, primary style)
      - [x] Download All button in header
    - [x] Custom scrollbar (themed)
    - [x] Keyboard support (Escape to close)
    - [x] Light/Dark mode support with consistent colors
- [x] Tab: Settings (Left Menu + Right Panel Layout) ✅ **COMPLETED**
  - [x] Layout structure
    - [x] Left menu (vertical nav, 180px width)
    - [x] Right panel (scrollable content, max-width 640px centered)
    - [x] Save button (fixed bottom-right in panel footer)
  - [x] Menu items (dynamic based on autonomous_mode)
    - [x] Basic (always visible)
    - [x] Identity (always visible)
    - [x] Schedule (only when autonomous_mode = true)
    - [x] Advanced (always visible)
  - [x] Panel 1: Basic (from `__yao.member`)
    - [x] display_name (Input, required)
    - [x] robot_email (Input + domain Select, required)
    - [x] role_id (Select, fetch from Role API)
    - [x] manager_id (Select, fetch from Team API)
    - [x] bio (TextArea)
    - [x] autonomous_mode (RadioGroup: 自主模式/Autonomous first, 按需模式/On Demand)
  - [x] Panel 2: Identity & Resources (from `__yao.member` + `robot_config`)
    - [x] system_prompt (TextArea + AI Generate button with loading state)
    - [x] language_model (Select, fetch from LLM API)
    - [x] cost_limit (InputNumber, monthly budget)
    - [x] agents (CheckboxGroup, accessible AI assistants)
    - [x] mcp_servers (CheckboxGroup, accessible tools)
    - [x] robot_config.kb.collections (CheckboxGroup, accessible knowledge)
    - [x] robot_config.db.models (CheckboxGroup, accessible data)
  - [x] Panel 3: Schedule (from `robot_config.clock`)
    - [x] clock.mode (Custom radio: 定时执行/At Specific Times, 间隔执行/At Regular Intervals, 持续运行/Continuous)
    - [x] clock.times (TimePicker list with add/remove, when mode=times)
    - [x] clock.days (Checkbox chips: Mon-Sun, when mode=times)
    - [x] clock.every + unit (InputNumber + Select, when mode=interval)
    - [x] clock.tz (Select, timezone)
    - [x] Note: Results sent to manager by default
  - [x] Panel 4: Advanced (from `robot_config`)
    - [x] Delivery section
      - [x] Additional email recipients (tag list with validation + error hints)
      - [x] Webhook (multi-target with URL + optional Secret/InputPassword)
      - [x] Yao Process (multi-target)
    - [x] Concurrency section (grid layout, aligned)
      - [x] quota.max (InputNumber)
      - [x] quota.queue (InputNumber)
      - [x] quota.priority (InputNumber, 1-10)
      - [x] executor.timeout (InputNumber, minutes)
    - [x] Testing section
      - [x] executor.mode (Switch: dry run mode)
    - [x] Learning section
      - [x] learn.on (Switch)
      - [x] learn.types (CheckboxGroup: execution/feedback/insight, conditional)
      - [x] learn.keep (InputNumber, days, conditional)
    - [x] Triggers section
      - [x] triggers.intervene.enabled (Switch: accept ad-hoc tasks)
      - [x] triggers.event.enabled (Switch: trigger on events)
    - [x] Developer Options section (moved to bottom)
      - [x] Phase agents (5 configurable: inspiration/goals/tasks/delivery/learning)
      - [x] inspiration only visible when autonomous_mode = true
      - [x] run phase removed (built-in scheduler, not configurable)
      - [x] User-friendly labels (洞察发现/Discover insights, etc.)
  - [x] UI/UX improvements
    - [x] Tab renamed: Config → Settings (设置)
    - [x] Form max-width (640px) + centered
    - [x] Email validation with error messages
    - [x] Webhook URL validation
    - [x] Generate button fixed width (no size change on loading)
    - [x] Concurrency grid aligned (6-column layout)
  - [ ] Form state management (useConfigForm hook) - TODO
  - [ ] Save API integration (PATCH member + robot_config) - TODO
  - [ ] Validation (required fields, email uniqueness) - TODO
  - [ ] Loading states - TODO
  - [ ] Error handling - TODO
  - [x] i18n support (en/zh labels)

### 1.3 Drawers

- [x] **Assign Task Drawer** (refactored to use ChatDrawer)
  - [x] Wrapper component around ChatDrawer
  - [x] Header: "指派任务" / "Assign Task"
  - [x] Context: Agent name + trigger type (手动触发)
  - [x] Empty state: "向 {name} 描述任务" / "Describe task to {name}"
  - [x] Success state: "任务已启动" / "Task Started"
  - [ ] API integration: POST /api/robots/:id/trigger
- [x] **Execution Detail Drawer** (slides in from right inside Modal)
  - [x] Header with execution name + close button
  - [x] Meta bar: trigger type, start time, duration, status badge
  - [x] Style updates for consistency
    - [x] header/metaBar/footer use --color_mission_modal_border
    - [x] Same background colors as HistoryTab toolbar
  - [x] Running state: phase progress, current task, goals, task list
  - [x] Completed state: results with summary/body/attachments
  - [x] Failed state: error info with retry option
  - [x] Cancelled state: notice message
  - [x] Footer actions based on status
- [x] ChatDrawer (reusable base component)
  - [x] Shared by AssignTaskDrawer and GuideExecutionDrawer
  - [x] Props: context, title, emptyState, placeholder, successState
  - [x] Message list with user/assistant bubbles
  - [x] Typing indicator animation
  - [x] Creature avatar for assistant messages and empty state
  - [x] Attachment support (UI ready)
  - [x] Auto-resize textarea
  - [x] Keyboard shortcuts (⌘+Enter, Escape)
  - [x] Width consistent with ExecutionDetailDrawer (580px, max 60%, min 450px)
- [x] Guide Execution Drawer (renamed from "Intervention Drawer")
  - [x] Entry points:
    - [x] Quickreply icon button on ExecutionCard (running state only)
    - [x] "指导执行" / "Guide" button in ExecutionDetailDrawer footer
  - [x] Execution context panel (collapsible, default collapsed)
    - [x] Current task with progress
    - [x] Goals content
    - [x] Task list with status icons
  - [x] Chat-based interaction (natural language)
  - [x] Empty state with Creature avatar
  - [x] Simulated assistant responses based on user intent
  - [ ] API integration: POST /api/robots/:id/intervene

### 1.4 Add Agent Modal (Create Agent)

> Two-step wizard for creating new AI Agents. Only essential fields for immediate setup.
> Advanced settings can be configured later in Settings Tab.

- [x] Modal container
  - [x] Width: 880px fixed
  - [x] Position: top: 10vh (upper area)
  - [x] Max-height: 80vh with auto height
  - [x] Style: Consistent with ResultDetailModal (--color_mission_modal_* variables)
- [x] Two-step wizard with step indicator in header
  - [x] Step 1: Basic Info → Step 2: Identity
  - [x] Step indicator shows progress (number/checkmark)
  - [x] Back/Next navigation
- [x] Step 1: Basic Info
  - [x] display_name (Input, required)
  - [x] robot_email (Input + @ + domain Select, required)
  - [x] manager_id (Select, required) with hint text
  - [x] autonomous_mode (RadioGroup: Autonomous / On Demand) with dynamic hint
- [x] Step 2: Identity
  - [x] system_prompt (TextArea + AI Generate button, required)
  - [x] agents (CheckboxGroup, at least one required)
- [x] Footer with aligned buttons
  - [x] Step 1: Cancel / Next
  - [x] Step 2: Back / Create Agent
  - [x] Buttons aligned with close button position
- [x] Validation
  - [x] Step 1: Required fields (name, email, manager)
  - [x] Step 2: Required fields (system_prompt, agents)
  - [x] Error messages displayed below fields
- [x] Behaviors
  - [x] AI Generate prompt with loading state
  - [x] Custom discard confirmation dialog (styled, not browser native)
  - [x] Form dirty check before close
  - [ ] Submit: Create via API, close modal, refresh grid
- [x] i18n support (en/zh labels)

---

## Phase 2: API Integration

### 2.1 Robot API

- [ ] `useRobots` hook
  - [ ] GET /api/robots - list all robots
  - [ ] Polling: 2 minute interval
- [ ] `useRobot` hook
  - [ ] GET /api/robots/:id - single robot
- [ ] `useRobotStatus` hook
  - [ ] GET /api/robots/:id/status - runtime status
- [ ] Robot mutations
  - [ ] POST /api/robots - create
  - [ ] PATCH /api/robots/:id - update
  - [ ] DELETE /api/robots/:id - delete

### 2.2 Execution API

- [ ] `useExecutions` hook
  - [ ] GET /api/robots/:id/executions - list
  - [ ] Pagination support
  - [ ] Filter by status
- [ ] `useExecution` hook
  - [ ] GET /api/executions/:id - single execution
- [ ] Execution mutations
  - [ ] POST /api/robots/:id/trigger - manual trigger
  - [ ] POST /api/robots/:id/intervene - intervention
  - [ ] POST /api/executions/:id/pause
  - [ ] POST /api/executions/:id/resume
  - [ ] POST /api/executions/:id/stop

### 2.3 Results API

- [ ] `useResults` hook
  - [ ] GET /api/robots/:id/results - list all
  - [ ] Pagination support
  - [ ] Filter by type
- [ ] File operations
  - [ ] GET /api/results/:id - file info
  - [ ] GET /api/results/:id/preview - preview
  - [ ] GET /api/results/:id/download - download

### 2.4 Polling Setup

- [ ] Configure 2-minute polling for robot list
- [ ] Refresh on window focus
- [ ] Manual refresh button
- [ ] Loading states
- [ ] Error handling

---

## Mock Data Structure

Based on `yao/agent/robot/types` and `yao/agent/robot/api`.

```typescript
// types.ts - aligned with backend types

// RobotStatus (from types/enums.go)
type RobotStatus = 'idle' | 'working' | 'paused' | 'error' | 'maintenance';

// Phase (from types/enums.go)
type Phase = 'inspiration' | 'goals' | 'tasks' | 'run' | 'delivery' | 'learning';

// TriggerType (from types/enums.go)
type TriggerType = 'clock' | 'human' | 'event';

// ExecStatus (from types/enums.go)
type ExecStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

// TaskStatus (from types/enums.go)
type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'cancelled';

// ClockMode (from types/enums.go)
type ClockMode = 'times' | 'interval' | 'daemon';

// Clock config (from types/config.go)
interface Clock {
  mode: ClockMode;
  times?: string[];  // ["09:00", "14:00"]
  days?: string[];   // ["Mon", "Tue"] or ["*"]
  every?: string;    // "30m", "1h"
  tz?: string;       // "Asia/Shanghai"
}

// Identity (from types/config.go)
interface Identity {
  role: string;
  duties?: string[];
  rules?: string[];
}

// RobotState - from API Status() (api/types.go)
interface RobotState {
  member_id: string;
  team_id: string;
  display_name: string;
  status: RobotStatus;
  running: number;       // current running count
  max_running: number;   // quota max
  last_run?: string;     // ISO timestamp
  next_run?: string;     // ISO timestamp
  running_ids?: string[]; // execution IDs
}

// Task (from types/robot.go)
interface Task {
  id: string;
  goal_ref?: string;
  source: 'auto' | 'human' | 'event';
  executor_type: 'assistant' | 'mcp' | 'process';
  executor_id: string;
  status: TaskStatus;
  order: number;
  start_time?: string;
  end_time?: string;
}

// CurrentState (from types/robot.go)
interface CurrentState {
  task?: Task;
  task_index: number;
  progress?: string;  // "2/5 tasks"
}

// DeliveryAttachment (from types/robot.go)
interface DeliveryAttachment {
  title: string;
  description?: string;
  task_id?: string;
  file: string;  // __<uploader>://<fileID>
}

// DeliveryContent (from types/robot.go)
interface DeliveryContent {
  summary: string;
  body: string;  // markdown
  attachments?: DeliveryAttachment[];
}

// Execution (from types/robot.go + api/types.go)
interface Execution {
  id: string;
  member_id: string;
  team_id: string;
  trigger_type: TriggerType;
  start_time: string;
  end_time?: string;
  status: ExecStatus;
  phase: Phase;
  error?: string;
  job_id: string;
  
  // Phase outputs
  goals?: { content: string };
  tasks?: Task[];
  current?: CurrentState;
  delivery?: {
    content?: DeliveryContent;
    success: boolean;
    sent_at?: string;
  };
}
```

```typescript
// mock/data.ts

import { RobotState, Execution } from '../types';

export const mockRobots: RobotState[] = [
  {
    member_id: 'robot_001',
    team_id: 'team_001',
    display_name: 'Sales Analyst',
    status: 'working',
    running: 2,
    max_running: 3,
    last_run: '2026-01-19T14:00:00Z',
    next_run: null,
    running_ids: ['exec_001', 'exec_002'],
  },
  {
    member_id: 'robot_002',
    team_id: 'team_001',
    display_name: 'Content Writer',
    status: 'idle',
    running: 0,
    max_running: 2,
    last_run: '2026-01-19T09:00:00Z',
    next_run: '2026-01-20T09:00:00Z',
    running_ids: [],
  },
  {
    member_id: 'robot_003',
    team_id: 'team_001',
    display_name: 'Data Monitor',
    status: 'error',
    running: 0,
    max_running: 2,
    last_run: '2026-01-19T12:00:00Z',
    next_run: null,
    running_ids: [],
  },
  {
    member_id: 'robot_004',
    team_id: 'team_001',
    display_name: 'Support Agent',
    status: 'paused',
    running: 0,
    max_running: 2,
    last_run: '2026-01-18T17:00:00Z',
    next_run: null,
    running_ids: [],
  },
];

export const mockExecutions: Execution[] = [
  {
    id: 'exec_001',
    member_id: 'robot_001',
    team_id: 'team_001',
    trigger_type: 'clock',
    status: 'running',
    phase: 'run',
    start_time: '2026-01-19T14:00:00Z',
    job_id: 'job_001',
    current: {
      task_index: 2,
      progress: '3/5 tasks',
    },
    tasks: [
      { id: 't1', status: 'completed', order: 0, executor_type: 'assistant', executor_id: 'data-analyst', source: 'auto' },
      { id: 't2', status: 'completed', order: 1, executor_type: 'mcp', executor_id: 'database', source: 'auto' },
      { id: 't3', status: 'running', order: 2, executor_type: 'assistant', executor_id: 'report-writer', source: 'auto' },
      { id: 't4', status: 'pending', order: 3, executor_type: 'process', executor_id: 'charts.Generate', source: 'auto' },
      { id: 't5', status: 'pending', order: 4, executor_type: 'assistant', executor_id: 'reviewer', source: 'auto' },
    ],
  },
  {
    id: 'exec_002',
    member_id: 'robot_001',
    team_id: 'team_001',
    trigger_type: 'human',
    status: 'running',
    phase: 'tasks',
    start_time: '2026-01-19T14:30:00Z',
    job_id: 'job_002',
    current: {
      task_index: 0,
      progress: '0/2 tasks',
    },
  },
  {
    id: 'exec_003',
    member_id: 'robot_001',
    team_id: 'team_001',
    trigger_type: 'clock',
    status: 'completed',
    phase: 'delivery',
    start_time: '2026-01-19T09:00:00Z',
    end_time: '2026-01-19T09:12:34Z',
    job_id: 'job_003',
    delivery: {
      content: {
        summary: 'Daily sales report generated successfully.',
        body: '## Sales Report\n\nTotal sales: $12,500\nGrowth: +15%\n\n...',
        attachments: [
          { title: 'Sales Report.pdf', file: '__attachment://file_001' },
          { title: 'Sales Data.xlsx', file: '__attachment://file_002' },
        ],
      },
      success: true,
      sent_at: '2026-01-19T09:12:40Z',
    },
  },
  {
    id: 'exec_004',
    member_id: 'robot_003',
    team_id: 'team_001',
    trigger_type: 'event',
    status: 'failed',
    phase: 'run',
    start_time: '2026-01-19T12:00:00Z',
    end_time: '2026-01-19T12:05:23Z',
    job_id: 'job_004',
    error: 'Database connection timeout',
  },
];

// Robot config for Agent Modal Config Tab
export const mockRobotConfigs: Record<string, any> = {
  robot_001: {
    identity: {
      role: 'Sales Analyst',
      duties: [
        'Generate daily/weekly sales reports',
        'Analyze sales trends and patterns',
        'Alert on significant changes',
      ],
    },
    clock: {
      mode: 'times',
      times: ['09:00', '14:00', '17:00'],
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      tz: 'Asia/Shanghai',
    },
    quota: { max: 3, queue: 10 },
    resources: {
      agents: ['data-analyst', 'report-writer', 'reviewer'],
      mcp: [{ id: 'database', tools: ['query', 'aggregate'] }],
    },
    delivery: {
      email: {
        enabled: true,
        targets: [{ to: ['manager@example.com'], template: 'sales-report' }],
      },
    },
  },
};
```

---

## File Structure

```
pages/mission-control/
├── index.tsx              ✅ Main page with all components inline
├── index.less             ✅ All styles (Header, Clock, Grid, Cards, Activity)
├── types.ts               ✅ TypeScript interfaces
├── TODO.md
├── DESIGN.md
│
├── mock/
│   └── data.ts            ✅ Mock robots, executions, deliveries with i18n
│
├── components/
│   ├── Modal/             ✅ Custom modal with glassmorphism
│   │   ├── index.tsx
│   │   └── index.less
│   │
│   ├── AgentModal/        ✅ Agent detail modal with 4 tabs
│   │   ├── index.tsx
│   │   ├── index.less
│   │   └── tabs/
│   │       ├── ActiveTab.tsx      ✅ Running executions
│   │       ├── HistoryTab.tsx     ✅ Execution history table
│   │       ├── ResultsTab.tsx     ✅ Deliverables list
│   │       └── ConfigTab/         ✅ Settings Tab (renamed from Config)
│   │           ├── index.tsx
│   │           ├── index.less
│   │           └── panels/
│   │               ├── BasicPanel.tsx
│   │               ├── IdentityPanel.tsx
│   │               ├── SchedulePanel.tsx
│   │               └── AdvancedPanel.tsx
│   │
│   ├── ExecutionCard/     ✅ Execution status card
│   │   ├── index.tsx
│   │   └── index.less
│   │
│   ├── ExecutionDetailDrawer/  ✅ Execution detail (running/completed/failed)
│   │   ├── index.tsx
│   │   └── index.less
│   │
│   ├── ChatDrawer/       ✅ Reusable chat drawer base component
│   │   ├── index.tsx         (shared by AssignTask & GuideExecution)
│   │   └── index.less
│   │
│   ├── AssignTaskDrawer/  ✅ Human trigger input (uses ChatDrawer)
│   │   └── index.tsx
│   │
│   ├── GuideExecutionDrawer/ ✅ Guide running execution (uses ChatDrawer)
│   │   └── index.tsx
│   │
│   ├── ResultDetailModal/ ✅ Deliverable detail (content + attachments)
│   │   ├── index.tsx
│   │   └── index.less
│   │
│   └── AddAgentModal/     ✅ Two-step wizard for creating agents
│       ├── index.tsx
│       └── index.less
│
├── hooks/                  ⬜ TODO (Phase 2)
│   ├── useRobots.ts
│   ├── useRobot.ts
│   ├── useExecutions.ts
│   ├── useResults.ts
│   └── useClock.ts
│
└── services/               ⬜ TODO (Phase 2)
    └── api.ts
```

---

## Progress Tracking

| Phase | Task | Status |
|-------|------|--------|
| 1.1 | Main Page (Header, Clock, Grid, Station Card, Theme, Responsive) | ✅ Complete |
| 1.1 | Activity Banner & Modal | ✅ Complete |
| 1.1 | Custom Modal Component | ✅ Complete |
| 1.1 | Creature Widget (`@/widgets/Creature`) | ✅ Complete |
| 1.2 | Agent Modal - Shell (Header, Tabs) | ✅ Complete |
| 1.2 | Agent Modal - Active Tab (ExecutionCard) | ✅ Complete |
| 1.2 | Agent Modal - History Tab | ✅ Complete |
| 1.2 | Execution Detail Drawer | ✅ Complete |
| 1.2 | Agent Modal - Results Tab | ✅ Complete |
| 1.2 | Result Detail Modal | ✅ Complete |
| 1.2 | Agent Modal - Settings Tab | ✅ Complete (UI, pending API) |
| 1.3 | Assign Task Drawer | ✅ Complete |
| 1.3 | Guide Execution Drawer | ✅ Complete (UI, pending API) |
| 1.4 | Add Agent Modal | ✅ Complete (UI, pending API) |
| 2.1 | Robot API | ⬜ |
| 2.2 | Execution API | ⬜ |
| 2.3 | Results API | ⬜ |
| 2.4 | Polling Setup | ⬜ |

Legend: ⬜ Not started | 🟡 In progress | ✅ Complete

---

## Current Focus: Config Tab

**Recently Completed:**
- [x] Results Tab - List + Detail Modal ✅
  - [x] Table layout with search, trigger filter, infinite scroll
  - [x] Result Detail Modal (top-level, same as AgentModal)
    - [x] Tabbed interface: Content | Attachments
    - [x] Custom Markdown renderer (headers, tables, code blocks, lists, etc.)
    - [x] Meta bar (sticky, matches table header style)
    - [x] Summary box (card style)
    - [x] Attachment cards with preview/download
    - [x] Light/Dark mode consistent colors
    - [x] Circular badge for attachment count

**Completed: Settings Tab** ✅

Settings Tab UI implementation completed with:
- Left Menu + Right Panel layout (180px menu, 640px max content)
- 4 panels: Basic, Identity & Resources, Schedule, Advanced
- Dynamic menu (Schedule only visible in autonomous mode)
- All form fields with i18n labels
- Email/URL validation with error messages
- Developer Options section at bottom (phase agents, excluding run phase)

**Completed: Add Agent Modal** ✅

Add Agent Modal (Create Agent) UI implementation completed with:
- Two-step wizard: Basic Info → Identity
- Step indicator in header with number/checkmark progress
- Step 1: Name, Email (prefix + domain), Manager, Work Mode (with dynamic hints)
- Step 2: Role & Responsibilities (with AI Generate), AI Assistants (multi-select)
- Custom discard confirmation dialog (styled, not browser native)
- Form validation with error messages
- Footer buttons aligned with close button
- Responsive design (880px width, max-height 80vh)
- i18n support (en/zh)

**Pending Items:**
1. ⬜ Backend API Implementation (see `API.md` for requirements)
2. Settings Tab API Integration (useConfigForm hook, save/load)
3. Guide Execution Drawer API Integration (POST /api/robots/:id/intervene)
4. Add Agent Modal API Integration (POST /api/robots, refresh grid)
5. API Integration (Phase 2)
