import React, { useCallback, useState, useEffect, useRef } from 'react'
import { getLocale } from '@umijs/max'
import { message } from 'antd'
import Icon from '@/widgets/Icon'
import { useRobots } from '@/hooks/useRobots'
import type { RobotState, Execution } from '../../../types'
import type { ExecutionResponse } from '@/openapi/agent/robot'
import ExecutionCard from '../../ExecutionCard'
import CreatureLoading from '../../CreatureLoading'
import styles from '../index.less'

interface ActiveTabProps {
	robot: RobotState
	onAssignTask?: () => void
	onOpenDetail?: (execution: Execution) => void
	onOpenGuide?: (execution: Execution) => void
}

// Convert API ExecutionResponse to local Execution type
const toExecution = (exec: ExecutionResponse): Execution => ({
	id: exec.id,
	member_id: exec.member_id,
	team_id: exec.team_id,
	trigger_type: exec.trigger_type,
	start_time: exec.start_time,
	end_time: exec.end_time,
	status: exec.status,
	phase: exec.phase,
	error: exec.error,
	name: exec.name,
	current_task_name: exec.current_task_name,
	inspiration: exec.inspiration,
	goals: exec.goals,
	tasks: exec.tasks,
	current: exec.current,
	results: exec.results,
	delivery: exec.delivery,
	input: exec.input
})

const ActiveTab: React.FC<ActiveTabProps> = ({ robot, onAssignTask, onOpenDetail, onOpenGuide }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// API hook
	const { listExecutions, pauseExecution, cancelExecution, error: apiError } = useRobots()

	// State
	const [activeExecutions, setActiveExecutions] = useState<Execution[]>([])
	const [loading, setLoading] = useState(true)

	// Polling interval ref
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

	// Load active executions (status = running | pending | paused)
	const loadExecutions = useCallback(async () => {
		const result = await listExecutions(robot.member_id, {
			status: 'running' as any, // API will also include pending and paused
			pagesize: 50 // Get enough for active list
		})

		if (result) {
			// Filter to only running, pending and paused (in case API returns more)
			const filtered = result.data
				.filter((e) => e.status === 'running' || e.status === 'pending' || e.status === 'paused')
				.map(toExecution)
			setActiveExecutions(filtered)
		}
		setLoading(false)
	}, [robot.member_id, listExecutions])

	// Initial load and polling
	useEffect(() => {
		loadExecutions()

		// Set up 60-second polling
		intervalRef.current = setInterval(loadExecutions, 60000)

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
			}
		}
	}, [loadExecutions])

	// Show API error
	useEffect(() => {
		if (apiError) {
			message.error(apiError)
		}
	}, [apiError])

	// Handlers
	const handlePause = useCallback(
		async (executionId: string) => {
			const result = await pauseExecution(robot.member_id, executionId)
			if (result?.success) {
				message.success(is_cn ? '已暂停' : 'Paused')
				loadExecutions() // Refresh list
			}
		},
		[robot.member_id, pauseExecution, loadExecutions, is_cn]
	)

	const handleStop = useCallback(
		async (executionId: string) => {
			const result = await cancelExecution(robot.member_id, executionId)
			if (result?.success) {
				message.success(is_cn ? '已停止' : 'Stopped')
				loadExecutions() // Refresh list
			}
		},
		[robot.member_id, cancelExecution, loadExecutions, is_cn]
	)

	const handleDetail = useCallback(
		(executionId: string) => {
			const execution = activeExecutions.find((e: Execution) => e.id === executionId)
			if (execution && onOpenDetail) {
				onOpenDetail(execution)
			}
		},
		[activeExecutions, onOpenDetail]
	)

	const handleGuide = useCallback(
		(executionId: string) => {
			const execution = activeExecutions.find((e: Execution) => e.id === executionId)
			if (execution && onOpenGuide) {
				onOpenGuide(execution)
			}
		},
		[activeExecutions, onOpenGuide]
	)

	// Loading state
	if (loading) {
		return <CreatureLoading size='medium' />
	}

	// Empty state
	if (activeExecutions.length === 0) {
		return (
			<div className={styles.emptyState}>
				<div className={styles.emptyCircle}>
					<Icon name='material-inbox' size={32} className={styles.emptyIcon} />
				</div>
				<span className={styles.emptyText}>
					{is_cn ? '当前没有进行中的任务' : 'No active executions'}
				</span>
				<span className={styles.emptyHint}>
					{is_cn
						? '智能体空闲中，等待下次触发或手动指派任务'
						: 'Agent is idle. Waiting for next trigger or task.'}
				</span>
				{onAssignTask && (
					<button className={styles.emptyAction} onClick={onAssignTask}>
						<Icon name='material-rocket_launch' size={16} />
						<span>{is_cn ? '指派任务' : 'Assign Task'}</span>
					</button>
				)}
			</div>
		)
	}

	return (
		<div className={styles.tabContent}>
			<div className={styles.executionList}>
				{activeExecutions.map((execution: Execution) => (
					<ExecutionCard
						key={execution.id}
						execution={execution}
						onPause={handlePause}
						onStop={handleStop}
						onDetail={handleDetail}
						onGuide={handleGuide}
					/>
				))}
			</div>
		</div>
	)
}

export default ActiveTab
