// Job Management Types

// ===== Base Types =====

export type JobStatus = 'draft' | 'ready' | 'running' | 'completed' | 'failed' | 'disabled' | 'deleted'
export type ExecutionStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
export type ScheduleType = 'once' | 'cron' | 'daemon'
export type ModeType = 'GOROUTINE' | 'PROCESS'
export type ExecutionType = 'process' | 'command'
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'panic'

// ===== Job Types =====

export interface Job {
	id: number
	job_id: string
	name: string
	icon?: string
	description?: string
	category_id: string
	category_name?: string
	max_worker_nums: number
	status: JobStatus
	mode: ModeType
	schedule_type: ScheduleType
	schedule_expression?: string
	max_retry_count: number
	default_timeout?: number
	priority: number
	created_by: string
	next_run_at?: string
	last_run_at?: string
	current_execution_id?: string
	config?: Record<string, any>
	sort: number
	enabled: boolean
	system: boolean
	readonly: boolean
	created_at: string
	updated_at: string
}

export interface Category {
	id: number
	category_id: string
	name: string
	icon?: string
	description?: string
	sort: number
	system: boolean
	enabled: boolean
	readonly: boolean
	created_at: string
	updated_at: string
}

export interface ExecutionOptions {
	priority: number
	shared_data: Record<string, any>
}

export interface ExecutionConfig {
	type: ExecutionType
	process_name?: string
	process_args?: any[]
	command?: string
	command_args?: string[]
	environment?: Record<string, string>
}

export interface Execution {
	id: number
	execution_id: string
	job_id: string
	status: ExecutionStatus
	trigger_category: string
	trigger_source?: string
	trigger_context?: any
	scheduled_at?: string
	worker_id?: string
	process_id?: string
	retry_attempt: number
	parent_execution_id?: string
	started_at?: string
	ended_at?: string
	timeout_seconds?: number
	duration?: number
	progress: number
	execution_config?: ExecutionConfig
	execution_options?: ExecutionOptions
	config_snapshot?: any
	result?: any
	error_info?: any
	stack_trace?: string
	metrics?: any
	context?: any
	created_at: string
	updated_at: string
}

export interface Log {
	id: number
	job_id: string
	level: LogLevel
	message: string
	context?: any
	source?: string
	execution_id?: string
	step?: string
	progress?: number
	duration?: number
	error_code?: string
	stack_trace?: string
	worker_id?: string
	process_id?: string
	timestamp: string
	sequence: number
	created_at: string
	updated_at: string
}

// ===== Request Types =====

export interface ListJobsRequest {
	page?: number
	pagesize?: number
	status?: JobStatus
	category_id?: string
	enabled?: boolean
	system?: boolean
	keywords?: string
	sort?: string
}

export interface ListExecutionsRequest {
	job_id: string
	page?: number
	pagesize?: number
	status?: ExecutionStatus
}

export interface ListLogsRequest {
	job_id?: string
	execution_id?: string
	page?: number
	pagesize?: number
	level?: LogLevel
}

export interface ListCategoriesRequest {
	enabled?: boolean
	system?: boolean
}

export interface StopJobRequest {
	job_id: string
}

export interface StopExecutionRequest {
	execution_id: string
}

// ===== Response Types =====

export interface ListJobsResponse {
	data: Job[]
	page: number
	pagesize: number
	total: number
}

export interface ListExecutionsResponse {
	data: Execution[]
	page: number
	pagesize: number
	total: number
	job_id: string
}

export interface ListLogsResponse {
	data: Log[]
	page: number
	pagesize: number
	total: number
}

export interface ListCategoriesResponse {
	data: Category[]
	total: number
}

export interface JobProgressResponse {
	job_id: string
	status: JobStatus
	progress: number
	total_executions: number
	completed_count: number
	running_count: number
	failed_count: number
	last_run_at?: string
	next_run_at?: string
}

export interface ExecutionProgressResponse {
	execution_id: string
	job_id: string
	status: ExecutionStatus
	progress: number
	started_at?: string
	ended_at?: string
	duration?: number
	worker_id?: string
	process_id?: string
	retry_attempt: number
	error_info?: any
	result?: any
}

export interface JobStatsResponse {
	total_jobs: number
	running_jobs: number
	completed_jobs: number
	failed_jobs: number
	category_stats: Record<string, number>
	total_categories: number
}

export interface StopJobResponse {
	message: string
	job_id: string
	status: string
}

export interface StopExecutionResponse {
	message: string
	execution_id: string
	job_id: string
	status: string
}

// ===== Error Types =====

export interface JobError {
	error: string
	code?: string
	details?: any
}
