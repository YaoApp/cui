import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Spin, Tooltip } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import type { RobotState } from '../../../types'
import { getDeliveriesPaginated, simulateApiDelay, type Delivery } from '../../../mock/data'
import CreatureLoading from '../../CreatureLoading'
import styles from '../index.less'

interface ResultsTabProps {
	robot: RobotState
	onOpenDetail?: (delivery: Delivery) => void
}

type TriggerFilter = 'all' | 'clock' | 'human' | 'event'

const ResultsTab: React.FC<ResultsTabProps> = ({ robot, onOpenDetail }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// State
	const [deliveries, setDeliveries] = useState<Delivery[]>([])
	const [loading, setLoading] = useState(true)
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

	// Load data
	const loadData = useCallback(async (reset: boolean = false) => {
		const currentPage = reset ? 1 : page

		if (reset) {
			setLoading(true)
			setPage(1)
		} else {
			setLoadingMore(true)
		}

		await simulateApiDelay(300)

		const result = getDeliveriesPaginated({
			memberId: robot.member_id,
			page: currentPage,
			pageSize,
			trigger: triggerFilter,
			keywords: searchKeywords
		})

		if (reset) {
			setDeliveries(result.data)
		} else {
			setDeliveries((prev) => [...prev, ...result.data])
		}

		setTotal(result.total)
		setHasMore(result.hasMore)
		setLoading(false)
		setLoadingMore(false)
	}, [robot.member_id, page, triggerFilter, searchKeywords, pageSize])

	// Initial load
	useEffect(() => {
		loadData(true)
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
			deliveries.length === 0 ||
			loading ||
			loadingMore ||
			!hasMore ||
			deliveries.length >= total
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
	}, [deliveries.length, loading, loadingMore, hasMore, total, loadMore])

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

	// Handle row click - open detail modal
	const handleRowClick = (delivery: Delivery) => {
		onOpenDetail?.(delivery)
	}

	// Handle download
	const handleDownload = (e: React.MouseEvent, delivery: Delivery) => {
		e.stopPropagation()
		if (delivery.attachments.length > 0) {
			console.log('Download attachments:', delivery.attachments)
			// TODO: Implement actual download
			const names = delivery.attachments.map((a) => a.title).join(', ')
			alert(is_cn ? `下载: ${names}` : `Download: ${names}`)
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
				) : deliveries.length === 0 ? (
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
							{deliveries.map((delivery) => {
								const goal = is_cn ? delivery.title.cn : delivery.title.en
								const triggerInfo = getTriggerInfo(delivery.trigger_type)
								const hasFiles = delivery.attachments.length > 0

								return (
									<div
										key={delivery.id}
										className={styles.resultsTableRow}
										onClick={() => handleRowClick(delivery)}
									>
										<div className={styles.colGoal} title={goal}>
											{goal}
										</div>
										<div className={styles.colSummary} title={delivery.summary}>
											{delivery.summary}
										</div>
										<div className={styles.colTrigger}>
											<Icon name={triggerInfo.icon} size={14} />
										</div>
										<div className={styles.colTime}>
											{formatDate(delivery.time)}
										</div>
										<div className={styles.colFiles}>
											{hasFiles ? (
												<span className={styles.filesBadge}>
													{delivery.attachments.length}
												</span>
											) : (
												<span className={styles.noFiles}>-</span>
											)}
										</div>
										<div className={styles.colAction}>
											{hasFiles && (
												<Tooltip title={is_cn ? '下载' : 'Download'}>
													<button
														className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
														onClick={(e) => handleDownload(e, delivery)}
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
						{!hasMore && deliveries.length > 0 && (
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
