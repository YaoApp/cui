import { OpenAPI } from '../openapi'
import { ApiResponse } from '../types'
import { BuildURL } from '../lib/utils'

export interface InboxListQuery {
	filter?: string
	keyword?: string
	chat_id?: string
	page?: number
	size?: number
}

export interface InboxItem {
	mail_id: string
	type: string
	priority?: string
	title: string
	body?: string
	chat_id?: string
	chat_title?: string
	read: boolean
	starred: boolean
	pinned: boolean
	created_at?: string
	read_at?: string | null
}

export interface InboxStats {
	all: number
	starred: number
	input: number
	completed: number
	failed: number
	archived: number
}

export interface InboxListResponse {
	mails: InboxItem[]
	total: number
	page: number
	size: number
}

export interface UnreadCountResponse {
	total: number
	by_type?: Record<string, number>
}

export class AgentInbox {
	constructor(private api: OpenAPI) {}

	async List(query?: InboxListQuery): Promise<ApiResponse<InboxListResponse>> {
		const params = new URLSearchParams()
		if (query) {
			if (query.filter) params.append('filter', query.filter)
			if (query.keyword) params.append('keyword', query.keyword)
			if (query.chat_id) params.append('chat_id', query.chat_id)
			if (query.page) params.append('page', query.page.toString())
			if (query.size) params.append('size', query.size.toString())
		}
		const url = BuildURL('/agent/inbox', params)
		return this.api.Get(url)
	}

	async Stats(): Promise<ApiResponse<InboxStats>> {
		return this.api.Get('/agent/inbox/stats')
	}

	async UnreadCount(): Promise<ApiResponse<UnreadCountResponse>> {
		return this.api.Get('/agent/inbox/unread-count')
	}

	async Read(mailId: string): Promise<ApiResponse<void>> {
		return this.api.Put(`/agent/inbox/${mailId}/read`, {})
	}

	async ReadAll(): Promise<ApiResponse<void>> {
		return this.api.Put('/agent/inbox/read-all', {})
	}

	async Star(mailId: string): Promise<ApiResponse<void>> {
		return this.api.Put(`/agent/inbox/${mailId}/star`, {})
	}

	async Unstar(mailId: string): Promise<ApiResponse<void>> {
		return this.api.Put(`/agent/inbox/${mailId}/unstar`, {})
	}

	async Pin(mailId: string): Promise<ApiResponse<void>> {
		return this.api.Put(`/agent/inbox/${mailId}/pin`, {})
	}

	async Unpin(mailId: string): Promise<ApiResponse<void>> {
		return this.api.Put(`/agent/inbox/${mailId}/unpin`, {})
	}

	async DeleteByChat(chatId: string): Promise<ApiResponse<{ deleted: number }>> {
		return this.api.Delete(`/agent/inbox/chat/${chatId}`)
	}
}
