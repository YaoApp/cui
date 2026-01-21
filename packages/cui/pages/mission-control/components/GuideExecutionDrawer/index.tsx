import React, { useCallback, useMemo } from 'react'
import { getLocale } from '@umijs/max'
import ChatDrawer from '../ChatDrawer'
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

	// Get i18n display name
	const displayName = robotNames[robot.member_id]
		? is_cn
			? robotNames[robot.member_id].cn
			: robotNames[robot.member_id].en
		: robot.display_name

	// Get execution name
	const executionName = useMemo(() => {
		if (!execution?.name) return ''
		return is_cn ? execution.name.cn : execution.name.en
	}, [execution, is_cn])

	// Get current phase label
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

	// Get current task name
	const currentTaskName = useMemo(() => {
		if (!execution?.current_task_name) return undefined
		return is_cn ? execution.current_task_name.cn : execution.current_task_name.en
	}, [execution, is_cn])

	// Get goals content
	const goalsContent = useMemo(() => {
		return execution?.goals?.content
	}, [execution])

	// Get task list for display
	const taskList = useMemo(() => {
		if (!execution?.tasks) return undefined
		return execution.tasks.map((task) => ({
			id: task.id,
			name: task.executor_id, // Use executor_id as task name for now
			status: task.status as 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'cancelled'
		}))
	}, [execution])

	// Handle message send
	const handleSend = useCallback(
		async (content: string): Promise<string | null> => {
			// TODO: API call - POST /api/robots/:id/intervene
			// {
			//   action: "instruct",
			//   messages: [{ role: "user", content }],
			//   execution_id: execution.id
			// }
			// Simulate API response
			await new Promise((resolve) => setTimeout(resolve, 800))

			// Return assistant response based on content analysis
			// In real implementation, this would be the LLM response understanding the instruction
			const lowerContent = content.toLowerCase()

			if (lowerContent.includes('暂停') || lowerContent.includes('pause') || lowerContent.includes('stop') || lowerContent.includes('等')) {
				return is_cn
					? '收到，我会暂停当前任务。需要我做什么调整吗？'
					: 'Got it, I\'ll pause the current task. What adjustments would you like me to make?'
			}

			if (lowerContent.includes('取消') || lowerContent.includes('cancel') || lowerContent.includes('不要')) {
				return is_cn
					? '明白，我会取消当前操作。你想要重新开始还是换一个方向？'
					: 'Understood, I\'ll cancel the current operation. Would you like to restart or take a different approach?'
			}

			if (lowerContent.includes('改') || lowerContent.includes('调整') || lowerContent.includes('change') || lowerContent.includes('modify')) {
				return is_cn
					? `收到你的调整指令。我会根据你的要求修改执行计划。\n\n请确认这是你想要的调整吗？`
					: `Got your adjustment instructions. I'll modify the execution plan accordingly.\n\nPlease confirm if this is what you want?`
			}

			// Default response
			return is_cn
				? `收到指令：\n\n"${content}"\n\n我会按照你的要求调整执行。还有其他需要补充的吗？`
				: `Instruction received:\n\n"${content}"\n\nI'll adjust the execution as requested. Anything else to add?`
		},
		[is_cn]
	)

	// Handle guidance complete
	const handleComplete = useCallback(async () => {
		// TODO: API call - Confirm intervention
		await new Promise((resolve) => setTimeout(resolve, 500))
		onGuidanceSent?.()
	}, [onGuidanceSent])

	if (!execution) return null

	return (
		<ChatDrawer
			visible={visible}
			onClose={onClose}
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
		/>
	)
}

export default GuideExecutionDrawer
