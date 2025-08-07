import { useEffect, useState } from 'react'
import { useParams, history, getLocale } from '@umijs/max'
import { Spin, Button, message, Input, Empty, Badge, Select, Tooltip } from 'antd'
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
import { Uploader } from '../components'
import styles from './index.less'
import { useGlobal } from '@/context/app'
import { toJS } from 'mobx'
import { KB, FileAPI, Collection } from '@/openapi'

const { TextArea } = Input

// 类型定义 - 使用Collection类型统一集合概念

interface Seed {
	id: string
	title: string
	content: string
	tags: string[]
	seeds_count: number
	type: 'text' | 'file' | 'url'
	status: 'active' | 'processing'
	created_at: string
	cover?: string
}

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

const mockFetchSeeds = async (id: string): Promise<Seed[]> => {
	await new Promise((resolve) => setTimeout(resolve, 300))

	return [
		{
			id: '1',
			title: 'AWS Marketplace Homepage',
			content: 'Discover, deploy, and manage software solutions for the cloud. Browse our extensive catalog...',
			tags: ['technology', 'product'],
			seeds_count: 3,
			type: 'url',
			status: 'active',
			created_at: '2024-01-18T09:15:00Z',
			cover: 'https://picsum.photos/200/280?random=1'
		},
		{
			id: '2',
			title: '山海经',
			content: '山海经是中国古代重要的神话地理著作，记载了大量的神话传说、地理信息和奇异生物...',
			tags: ['legal', 'compliance'],
			seeds_count: 4,
			type: 'file',
			status: 'active',
			created_at: '2024-01-17T14:30:00Z',
			cover: 'https://picsum.photos/200/280?random=2'
		},
		{
			id: '3',
			title: '数据架构设计',
			content: '现代数据架构需要考虑可扩展性、性能、安全性等多个维度。云原生架构提供了...',
			tags: ['technology', 'operations'],
			seeds_count: 1,
			type: 'text',
			status: 'processing',
			created_at: '2024-01-19T16:45:00Z'
			// 处理中的文档没有cover，会显示占位图
		},
		{
			id: '4',
			title: '智能清洁设备用户说明',
			content: '本产品为智能清洁设备，具备自动识别、深度清洁等功能。Google Chrome用户可以...',
			tags: ['product', 'marketing'],
			seeds_count: 31,
			type: 'file',
			status: 'active',
			created_at: '2024-01-16T11:20:00Z',
			cover: 'https://picsum.photos/200/280?random=4'
		}
	]
}

