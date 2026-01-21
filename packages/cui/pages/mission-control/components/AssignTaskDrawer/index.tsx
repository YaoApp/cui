import React, { useCallback } from 'react'
import { getLocale } from '@umijs/max'
import ChatDrawer from '../ChatDrawer'
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

	// Get i18n display name
	const displayName = robotNames[robot.member_id]
		? is_cn
			? robotNames[robot.member_id].cn
			: robotNames[robot.member_id].en
		: robot.display_name

	// Handle message send
	const handleSend = useCallback(
		async (content: string): Promise<string | null> => {
			// TODO: API call - POST /api/robots/:id/trigger or /api/robots/:id/chat
			// Simulate API response
			await new Promise((resolve) => setTimeout(resolve, 800))

			// Return assistant response
			return is_cn
				? `好的，我已收到任务。我会开始处理：\n\n"${content}"\n\n需要更多信息吗？或者我可以直接开始执行。`
				: `Got it. I'll start working on:\n\n"${content}"\n\nDo you need more details, or should I proceed?`
		},
		[is_cn]
	)

	// Handle task complete
	const handleComplete = useCallback(async () => {
		// TODO: API call - Confirm and start execution
		await new Promise((resolve) => setTimeout(resolve, 800))
		onTaskAssigned?.()
	}, [onTaskAssigned])

	return (
		<ChatDrawer
			visible={visible}
			onClose={onClose}
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
