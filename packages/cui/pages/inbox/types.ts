export type InboxMessageType = 'input' | 'completed' | 'failed'

export type InboxCategory = 'all' | 'starred' | 'task_interaction' | 'task_notification' | 'task_failed' | 'archived'

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
	read: boolean
	starred: boolean
	pinned: boolean
	created_at: number
	read_at?: number
}

export interface InboxStatsData {
	all: number
	starred: number
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
	markAsRead: (id: string) => Promise<void>
	markAllRead: () => Promise<void>
	archiveTask: (chatId: string) => Promise<void>
	unarchiveTask: (chatId: string, columnId: string) => Promise<void>
	deleteGroup: (chatId: string) => Promise<void>
	starMessage: (id: string) => Promise<void>
	unstarMessage: (id: string) => Promise<void>
	pinMessage: (id: string) => Promise<void>
	unpinMessage: (id: string) => Promise<void>
}
