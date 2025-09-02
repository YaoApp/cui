import { useEffect, useState, useRef } from 'react'
import { useParams, history, getLocale } from '@umijs/max'
import { Spin, Button, message, Input, Empty, Badge, Select, Tooltip, Popconfirm } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import {
	ArrowLeftOutlined,
	UploadOutlined,
	LinkOutlined,
	FileTextOutlined,
	SearchOutlined,
	SettingOutlined
} from '@ant-design/icons'

import Icon from '@/widgets/Icon'
import DocumentModal from '../document'
import CollectionConfigModal from '../config'
import AddDocumentModal, { AddDocumentData } from '../add'
import { Uploader, DocumentCover, Pagination } from '../components'
import styles from './index.less'
import { useGlobal } from '@/context/app'
import { toJS } from 'mobx'
import { KB, FileAPI, Collection, Document, ListDocumentsRequest, CollectionInfo } from '@/openapi'

const { TextArea } = Input

// 类型定义 - 使用Collection类型统一集合概念

// API 对象初始化
const initializeAPIs = (kbConfig?: any) => {
	if (!window.$app?.openapi) {
		throw new Error('OpenAPI not available')
	}

	const kb = new KB(window.$app.openapi)

	// 从kb配置中读取uploader信息，如果没有则使用默认值
	const defaultUploader = kbConfig?.uploader || kbConfig?.file?.uploader
	const fileapi = new FileAPI(window.$app.openapi, defaultUploader)

	return { kb, fileapi }
}

// 从完整的集合数据中提取简化信息
const extractCollectionInfo = (collection: Collection): CollectionInfo => {
	return {
		id: collection.id,
		name: collection.metadata.name || 'Untitled',
		description: collection.metadata.description,
		embedding_provider: collection.metadata.__embedding_provider || 'default',
		embedding_option: collection.metadata.__embedding_option || ''
	}
}

