import React, { useState, useEffect } from 'react'
import { Button, Tooltip, Input, message, Select } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { KB } from '@/openapi'
import { Segment, ListSegmentsRequest } from '@/openapi/kb/types'
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
	const [sortBy, setSortBy] = useState<string>('default')
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize, setPageSize] = useState(12)
	const [detailVisible, setDetailVisible] = useState(false)
	const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null)
	const [total, setTotal] = useState(0)
	const [hasMore, setHasMore] = useState(false)

	// 根据文档ID加载segments数据
	useEffect(() => {
		const loadSegments = async () => {
			if (!window.$app?.openapi) {
				console.error('OpenAPI not available')
				message.error(is_cn ? '系统未就绪' : 'System not ready')
				return
			}

			try {
				setLoading(true)

				// 构建API请求参数
				const request: ListSegmentsRequest = {
					limit: pageSize,
					offset: (currentPage - 1) * pageSize,
					include_metadata: true,
					include_nodes: false,
					include_relationships: false
				}

				// 添加排序参数
				if (sortBy !== 'default') {
					switch (sortBy) {
						case 'recall':
							request.order_by = 'recall_count desc'
							break
						case 'weight':
							request.order_by = 'weight desc'
							break
						case 'votes':
							request.order_by = 'vote desc'
							break
					}
				}

				// 调用API获取segments数据
				const kb = new KB(window.$app.openapi)
				const response = await kb.ListSegments(docid, request)

				if (window.$app.openapi.IsError(response)) {
					throw new Error(response.error?.error_description || 'Failed to fetch segments')
				}

				if (response.data) {
					setData(response.data.segments || [])
					setTotal(response.data.total || 0)
					setHasMore(response.data.has_more || false)
				}
			} catch (error: any) {
				console.error('Failed to load segments:', error)
				message.error(is_cn ? '加载分段数据失败' : 'Failed to load segments')
				setData([])
				setTotal(0)
				setHasMore(false)
			} finally {
				setLoading(false)
			}
		}

		if (docid) {
			loadSegments()
		}
	}, [docid, collectionId, currentPage, pageSize, sortBy, is_cn])

	// 搜索处理
	const handleSearch = () => {
		setSearchText(search)
		setCurrentPage(1) // 搜索时重置到第一页
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

	// 处理分页变化
	const handlePageChange = (page: number) => {
		setCurrentPage(page)
	}

	const handlePageSizeChange = (size: number) => {
		setPageSize(size)
		setCurrentPage(1) // 改变每页条数时重置到第一页
	}

	// 计算总页数 (基于API返回的总数)
	const totalPages = Math.ceil(total / pageSize)

	// 生成页码数组
	const getPageNumbers = () => {
		const pages: number[] = []
		const maxPagesToShow = 5

		if (totalPages <= maxPagesToShow) {
			// 总页数不超过5页，显示所有页码
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i)
			}
		} else {
			// 总页数超过5页，智能显示页码
			if (currentPage <= 3) {
				// 当前页在前3页，显示 1,2,3,4,5
				for (let i = 1; i <= 5; i++) {
					pages.push(i)
				}
			} else if (currentPage >= totalPages - 2) {
				// 当前页在后3页，显示后5页
				for (let i = totalPages - 4; i <= totalPages; i++) {
					pages.push(i)
				}
			} else {
				// 当前页在中间，显示当前页前后2页
				for (let i = currentPage - 2; i <= currentPage + 2; i++) {
					pages.push(i)
				}
			}
		}

		return pages
	}

	// 截取文本显示
	const truncateText = (text: string, maxLength: number = 150) => {
		if (text.length <= maxLength) return text
		return text.substring(0, maxLength) + '...'
	}

	// 渲染segment卡片
	const renderSegmentCard = (segment: Segment) => {
		return (
			<div key={segment.id} className={styles.chunkCard} onClick={() => handleOpenDetail(segment)}>
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
				<div className={styles.chunksGrid}>{filteredSegments.map(renderSegmentCard)}</div>
				{totalPages > 1 && (
					<div className={styles.paginationContainer}>
						{/* 分页控件 */}
						<div className={styles.paginationControls}>
							{/* 上一页 */}
							<Button
								size='small'
								disabled={currentPage === 1}
								onClick={() => handlePageChange(currentPage - 1)}
								className={styles.paginationButton}
							>
								<Icon name='material-chevron_left' size={14} />
							</Button>

							{/* 页码 */}
							{getPageNumbers().map((pageNum) => (
								<Button
									key={pageNum}
									size='small'
									type={currentPage === pageNum ? 'primary' : 'default'}
									onClick={() => handlePageChange(pageNum)}
									className={styles.paginationButton}
								>
									{pageNum}
								</Button>
							))}

							{/* 下一页 */}
							<Button
								size='small'
								disabled={currentPage === totalPages}
								onClick={() => handlePageChange(currentPage + 1)}
								className={styles.paginationButton}
							>
								<Icon name='material-chevron_right' size={14} />
							</Button>
						</div>
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
					{total > 0 && (
						<span className={styles.countBadge}>
							{data.length}/{total}
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
							setCurrentPage(1) // 排序时重置到第一页
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
