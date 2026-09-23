/**
 * LLM Provider API Types
 * Provides types for LLM provider management functionality
 */

// Import ModelCapability from agent/types (not re-exported to avoid duplication in index.ts)
import type { ModelCapability } from '../agent/types'

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
	/** Provider ID/value (full connector ID, e.g. "deepseek:deepseek-v4-flash-thinking-low") */
	value: string
	/** Provider type (e.g., "openai") */
	type: string
	/** Whether the provider is built-in */
	builtin: boolean
	/** Model capabilities from connector settings */
	capabilities?: ModelCapabilities
}

/**
 * A group of models aggregated by model_family within a provider/vendor.
 * Each ModelGroup maps reasoning effort levels to connector IDs.
 */
export interface ModelGroup {
	/** Display name (e.g. "DeepSeek V4 Flash") */
	model_name: string
	/** Family identifier for grouping (e.g. "deepseek-v4-flash") */
	model_family: string
	/** Maps effort level → connector ID (e.g. { "none": "deepseek.v4-flash", "high": "deepseek.v4-flash-thinking" }) */
	connectors: Record<string, string>
	/** Available effort levels, sorted by effortOrder (e.g. ["none", "high"]) */
	levels: string[]
}

/**
 * Provider group — groups ModelGroups by vendor/provider name.
 */
export interface ProviderGroup {
	/** Vendor display name (e.g. "DeepSeek", "Claude", "OpenAI") */
	name: string
	/** Models within this vendor group */
	models: ModelGroup[]
}

/**
 * Response from GET /llm/model-groups
 */
export interface ModelGroupsResponse {
	/** Grouped models by vendor */
	groups: ProviderGroup[]
	/** Default connector ID for the current user */
	default_connector: string
}


/**
 * LLM Provider filter options
 */
export interface LLMProviderFilter {
	/** Filter by capabilities (all must match - AND logic) */
	capabilities?: ModelCapability[]
}
