/**
 * Robot Execute Action
 *
 * Triggered by the Host Agent's NEXT HOOK when the user confirms task goals.
 * Calls the backend /v1/agent/robots/:id/execute API to start robot execution.
 */

import { AgentRobots } from '@/openapi/agent/robot/robots'

export interface RobotExecutePayload {
	robot_id: string
	goals: string
	context?: Record<string, any>
	chat_id?: string
}

export const robotExecute = (payload: RobotExecutePayload): void => {
	if (!payload?.robot_id || !payload?.goals) {
		console.warn('[Action:robot.execute] Missing robot_id or goals in payload')
		return
	}

	const openapi = window.$app?.openapi
	if (!openapi) {
		console.warn('[Action:robot.execute] OpenAPI not available')
		return
	}

	const robotsApi = new AgentRobots(openapi)
	robotsApi
		.Execute(payload.robot_id, {
			goals: payload.goals,
			context: payload.context,
			chat_id: payload.chat_id
		})
		.then((res) => {
			if (res?.data?.execution_id) {
				console.log('[Action:robot.execute] Execution started:', res.data.execution_id)

				// Notify CUI that a task was started (for UI refresh)
				window.$app?.Event?.emit('robot/executionStarted', {
					robot_id: payload.robot_id,
					execution_id: res.data.execution_id
				})
			}
		})
		.catch((err) => {
			console.error('[Action:robot.execute] Failed to execute:', err)
		})
}

export default robotExecute
