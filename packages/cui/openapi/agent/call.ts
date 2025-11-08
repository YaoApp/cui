import { OpenAPI } from '../openapi'
import type { AgentCallRequest, AgentCallResponse } from './types'

/**
 * Agent Call API
 * Handles agent API invocation
 */
export class AgentCall {
	constructor(private api: OpenAPI) {}

	/**
	 * Call an agent API
	 * @param id - Agent ID
	 * @param request - Call request with API name and payload
	 * @returns Agent call response
	 */
	async Execute(id: string, request: AgentCallRequest): Promise<AgentCallResponse> {
		const response = await this.api.Post<AgentCallResponse>(`/agent/assistants/${id}/call`, request)
		return this.api.GetData(response) as AgentCallResponse
	}
}

