/**
 * Robot API Types
 * Provides types for robot management functionality
 * Aligned with backend: yao/openapi/agent/robot/types.go
 */

/**
 * Robot status values
 */
export type RobotStatus = 'idle' | 'working' | 'paused' | 'error' | 'maintenance'

/**
 * Member status values
 */
export type MemberStatus = 'active' | 'inactive' | 'pending' | 'suspended'

/**
 * Robot filter options for listing robots
 */
export interface RobotFilter {
	/** Filter by robot status */
	status?: RobotStatus
	/** Search in display_name and bio */
	keywords?: string
	/** Filter by team ID */
	team_id?: string
	/** Filter by autonomous mode: true=autonomous only, false=on-demand only, undefined=all */
	autonomous_mode?: boolean
	/** Page number, starting from 1 */
	page?: number
	/** Items per page */
	pagesize?: number
}

/**
 * Robot data structure
 * Aligned with backend Response struct
 */
export interface Robot {
	/** Database ID */
	id?: number
	/** Robot name (mapped from member_id for frontend) */
	name: string
	/** Robot description (mapped from bio for frontend) */
	description: string
	/** Unique robot identifier */
	member_id: string
	/** Team ID this robot belongs to */
	team_id: string
	/** Member status */
	status: MemberStatus
	/** Robot runtime status */
	robot_status: RobotStatus
	/** Whether autonomous mode is enabled */
	autonomous_mode: boolean
	/** Display name */
	display_name: string
	/** Robot bio/description */
	bio?: string
	/** Avatar URL */
	avatar?: string
	/** System prompt */
	system_prompt?: string
	/** Role ID within team */
	role_id?: string
	/** Direct manager user_id */
	manager_id?: string
	/** Robot email address */
	robot_email?: string
	/** Email whitelist */
	authorized_senders?: string[]
	/** Email filter rules */
	email_filter_rules?: any[]
	/** Robot configuration */
	robot_config?: Record<string, any>
	/** Accessible agents */
	agents?: string[]
	/** MCP servers */
	mcp_servers?: string[]
	/** Language model name */
	language_model?: string
	/** Monthly cost limit USD */
	cost_limit?: number
	/** Who invited this robot */
	invited_by?: string
	/** When the robot joined */
	joined_at?: string
	/** Creation timestamp */
	created_at?: string
	/** Last update timestamp */
	updated_at?: string
}

/**
 * Robot status response
 * Runtime status information
 */
export interface RobotStatusResponse {
	/** Robot member ID */
	member_id: string
	/** Team ID */
	team_id: string
	/** Display name */
	display_name: string
	/** Bio */
	bio?: string
	/** Robot runtime status */
	status: RobotStatus
	/** Current running executions count */
	running: number
	/** Maximum concurrent executions */
	max_running: number
	/** Last run timestamp */
	last_run?: string
	/** Next scheduled run timestamp */
	next_run?: string
	/** IDs of running executions */
	running_ids?: string[]
}

/**
 * Robot list response
 */
export interface RobotListResponse {
	/** List of robots */
	data: Robot[]
	/** Total number of robots */
	total: number
	/** Current page number */
	page: number
	/** Items per page */
	pagesize: number
}

/**
 * Robot create request
 */
export interface RobotCreateRequest {
	/** Unique robot identifier (optional, auto-generated if not provided) */
	member_id?: string
	/** Team ID (optional, defaults to auth team or user_id for personal users) */
	team_id?: string
	/** Display name (required) */
	display_name: string
	/** Robot bio/description */
	bio?: string
	/** Avatar URL */
	avatar?: string
	/** System prompt */
	system_prompt?: string
	/** Role ID within team */
	role_id?: string
	/** Direct manager user_id */
	manager_id?: string
	/** Member status */
	status?: MemberStatus
	/** Robot runtime status */
	robot_status?: RobotStatus
	/** Whether autonomous mode is enabled */
	autonomous_mode?: boolean
	/** Robot email address */
	robot_email?: string
	/** Email whitelist */
	authorized_senders?: string[]
	/** Email filter rules */
	email_filter_rules?: any[]
	/** Robot configuration */
	robot_config?: Record<string, any>
	/** Accessible agents */
	agents?: string[]
	/** MCP servers */
	mcp_servers?: string[]
	/** Language model name */
	language_model?: string
	/** Monthly cost limit USD */
	cost_limit?: number
}

