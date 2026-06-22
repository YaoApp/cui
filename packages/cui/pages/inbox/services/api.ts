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
		type: m.type || 'task_input',
		source: {
			type: 'kanban',
			id: m.board_id || '',
			name: m.board_name || '',
			task_title: m.title || ''
		},
		priority: m.priority || 'medium',
		title: m.title || '',
		body: m.body || '',
		task_id: m.chat_id || '',
		chat_id: m.chat_id || '',
		assistant_id: m.assistant_id,
		read: !!m.read,
		archived: !!m.archived,
		starred: !!m.starred,
		pinned: !!m.pinned,
		created_at: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
		read_at: m.read_at ? new Date(m.read_at).getTime() : undefined
	}
}

export const services: InboxAPI = {
	async getMessages() {
		const agent = getAgent()
		const api = getOpenAPI()
		const res = await agent.inbox.List()
		if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to list inbox')
		return (res.data?.messages || []).map(mapInboxMessage)
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

	async archiveMessage(id: string) {
		const agent = getAgent()
		const api = getOpenAPI()
		const res = await agent.inbox.Archive(id)
		if (api.IsError(res)) throw new Error(res.error?.error_description || 'Failed to archive')
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
	}
}
