import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { Tooltip, message } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { useRobots } from '@/hooks/useRobots'
import type { Execution, Task } from '../../types'
import type { ExecutionResponse } from '@/openapi/agent/robot'
import CreatureLoading from '../CreatureLoading'
import styles from './index.less'

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

interface ExecutionDetailDrawerProps {
	visible: boolean
	onClose: () => void
	execution: Execution | null // Initial execution data (for ID and member_id)
	onGuide?: () => void
}

const ExecutionDetailDrawer: React.FC<ExecutionDetailDrawerProps> = ({
	visible,
	onClose,
	execution: initialExecution,
	onGuide
}) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [tick, setTick] = useState(0)

	// API hook
	const { getExecution, pauseExecution, resumeExecution, cancelExecution, error: apiError } = useRobots()

	// State for execution detail (can be refreshed from API)
	const [execution, setExecution] = useState<Execution | null>(initialExecution)
	const [loading, setLoading] = useState(false)

	// Refs for auto-refresh
	const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

	// Sync initial execution when it changes
	useEffect(() => {
		setExecution(initialExecution)
	}, [initialExecution])

	// Load execution detail from API
	const loadExecution = useCallback(async () => {
		if (!initialExecution?.member_id || !initialExecution?.id) return

		const result = await getExecution(initialExecution.member_id, initialExecution.id)
		if (result) {
			setExecution(toExecution(result))
		}
	}, [initialExecution?.member_id, initialExecution?.id, getExecution])

	// Status flags
	const isRunning = execution?.status === 'running' || execution?.status === 'pending'
	const isPaused = execution?.status === 'paused'
	const isActive = isRunning || isPaused // Active means not finished (running, pending, or paused)
	const isCompleted = execution?.status === 'completed'
	const isFailed = execution?.status === 'failed'
	const isCancelled = execution?.status === 'cancelled'

	// Show API error
	useEffect(() => {
		if (apiError) {
			message.error(apiError)
		}
	}, [apiError])

	// Load full execution data when drawer opens
	useEffect(() => {
		if (!visible) return
		// Always load full execution data when drawer becomes visible
		loadExecution()
	}, [visible, initialExecution?.id]) // eslint-disable-line react-hooks/exhaustive-deps

	// Auto-refresh for running executions (every 5 seconds)
	useEffect(() => {
		if (!visible || !isRunning) {
			if (refreshIntervalRef.current) {
				clearInterval(refreshIntervalRef.current)
				refreshIntervalRef.current = null
			}
			return
		}

		// Set up 5-second auto-refresh for running executions
		refreshIntervalRef.current = setInterval(loadExecution, 5000)

		return () => {
			if (refreshIntervalRef.current) {
				clearInterval(refreshIntervalRef.current)
				refreshIntervalRef.current = null
			}
		}
	}, [visible, isRunning, loadExecution])

	// Tick timer for running executions (updates every second for live duration)
	useEffect(() => {
		if (!isRunning || !visible) return
		const interval = setInterval(() => {
			setTick((t) => t + 1)
		}, 1000)
		return () => clearInterval(interval)
	}, [isRunning, visible])

	// Format helpers
	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr)
		const year = date.getFullYear()
		const month = (date.getMonth() + 1).toString().padStart(2, '0')
		const day = date.getDate().toString().padStart(2, '0')
		const hours = date.getHours().toString().padStart(2, '0')
		const minutes = date.getMinutes().toString().padStart(2, '0')
		const seconds = date.getSeconds().toString().padStart(2, '0')
		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
	}

	const formatDuration = (startStr: string, endStr?: string) => {
		const start = new Date(startStr)
		const end = endStr ? new Date(endStr) : new Date()
		const durationMs = end.getTime() - start.getTime()
		const seconds = Math.floor(durationMs / 1000)

		if (seconds < 60) return `${seconds}s`
		const minutes = Math.floor(seconds / 60)
		if (minutes < 60) return `${minutes}m ${seconds % 60}s`
		const hours = Math.floor(minutes / 60)
		return `${hours}h ${minutes % 60}m`
	}

	// Live duration for active executions (running or paused)
	const liveDuration = useMemo(() => {
		if (!execution || !isActive) return null
		// tick dependency ensures re-calculation every second
		void tick
		return formatDuration(execution.start_time)
	}, [execution, isActive, tick])

	// Status info
	const statusInfo = useMemo(() => {
		if (!execution) return null
		switch (execution.status) {
			case 'running':
				return {
					icon: 'material-play_circle',
					label: is_cn ? '进行中' : 'Running',
					class: styles.statusRunning
				}
			case 'pending':
				return {
					icon: 'material-hourglass_empty',
					label: is_cn ? '等待中' : 'Pending',
					class: styles.statusPending
				}
			case 'paused':
				return {
					icon: 'material-pause_circle',
					label: is_cn ? '已暂停' : 'Paused',
					class: styles.statusPaused
				}
			case 'completed':
				return {
					icon: 'material-check_circle',
					label: is_cn ? '已完成' : 'Completed',
					class: styles.statusCompleted
				}
			case 'failed':
				return { icon: 'material-error', label: is_cn ? '失败' : 'Failed', class: styles.statusFailed }
			case 'cancelled':
				return {
					icon: 'material-cancel',
					label: is_cn ? '已取消' : 'Cancelled',
					class: styles.statusCancelled
				}
			default:
				return { icon: 'material-help', label: execution.status, class: '' }
		}
	}, [execution, is_cn])

	// Trigger info
	const triggerInfo = useMemo(() => {
		if (!execution) return null
		switch (execution.trigger_type) {
			case 'clock':
				return { icon: 'material-schedule', label: is_cn ? '定时触发' : 'Scheduled' }
			case 'human':
				return { icon: 'material-person', label: is_cn ? '手动触发' : 'Manual' }
			case 'event':
				return { icon: 'material-bolt', label: is_cn ? '事件触发' : 'Event' }
			default:
				return { icon: 'material-help_outline', label: is_cn ? '未知' : 'Unknown' }
		}
	}, [execution, is_cn])

	// Phase info
	const phaseInfo = useMemo(() => {
		if (!execution) return null
		const phases = [
			{ key: 'inspiration', label: is_cn ? '灵感' : 'Inspiration' },
			{ key: 'goals', label: is_cn ? '目标' : 'Goals' },
			{ key: 'tasks', label: is_cn ? '任务' : 'Tasks' },
			{ key: 'run', label: is_cn ? '执行' : 'Run' },
			{ key: 'delivery', label: is_cn ? '交付' : 'Delivery' },
			{ key: 'learning', label: is_cn ? '学习' : 'Learning' }
		]
		const currentIndex = phases.findIndex((p) => p.key === execution.phase)
		return { phases, currentIndex }
	}, [execution, is_cn])

	// Task status icon
	const getTaskStatusIcon = (status: string) => {
		switch (status) {
			case 'completed':
				return { icon: 'material-check_circle', class: styles.taskCompleted }
			case 'running':
				return { icon: 'material-play_circle', class: styles.taskRunning }
			case 'failed':
				return { icon: 'material-error', class: styles.taskFailed }
			case 'skipped':
				return { icon: 'material-skip_next', class: styles.taskSkipped }
			case 'cancelled':
				return { icon: 'material-cancel', class: styles.taskCancelled }
			default:
				return { icon: 'material-radio_button_unchecked', class: styles.taskPending }
		}
	}

	// Action handlers
	const handlePause = async () => {
		if (!execution?.member_id || !execution?.id) return
		setLoading(true)
		const result = await pauseExecution(execution.member_id, execution.id)
		if (result?.success) {
			message.success(is_cn ? '已暂停' : 'Paused')
			loadExecution()
		}
		setLoading(false)
	}

	const handleResume = async () => {
		if (!execution?.member_id || !execution?.id) return
		setLoading(true)
		const result = await resumeExecution(execution.member_id, execution.id)
		if (result?.success) {
			message.success(is_cn ? '已恢复' : 'Resumed')
			loadExecution()
		}
		setLoading(false)
	}

	const handleStop = async () => {
		if (!execution?.member_id || !execution?.id) return
		setLoading(true)
		const result = await cancelExecution(execution.member_id, execution.id)
		if (result?.success) {
			message.success(is_cn ? '已停止' : 'Stopped')
			loadExecution()
		}
		setLoading(false)
	}

	const handleRetry = () => {
		// TODO: Implement retry API (Phase 3)
		message.info(is_cn ? '重试功能开发中' : 'Retry coming soon')
	}

	const handleRerun = () => {
		// TODO: Implement re-run API (Phase 3)
		message.info(is_cn ? '重新执行功能开发中' : 'Re-run coming soon')
	}

	const handleDownload = (attachment: { title: string; file: string }) => {
		console.log('Download:', attachment)
		// TODO: Trigger download
		alert(is_cn ? `下载: ${attachment.title}` : `Download: ${attachment.title}`)
	}

	const handleClose = () => {
		onClose()
	}

	// Handle escape key
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Escape') {
			handleClose()
		}
	}

	if (!visible || !execution) return null

	// Backend returns localized name string
	const executionName = execution.name || execution.id

	return (
		<div className={styles.drawerOverlay} onClick={handleClose}>
			<div
				className={styles.drawerPanel}
				onClick={(e) => e.stopPropagation()}
				onKeyDown={handleKeyDown}
				tabIndex={-1}
			>
				{/* Header */}
				<div className={styles.drawerHeader}>
					<h3 className={styles.executionTitle}>{executionName}</h3>
					<button className={styles.closeBtn} onClick={handleClose}>
						<Icon name='material-close' size={18} />
					</button>
				</div>

				{/* Meta info bar */}
				<div className={styles.metaBar}>
					<div className={styles.metaLeft}>
						<div className={styles.metaItem}>
							<Icon name={triggerInfo?.icon || ''} size={14} />
							<span>{triggerInfo?.label}</span>
						</div>
						<div className={styles.metaDivider} />
						<div className={styles.metaItem}>
							<Icon name='material-schedule' size={14} />
							<span>{formatDate(execution.start_time)}</span>
						</div>
						<div className={styles.metaDivider} />
						<div className={styles.metaItem}>
							<Icon name='material-timer' size={14} />
							{isActive ? (
								<span className={styles.liveDuration}>{liveDuration}</span>
							) : (
								<span>{formatDuration(execution.start_time, execution.end_time)}</span>
							)}
						</div>
					</div>
					<div className={`${styles.statusBadge} ${statusInfo?.class}`}>
						<Icon name={statusInfo?.icon || ''} size={12} />
						<span>{statusInfo?.label}</span>
					</div>
				</div>

				{/* Content - scrollable */}
				<div className={styles.drawerContent}>
					{/* ========== ACTIVE STATE (Running or Paused) ========== */}
					{isActive && (
						<>
							{/* Phase Progress */}
							<section className={styles.section}>
								<div className={styles.sectionHeader}>
									<Icon name='material-timeline' size={16} />
									<span>{is_cn ? '执行进度' : 'Progress'}</span>
								</div>
								<div className={styles.phaseProgress}>
									{phaseInfo?.phases.map((phase, index) => {
										const isCurrent = index === phaseInfo.currentIndex
										const isPast = index < phaseInfo.currentIndex
										const isFuture = index > phaseInfo.currentIndex
										return (
											<div
												key={phase.key}
												className={`${styles.phaseItem} ${
													isCurrent ? styles.phaseCurrent : ''
												} ${isPast ? styles.phasePast : ''} ${
													isFuture ? styles.phaseFuture : ''
												}`}
											>
												<div className={styles.phaseIndicator}>
													{isPast && (
														<Icon
															name='material-check'
															size={12}
														/>
													)}
													{isCurrent && (
														<div
															className={styles.phasePulse}
														/>
													)}
												</div>
												<span className={styles.phaseLabel}>
													{phase.label}
												</span>
											</div>
										)
									})}
								</div>
							</section>

							{/* Current Task */}
							{execution.current_task_name && (
								<section className={styles.section}>
									<div className={styles.sectionHeader}>
										<Icon name='material-play_arrow' size={16} />
										<span>{is_cn ? '当前任务' : 'Current Task'}</span>
									</div>
									<div className={styles.currentTask}>
										<div className={styles.currentTaskPulse} />
										<span>{execution.current_task_name}</span>
									</div>
									{execution.current?.progress && (
										<div className={styles.progressInfo}>
											<div className={styles.progressBar}>
												<div
													className={styles.progressFill}
													style={{
														width: `${
															(parseInt(
																execution.current.progress.split(
																	'/'
																)[0]
															) /
																parseInt(
																	execution.current.progress.split(
																		'/'
																	)[1]
																)) *
															100
														}%`
													}}
												/>
											</div>
											<span className={styles.progressText}>
												{execution.current.progress}
											</span>
										</div>
									)}
								</section>
							)}

							{/* Goals */}
							{execution.goals && (
								<section className={styles.section}>
									<div className={styles.sectionHeader}>
										<Icon name='material-flag' size={16} />
										<span>{is_cn ? '执行目标' : 'Goals'}</span>
									</div>
									<div className={styles.goalsContent}>
										<pre>{execution.goals.content}</pre>
									</div>
								</section>
							)}

							{/* Task List */}
							{execution.tasks && execution.tasks.length > 0 && (
								<section className={styles.section}>
									<div className={styles.sectionHeader}>
										<Icon name='material-checklist' size={16} />
										<span>{is_cn ? '任务列表' : 'Task List'}</span>
									</div>
									<div className={styles.taskList}>
										{execution.tasks.map((task: Task, index: number) => {
											const taskStatus = getTaskStatusIcon(task.status)
											// Only show as current if: index matches AND task is actually running
											const isCurrent =
												index === execution.current?.task_index &&
												task.status === 'running'
											const taskTitle = task.description || task.executor_id
											return (
												<div
													key={task.id}
													className={`${styles.taskItem} ${
														isCurrent
															? styles.taskItemCurrent
															: ''
													}`}
												>
													<div
														className={`${styles.taskIcon} ${taskStatus.class}`}
													>
														<Icon
															name={taskStatus.icon}
															size={16}
														/>
													</div>
													<div className={styles.taskInfo}>
														<span className={styles.taskTitle}>
															{taskTitle}
														</span>
														<span
															className={
																styles.taskSubtitle
															}
														>
															{task.executor_type}:{' '}
															{task.executor_id}
														</span>
													</div>
													{isCurrent && (
														<div
															className={
																styles.taskRunningIndicator
															}
														>
															<span
																className={
																	styles.taskRunningDot
																}
															/>
														</div>
													)}
												</div>
											)
										})}
									</div>
								</section>
							)}
						</>
					)}

					{/* ========== COMPLETED STATE ========== */}
					{isCompleted && (
						<>
							{/* Results - Primary for completed */}
							{execution.delivery?.content && (
								<section className={`${styles.section} ${styles.sectionPrimary}`}>
									<div className={styles.sectionHeader}>
										<Icon name='material-task_alt' size={16} />
										<span>{is_cn ? '执行结果' : 'Results'}</span>
										{execution.delivery.success && (
											<span className={styles.deliverySuccess}>
												<Icon name='material-check' size={12} />
												{is_cn ? '已交付' : 'Delivered'}
											</span>
										)}
									</div>

									{/* Summary */}
									<div className={styles.resultSummary}>
										{execution.delivery.content.summary}
									</div>

									{/* Body */}
									{execution.delivery.content.body && (
										<div className={styles.resultBody}>
											<pre>{execution.delivery.content.body}</pre>
										</div>
									)}

									{/* Attachments */}
									{execution.delivery.content.attachments &&
										execution.delivery.content.attachments.length > 0 && (
											<div className={styles.attachments}>
												<div className={styles.attachmentsHeader}>
													<Icon
														name='material-attach_file'
														size={14}
													/>
													<span>
														{is_cn ? '附件' : 'Attachments'} (
														{
															execution.delivery.content
																.attachments.length
														}
														)
													</span>
												</div>
												<div className={styles.attachmentList}>
													{execution.delivery.content.attachments.map(
														(attachment, index) => (
															<div
																key={index}
																className={
																	styles.attachmentItem
																}
																onClick={() =>
																	handleDownload(
																		attachment
																	)
																}
															>
																<Icon
																	name='material-description'
																	size={16}
																/>
																<span
																	className={
																		styles.attachmentTitle
																	}
																>
																	{attachment.title}
																</span>
																<Icon
																	name='material-download'
																	size={14}
																	className={
																		styles.attachmentDownload
																	}
																/>
															</div>
														)
													)}
												</div>
											</div>
										)}
								</section>
							)}

							{/* Goals - Collapsed for completed */}
							{execution.goals && (
								<section className={styles.section}>
									<details className={styles.collapsible}>
										<summary className={styles.sectionHeader}>
											<Icon name='material-flag' size={16} />
											<span>{is_cn ? '执行目标' : 'Goals'}</span>
											<Icon
												name='material-expand_more'
												size={16}
												className={styles.expandIcon}
											/>
										</summary>
										<div className={styles.goalsContent}>
											<pre>{execution.goals.content}</pre>
										</div>
									</details>
								</section>
							)}

							{/* Task List - Collapsed for completed */}
							{execution.tasks && execution.tasks.length > 0 && (
								<section className={styles.section}>
									<details className={styles.collapsible}>
										<summary className={styles.sectionHeader}>
											<Icon name='material-checklist' size={16} />
											<span>
												{is_cn ? '任务列表' : 'Task List'} (
												{execution.tasks.length})
											</span>
											<Icon
												name='material-expand_more'
												size={16}
												className={styles.expandIcon}
											/>
										</summary>
										<div className={styles.taskList}>
											{execution.tasks.map((task: Task) => {
												const taskStatus = getTaskStatusIcon(
													task.status
												)
												const taskTitle =
													task.description || task.executor_id
												return (
													<div
														key={task.id}
														className={styles.taskItem}
													>
														<div
															className={`${styles.taskIcon} ${taskStatus.class}`}
														>
															<Icon
																name={taskStatus.icon}
																size={16}
															/>
														</div>
														<div className={styles.taskInfo}>
															<span
																className={
																	styles.taskTitle
																}
															>
																{taskTitle}
															</span>
															<span
																className={
																	styles.taskSubtitle
																}
															>
																{task.executor_type}:{' '}
																{task.executor_id}
															</span>
														</div>
													</div>
												)
											})}
										</div>
									</details>
								</section>
							)}
						</>
					)}

					{/* ========== FAILED STATE ========== */}
					{isFailed && (
						<>
							{/* Error - Primary for failed */}
							<section className={`${styles.section} ${styles.sectionError}`}>
								<div className={styles.sectionHeader}>
									<Icon name='material-error_outline' size={16} />
									<span>{is_cn ? '错误信息' : 'Error'}</span>
								</div>
								<div className={styles.errorContent}>
									<div className={styles.errorIcon}>
										<Icon name='material-warning' size={24} />
									</div>
									<div className={styles.errorMessage}>{execution.error}</div>
								</div>
							</section>

							{/* Phase Progress - Collapsed for failed */}
							<section className={styles.section}>
								<details className={styles.collapsible}>
									<summary className={styles.sectionHeader}>
										<Icon name='material-timeline' size={16} />
										<span>{is_cn ? '执行进度' : 'Progress'}</span>
										<Icon
											name='material-expand_more'
											size={16}
											className={styles.expandIcon}
										/>
									</summary>
									<div className={styles.phaseProgress}>
										{phaseInfo?.phases.map((phase, index) => {
											const isCurrent = index === phaseInfo.currentIndex
											const isPast = index < phaseInfo.currentIndex
											const isFuture = index > phaseInfo.currentIndex
											return (
												<div
													key={phase.key}
													className={`${styles.phaseItem} ${
														isCurrent ? styles.phaseError : ''
													} ${isPast ? styles.phasePast : ''} ${
														isFuture ? styles.phaseFuture : ''
													}`}
												>
													<div className={styles.phaseIndicator}>
														{isPast && (
															<Icon
																name='material-check'
																size={12}
															/>
														)}
														{isCurrent && (
															<Icon
																name='material-close'
																size={12}
															/>
														)}
													</div>
													<span className={styles.phaseLabel}>
														{phase.label}
													</span>
												</div>
											)
										})}
									</div>
								</details>
							</section>

							{/* Goals - Collapsed for failed */}
							{execution.goals && (
								<section className={styles.section}>
									<details className={styles.collapsible}>
										<summary className={styles.sectionHeader}>
											<Icon name='material-flag' size={16} />
											<span>{is_cn ? '执行目标' : 'Goals'}</span>
											<Icon
												name='material-expand_more'
												size={16}
												className={styles.expandIcon}
											/>
										</summary>
										<div className={styles.goalsContent}>
											<pre>{execution.goals.content}</pre>
										</div>
									</details>
								</section>
							)}

							{/* Task List - Collapsed for failed, show failure point */}
							{execution.tasks && execution.tasks.length > 0 && (
								<section className={styles.section}>
									<details className={styles.collapsible}>
										<summary className={styles.sectionHeader}>
											<Icon name='material-checklist' size={16} />
											<span>
												{is_cn ? '任务列表' : 'Task List'} (
												{execution.tasks.length})
											</span>
											<Icon
												name='material-expand_more'
												size={16}
												className={styles.expandIcon}
											/>
										</summary>
										<div className={styles.taskList}>
											{execution.tasks.map((task: Task) => {
												const taskStatus = getTaskStatusIcon(
													task.status
												)
												const isFailedTask = task.status === 'failed'
												const taskTitle =
													task.description || task.executor_id
												return (
													<div
														key={task.id}
														className={`${styles.taskItem} ${
															isFailedTask
																? styles.taskItemFailed
																: ''
														}`}
													>
														<div
															className={`${styles.taskIcon} ${taskStatus.class}`}
														>
															<Icon
																name={taskStatus.icon}
																size={16}
															/>
														</div>
														<div className={styles.taskInfo}>
															<span
																className={
																	styles.taskTitle
																}
															>
																{taskTitle}
															</span>
															<span
																className={
																	styles.taskSubtitle
																}
															>
																{task.executor_type}:{' '}
																{task.executor_id}
															</span>
														</div>
														{isFailedTask && (
															<span
																className={
																	styles.taskFailedBadge
																}
															>
																{is_cn
																	? '失败'
																	: 'Failed'}
															</span>
														)}
													</div>
												)
											})}
										</div>
									</details>
								</section>
							)}
						</>
					)}

					{/* ========== CANCELLED STATE ========== */}
					{isCancelled && (
						<section className={styles.section}>
							<div className={styles.cancelledNotice}>
								<Icon name='material-cancel' size={32} />
								<span>{is_cn ? '此执行已被取消' : 'This execution was cancelled'}</span>
							</div>
						</section>
					)}
				</div>

				{/* Footer Actions */}
				<div className={styles.drawerFooter}>
					{isActive && (
						<>
							<button className={styles.actionBtnPrimary} onClick={onGuide}>
								<Icon name='material-quickreply' size={16} />
								<span>{is_cn ? '指导执行' : 'Guide'}</span>
							</button>
							{isPaused ? (
								<button className={styles.actionBtnSecondary} onClick={handleResume}>
									<Icon name='material-play_arrow' size={16} />
									<span>{is_cn ? '继续' : 'Resume'}</span>
								</button>
							) : (
								<button className={styles.actionBtnSecondary} onClick={handlePause}>
									<Icon name='material-pause' size={16} />
									<span>{is_cn ? '暂停' : 'Pause'}</span>
								</button>
							)}
							<button className={styles.actionBtnDanger} onClick={handleStop}>
								<Icon name='material-stop' size={16} />
								<span>{is_cn ? '停止' : 'Stop'}</span>
							</button>
						</>
					)}

					{isCompleted && (
						<>
							<button className={styles.actionBtnSecondary} onClick={handleRerun}>
								<Icon name='material-refresh' size={16} />
								<span>{is_cn ? '重新执行' : 'Re-run'}</span>
							</button>
							{execution.delivery?.content?.attachments &&
								execution.delivery.content.attachments.length > 0 && (
									<button
										className={styles.actionBtnPrimary}
										onClick={() =>
											execution.delivery?.content?.attachments?.[0] &&
											handleDownload(
												execution.delivery.content.attachments[0]
											)
										}
									>
										<Icon name='material-download' size={16} />
										<span>{is_cn ? '下载结果' : 'Download'}</span>
									</button>
								)}
						</>
					)}

					{isFailed && (
						<button className={styles.actionBtnPrimary} onClick={handleRetry}>
							<Icon name='material-refresh' size={16} />
							<span>{is_cn ? '重试' : 'Retry'}</span>
						</button>
					)}

					{isCancelled && (
						<button className={styles.actionBtnSecondary} onClick={handleRerun}>
							<Icon name='material-refresh' size={16} />
							<span>{is_cn ? '重新执行' : 'Re-run'}</span>
						</button>
					)}
				</div>
			</div>
		</div>
	)
}

export default ExecutionDetailDrawer
