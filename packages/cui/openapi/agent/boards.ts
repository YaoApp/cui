import { OpenAPI } from '../openapi'
import { ApiResponse } from '../types'

export interface BoardSummary {
	board_id: string
	name: string
	icon?: string
	color?: string
	position: number
	task_count?: number
	created_at?: string
}

export interface BoardColumn {
	column_id: string
	name: string
	icon?: string
	color?: string
	position: number
	collapsed?: boolean
}

export interface Board extends BoardSummary {
	columns: BoardColumn[]
}

export interface BoardTemplate {
	template_id: string
	name: string
	description?: string
	columns: Array<{ name: string; icon?: string; color?: string }>
}

export interface CreateBoardRequest {
	name: string
	icon?: string
	color?: string
}

export interface UpdateBoardRequest {
	name?: string
	icon?: string
	color?: string
}

export interface CreateColumnRequest {
	name: string
	icon?: string
	color?: string
}

export interface UpdateColumnRequest {
	name?: string
	icon?: string
	color?: string
	collapsed?: boolean
}

export interface FromTemplateRequest {
	template_id: string
	name: string
	locale?: string
}

export class AgentBoards {
	constructor(private api: OpenAPI) {}

	async List(): Promise<ApiResponse<{ boards: BoardSummary[] }>> {
		return this.api.Get('/agent/boards')
	}

	async Get(boardId: string): Promise<ApiResponse<Board>> {
		return this.api.Get(`/agent/boards/${boardId}`)
	}

	async Create(req: CreateBoardRequest): Promise<ApiResponse<Board>> {
		return this.api.Post('/agent/boards', req)
	}

	async Update(boardId: string, req: UpdateBoardRequest): Promise<ApiResponse<Board>> {
		return this.api.Put(`/agent/boards/${boardId}`, req)
	}

	async Delete(boardId: string): Promise<ApiResponse<void>> {
		return this.api.Delete(`/agent/boards/${boardId}`)
	}

	async Templates(locale?: string): Promise<ApiResponse<BoardTemplate[]>> {
		const qs = locale ? `?locale=${encodeURIComponent(locale)}` : ''
		return this.api.Get(`/agent/boards/templates${qs}`)
	}

	async FromTemplate(req: FromTemplateRequest): Promise<ApiResponse<Board>> {
		return this.api.Post('/agent/boards/from-template', req)
	}

	async BoardTasks(boardId: string): Promise<ApiResponse<{ tasks: any[]; total: number }>> {
		return this.api.Get(`/agent/boards/${boardId}/tasks`)
	}

	async CreateColumn(boardId: string, req: CreateColumnRequest): Promise<ApiResponse<BoardColumn>> {
		return this.api.Post(`/agent/boards/${boardId}/columns`, req)
	}

	async UpdateColumn(
		boardId: string,
		columnId: string,
		req: UpdateColumnRequest
	): Promise<ApiResponse<BoardColumn>> {
		return this.api.Put(`/agent/boards/${boardId}/columns/${columnId}`, req)
	}

	async DeleteColumn(boardId: string, columnId: string): Promise<ApiResponse<void>> {
		return this.api.Delete(`/agent/boards/${boardId}/columns/${columnId}`)
	}

	async ReorderColumns(boardId: string, columnIds: string[]): Promise<ApiResponse<void>> {
		return this.api.Put(`/agent/boards/${boardId}/columns/reorder`, { column_ids: columnIds })
	}
}
