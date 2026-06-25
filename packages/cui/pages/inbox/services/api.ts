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
			id: m.board_id || '',
			name: m.board_name || '',
			task_title: m.chat_title || ''
		},
		priority: m.priority || 'medium',
		title: m.title || '',
		body: m.body || '',
		task_id: m.chat_id || '',
		chat_id: m.chat_id || '',
		assistant_id: m.assistant_id,
		read: !!m.read,
		starred: !!m.starred,
		pinned: !!m.pinned,
		created_at: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
		read_at: m.read_at ? new Date(m.read_at).getTime() : undefined
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

	async markAsRead(id: string) {
		const agent = getAgent()
		const api = getOpenAPI()
		const res = await agent.inbox.Read(id)
		if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to mark read')
	},

	async markAllRead() {
		const agent = getAgent()
		const api = getOpenAPI()
		const res = await agent.inbox.ReadAll()
		if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to mark all read')
	},

	async starMessage(id: string) {
		const agent = getAgent()
		const api = getOpenAPI()
		const res = await agent.inbox.Star(id)
		if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to star')
	},

	async unstarMessage(id: string) {
		const agent = getAgent()
		const api = getOpenAPI()
		const res = await agent.inbox.Unstar(id)
		if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to unstar')
	},

	async pinMessage(id: string) {
		const agent = getAgent()
		const api = getOpenAPI()
		const res = await agent.inbox.Pin(id)
		if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to pin')
	},

	async unpinMessage(id: string) {
		const agent = getAgent()
		const api = getOpenAPI()
		const res = await agent.inbox.Unpin(id)
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
