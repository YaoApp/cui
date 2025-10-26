import { OpenAPI } from '../openapi'
import type { LLMProvider, LLMProviderListResponse } from './types'

/**
 * LLM API - OAuth protected LLM provider management
 * Provides access to LLM provider functionality
 */
export class LLM {
	constructor(private api: OpenAPI) {}

	/**
	 * List all available LLM providers (built-in + user-defined)
	 * @returns LLM provider list response
	 */
	async ListProviders(): Promise<LLMProvider[]> {
		const response = await this.api.Get<LLMProvider[]>('/llm/providers')
		const data = this.api.GetData(response) as LLMProvider[]
		return data || []
	}

	/**
	 * Get LLM providers (alias for ListProviders)
	 * @returns List of LLM providers
	 */
	async GetProviders(): Promise<LLMProvider[]> {
		return this.ListProviders()
	}
}
