/**
 * MCP Server API Types
 * Provides types for MCP server management functionality
 */

/**
 * MCP Server (from user perspective, internally an MCP client)
 */
export interface MCPServer {
	/** Server display name */
	label: string
	/** Server ID/value */
	value: string
	/** Server name */
	name: string
	/** Server description */
	description?: string
	/** Transport type (e.g., "stdio", "sse", "http") */
	transport?: string
	/** Whether the server is built-in */
	builtin: boolean
}

/**
 * MCP Server list response
 */
export interface MCPServerListResponse {
	/** List of MCP servers */
	data: MCPServer[]
}

