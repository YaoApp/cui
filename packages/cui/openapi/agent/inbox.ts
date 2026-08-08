import { OpenAPI } from '../openapi'
import { ApiResponse } from '../types'
import { BuildURL } from '../lib/utils'

export interface InboxListQuery {
	filter?: string
	keyword?: string
	chat_id?: string
	page?: number
	size?: number
	locale?: string
}

export interface InboxItem {
	mail_id: string
	type: string
	priority?: string
	title: string
	body?: string
	chat_id?: string
	chat_title?: string
	assistant_id?: string
	source_type?: string
	source_id?: string
	source_name?: string
	metadata?: any
	created_at?: string
	updated_at?: string
	// Task-level fields
	bookmarked: boolean
	inbox_pinned: boolean
	has_unread: boolean
	inbox_read_at?: string | null
}

export interface InboxStats {
	all: number
	bookmarked: number
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
			if (query.locale) params.append('locale', query.locale)
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

	async View(chatId: string): Promise<ApiResponse<void>> {
		return this.api.Put(`/agent/inbox/view/${chatId}`, {})
	}

	async ReadAll(): Promise<ApiResponse<void>> {
		return this.api.Put('/agent/inbox/read-all', {})
	}

	async Bookmark(chatId: string): Promise<ApiResponse<void>> {
		return this.api.Put(`/agent/inbox/bookmark/${chatId}`, {})
	}

	async Unbookmark(chatId: string): Promise<ApiResponse<void>> {
		return this.api.Put(`/agent/inbox/unbookmark/${chatId}`, {})
	}

	async Pin(chatId: string): Promise<ApiResponse<void>> {
		return this.api.Put(`/agent/inbox/pin/${chatId}`, {})
	}

	async Unpin(chatId: string): Promise<ApiResponse<void>> {
		return this.api.Put(`/agent/inbox/unpin/${chatId}`, {})
	}

	async DeleteByChat(chatId: string): Promise<ApiResponse<{ deleted: number }>> {
		return this.api.Delete(`/agent/inbox/chat/${chatId}`)
	}
}
