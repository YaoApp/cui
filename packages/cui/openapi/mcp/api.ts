import { OpenAPI } from '../openapi'
import type { MCPServer, MCPServerListResponse } from './types'

/**
 * MCP API - OAuth protected MCP server management
 * Provides access to MCP server functionality
 */
export class MCP {
	constructor(private api: OpenAPI) {}

	/**
	 * List all available MCP servers (loaded clients from user perspective)
	 * @returns MCP server list response
	 */
	async ListServers(): Promise<MCPServer[]> {
		const response = await this.api.Get<MCPServer[]>('/mcp/servers')
		const data = this.api.GetData(response) as MCPServer[]
		return data || []
	}

	/**
	 * Get MCP servers (alias for ListServers)
	 * @returns List of MCP servers
	 */
	async GetServers(): Promise<MCPServer[]> {
		return this.ListServers()
	}
}
