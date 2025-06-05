import { useState, useEffect } from 'react'
import { getLocale } from '@umijs/max'
import { Spin, Empty, Card, List, Input, Pagination } from 'antd'
import Icon from '@/widgets/Icon'
import { Chunk } from './types'
import styles from './index.less'

const { Search } = Input

interface ChunkViewerProps {
	docId: string
	collectionId: string
}

// 模拟API延迟
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Mock切片数据
const mockChunks: Chunk[] = [
	{
		id: '1',
		doc_id: 'doc_001',
		collection_id: 'kb_001',
		content: '人工智能（AI）技术正在快速发展，从机器学习到深度学习，从自然语言处理到计算机视觉，AI正在改变我们的生活和工作方式。本报告深入分析了当前AI技术的发展状况，探讨了主要的技术趋势，并对未来的发展方向进行了预测。',
		seek: 0,
		length: 156,
		created_at: '2024-01-15T10:30:00Z',
		updated_at: '2024-01-15T10:30:00Z'
	},
	{
		id: '2',
		doc_id: 'doc_001',
		collection_id: 'kb_001',
		content: '人工智能作为21世纪最重要的技术之一，正在各个领域产生深远的影响。从智能助手到自动驾驶，从医疗诊断到金融分析，AI技术的应用范围在不断扩展。',
		seek: 156,
		length: 98,
		created_at: '2024-01-15T10:30:00Z',
		updated_at: '2024-01-15T10:30:00Z'
	},
	{
		id: '3',
		doc_id: 'doc_001',
		collection_id: 'kb_001',
		content: '机器学习是AI的核心技术之一，包括监督学习、无监督学习和强化学习。当前主要的发展方向包括：深度学习网络的优化、联邦学习技术的推广、AutoML的普及应用。',
		seek: 254,
		length: 112,
		created_at: '2024-01-15T10:30:00Z',
		updated_at: '2024-01-15T10:30:00Z'
	},
	{
		id: '4',
		doc_id: 'doc_001',
		collection_id: 'kb_001',
		content: '大语言模型（LLM）的出现标志着NLP技术的重大突破：GPT系列模型的演进、多模态大模型的发展、专业领域模型的定制化。',
		seek: 366,
		length: 87,
		created_at: '2024-01-15T10:30:00Z',
		updated_at: '2024-01-15T10:30:00Z'
	},
	{
		id: '5',
		doc_id: 'doc_001',
		collection_id: 'kb_001',
		content: '计算机视觉技术在精度和效率上都有显著提升：目标检测算法的优化、图像生成技术的突破、3D视觉理解的进步。',
		seek: 453,
		length: 76,
		created_at: '2024-01-15T10:30:00Z',
		updated_at: '2024-01-15T10:30:00Z'
	},
	{
		id: '6',
		doc_id: 'doc_001',
		collection_id: 'kb_001',
		content: 'AI技术正在变得更加易用和普及：低代码/无代码AI平台、Pre-trained模型的广泛应用、开源AI工具的丰富。',
		seek: 529,
		length: 81,
		created_at: '2024-01-15T10:30:00Z',
		updated_at: '2024-01-15T10:30:00Z'
	},
	{
		id: '7',
		doc_id: 'doc_001',
		collection_id: 'kb_001',
		content: 'AI计算正在从云端向边缘迁移：模型轻量化技术、边缘设备的AI芯片、实时处理能力的提升。',
		seek: 610,
		length: 66,
		created_at: '2024-01-15T10:30:00Z',
		updated_at: '2024-01-15T10:30:00Z'
	},
	{
		id: '8',
		doc_id: 'doc_001',
		collection_id: 'kb_001',
		content: '随着AI应用的深入，可解释性变得越来越重要：XAI技术的发展、AI决策过程的透明化、伦理AI的实践。',
		seek: 676,
		length: 73,
		created_at: '2024-01-15T10:30:00Z',
		updated_at: '2024-01-15T10:30:00Z'
	}
]

