export type InboxMessageType = 'task_input' | 'task_completed' | 'task_failed'

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
	archived: boolean
	starred: boolean
	pinned: boolean
	created_at: number
	read_at?: number
}

export interface MessageSource {
	type: 'kanban'
	id: string
	name: string
	task_title: string
	task_number?: number
}

export interface InboxAPI {
	getMessages: () => Promise<InboxMessage[]>
	markAsRead: (id: string) => Promise<void>
	markAllRead: () => Promise<void>
	archiveMessage: (id: string) => Promise<void>
	starMessage: (id: string) => Promise<void>
	unstarMessage: (id: string) => Promise<void>
	pinMessage: (id: string) => Promise<void>
	unpinMessage: (id: string) => Promise<void>
}
