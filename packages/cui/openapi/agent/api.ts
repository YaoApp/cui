import { OpenAPI } from '../openapi'
import { AgentAssistants } from './assistants'
import { AgentTags } from './tags'
import { AgentCall } from './call'
import { AgentRobots } from './robot'
import { AgentBoards } from './boards'
import { AgentTasks } from './tasks'
import { AgentInbox } from './inbox'

/**
 * Agent API - OAuth protected agent (assistant) management
 * Provides access to all agent-related functionality
 */
export class Agent {
	public readonly assistants: AgentAssistants
	public readonly tags: AgentTags
	public readonly call: AgentCall
	public readonly robots: AgentRobots
	public readonly boards: AgentBoards
	public readonly tasks: AgentTasks
	public readonly inbox: AgentInbox

	constructor(private api: OpenAPI) {
		this.assistants = new AgentAssistants(api)
		this.tags = new AgentTags(api)
		this.call = new AgentCall(api)
		this.robots = new AgentRobots(api)
		this.boards = new AgentBoards(api)
		this.tasks = new AgentTasks(api)
		this.inbox = new AgentInbox(api)
	}
}
