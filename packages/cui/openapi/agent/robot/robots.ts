import { OpenAPI } from '../../openapi'
import { ApiResponse } from '../../types'
import { BuildURL } from '../../lib/utils'
import type {
	RobotFilter,
	RobotListResponse,
	Robot,
	RobotStatusResponse,
	RobotCreateRequest,
	RobotUpdateRequest,
	RobotDeleteResponse
} from './types'

/**
 * Agent Robots API
 * Handles robot listing, retrieval, creation, updating, and deletion
 */
export class AgentRobots {
	constructor(private api: OpenAPI) {}

	/**
	 * List robots with optional filtering and pagination
	 * @param filter - Filter options
	 * @returns Robot list response
	 */
	async List(filter?: RobotFilter): Promise<ApiResponse<RobotListResponse>> {
		const params = new URLSearchParams()

		if (filter) {
			if (filter.status) params.append('status', filter.status)
			if (filter.keywords) params.append('keywords', filter.keywords)
			if (filter.team_id) params.append('team_id', filter.team_id)
			if (filter.autonomous_mode !== undefined) params.append('autonomous_mode', filter.autonomous_mode.toString())
			if (filter.page) params.append('page', filter.page.toString())
			if (filter.pagesize) params.append('pagesize', filter.pagesize.toString())
		}

		return this.api.Get<RobotListResponse>(BuildURL('/agent/robots', params))
	}

	/**
	 * Get robot details by ID
	 * @param id - Robot member_id
	 * @returns Robot data
	 */
	async Get(id: string): Promise<ApiResponse<Robot>> {
		return this.api.Get<Robot>(`/agent/robots/${encodeURIComponent(id)}`)
	}

	/**
	 * Get robot runtime status
	 * @param id - Robot member_id
	 * @returns Robot status response
	 */
	async GetStatus(id: string): Promise<ApiResponse<RobotStatusResponse>> {
		return this.api.Get<RobotStatusResponse>(`/agent/robots/${encodeURIComponent(id)}/status`)
	}

	/**
	 * Create a new robot
	 * @param data - Robot data (member_id, team_id, display_name are required)
	 * @returns Created robot
	 */
	async Create(data: RobotCreateRequest): Promise<ApiResponse<Robot>> {
		return this.api.Post<Robot>('/agent/robots', data)
	}

	/**
	 * Update an existing robot
	 * @param id - Robot member_id
	 * @param data - Robot data to update (all fields optional for partial update)
	 * @returns Updated robot
	 */
	async Update(id: string, data: RobotUpdateRequest): Promise<ApiResponse<Robot>> {
		return this.api.Put<Robot>(`/agent/robots/${encodeURIComponent(id)}`, data)
	}

	/**
	 * Delete a robot
	 * @param id - Robot member_id
	 * @returns Delete response
	 */
	async Delete(id: string): Promise<ApiResponse<RobotDeleteResponse>> {
		return this.api.Delete<RobotDeleteResponse>(`/agent/robots/${encodeURIComponent(id)}`)
	}
}
