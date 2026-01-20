// Mission Control - Type Definitions
// Based on yao/agent/robot/types and yao/agent/robot/api

// ==================== Enums ====================

// RobotStatus (from types/enums.go)
export type RobotStatus = 'idle' | 'working' | 'paused' | 'error' | 'maintenance'

// Phase (from types/enums.go)
export type Phase = 'inspiration' | 'goals' | 'tasks' | 'run' | 'delivery' | 'learning'

// TriggerType (from types/enums.go)
export type TriggerType = 'clock' | 'human' | 'event'

// ExecStatus (from types/enums.go)
export type ExecStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

// TaskStatus (from types/enums.go)
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'cancelled'

// ClockMode (from types/enums.go)
export type ClockMode = 'times' | 'interval' | 'daemon'

// ExecutorType (from types/enums.go)
export type ExecutorType = 'assistant' | 'mcp' | 'process'

// TaskSource (from types/enums.go)
export type TaskSource = 'auto' | 'human' | 'event'

// ==================== Config Types ====================

// Clock config (from types/config.go)
export interface Clock {
	mode: ClockMode
	times?: string[] // ["09:00", "14:00"]
	days?: string[] // ["Mon", "Tue"] or ["*"]
	every?: string // "30m", "1h"
	tz?: string // "Asia/Shanghai"
}

// Identity (from types/config.go)
export interface Identity {
	role: string
	duties?: string[]
	rules?: string[]
}

// Quota (from types/config.go)
export interface Quota {
	max: number // max running (default: 2)
	queue: number // queue size (default: 10)
	priority: number // 1-10 (default: 5)
}

// MCPConfig (from types/config.go)
export interface MCPConfig {
	id: string
	tools?: string[] // empty = all
}

// DeliveryPreferences (from types/robot.go)
export interface DeliveryPreferences {
	email?: {
		enabled: boolean
		targets?: Array<{
			to: string[]
			template?: string
			subject?: string
		}>
	}
	webhook?: {
		enabled: boolean
		url?: string
		targets?: Array<{
			url: string
			method?: string
			headers?: Record<string, string>
		}>
	}
	notify?: {
		enabled: boolean
		channel?: string
	}
	process?: {
		enabled: boolean
		targets?: Array<{
			process: string
			args?: any[]
		}>
	}
}

// EventConfig (from types/config.go)
export interface EventConfig {
	type: 'webhook' | 'database'
	source: string
	filter?: Record<string, any>
}

// RobotConfig (from types/config.go)
export interface RobotConfig {
	identity?: Identity
	clock?: Clock
	events?: EventConfig[]
	quota?: Quota
	resources?: {
		phases?: Record<Phase, string>
		agents?: string[]
		mcp?: MCPConfig[]
	}
	delivery?: DeliveryPreferences
}

// ==================== API Types ====================

// RobotState - from API Status() (api/types.go)
export interface RobotState {
	member_id: string
	team_id: string
	name: string // unique identifier like 'seo-content-specialist'
	display_name: string // localized display name
	description?: string // brief description of what this robot does
	status: RobotStatus
	running: number // current running count
	max_running: number // quota max
	last_run?: string // ISO timestamp
	next_run?: string // ISO timestamp
	running_ids?: string[] // execution IDs
}

// Task (from types/robot.go)
export interface Task {
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

// CurrentState (from types/robot.go)
export interface CurrentState {
	task?: Task
	task_index: number
	progress?: string // "2/5 tasks"
}

// DeliveryAttachment (from types/robot.go)
export interface DeliveryAttachment {
	title: string
	description?: string
	task_id?: string
	file: string // __<uploader>://<fileID>
}

// DeliveryContent (from types/robot.go)
export interface DeliveryContent {
	summary: string
	body: string // markdown
	attachments?: DeliveryAttachment[]
}

// DeliveryResult (from types/robot.go)
export interface DeliveryResult {
	content?: DeliveryContent
	success: boolean
	sent_at?: string
}

// Execution (from types/robot.go + api/types.go)
export interface Execution {
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

	// UI display fields
	name?: { en: string; cn: string } // Execution name (from goals or human input)
	current_task_name?: { en: string; cn: string } // What the agent is doing RIGHT NOW

	// Phase outputs
	goals?: { content: string }
	tasks?: Task[]
	current?: CurrentState
	delivery?: DeliveryResult
}

// ==================== UI Specific Types ====================

// Extended RobotState for UI (includes config for display)
export interface Robot extends RobotState {
	config?: RobotConfig
}

// Result file for Results tab
export interface ResultFile {
	id: string
	member_id: string
	execution_id: string
	name: string
	type: string // pdf, xlsx, csv, json, etc.
	size: number // bytes
	created_at: string
	execution_name?: string
}
