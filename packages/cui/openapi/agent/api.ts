import { OpenAPI } from '../openapi'
import { AgentAssistants } from './assistants'
import { AgentTags } from './tags'
import { AgentCall } from './call'
import { AgentRobots } from './robot'

/**
 * Agent API - OAuth protected agent (assistant) management
 * Provides access to all agent-related functionality
 */
export class Agent {
	public readonly assistants: AgentAssistants
	public readonly tags: AgentTags
	public readonly call: AgentCall
	public readonly robots: AgentRobots

	constructor(private api: OpenAPI) {
		this.assistants = new AgentAssistants(api)
		this.tags = new AgentTags(api)
		this.call = new AgentCall(api)
		this.robots = new AgentRobots(api)
	}
}
