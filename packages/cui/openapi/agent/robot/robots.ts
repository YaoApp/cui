import { OpenAPI } from '../../openapi'
import { ApiResponse } from '../../types'
import { BuildURL } from '../../lib/utils'
import type { Message, StreamCallback } from '../../chat/types'
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
	ActivityListResponse,
	ActivityType,
	InteractRequest,
	InteractResponse,
	InteractStreamEvent,
	InteractStreamCallback
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
			if (filter.exclude_status) params.append('exclude_status', filter.exclude_status)
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
	 * @param params - Optional parameters (limit, since, type)
	 * @returns Activity list response
	 */
	async ListActivities(params?: { limit?: number; since?: string; type?: ActivityType }): Promise<ApiResponse<ActivityListResponse>> {
		const urlParams = new URLSearchParams()

		if (params) {
			if (params.limit) urlParams.append('limit', params.limit.toString())
			if (params.since) urlParams.append('since', params.since)
			if (params.type) urlParams.append('type', params.type)
		}

		return this.api.Get<ActivityListResponse>(BuildURL('/agent/robots/activities', urlParams))
	}

	// ==================== Execute API ====================

	/**
	 * Execute robot with confirmed goals (called after Host Agent confirms task)
	 * POST /v1/agent/robots/:id/execute
	 * @param robotId - Robot member_id
	 * @param req - Execute request with goals, optional context and chat_id
	 * @returns Execution result with execution_id and status
	 */
	async Execute(
		robotId: string,
		req: { goals: string; context?: Record<string, any>; chat_id?: string }
	): Promise<ApiResponse<{ execution_id: string; status: string; message: string }>> {
		return this.api.Post<{ execution_id: string; status: string; message: string }>(
			`/agent/robots/${encodeURIComponent(robotId)}/execute`,
			req
		)
	}

	/**
	 * Get host assistant ID for a robot
	 * GET /v1/agent/robots/:id/host
	 * @param robotId - Robot member_id
	 * @returns Host assistant ID
	 */
	async GetHostID(robotId: string): Promise<ApiResponse<{ assistant_id: string; robot_id: string }>> {
		return this.api.Get<{ assistant_id: string; robot_id: string }>(
			`/agent/robots/${encodeURIComponent(robotId)}/host`
		)
	}

	// ==================== Integration Verify API ====================

	/**
	 * Verify integration credentials for a platform
	 * POST /v1/agent/robots/integrations/verify
	 */
	async VerifyIntegration(
		provider: string,
		config: Record<string, any>
	): Promise<ApiResponse<{ valid: boolean; info?: Record<string, any>; error?: string }>> {
		return this.api.Post<{ valid: boolean; info?: Record<string, any>; error?: string }>(
			'/agent/robots/integrations/verify',
			{ provider, config }
		)
	}

	// ==================== WeChat QR Code APIs ====================

	/**
	 * Create a WeChat QR code session for scan-to-login
	 * POST /v1/agent/robots/integrations/weixin/qrcode
	 */
	async WeixinQRCodeCreate(apiHost?: string): Promise<ApiResponse<{
		session_key: string
		qrcode_url: string
		qrcode_img: string
	}>> {
		return this.api.Post<{ session_key: string; qrcode_url: string; qrcode_img: string }>(
			'/agent/robots/integrations/weixin/qrcode',
			apiHost ? { api_host: apiHost } : {}
		)
	}

	/**
	 * Poll WeChat QR code scan status
	 * GET /v1/agent/robots/integrations/weixin/qrcode/:session_key
	 */
	async WeixinQRCodePoll(sessionKey: string): Promise<ApiResponse<{
		status: string
		bot_token?: string
		account_id?: string
		base_url?: string
	}>> {
		return this.api.Get<{ status: string; bot_token?: string; account_id?: string; base_url?: string }>(
			`/agent/robots/integrations/weixin/qrcode/${encodeURIComponent(sessionKey)}`
		)
	}

	// ==================== V2 Interact APIs ====================

	/**
	 * Interact with a robot (synchronous mode)
	 * POST /v1/agent/robots/:id/interact
	 */
	async Interact(robotId: string, req: InteractRequest): Promise<ApiResponse<InteractResponse>> {
		return this.api.Post<InteractResponse>(
			`/agent/robots/${encodeURIComponent(robotId)}/interact`,
			{ ...req, stream: false }
		)
	}

	/**
	 * @deprecated Use InteractStreamCUI instead which uses standard CUI Message protocol.
	 * Interact with a robot (SSE streaming mode - legacy format)
	 */
	InteractStream(
		robotId: string,
		req: InteractRequest,
		onEvent: InteractStreamCallback,
		onError?: (error: Error) => void
	): () => void {
		return this.InteractStreamCUI(
			robotId,
			req,
			(msg) => {
				const legacy: InteractStreamEvent = { type: msg.type }
				if (msg.type === 'text' && msg.delta && msg.props) {
					legacy.type = 'delta'
					legacy.content = msg.props.content as string
					legacy.delta = true
				} else if (msg.type === 'event' && msg.props?.event === 'interact_done') {
					legacy.type = 'done'
					const data = msg.props.data as Record<string, any> | undefined
					if (data) {
						legacy.execution_id = data.execution_id
						legacy.status = data.status
						legacy.message = data.message
						legacy.chat_id = data.chat_id
						legacy.reply = data.reply
						legacy.wait_for_more = data.wait_for_more
					}
				} else if (msg.type === 'error') {
					legacy.type = 'error'
					legacy.error = msg.props?.message as string
				}
				onEvent(legacy)
			},
			onError
		)
	}

	/**
	 * Interact with a robot (SSE streaming mode - CUI standard Message protocol)
	 * POST /v1/agent/robots/:id/interact (stream=true)
	 *
	 * Streams standard CUI Message objects (text, thinking, tool_call, event, etc.)
	 * in real-time via SSE, then emits a final "interact_done" event message.
	 *
	 * @returns Abort function to cancel the stream
	 */
	InteractStreamCUI(
		robotId: string,
		req: InteractRequest,
		onChunk: StreamCallback,
		onError?: (error: Error) => void
	): () => void {
		// @ts-ignore - access private config for baseURL
		const baseURL = this.api.config.baseURL
		const url = `${baseURL}/agent/robots/${encodeURIComponent(robotId)}/interact`

		const abortController = new AbortController()

		const body = { ...req, stream: true }

		this.startCUIStream(url, body, onChunk, onError, abortController).catch((error) => {
			onError?.(error)
		})

		return () => {
			abortController.abort()
		}
	}

	/**
	 * Reply to a specific waiting task
	 * POST /v1/agent/robots/:id/executions/:exec_id/tasks/:task_id/reply
	 */
	async ReplyToTask(
		robotId: string,
		execId: string,
		taskId: string,
		message: string
	): Promise<ApiResponse<InteractResponse>> {
		return this.api.Post<InteractResponse>(
			`/agent/robots/${encodeURIComponent(robotId)}/executions/${encodeURIComponent(execId)}/tasks/${encodeURIComponent(taskId)}/reply`,
			{ message }
		)
	}

	/**
	 * Confirm a pending execution
	 * POST /v1/agent/robots/:id/executions/:exec_id/confirm
	 */
	async ConfirmExecution(
		robotId: string,
		execId: string,
		message?: string
	): Promise<ApiResponse<InteractResponse>> {
		return this.api.Post<InteractResponse>(
			`/agent/robots/${encodeURIComponent(robotId)}/executions/${encodeURIComponent(execId)}/confirm`,
			{ message: message || '' }
		)
	}

	/**
	 * Internal: Start CUI-protocol SSE stream for robot interaction.
	 * Parses `data: {json}` lines as standard CUI Message objects.
	 */
	private async startCUIStream(
		url: string,
		body: any,
		onChunk: StreamCallback,
		onError: ((error: Error) => void) | undefined,
		abortController: AbortController
	): Promise<void> {
		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'text/event-stream'
				},
				body: JSON.stringify(body),
				credentials: 'include',
				signal: abortController.signal
			})

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`)
			}

			if (!response.body) {
				throw new Error('Response body is null')
			}

			const reader = response.body.getReader()
			const decoder = new TextDecoder()
			let buffer = ''

			while (true) {
				const { done, value } = await reader.read()
				if (done) break

				buffer += decoder.decode(value, { stream: true })

				const lines = buffer.split('\n')
				buffer = lines.pop() || ''

				for (const line of lines) {
					if (line.trim() === '') continue

					let data: string
					if (line.startsWith('data: ')) {
						data = line.substring(6)
					} else {
						data = line
					}

					if (data.trim() === '[DONE]') return

					try {
						const chunk = JSON.parse(data) as Message
						onChunk(chunk)
					} catch {
						console.warn('[Robot API] Failed to parse SSE data:', data.substring(0, 100))
					}
				}
			}
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') return
			throw error
		}
	}
}
