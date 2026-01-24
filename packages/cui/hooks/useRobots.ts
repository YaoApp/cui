import { useState, useCallback, useRef, useEffect } from 'react'
import { Agent } from '@/openapi/agent'
import type {
	Robot,
	RobotFilter,
	RobotListResponse,
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
	ActivityType
} from '@/openapi/agent/robot'

/**
 * Hook for robot API operations
 * Provides methods for listing, getting, creating, updating, and deleting robots
 */
export function useRobots() {
	const [loading, setLoading] = useState(false)
	const [robots, setRobots] = useState<Robot[]>([])
	const [total, setTotal] = useState(0)
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState(20)
	const [error, setError] = useState<string | null>(null)

	// Track if component is mounted
	const mountedRef = useRef(true)
	useEffect(() => {
		return () => {
			mountedRef.current = false
		}
	}, [])

	// Get agent API instance
	const getAgent = useCallback(() => {
		if (!window.$app?.openapi) {
			throw new Error('OpenAPI not available')
		}
		return new Agent(window.$app.openapi)
	}, [])

	/**
	 * List robots with optional filtering and pagination
	 */
	const listRobots = useCallback(
		async (filter?: RobotFilter): Promise<RobotListResponse | null> => {
			if (!window.$app?.openapi) {
				setError('OpenAPI not available')
				return null
			}

			setLoading(true)
			setError(null)

			try {
				const agent = getAgent()
				const response = await agent.robots.List(filter)

				if (window.$app.openapi.IsError(response)) {
					const errMsg = response.error?.error_description || 'Failed to load robots'
					if (mountedRef.current) {
						setError(errMsg)
					}
					return null
				}

				const data = window.$app.openapi.GetData(response) as RobotListResponse
				if (mountedRef.current) {
					setRobots(data.data || [])
					setTotal(data.total || 0)
					setPage(data.page || 1)
					setPageSize(data.pagesize || 20)
				}
				return data
			} catch (err) {
				const errMsg = err instanceof Error ? err.message : 'Failed to load robots'
				if (mountedRef.current) {
					setError(errMsg)
				}
				return null
			} finally {
				if (mountedRef.current) {
					setLoading(false)
				}
			}
		},
		[getAgent]
	)

	/**
	 * Get a single robot by ID
	 */
	const getRobot = useCallback(
		async (id: string): Promise<Robot | null> => {
			if (!window.$app?.openapi) {
				setError('OpenAPI not available')
				return null
			}

			setLoading(true)
			setError(null)

			try {
				const agent = getAgent()
				const response = await agent.robots.Get(id)

				if (window.$app.openapi.IsError(response)) {
					const errMsg = response.error?.error_description || 'Failed to get robot'
					if (mountedRef.current) {
						setError(errMsg)
					}
					return null
				}

				return window.$app.openapi.GetData(response) as Robot
			} catch (err) {
				const errMsg = err instanceof Error ? err.message : 'Failed to get robot'
				if (mountedRef.current) {
					setError(errMsg)
				}
				return null
			} finally {
				if (mountedRef.current) {
					setLoading(false)
				}
			}
		},
		[getAgent]
	)

	/**
	 * Get robot runtime status
	 */
	const getRobotStatus = useCallback(
		async (id: string): Promise<RobotStatusResponse | null> => {
			if (!window.$app?.openapi) {
				setError('OpenAPI not available')
				return null
			}

			try {
				const agent = getAgent()
				const response = await agent.robots.GetStatus(id)

				if (window.$app.openapi.IsError(response)) {
					const errMsg = response.error?.error_description || 'Failed to get robot status'
					if (mountedRef.current) {
						setError(errMsg)
					}
					return null
				}

				return window.$app.openapi.GetData(response) as RobotStatusResponse
			} catch (err) {
				const errMsg = err instanceof Error ? err.message : 'Failed to get robot status'
				if (mountedRef.current) {
					setError(errMsg)
				}
				return null
			}
		},
		[getAgent]
	)

	/**
	 * Create a new robot
	 */
	const createRobot = useCallback(
		async (data: RobotCreateRequest): Promise<Robot | null> => {
			if (!window.$app?.openapi) {
				setError('OpenAPI not available')
				return null
			}

			setLoading(true)
			setError(null)

			try {
				const agent = getAgent()
				const response = await agent.robots.Create(data)

				if (window.$app.openapi.IsError(response)) {
					const errMsg = response.error?.error_description || 'Failed to create robot'
					if (mountedRef.current) {
						setError(errMsg)
					}
					return null
				}

				return window.$app.openapi.GetData(response) as Robot
			} catch (err) {
				const errMsg = err instanceof Error ? err.message : 'Failed to create robot'
				if (mountedRef.current) {
					setError(errMsg)
				}
				return null
			} finally {
				if (mountedRef.current) {
					setLoading(false)
				}
			}
		},
		[getAgent]
	)

	/**
	 * Update an existing robot
	 */
	const updateRobot = useCallback(
		async (id: string, data: RobotUpdateRequest): Promise<Robot | null> => {
			if (!window.$app?.openapi) {
				setError('OpenAPI not available')
				return null
			}

			setLoading(true)
			setError(null)

			try {
				const agent = getAgent()
				const response = await agent.robots.Update(id, data)

				if (window.$app.openapi.IsError(response)) {
					const errMsg = response.error?.error_description || 'Failed to update robot'
					if (mountedRef.current) {
						setError(errMsg)
					}
					return null
				}

				return window.$app.openapi.GetData(response) as Robot
			} catch (err) {
				const errMsg = err instanceof Error ? err.message : 'Failed to update robot'
				if (mountedRef.current) {
					setError(errMsg)
				}
				return null
			} finally {
				if (mountedRef.current) {
					setLoading(false)
				}
			}
		},
		[getAgent]
	)

	/**
	 * Delete a robot
	 */
	const deleteRobot = useCallback(
		async (id: string): Promise<RobotDeleteResponse | null> => {
			if (!window.$app?.openapi) {
				setError('OpenAPI not available')
				return null
			}

			setLoading(true)
			setError(null)

			try {
				const agent = getAgent()
				const response = await agent.robots.Delete(id)

				if (window.$app.openapi.IsError(response)) {
					const errMsg = response.error?.error_description || 'Failed to delete robot'
					if (mountedRef.current) {
						setError(errMsg)
					}
					return null
				}

				return window.$app.openapi.GetData(response) as RobotDeleteResponse
			} catch (err) {
				const errMsg = err instanceof Error ? err.message : 'Failed to delete robot'
				if (mountedRef.current) {
					setError(errMsg)
				}
				return null
			} finally {
				if (mountedRef.current) {
					setLoading(false)
				}
			}
		},
		[getAgent]
	)

	/**
	 * Clear error state
	 */
	const clearError = useCallback(() => {
		setError(null)
	}, [])

	// ==================== Execution API Methods ====================

	/**
	 * List executions for a robot
	 */
	const listExecutions = useCallback(
		async (robotId: string, filter?: ExecutionFilter): Promise<ExecutionListResponse | null> => {
			if (!window.$app?.openapi) {
				setError('OpenAPI not available')
				return null
			}

			try {
				const agent = getAgent()
				const response = await agent.robots.ListExecutions(robotId, filter)

				if (window.$app.openapi.IsError(response)) {
					const errMsg = response.error?.error_description || 'Failed to list executions'
					if (mountedRef.current) {
						setError(errMsg)
					}
					return null
				}

				return window.$app.openapi.GetData(response) as ExecutionListResponse
			} catch (err) {
				const errMsg = err instanceof Error ? err.message : 'Failed to list executions'
				if (mountedRef.current) {
					setError(errMsg)
				}
				return null
			}
		},
		[getAgent]
	)

	/**
	 * Get a single execution
	 */
	const getExecution = useCallback(
		async (robotId: string, execId: string): Promise<ExecutionResponse | null> => {
			if (!window.$app?.openapi) {
				setError('OpenAPI not available')
				return null
			}

			try {
				const agent = getAgent()
				const response = await agent.robots.GetExecution(robotId, execId)

				if (window.$app.openapi.IsError(response)) {
					const errMsg = response.error?.error_description || 'Failed to get execution'
					if (mountedRef.current) {
						setError(errMsg)
					}
					return null
				}

				return window.$app.openapi.GetData(response) as ExecutionResponse
			} catch (err) {
				const errMsg = err instanceof Error ? err.message : 'Failed to get execution'
				if (mountedRef.current) {
					setError(errMsg)
				}
				return null
			}
		},
		[getAgent]
	)

	/**
	 * Pause an execution
	 */
	const pauseExecution = useCallback(
		async (robotId: string, execId: string): Promise<ExecutionControlResponse | null> => {
			if (!window.$app?.openapi) {
				setError('OpenAPI not available')
				return null
			}

			try {
				const agent = getAgent()
				const response = await agent.robots.PauseExecution(robotId, execId)

				if (window.$app.openapi.IsError(response)) {
					const errMsg = response.error?.error_description || 'Failed to pause execution'
					if (mountedRef.current) {
						setError(errMsg)
					}
					return null
				}

				return window.$app.openapi.GetData(response) as ExecutionControlResponse
			} catch (err) {
				const errMsg = err instanceof Error ? err.message : 'Failed to pause execution'
				if (mountedRef.current) {
					setError(errMsg)
				}
				return null
			}
		},
		[getAgent]
	)

	/**
	 * Resume an execution
	 */
	const resumeExecution = useCallback(
		async (robotId: string, execId: string): Promise<ExecutionControlResponse | null> => {
			if (!window.$app?.openapi) {
				setError('OpenAPI not available')
				return null
			}

			try {
				const agent = getAgent()
				const response = await agent.robots.ResumeExecution(robotId, execId)

				if (window.$app.openapi.IsError(response)) {
					const errMsg = response.error?.error_description || 'Failed to resume execution'
					if (mountedRef.current) {
						setError(errMsg)
					}
					return null
				}

				return window.$app.openapi.GetData(response) as ExecutionControlResponse
			} catch (err) {
				const errMsg = err instanceof Error ? err.message : 'Failed to resume execution'
				if (mountedRef.current) {
					setError(errMsg)
				}
				return null
			}
		},
		[getAgent]
	)

	/**
	 * Cancel an execution
	 */
	const cancelExecution = useCallback(
		async (robotId: string, execId: string): Promise<ExecutionControlResponse | null> => {
			if (!window.$app?.openapi) {
				setError('OpenAPI not available')
				return null
			}

			try {
				const agent = getAgent()
				const response = await agent.robots.CancelExecution(robotId, execId)

				if (window.$app.openapi.IsError(response)) {
					const errMsg = response.error?.error_description || 'Failed to cancel execution'
					if (mountedRef.current) {
						setError(errMsg)
					}
					return null
				}

				return window.$app.openapi.GetData(response) as ExecutionControlResponse
			} catch (err) {
				const errMsg = err instanceof Error ? err.message : 'Failed to cancel execution'
				if (mountedRef.current) {
					setError(errMsg)
				}
				return null
			}
		},
		[getAgent]
	)

	// ==================== Results API Methods ====================

	/**
	 * List results for a robot (completed executions with delivery content)
	 */
	const listResults = useCallback(
		async (robotId: string, filter?: ResultFilter): Promise<ResultListResponse | null> => {
			if (!window.$app?.openapi) {
				setError('OpenAPI not available')
				return null
			}

			try {
				const agent = getAgent()
				const response = await agent.robots.ListResults(robotId, filter)

				if (window.$app.openapi.IsError(response)) {
					const errMsg = response.error?.error_description || 'Failed to list results'
					if (mountedRef.current) {
						setError(errMsg)
					}
					return null
				}

				return window.$app.openapi.GetData(response) as ResultListResponse
			} catch (err) {
				const errMsg = err instanceof Error ? err.message : 'Failed to list results'
				if (mountedRef.current) {
					setError(errMsg)
				}
				return null
			}
		},
		[getAgent]
	)

	/**
	 * Get a single result detail
	 */
	const getResult = useCallback(
		async (robotId: string, resultId: string): Promise<ResultDetail | null> => {
			if (!window.$app?.openapi) {
				setError('OpenAPI not available')
				return null
			}

			try {
				const agent = getAgent()
				const response = await agent.robots.GetResult(robotId, resultId)

				if (window.$app.openapi.IsError(response)) {
					const errMsg = response.error?.error_description || 'Failed to get result'
					if (mountedRef.current) {
						setError(errMsg)
					}
					return null
				}

				return window.$app.openapi.GetData(response) as ResultDetail
			} catch (err) {
				const errMsg = err instanceof Error ? err.message : 'Failed to get result'
				if (mountedRef.current) {
					setError(errMsg)
				}
				return null
			}
		},
		[getAgent]
	)

	// ==================== Activities API Methods ====================

	/**
	 * List activities for the team
	 */
	const listActivities = useCallback(
		async (params?: { limit?: number; since?: string; type?: ActivityType }): Promise<ActivityListResponse | null> => {
			if (!window.$app?.openapi) {
				setError('OpenAPI not available')
				return null
			}

			try {
				const agent = getAgent()
				const response = await agent.robots.ListActivities(params)

				if (window.$app.openapi.IsError(response)) {
					const errMsg = response.error?.error_description || 'Failed to list activities'
					if (mountedRef.current) {
						setError(errMsg)
					}
					return null
				}

				return window.$app.openapi.GetData(response) as ActivityListResponse
			} catch (err) {
				const errMsg = err instanceof Error ? err.message : 'Failed to list activities'
				if (mountedRef.current) {
					setError(errMsg)
				}
				return null
			}
		},
		[getAgent]
	)

	return {
		// State
		loading,
		robots,
		total,
		page,
		pageSize,
		error,

		// Robot Methods
		listRobots,
		getRobot,
		getRobotStatus,
		createRobot,
		updateRobot,
		deleteRobot,
		clearError,

		// Execution Methods
		listExecutions,
		getExecution,
		pauseExecution,
		resumeExecution,
		cancelExecution,

		// Results Methods
		listResults,
		getResult,

		// Activities Methods
		listActivities
	}
}

export default useRobots
