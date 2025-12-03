import { OpenAPI } from '../openapi'
import { ApiResponse } from '../types'
import { BuildURL } from '../lib/utils'
import type {
	AgentFilter,
	AgentListResponse,
	AgentDetailResponse,
	AgentInfoResponse,
	AssistantCreateRequest,
	AssistantUpdateRequest,
	AgentCreateResponse,
	AgentUpdateResponse,
	AgentDeleteResponse
} from './types'

/**
 * Agent Assistants API
 * Handles assistant listing, retrieval, creation, updating, and deletion
 */
export class AgentAssistants {
	constructor(private api: OpenAPI) {}

	/**
	 * List agents with optional filtering and pagination
	 * @param filter - Filter options
	 * @returns Agent list response
	 */
	async List(filter?: AgentFilter): Promise<ApiResponse<AgentListResponse>> {
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

		return this.api.Get<AgentListResponse>(BuildURL('/agent/assistants', params))
	}

	/**
	 * Get agent details by ID
	 * @param id - Agent ID
	 * @param locale - Optional locale for translations
	 * @returns Agent detail response
	 */
	async Get(id: string, locale?: string): Promise<ApiResponse<AgentDetailResponse>> {
		const params = new URLSearchParams()
		if (locale) params.append('locale', locale)

		return this.api.Get<AgentDetailResponse>(BuildURL(`/agent/assistants/${id}`, params))
	}

	/**
	 * Get essential agent information for InputArea component
	 * Returns only the minimal fields needed: id, name, description, connector, connector_options, modes, default_mode
	 * @param id - Agent ID
	 * @param locale - Optional locale for translations (default: "en-us")
	 * @returns Agent info response with essential fields
	 */
	async GetInfo(id: string, locale?: string): Promise<ApiResponse<AgentInfoResponse>> {
		const params = new URLSearchParams()
		if (locale) params.append('locale', locale)

		return this.api.Get<AgentInfoResponse>(BuildURL(`/agent/assistants/${id}/info`, params))
	}

	/**
	 * Create a new assistant
	 * @param data - Assistant data (name, type, connector are required)
	 * @returns Assistant creation response with assistant_id
	 */
	async Create(data: AssistantCreateRequest): Promise<ApiResponse<AgentCreateResponse>> {
		return this.api.Post<AgentCreateResponse>('/agent/assistants', data)
	}

	/**
	 * Update an existing assistant
	 * @param id - Assistant ID
	 * @param data - Assistant data to update (all fields optional for partial update)
	 * @returns Assistant update response with assistant_id
	 */
	async Update(id: string, data: AssistantUpdateRequest): Promise<ApiResponse<AgentUpdateResponse>> {
		return this.api.Put<AgentUpdateResponse>(`/agent/assistants/${id}`, data)
	}

	/**
	 * Delete an agent
	 * @param id - Agent ID
	 * @returns Agent delete response
	 */
	async Delete(id: string): Promise<ApiResponse<AgentDeleteResponse>> {
		return this.api.Delete<AgentDeleteResponse>(`/agent/assistants/${id}`)
	}
}
