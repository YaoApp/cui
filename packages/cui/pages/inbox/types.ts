export type InboxMessageType = 'input' | 'completed' | 'failed' | 'update'

export type InboxCategory = 'all' | 'bookmarked' | 'task_interaction' | 'task_notification' | 'task_failed' | 'archived'

export interface InboxMessage {
	id: string
	type: InboxMessageType
	source: MessageSource
	priority: 'high' | 'medium' | 'low'
	title: string
	body: string
	task_id: string
	chat_id: string
	assistant_id?: string
	assistant_name?: string
	workspace_id?: string
	workspace_name?: string
	bookmarked: boolean
	inbox_pinned: boolean
	has_unread: boolean
	inbox_read_at?: number
	created_at: number
	run_status?: 'running' | 'queued' | 'completed' | 'failed'
}

export interface InboxStatsData {
	all: number
	bookmarked: number
	input: number
	completed: number
	failed: number
	archived: number
}

export interface MessageSource {
	type: 'kanban'
	id: string
	name: string
	task_title: string
	task_number?: number
}

export interface InboxAPI {
	getStats: () => Promise<InboxStatsData>
	getMessages: (query?: { filter?: string; page?: number; size?: number; chat_id?: string }) => Promise<{ items: InboxMessage[]; total: number }>
	viewTask: (chatId: string) => Promise<void>
	markAllRead: () => Promise<void>
	archiveTask: (chatId: string) => Promise<void>
	unarchiveTask: (chatId: string, columnId: string) => Promise<void>
	deleteGroup: (chatId: string) => Promise<void>
	bookmarkTask: (chatId: string) => Promise<void>
	unbookmarkTask: (chatId: string) => Promise<void>
	pinTask: (chatId: string) => Promise<void>
	unpinTask: (chatId: string) => Promise<void>
}
