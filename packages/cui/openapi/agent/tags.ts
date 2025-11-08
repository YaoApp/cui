import { OpenAPI } from '../openapi'
import { ApiResponse } from '../types'
import { BuildURL } from '../lib/utils'
import type { AgentTagsResponse, AgentFilter } from './types'

/**
 * Agent Tags API
 * Handles agent tag management with permission-based filtering
 */
export class AgentTags {
	constructor(private api: OpenAPI) {}

	/**
	 * List agent tags with optional filtering
	 * Supports permission-based filtering - users only see tags from assistants they have access to
	 * Uses the same filter parameters as agent list for consistency
	 *
	 * @param filter - Optional filter parameters (same as AgentFilter, but pagination fields are ignored)
	 * @returns Agent tags response
	 *
	 * @example
	 * // List all tags
	 * const tags = await agentAPI.tags.List()
	 *
	 * @example
	 * // List tags with Chinese locale
	 * const tags = await agentAPI.tags.List({ locale: 'zh-cn' })
	 *
	 * @example
	 * // List tags for OpenAI assistants only
	 * const tags = await agentAPI.tags.List({ connector: 'openai' })
	 *
	 * @example
	 * // List tags for non-built-in, mentionable assistants
	 * const tags = await agentAPI.tags.List({
	 *   built_in: false,
	 *   mentionable: true
	 * })
	 */
	async List(
		filter?: Omit<AgentFilter, 'page' | 'pagesize' | 'select' | 'assistant_id' | 'assistant_ids' | 'tags'>
	): Promise<ApiResponse<AgentTagsResponse>> {
		const params = new URLSearchParams()

		if (filter) {
			if (filter.locale) params.append('locale', filter.locale)
			if (filter.type) params.append('type', filter.type)
			if (filter.connector) params.append('connector', filter.connector)
			if (filter.built_in !== undefined) params.append('built_in', String(filter.built_in))
			if (filter.mentionable !== undefined) params.append('mentionable', String(filter.mentionable))
			if (filter.automated !== undefined) params.append('automated', String(filter.automated))
			if (filter.keywords) params.append('keywords', filter.keywords)
		}

		return this.api.Get<AgentTagsResponse>(BuildURL('/agent/assistants/tags', params))
	}
}
