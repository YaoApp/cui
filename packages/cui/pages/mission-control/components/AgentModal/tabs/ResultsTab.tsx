import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Spin, Tooltip } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import useRobots from '@/hooks/useRobots'
import type { RobotState } from '../../../types'
import type { Result, ResultDetail, TriggerType } from '@/openapi/agent/robot'
import CreatureLoading from '../../CreatureLoading'
import styles from '../index.less'

interface ResultsTabProps {
	robot: RobotState
	onOpenDetail?: (result: ResultDetail) => void
}

type TriggerFilter = 'all' | 'clock' | 'human' | 'event'

const ResultsTab: React.FC<ResultsTabProps> = ({ robot, onOpenDetail }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const { listResults, getResult } = useRobots()

	// State
	const [results, setResults] = useState<Result[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [loadingMore, setLoadingMore] = useState(false)
	const [hasMore, setHasMore] = useState(true)
	const [total, setTotal] = useState(0)
	const [page, setPage] = useState(1)
	const [triggerFilter, setTriggerFilter] = useState<TriggerFilter>('all')
	const [searchKeywords, setSearchKeywords] = useState('')
	const [searchInput, setSearchInput] = useState('')

	const containerRef = useRef<HTMLDivElement>(null)
	const initialFillCheckedRef = useRef(false)
	const pageSize = 10

	// Load data from API
	const loadData = useCallback(async (reset: boolean = false) => {
		const currentPage = reset ? 1 : page

		if (reset) {
			setLoading(true)
			setPage(1)
			setError(null) // Clear previous error
		} else {
			setLoadingMore(true)
		}

		// Build filter
		const filter: { trigger_type?: TriggerType; keyword?: string; page?: number; pagesize?: number } = {
			page: currentPage,
			pagesize: pageSize
		}

		if (triggerFilter !== 'all') {
			filter.trigger_type = triggerFilter as TriggerType
		}
		if (searchKeywords) {
			filter.keyword = searchKeywords
		}

		try {
			const response = await listResults(robot.member_id, filter)

			if (response) {
				if (reset) {
					setResults(response.data || [])
				} else {
					setResults((prev) => [...prev, ...(response.data || [])])
				}
				setTotal(response.total || 0)
				const loadedCount = reset ? (response.data?.length || 0) : (results.length + (response.data?.length || 0))
				setHasMore(loadedCount < (response.total || 0))
				setError(null)
			} else {
				// API returned null - likely a permission or network error
				if (reset) {
					setResults([])
					setError(is_cn ? '无法加载成果数据' : 'Failed to load results')
				}
				setTotal(0)
				setHasMore(false)
			}
		} catch (err) {
			if (reset) {
				setResults([])
				setError(err instanceof Error ? err.message : (is_cn ? '加载失败' : 'Load failed'))
			}
			setTotal(0)
			setHasMore(false)
		}

		setLoading(false)
		setLoadingMore(false)
	}, [robot.member_id, page, triggerFilter, searchKeywords, pageSize, listResults, results.length, is_cn])

	// Initial load
	useEffect(() => {
		loadData(true)
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [robot.member_id, triggerFilter, searchKeywords])

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
	// eslint-disable-next-line react-hooks/exhaustive-deps
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
	}, [robot.member_id, triggerFilter, searchKeywords])

	// Auto-load for large screens
	useEffect(() => {
		if (
			initialFillCheckedRef.current ||
			results.length === 0 ||
			loading ||
			loadingMore ||
			!hasMore ||
			results.length >= total
		) {
			return
		}

		const container = containerRef.current
		if (!container) return

		requestAnimationFrame(() => {
			const { scrollHeight, clientHeight } = container
			if (scrollHeight <= clientHeight) {
				loadMore()
			} else {
				initialFillCheckedRef.current = true
			}
		})
	}, [results.length, loading, loadingMore, hasMore, total, loadMore])

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

	// Handle row click - load detail and open modal
	const handleRowClick = async (result: Result) => {
		if (!onOpenDetail) return

		// Get full result detail
		const detail = await getResult(robot.member_id, result.id)
		if (detail) {
			onOpenDetail(detail)
		}
	}

	// Handle download
	const handleDownload = (e: React.MouseEvent, result: Result) => {
		e.stopPropagation()
		if (result.has_attachments) {
			console.log('Download attachments for result:', result.id)
			// TODO: Implement actual download - need to fetch detail first to get attachment URLs
			alert(is_cn ? '下载功能开发中...' : 'Download feature coming soon...')
		}
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

	const getTriggerInfo = (type: string) => {
		switch (type) {
			case 'clock':
				return { icon: 'material-schedule', label: is_cn ? '定时' : 'Clock' }
			case 'human':
				return { icon: 'material-person', label: is_cn ? '人工' : 'Human' }
			case 'event':
				return { icon: 'material-bolt', label: is_cn ? '事件' : 'Event' }
			default:
				return { icon: 'material-help_outline', label: type }
		}
	}

	// Filter options
	const triggerOptions: { value: TriggerFilter; label: string; icon: string }[] = [
		{ value: 'all', label: is_cn ? '全部' : 'All', icon: 'material-list' },
		{ value: 'clock', label: is_cn ? '定时' : 'Clock', icon: 'material-schedule' },
		{ value: 'human', label: is_cn ? '人工' : 'Human', icon: 'material-person' },
		{ value: 'event', label: is_cn ? '事件' : 'Event', icon: 'material-bolt' }
	]

	return (
		<div className={styles.resultsContainer}>
			{/* Toolbar */}
			<div className={styles.resultsToolbar}>
				{/* Trigger filter pills */}
				<div className={styles.filterPills}>
					{triggerOptions.map((opt) => (
						<button
							key={opt.value}
							className={`${styles.filterPill} ${triggerFilter === opt.value ? styles.filterPillActive : ''}`}
							onClick={() => setTriggerFilter(opt.value)}
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
			<div className={styles.resultsContent} ref={containerRef}>
				{loading ? (
					<CreatureLoading size="medium" />
				) : error ? (
					/* Error state - show error message instead of empty placeholder */
					<div className={styles.resultsEmpty}>
						<Icon name='material-error_outline' size={40} className={styles.resultsErrorIcon} />
						<span className={styles.resultsEmptyText}>
							{is_cn ? '加载失败' : 'Failed to load'}
						</span>
						<span className={styles.resultsEmptyHint}>{error}</span>
						<button 
							className={styles.retryBtn}
							onClick={() => loadData(true)}
						>
							<Icon name='material-refresh' size={14} />
							<span>{is_cn ? '重试' : 'Retry'}</span>
						</button>
					</div>
				) : results.length === 0 ? (
					<div className={styles.resultsEmpty}>
						<Icon name='material-inventory_2' size={40} className={styles.resultsEmptyIcon} />
						<span className={styles.resultsEmptyText}>
							{searchKeywords
								? (is_cn ? '未找到匹配的成果' : 'No matching results')
								: (is_cn ? '暂无产出成果' : 'No deliverables yet')}
						</span>
						<span className={styles.resultsEmptyHint}>
							{is_cn
								? '完成的任务会在这里显示成果'
								: 'Completed tasks will show deliverables here'}
						</span>
					</div>
				) : (
					<>
						{/* Table header */}
						<div className={styles.resultsTableHeader}>
							<div className={styles.colGoal}>{is_cn ? '目标' : 'Goal'}</div>
							<div className={styles.colSummary}>{is_cn ? '成果摘要' : 'Summary'}</div>
							<div className={styles.colTrigger}>{is_cn ? '触发' : 'Trigger'}</div>
							<div className={styles.colTime}>{is_cn ? '时间' : 'Time'}</div>
							<div className={styles.colFiles}>{is_cn ? '附件' : 'Files'}</div>
							<div className={styles.colAction}></div>
						</div>

						{/* Table body */}
						<div className={styles.resultsTableBody}>
							{results.map((result) => {
								const triggerInfo = getTriggerInfo(result.trigger_type)

								return (
									<div
										key={result.id}
										className={styles.resultsTableRow}
										onClick={() => handleRowClick(result)}
									>
										<div className={styles.colGoal} title={result.name}>
											{result.name || '-'}
										</div>
										<div className={styles.colSummary} title={result.summary}>
											{result.summary || '-'}
										</div>
										<div className={styles.colTrigger}>
											<Icon name={triggerInfo.icon} size={14} />
										</div>
										<div className={styles.colTime}>
											{result.end_time ? formatDate(result.end_time) : '-'}
										</div>
										<div className={styles.colFiles}>
											{result.has_attachments ? (
												<span className={styles.filesBadge}>
													<Icon name='material-attach_file' size={12} />
												</span>
											) : (
												<span className={styles.noFiles}>-</span>
											)}
										</div>
										<div className={styles.colAction}>
											{result.has_attachments && (
												<Tooltip title={is_cn ? '下载' : 'Download'}>
													<button
														className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
														onClick={(e) => handleDownload(e, result)}
													>
														<Icon name='material-download' size={14} />
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
							<div className={styles.resultsLoadingMore}>
								<Spin size='small' />
								<span>{is_cn ? '加载更多...' : 'Loading more...'}</span>
							</div>
						)}

						{/* All loaded */}
						{!hasMore && results.length > 0 && (
							<div className={styles.resultsAllLoaded}>
								<span>{is_cn ? `共 ${total} 条成果` : `${total} deliverables total`}</span>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	)
}

export default ResultsTab
