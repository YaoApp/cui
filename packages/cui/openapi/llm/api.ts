import { OpenAPI } from '../openapi'
import { BuildURL } from '../lib/utils'
import type { LLMProvider, LLMProviderListResponse, LLMProviderFilter } from './types'

/**
 * LLM API - OAuth protected LLM provider management
 * Provides access to LLM provider functionality
 */
export class LLM {
	constructor(private api: OpenAPI) {}

	/**
	 * List all available LLM providers (built-in + user-defined)
	 * Supports filtering by capabilities
	 * @param filter - Optional filter options (e.g., { capabilities: ['vision', 'tool_calls'] })
	 * @returns LLM provider list response
	 */
	async ListProviders(filter?: LLMProviderFilter): Promise<LLMProvider[]> {
		const params = new URLSearchParams()

		// Add capability filters if provided
		if (filter?.capabilities && filter.capabilities.length > 0) {
			params.append('filters', filter.capabilities.join(','))
		}

		const response = await this.api.Get<LLMProvider[]>(BuildURL('/llm/providers', params))
		const data = this.api.GetData(response) as LLMProvider[]
		return data || []
	}

	/**
	 * Get LLM providers (alias for ListProviders)
	 * @param filter - Optional filter options
	 * @returns List of LLM providers
	 */
	async GetProviders(filter?: LLMProviderFilter): Promise<LLMProvider[]> {
		return this.ListProviders(filter)
	}
}