const CollectionDetail = () => {
	const params = useParams<{ '*': string }>()
	const id = params['*'] || ''
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const global = useGlobal()

	const { kb: kbConfig } = global.app_info || {}
	// console.log('Collection Config')
	// console.log('--------------------------------')
	// console.log(JSON.stringify(kbConfig, null, 2))
	// console.log('--------------------------------')

	const [loading, setLoading] = useState(true)
	const [collection, setCollection] = useState<Collection | null>(null)
	const [documents, setDocuments] = useState<Document[]>([])
	const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
	const [textInput, setTextInput] = useState('')
	const [urlInput, setUrlInput] = useState('')
	const [searchText, setSearchText] = useState('')
	const [searchKeywords, setSearchKeywords] = useState('') // 实际用于搜索的关键词
	const [sortBy, setSortBy] = useState('created_at desc') // 排序方式

	// 滚动分页状态
	const [currentPage, setCurrentPage] = useState(1)
	const [totalDocuments, setTotalDocuments] = useState(0)
	const [pageSize] = useState(10)
	const [hasMore, setHasMore] = useState(true)
	const [loadingMore, setLoadingMore] = useState(false)

	// 自动刷新状态
	const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false)
	const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null)

	// 模态窗状态
	const [modalVisible, setModalVisible] = useState(false)
	const [selectedDocument, setSelectedDocument] = useState<{ collectionId: string; docid: string } | null>(null)
	const [configModalVisible, setConfigModalVisible] = useState(false)
	const [addDocumentModalVisible, setAddDocumentModalVisible] = useState(false)
	const [addDocumentData, setAddDocumentData] = useState<AddDocumentData | null>(null)

	// 可用排序方式
	const availableSorts = [
		{ key: 'created_at desc', label: is_cn ? '创建时间 (最新)' : 'Created (Newest)' },
		{ key: 'created_at asc', label: is_cn ? '创建时间 (最旧)' : 'Created (Oldest)' },
		{ key: 'updated_at desc', label: is_cn ? '更新时间 (最新)' : 'Updated (Newest)' },
		{ key: 'updated_at asc', label: is_cn ? '更新时间 (最旧)' : 'Updated (Oldest)' },
		{ key: 'name asc', label: is_cn ? '名称 (A-Z)' : 'Name (A-Z)' },
		{ key: 'name desc', label: is_cn ? '名称 (Z-A)' : 'Name (Z-A)' },
		{ key: 'size desc', label: is_cn ? '文件大小 (大到小)' : 'Size (Large to Small)' },
		{ key: 'size asc', label: is_cn ? '文件大小 (小到大)' : 'Size (Small to Large)' },
		{ key: 'segment_count desc', label: is_cn ? '片段数量 (多到少)' : 'Segments (More to Less)' },
		{ key: 'segment_count asc', label: is_cn ? '片段数量 (少到多)' : 'Segments (Less to More)' }
	]

	// 获取文件类型图标
	const getTypeIcon = (type: string): string => {
		const iconMap: Record<string, string> = {
			text: 'material-text_snippet',
			file: 'material-insert_drive_file',
			url: 'material-link'
		}
		return iconMap[type] || 'material-help_outline'
	}

	// 加载集合详情
	const loadCollection = async () => {
		try {
			setLoading(true)
			const { kb } = initializeAPIs(kbConfig)

			// 直接根据ID获取集合详情
			const response = await kb.GetCollection(id)

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to load collection')
			}

			if (!response.data) {
				throw new Error(is_cn ? '未找到指定的集合' : 'Collection not found')
			}

			setCollection(response.data)
		} catch (error) {
			console.error('Load collection failed:', error)
			const errorMsg =
				error instanceof Error ? error.message : is_cn ? '加载集合失败' : 'Failed to load collection'
			message.error(errorMsg)
		} finally {
			setLoading(false)
		}
	}

	// 加载文档数据
	// Load document data - 初始加载
	const loadDocuments = async () => {
		try {
			const { kb } = initializeAPIs(kbConfig)

			const request: ListDocumentsRequest = {
				collection_id: id,
				sort: sortBy,
				page: 1,
				pagesize: pageSize,
				...(searchKeywords && { keywords: searchKeywords })
			}

			const response = await kb.ListDocuments(request)

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to load documents')
			}

			const data = response.data?.data || []
			const total = response.data?.total || 0

			// 重新加载模式：替换数据
			setDocuments(data)
			setFilteredDocuments(data)
			setCurrentPage(1)
			setTotalDocuments(total)

			// 检查是否还有更多数据
			setHasMore(data.length < total)

			// 根据接口数据判断是否需要自动刷新
			const needAutoRefresh = hasPendingDocuments(data)
			if (needAutoRefresh && !autoRefreshEnabled) {
				console.log('Found pending documents, starting auto refresh')
				startAutoRefresh()
			} else if (!needAutoRefresh && autoRefreshEnabled) {
				console.log('No pending documents, stopping auto refresh')
				stopAutoRefresh()
			}
		} catch (error) {
			console.error('Load documents failed:', error)
			message.error(is_cn ? '加载文档数据失败' : 'Failed to load documents')
		}
	}

	// 执行搜索
	const handleSearch = () => {
		setSearchKeywords(searchText.trim())
		setCurrentPage(1)
		setHasMore(true)
		loadDocuments()
	}

	// 处理排序变化
	const handleSortChange = (newSort: string) => {
		setSortBy(newSort)
		setCurrentPage(1)
		setHasMore(true)
		loadDocuments()
	}

	// 清空搜索
	const handleClearSearch = () => {
		setSearchText('')
		setSearchKeywords('')
		setCurrentPage(1)
		setHasMore(true)
		loadDocuments()
	}

	// 处理回车键搜索
	const handleSearchKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleSearch()
		}
	}

	// 检查是否有处理中的文档
	const hasPendingDocuments = (docs: Document[]) => {
		return docs.some(
			(doc) =>
				doc.status === 'pending' ||
				doc.status === 'converting' ||
				doc.status === 'chunking' ||
				doc.status === 'extracting' ||
				doc.status === 'embedding' ||
				doc.status === 'storing'
		)
	}

	// 启动自动刷新
	const startAutoRefresh = () => {
		if (autoRefreshTimerRef.current) {
			clearInterval(autoRefreshTimerRef.current)
		}

		autoRefreshTimerRef.current = setInterval(() => {
			console.log('Auto refreshing documents...')
			loadDocuments()
			// 同时刷新Jobs数量，因为文档处理状态可能发生变化
			window.$app?.Event?.emit('app/refreshJobsCount')
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

	// 初始化加载
	useEffect(() => {
		if (id) {
			loadCollection()
			loadDocuments()
		}
	}, [id])

	// 搜索关键词或排序变化时重新加载数据
	useEffect(() => {
		if (id) {
			loadDocuments()
		}
	}, [searchKeywords, sortBy])

	// 加载更多数据的函数
	const loadMoreDocuments = async () => {
		if (!hasMore || loadingMore) return

		const nextPage = currentPage + 1
		setCurrentPage(nextPage)

		try {
			setLoadingMore(true)

			const { kb } = initializeAPIs(kbConfig)

			const request: ListDocumentsRequest = {
				collection_id: id,
				sort: sortBy,
				page: nextPage,
				pagesize: pageSize,
				...(searchKeywords && { keywords: searchKeywords })
			}

			const response = await kb.ListDocuments(request)

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to load documents')
			}

			const data = response.data?.data || []
			const total = response.data?.total || 0

			// 追加数据
			const newDocuments = [...documents, ...data]
			setDocuments((prev) => [...prev, ...data])
			setFilteredDocuments((prev) => [...prev, ...data])
			setTotalDocuments(total)

			// 检查是否还有更多数据
			const loadedCount = documents.length + data.length
			setHasMore(loadedCount < total)

			// 根据所有文档数据判断是否需要自动刷新
			const needAutoRefresh = hasPendingDocuments(newDocuments)
			if (needAutoRefresh && !autoRefreshEnabled) {
				console.log('Found pending documents in loaded data, starting auto refresh')
				startAutoRefresh()
			} else if (!needAutoRefresh && autoRefreshEnabled) {
				console.log('No pending documents in all data, stopping auto refresh')
				stopAutoRefresh()
			}
		} catch (error) {
			console.error('Load more documents failed:', error)
			message.error(is_cn ? '加载更多文档失败' : 'Failed to load more documents')
		} finally {
			setLoadingMore(false)
		}
	}

	// Intersection Observer 监听滚动触发器
	useEffect(() => {
		if (!hasMore || loadingMore || filteredDocuments.length === 0) return

		const observer = new IntersectionObserver(
			(entries) => {
				const triggerEntry = entries[0]
				if (triggerEntry.isIntersecting) {
					loadMoreDocuments()
				}
			},
			{
				threshold: 0.1, // 当10%的元素可见时触发
				rootMargin: '50px' // 提前50px开始加载
			}
		)

		// 观察滚动触发器元素
		const scrollTrigger = document.getElementById('scroll-trigger')
		if (scrollTrigger) {
			observer.observe(scrollTrigger)
		}

		return () => {
			observer.disconnect()
		}
	}, [filteredDocuments, hasMore, loadingMore])

	// 页面初始化时加载文档
	useEffect(() => {
		if (id) {
			loadDocuments()
		}
	}, [id])

	// 组件卸载时清理定时器
	useEffect(() => {
		return () => {
			if (autoRefreshTimerRef.current) {
				clearInterval(autoRefreshTimerRef.current)
			}
		}
	}, [])

	// 上传文件处理
	const handleFileUpload = (file: File) => {
		// 不执行实际上传，而是打开添加弹窗
		const documentData: AddDocumentData = {
			type: 'file',
			content: {
				file,
				name: file.name,
				size: file.size
			}
		}
		setAddDocumentData(documentData)
		setAddDocumentModalVisible(true)
		return false // 阻止默认上传行为
	}

	// 添加文本
	const handleAddText = () => {
		if (!textInput.trim()) {
			message.warning(is_cn ? '请输入文本内容' : 'Please enter text content')
			return
		}

		const documentData: AddDocumentData = {
			type: 'text',
			content: {
				content: textInput
			}
		}
		setAddDocumentData(documentData)
		setAddDocumentModalVisible(true)
	}

	// 添加URL
	const handleAddUrl = () => {
		if (!urlInput.trim()) {
			message.warning(is_cn ? '请输入URL地址' : 'Please enter URL')
			return
		}

		const documentData: AddDocumentData = {
			type: 'url',
			content: {
				url: urlInput,
				title: undefined
			}
		}
		setAddDocumentData(documentData)
		setAddDocumentModalVisible(true)
	}

	// 返回上一页
	const handleBack = () => {
		history.push('/kb')
	}

	const handleViewDocuments = () => {
		// 打开示例文档模态窗
		setSelectedDocument({
			collectionId: id,
			docid: 'doc_001'
		})
		setModalVisible(true)
	}

	const handleConfigCollection = () => {
		// 打开配置弹窗
		setConfigModalVisible(true)
	}

	// 处理添加文档确认
	const handleAddDocumentConfirm = (data: AddDocumentData, options: any, jobId: string) => {
		console.log('Adding document:', data, options, 'Job ID:', jobId)

		message.success(is_cn ? '文档处理已开始' : 'Document processing started')

		// 清理输入
		if (data.type === 'text') {
			setTextInput('')
		} else if (data.type === 'url') {
			setUrlInput('')
		}

		// 关闭添加弹窗
		setAddDocumentModalVisible(false)
		setAddDocumentData(null)

		// 刷新文档列表以显示新添加的文档
		setTimeout(() => {
			loadDocuments()
		}, 1000) // 延迟1秒后刷新，给服务器一点处理时间

		// 打开文档详情弹窗，使用jobId作为docid
		setSelectedDocument({
			collectionId: id,
			docid: jobId
		})
		setModalVisible(true)
	}

	// 处理添加文档取消
	const handleAddDocumentCancel = () => {
		setAddDocumentModalVisible(false)
		setAddDocumentData(null)
	}

	const handleConfigUpdate = (updatedCollection: Collection) => {
		// 更新本地状态
		setCollection(updatedCollection)
	}

	const handleViewDocument = (document: Document) => {
		setSelectedDocument({
			collectionId: id,
			docid: document.document_id
		})
		setModalVisible(true)
	}

	// 删除文档
	const handleDeleteDocument = async (document: Document) => {
		try {
			const { kb } = initializeAPIs(kbConfig)

			// 调用删除文档 API
			const response = await kb.RemoveDocs([document.document_id])

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to delete document')
			}

			const { deleted_count = 0, requested_count = 1 } = response.data || {}

			if (deleted_count === 0) {
				message.warning(is_cn ? '文档未找到或已被删除' : 'Document not found or already deleted')
			} else {
				message.success(
					is_cn
						? `文档删除成功 (${deleted_count}/${requested_count})`
						: `Document deleted successfully (${deleted_count}/${requested_count})`
				)
			}

			// 从本地状态中移除文档
			setDocuments((prev) => prev.filter((doc) => doc.document_id !== document.document_id))
			setFilteredDocuments((prev) => prev.filter((doc) => doc.document_id !== document.document_id))

			// 更新总数
			setTotalDocuments((prev) => prev - deleted_count)
		} catch (error) {
			console.error('Delete document failed:', error)
			const errorMsg =
				error instanceof Error ? error.message : is_cn ? '删除失败' : 'Failed to delete document'
			message.error(errorMsg)
		}
	}

	if (loading) {
		return (
			<div className={styles.loading}>
				<Spin size='large' />
			</div>
		)
	}

	if (!collection) {
		return (
			<div className={styles.error}>
				<Empty description={is_cn ? '集合不存在' : 'Collection not found'} />
			</div>
		)
	}

	return (
		<div className={styles.container}>
			{/* 头部导航 */}
			<div className={styles.header}>
				<div className={styles.headerLeft}>
					<Button
						type='text'
						icon={<ArrowLeftOutlined />}
						onClick={handleBack}
						className={styles.backButton}
					/>
					<div className={styles.titleInfo}>
						<div className={styles.titleWithBadge}>
							<h1 className={styles.title}>{collection.metadata.name}</h1>
							<span className={styles.documentCount}>
								{is_cn
									? `${collection.metadata.document_count || 0} 个文档`
									: `${collection.metadata.document_count || 0} documents`}
							</span>
						</div>
						<p className={styles.subtitle}>{collection.metadata.description}</p>
					</div>
				</div>
				<div className={styles.headerRight}>
					<Tooltip title={is_cn ? '配置集合参数' : 'Configure collection settings'}>
						<Button type='default' onClick={handleConfigCollection} icon={<SettingOutlined />}>
							{is_cn ? '配置' : 'Settings'}
						</Button>
					</Tooltip>
				</div>
			</div>

			{/* 三个并列的输入区域 */}
			<div className={styles.inputSection}>
				{/* 文件上传区域 */}
				<div className={styles.fileInputArea}>
					<div className={styles.inputContent}>
						<Uploader
							mode='dragger'
							name='file'
							multiple={false}
							showUploadList={false}
							beforeUpload={handleFileUpload}
							className={styles.uploadArea}
						/>
					</div>
				</div>

				{/* 粘贴文本区域 */}
				<div className={styles.textInputArea}>
					<div className={styles.inputContent}>
						<TextArea
							placeholder={
								is_cn
									? '粘贴文本 - 请在此输入文本内容，上传到集合'
									: 'Paste Text - Type or paste text here to upload to this collection'
							}
							value={textInput}
							onChange={(e) => setTextInput(e.target.value)}
							className={styles.mainTextArea}
							autoSize={{ minRows: 8, maxRows: 12 }}
						/>
						{textInput && (
							<Button
								type='primary'
								className={styles.addButton}
								onClick={handleAddText}
								icon={<FileTextOutlined />}
							>
								{is_cn ? '添加文本' : 'Add Text'}
							</Button>
						)}
					</div>
				</div>

				{/* URL输入区域 */}
				<div className={styles.urlInputArea}>
					<div className={styles.inputContent}>
						<TextArea
							placeholder={
								is_cn
									? '输入 URL - 请输入网页或文档的URL地址...'
									: 'Input URL - Please enter the URL of webpage or document...'
							}
							value={urlInput}
							onChange={(e) => setUrlInput(e.target.value)}
							className={styles.urlInput}
							autoSize={{ minRows: 8, maxRows: 12 }}
						/>
						{urlInput && (
							<Button
								type='primary'
								className={styles.addButton}
								onClick={handleAddUrl}
								icon={<LinkOutlined />}
							>
								{is_cn ? '添加 URL' : 'Add URL'}
							</Button>
						)}
					</div>
				</div>

				{/* 分割线 */}
				<div className={styles.divider}></div>
			</div>

			{/* 搜索和排序区域 */}
			<div className={styles.filterSection}>
				<div className={styles.searchArea}>
					<Input
						placeholder={is_cn ? '输入关键词进行搜索...' : 'Input keywords to search...'}
						value={searchText}
						onChange={(e) => {
							const value = e.target.value
							setSearchText(value)
							if (!value) {
								handleClearSearch()
							}
						}}
						onKeyPress={handleSearchKeyPress}
						prefix={<SearchOutlined />}
						className={styles.searchInput}
						size='large'
						allowClear
					/>
					<Button
						type='primary'
						icon={<SearchOutlined />}
						onClick={handleSearch}
						className={styles.searchButton}
						size='large'
					>
						{is_cn ? '搜索' : 'Search'}
					</Button>
				</div>
				<div className={styles.sortArea}>
					<span className={styles.sortLabel}>{is_cn ? '排序:' : 'Sort:'}</span>
					<Select
						value={sortBy}
						onChange={handleSortChange}
						className={styles.sortSelect}
						size='middle'
					>
						{availableSorts.map((sort) => (
							<Select.Option key={sort.key} value={sort.key}>
								{sort.label}
							</Select.Option>
						))}
					</Select>
				</div>
			</div>

			{/* 文档卡片展示区域 */}
			<div className={styles.documentsSection}>
				{filteredDocuments.length > 0 ? (
					<div className={styles.documentsGrid}>
						{filteredDocuments.map((document) => (
							<div
								key={document.id}
								className={`${styles.documentCard} document-card`}
								onClick={() => handleViewDocument(document)}
							>
								<div className={styles.cardHeader}>
									<div className={styles.cardHeaderLeft}>
										<div className={styles.cardTitleWithIcon}>
											<Icon name={getTypeIcon(document.type)} size={16} />
											<h3 className={styles.cardTitle}>{document.name}</h3>
										</div>
									</div>
									<Tooltip
										title={
											document.status === 'completed'
												? is_cn
													? '已完成'
													: 'Completed'
												: document.status === 'error'
												? is_cn
													? '错误'
													: 'Error'
												: document.status === 'maintenance'
												? is_cn
													? '维护中'
													: 'Maintenance'
												: document.status === 'restoring'
												? is_cn
													? '恢复中'
													: 'Restoring'
												: is_cn
												? '处理中'
												: 'Processing'
										}
										placement='topRight'
									>
										<Badge
											status={
												document.status === 'completed'
													? 'success'
													: document.status === 'error'
													? 'error'
													: document.status === 'maintenance' ||
													  document.status === 'restoring'
													? 'warning'
													: 'processing'
											}
											className={styles.statusBadge}
										/>
									</Tooltip>
								</div>
								<div className={styles.cardContent}>
									<DocumentCover
										cover={document.cover}
										name={document.name}
										description={document.description}
										status={document.status}
										errorMessage={document.error_message}
									/>
								</div>
								<div className={styles.cardFooter}>
									<div className={styles.documentInfo}>
										<div className={styles.leftInfo}>
											<div className={styles.infoItem}>
												<Icon name='material-grid_view' size={10} />
												<span>
													<Tooltip
														title={
															is_cn
																? `${document.segment_count} 个知识片段`
																: `${document.segment_count} Knowledge Chunks`
														}
														placement='top'
													>
														{document.segment_count}
													</Tooltip>
												</span>
											</div>
											<div className={styles.infoItem}>
												<Icon
													name='material-insert_drive_file'
													size={10}
												/>
												<span>
													{(document.size / 1024).toFixed(1)}KB
												</span>
											</div>
										</div>
										<div className={styles.rightInfo}>
											<div className={styles.infoItem}>
												<Icon name='material-schedule' size={10} />
												<span>
													{new Date(
														document.created_at
													).toLocaleDateString()}
												</span>
											</div>
											<Popconfirm
												title={
													is_cn
														? '确定要删除这个文档吗？删除后将无法恢复！'
														: 'Are you sure to delete this document? This action cannot be undone!'
												}
												onConfirm={(e) => {
													e?.stopPropagation()
													handleDeleteDocument(document)
												}}
												onCancel={(e) => e?.stopPropagation()}
												okText={is_cn ? '确认' : 'Confirm'}
												cancelText={is_cn ? '取消' : 'Cancel'}
											>
												<div
													className={styles.deleteButton}
													onClick={(e) => e.stopPropagation()}
													title={is_cn ? '删除' : 'Delete'}
												>
													<DeleteOutlined />
												</div>
											</Popconfirm>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className={styles.emptyDocuments}>
						<Empty
							description={is_cn ? '暂无文档' : 'No documents'}
							image={Empty.PRESENTED_IMAGE_SIMPLE}
						/>
					</div>
				)}

				{/* 滚动加载触发器 - 隐藏的观察目标 */}
				{hasMore && filteredDocuments.length > 0 && (
					<div id='scroll-trigger' className={styles.scrollTrigger}></div>
				)}

				{/* 加载更多指示器 */}
				{loadingMore && (
					<div className={styles.loadingMore}>
						<Spin size='small' />
						<span>{is_cn ? '加载更多文档...' : 'Loading more documents...'}</span>
					</div>
				)}

				{/* 没有更多数据的提示 */}
				{!hasMore && filteredDocuments.length > 0 && (
					<div className={styles.noMoreData}>
						<div className={styles.divider}>
							<span className={styles.dividerText}>
								{is_cn ? '已加载全部' : 'All loaded'}
							</span>
						</div>
					</div>
				)}
			</div>

			{/* 文档详情模态窗 */}
			{selectedDocument && collection && (
				<DocumentModal
					visible={modalVisible}
					onClose={() => {
						setModalVisible(false)
						setSelectedDocument(null)
					}}
					collectionId={selectedDocument.collectionId}
					docid={selectedDocument.docid}
					collectionInfo={extractCollectionInfo(collection)}
					onDocumentDeleted={() => {
						// 刷新文档列表
						loadDocuments()
					}}
				/>
			)}

			{/* 集合配置模态窗 */}
			<CollectionConfigModal
				visible={configModalVisible}
				onClose={() => setConfigModalVisible(false)}
				collection={collection}
				onUpdate={handleConfigUpdate}
			/>

			{/* 添加文档模态窗 */}
			<AddDocumentModal
				visible={addDocumentModalVisible}
				onClose={handleAddDocumentCancel}
				onConfirm={handleAddDocumentConfirm}
				data={addDocumentData}
				collectionName={collection?.metadata?.name}
				collection={collection}
			/>
		</div>
	)
}

export default CollectionDetail
