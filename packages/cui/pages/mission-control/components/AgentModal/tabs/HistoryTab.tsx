import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Spin, Tooltip, message } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { useRobots } from '@/hooks/useRobots'
import type { RobotState, Execution } from '../../../types'
import type { ExecutionResponse, ExecStatus } from '@/openapi/agent/robot'
import CreatureLoading from '../../CreatureLoading'
import styles from '../index.less'

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

interface HistoryTabProps {
	robot: RobotState
	onOpenDetail?: (execution: Execution) => void
}

type StatusFilter = 'all' | 'completed' | 'failed' | 'cancelled' | 'running'

const HistoryTab: React.FC<HistoryTabProps> = ({ robot, onOpenDetail }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// API hook
	const { listExecutions, pauseExecution, resumeExecution, cancelExecution, error: apiError } = useRobots()

	// State
	const [executions, setExecutions] = useState<Execution[]>([])
	const [loading, setLoading] = useState(true)
	const [loadingMore, setLoadingMore] = useState(false)
	const [hasMore, setHasMore] = useState(true)
	const [total, setTotal] = useState(0)
	const [page, setPage] = useState(1)
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
	const [searchKeywords, setSearchKeywords] = useState('')
	const [searchInput, setSearchInput] = useState('')

	const containerRef = useRef<HTMLDivElement>(null)
	const initialFillCheckedRef = useRef(false)
	const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const pageSize = 10

	// Show API error
	useEffect(() => {
		if (apiError) {
			message.error(apiError)
		}
	}, [apiError])

	// Load data from API
	const loadData = useCallback(
		async (reset: boolean = false) => {
			const currentPage = reset ? 1 : page

			if (reset) {
				setLoading(true)
				setPage(1)
			} else {
				setLoadingMore(true)
			}

			// Build API filter
			const filter: any = {
				page: currentPage,
				pagesize: pageSize
			}
			if (statusFilter !== 'all') {
				filter.status = statusFilter as ExecStatus
			}
			if (searchKeywords) {
				filter.keyword = searchKeywords
			}

			const result = await listExecutions(robot.member_id, filter)

			if (result) {
				const converted = result.data.map(toExecution)
				if (reset) {
					setExecutions(converted)
				} else {
					// Merge with deduplication by id
					setExecutions((prev) => {
						const existingIds = new Set(prev.map((e) => e.id))
						const newItems = converted.filter((e) => !existingIds.has(e.id))
						return [...prev, ...newItems]
					})
				}
				setTotal(result.total)
				setHasMore(currentPage * pageSize < result.total)
			}

			setLoading(false)
			setLoadingMore(false)
		},
		[robot.member_id, page, statusFilter, searchKeywords, pageSize, listExecutions]
	)

	// Initial load and 60-second polling
	useEffect(() => {
		loadData(true)

		// Set up 60-second polling for list refresh
		pollingRef.current = setInterval(() => {
			loadData(true)
		}, 60000)

		return () => {
			if (pollingRef.current) {
				clearInterval(pollingRef.current)
			}
		}
	}, [robot.member_id, statusFilter, searchKeywords])

	// Load more
	const loadMore = useCallback(() => {
		if (!loadingMore && hasMore) {
			setPage((prev) => prev + 1)
		}
	}, [loadingMore, hasMore])

	// Handle page change
	useEffect(() => {
		if (page > 1) {
			loadData(false)
		}
	}, [page])

	// Scroll handler
	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		const handleScroll = () => {
			const { scrollTop, scrollHeight, clientHeight } = container
			if (scrollHeight - scrollTop - clientHeight < 50 && !loadingMore && hasMore && !loading) {
				loadMore()
			}
		}

		container.addEventListener('scroll', handleScroll)
		return () => container.removeEventListener('scroll', handleScroll)
	}, [loadingMore, hasMore, loading, loadMore])

	// Reset initial fill check when filters change
	useEffect(() => {
		initialFillCheckedRef.current = false
	}, [robot.member_id, statusFilter, searchKeywords])

	// Check if we need to load more after initial load (for large screens)
	// Auto-load next page if content doesn't fill the container (no scrollbar)
	// Only runs once per filter change
	useEffect(() => {
		// Skip if already checked or conditions not met
		if (
			initialFillCheckedRef.current ||
			executions.length === 0 ||
			loading ||
			loadingMore ||
			!hasMore ||
			executions.length >= total
		) {
			return
		}

		const container = containerRef.current
		if (!container) return

		// Use requestAnimationFrame to ensure DOM has updated
		requestAnimationFrame(() => {
			const { scrollHeight, clientHeight } = container
			// Only load more if content doesn't fill the container
			if (scrollHeight <= clientHeight) {
				loadMore()
			} else {
				// Content fills container, mark as checked
				initialFillCheckedRef.current = true
			}
		})
	}, [executions.length, loading, loadingMore, hasMore, total, loadMore])

	// Handle search
	const handleSearch = () => {
		setSearchKeywords(searchInput.trim())
	}

	const handleSearchKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleSearch()
		}
	}

	const handleSearchClear = () => {
		setSearchInput('')
		setSearchKeywords('')
	}

	// Handle row click
	const handleRowClick = (execution: Execution) => {
		if (onOpenDetail) {
			onOpenDetail(execution)
		}
		console.log('Open detail for execution:', execution.id)
	}

	// Action handlers
	const handlePause = async (e: React.MouseEvent, exec: Execution) => {
		e.stopPropagation()
		const result = await pauseExecution(robot.member_id, exec.id)
		if (result?.success) {
			message.success(is_cn ? '已暂停' : 'Paused')
			loadData(true) // Refresh list
		}
	}

	const handleResume = async (e: React.MouseEvent, exec: Execution) => {
		e.stopPropagation()
		const result = await resumeExecution(robot.member_id, exec.id)
		if (result?.success) {
			message.success(is_cn ? '已继续' : 'Resumed')
			loadData(true) // Refresh list
		}
	}

	const handleStop = async (e: React.MouseEvent, exec: Execution) => {
		e.stopPropagation()
		const result = await cancelExecution(robot.member_id, exec.id)
		if (result?.success) {
			message.success(is_cn ? '已停止' : 'Stopped')
			loadData(true) // Refresh list
		}
	}

	const handleDownload = (e: React.MouseEvent, exec: Execution) => {
		e.stopPropagation()
		const attachments = exec.delivery?.content?.attachments
		if (attachments && attachments.length > 0) {
			console.log('Download attachments:', attachments)
			// TODO: Trigger download
			// For now, just show what would be downloaded
			alert(
				is_cn
					? `下载: ${attachments.map((a) => a.title).join(', ')}`
					: `Download: ${attachments.map((a) => a.title).join(', ')}`
			)
		}
	}

	const handleRetry = (e: React.MouseEvent, exec: Execution) => {
		e.stopPropagation()
		console.log('Retry execution:', exec.id)
		// TODO: API call
	}

	// Format helpers
	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr)
		const month = (date.getMonth() + 1).toString().padStart(2, '0')
		const day = date.getDate().toString().padStart(2, '0')
		const hours = date.getHours().toString().padStart(2, '0')
		const minutes = date.getMinutes().toString().padStart(2, '0')
		return `${month}-${day} ${hours}:${minutes}`
	}

	const formatDuration = (startStr: string, endStr?: string) => {
		if (!endStr) return '-'
		const start = new Date(startStr)
		const end = new Date(endStr)
		const durationMs = end.getTime() - start.getTime()
		const seconds = Math.floor(durationMs / 1000)

		if (seconds < 60) return `${seconds}s`
		const minutes = Math.floor(seconds / 60)
		if (minutes < 60) return `${minutes}m ${seconds % 60}s`
		const hours = Math.floor(minutes / 60)
		return `${hours}h ${minutes % 60}m`
	}

	const getStatusInfo = (status: string) => {
		switch (status) {
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
			default:
				return { icon: 'material-help', label: status, class: '' }
		}
	}

	const getTriggerIcon = (type: string) => {
		switch (type) {
			case 'clock':
				return 'material-schedule'
			case 'human':
				return 'material-person'
			case 'event':
				return 'material-bolt'
			default:
				return 'material-help_outline'
		}
	}

	// Filter options
	const filterOptions: { value: StatusFilter; label: string; icon: string }[] = [
		{ value: 'all', label: is_cn ? '全部' : 'All', icon: 'material-list' },
		{ value: 'running', label: is_cn ? '进行中' : 'Running', icon: 'material-play_circle' },
		{ value: 'completed', label: is_cn ? '已完成' : 'Completed', icon: 'material-check_circle' },
		{ value: 'failed', label: is_cn ? '失败' : 'Failed', icon: 'material-error' },
		{ value: 'cancelled', label: is_cn ? '已取消' : 'Cancelled', icon: 'material-cancel' }
	]

	// Check if has attachments
	const hasAttachments = (exec: Execution) => {
		return exec.delivery?.content?.attachments && exec.delivery.content.attachments.length > 0
	}

	return (
		<div className={styles.historyContainer}>
			{/* Filter bar */}
			<div className={styles.historyToolbar}>
				{/* Status filter pills */}
				<div className={styles.filterPills}>
					{filterOptions.map((opt) => (
						<button
							key={opt.value}
							className={`${styles.filterPill} ${
								statusFilter === opt.value ? styles.filterPillActive : ''
							}`}
							onClick={() => setStatusFilter(opt.value)}
						>
							<Icon name={opt.icon} size={14} />
							<span>{opt.label}</span>
						</button>
					))}
				</div>

				{/* Search */}
				<div className={styles.searchBox}>
					<Icon name='material-search' size={16} className={styles.searchIcon} />
					<input
						type='text'
						placeholder={is_cn ? '搜索...' : 'Search...'}
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						onKeyDown={handleSearchKeyDown}
						className={styles.searchInput}
					/>
					{searchInput && (
						<button className={styles.searchClear} onClick={handleSearchClear}>
							<Icon name='material-close' size={14} />
						</button>
					)}
				</div>
			</div>

			{/* Table content */}
			<div className={styles.historyContent} ref={containerRef}>
				{loading ? (
					<CreatureLoading size='medium' />
				) : executions.length === 0 ? (
					<div className={styles.historyEmpty}>
						<Icon name='material-history' size={40} className={styles.historyEmptyIcon} />
						<span className={styles.historyEmptyText}>
							{searchKeywords
								? is_cn
									? '未找到匹配的记录'
									: 'No matching records'
								: is_cn
								? '暂无执行历史'
								: 'No execution history'}
						</span>
					</div>
				) : (
					<>
						{/* Table header */}
						<div className={styles.historyTableHeader}>
							<div className={styles.colStatus}>{is_cn ? '状态' : 'Status'}</div>
							<div className={styles.colName}>{is_cn ? '目标' : 'Goal'}</div>
							<div className={styles.colResult}>{is_cn ? '结果摘要' : 'Result'}</div>
							<div className={styles.colTrigger}>{is_cn ? '触发' : 'Trigger'}</div>
							<div className={styles.colTime}>{is_cn ? '时间' : 'Time'}</div>
							<div className={styles.colDuration}>{is_cn ? '耗时' : 'Duration'}</div>
							<div className={styles.colActions}>{is_cn ? '操作' : 'Actions'}</div>
						</div>

						{/* Table body */}
						<div className={styles.historyTableBody}>
							{executions.map((exec) => {
								const statusInfo = getStatusInfo(exec.status)
								// Backend returns localized name/current_task_name strings
								const name = exec.name || exec.id
								const result =
									exec.status === 'completed' && exec.delivery?.content?.summary
										? exec.delivery.content.summary
										: exec.status === 'failed' && exec.error
										? exec.error
										: exec.status === 'running' && exec.current_task_name
										? exec.current_task_name
										: '-'

								const isRunning = exec.status === 'running' || exec.status === 'pending'
								const isPaused = exec.status === 'paused'
								const isActive = isRunning || isPaused
								const isCompleted = exec.status === 'completed'
								const isFailed = exec.status === 'failed'

								return (
									<div
										key={exec.id}
										className={styles.historyTableRow}
										onClick={() => handleRowClick(exec)}
									>
										<div className={`${styles.colStatus} ${statusInfo.class}`}>
											<Tooltip title={statusInfo.label}>
												<Icon name={statusInfo.icon} size={16} />
											</Tooltip>
										</div>
										<div className={styles.colName} title={name}>
											{name}
										</div>
										<div className={styles.colResult} title={result}>
											{result}
										</div>
										<div className={styles.colTrigger}>
											<Icon
												name={getTriggerIcon(exec.trigger_type)}
												size={14}
											/>
										</div>
										<div className={styles.colTime}>
											{formatDate(exec.start_time)}
										</div>
										<div className={styles.colDuration}>
											{isActive ? (
												<span className={styles.runningTime}>
													{formatDuration(
														exec.start_time,
														new Date().toISOString()
													)}
												</span>
											) : (
												formatDuration(exec.start_time, exec.end_time)
											)}
										</div>
										<div className={styles.colActions}>
											{/* Active (Running or Paused): Guide + Pause/Resume + Stop */}
											{isActive && (
												<>
													<Tooltip
														title={is_cn ? '指导执行' : 'Guide'}
													>
														<button
															className={styles.actionBtn}
															onClick={(e) => {
																e.stopPropagation()
																onOpenDetail?.(exec)
															}}
														>
															<Icon
																name='material-quickreply'
																size={14}
															/>
														</button>
													</Tooltip>
													{isPaused ? (
														<Tooltip
															title={
																is_cn
																	? '继续'
																	: 'Resume'
															}
														>
															<button
																className={
																	styles.actionBtn
																}
																onClick={(e) =>
																	handleResume(
																		e,
																		exec
																	)
																}
															>
																<Icon
																	name='material-play_circle'
																	size={14}
																/>
															</button>
														</Tooltip>
													) : (
														<Tooltip
															title={
																is_cn ? '暂停' : 'Pause'
															}
														>
															<button
																className={
																	styles.actionBtn
																}
																onClick={(e) =>
																	handlePause(
																		e,
																		exec
																	)
																}
															>
																<Icon
																	name='material-pause_circle'
																	size={14}
																/>
															</button>
														</Tooltip>
													)}
													<Tooltip title={is_cn ? '停止' : 'Stop'}>
														<button
															className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
															onClick={(e) =>
																handleStop(e, exec)
															}
														>
															<Icon
																name='material-stop_circle'
																size={14}
															/>
														</button>
													</Tooltip>
												</>
											)}

											{/* Completed with attachments: Download */}
											{isCompleted && hasAttachments(exec) && (
												<Tooltip
													title={is_cn ? '下载成果' : 'Download'}
												>
													<button
														className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
														onClick={(e) =>
															handleDownload(e, exec)
														}
													>
														<Icon
															name='material-download'
															size={14}
														/>
													</button>
												</Tooltip>
											)}

											{/* Failed: Retry */}
											{isFailed && (
												<Tooltip title={is_cn ? '重试' : 'Retry'}>
													<button
														className={styles.actionBtn}
														onClick={(e) =>
															handleRetry(e, exec)
														}
													>
														<Icon
															name='material-refresh'
															size={14}
														/>
													</button>
												</Tooltip>
											)}
										</div>
									</div>
								)
							})}
						</div>

						{/* Loading more */}
						{loadingMore && (
							<div className={styles.historyLoadingMore}>
								<Spin size='small' />
								<span>{is_cn ? '加载更多...' : 'Loading more...'}</span>
							</div>
						)}

						{/* All loaded */}
						{!hasMore && executions.length > 0 && (
							<div className={styles.historyAllLoaded}>
								<span>{is_cn ? `共 ${total} 条记录` : `${total} records total`}</span>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	)
}

export default HistoryTab
