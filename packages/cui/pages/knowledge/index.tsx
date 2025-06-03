import { useEffect, useRef, useState } from 'react'
import { Button, Input, Spin, message, Tooltip } from 'antd'
import { SearchOutlined, DeleteOutlined } from '@ant-design/icons'
import { history, getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import styles from './index.less'

// 知识库数据类型
interface KnowledgeBase {
	id: string
	collection_id: string
	name: string
	description: string
	uid: string
	public: boolean
	scope?: any
	readonly: boolean
	option?: any
	system: boolean
	sort: number
	cover: string
	document_count: number // 文档数量
	created_at: string
	updated_at: string
}

// 模拟请求延迟
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// 模拟数据
const mockKnowledgeBases: KnowledgeBase[] = [
	{
		id: '1',
		collection_id: 'kb_001',
		name: 'AI技术资料库',
		description: '收集了关于人工智能、机器学习、深度学习等相关技术文档和研究论文',
		uid: 'user123',
		public: true,
		readonly: false,
		system: false,
		sort: 1,
		cover: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop',
		document_count: 128,
		created_at: '2024-01-15T10:30:00Z',
		updated_at: '2024-01-20T14:22:00Z'
	},
	{
		id: '2',
		collection_id: 'kb_002',
		name: '产品设计指南',
		description: '产品设计相关的最佳实践、用户体验设计原则和案例分析',
		uid: 'user456',
		public: false,
		readonly: false,
		system: false,
		sort: 2,
		cover: 'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=400&h=200&fit=crop',
		document_count: 67,
		created_at: '2024-01-10T09:15:00Z',
		updated_at: '2024-01-18T16:45:00Z'
	},
	{
		id: '3',
		collection_id: 'kb_003',
		name: '法律法规文档',
		description: '企业运营相关的法律法规、合规要求和政策解读文档',
		uid: 'user789',
		public: true,
		readonly: true,
		system: true,
		sort: 3,
		cover: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=200&fit=crop',
		document_count: 245,
		created_at: '2024-01-05T11:20:00Z',
		updated_at: '2024-01-19T13:10:00Z'
	},
	{
		id: '4',
		collection_id: 'kb_004',
		name: '技术开发手册',
		description: '前端、后端开发技术栈文档、最佳实践和代码规范',
		uid: 'user101',
		public: false,
		readonly: false,
		system: false,
		sort: 4,
		cover: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop',
		document_count: 89,
		created_at: '2024-01-12T15:30:00Z',
		updated_at: '2024-01-21T09:55:00Z'
	},
	{
		id: '5',
		collection_id: 'kb_005',
		name: '市场分析报告',
		description: '行业趋势分析、竞品调研、市场数据统计和商业洞察',
		uid: 'user202',
		public: true,
		readonly: false,
		system: false,
		sort: 5,
		cover: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop',
		document_count: 156,
		created_at: '2024-01-08T14:45:00Z',
		updated_at: '2024-01-17T11:30:00Z'
	}
]

// 模拟API请求
const mockFetchKnowledgeBases = async (searchText = '', page = 1, pageSize = 12): Promise<KnowledgeBase[]> => {
	await delay(300) // 模拟300ms延迟

	let filteredData = mockKnowledgeBases

	if (searchText.trim()) {
		const keyword = searchText.toLowerCase()
		filteredData = mockKnowledgeBases.filter(
			(kb) => kb.name.toLowerCase().includes(keyword) || kb.description.toLowerCase().includes(keyword)
		)
	}

	// 模拟分页
	const startIndex = (page - 1) * pageSize
	const endIndex = startIndex + pageSize
	return filteredData.slice(startIndex, endIndex)
}

// 模拟删除API
const mockDeleteKnowledgeBase = async (id: string): Promise<void> => {
	await delay(300)
	// 实际应该调用后端API
	console.log('Delete knowledge base:', id)
}

const Index = () => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [loading, setLoading] = useState(false)
	const [search, setSearch] = useState('')
	const [searchText, setSearchText] = useState('')
	const [page, setPage] = useState(1)
	const [data, setData] = useState<KnowledgeBase[]>([])
	const containerRef = useRef<HTMLDivElement>(null)
	const [hasMore, setHasMore] = useState(true)

	// 加载数据
	const loadData = async (reset = false) => {
		if (loading || (!hasMore && !reset)) return

		setLoading(true)
		try {
			const newPage = reset ? 1 : page
			const response = await mockFetchKnowledgeBases(searchText, newPage, 12)

			if (reset) {
				setData(response)
			} else {
				setData((prevData) => [...prevData, ...response])
			}

			setPage(newPage + 1)
			setHasMore(response.length === 12)
		} catch (error) {
			console.error(is_cn ? '加载知识库失败:' : 'Failed to load knowledge bases:', error)
			message.error(is_cn ? '加载知识库失败' : 'Failed to load knowledge bases')
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

	const handleCardClick = (knowledgeBase: KnowledgeBase) => {
		history.push(`/knowledge/detail/${knowledgeBase.collection_id}`)
	}

	const handleCreate = () => {
		// TODO: 实现创建知识库功能
		message.info(is_cn ? '创建功能开发中...' : 'Create feature coming soon...')
	}

	const handleDelete = async (e: React.MouseEvent, knowledgeBase: KnowledgeBase) => {
		e.stopPropagation() // 阻止卡片点击事件

		try {
			await mockDeleteKnowledgeBase(knowledgeBase.id)
			setData((prevData) => prevData.filter((kb) => kb.id !== knowledgeBase.id))
			message.success(is_cn ? '删除成功' : 'Deleted successfully')
		} catch (error) {
			console.error('Delete failed:', error)
			message.error(is_cn ? '删除失败' : 'Delete failed')
		}
	}

	// 渲染知识库卡片
	const renderKnowledgeBaseCard = (knowledgeBase: KnowledgeBase) => {
		return (
			<div key={knowledgeBase.id} className={styles.gridItem}>
				<div className={styles.knowledgeCard} onClick={() => handleCardClick(knowledgeBase)}>
					<div className={styles.cardCover}>
						<img src={knowledgeBase.cover} alt={knowledgeBase.name} />
					</div>

					<div className={styles.cardContent}>
						<div className={styles.cardHeader}>
							<div className={styles.cardHeaderLeft}>
								<div className={styles.cardTitleWithIcon}>
									<Icon
										name='material-book_4'
										size={18}
										style={{ color: 'var(--color_text)' }}
									/>
									<h3 className={styles.cardTitle}>{knowledgeBase.name}</h3>
								</div>
							</div>
							<div className={styles.cardHeaderRight}>
								<div className={styles.statusIcons}>
									{knowledgeBase.public && (
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
									{knowledgeBase.readonly && (
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
									{knowledgeBase.system && (
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

						<p className={styles.cardDescription}>{knowledgeBase.description}</p>

						<div className={styles.cardFooter}>
							<div className={styles.documentCount}>
								<Icon name='material-description' size={16} />
								<span>
									{knowledgeBase.document_count} {is_cn ? '个文档' : 'documents'}
								</span>
							</div>
							<div className={styles.updateTime}>
								{is_cn ? '更新于' : 'Updated'}{' '}
								{new Date(knowledgeBase.updated_at).toLocaleDateString()}
							</div>
							{/* 只有非只读的知识库才显示删除按钮 */}
							{!knowledgeBase.readonly && (
								<div
									className={styles.deleteBtn}
									onClick={(e) => handleDelete(e, knowledgeBase)}
									title={is_cn ? '删除' : 'Delete'}
								>
									<DeleteOutlined />
								</div>
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
						<h1 className={styles.title}>{is_cn ? '知识库' : 'Knowledge Base'}</h1>
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
						placeholder={is_cn ? '搜索知识库...' : 'Search knowledge base...'}
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
									? '未找到匹配的知识库'
									: 'No matching knowledge bases found'
								: is_cn
								? '暂无知识库'
								: 'No knowledge bases'}
						</div>
						<div className={styles.emptyDescription}>
							{searchText
								? is_cn
									? '尝试调整搜索关键词'
									: 'Try adjusting your search keywords'
								: is_cn
								? '创建您的第一个知识库开始吧'
								: 'Create your first knowledge base to get started'}
						</div>
					</div>
				) : (
					<div className={styles.grid}>{data.map(renderKnowledgeBaseCard)}</div>
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

export default Index
