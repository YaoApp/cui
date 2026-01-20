import React, { useState, useEffect } from 'react'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import type { Execution } from '../../types'
import styles from './index.less'

interface ExecutionCardProps {
	execution: Execution
	onPause?: (id: string) => void
	onStop?: (id: string) => void
	onDetail?: (id: string) => void
}

const ExecutionCard: React.FC<ExecutionCardProps> = ({ execution, onPause, onStop, onDetail }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// Get display name
	const name = execution.name
		? is_cn ? execution.name.cn : execution.name.en
		: execution.id

	// Get current task description
	const currentTask = execution.current_task_name
		? is_cn ? execution.current_task_name.cn : execution.current_task_name.en
		: is_cn ? '准备中...' : 'Preparing...'

	// Calculate progress
	const progress = execution.current?.progress || '0/0'
	const [completed, total] = progress.split('/').map(Number)
	const progressPercent = total > 0 ? (completed / total) * 100 : 0

	// Dynamic elapsed time - updates every second
	const [tick, setTick] = useState(0)

	useEffect(() => {
		const timer = setInterval(() => {
			setTick(t => t + 1)
		}, 1000)
		return () => clearInterval(timer)
	}, [])

	// Calculate elapsed time on each render
	const calcElapsed = () => {
		const startTime = new Date(execution.start_time)
		const now = new Date()
		const elapsedMs = now.getTime() - startTime.getTime()
		const elapsedSeconds = Math.floor(elapsedMs / 1000)
		
		if (elapsedSeconds < 60) {
			return `${elapsedSeconds}s`
		}
		const elapsedMinutes = Math.floor(elapsedSeconds / 60)
		if (elapsedMinutes < 60) {
			return `${elapsedMinutes}m ${elapsedSeconds % 60}s`
		}
		const hours = Math.floor(elapsedMinutes / 60)
		const mins = elapsedMinutes % 60
		return `${hours}h ${mins}m`
	}

	const elapsed = calcElapsed()

	// Get trigger info
	const getTriggerInfo = () => {
		switch (execution.trigger_type) {
			case 'clock': 
				return { icon: 'material-schedule', label: is_cn ? '定时' : 'Clock' }
			case 'human': 
				return { icon: 'material-person', label: is_cn ? '手动' : 'Manual' }
			case 'event': 
				return { icon: 'material-bolt', label: is_cn ? '事件' : 'Event' }
			default: 
				return { icon: 'material-help_outline', label: is_cn ? '未知' : 'Unknown' }
		}
	}

	const triggerInfo = getTriggerInfo()

	// Get status class
	const getStatusClass = () => {
		switch (execution.status) {
			case 'pending': return styles.paused
			case 'failed': return styles.error
			case 'running': return styles.running
			default: return ''
		}
	}

	const isPaused = execution.status === 'pending'
	const isError = execution.status === 'failed'
	const isRunning = execution.status === 'running'

	// Get status icon for title
	const getStatusIcon = () => {
		if (isError) return 'material-error'
		if (isPaused) return 'material-pause_circle'
		return 'material-play_circle'  // running
	}

	const handleCardClick = () => onDetail?.(execution.id)

	const handleActionClick = (e: React.MouseEvent, action: () => void) => {
		e.stopPropagation()
		action()
	}

	return (
		<div className={`${styles.card} ${getStatusClass()}`} onClick={handleCardClick}>
			{/* Header: Status Icon + Title + Arrow */}
			<div className={styles.header}>
				<Icon name={getStatusIcon()} size={16} className={styles.statusIcon} />
				<span className={styles.title}>{name}</span>
				<Icon name='material-chevron_right' size={18} className={styles.arrow} />
			</div>

			{/* Task description */}
			<div className={styles.task}>
				{isError ? (execution.error || 'Error') : currentTask}
			</div>

			{/* Progress bar */}
			<div className={styles.progressBar}>
				<div className={styles.progressFill} style={{ width: `${Math.max(progressPercent, 5)}%` }} />
			</div>

			{/* Footer: Meta + Actions */}
			<div className={styles.footer}>
				<Icon name={triggerInfo.icon} size={12} className={styles.icon} />
				<span className={styles.meta}>{triggerInfo.label}</span>
				<span className={styles.dot}>·</span>
				<span className={styles.meta}>{elapsed}</span>
				<span className={styles.dot}>·</span>
				<span className={styles.meta}>{progress}</span>
				
				<div className={styles.spacer} />

				{!isError && (
					<>
						<button
							className={styles.actionBtn}
							onClick={(e) => handleActionClick(e, () => onPause?.(execution.id))}
						>
							<Icon name={isPaused ? 'material-play_arrow' : 'material-pause'} size={14} />
						</button>
						<button
							className={styles.actionBtn}
							onClick={(e) => handleActionClick(e, () => onStop?.(execution.id))}
						>
							<Icon name='material-stop' size={14} />
						</button>
					</>
				)}
			</div>
		</div>
	)
}

export default ExecutionCard
