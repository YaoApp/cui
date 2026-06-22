import { OpenAPI } from '../openapi'
import { ApiResponse } from '../types'
import { BuildURL } from '../lib/utils'

export interface InboxListQuery {
	type?: string
	read?: boolean
	page?: number
	pagesize?: number
}

export interface InboxItem {
	mail_id: string
	type: string
	priority?: string
	title: string
	body?: string
	chat_id?: string
	read: boolean
	archived: boolean
	starred: boolean
	pinned: boolean
	created_at?: string
	read_at?: string | null
}

export interface InboxListResponse {
	messages: InboxItem[]
	total: number
	page: number
	pagesize: number
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
			if (query.type) params.append('type', query.type)
			if (query.read !== undefined) params.append('read', query.read.toString())
			if (query.page) params.append('page', query.page.toString())
			if (query.pagesize) params.append('pagesize', query.pagesize.toString())
		}
		const url = BuildURL('/agent/inbox', params)
		return this.api.Get(url)
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

	async Archive(mailId: string): Promise<ApiResponse<void>> {
		return this.api.Put(`/agent/inbox/${mailId}/archive`, {})
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
}
