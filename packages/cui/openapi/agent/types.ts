/**
 * Agent (Assistant) API Types
 * Provides types for agent management functionality
 */

/**
 * Agent filter options for listing agents
 */
export interface AgentFilter {
	/** Filter by tags */
	tags?: string[]
	/** Filter by type */
	type?: string
	/** Search in name and description */
	keywords?: string
	/** Filter by connector */
	connector?: string
	/** Filter by agent ID */
	assistant_id?: string
	/** Filter by agent IDs */
	assistant_ids?: string[]
	/** Filter by mentionable status */
	mentionable?: boolean
	/** Filter by automation status */
	automated?: boolean
	/** Filter by built-in status */
	built_in?: boolean
	/** Page number, starting from 1 */
	page?: number
	/** Items per page */
	pagesize?: number
	/** Fields to return, returns all fields if empty */
	select?: string[]
	/** Locale for translations */
	locale?: string
}

/**
 * Agent data structure
 */
export interface Agent {
	/** Agent ID */
	assistant_id: string
	/** Agent name */
	name: string
	/** Agent type (e.g., "chat", "flow") */
	type: string
	/** Agent description */
	description?: string
	/** Agent tags */
	tags?: string[]
	/** Whether the agent can be mentioned */
	mentionable?: boolean
	/** Whether the agent is automated */
	automated?: boolean
	/** Whether the agent is built-in */
	built_in?: boolean
	/** Agent avatar URL */
	avatar?: string
	/** Agent connector */
	connector?: string
	/** Agent prompt */
	prompt?: string
	/** Agent options */
	options?: Record<string, any>
	/** Agent flows */
	flows?: any[]
	/** Agent APIs */
	apis?: any[]
	/** Creation timestamp */
	created_at?: number
	/** Last update timestamp */
	updated_at?: number
	/** Additional fields */
	[key: string]: any
}

/**
 * Agent list response
 */
export interface AgentListResponse {
	/** List of agents */
	data: Agent[]
	/** Current page number */
	page: number
	/** Items per page */
	pagesize: number
	/** Total number of pages */
	pagecnt: number
	/** Next page number */
	next: number
	/** Previous page number */
	prev: number
	/** Total number of agents */
	total: number
}

/**
 * Agent detail response
 */
export interface AgentDetailResponse {
	/** Agent data */
	data: Agent
}

/**
 * Agent save request
 */
export interface AgentSaveRequest {
	/** Agent ID (for update) */
	assistant_id?: string
	/** Agent name */
	name: string
	/** Agent type */
	type?: string
	/** Agent description */
	description?: string
	/** Agent tags */
	tags?: string[]
	/** Whether the agent can be mentioned */
	mentionable?: boolean
	/** Whether the agent is automated */
	automated?: boolean
	/** Agent avatar URL */
	avatar?: string
	/** Agent connector */
	connector?: string
	/** Agent prompt */
	prompt?: string
	/** Agent options */
	options?: Record<string, any>
	/** Agent flows */
	flows?: any[]
	/** Agent APIs */
	apis?: any[]
	/** Additional fields */
	[key: string]: any
}

/**
 * Agent save response
 */
export interface AgentSaveResponse {
	/** Status message */
	message: string
	/** Saved agent data */
	data: Agent
}

/**
 * Agent delete response
 */
export interface AgentDeleteResponse {
	/** Status message */
	message: string
	/** Success code */
	code: number
}

/**
 * Agent tag
 */
export interface AgentTag {
	/** Tag value */
	value: string
	/** Tag label */
	label: string
}

/**
 * Agent tags response
 */
export interface AgentTagsResponse {
	/** List of tags */
	data: AgentTag[]
}

/**
 * Agent call request
 */
export interface AgentCallRequest {
	/** API name to call */
	name: string
	/** API payload */
	payload?: Record<string, any>
}

/**
 * Agent call response
 */
export interface AgentCallResponse {
	/** Response data */
	[key: string]: any
}
