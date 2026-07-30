import type { InboxMessage, InboxAPI } from '../types'
import { Agent } from '@/openapi'

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

function mapInboxMessage(m: any): InboxMessage {
	return {
		id: m.mail_id,
		type: m.type || 'input',
		source: {
			type: 'kanban',
			id: m.source_id || '',
			name: m.source_name || '',
			task_title: m.chat_title || ''
		},
		priority: m.priority || 'medium',
		title: m.title || '',
		body: m.body || '',
		task_id: m.chat_id || '',
		chat_id: m.chat_id || '',
		assistant_id: m.assistant_id,
		bookmarked: !!m.bookmarked,
		inbox_pinned: !!m.inbox_pinned,
		has_unread: !!m.has_unread,
		inbox_read_at: m.inbox_read_at ? new Date(m.inbox_read_at).getTime() : undefined,
		created_at: m.created_at ? new Date(m.created_at).getTime() : Date.now()
	}
}

export const services: InboxAPI = {
	async getStats() {
		const agent = getAgent()
		const api = getOpenAPI()
		const res = await agent.inbox.Stats()
		if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to get stats')
		return res.data!
	},

	async getMessages(query?: { filter?: string; page?: number; size?: number; chat_id?: string }) {
		const agent = getAgent()
		const api = getOpenAPI()
		const res = await agent.inbox.List({ filter: query?.filter, page: query?.page || 1, size: query?.size || 20, chat_id: query?.chat_id })
		if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to list inbox')
		return {
			items: (res.data?.mails || []).map(mapInboxMessage),
			total: res.data?.total || 0
		}
	},

	async viewTask(chatId: string) {
		const agent = getAgent()
		const api = getOpenAPI()
		const res = await agent.inbox.View(chatId)
		if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to view task')
	},

	async markAllRead() {
		const agent = getAgent()
		const api = getOpenAPI()
		const res = await agent.inbox.ReadAll()
		if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to mark all read')
	},

	async bookmarkTask(chatId: string) {
		const agent = getAgent()
		const api = getOpenAPI()
		const res = await agent.inbox.Bookmark(chatId)
		if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to bookmark')
	},

	async unbookmarkTask(chatId: string) {
		const agent = getAgent()
		const api = getOpenAPI()
		const res = await agent.inbox.Unbookmark(chatId)
		if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to unbookmark')
	},

	async pinTask(chatId: string) {
		const agent = getAgent()
		const api = getOpenAPI()
		const res = await agent.inbox.Pin(chatId)
		if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to pin')
	},

	async unpinTask(chatId: string) {
		const agent = getAgent()
		const api = getOpenAPI()
		const res = await agent.inbox.Unpin(chatId)
		if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to unpin')
	},

	async archiveTask(chatId: string) {
		const agent = getAgent()
		const api = getOpenAPI()
		const res = await agent.tasks.Archive(chatId)
		if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to archive task')
	},

	async unarchiveTask(chatId: string, columnId: string) {
		const agent = getAgent()
		const api = getOpenAPI()
		const res = await agent.tasks.Unarchive(chatId, columnId)
		if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to unarchive task')
	},

	async deleteGroup(chatId: string) {
		const agent = getAgent()
		const api = getOpenAPI()
		const res = await agent.inbox.DeleteByChat(chatId)
		if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to delete')
	}
}
