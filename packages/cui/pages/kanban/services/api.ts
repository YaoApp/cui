import type { Message } from '@/openapi'
import { Agent } from '@/openapi'
import { getLocale } from '@umijs/max'
import type { Board, BoardSummary, BoardTemplate, Column, KanbanTask, CreateTaskData, TaskStatus } from '../types'

function getAgent() {
	const openapi = window.$app?.openapi
	if (!openapi) throw new Error('OpenAPI not initialized')
	return new Agent(openapi)
}

function getOpenAPI() {
	const openapi = window.$app?.openapi
	if (!openapi) throw new Error('OpenAPI not initialized')
	return openapi
}

let activeBoardId: string | null = null

function mapColumn(col: any): Column {
	return {
		id: col.column_id,
		board_id: col.board_id || activeBoardId || '',
		title: col.name,
		position: col.position ?? 0,
		icon: col.icon,
		color: col.color,
		collapsed: col.collapsed
	}
}

function mapBoard(board: any): Board {
	return {
		id: board.board_id,
		title: board.name,
		icon: board.icon,
		color: board.color,
		columns: (board.columns || []).map((c: any) => mapColumn({ ...c, board_id: board.board_id })),
		created_at: new Date(board.created_at || 0).getTime(),
		updated_at: new Date(board.updated_at || 0).getTime()
	}
}

function mapBoardSummary(b: any): BoardSummary {
	return {
		id: b.board_id,
		title: b.name,
		icon: b.icon,
		color: b.color,
		task_count: b.task_count ?? 0,
		created_at: new Date(b.created_at || 0).getTime()
	}
}

function mapTask(t: any): KanbanTask {
	return {
		id: t.chat_id,
		title: t.title || '',
		description: '',
		status: (t.run_status || 'pending') as TaskStatus,
		column_id: t.column_id || '',
		position: t.position ?? 0,
		chat_id: t.chat_id,
		tags: t.tags,
		progress: t.progress,
		current_step: t.current_step,
		error_message: t.error_message,
		created_at: new Date(t.created_at || 0).getTime(),
		updated_at: new Date(t.updated_at || 0).getTime(),
		started_at: t.started_at ? new Date(t.started_at).getTime() : undefined,
		completed_at: t.completed_at ? new Date(t.completed_at).getTime() : undefined,
		duration: t.duration,
		run_count: t.run_count,
		assistant_id: t.assistant_id,
		assistant_name: t.assistant_name,
		connector_name: t.last_connector,
		pinned: t.pinned
	}
}

function mapTemplate(t: any): BoardTemplate {
	return {
		id: t.id,
		title: t.name,
		description: t.description || '',
		icon: t.icon || 'material-view_kanban',
		color: t.color || '#3B82F6',
		preview_columns: (t.columns || []).map((c: any) => c.name)
	}
}

export async function getBoards(): Promise<BoardSummary[]> {
	const agent = getAgent()
	const api = getOpenAPI()
	const res = await agent.boards.List()
	if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to list boards')
	return (res.data?.boards || []).map(mapBoardSummary)
}

export async function getBoard(boardId: string): Promise<Board> {
	const agent = getAgent()
	const api = getOpenAPI()
	const res = await agent.boards.Get(boardId)
	if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to get board')
	activeBoardId = boardId
	return mapBoard(res.data)
}

export async function createBoard(data: { title: string; icon?: string; color?: string }): Promise<Board> {
	const agent = getAgent()
	const api = getOpenAPI()
	const res = await agent.boards.Create({ name: data.title, icon: data.icon, color: data.color })
	if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to create board')
	return mapBoard(res.data)
}

export async function updateBoard(boardId: string, data: Partial<Board>): Promise<Board> {
	const agent = getAgent()
	const api = getOpenAPI()
	const req: Record<string, any> = {}
	if (data.title !== undefined) req.name = data.title
	if (data.icon !== undefined) req.icon = data.icon
	if (data.color !== undefined) req.color = data.color
	const res = await agent.boards.Update(boardId, req)
	if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to update board')
	return mapBoard(res.data)
}

export async function deleteBoard(boardId: string): Promise<void> {
	const agent = getAgent()
	const api = getOpenAPI()
	const res = await agent.boards.Delete(boardId)
	if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to delete board')
}

export async function getBoardTemplates(): Promise<BoardTemplate[]> {
	const agent = getAgent()
	const api = getOpenAPI()
	const locale = getLocale() || 'en-US'
	const res = await agent.boards.Templates(locale)
	if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to get templates')
	return (res.data || []).map(mapTemplate)
}

