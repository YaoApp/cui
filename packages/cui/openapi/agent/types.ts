/**
 * Agent (Assistant) API Types
 * Provides types for agent management functionality
 * Aligned with backend: yao/agent/store/types/types.go
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
	/** Filter by multiple agent IDs */
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
 * Prompt structure for AI conversations
 */
export interface Prompt {
	/** Role (e.g., "system", "user", "assistant") */
	role: string
	/** Prompt content */
	content: string
	/** Optional prompt name */
	name?: string
}

/**
 * Knowledge Base configuration
 */
export interface KnowledgeBase {
	/** Knowledge base collection IDs */
	collections?: string[]
	/** Additional options for knowledge base */
	options?: Record<string, any>
}

/**
 * MCP Servers configuration
 */
export interface MCPServers {
	/** MCP server IDs */
	servers?: string[]
	/** Additional options for MCP servers */
	options?: Record<string, any>
}

/**
 * Workflow configuration
 */
export interface Workflow {
	/** Workflow IDs */
	workflows?: string[]
	/** Additional workflow options */
	options?: Record<string, any>
}

/**
 * Tool configuration
 */
export interface Tool {
	/** Tool type */
	type?: string
	/** Tool name */
	name: string
	/** Tool description */
	description?: string
	/** Tool parameters */
	parameters?: Record<string, any>
}

/**
 * Tool Calls configuration
 */
export interface ToolCalls {
	/** List of available tools */
	tools?: Tool[]
	/** Tool-related prompts */
	prompts?: Prompt[]
}

/**
 * Assistant placeholder for UI
 */
export interface Placeholder {
	/** Placeholder title */
	title?: string
	/** Placeholder description */
	description?: string
	/** Placeholder prompt suggestions */
	prompts?: string[]
}

/**
 * Agent (Assistant) data structure
 */
export interface Agent {
	/** Assistant ID */
	assistant_id: string
	/** Assistant type (default: "assistant") */
	type?: string
	/** Assistant name */
	name?: string
	/** Assistant avatar URL */
	avatar?: string
	/** AI Connector ID */
	connector: string
	/** Assistant path */
	path?: string
	/** Whether this is a built-in assistant */
	built_in?: boolean
	/** Sort order */
	sort?: number
	/** Assistant description */
	description?: string
	/** Assistant tags */
	tags?: string[]
	/** Whether this assistant is readonly */
	readonly?: boolean
	/** Whether this assistant is shared across all teams */
	public?: boolean
	/** Sharing scope (private/team) */
	share?: string
	/** Whether this assistant can be mentioned */
	mentionable?: boolean
	/** Whether this assistant is automated */
	automated?: boolean
	/** AI Options */
	options?: Record<string, any>
	/** AI Prompts */
	prompts?: Prompt[]
	/** Knowledge base configuration */
	kb?: KnowledgeBase
	/** MCP servers configuration */
	mcp?: MCPServers
	/** Assistant tools */
	tools?: ToolCalls
	/** Workflow configuration */
	workflow?: Workflow
	/** Assistant placeholder */
	placeholder?: Placeholder
	/** Localized content (locale -> content mapping) */
	locales?: Record<string, any>
	/** Creation timestamp (Unix timestamp) */
	created_at: number
	/** Last update timestamp (Unix timestamp) */
	updated_at: number
}

/**
 * Agent list response
 * Aligned with backend: yao/agent/store/types/AssistantList
 */
export interface AgentListResponse {
	/** List of agents */
	data: Agent[]
	/** Current page number (1-based) */
	page: number
	/** Items per page */
	pagesize: number
	/** Total number of pages */
	pagecount: number
	/** Next page number (0 if no next page) */
	next: number
	/** Previous page number (0 if no previous page) */
	prev: number
	/** Total number of agents across all pages */
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
	/** Assistant ID (for update) */
	assistant_id?: string
	/** Assistant type */
	type?: string
	/** Assistant name */
	name?: string
	/** Assistant avatar URL */
	avatar?: string
	/** AI Connector ID */
	connector?: string
	/** Assistant path */
	path?: string
	/** Sort order */
	sort?: number
	/** Assistant description */
	description?: string
	/** Assistant tags */
	tags?: string[]
	/** Whether this assistant is readonly */
	readonly?: boolean
	/** Whether this assistant is shared across all teams */
	public?: boolean
	/** Sharing scope (private/team) */
	share?: string
	/** Whether this assistant can be mentioned */
	mentionable?: boolean
	/** Whether this assistant is automated */
	automated?: boolean
	/** AI Options */
	options?: Record<string, any>
	/** AI Prompts */
	prompts?: Prompt[]
	/** Knowledge base configuration */
	kb?: KnowledgeBase
	/** MCP servers configuration */
	mcp?: MCPServers
	/** Assistant tools */
	tools?: ToolCalls
	/** Workflow configuration */
	workflow?: Workflow
	/** Assistant placeholder */
	placeholder?: Placeholder
	/** Localized content (locale -> content mapping) */
	locales?: Record<string, any>
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
 * Agent tag structure
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
