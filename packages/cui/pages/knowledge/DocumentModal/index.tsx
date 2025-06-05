import React, { useEffect, useState, useRef } from 'react'
import { Modal, Button, Spin, message, Tabs, Empty, Card, Tag, Avatar, Tooltip, Progress, Input } from 'antd'
import {
	CloseOutlined,
	FileTextOutlined,
	SearchOutlined,
	EyeOutlined,
	DownloadOutlined,
	ShareAltOutlined,
	HeartOutlined,
	ClockCircleOutlined,
	UserOutlined,
	DatabaseOutlined,
	InfoCircleOutlined,
	MoreOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined,
	LoadingOutlined,
	QuestionCircleOutlined
} from '@ant-design/icons'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import FileViewer from '@/components/view/FileViewer'
import ChunkViewer from '../document/ChunkViewer'
import { KnowledgeBase, Document } from '../types'
import styles from './index.less'

const { Search } = Input

// 模拟API延迟
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Mock数据
const mockKnowledgeBase: KnowledgeBase = {
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
}

const mockDocument: Document = {
	id: '1',
	doc_id: 'doc_001',
	collection_id: 'kb_001',
	name: 'AI技术发展趋势报告.pdf',
	description: '详细分析了人工智能技术的发展现状、主要趋势和未来展望',
	uid: 'user123',
	cover: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop',
	knowledge_base_name: 'AI技术资料库',
	chunk_count: 45,
	status: 'ready',
	content: `# AI技术发展趋势报告

## 摘要

人工智能（AI）技术正在快速发展，从机器学习到深度学习，从自然语言处理到计算机视觉，AI正在改变我们的生活和工作方式。本报告深入分析了当前AI技术的发展状况，探讨了主要的技术趋势，并对未来的发展方向进行了预测。

## 1. 引言

人工智能作为21世纪最重要的技术之一，正在各个领域产生深远的影响。从智能助手到自动驾驶，从医疗诊断到金融分析，AI技术的应用范围在不断扩展。

## 2. 当前技术状况

### 2.1 机器学习

机器学习是AI的核心技术之一，包括监督学习、无监督学习和强化学习。当前主要的发展方向包括：

- 深度学习网络的优化
- 联邦学习技术的推广
- AutoML的普及应用

### 2.2 自然语言处理

大语言模型（LLM）的出现标志着NLP技术的重大突破：

- GPT系列模型的演进
- 多模态大模型的发展
- 专业领域模型的定制化

### 2.3 计算机视觉

计算机视觉技术在精度和效率上都有显著提升：

- 目标检测算法的优化
- 图像生成技术的突破
- 3D视觉理解的进步

## 3. 主要发展趋势

### 3.1 技术民主化

AI技术正在变得更加易用和普及：

- 低代码/无代码AI平台
- Pre-trained模型的广泛应用
- 开源AI工具的丰富

### 3.2 边缘计算

AI计算正在从云端向边缘迁移：

- 模型轻量化技术
- 边缘设备的AI芯片
- 实时处理能力的提升

### 3.3 可解释性AI

随着AI应用的深入，可解释性变得越来越重要：

- XAI技术的发展
- AI决策过程的透明化
- 伦理AI的实践

## 4. 未来展望

### 4.1 通用人工智能（AGI）

虽然还有很长的路要走，但AGI仍然是AI研究的终极目标：

- 多任务学习能力的提升
- 常识推理能力的增强
- 自主学习机制的完善

### 4.2 人机协作

未来的AI将更多地与人类协作，而不是替代：

- 人机交互界面的改进
- 协作工作流的优化
- 人类创造力的增强

### 4.3 产业变革

AI将继续推动各行各业的数字化转型：

- 智能制造的普及
- 精准医疗的发展
- 智慧城市的建设

## 5. 结论

AI技术的发展正在加速，我们正处于一个充满机遇和挑战的时代。掌握AI技术，理解其发展趋势，对于个人和企业都至关重要。

未来，我们需要在技术创新的同时，关注AI的伦理问题，确保AI技术能够真正造福人类社会。`,
	created_at: '2024-01-15T10:30:00Z',
	updated_at: '2024-01-20T14:22:00Z'
}

// Mock API 函数
const mockFetchKnowledgeBase = async (collectionId: string): Promise<KnowledgeBase> => {
	await delay(300)
	return mockKnowledgeBase
}

const mockFetchDocument = async (docId: string): Promise<Document> => {
	await delay(300)
	return mockDocument
}

const mockFetchDocumentContent = async (docId: string): Promise<string> => {
	await delay(300)
	return mockDocument.content
}

interface DocumentModalProps {
	visible: boolean
	onClose: () => void
	collectionId: string
	docId: string
}

