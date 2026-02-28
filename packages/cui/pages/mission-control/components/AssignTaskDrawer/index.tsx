import React, { useRef, useMemo, useState, useEffect } from 'react'
import { getLocale } from '@umijs/max'
import ChatDrawer from '../ChatDrawer'
import { AgentRobots } from '@/openapi/agent/robot/robots'
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
	const chatIdRef = useRef(`robot_${robot.member_id}_${Date.now()}`)
	const [hostAssistantId, setHostAssistantId] = useState<string | null>(null)

	const displayName = robotNames[robot.member_id]
		? is_cn
			? robotNames[robot.member_id].cn
			: robotNames[robot.member_id].en
		: robot.display_name

	// Resolve host assistant ID once when drawer first opens
	useEffect(() => {
		if (!visible || hostAssistantId) return
		const openapi = window.$app?.openapi
		if (!openapi) return

		const robotsApi = new AgentRobots(openapi)
		robotsApi.GetHostID(robot.member_id).then((res) => {
			if (res?.data?.assistant_id) {
				setHostAssistantId(res.data.assistant_id)
			}
		}).catch((err) => {
			console.error('[AssignTask] Failed to resolve host ID:', err)
		})
	}, [visible, robot.member_id, hostAssistantId])

	// Listen for robot/executionStarted event emitted by robot.execute action handler
	useEffect(() => {
		if (!visible) return

		const handleExecutionStarted = (data: { robot_id: string; execution_id: string }) => {
			if (data?.robot_id === robot.member_id) {
				onTaskAssigned?.()
			}
		}

		window.$app?.Event?.on('robot/executionStarted', handleExecutionStarted)
		return () => {
			window.$app?.Event?.off('robot/executionStarted', handleExecutionStarted)
		}
	}, [visible, robot.member_id, onTaskAssigned])

	const metadata = useMemo(() => ({ robot_id: robot.member_id }), [robot.member_id])

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
			assistantId={hostAssistantId || undefined}
			chatId={chatIdRef.current}
			metadata={metadata}
			onComplete={onTaskAssigned}
			robotId={robot.member_id}
		/>
	)
}

export default AssignTaskDrawer
