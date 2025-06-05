import { useEffect, useState } from 'react'
import { useParams, history, getLocale } from '@umijs/max'
import { Spin, Button, message, Input, Upload, Empty, Badge, Select, Tooltip } from 'antd'
import { ArrowLeftOutlined, UploadOutlined, LinkOutlined, FileTextOutlined, SearchOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import Icon from '@/widgets/Icon'
import styles from './index.less'

const { TextArea } = Input

// 类型定义
interface KnowledgeBase {
	id: string
	name: string
	description: string
	created_at: string
	updated_at: string
	document_count: number
	total_chunks: number
}

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

// Mock API 函数
const mockFetchKnowledgeBase = async (id: string): Promise<KnowledgeBase> => {
	await new Promise((resolve) => setTimeout(resolve, 300))

	return {
		id,
		name: 'New Knowledge Base',
		description: 'Your personal knowledge base for better AI generation',
		created_at: '2024-01-15T10:30:00Z',
		updated_at: '2024-01-20T14:20:00Z',
		document_count: 5,
		total_chunks: 31
	}
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

	const [loading, setLoading] = useState(true)
	const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null)
	const [seeds, setSeeds] = useState<Seed[]>([])
	const [textInput, setTextInput] = useState('')
	const [urlInput, setUrlInput] = useState('')
	const [searchText, setSearchText] = useState('')
	const [selectedTags, setSelectedTags] = useState<string[]>([])
	const [splitMode, setSplitMode] = useState<'fixed' | 'smart'>('smart')

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

	// 分段模式选项
	const splitModeOptions = [
		{
			value: 'fixed',
			label: is_cn ? '固定长度' : 'Fixed Length',
			description: is_cn
				? '按固定长度分割，快速处理，但可能会打破语义段落完整性'
				: 'Split by fixed length, fast processing, but may break semantic paragraph integrity'
		},
		{
			value: 'smart',
			label: is_cn ? '智能分割' : 'Smart Split',
			description: is_cn
				? '按语义分割内容，借助LLM智能分析，保持语义完整性，但处理速度较慢'
				: 'Split content by semantics, using LLM intelligent analysis, maintains semantic integrity, but slower processing'
		}
	]

	// 获取当前模式的描述
	const getCurrentModeDescription = () => {
		return splitModeOptions.find((option) => option.value === splitMode)?.description || ''
	}

	// 获取文件类型图标
	const getTypeIcon = (type: string): string => {
		const iconMap: Record<string, string> = {
			text: 'material-text_snippet',
			file: 'material-insert_drive_file',
			url: 'material-link'
		}
		return iconMap[type] || 'material-help_outline'
	}

	// 加载知识库详情
	const loadKnowledgeBase = async () => {
		try {
			setLoading(true)
			const data = await mockFetchKnowledgeBase(id)
			setKnowledgeBase(data)
		} catch (error) {
			message.error(is_cn ? '加载知识库失败' : 'Failed to load knowledge base')
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
			loadKnowledgeBase()
			loadSeeds()
		}
	}, [id])

	// 上传文件
	const uploadProps: UploadProps = {
		name: 'file',
		multiple: true,
		action: '/api/upload',
		showUploadList: false,
		onChange(info) {
			const { status } = info.file
			if (status === 'done') {
				message.success(`${info.file.name} ${is_cn ? '上传成功' : 'uploaded successfully'}`)
				loadSeeds()
			} else if (status === 'error') {
				message.error(`${info.file.name} ${is_cn ? '上传失败' : 'upload failed'}`)
			}
		}
	}

	// 添加文本
	const handleAddText = () => {
		if (!textInput.trim()) {
			message.warning(is_cn ? '请输入文本内容' : 'Please enter text content')
			return
		}
		message.success(is_cn ? '文本添加成功' : 'Text added successfully')
		setTextInput('')
		loadSeeds()
	}

	// 添加URL
	const handleAddUrl = () => {
		if (!urlInput.trim()) {
			message.warning(is_cn ? '请输入URL地址' : 'Please enter URL')
			return
		}
		message.success(is_cn ? 'URL添加成功' : 'URL added successfully')
		setUrlInput('')
		loadSeeds()
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
		// 跳转到示例文档页面
		history.push(`/knowledge/document/${id}/doc_001`)
	}

	const handleViewSeedDocument = (seed: Seed) => {
		// 根据seed ID生成doc_id，实际项目中应该使用真实的文档ID
		const docId = `doc_${seed.id.padStart(3, '0')}`
		history.push(`/knowledge/document/${id}/${docId}`)
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

	if (!knowledgeBase) {
		return (
			<div className={styles.error}>
				<Empty description={is_cn ? '知识库不存在' : 'Knowledge base not found'} />
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
							<h1 className={styles.title}>{knowledgeBase.name}</h1>
							<span className={styles.documentCount}>
								{is_cn
									? `${knowledgeBase.document_count} 个文档`
									: `${knowledgeBase.document_count} documents`}
							</span>
						</div>
						<p className={styles.subtitle}>{knowledgeBase.description}</p>
					</div>
				</div>
				<div className={styles.headerRight}>
					<Tooltip
						title={is_cn ? '查看知识库中的文档详情' : 'View document details in knowledge base'}
					>
						<Button type='default' onClick={handleViewDocuments} icon={<FileTextOutlined />}>
							{is_cn ? '查看文档' : 'View Documents'}
						</Button>
					</Tooltip>
				</div>
			</div>

			{/* 三个并列的输入区域 */}
			<div className={styles.inputSection}>
				{/* 文件上传区域 */}
				<div className={styles.fileInputArea}>
					<div className={styles.inputContent}>
						<Upload.Dragger {...uploadProps} className={styles.uploadArea}>
							<p className='ant-upload-drag-icon'>
								<UploadOutlined />
							</p>
							<p className='ant-upload-text'>
								{is_cn
									? '上传文件 - 点击或拖拽文件到此区域上传'
									: 'Upload File - Click or drag file to this area to upload'}
							</p>
							<p className='ant-upload-hint'>
								{is_cn
									? '支持 PDF、Word、Excel、TXT 等格式'
									: 'Support PDF, Word, Excel, TXT and other formats'}
							</p>
						</Upload.Dragger>
					</div>
				</div>

				{/* 粘贴文本区域 */}
				<div className={styles.textInputArea}>
					<div className={styles.inputContent}>
						<TextArea
							placeholder={
								is_cn
									? '粘贴文本 - 请在此输入文本内容，上传到知识库'
									: 'Paste Text - Type or paste text here to upload to this knowledge base'
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

				{/* 分段模式选择 */}
				<div className={styles.modeToggle}>
					<span className={styles.modeLabel}>{is_cn ? '分段模式:' : 'Split Mode:'}</span>
					<Select
						value={splitMode}
						onChange={setSplitMode}
						className={styles.modeSelector}
						size='small'
						options={splitModeOptions.map((option) => ({
							value: option.value,
							label: option.label
						}))}
					/>
					<span className={styles.modeDesc}>{getCurrentModeDescription()}</span>
				</div>
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
		</div>
	)
}

export default KnowledgeDetail
