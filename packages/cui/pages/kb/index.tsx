import { useEffect, useRef, useState } from 'react'
import { Button, Input, Spin, message, Tooltip, Popconfirm } from 'antd'
import { SearchOutlined, DeleteOutlined } from '@ant-design/icons'
import { history, getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { CollectionCover } from './components'
import styles from './index.less'
import { KB, Collection } from '@/openapi'

const Collections = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [loading, setLoading] = useState(true)
	const [search, setSearch] = useState('')
	const [searchText, setSearchText] = useState('')
	const [page, setPage] = useState(1)
	const [data, setData] = useState<Collection[]>([])
	const containerRef = useRef<HTMLDivElement>(null)
	const [hasMore, setHasMore] = useState(false) // Disable pagination for now

	// 加载数据
	const loadData = async (reset = false) => {
		// 如果是重置加载（初始加载或搜索），则允许执行；否则检查 loading 状态
		if (!reset && loading) return

		if (!window.$app?.openapi) {
			console.error('OpenAPI not available')
			return
		}

		setLoading(true)
		try {
			const kb = new KB(window.$app.openapi)

			// Build filter for search
			const filter: Record<string, string> = {}
			if (searchText.trim()) {
				// Add search filter - this may need backend support
				filter.search = searchText.trim()
			}

			const response = await kb.GetCollections({ filter })

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to load collections')
			}

			// Use Collections directly
			let collections: Collection[] = []
			if (response.data) {
				collections = response.data

				// Client-side search filtering if backend doesn't support it
				if (searchText.trim()) {
					const keyword = searchText.toLowerCase()
					collections = collections.filter(
						(collection) =>
							collection.metadata.name?.toLowerCase().includes(keyword) ||
							collection.metadata.description?.toLowerCase().includes(keyword)
					)
				}
			}

			if (reset) {
				setData(collections)
			} else {
				setData((prevData) => [...prevData, ...collections])
			}

			// For now, assume no pagination until backend supports it
			setHasMore(false)
		} catch (error) {
			console.error(is_cn ? '加载集合失败:' : 'Failed to load collections:', error)
			message.error(is_cn ? '加载集合失败' : 'Failed to load collections')
		} finally {
			setLoading(false)
		}
	}

	// 处理滚动加载
	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		const handleScroll = () => {
			const { scrollTop, scrollHeight, clientHeight } = container
			if (scrollHeight - scrollTop - clientHeight < 50 && !loading && hasMore) {
				loadData()
			}
		}

		container.addEventListener('scroll', handleScroll)
		return () => container.removeEventListener('scroll', handleScroll)
	}, [loading, hasMore, data])

	// 初始加载和搜索变化时重新加载
	useEffect(() => {
		setData([])
		setPage(1)
		setHasMore(true)
		loadData(true)
	}, [searchText])

	const handleSearch = () => {
		setSearchText(search)
	}

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleSearch()
		}
	}

	const handleCardClick = (collection: Collection) => {
		history.push(`/kb/detail/${collection.id}`)
	}

	const handleCreate = () => {
		history.push('/kb/create')
	}

	const handleDelete = async (collection: Collection) => {
		if (!window.$app?.openapi) {
			console.error('OpenAPI not available')
			message.error(is_cn ? '系统未就绪' : 'System not ready')
			return
		}

		try {
			const kb = new KB(window.$app.openapi)
			const response = await kb.RemoveCollection(collection.id)

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to delete collection')
			}

			// Remove from local state
			setData((prevData) => prevData.filter((item) => item.id !== collection.id))
			message.success(is_cn ? '删除成功' : 'Deleted successfully')
		} catch (error) {
			console.error('Delete failed:', error)
			const errorMsg = error instanceof Error ? error.message : is_cn ? '删除失败' : 'Delete failed'
			message.error(errorMsg)
		}
	}

	// 渲染集合卡片
	const renderCollectionCard = (collection: Collection) => {
		return (
			<div key={collection.id} className={styles.gridItem}>
				<div className={styles.knowledgeCard} onClick={() => handleCardClick(collection)}>
					<CollectionCover
						cover={collection.metadata.cover}
						name={collection.metadata.name}
						description={collection.metadata.description}
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
										{collection.metadata.name || 'Untitled'}
									</h3>
								</div>
							</div>
							<div className={styles.cardHeaderRight}>
								<div className={styles.statusIcons}>
									{collection.metadata.__yao_public_read && (
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
									{collection.metadata.readonly && (
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
									{collection.metadata.system && (
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
								</div>
							</div>
						</div>

						<div className={styles.cardFooter}>
							<div className={styles.documentCount}>
								<Icon name='material-description' size={16} />
								<span>
									{collection.metadata.document_count || 0}{' '}
									{is_cn ? '个文档' : 'documents'}
								</span>
							</div>
							<div className={styles.updateTime}>
								{is_cn ? '更新于' : 'Updated'}{' '}
								{new Date(
									collection.metadata.updated_at || new Date()
								).toLocaleDateString()}
							</div>
							{/* 只有非只读的集合才显示删除按钮 */}
							{!collection.metadata.readonly && (
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
						onChange={(e) => setSearch(e.target.value)}
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
							{searchText
								? is_cn
									? '未找到匹配的集合'
									: 'No matching collections found'
								: is_cn
								? '暂无集合'
								: 'No collections'}
						</div>
						<div className={styles.emptyDescription}>
							{searchText
								? is_cn
									? '尝试调整搜索关键词'
									: 'Try adjusting your search keywords'
								: is_cn
								? '创建您的第一个集合开始吧'
								: 'Create your first collection to get started'}
						</div>
					</div>
				) : (
					<div className={styles.grid}>{data.map(renderCollectionCard)}</div>
				)}

				{loading && (
					<div className={styles.loading}>
						<Spin />
						<span style={{ marginLeft: 8 }}>{is_cn ? '加载中...' : 'Loading...'}</span>
					</div>
				)}
			</div>
		</div>
	)
}

export default Collections
