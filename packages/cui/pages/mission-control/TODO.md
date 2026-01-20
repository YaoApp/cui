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
- [ ] Fullscreen mode
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
  - [ ] Execution Detail Drawer (on click [→])
  - [ ] Pause/Stop API integration
- [ ] Tab: History
  - [ ] Filter buttons (All/Completed/Failed)
  - [ ] Search input
  - [ ] Execution list items
    - [ ] Status icon (✓/✗)
    - [ ] Execution name
    - [ ] Date, trigger type, duration
    - [ ] Summary text
    - [ ] Attachment count
    - [ ] View button
  - [ ] Load more button
  - [ ] Empty state
- [ ] Tab: Results
  - [ ] Filter by type (All/Reports/Data/Charts)
  - [ ] Sort options (Latest/Name/Type)
  - [ ] Search input
  - [ ] File list items
    - [ ] File type icon (📄📊📈 etc.)
    - [ ] File name
    - [ ] Date, source execution, size
    - [ ] Preview button
    - [ ] Download button
  - [ ] Load more button
  - [ ] Empty state
- [ ] Tab: Config
  - [ ] Agent identity display
  - [ ] Trigger settings display
  - [ ] Resources display
  - [ ] Delivery settings display
  - [ ] Edit button (opens Config Modal)

### 1.3 Drawers

- [x] **Assign Task Drawer** (slides in from right inside Modal)
  - [x] Header: "Assign Task" + close button
  - [x] Message history area (placeholder)
    - [x] Empty state: "Assign task to [Agent Name]"
    - [x] Example hint text
  - [x] Input area (fixed at bottom)
    - [x] Text input (supports ⌘+Enter to send)
    - [x] Attachment button [📎] (placeholder)
    - [x] Send button [📤]
  - [x] Success state: "✓ Task Assigned"
  - [x] Mission Control themed styling
  - [ ] Integrate real API: POST /api/robots/:id/trigger
  - [x] On success: refresh Active Tab (callback ready)
- [ ] Execution Detail Drawer (right side, slide animation)
  - [ ] Header with title and close button
  - [ ] Status, trigger, duration info
  - [ ] Phases list (expandable)
    - [ ] Phase name, status, duration
    - [ ] Expand to show phase output
  - [ ] Tasks list
    - [ ] Task name, executor, duration
    - [ ] Status indicator
  - [ ] Delivery section
    - [ ] Summary
    - [ ] Report content (expandable)
    - [ ] Attachments with download
    - [ ] Delivery channels status
  - [ ] Action buttons (Re-run, Re-deliver)
- [ ] Intervention Drawer (right side, slide animation)
  - [ ] Header with context info
  - [ ] Action type radio buttons
  - [ ] Instruction textarea
  - [ ] Priority selection (First/Next/Last)
  - [ ] Send button

### 1.4 Add Agent Wizard

- [ ] Wizard modal container
- [ ] Step indicator
- [ ] Step 1: Identity
  - [ ] Name input
  - [ ] Role input
  - [ ] Duties list
  - [ ] Avatar selection
- [ ] Step 2: Trigger
  - [ ] Clock mode selection
  - [ ] Time/interval configuration
  - [ ] Event types (if applicable)
- [ ] Step 3: Resources
  - [ ] Available agents selection
  - [ ] MCP servers selection
  - [ ] KB collections selection
- [ ] Step 4: Delivery
  - [ ] Email targets
  - [ ] Webhook targets
  - [ ] Process targets
- [ ] Step 5: Review
  - [ ] Summary of all settings
  - [ ] Confirm button
- [ ] Navigation (Back/Next/Cancel)

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
│   └── data.ts            ✅ Mock robots, executions, activities with i18n
│
├── components/
│   ├── Modal/             ✅ Custom modal with glassmorphism
│   │   ├── index.tsx
│   │   └── index.less
│   │
│   ├── AgentModal/        ⬜ TODO
│   │   ├── index.tsx
│   │   ├── index.less
│   │   ├── tabs/
│   │   │   ├── ActiveTab.tsx
│   │   │   ├── HistoryTab.tsx
│   │   │   ├── ResultsTab.tsx
│   │   │   └── ConfigTab.tsx
│   │   ├── ExecutionCard.tsx
│   │   └── FileItem.tsx
│   │
│   ├── ExecutionDrawer/   ⬜ TODO
│   │   ├── index.tsx
│   │   ├── index.less
│   │   ├── PhaseList.tsx
│   │   └── TaskList.tsx
│   │
│   ├── InterventionDrawer/ ⬜ TODO
│   │   ├── index.tsx
│   │   └── index.less
│   │
│   └── AddAgentWizard/    ⬜ TODO
│       ├── index.tsx
│       ├── index.less
│       └── steps/
│           ├── Identity.tsx
│           ├── Trigger.tsx
│           ├── Resources.tsx
│           ├── Delivery.tsx
│           └── Review.tsx
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
| 1.1 | Main Page (Header, Clock, Grid, Station Card, Theme, Responsive) | 🟡 In progress (Fullscreen pending) |
| 1.1 | Activity Banner & Modal | ✅ Complete |
| 1.1 | Custom Modal Component | ✅ Complete |
| 1.1 | Creature Widget (`@/widgets/Creature`) | ✅ Complete |
| 1.2 | Agent Modal - Shell (Header, Tabs) | ✅ Complete |
| 1.2 | Agent Modal - Active Tab | 🟡 In progress (placeholder done) |
| 1.2 | Agent Modal - History Tab | ⬜ |
| 1.2 | Agent Modal - Results Tab | ⬜ |
| 1.2 | Agent Modal - Config Tab | ⬜ |
| 1.3 | Drawers (Execution Detail, Intervention) | ⬜ |
| 1.4 | Add Agent Wizard | ⬜ |
| 2.1 | Robot API | ⬜ |
| 2.2 | Execution API | ⬜ |
| 2.3 | Results API | ⬜ |
| 2.4 | Polling Setup | ⬜ |

Legend: ⬜ Not started | 🟡 In progress | ✅ Complete
