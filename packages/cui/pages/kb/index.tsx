import { useEffect, useRef, useState } from 'react'
import { Button, Input, Spin, message, Tooltip, Popconfirm } from 'antd'
import { SearchOutlined, DeleteOutlined } from '@ant-design/icons'
import { history, getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { CollectionCover } from './components'
import styles from './index.less'
import { KB, DatabaseCollection, ListCollectionsRequest } from '@/openapi'

const Collections = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [loading, setLoading] = useState(true)
	const [search, setSearch] = useState('')
	const [searchKeywords, setSearchKeywords] = useState('') // 实际用于搜索的关键词
	const [sortBy, setSortBy] = useState('created_at desc') // 排序方式
	const [data, setData] = useState<DatabaseCollection[]>([])
	const containerRef = useRef<HTMLDivElement>(null)

	// 分页状态
	const [currentPage, setCurrentPage] = useState(1)
	const [totalCollections, setTotalCollections] = useState(0)
	const [pageSize] = useState(20)
	const [hasMore, setHasMore] = useState(true)
	const [loadingMore, setLoadingMore] = useState(false)

	// 加载数据 - 初始加载
	const loadData = async () => {
		if (!window.$app?.openapi) {
			console.error('OpenAPI not available')
			return
		}

		try {
			setLoading(true)
			const kb = new KB(window.$app.openapi)

			const request: ListCollectionsRequest = {
				sort: sortBy,
				page: 1,
				pagesize: pageSize,
				...(searchKeywords && { keywords: searchKeywords })
			}

			const response = await kb.ListCollections(request)

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to load collections')
			}

			const collections = Array.isArray(response.data?.data) ? response.data.data : []
			const total = typeof response.data?.total === 'number' ? response.data.total : 0

			// 重新加载模式：替换数据
			setData(collections)
			setCurrentPage(1)
			setTotalCollections(total)

			// 检查是否还有更多数据
			setHasMore(collections.length < total)
		} catch (error) {
			console.error(is_cn ? '加载集合失败:' : 'Failed to load collections:', error)
			message.error(is_cn ? '加载集合失败' : 'Failed to load collections')
		} finally {
			setLoading(false)
		}
	}

	// 加载更多数据
	const loadMoreData = async () => {
		if (!hasMore || loadingMore) return

		const nextPage = currentPage + 1
		setCurrentPage(nextPage)

		try {
			setLoadingMore(true)
			const kb = new KB(window.$app.openapi)

			const request: ListCollectionsRequest = {
				sort: sortBy,
				page: nextPage,
				pagesize: pageSize,
				...(searchKeywords && { keywords: searchKeywords })
			}

			const response = await kb.ListCollections(request)

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to load collections')
			}

			const collections = Array.isArray(response.data?.data) ? response.data.data : []
			const total = typeof response.data?.total === 'number' ? response.data.total : 0

			// 追加数据
			setData((prev) => (Array.isArray(prev) ? [...prev, ...collections] : collections))
			setTotalCollections(total)

			// 检查是否还有更多数据
			const loadedCount = data.length + collections.length
			setHasMore(loadedCount < total)
		} catch (error) {
			console.error('Load more collections failed:', error)
			message.error(is_cn ? '加载更多集合失败' : 'Failed to load more collections')
		} finally {
			setLoadingMore(false)
		}
	}

	// 处理滚动加载
	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		const handleScroll = () => {
			const { scrollTop, scrollHeight, clientHeight } = container
			if (scrollHeight - scrollTop - clientHeight < 50 && !loadingMore && hasMore) {
				loadMoreData()
			}
		}

		container.addEventListener('scroll', handleScroll)
		return () => container.removeEventListener('scroll', handleScroll)
	}, [loadingMore, hasMore, data])

	// 初始加载
	useEffect(() => {
		loadData()

		// 刷新运行中的Jobs数量，确保Header显示一致
		window.$app?.Event?.emit('app/refreshJobsCount')
	}, [])

	// 搜索关键词或排序变化时重新加载数据
	useEffect(() => {
		loadData()
	}, [searchKeywords, sortBy])

	const handleSearch = () => {
		setSearchKeywords(search.trim())
	}

	const handleClearSearch = () => {
		setSearch('')
		setSearchKeywords('')
	}

	const handleSortChange = (newSort: string) => {
		setSortBy(newSort)
	}

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleSearch()
		}
	}

	const handleCardClick = (collection: DatabaseCollection) => {
		if (collection?.collection_id) {
			history.push(`/kb/detail/${collection.collection_id}`)
		} else {
			console.error('Collection ID is missing:', collection)
			message.error(is_cn ? '集合信息异常' : 'Collection information error')
		}
	}

	const handleCreate = () => {
		history.push('/kb/create')
	}

	const handleDelete = async (collection: DatabaseCollection) => {
		if (!window.$app?.openapi) {
			console.error('OpenAPI not available')
			message.error(is_cn ? '系统未就绪' : 'System not ready')
			return
		}

		try {
			const kb = new KB(window.$app.openapi)
			const response = await kb.RemoveCollection(collection.collection_id)

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to delete collection')
			}

			// Remove from local state
			setData((prevData) => prevData.filter((item) => item.collection_id !== collection.collection_id))
			message.success(is_cn ? '删除成功' : 'Deleted successfully')
		} catch (error) {
			console.error('Delete failed:', error)
			const errorMsg = error instanceof Error ? error.message : is_cn ? '删除失败' : 'Delete failed'
			message.error(errorMsg)
		}
	}

	// 渲染集合卡片
	const renderCollectionCard = (collection: DatabaseCollection) => {
		return (
			<div key={collection.collection_id} className={styles.gridItem}>
				<div className={styles.knowledgeCard} onClick={() => handleCardClick(collection)}>
					<CollectionCover
						cover={collection.cover}
						name={collection.name}
						description={collection.description}
						className={styles.cardCover}
					/>

					<div className={styles.cardContent}>
						<div className={styles.cardHeader}>
							<div className={styles.cardHeaderLeft}>
								<div className={styles.cardTitleWithIcon}>
									<Icon
										name='material-book_4'
										size={18}
										style={{ color: 'var(--color_text)' }}
									/>
									<h3 className={styles.cardTitle}>
										{collection.name || 'Untitled'}
									</h3>
								</div>
							</div>
							<div className={styles.cardHeaderRight}>
								<div className={styles.statusIcons}>
									{Boolean(collection.__yao_public_read) && (
										<Tooltip title={is_cn ? '公开' : 'Public'}>
											<span className={styles.statusIcon}>
												<Icon
													name='material-public'
													size={16}
													color='#52c41a'
												/>
											</span>
										</Tooltip>
									)}
									{Boolean(collection.system) && (
										<Tooltip title={is_cn ? '系统内建' : 'Built-in'}>
											<span className={styles.statusIcon}>
												<Icon
													name='material-verified'
													size={16}
													color='#b37feb'
												/>
											</span>
										</Tooltip>
									)}
									{Boolean(collection.readonly) && (
										<Tooltip title={is_cn ? '只读' : 'Readonly'}>
											<span className={styles.statusIcon}>
												<Icon
													name='material-lock'
													size={16}
													color='#faad14'
												/>
											</span>
										</Tooltip>
									)}
								</div>
							</div>
						</div>

						<div className={styles.cardFooter}>
							<div className={styles.documentCount}>
								<Icon name='material-description' size={16} />
								<span>
									{collection.document_count || 0} {is_cn ? '个文档' : 'documents'}
								</span>
							</div>
							<div className={styles.updateTime}>
								{is_cn ? '更新于' : 'Updated'}{' '}
								{new Date(collection.updated_at || new Date()).toLocaleDateString()}
							</div>
							{/* 只读集合不显示删除按钮 */}
							{!collection.readonly && (
								<Popconfirm
									title={
										is_cn
											? '确定要删除这个集合吗？删除后将无法恢复！'
											: 'Are you sure to delete this collection? This action cannot be undone!'
									}
									onConfirm={(e) => {
										e?.stopPropagation()
										handleDelete(collection)
									}}
									onCancel={(e) => e?.stopPropagation()}
									okText={is_cn ? '确认' : 'Confirm'}
									cancelText={is_cn ? '取消' : 'Cancel'}
								>
									<div
										className={styles.deleteBtn}
										onClick={(e) => e.stopPropagation()}
										title={is_cn ? '删除' : 'Delete'}
									>
										<DeleteOutlined />
									</div>
								</Popconfirm>
							)}
						</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<div className={styles.titleContainer}>
					<div className={styles.titleWithIcon}>
						<Icon
							name='material-library_books'
							size={24}
							style={{ color: 'var(--color_page_title)' }}
						/>
						<h1 className={styles.title}>{is_cn ? '集合' : 'Collections'}</h1>
					</div>
					<div className={styles.createIcon} onClick={handleCreate}>
						<Icon name='material-add' size={24} />
						<span className={styles.createText}>{is_cn ? '创建' : 'Create'}</span>
					</div>
				</div>
				<div className={styles.searchWrapper}>
					<Input
						size='large'
						prefix={<SearchOutlined />}
						placeholder={is_cn ? '搜索集合...' : 'Search collections...'}
						value={search}
						onChange={(e) => {
							const value = e.target.value
							setSearch(value)
							if (!value) {
								handleClearSearch()
							}
						}}
						onKeyPress={handleKeyPress}
						className={styles.search}
						allowClear
					/>
					<Button type='primary' size='large' onClick={handleSearch}>
						{is_cn ? '搜索' : 'Search'}
					</Button>
				</div>
			</div>

			<div className={styles.content} ref={containerRef}>
				{data.length === 0 && !loading ? (
					<div className={styles.empty}>
						<Icon name='material-folder_off' size={64} />
						<div className={styles.emptyTitle}>
							{searchKeywords
								? is_cn
									? '未找到匹配的集合'
									: 'No matching collections found'
								: is_cn
								? '暂无集合'
								: 'No collections'}
						</div>
						<div className={styles.emptyDescription}>
							{searchKeywords
								? is_cn
									? '尝试调整搜索关键词'
									: 'Try adjusting your search keywords'
								: is_cn
								? '创建您的第一个集合开始吧'
								: 'Create your first collection to get started'}
						</div>
					</div>
				) : (
					<div className={styles.grid}>
						{Array.isArray(data) ? data.map(renderCollectionCard) : null}
					</div>
				)}

				{/* 加载更多指示器 */}
				{loadingMore && (
					<div className={styles.loading}>
						<Spin />
						<span style={{ marginLeft: 8 }}>
							{is_cn ? '加载更多集合...' : 'Loading more collections...'}
						</span>
					</div>
				)}

				{/* 初始加载指示器 */}
				{loading && data.length === 0 && (
					<div className={styles.loading}>
						<Spin />
						<span style={{ marginLeft: 8 }}>{is_cn ? '加载中...' : 'Loading...'}</span>
					</div>
				)}

				{/* 没有更多数据的提示 */}
				{!hasMore && data.length > 0 && (
					<div className={styles.loading}>
						<span>{is_cn ? '已加载全部集合' : 'All collections loaded'}</span>
					</div>
				)}
			</div>
		</div>
	)
}

export default Collections