// Mock API 函数
const mockFetchChunks = async (
	docId: string,
	page = 1,
	pageSize = 10,
	searchText = ''
): Promise<{ data: Chunk[]; total: number }> => {
	await delay(300)

	// 调试信息
	console.log('ChunkViewer received docId:', docId)
	console.log(
		'Available mock chunks with doc_ids:',
		mockChunks.map((c) => c.doc_id)
	)

	// 先尝试精确匹配，如果没有结果则返回所有数据（用于演示）
	let filteredChunks = mockChunks.filter((chunk) => chunk.doc_id === docId)

	// 如果没有匹配的数据，返回所有mock数据用于演示
	if (filteredChunks.length === 0) {
		console.log('No exact match found, returning all mock chunks for demo')
		filteredChunks = mockChunks
	}

	if (searchText.trim()) {
		const keyword = searchText.toLowerCase()
		filteredChunks = filteredChunks.filter((chunk) => chunk.content.toLowerCase().includes(keyword))
	}

	const startIndex = (page - 1) * pageSize
	const endIndex = startIndex + pageSize
	const data = filteredChunks.slice(startIndex, endIndex)

	return {
		data,
		total: filteredChunks.length
	}
}

const ChunkViewer: React.FC<ChunkViewerProps> = ({ docId, collectionId }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [chunks, setChunks] = useState<Chunk[]>([])
	const [loading, setLoading] = useState(false)
	const [searchText, setSearchText] = useState('')
	const [page, setPage] = useState(1)
	const [total, setTotal] = useState(0)
	const [pageSize] = useState(10)

	// 加载切片数据
	const loadChunks = async (currentPage = 1, search = '') => {
		try {
			setLoading(true)
			const result = await mockFetchChunks(docId, currentPage, pageSize, search)
			setChunks(result.data)
			setTotal(result.total)
		} catch (error) {
			console.error('Failed to load chunks:', error)
		} finally {
			setLoading(false)
		}
	}

	// 初始化加载
	useEffect(() => {
		if (docId) {
			loadChunks(page, searchText)
		}
	}, [docId, page, searchText])

	const handleSearch = (value: string) => {
		setSearchText(value)
		setPage(1)
	}

	const handlePageChange = (newPage: number) => {
		setPage(newPage)
	}

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<div className={styles.info}>
					<Icon name='material-view_module' size={20} />
					<span className={styles.title}>{is_cn ? '文档切片' : 'Document Chunks'}</span>
					<span className={styles.count}>
						({total} {is_cn ? '个切片' : 'chunks'})
					</span>
				</div>
				<div className={styles.actions}>
					<Search
						placeholder={is_cn ? '搜索切片内容...' : 'Search chunk content...'}
						allowClear
						enterButton
						size='middle'
						onSearch={handleSearch}
						className={styles.search}
					/>
				</div>
			</div>

			<div className={styles.content}>
				<Spin spinning={loading}>
					{chunks.length === 0 ? (
						<Empty
							image={Empty.PRESENTED_IMAGE_SIMPLE}
							description={
								searchText
									? is_cn
										? '未找到匹配的切片'
										: 'No matching chunks found'
									: is_cn
									? '暂无切片数据'
									: 'No chunks available'
							}
						/>
					) : (
						<List
							dataSource={chunks}
							renderItem={(chunk, index) => (
								<List.Item key={chunk.id}>
									<Card className={styles.chunkCard}>
										<div className={styles.chunkHeader}>
											<span className={styles.chunkIndex}>
												#{(page - 1) * pageSize + index + 1}
											</span>
											<div className={styles.chunkMeta}>
												<span className={styles.chunkPosition}>
													{is_cn ? '位置' : 'Position'}:{' '}
													{chunk.seek} - {chunk.seek + chunk.length}
												</span>
												<span className={styles.chunkLength}>
													{is_cn ? '长度' : 'Length'}:{' '}
													{chunk.length}
												</span>
											</div>
										</div>
										<div className={styles.chunkContent}>{chunk.content}</div>
									</Card>
								</List.Item>
							)}
						/>
					)}
				</Spin>
			</div>

			{total > pageSize && (
				<div className={styles.pagination}>
					<Pagination
						current={page}
						total={total}
						pageSize={pageSize}
						onChange={handlePageChange}
						showSizeChanger={false}
						showQuickJumper
						showTotal={(total, range) =>
							is_cn
								? `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
								: `${range[0]}-${range[1]} of ${total} items`
						}
					/>
				</div>
			)}
		</div>
	)
}

export default ChunkViewer
