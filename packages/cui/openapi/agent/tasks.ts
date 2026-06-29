import { OpenAPI } from '../openapi'
import { ApiResponse } from '../types'
import { BuildURL } from '../lib/utils'
import type { SecretEntry } from '../setting/types'

export interface TaskListQuery {
	run_status?: string
	assistant_id?: string
	board_id?: string
	page?: number
	pagesize?: number
}

export interface TaskItem {
	chat_id: string
	title?: string
	column_id?: string
	board_id?: string
	position: number
	pinned: boolean
	priority?: string
	tags?: string[]
	run_status: string
	progress?: number
	current_step?: string
	queue_priority?: number
	queued_at?: string
	duration?: number
	started_at?: string
	completed_at?: string
	error_message?: string
	run_count?: number
	assistant_id?: string
	assistant_name?: string
	last_workspace?: string
	workspace_name?: string
	last_connector?: string
	has_schedule?: boolean
	computer_id?: string
	computer_mode?: string
	sandbox_type?: string
	instruction?: string
	summary?: string
	created_at?: string
	updated_at?: string
}

export interface TaskListResponse {
	tasks: TaskItem[]
	total: number
	page: number
	pagesize: number
}

export interface CreateTaskRequest {
	chat_id?: string
	title?: string
	assistant_id: string
	board_id?: string
	column_id?: string
}

export interface UpdateTaskRequest {
	pinned?: boolean
	priority?: string
	tags?: string[]
	title?: string
	assistant_id?: string
	computer_id?: string
	computer_mode?: string
	sandbox_type?: string
	instruction?: string
	summary?: string
}

export interface MoveTaskRequest {
	board_id?: string
	column_id: string
	position?: number
}

export interface ServiceDecl {
	name: string
	port: number
	protocol?: string
	public?: boolean
}

export interface ScheduleConfig {
	enabled: boolean
	mode: string
	times?: string[]
	days?: string[]
	interval_value?: number
	interval_unit?: string
	timezone?: string
	start_date?: string
	end_date?: string
}

export interface TaskSetting {
	runner?: string
	runners?: string[]
	model?: string
	image?: string
	timeout?: string
	max_turns?: number
	secrets?: Record<string, SecretEntry>
	services?: ServiceDecl[]
	skills?: string[]
	schedule?: ScheduleConfig
}

export interface TaskConfig {
	setting: TaskSetting
	_resolved_from?: Record<string, string>
	_schedule_status?: {
		last_run?: string
		next_run?: string
		total_runs?: number
	}
}

export interface SetConfigRequest {
	runner?: string
	model?: string
	image?: string
	timeout?: string
	max_turns?: number
	secrets?: Record<string, string | null>
	services?: ServiceDecl[]
	skills?: string[]
	schedule?: ScheduleConfig
}

export interface RunnerInfo {
	name: string
	description: string
	available: boolean
	nodes: string[]
}

export interface PresetImage {
	name: string
	tag?: string
	description?: string
}

export class AgentTasks {
	constructor(private api: OpenAPI) {}

	async List(query?: TaskListQuery): Promise<ApiResponse<TaskListResponse>> {
		const params = new URLSearchParams()
		if (query) {
			if (query.run_status) params.append('run_status', query.run_status)
			if (query.assistant_id) params.append('assistant_id', query.assistant_id)
			if (query.board_id) params.append('board_id', query.board_id)
			if (query.page) params.append('page', query.page.toString())
			if (query.pagesize) params.append('pagesize', query.pagesize.toString())
		}
		const url = BuildURL('/agent/tasks', params)
		return this.api.Get(url)
	}

	async Get(chatId: string, locale?: string): Promise<ApiResponse<TaskItem>> {
		const url = locale ? `/agent/tasks/${chatId}?locale=${locale}` : `/agent/tasks/${chatId}`
		return this.api.Get(url)
	}

	async Create(req: CreateTaskRequest): Promise<ApiResponse<TaskItem>> {
		return this.api.Post('/agent/tasks', req)
	}

	async Update(chatId: string, req: UpdateTaskRequest): Promise<ApiResponse<TaskItem>> {
		return this.api.Put(`/agent/tasks/${chatId}`, req)
	}

	async Delete(chatId: string): Promise<ApiResponse<void>> {
		return this.api.Delete(`/agent/tasks/${chatId}`)
	}

	async Archive(chatId: string): Promise<ApiResponse<void>> {
		return this.api.Put(`/agent/tasks/${chatId}/archive`, {})
	}

	async Unarchive(chatId: string, columnId: string): Promise<ApiResponse<void>> {
		return this.api.Put(`/agent/tasks/${chatId}/unarchive`, { column_id: columnId })
	}

	async Move(chatId: string, req: MoveTaskRequest): Promise<ApiResponse<void>> {
		return this.api.Put(`/agent/tasks/${chatId}/move`, req)
	}

	async SetPriority(chatId: string, priority: number): Promise<ApiResponse<{ ok: boolean }>> {
		return this.api.Put(`/agent/tasks/${chatId}/priority`, { priority })
	}

	async GetConfig(chatId: string): Promise<ApiResponse<TaskConfig>> {
		return this.api.Get(`/agent/tasks/${chatId}/config`)
	}

	async SetConfig(chatId: string, req: SetConfigRequest): Promise<ApiResponse<TaskConfig>> {
		return this.api.Put(`/agent/tasks/${chatId}/config`, req)
	}

	async GetRunners(): Promise<ApiResponse<{ runners: RunnerInfo[] }>> {
		return this.api.Get('/agent/runners')
	}

	async GetImages(): Promise<ApiResponse<{ images: PresetImage[] }>> {
		return this.api.Get('/agent/images')
	}
}
