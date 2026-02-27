import React, { useCallback, useRef } from 'react'
import { getLocale } from '@umijs/max'
import ChatDrawer from '../ChatDrawer'
import { AgentRobots } from '@/openapi/agent/robot/robots'
import type { StreamCallback } from '@/openapi/chat/types'
import type { InteractDoneData } from '@/openapi/agent/robot/types'
import type { RobotState } from '../../types'
import { robotNames } from '../../mock/data'

interface AssignTaskDrawerProps {
	visible: boolean
	onClose: () => void
	robot: RobotState
	onTaskAssigned?: () => void
}

const AssignTaskDrawer: React.FC<AssignTaskDrawerProps> = ({
	visible,
	onClose,
	robot,
	onTaskAssigned
}) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const abortRef = useRef<(() => void) | null>(null)

	const displayName = robotNames[robot.member_id]
		? is_cn
			? robotNames[robot.member_id].cn
			: robotNames[robot.member_id].en
		: robot.display_name

	const handleSend = useCallback(
		async (content: string, onChunk: StreamCallback): Promise<InteractDoneData | null> => {
			const openapi = window.$app?.openapi
			if (!openapi) return null

			const robotsApi = new AgentRobots(openapi)

			return new Promise<InteractDoneData | null>((resolve) => {
				const abort = robotsApi.InteractStreamCUI(
					robot.member_id,
					{ message: content, source: 'ui' },
					(chunk) => {
						if (chunk.type === 'event' && chunk.props?.event === 'interact_done') {
							resolve((chunk.props?.data as InteractDoneData) || null)
							return
						}
						onChunk(chunk)
					},
					(error: Error) => {
						console.error('[AssignTask] Stream error:', error)
						resolve(null)
					}
				)

				abortRef.current = abort
			})
		},
		[robot.member_id]
	)

	const handleComplete = useCallback(async () => {
		onTaskAssigned?.()
	}, [onTaskAssigned])

	const handleClose = useCallback(() => {
		abortRef.current?.()
		abortRef.current = null
		onClose()
	}, [onClose])

	return (
		<ChatDrawer
			visible={visible}
			onClose={handleClose}
			context={{
				type: 'assign',
				robotName: displayName,
				robotStatus: robot.status
			}}
			title={is_cn ? '指派任务' : 'Assign Task'}
			emptyState={{
				icon: 'material-chat',
				title: is_cn ? `向 ${displayName} 描述任务` : `Describe task to ${displayName}`,
				hint: is_cn
					? '清晰描述你希望完成的目标，智能体会确认理解后开始执行'
					: 'Clearly describe your goal. The agent will confirm understanding before starting.'
			}}
			placeholder={is_cn ? '描述任务内容... ⌘+Enter 发送' : 'Describe the task... ⌘+Enter to send'}
			successState={{
				title: is_cn ? '任务已启动' : 'Task Started',
				hint: is_cn ? '正在跳转到执行详情...' : 'Redirecting to execution details...'
			}}
			onSend={handleSend}
			onComplete={handleComplete}
		/>
	)
}

export default AssignTaskDrawer
