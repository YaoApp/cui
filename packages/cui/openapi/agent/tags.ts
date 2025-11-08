import { OpenAPI } from '../openapi'
import type { AgentTagsResponse } from './types'

/**
 * Agent Tags API
 * Handles agent tag management
 */
export class AgentTags {
	constructor(private api: OpenAPI) {}

	/**
	 * Get all agent tags
	 * @param locale - Optional locale for translations
	 * @returns Agent tags response
	 */
	async GetAll(locale?: string): Promise<AgentTagsResponse> {
		const params = new URLSearchParams()
		if (locale) params.append('locale', locale)

		const query = params.toString()
		const url = `/agent/assistants/tags${query ? `?${query}` : ''}`

		const response = await this.api.Get<AgentTagsResponse>(url)
		return this.api.GetData(response) as AgentTagsResponse
	}
}