export async function createBoardFromTemplate(templateId: string, title?: string): Promise<Board> {
	const agent = getAgent()
	const api = getOpenAPI()
	const locale = getLocale() || 'en-US'
	const res = await agent.boards.FromTemplate({
		template_id: templateId,
		name: title || 'New Board',
		locale
	})
	if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to create from template')
	return mapBoard(res.data)
}

export async function getTasks(boardId: string): Promise<KanbanTask[]> {
	const agent = getAgent()
	const api = getOpenAPI()
	const res = await agent.boards.BoardTasks(boardId)
	if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to get tasks')
	return (res.data?.tasks || []).map(mapTask)
}

export async function getTaskDetail(taskId: string): Promise<KanbanTask> {
	const agent = getAgent()
	const api = getOpenAPI()
	const res = await agent.tasks.Get(taskId)
	if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to get task')
	return mapTask(res.data)
}

export async function getTaskMessages(taskId: string): Promise<Message[]> {
	const api = getOpenAPI()
	const res = await api.Get<{ messages: Message[] }>(`/chat/sessions/${taskId}/messages`)
	if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to get messages')
	return res.data?.messages || []
}

export async function createTask(data: CreateTaskData): Promise<KanbanTask> {
	const agent = getAgent()
	const api = getOpenAPI()
	const res = await agent.tasks.Create({
		title: data.title,
		assistant_id: data.assistant_id || '',
		board_id: activeBoardId || undefined,
		column_id: data.column_id,
		chat_id: data.chat_id
	})
	if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to create task')
	return mapTask(res.data)
}

export async function updateTask(taskId: string, data: Partial<KanbanTask>): Promise<KanbanTask> {
	const agent = getAgent()
	const api = getOpenAPI()
	const req: Record<string, any> = {}
	if (data.pinned !== undefined) req.pinned = data.pinned
	if (data.tags !== undefined) req.tags = data.tags
	if (data.title !== undefined) req.title = data.title
	if (data.assistant_id !== undefined) req.assistant_id = data.assistant_id
	const res = await agent.tasks.Update(taskId, req)
	if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to update task')
	return mapTask(res.data)
}

export async function moveTask(taskId: string, columnId: string, position: number): Promise<void> {
	const agent = getAgent()
	const api = getOpenAPI()
	const res = await agent.tasks.Move(taskId, { column_id: columnId, position })
	if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to move task')
}

export async function deleteTask(taskId: string): Promise<void> {
	const agent = getAgent()
	const api = getOpenAPI()
	const res = await agent.tasks.Delete(taskId)
	if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to delete task')
}

export async function sendMessage(_taskId: string, _content: string): Promise<Message> {
	// Primary message sending goes through Task WS (useTaskWS hook).
	// This REST fallback is kept for compatibility but should not be the main path.
	throw new Error('Use useTaskWS hook for task messaging via WebSocket')
}

export async function createColumn(boardId: string, data: Partial<Column>): Promise<Column> {
	const agent = getAgent()
	const api = getOpenAPI()
	const res = await agent.boards.CreateColumn(boardId, {
		name: data.title || 'New Column',
		icon: data.icon,
		color: data.color
	})
	if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to create column')
	return mapColumn({ ...res.data, board_id: boardId })
}

export async function updateColumn(columnId: string, data: Partial<Column>): Promise<Column> {
	const boardId = data.board_id || activeBoardId
	if (!boardId) throw new Error('Board ID required for column update')
	const agent = getAgent()
	const api = getOpenAPI()
	const req: Record<string, any> = {}
	if (data.title !== undefined) req.name = data.title
	if (data.icon !== undefined) req.icon = data.icon
	if (data.color !== undefined) req.color = data.color
	if (data.collapsed !== undefined) req.collapsed = data.collapsed
	const res = await agent.boards.UpdateColumn(boardId, columnId, req)
	if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to update column')
	return mapColumn({ ...res.data, board_id: boardId })
}

export async function deleteColumn(columnId: string): Promise<void> {
	const boardId = activeBoardId
	if (!boardId) throw new Error('Board ID required for column delete')
	const agent = getAgent()
	const api = getOpenAPI()
	const res = await agent.boards.DeleteColumn(boardId, columnId)
	if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to delete column')
}

export async function reorderColumns(boardId: string, columnIds: string[]): Promise<void> {
	const agent = getAgent()
	const api = getOpenAPI()
	const res = await agent.boards.ReorderColumns(boardId, columnIds)
	if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to reorder columns')
}
