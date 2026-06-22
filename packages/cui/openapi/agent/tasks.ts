import { OpenAPI } from '../openapi'
import { ApiResponse } from '../types'
import { BuildURL } from '../lib/utils'

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
}

export interface MoveTaskRequest {
	board_id?: string
	column_id: string
	position?: number
}

export interface TaskConfig {
	setting: Record<string, any>
	_resolved_from?: Record<string, string>
	_schedule_status?: {
		last_run?: string
		next_run?: string
		total_runs?: number
	}
}

export interface SetConfigRequest {
	schedule?: Record<string, any>
	timeout?: string
	max_turns?: number
	model?: string
	secrets?: Record<string, string | null>
	skills?: string[]
	runner?: string
	image?: string
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

	async Get(chatId: string): Promise<ApiResponse<TaskItem>> {
		return this.api.Get(`/agent/tasks/${chatId}`)
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
}