/**
 * Robot update request
 * All fields are optional for partial updates
 */
export interface RobotUpdateRequest {
	/** Display name */
	display_name?: string
	/** Robot bio/description */
	bio?: string
	/** Avatar URL */
	avatar?: string
	/** System prompt */
	system_prompt?: string
	/** Role ID within team */
	role_id?: string
	/** Direct manager user_id */
	manager_id?: string
	/** Member status */
	status?: MemberStatus
	/** Robot runtime status */
	robot_status?: RobotStatus
	/** Whether autonomous mode is enabled */
	autonomous_mode?: boolean
	/** Robot email address */
	robot_email?: string
	/** Email whitelist */
	authorized_senders?: string[]
	/** Email filter rules */
	email_filter_rules?: any[]
	/** Robot configuration */
	robot_config?: Record<string, any>
	/** Accessible agents */
	agents?: string[]
	/** MCP servers */
	mcp_servers?: string[]
	/** Language model name */
	language_model?: string
	/** Monthly cost limit USD */
	cost_limit?: number
}

/**
 * Robot delete response
 */
export interface RobotDeleteResponse {
	/** Deleted robot member_id */
	member_id: string
	/** Deletion status */
	deleted: boolean
}

// ==================== Execution Types ====================

/**
 * Execution status values
 */
export type ExecStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'

/**
 * Trigger type values
 */
export type TriggerType = 'clock' | 'human' | 'event'

/**
 * Phase values
 */
export type Phase = 'inspiration' | 'goals' | 'tasks' | 'run' | 'delivery' | 'learning'

/**
 * Execution filter options for listing executions
 */
export interface ExecutionFilter {
	/** Filter by execution status */
	status?: ExecStatus
	/** Filter by trigger type */
	trigger_type?: TriggerType
	/** Search keyword in execution details */
	keyword?: string
	/** Page number, starting from 1 */
	page?: number
	/** Items per page */
	pagesize?: number
}

/**
 * Execution response from API
 * Aligned with backend: yao/openapi/agent/robot/types.go ExecutionResponse
 */
export interface ExecutionResponse {
	/** Execution ID */
	id: string
	/** Robot member ID */
	member_id: string
	/** Team ID */
	team_id: string
	/** How execution was triggered */
	trigger_type: TriggerType
	/** Current status */
	status: ExecStatus
	/** Current phase */
	phase: Phase
	/** When execution started */
	start_time: string
	/** When execution ended (if completed/failed/cancelled) */
	end_time?: string
	/** Error message (if failed) */
	error?: string

	/** Execution title (localized by backend) */
	name?: string
	/** Current task description (localized by backend) */
	current_task_name?: string

	/** Inspiration phase output */
	inspiration?: any
	/** Goals phase output */
	goals?: any
	/** Tasks phase output */
	tasks?: any
	/** Current execution state */
	current?: any
	/** Run phase results */
	results?: any
	/** Delivery phase output */
	delivery?: any
	/** Trigger input data */
	input?: any
}

/**
 * Execution list response
 */
export interface ExecutionListResponse {
	/** List of executions */
	data: ExecutionResponse[]
	/** Total number of executions */
	total: number
	/** Current page number */
	page: number
	/** Items per page */
	pagesize: number
}

/**
 * Execution control response (pause/resume/cancel)
 */
export interface ExecutionControlResponse {
	/** Execution ID */
	execution_id: string
	/** Action performed */
	action: 'paused' | 'resumed' | 'cancelled'
	/** Whether action succeeded */
	success: boolean
	/** Optional message */
	message?: string
}
