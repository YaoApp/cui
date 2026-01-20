import React, { useCallback } from 'react'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import type { RobotState, Execution } from '../../../types'
import { getActiveExecutions } from '../../../mock/data'
import ExecutionCard from '../../ExecutionCard'
import styles from '../index.less'

interface ActiveTabProps {
	robot: RobotState
	onAssignTask?: () => void
	onOpenDetail?: (execution: Execution) => void
}

const ActiveTab: React.FC<ActiveTabProps> = ({ robot, onAssignTask, onOpenDetail }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// Get active executions for this robot from mock data
	const activeExecutions = getActiveExecutions(robot.member_id)

	// Handlers
	const handlePause = useCallback((executionId: string) => {
		console.log('Pause execution:', executionId)
		// TODO: API call to pause execution
	}, [])

	const handleStop = useCallback((executionId: string) => {
		console.log('Stop execution:', executionId)
		// TODO: API call to stop execution
	}, [])

	const handleDetail = useCallback((executionId: string) => {
		const execution = activeExecutions.find((e: Execution) => e.id === executionId)
		if (execution && onOpenDetail) {
			onOpenDetail(execution)
		}
	}, [activeExecutions, onOpenDetail])

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
					/>
				))}
			</div>
		</div>
	)
}

export default ActiveTab
