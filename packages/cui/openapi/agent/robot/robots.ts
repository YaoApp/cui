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
	RobotDeleteResponse,
	ExecutionFilter,
	ExecutionListResponse,
	ExecutionResponse,
	ExecutionControlResponse,
	ResultFilter,
	ResultListResponse,
	ResultDetail,
	ActivityListResponse
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

	// ==================== Execution APIs ====================

	/**
	 * List executions for a robot with optional filtering and pagination
	 * @param robotId - Robot member_id
	 * @param filter - Filter options
	 * @returns Execution list response
	 */
	async ListExecutions(robotId: string, filter?: ExecutionFilter): Promise<ApiResponse<ExecutionListResponse>> {
		const params = new URLSearchParams()

		if (filter) {
			if (filter.status) params.append('status', filter.status)
			if (filter.trigger_type) params.append('trigger_type', filter.trigger_type)
			if (filter.keyword) params.append('keyword', filter.keyword)
			if (filter.page) params.append('page', filter.page.toString())
			if (filter.pagesize) params.append('pagesize', filter.pagesize.toString())
		}

		return this.api.Get<ExecutionListResponse>(BuildURL(`/agent/robots/${encodeURIComponent(robotId)}/executions`, params))
	}

	/**
	 * Get execution details
	 * @param robotId - Robot member_id
	 * @param execId - Execution ID
	 * @returns Execution detail response
	 */
	async GetExecution(robotId: string, execId: string): Promise<ApiResponse<ExecutionResponse>> {
		return this.api.Get<ExecutionResponse>(`/agent/robots/${encodeURIComponent(robotId)}/executions/${encodeURIComponent(execId)}`)
	}

	/**
	 * Pause a running execution
	 * @param robotId - Robot member_id
	 * @param execId - Execution ID
	 * @returns Control response
	 */
	async PauseExecution(robotId: string, execId: string): Promise<ApiResponse<ExecutionControlResponse>> {
		return this.api.Post<ExecutionControlResponse>(`/agent/robots/${encodeURIComponent(robotId)}/executions/${encodeURIComponent(execId)}/pause`, {})
	}

	/**
	 * Resume a paused execution
	 * @param robotId - Robot member_id
	 * @param execId - Execution ID
	 * @returns Control response
	 */
	async ResumeExecution(robotId: string, execId: string): Promise<ApiResponse<ExecutionControlResponse>> {
		return this.api.Post<ExecutionControlResponse>(`/agent/robots/${encodeURIComponent(robotId)}/executions/${encodeURIComponent(execId)}/resume`, {})
	}

	/**
	 * Cancel an execution
	 * @param robotId - Robot member_id
	 * @param execId - Execution ID
	 * @returns Control response
	 */
	async CancelExecution(robotId: string, execId: string): Promise<ApiResponse<ExecutionControlResponse>> {
		return this.api.Post<ExecutionControlResponse>(`/agent/robots/${encodeURIComponent(robotId)}/executions/${encodeURIComponent(execId)}/cancel`, {})
	}

	// ==================== Results APIs ====================

	/**
	 * List results (completed executions with delivery content) for a robot
	 * @param robotId - Robot member_id
	 * @param filter - Filter options
	 * @returns Result list response
	 */
	async ListResults(robotId: string, filter?: ResultFilter): Promise<ApiResponse<ResultListResponse>> {
		const params = new URLSearchParams()

		if (filter) {
			if (filter.trigger_type) params.append('trigger_type', filter.trigger_type)
			if (filter.keyword) params.append('keyword', filter.keyword)
			if (filter.page) params.append('page', filter.page.toString())
			if (filter.pagesize) params.append('pagesize', filter.pagesize.toString())
		}

		return this.api.Get<ResultListResponse>(BuildURL(`/agent/robots/${encodeURIComponent(robotId)}/results`, params))
	}

	/**
	 * Get result detail (execution with full delivery content)
	 * @param robotId - Robot member_id
	 * @param resultId - Result/Execution ID
	 * @returns Result detail response
	 */
	async GetResult(robotId: string, resultId: string): Promise<ApiResponse<ResultDetail>> {
		return this.api.Get<ResultDetail>(`/agent/robots/${encodeURIComponent(robotId)}/results/${encodeURIComponent(resultId)}`)
	}

	// ==================== Activities API ====================

	/**
	 * List activities for the user's team
	 * @param params - Optional parameters
	 * @returns Activity list response
	 */
	async ListActivities(params?: { limit?: number; since?: string }): Promise<ApiResponse<ActivityListResponse>> {
		const urlParams = new URLSearchParams()

		if (params) {
			if (params.limit) urlParams.append('limit', params.limit.toString())
			if (params.since) urlParams.append('since', params.since)
		}

		return this.api.Get<ActivityListResponse>(BuildURL('/agent/robots/activities', urlParams))
	}
}
