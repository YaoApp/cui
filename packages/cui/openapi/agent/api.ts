import { OpenAPI } from '../openapi'
import type {
	AgentFilter,
	AgentListResponse,
	AgentDetailResponse,
	AgentSaveRequest,
	AgentSaveResponse,
	AgentDeleteResponse,
	AgentTagsResponse,
	AgentCallRequest,
	AgentCallResponse
} from './types'

/**
 * Agent API - OAuth protected agent (assistant) management
 * Provides access to all agent-related functionality
 */
export class Agent {
	constructor(private api: OpenAPI) {}

	/**
	 * List agents with optional filtering and pagination
	 * @param filter - Filter options
	 * @returns Agent list response
	 */
	async List(filter?: AgentFilter): Promise<AgentListResponse> {
		const params = new URLSearchParams()

		if (filter) {
			if (filter.tags && filter.tags.length > 0) {
				params.append('tags', filter.tags.join(','))
			}
			if (filter.type) params.append('type', filter.type)
			if (filter.keywords) params.append('keywords', filter.keywords)
			if (filter.connector) params.append('connector', filter.connector)
			if (filter.assistant_id) params.append('assistant_id', filter.assistant_id)
			if (filter.assistant_ids && filter.assistant_ids.length > 0) {
				params.append('assistant_ids', filter.assistant_ids.join(','))
			}
			if (filter.mentionable !== undefined) {
				params.append('mentionable', filter.mentionable.toString())
			}
			if (filter.automated !== undefined) {
				params.append('automated', filter.automated.toString())
			}
			if (filter.built_in !== undefined) {
				params.append('built_in', filter.built_in.toString())
			}
			if (filter.page) params.append('page', filter.page.toString())
			if (filter.pagesize) params.append('pagesize', filter.pagesize.toString())
			if (filter.select && filter.select.length > 0) {
				params.append('select', filter.select.join(','))
			}
			if (filter.locale) params.append('locale', filter.locale)
		}

		const query = params.toString()
		const url = `/agent/agents${query ? `?${query}` : ''}`

		const response = await this.api.Get<AgentListResponse>(url)
		return this.api.GetData(response) as AgentListResponse
	}

	/**
	 * Get agent details by ID
	 * @param id - Agent ID
	 * @param locale - Optional locale for translations
	 * @returns Agent detail response
	 */
	async Get(id: string, locale?: string): Promise<AgentDetailResponse> {
		const params = new URLSearchParams()
		if (locale) params.append('locale', locale)

		const query = params.toString()
		const url = `/agent/agents/${id}${query ? `?${query}` : ''}`

		const response = await this.api.Get<AgentDetailResponse>(url)
		return this.api.GetData(response) as AgentDetailResponse
	}

	/**
	 * Create or update an agent
	 * @param data - Agent data
	 * @returns Agent save response
	 */
	async Save(data: AgentSaveRequest): Promise<AgentSaveResponse> {
		const response = await this.api.Post<AgentSaveResponse>('/agent/agents', data)
		return this.api.GetData(response) as AgentSaveResponse
	}

	/**
	 * Delete an agent
	 * @param id - Agent ID
	 * @returns Agent delete response
	 */
	async Delete(id: string): Promise<AgentDeleteResponse> {
		const response = await this.api.Delete<AgentDeleteResponse>(`/agent/agents/${id}`)
		return this.api.GetData(response) as AgentDeleteResponse
	}

	/**
	 * Get all agent tags
	 * @param locale - Optional locale for translations
	 * @returns Agent tags response
	 */
	async GetTags(locale?: string): Promise<AgentTagsResponse> {
		const params = new URLSearchParams()
		if (locale) params.append('locale', locale)

		const query = params.toString()
		const url = `/agent/agents/tags${query ? `?${query}` : ''}`

		const response = await this.api.Get<AgentTagsResponse>(url)
		return this.api.GetData(response) as AgentTagsResponse
	}

	/**
	 * Call an agent API
	 * @param id - Agent ID
	 * @param request - Call request with API name and payload
	 * @returns Agent call response
	 */
	async Call(id: string, request: AgentCallRequest): Promise<AgentCallResponse> {
		const response = await this.api.Post<AgentCallResponse>(`/agent/agents/${id}/call`, request)
		return this.api.GetData(response) as AgentCallResponse
	}
}
