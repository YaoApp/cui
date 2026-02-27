import React, { useCallback, useMemo, useRef } from 'react'
import { getLocale } from '@umijs/max'
import ChatDrawer from '../ChatDrawer'
import { AgentRobots } from '@/openapi/agent/robot/robots'
import type { StreamCallback } from '@/openapi/chat/types'
import type { InteractDoneData } from '@/openapi/agent/robot/types'
import type { RobotState, Execution } from '../../types'
import { robotNames } from '../../mock/data'

interface GuideExecutionDrawerProps {
	visible: boolean
	onClose: () => void
	robot: RobotState
	execution: Execution | null
	onGuidanceSent?: () => void
}

const GuideExecutionDrawer: React.FC<GuideExecutionDrawerProps> = ({
	visible,
	onClose,
	robot,
	execution,
	onGuidanceSent
}) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const abortRef = useRef<(() => void) | null>(null)

	const displayName = robotNames[robot.member_id]
		? is_cn
			? robotNames[robot.member_id].cn
			: robotNames[robot.member_id].en
		: robot.display_name

	const executionName = useMemo(() => {
		return execution?.name || ''
	}, [execution])

	const phaseLabel = useMemo(() => {
		if (!execution) return ''
		const phaseLabels: Record<string, { cn: string; en: string }> = {
			inspiration: { cn: '灵感', en: 'Inspiration' },
			goals: { cn: '目标', en: 'Goals' },
			tasks: { cn: '任务', en: 'Tasks' },
			run: { cn: '执行', en: 'Run' },
			delivery: { cn: '交付', en: 'Delivery' },
			learning: { cn: '学习', en: 'Learning' }
		}
		const phase = phaseLabels[execution.phase]
		return phase ? (is_cn ? phase.cn : phase.en) : execution.phase
	}, [execution, is_cn])

	const currentTaskName = useMemo(() => {
		return execution?.current_task_name || undefined
	}, [execution])

	const goalsContent = useMemo(() => {
		return execution?.goals?.content
	}, [execution])

	const taskList = useMemo(() => {
		if (!execution?.tasks) return undefined
		return execution.tasks.map((task) => ({
			id: task.id,
			name: task.executor_id,
			status: task.status as 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'cancelled'
		}))
	}, [execution])

	const chatId = useMemo(() => {
		if (!execution) return undefined
		return `robot_${robot.member_id}_${execution.id}`
	}, [robot.member_id, execution])

	const handleSend = useCallback(
		async (content: string, onChunk: StreamCallback): Promise<InteractDoneData | null> => {
			const openapi = window.$app?.openapi
			if (!openapi) return null

			const robotsApi = new AgentRobots(openapi)

			return new Promise<InteractDoneData | null>((resolve) => {
				const abort = robotsApi.InteractStreamCUI(
					robot.member_id,
					{
						message: content,
						source: 'ui',
						execution_id: execution?.id
					},
					(chunk) => {
						if (chunk.type === 'event' && chunk.props?.event === 'interact_done') {
							resolve((chunk.props?.data as InteractDoneData) || null)
							return
						}
						onChunk(chunk)
					},
					(error: Error) => {
						console.error('[GuideExecution] Stream error:', error)
						resolve(null)
					}
				)

				abortRef.current = abort
			})
		},
		[robot.member_id, execution]
	)

	const handleComplete = useCallback(async () => {
		onGuidanceSent?.()
	}, [onGuidanceSent])

	const handleClose = useCallback(() => {
		abortRef.current?.()
		abortRef.current = null
		onClose()
	}, [onClose])

	if (!execution) return null

	return (
		<ChatDrawer
			visible={visible}
			onClose={handleClose}
			context={{
				type: 'guide',
				robotName: displayName,
				robotStatus: robot.status,
				execution: {
					name: executionName,
					phase: phaseLabel,
					currentTask: currentTaskName,
					progress: execution.current?.progress,
					goals: goalsContent,
					tasks: taskList
				}
			}}
			title={is_cn ? '指导执行' : 'Guide Execution'}
			emptyState={{
				icon: 'material-support_agent',
				title: is_cn ? '与智能体沟通' : 'Talk to the agent',
				hint: is_cn
					? '告诉智能体你想要的调整，例如：暂停、修改目标、添加任务等'
					: 'Tell the agent what you want to adjust, e.g., pause, modify goals, add tasks, etc.'
			}}
			placeholder={is_cn ? '输入指导指令... ⌘+Enter 发送' : 'Enter guidance... ⌘+Enter to send'}
			successState={{
				title: is_cn ? '指令已发送' : 'Guidance Sent',
				hint: is_cn ? '智能体正在处理你的指令...' : 'Agent is processing your guidance...'
			}}
			onSend={handleSend}
			onComplete={handleComplete}
			showExecutionContext={true}
			chatId={chatId}
		/>
	)
}

export default GuideExecutionDrawer
