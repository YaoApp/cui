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
	document?: any // 文档对象，包含状态信息
}

const Segments: React.FC<SegmentsProps> = ({
	viewMode,
	onHideLeftPanel,
	onRestoreDualPanels,
	docid,
	collectionId,
	document
}) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const [data, setData] = useState<Segment[]>([])
	const [search, setSearch] = useState('')
	const [searchText, setSearchText] = useState('')
	const [loading, setLoading] = useState(true)
	const [loadingMore, setLoadingMore] = useState(false)
	const [sortBy, setSortBy] = useState<string>('default')
	const [filterByDepth, setFilterByDepth] = useState<string>('all')
	const [limit] = useState(500) // 每次加载的数量
	const [scrollId, setScrollId] = useState<string>('')
	const [detailVisible, setDetailVisible] = useState(false)
	const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null)
	const [hasMore, setHasMore] = useState(false)

	// 文档状态相关状态
	const [currentDocument, setCurrentDocument] = useState(document)
	const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false)
	const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null)

	// 使用 ref 来防止重复请求和跟踪最新的 scrollId
	const isLoadingRef = useRef(false)
	const scrollIdRef = useRef<string>('')

	// 检查是否为处理中状态
	const isProcessing = (status?: string) => {
		return (
			status === 'pending' ||
			status === 'converting' ||
			status === 'chunking' ||
			status === 'extracting' ||
			status === 'embedding' ||
			status === 'storing'
		)
	}

	// 获取文档详情
	const loadDocumentStatus = async () => {
		try {
			if (!window.$app?.openapi) return

			const kb = new KB(window.$app.openapi)
			const response = await kb.GetDocument(docid)

			if (window.$app.openapi.IsError(response)) {
				console.error('Failed to load document status:', response.error)
				return
			}

			const updatedDocument = response.data
			setCurrentDocument(updatedDocument)

			// 如果文档状态变为完成，停止自动刷新并加载分段
			if (updatedDocument?.status === 'completed' && isProcessing(currentDocument?.status)) {
				console.log('Document processing completed, stopping auto refresh')
				stopAutoRefresh()
				loadSegments(true) // 重新加载分段数据
			}

			return updatedDocument
		} catch (error) {
			console.error('Load document status failed:', error)
		}
	}

	// 启动自动刷新
	const startAutoRefresh = () => {
		if (autoRefreshTimerRef.current) {
			clearInterval(autoRefreshTimerRef.current)
		}

		autoRefreshTimerRef.current = setInterval(() => {
			console.log('Auto refreshing document status...')
			loadDocumentStatus()
		}, 15000) // 15秒刷新一次

		setAutoRefreshEnabled(true)
	}

	// 停止自动刷新
	const stopAutoRefresh = () => {
		if (autoRefreshTimerRef.current) {
			clearInterval(autoRefreshTimerRef.current)
			autoRefreshTimerRef.current = null
		}
		setAutoRefreshEnabled(false)
	}

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

			// 后端排序功能暂时不支持，在前端实现排序

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
	}, [docid, collectionId]) // 移除 sortBy 依赖，排序在前端处理

	// Intersection Observer 监听滚动触发器
	useEffect(() => {
		// 只在没有搜索且为默认排序时启用无限滚动
		// 前端排序/过滤时禁用无限滚动，因为只对已加载数据有效
		if (
			!hasMore ||
			loadingMore ||
			data.length === 0 ||
			searchText.trim() ||
			sortBy !== 'default' ||
			filterByDepth !== 'all'
		) {
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
	}, [hasMore, loadingMore, searchText, data.length, sortBy, filterByDepth]) // 添加排序和过滤依赖，确保条件变化时重新评估无限滚动

	// 文档状态初始化和自动刷新
	useEffect(() => {
		// 更新当前文档状态
		setCurrentDocument(document)

		// 如果文档处于处理中状态，启动自动刷新
		if (document && isProcessing(document.status)) {
			console.log('Document is processing, starting auto refresh')
			startAutoRefresh()
		} else {
			// 如果文档已完成或不是处理状态，停止自动刷新
			stopAutoRefresh()
		}
	}, [document])

	// 组件卸载时清理定时器
	useEffect(() => {
		return () => {
			if (autoRefreshTimerRef.current) {
				clearInterval(autoRefreshTimerRef.current)
			}
		}
	}, [])

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
	const handleVote = (segmentId: string, type: 'good' | 'bad') => {
		// TODO: 实现真实的投票API调用
		setData((prevData) =>
			prevData.map((segment) =>
				segment.id === segmentId
					? {
							...segment,
							metadata: {
								...segment.metadata,
								[type === 'good' ? 'vote_good' : 'vote_bad']:
									((segment.metadata?.[
										type === 'good' ? 'vote_good' : 'vote_bad'
									] as number) || 0) + 1
							}
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

	// 过滤和排序segments (搜索、层级过滤和排序都在前端进行)
	const getFilteredSegments = () => {
		let segments = data

		// 搜索过滤
		if (searchText.trim()) {
			const keyword = searchText.toLowerCase()
			segments = segments.filter(
				(segment) =>
					segment.text.toLowerCase().includes(keyword) ||
					(segment.metadata && JSON.stringify(segment.metadata).toLowerCase().includes(keyword))
			)
		}

		// 层级过滤
		if (filterByDepth !== 'all') {
			const targetDepth = parseInt(filterByDepth)
			segments = segments.filter((segment) => segment.metadata?.chunk_details?.depth === targetDepth)
		}

		// 前端排序
		if (sortBy !== 'default') {
			segments = [...segments].sort((a, b) => {
				switch (sortBy) {
					case 'hit':
						// 按命中次数排序 (假设存储在 metadata 中)
						const hitA = (a.metadata?.hit_count as number) || 0
						const hitB = (b.metadata?.hit_count as number) || 0
						return hitB - hitA // 降序
					case 'weight':
						// 按权重排序
						const weightA = a.weight || 0
						const weightB = b.weight || 0
						return weightB - weightA // 降序
					case 'votes_good':
						// 按好评数排序
						const voteGoodA = (a.metadata?.vote_good as number) || 0
						const voteGoodB = (b.metadata?.vote_good as number) || 0
						return voteGoodB - voteGoodA // 降序
					case 'votes_bad':
						// 按差评数排序
						const voteBadA = (a.metadata?.vote_bad as number) || 0
						const voteBadB = (b.metadata?.vote_bad as number) || 0
						return voteBadB - voteBadA // 降序
					case 'structure':
						// 按文档结构排序：先按 depth (1, 2, 3...)，再按 index (0, 1, 2...)
						const depthA =
							a.metadata?.chunk_details?.depth !== undefined
								? (a.metadata.chunk_details.depth as number)
								: 999
						const depthB =
							b.metadata?.chunk_details?.depth !== undefined
								? (b.metadata.chunk_details.depth as number)
								: 999
						const indexA =
							a.metadata?.chunk_details?.index !== undefined
								? (a.metadata.chunk_details.index as number)
								: 999
						const indexB =
							b.metadata?.chunk_details?.index !== undefined
								? (b.metadata.chunk_details.index as number)
								: 999

						// 先按深度升序排序
						if (depthA !== depthB) {
							return depthA - depthB
						}
						// 深度相同时按索引升序排序
						return indexA - indexB
					default:
						return 0
				}
			})
		}

		return segments
	}

	const filteredSegments = getFilteredSegments()

	// 渲染分段位置信息的独立模块
	const renderSegmentPosition = (chunkDetails: any) => {
		if (!chunkDetails) return null

		// 优先检查是否有 text_position，有则按 text 类型处理
		if (chunkDetails.text_position) {
			const { start_line, end_line, start_index, end_index } = chunkDetails.text_position
			const length = end_index - start_index
			return (
				<span
					style={{
						fontSize: '10px',
						color: '#999',
						display: 'flex',
						alignItems: 'center',
						gap: '2px'
					}}
				>
					<Icon name='material-location_on' size={10} />
					{is_cn ? '行' : 'Lines'}:{' '}
					{start_line === end_line ? start_line : `${start_line}~${end_line}`}
					<span style={{ marginLeft: '6px' }}>
						{is_cn ? '长度' : 'Length'}: {length}
					</span>
				</span>
			)
		}

		// 其他类型的处理
		const { type } = chunkDetails
		if (type && type !== 'text') {
			return (
				<span style={{ fontSize: '12px', color: '#999' }}>
					{is_cn ? '类型' : 'Type'}: {type}
				</span>
			)
		}

		return null
	}

	// 截取文本显示 - 确保显示固定行数
	const truncateText = (text: string, maxLines: number = 3) => {
		// 估算每行大约50个字符（根据实际卡片宽度调整）
		const charactersPerLine = 50
		const maxLength = maxLines * charactersPerLine

		if (text.length <= maxLength) {
			// 如果文本较短，用换行符补齐到3行的高度
			const lines = text.split('\n')
			if (lines.length < maxLines) {
				// 添加空行来保持一致的高度
				return text + '\n'.repeat(maxLines - lines.length)
			}
			return text
		}
		return text.substring(0, maxLength) + '...'
	}

	// 渲染segment卡片
	const renderSegmentCard = (segment: Segment, key?: string) => {
		return (
			<div key={key || segment.id} className={styles.chunkCard} onClick={() => handleOpenDetail(segment)}>
				<div className={styles.cardHeader}>
					<div className={styles.chunkMeta}>
						<span
							className={styles.chunkNumber}
							style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
						>
							{segment.metadata?.chunk_details?.depth !== undefined &&
							segment.metadata?.chunk_details?.index !== undefined ? (
								<>
									<span
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '2px'
										}}
									>
										<Icon name='material-account_tree' size={10} />
										{segment.metadata.chunk_details.depth}
									</span>
									<span>#{segment.metadata.chunk_details.index + 1}</span>
								</>
							) : (
								`#${segment.id.slice(-8)}`
							)}
						</span>
					</div>
					<div className={styles.metaInfo}>
						<span className={styles.metaItem}>
							{is_cn ? '权重' : 'Weight'}{' '}
							<span className={styles.metaNumber}>
								{segment.weight?.toFixed(1) || '0.0'}
							</span>
						</span>
						<span className={styles.metaItem}>
							{is_cn ? '评分' : 'Score'}{' '}
							<span className={styles.metaNumber}>
								{segment.score?.toFixed(2) || '0.00'}
							</span>
						</span>
						<span className={styles.metaItem}>
							{is_cn ? '命中' : 'Hits'}{' '}
							<span className={styles.metaNumber}>{segment.metadata?.hit_count || 0}</span>
						</span>
					</div>
				</div>

				<div className={styles.cardContent}>
					<p
						className={styles.chunkText}
						style={{
							display: '-webkit-box',
							WebkitBoxOrient: 'vertical',
							WebkitLineClamp: 3,
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							lineHeight: '1.4',
							minHeight: '4.2em', // 3行 × 1.4行高 = 4.2em
							maxHeight: '4.2em'
						}}
					>
						{segment.text}
					</p>
				</div>

				<div className={styles.cardFooter}>
					<div className={styles.chunkInfo}>
						{segment.metadata?.chunk_details &&
							renderSegmentPosition(segment.metadata.chunk_details) && (
								<div className={styles.infoItem}>
									{renderSegmentPosition(segment.metadata.chunk_details)}
								</div>
							)}
					</div>

					<div className={styles.voteActions}>
						<button
							className={styles.voteButton}
							onClick={(e) => {
								e.stopPropagation()
								handleVote(segment.id, 'good')
							}}
						>
							<Icon name='material-thumb_up' size={14} />
							<span>{segment.metadata?.vote_good || 0}</span>
						</button>
						<button
							className={styles.voteButton}
							onClick={(e) => {
								e.stopPropagation()
								handleVote(segment.id, 'bad')
							}}
						>
							<Icon name='material-thumb_down' size={14} />
							<span>{segment.metadata?.vote_bad || 0}</span>
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

			{/* 搜索器 - 处理中状态时隐藏 */}
			{!(
				currentDocument &&
				(isProcessing(currentDocument.status) || currentDocument.status === 'error')
			) && (
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
							value={filterByDepth}
							onChange={(value) => {
								setFilterByDepth(value)
								// 选择特定层级时自动切换到文档结构排序
								if (value !== 'all') {
									setSortBy('structure')
								}
							}}
							size='small'
							className={styles.sortSelect}
							style={{ width: 120 }}
						>
							<Select.Option value='all'>{is_cn ? '全部层级' : 'All Levels'}</Select.Option>
							<Select.Option value='1'>{is_cn ? '第1层' : 'Level 1'}</Select.Option>
							<Select.Option value='2'>{is_cn ? '第2层' : 'Level 2'}</Select.Option>
							<Select.Option value='3'>{is_cn ? '第3层' : 'Level 3'}</Select.Option>
						</Select>
						<Select
							value={sortBy}
							onChange={(value) => {
								setSortBy(value)
								// 切换回默认排序时，同时重置层级过滤，恢复无限滚动
								if (value === 'default') {
									setFilterByDepth('all')
								}
							}}
							size='small'
							className={styles.sortSelect}
							style={{ width: 180 }}
						>
							<Select.Option value='default'>
								{is_cn ? '默认排序' : 'Default'}
							</Select.Option>
							<Select.Option value='structure'>
								{is_cn ? '文档结构' : 'Document Structure'}
							</Select.Option>
							<Select.Option value='hit'>{is_cn ? '最多命中' : 'Most Hits'}</Select.Option>
							<Select.Option value='weight'>
								{is_cn ? '最高权重' : 'Highest Weight'}
							</Select.Option>
							<Select.Option value='votes_good'>
								{is_cn ? '好评优先' : 'Good Votes First'}
							</Select.Option>
							<Select.Option value='votes_bad'>
								{is_cn ? '差评优先' : 'Bad Votes First'}
							</Select.Option>
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
			)}

			<div className={styles.scrollableContent}>
				{/* 处理中状态覆盖层 */}
				{currentDocument && isProcessing(currentDocument.status) && (
					<div className={styles.processingContainer}>
						<Icon name='material-psychology' size={48} />
						<span className={styles.processingText}>
							{is_cn ? '智能处理中...' : 'Processing...'}
						</span>
					</div>
				)}

				{/* 错误状态覆盖层 */}
				{currentDocument && currentDocument.status === 'error' && (
					<div className={`${styles.processingContainer} ${styles.errorState}`}>
						<Icon name='material-error_outline' size={48} />
						<div className={styles.errorMessage}>
							{currentDocument.error_message || (is_cn ? '处理失败' : 'Processing failed')}
						</div>
					</div>
				)}

				{/* 正常内容 */}
				{renderContent()}
			</div>

			{/* 详情模态窗口 */}
			<SegmentDetail visible={detailVisible} onClose={handleCloseDetail} segmentData={selectedSegment} />
		</div>
	)
}

export default Segments
