import React, { useState, useEffect, useMemo } from 'react'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import type { Execution } from '../../types'
import styles from './index.less'

interface ExecutionCardProps {
	execution: Execution
	onPause?: (id: string) => void
	onStop?: (id: string) => void
	onDetail?: (id: string) => void
	onGuide?: (id: string) => void
	showFullStatus?: boolean // For history: show completed/failed/cancelled status
}

const ExecutionCard: React.FC<ExecutionCardProps> = ({ 
	execution, 
	onPause, 
	onStop, 
	onDetail,
	onGuide,
	showFullStatus = false 
}) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// Status flags
	const isCompleted = execution.status === 'completed'
	const isFailed = execution.status === 'failed'
	const isCancelled = execution.status === 'cancelled'
	const isPaused = execution.status === 'pending'
	const isRunning = execution.status === 'running'
	const isFinished = isCompleted || isFailed || isCancelled

	// Get display name (backend returns localized string)
	const name = execution.name || execution.id

	// Get description based on status
	const getDescription = () => {
		if (isCompleted && execution.delivery?.content?.summary) {
			return execution.delivery.content.summary
		}
		if (isFailed && execution.error) {
			return execution.error
		}
		if (isCancelled) {
			return is_cn ? '任务已取消' : 'Task cancelled'
		}
		// Running/Pending: show current task (backend returns localized string)
		return execution.current_task_name
			|| (is_cn ? '准备中...' : 'Preparing...')
	}

	const description = getDescription()

	// Calculate progress
	const progress = execution.current?.progress || '0/0'
	const [completed, total] = progress.split('/').map(Number)
	const progressPercent = isCompleted ? 100 : (total > 0 ? (completed / total) * 100 : 0)

	// Dynamic elapsed time - only for running tasks
	const [tick, setTick] = useState(0)

	useEffect(() => {
		// Only tick for running executions
		if (!isFinished) {
			const timer = setInterval(() => {
				setTick(t => t + 1)
			}, 1000)
			return () => clearInterval(timer)
		}
	}, [isFinished])

	// Calculate elapsed/duration time
	const timeDisplay = useMemo(() => {
		const startTime = new Date(execution.start_time)
		
		if (isFinished && execution.end_time) {
			// Finished: show duration
			const endTime = new Date(execution.end_time)
			const durationMs = endTime.getTime() - startTime.getTime()
			const durationSeconds = Math.floor(durationMs / 1000)
			
			if (durationSeconds < 60) {
				return `${durationSeconds}s`
			}
			const durationMinutes = Math.floor(durationSeconds / 60)
			if (durationMinutes < 60) {
				return `${durationMinutes}m ${durationSeconds % 60}s`
			}
			const hours = Math.floor(durationMinutes / 60)
			const mins = durationMinutes % 60
			return `${hours}h ${mins}m`
		} else {
			// Running: show elapsed (dynamic)
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
	}, [execution.start_time, execution.end_time, isFinished, tick])

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
			case 'completed': return styles.completed
			case 'cancelled': return styles.cancelled
			default: return ''
		}
	}

	// Get status icon for title
	const getStatusIcon = () => {
		if (isFailed) return 'material-error'
		if (isCompleted) return 'material-check_circle'
		if (isCancelled) return 'material-cancel'
		if (isPaused) return 'material-pause_circle'
		return 'material-play_circle'  // running
	}

	// Format date for finished executions
	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr)
		const month = date.getMonth() + 1
		const day = date.getDate()
		const hours = date.getHours().toString().padStart(2, '0')
		const minutes = date.getMinutes().toString().padStart(2, '0')
		return `${month}/${day} ${hours}:${minutes}`
	}

	const handleCardClick = () => onDetail?.(execution.id)

	const handleActionClick = (e: React.MouseEvent, action: () => void) => {
		e.stopPropagation()
		action()
	}

	// Show controls only for active executions
	const showControls = !isFinished && !showFullStatus

	return (
		<div className={`${styles.card} ${getStatusClass()}`} onClick={handleCardClick}>
			{/* Header: Status Icon + Title + Arrow */}
			<div className={styles.header}>
				<Icon name={getStatusIcon()} size={16} className={styles.statusIcon} />
				<span className={styles.title}>{name}</span>
				<Icon name='material-chevron_right' size={18} className={styles.arrow} />
			</div>

			{/* Task/Result description */}
			<div className={styles.task}>
				{description}
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
				{isFinished ? (
					<>
						<span className={styles.meta}>{formatDate(execution.start_time)}</span>
						<span className={styles.dot}>·</span>
					</>
				) : null}
				<span className={styles.meta}>{timeDisplay}</span>
				<span className={styles.dot}>·</span>
				<span className={styles.meta}>{progress}</span>
				
				<div className={styles.spacer} />

				{showControls && !isFailed && (
					<>
						<button
							className={styles.actionBtn}
							onClick={(e) => handleActionClick(e, () => onGuide?.(execution.id))}
							title={is_cn ? '指导执行' : 'Guide Execution'}
						>
							<Icon name='material-quickreply' size={14} />
						</button>
						<button
							className={styles.actionBtn}
							onClick={(e) => handleActionClick(e, () => onPause?.(execution.id))}
							title={is_cn ? (isPaused ? '继续' : '暂停') : (isPaused ? 'Resume' : 'Pause')}
						>
							<Icon name={isPaused ? 'material-play_circle' : 'material-pause_circle'} size={14} />
						</button>
						<button
							className={styles.actionBtn}
							onClick={(e) => handleActionClick(e, () => onStop?.(execution.id))}
							title={is_cn ? '停止' : 'Stop'}
						>
							<Icon name='material-stop_circle' size={14} />
						</button>
					</>
				)}
			</div>
		</div>
	)
}

export default ExecutionCard