const DocumentModal: React.FC<DocumentModalProps> = ({ visible, onClose, collectionId, docId }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [loading, setLoading] = useState(true)
	const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(null)
	const [document, setDocument] = useState<Document | null>(null)
	const [documentContent, setDocumentContent] = useState<string>('')
	const [activeTab, setActiveTab] = useState('content')
	const [showMetadata, setShowMetadata] = useState(false)
	const [isClosing, setIsClosing] = useState(false)

	// 添加ref用于检测外部点击
	const popoverRef = useRef<HTMLDivElement>(null)
	const infoButtonRef = useRef<HTMLButtonElement>(null)

	// 丝滑关闭函数
	const closePopover = () => {
		setIsClosing(true)
		setTimeout(() => {
			setShowMetadata(false)
			setIsClosing(false)
		}, 200)
	}

	// 检测外部点击关闭弹窗
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (!showMetadata) return

			const target = event.target as Node
			const isClickInsidePopover = popoverRef.current?.contains(target)
			const isClickInsideButton = infoButtonRef.current?.contains(target)

			if (!isClickInsidePopover && !isClickInsideButton) {
				closePopover()
			}
		}

		window.document.addEventListener('mousedown', handleClickOutside)
		return () => window.document.removeEventListener('mousedown', handleClickOutside)
	}, [showMetadata])

	const loadKnowledgeBase = async () => {
		try {
			const kb = await mockFetchKnowledgeBase(collectionId)
			setKnowledgeBase(kb)
		} catch (error) {
			console.error('Failed to load knowledge base:', error)
		}
	}

	const loadDocument = async () => {
		try {
			const doc = await mockFetchDocument(docId)
			setDocument(doc)
		} catch (error) {
			console.error('Failed to load document:', error)
		}
	}

	const loadDocumentContent = async () => {
		try {
			const content = await mockFetchDocumentContent(docId)
			setDocumentContent(content)
		} catch (error) {
			console.error('Failed to load document content:', error)
		}
	}

	useEffect(() => {
		if (visible && collectionId && docId) {
			const loadData = async () => {
				setLoading(true)
				await Promise.all([loadKnowledgeBase(), loadDocument(), loadDocumentContent()])
				setLoading(false)
			}
			loadData()
		}
	}, [visible, collectionId, docId])

	const getFileType = (filename: string) => {
		const extension = filename.split('.').pop()?.toLowerCase()
		const typeMap: { [key: string]: { label: string; color: string } } = {
			pdf: { label: 'PDF', color: '#ff4d4f' },
			doc: { label: 'DOC', color: '#1890ff' },
			docx: { label: 'DOCX', color: '#1890ff' },
			txt: { label: 'TXT', color: '#52c41a' },
			md: { label: 'MD', color: '#722ed1' },
			html: { label: 'HTML', color: '#fa8c16' }
		}
		return typeMap[extension || ''] || { label: 'FILE', color: '#8c8c8c' }
	}

	const getDocumentStatus = (status: string) => {
		const statusMap: {
			[key: string]: { icon: React.ReactNode; color: string; label: string }
		} = {
			ready: {
				icon: <CheckCircleOutlined />,
				color: 'var(--color_success)',
				label: is_cn ? '就绪' : 'Ready'
			},
			processing: {
				icon: <LoadingOutlined />,
				color: 'var(--color_warning)',
				label: is_cn ? '处理中' : 'Processing'
			},
			failed: {
				icon: <CloseCircleOutlined />,
				color: 'var(--color_danger)',
				label: is_cn ? '失败' : 'Failed'
			},
			indexing: {
				icon: <LoadingOutlined />,
				color: 'var(--color_info)',
				label: is_cn ? '索引中' : 'Indexing'
			}
		}
		return (
			statusMap[status] || {
				icon: <QuestionCircleOutlined />,
				color: 'var(--color_text_grey)',
				label: status
			}
		)
	}

	// 渲染文档内容
	const renderDocumentContent = () => {
		if (!documentContent) {
			return (
				<Empty
					image={Empty.PRESENTED_IMAGE_SIMPLE}
					description={is_cn ? '暂无文档内容' : 'No document content'}
				/>
			)
		}

		return (
			<div className={styles.contentViewer}>
				<div className={styles.documentContentWrapper}>
					<FileViewer
						__value={documentContent}
						onSave={() => {}}
						__namespace=''
						__name='documentContent'
						__primary=''
						__type='view'
						__bind=''
						preview={false}
						height='100%'
						style={{
							objectFit: 'cover'
						}}
					/>
				</div>
			</div>
		)
	}

	// 渲染切片浏览
	const renderChunks = () => {
		return <ChunkViewer docId={docId} collectionId={collectionId} />
	}

	if (loading) {
		return (
			<Modal
				open={visible}
				onCancel={onClose}
				footer={null}
				title={null}
				width='90%'
				style={{
					top: '5vh',
					paddingBottom: 0
				}}
				bodyStyle={{
					padding: 0,
					height: '90vh',
					overflow: 'hidden'
				}}
				className={styles.documentModal}
				closable={false}
				maskClosable={false}
			>
				<div className={styles.loading}>
					<Spin size='large' />
					<span>{is_cn ? '加载中...' : 'Loading...'}</span>
				</div>
			</Modal>
		)
	}

	const fileType = getFileType(document?.name || '')

	return (
		<Modal
			open={visible}
			onCancel={onClose}
			footer={null}
			title={null}
			width='90%'
			style={{
				top: '5vh',
				paddingBottom: 0
			}}
			bodyStyle={{
				padding: 0,
				height: '90vh',
				overflow: 'hidden'
			}}
			className={styles.documentModal}
			closable={false}
			maskClosable={false}
		>
			<div className={styles.modalContent}>
				{/* 头部导航 */}
				<div className={styles.header} style={{ position: 'relative' }}>
					<div className={styles.headerLeft}>
						<div className={styles.titleInfo}>
							<div className={styles.titleWithBadge}>
								<h1 className={styles.title}>{document?.name}</h1>
								<Tag color={fileType.color} className={styles.fileTypeTag}>
									{fileType.label}
								</Tag>
							</div>
						</div>
					</div>
					<div className={styles.headerRight}>
						<Tooltip title={is_cn ? '文档信息' : 'Document Info'}>
							<Button
								type='text'
								icon={<InfoCircleOutlined />}
								onClick={() => {
									if (showMetadata) {
										closePopover()
									} else {
										setShowMetadata(true)
									}
								}}
								className={`${styles.infoButton} ${showMetadata ? styles.active : ''}`}
								ref={infoButtonRef}
							/>
						</Tooltip>
						<Tooltip title={is_cn ? '更多操作' : 'More Actions'}>
							<Button type='text' icon={<MoreOutlined />} className={styles.moreButton} />
						</Tooltip>
						<Tooltip title={is_cn ? '关闭' : 'Close'}>
							<Button
								type='text'
								icon={<CloseOutlined />}
								className={styles.closeButton}
								onClick={onClose}
							/>
						</Tooltip>
					</div>
				</div>

				{/* 气泡式文档信息 */}
				{showMetadata && (
					<div
						className={`${styles.documentPopover} ${isClosing ? styles.closing : ''}`}
						ref={popoverRef}
					>
						{/* 三角形箭头 */}
						<div className={styles.popoverArrow} />
						<div className={styles.popoverArrowBorder} />

						{/* Card Header */}
						<div className={styles.popoverHeader}>
							<div className={styles.headerContent}>
								<div
									className={styles.fileIcon}
									style={{ backgroundColor: fileType.color }}
								>
									{fileType.label}
								</div>
								<div className={styles.fileName}>{document?.name}</div>
							</div>
						</div>

						{/* Card Body */}
						<div className={styles.popoverBody}>
							<div className={styles.metaInfo}>
								<ClockCircleOutlined />
								更新时间: {new Date(document?.updated_at || '').toLocaleString('zh-CN')}
							</div>

							<div className={styles.metaInfo}>
								<UserOutlined />
								作者: {document?.uid}
							</div>

							<div className={styles.metaInfo}>
								<DatabaseOutlined />
								所属集合: {document?.knowledge_base_name}
							</div>

							<div className={styles.metaInfo}>
								<FileTextOutlined />
								切片数量: {document?.chunk_count || 0}
							</div>

							<div
								className={`${styles.metaInfo} ${
									styles[`status-${document?.status || 'ready'}`] || ''
								}`}
							>
								{getDocumentStatus(document?.status || 'ready').icon}
								文档状态: {getDocumentStatus(document?.status || 'ready').label}
							</div>

							{document?.description && (
								<div className={styles.description}>{document.description}</div>
							)}
						</div>
					</div>
				)}

				{/* 主要内容区域 */}
				<div className={styles.content}>
					<Tabs
						activeKey={activeTab}
						onChange={setActiveTab}
						className={styles.contentTabs}
						items={[
							{
								key: 'content',
								label: (
									<div className={styles.tabLabel}>
										<FileTextOutlined />
										<span>{is_cn ? '文档内容' : 'Content'}</span>
									</div>
								),
								children: renderDocumentContent()
							},
							{
								key: 'chunks',
								label: (
									<div className={styles.tabLabel}>
										<DatabaseOutlined />
										<span>{is_cn ? '知识切片' : 'Knowledge Chunks'}</span>
									</div>
								),
								children: renderChunks()
							}
						]}
					/>
				</div>
			</div>
		</Modal>
	)
}

export default DocumentModal
