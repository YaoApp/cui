import { OpenAPI } from '../openapi'
import { BuildURL } from '../lib/utils'
import type { LLMProvider, LLMProviderFilter, ModelGroupsResponse } from './types'

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
	 * @returns Flat list of LLM providers
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

	/**
	 * List model groups with effort levels for the model selector.
	 * Groups models by vendor and model family, mapping effort levels to connector IDs.
	 * @param filter - Optional capability filters (same as ListProviders)
	 * @returns Grouped models response with default connector
	 */
	async ListModelGroups(filter?: LLMProviderFilter): Promise<ModelGroupsResponse> {
		const params = new URLSearchParams()

		if (filter?.capabilities && filter.capabilities.length > 0) {
			params.append('filters', filter.capabilities.join(','))
		}

		const response = await this.api.Get<ModelGroupsResponse>(
			BuildURL('/llm/model-groups', params)
		)
		const data = this.api.GetData(response) as ModelGroupsResponse
		return data || { groups: [], default_connector: '' }
	}
}
