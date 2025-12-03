/**
 * LLM Provider API Types
 * Provides types for LLM provider management functionality
 */

/**
 * Model capability for filtering providers
 * Aligned with backend: yao/openapi/llm/llm.go and gou/connector/openai/openai.go
 */
export type ModelCapability =
	| 'vision'
	| 'audio'
	| 'tool_calls'
	| 'reasoning'
	| 'streaming'
	| 'json'
	| 'multimodal'
	| 'temperature_adjustable'

/**
 * Model capabilities structure
 * Defines the capabilities of a language model
 */
export interface ModelCapabilities {
	/** Supports vision/image input: bool or string ("openai", "claude", etc.) */
	vision?: boolean | string
	/** Supports audio input/output */
	audio?: boolean
	/** Supports tool/function calling */
	tool_calls?: boolean
	/** Supports reasoning/thinking mode (o1, DeepSeek R1) */
	reasoning?: boolean
	/** Supports streaming responses */
	streaming?: boolean
	/** Supports JSON mode */
	json?: boolean
	/** Supports multimodal input */
	multimodal?: boolean
	/** Supports temperature adjustment (reasoning models typically don't) */
	temperature_adjustable?: boolean
}

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
	/** Model capabilities from connector settings */
	capabilities?: ModelCapabilities
}

/**
 * LLM Provider list response
 */
export interface LLMProviderListResponse {
	/** List of LLM providers */
	data: LLMProvider[]
}

/**
 * LLM Provider filter options
 */
export interface LLMProviderFilter {
	/** Filter by capabilities (all must match - AND logic) */
	capabilities?: ModelCapability[]
}