const KnowledgeDetail = () => {
	const params = useParams<{ '*': string }>()
	const id = params['*'] || ''
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const global = useGlobal()

	const { kb: kbConfig } = global.app_info || {}
	console.log('Collection Config')
	console.log('--------------------------------')
	console.log(JSON.stringify(kbConfig, null, 2))
	console.log('--------------------------------')

	const [loading, setLoading] = useState(true)
	const [collection, setCollection] = useState<Collection | null>(null)
	const [seeds, setSeeds] = useState<Seed[]>([])
	const [textInput, setTextInput] = useState('')
	const [urlInput, setUrlInput] = useState('')
	const [searchText, setSearchText] = useState('')
	const [selectedTags, setSelectedTags] = useState<string[]>([])

	// 模态窗状态
	const [modalVisible, setModalVisible] = useState(false)
	const [selectedDocument, setSelectedDocument] = useState<{ collectionId: string; docid: string } | null>(null)
	const [configModalVisible, setConfigModalVisible] = useState(false)
	const [addDocumentModalVisible, setAddDocumentModalVisible] = useState(false)
	const [addDocumentData, setAddDocumentData] = useState<AddDocumentData | null>(null)

	// 可用标签
	const availableTags = [
		{ key: 'legal', label: is_cn ? '法律' : 'legal' },
		{ key: 'finance', label: is_cn ? '财务' : 'finance' },
		{ key: 'technology', label: is_cn ? '技术' : 'technology' },
		{ key: 'marketing', label: is_cn ? '市场' : 'marketing' },
		{ key: 'hr', label: is_cn ? '人事' : 'hr' },
		{ key: 'product', label: is_cn ? '产品' : 'product' },
		{ key: 'operations', label: is_cn ? '运营' : 'operations' },
		{ key: 'compliance', label: is_cn ? '合规' : 'compliance' }
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

			// 获取所有集合，然后找到对应的集合
			const response = await kb.GetCollections()

			if (window.$app.openapi.IsError(response)) {
				throw new Error(response.error?.error_description || 'Failed to load collections')
			}

			// 从集合列表中找到对应ID的集合
			const collection = response.data?.find((c) => c.id === id)
			if (!collection) {
				throw new Error(is_cn ? '未找到指定的集合' : 'Collection not found')
			}

			setCollection(collection)
		} catch (error) {
			console.error('Load collection failed:', error)
			const errorMsg =
				error instanceof Error ? error.message : is_cn ? '加载集合失败' : 'Failed to load collection'
			message.error(errorMsg)
		} finally {
			setLoading(false)
		}
	}

	// 加载种子数据
	const loadSeeds = async () => {
		try {
			const data = await mockFetchSeeds(id)
			setSeeds(data)
		} catch (error) {
			message.error(is_cn ? '加载种子数据失败' : 'Failed to load seeds')
		}
	}

	// 初始化加载
	useEffect(() => {
		if (id) {
			loadCollection()
			loadSeeds()
		}
	}, [id])

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

	// 标签切换
	const toggleTag = (tag: string) => {
		setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
	}

	// 搜索处理
	const handleSearch = (value: string) => {
		setSearchText(value)
		// TODO: 实现搜索过滤逻辑
	}

	// 返回上一页
	const handleBack = () => {
		history.push('/knowledge')
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
	const handleAddDocumentConfirm = (data: AddDocumentData, options: any) => {
		console.log('Adding document:', data, options)

		// TODO: 实际的添加逻辑
		message.success(is_cn ? '文档添加成功' : 'Document added successfully')

		// 清理输入
		if (data.type === 'text') {
			setTextInput('')
		} else if (data.type === 'url') {
			setUrlInput('')
		}

		// 关闭弹窗
		setAddDocumentModalVisible(false)
		setAddDocumentData(null)

		// 重新加载数据
		loadSeeds()
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

	const handleViewSeedDocument = (seed: Seed) => {
		// 根据seed ID生成doc_id，实际项目中应该使用真实的文档ID
		const docid = `doc_${seed.id.padStart(3, '0')}`
		setSelectedDocument({
			collectionId: id,
			docid: docid
		})
		setModalVisible(true)
	}

	// 过滤种子数据
	const filteredSeeds = seeds.filter((seed) => {
		// 搜索过滤
		if (searchText.trim()) {
			const keyword = searchText.toLowerCase()
			const matchesTitle = seed.title.toLowerCase().includes(keyword)
			const matchesContent = seed.content.toLowerCase().includes(keyword)
			const matchesTags = seed.tags.some((tag) => tag.toLowerCase().includes(keyword))
			if (!matchesTitle && !matchesContent && !matchesTags) {
				return false
			}
		}

		// 标签过滤
		if (selectedTags.length > 0) {
			const hasMatchingTag = seed.tags.some((tag) => selectedTags.includes(tag))
			if (!hasMatchingTag) {
				return false
			}
		}

		return true
	})

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

			{/* 搜索和标签过滤区域 */}
			<div className={styles.filterSection}>
				<div className={styles.searchArea}>
					<Input
						placeholder={
							is_cn
								? '输入关键词、文件类型等...'
								: 'Input keywords, file types to search...'
						}
						prefix={<SearchOutlined />}
						value={searchText}
						onChange={(e) => handleSearch(e.target.value)}
						className={styles.searchInput}
						size='large'
						allowClear
					/>
				</div>
				<div className={styles.tagsArea}>
					<div className={styles.tagsList}>
						{availableTags.map((tag) => (
							<Button
								key={tag.key}
								type={selectedTags.includes(tag.key) ? 'primary' : 'default'}
								size='small'
								className={styles.tagButton}
								onClick={() => toggleTag(tag.key)}
							>
								#{tag.label}
							</Button>
						))}
					</div>
				</div>
			</div>

			{/* 种子卡片展示区域 */}
			<div className={styles.seedsSection}>
				{filteredSeeds.length > 0 ? (
					<div className={styles.seedsGrid}>
						{filteredSeeds.map((seed) => (
							<div
								key={seed.id}
								className={styles.seedCard}
								onClick={() => handleViewSeedDocument(seed)}
							>
								<div className={styles.cardHeader}>
									<div className={styles.cardHeaderLeft}>
										<div className={styles.cardTitleWithIcon}>
											<Icon name={getTypeIcon(seed.type)} size={16} />
											<h3 className={styles.cardTitle}>{seed.title}</h3>
											<span className={styles.seedsCount}>
												<Tooltip
													title={
														is_cn
															? `${seed.seeds_count} 个知识片段`
															: `${seed.seeds_count} Knowledge Chunks`
													}
													placement='top'
												>
													<span className={styles.seedsCountNumber}>
														{seed.seeds_count}
													</span>
												</Tooltip>
											</span>
										</div>
									</div>
								</div>
								<div className={styles.cardContent}>
									{seed.cover ? (
										<img
											src={seed.cover}
											alt={seed.title}
											className={styles.cardCover}
										/>
									) : (
										<div className={styles.cardCoverPlaceholder}>
											<Icon
												name={
													seed.status === 'processing'
														? 'material-psychology'
														: 'material-image'
												}
												size={48}
											/>
											<span>
												{seed.status === 'processing'
													? is_cn
														? '智能处理中...'
														: 'AI Processing...'
													: is_cn
													? '暂无预览'
													: 'No Preview'}
											</span>
										</div>
									)}
								</div>
								<div className={styles.cardFooter}>
									<div className={styles.seedTags}>
										{seed.tags.map((tag) => (
											<div key={tag} className={styles.infoItem}>
												<Icon name='material-tag' size={10} />
												<span>#{tag}</span>
											</div>
										))}
									</div>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className={styles.emptySeeds}>
						<Empty
							description={is_cn ? '暂无内容种子' : 'No content seeds'}
							image={Empty.PRESENTED_IMAGE_SIMPLE}
						/>
					</div>
				)}
			</div>

			{/* 文档详情模态窗 */}
			{selectedDocument && (
				<DocumentModal
					visible={modalVisible}
					onClose={() => {
						setModalVisible(false)
						setSelectedDocument(null)
					}}
					collectionId={selectedDocument.collectionId}
					docid={selectedDocument.docid}
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
			/>
		</div>
	)
}

export default KnowledgeDetail
