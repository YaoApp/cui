import React, { useState, useEffect, useRef } from 'react'
import { Button, Tooltip, Input, message, Select } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { KB } from '@/openapi'
import { Segment, ScrollSegmentsRequest } from '@/openapi/kb/types'
import SegmentDetail from './detail'
import styles from '../Layout/index.less'

interface SegmentsProps {
	viewMode: 'dual' | 'left' | 'right'
	onHideLeftPanel: () => void
	onRestoreDualPanels: () => void
	docid: string
	collectionId: string
}

const Segments: React.FC<SegmentsProps> = ({ viewMode, onHideLeftPanel, onRestoreDualPanels, docid, collectionId }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [data, setData] = useState<Segment[]>([])
	const [search, setSearch] = useState('')
	const [searchText, setSearchText] = useState('')
	const [loading, setLoading] = useState(true)
	const [loadingMore, setLoadingMore] = useState(false)
	const [sortBy, setSortBy] = useState<string>('default')
	const [limit] = useState(20) // 每次加载的数量
	const [scrollId, setScrollId] = useState<string>('')
	const [detailVisible, setDetailVisible] = useState(false)
	const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null)
	const [hasMore, setHasMore] = useState(false)

	// 使用 ref 来防止重复请求和跟踪最新的 scrollId
	const isLoadingRef = useRef(false)
	const scrollIdRef = useRef<string>('')

	// 根据文档ID加载segments数据 (初始加载)
	const loadSegments = async (reset: boolean = false) => {
		if (!window.$app?.openapi) {
			console.error('OpenAPI not available')
			message.error(is_cn ? '系统未就绪' : 'System not ready')
			return
		}

		// 防止重复请求
		if (!reset && isLoadingRef.current) {
			return
		}

		try {
			if (reset) {
				setLoading(true)
				setData([])
				setScrollId('')
				scrollIdRef.current = '' // 重置 ref 中的 scrollId
				isLoadingRef.current = false // 重置时清除加载标记
			} else {
				setLoadingMore(true)
				isLoadingRef.current = true // 设置加载标记
			}

			// 构建API请求参数，使用 ref 中的最新值
			const currentScrollId = reset ? undefined : scrollIdRef.current

			const request: ScrollSegmentsRequest = {
				limit: limit,
				scroll_id: currentScrollId,
				include_metadata: true,
				include_nodes: false,
				include_relationships: false
			}

			// 添加排序参数
			if (sortBy !== 'default') {
				switch (sortBy) {
					case 'recall':
						request.order_by = 'recall_count:desc'
						break
					case 'weight':
						request.order_by = 'weight:desc'
						break
					case 'votes':
						request.order_by = 'vote:desc'
						break
				}
			}

			// 调用API获取segments数据
			const kb = new KB(window.$app.openapi)
			const response = await kb.ScrollSegments(docid, request)

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to fetch segments')
			}

			if (response.data) {
				const newSegments = response.data.segments || []

				if (reset) {
					setData(newSegments)
				} else {
					setData((prevData) => [...prevData, ...newSegments])
				}

				// 同时更新 state 和 ref，确保下次请求能使用最新的 scrollId
				const newScrollId = response.data.scroll_id || ''
				setScrollId(newScrollId)
				scrollIdRef.current = newScrollId // 立即更新 ref
				setHasMore(response.data.has_more || false)
			}
		} catch (error: any) {
			console.error('Failed to load segments:', error)
			message.error(is_cn ? '加载分段数据失败' : 'Failed to load segments')
			if (reset) {
				setData([])
				setHasMore(false)
			}
		} finally {
			setLoading(false)
			setLoadingMore(false)
			isLoadingRef.current = false // 清除加载标记
		}
	}

	// 加载更多segments数据
	const loadMoreSegments = async () => {
		if (!hasMore || loadingMore) {
			return
		}
		await loadSegments(false)
	}

	// 初始加载和重置加载
	useEffect(() => {
		if (docid) {
			loadSegments(true)
		}
	}, [docid, collectionId, sortBy])

	// Intersection Observer 监听滚动触发器
	useEffect(() => {
		// 只在没有搜索时启用无限滚动
		if (!hasMore || loadingMore || data.length === 0 || searchText.trim()) {
			return
		}

		// 添加延迟确保DOM元素已经渲染
		const timeoutId = setTimeout(() => {
			const observer = new IntersectionObserver(
				(entries) => {
					const triggerEntry = entries[0]
					if (triggerEntry.isIntersecting && hasMore && !loadingMore && !isLoadingRef.current) {
						// 立即断开观察器，防止重复触发
						observer.disconnect()
						loadMoreSegments()
					}
				},
				{
					threshold: 0.1, // 当10%的最后一个卡片可见时触发
					rootMargin: '100px' // 提前100px开始加载，确保在不同显示区域都能正常触发
				}
			)

			// 直接观察最后一个卡片元素，而不是单独的触发器
			const allCards = document.querySelectorAll('[class*="chunkCard"]')
			const lastCard = allCards[allCards.length - 1] as HTMLElement

			if (lastCard && data.length > 0) {
				observer.observe(lastCard)
			}

			// 清理函数保存observer引用
			return () => {
				observer.disconnect()
			}
		}, 100)

		return () => {
			clearTimeout(timeoutId)
		}
	}, [hasMore, loadingMore, searchText, data.length]) // 添加data.length依赖，确保数据更新后重新绑定Observer

	// 搜索处理
	const handleSearch = () => {
		setSearchText(search)
		// 搜索时重新加载数据
		loadSegments(true)
	}

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleSearch()
		}
	}

	// 投票处理
	const handleVote = (segmentId: string, type: 'up' | 'down') => {
		// TODO: 实现真实的投票API调用
		setData((prevData) =>
			prevData.map((segment) =>
				segment.id === segmentId
					? {
							...segment,
							vote: type === 'up' ? (segment.vote || 0) + 1 : (segment.vote || 0) - 1
					  }
					: segment
			)
		)
		message.success(is_cn ? '投票成功' : 'Vote submitted')
	}

	// 打开详情模态窗口
	const handleOpenDetail = (segment: Segment) => {
		setSelectedSegment(segment)
		setDetailVisible(true)
	}

	// 关闭详情模态窗口
	const handleCloseDetail = () => {
		setDetailVisible(false)
		setSelectedSegment(null)
	}

	// 过滤segments (搜索在前端进行简单过滤)
	const getFilteredSegments = () => {
		if (searchText.trim()) {
			const keyword = searchText.toLowerCase()
			return data.filter(
				(segment) =>
					segment.text.toLowerCase().includes(keyword) ||
					(segment.metadata && JSON.stringify(segment.metadata).toLowerCase().includes(keyword))
			)
		}
		return data
	}

	const filteredSegments = getFilteredSegments()

	// 截取文本显示
	const truncateText = (text: string, maxLength: number = 150) => {
		if (text.length <= maxLength) return text
		return text.substring(0, maxLength) + '...'
	}

	// 渲染segment卡片
	const renderSegmentCard = (segment: Segment, key?: string) => {
		return (
			<div key={key || segment.id} className={styles.chunkCard} onClick={() => handleOpenDetail(segment)}>
				<div className={styles.cardHeader}>
					<div className={styles.chunkMeta}>
						<span className={styles.chunkNumber}>#{segment.id}</span>
						<span className={styles.textLength}>{segment.text.length}</span>
					</div>
					<div className={styles.weightRecall}>
						{segment.weight !== undefined && (
							<span className={styles.weight}>
								{is_cn ? '权重' : 'Weight'}: {segment.weight.toFixed(1)}
							</span>
						)}
						{segment.score !== undefined && (
							<span className={styles.recall}>
								{is_cn ? '评分' : 'Score'}: {segment.score.toFixed(2)}
							</span>
						)}
					</div>
				</div>

				<div className={styles.cardContent}>
					<p className={styles.chunkText}>{truncateText(segment.text)}</p>
				</div>

				<div className={styles.cardFooter}>
					<div className={styles.chunkInfo}>
						{segment.metadata && (
							<div className={styles.infoItem}>
								<Icon name='material-info' size={12} />
								<span>{is_cn ? '元数据' : 'Metadata'}</span>
							</div>
						)}
					</div>

					<div className={styles.voteActions}>
						<button
							className={styles.voteButton}
							onClick={(e) => {
								e.stopPropagation()
								handleVote(segment.id, 'up')
							}}
						>
							<Icon name='material-thumb_up' size={14} />
							<span>{segment.vote || 0}</span>
						</button>
					</div>
				</div>
			</div>
		)
	}

	// 渲染内容
	const renderContent = () => {
		if (loading) {
			return (
				<div className={styles.loadingContainer}>
					<Icon name='material-hourglass_empty' size={32} />
					<p>{is_cn ? '正在加载分段数据...' : 'Loading segments...'}</p>
				</div>
			)
		}

		if (data.length === 0) {
			return (
				<div className={styles.emptyState}>
					<Icon name='material-content_cut' size={48} />
					<p>{is_cn ? '暂无分段数据' : 'No segments available'}</p>
				</div>
			)
		}

		if (filteredSegments.length === 0) {
			return (
				<div className={styles.emptyState}>
					<Icon name='material-search_off' size={48} />
					<p>{is_cn ? '未找到匹配的分段' : 'No matching segments found'}</p>
				</div>
			)
		}

		return (
			<>
				<div className={styles.chunksGrid}>
					{filteredSegments.map((segment) => renderSegmentCard(segment, segment.id))}
				</div>

				{/* 不再需要单独的触发器，直接观察最后一个卡片 */}

				{/* 加载更多指示器 */}
				{loadingMore && (
					<div className={styles.loadingMore}>
						<Icon name='material-hourglass_empty' size={16} />
						<span>{is_cn ? '加载更多分段...' : 'Loading more segments...'}</span>
					</div>
				)}
			</>
		)
	}

	return (
		<div className={styles.panelContent}>
			<div className={styles.panelHeader}>
				<div className={styles.headerTitle}>
					<Icon name='material-list' size={14} />
					<h3>{is_cn ? '内容分段' : 'Content Segments'}</h3>
					{data.length > 0 && (
						<span className={styles.countBadge}>
							{data.length}
							{hasMore ? '+' : ''}
						</span>
					)}
				</div>
				<div className={styles.headerActions}>
					{viewMode === 'dual' ? (
						<Tooltip title={is_cn ? '最大化内容分段' : 'Maximize Content Segments'}>
							<Button
								type='text'
								size='small'
								icon={<Icon name='material-fullscreen' size={14} />}
								onClick={onHideLeftPanel}
								className={styles.headerButton}
							/>
						</Tooltip>
					) : viewMode === 'right' ? (
						<Tooltip title={is_cn ? '恢复双栏显示' : 'Restore Dual Panels'}>
							<Button
								type='text'
								size='small'
								icon={<Icon name='material-vertical_split' size={14} />}
								onClick={onRestoreDualPanels}
								className={styles.headerButton}
							/>
						</Tooltip>
					) : null}
				</div>
			</div>

			{/* 搜索器 */}
			<div className={styles.searchSection}>
				<div className={styles.searchWrapper}>
					<Input
						className={styles.searchInput}
						placeholder={is_cn ? '搜索分段内容...' : 'Search segments...'}
						prefix={<SearchOutlined />}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onKeyPress={handleKeyPress}
						allowClear
					/>
					<Select
						value={sortBy}
						onChange={(value) => {
							setSortBy(value)
							// 排序时重新加载数据
						}}
						size='small'
						className={styles.sortSelect}
						style={{ width: 120 }}
					>
						<Select.Option value='default'>{is_cn ? '默认排序' : 'Default'}</Select.Option>
						<Select.Option value='recall'>{is_cn ? '召回次数' : 'Recall Count'}</Select.Option>
						<Select.Option value='weight'>{is_cn ? '权重' : 'Weight'}</Select.Option>
						<Select.Option value='votes'>{is_cn ? '投票' : 'Votes'}</Select.Option>
					</Select>
					<Button
						type='primary'
						size='small'
						onClick={handleSearch}
						className={styles.searchButton}
					>
						{is_cn ? '搜索' : 'Search'}
					</Button>
				</div>
			</div>

			<div className={styles.scrollableContent}>{renderContent()}</div>

			{/* 详情模态窗口 */}
			<SegmentDetail visible={detailVisible} onClose={handleCloseDetail} segmentData={selectedSegment} />
		</div>
	)
}

export default Segments
