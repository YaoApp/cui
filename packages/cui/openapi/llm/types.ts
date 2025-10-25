/**
 * LLM Provider API Types
 * Provides types for LLM provider management functionality
 */

/**
 * LLM Provider
 */
export interface LLMProvider {
	/** Provider display name */
	label: string
	/** Provider ID/value */
	value: string
	/** Provider type (e.g., "openai") */
	type: string
	/** Whether the provider is built-in */
	builtin: boolean
}

/**
 * LLM Provider list response
 */
export interface LLMProviderListResponse {
	/** List of LLM providers */
	data: LLMProvider[]
}

