export type TaskStatus = 'creating' | 'pending' | 'running' | 'waiting_input' | 'completed' | 'failed' | 'paused' | 'cancelled'

export type RecurringMode = 'fixed_time' | 'interval'

export interface RecurringConfig {
	enabled: boolean
	mode: RecurringMode
	cron?: string
	interval_minutes?: number
	timezone?: string
	max_runs?: number
	end_at?: number
}

export interface TaskRunSummary {
	run_number: number
	status: 'completed' | 'failed'
	started_at: number
	completed_at: number
	duration: number
	summary?: string
}

export interface WorkspaceBinding {
	id: string
	name: string
	path?: string
	node_id?: string
	node_name?: string
	status?: 'online' | 'offline'
}

export interface ServiceBinding {
	name: string
	port: number
	protocol?: string
	url?: string
	status?: 'running' | 'stopped'
	pid?: number
}

export interface OutputFile {
	name: string
	path: string
	size: number
	type: string
	created_at: number
}

export interface KanbanTask {
	id: string
	title: string
	description: string
	status: TaskStatus
	column_id: string
	position: number
	chat_id?: string
	workspace?: WorkspaceBinding
	services?: ServiceBinding[]
	tags?: string[]
	progress?: number
	current_step?: string
	last_message?: string
	error_message?: string
	outputs?: OutputFile[]
	created_at: number
	updated_at: number
	started_at?: number
	completed_at?: number
	duration?: number
	recurring?: RecurringConfig
	run_count?: number
	last_run?: TaskRunSummary
	assistant_id?: string
	assistant_name?: string
	pinned?: boolean
}

export interface Column {
	id: string
	board_id: string
	title: string
	position: number
	icon?: string
	color?: string
	wip_limit?: number
	collapsed?: boolean
	auto_move?: boolean
}

export interface Board {
	id: string
	title: string
	icon?: string
	color?: string
	columns: Column[]
	created_at: number
	updated_at: number
}

export interface BoardSummary {
	id: string
	title: string
	icon?: string
	color?: string
	task_count: number
	created_at: number
}

export interface BoardTemplate {
	id: string
	title: string
	description: string
	icon: string
	color: string
	preview_columns: string[]
}

export type StatusFilter = 'all' | 'running' | 'waiting' | 'completed' | 'failed'

export interface KanbanAPI {
	getBoards: () => Promise<BoardSummary[]>
	getBoard: (boardId: string) => Promise<Board>
	createBoard: (data: { title: string; icon?: string; color?: string }) => Promise<Board>
	updateBoard: (boardId: string, data: Partial<Board>) => Promise<Board>
	deleteBoard: (boardId: string) => Promise<void>
	getBoardTemplates: () => Promise<BoardTemplate[]>
	createBoardFromTemplate: (templateId: string, title?: string) => Promise<Board>
	getTasks: (boardId: string) => Promise<KanbanTask[]>
	getTaskDetail: (taskId: string) => Promise<KanbanTask>
	getTaskMessages: (taskId: string) => Promise<any[]>
	createTask: (data: CreateTaskData) => Promise<KanbanTask>
	updateTask: (taskId: string, data: Partial<KanbanTask>) => Promise<KanbanTask>
	moveTask: (taskId: string, columnId: string, position: number) => Promise<void>
	deleteTask: (taskId: string) => Promise<void>
	sendMessage: (taskId: string, content: string) => Promise<any>
	createColumn: (boardId: string, data: Partial<Column>) => Promise<Column>
	updateColumn: (columnId: string, data: Partial<Column>) => Promise<Column>
	deleteColumn: (columnId: string) => Promise<void>
	reorderColumns: (boardId: string, columnIds: string[]) => Promise<void>
}

export interface CreateTaskData {
	title: string
	description: string
	column_id: string
	workspace_id?: string
	assistant_id?: string
	tags?: string[]
	recurring?: RecurringConfig
	execute_immediately?: boolean
}
