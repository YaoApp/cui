import React, { useState, useEffect } from 'react'
import { Button, Tree, Typography, Tag, Empty, Collapse } from 'antd'
import type { TreeDataNode } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import styles from './index.less'

const { Text, Paragraph } = Typography
const { Panel } = Collapse

interface ParentChunk {
	id: string
	text: string
	level: number
	weight: number
	children?: ParentChunk[]
	metadata?: {
		source_page?: number
		source_line?: number
		section?: string
	}
}

interface ParentsViewProps {
	chunkId: string
	onChunkSelect?: (chunk: ParentChunk) => void
}

const ParentsView: React.FC<ParentsViewProps> = ({ chunkId, onChunkSelect }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const [loading, setLoading] = useState(false)
	const [parentsData, setParentsData] = useState<ParentChunk[]>([])
	const [selectedChunkId, setSelectedChunkId] = useState<string>(chunkId)
	const [expandedKeys, setExpandedKeys] = useState<string[]>([])

	// 模拟父级分段数据（三层结构）
	const mockParentsData: ParentChunk[] = [
		{
			id: 'parent_1',
			text: '人工智能是计算机科学的一个分支，它企图了解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器，包括机器人、语言识别、图像识别、自然语言处理和专家系统等。人工智能从诞生以来，理论和技术日益成熟，应用领域也不断扩大。可以设想，未来人工智能带来的科技产品，将会是人类智慧的"容器"。',
			level: 1,
			weight: 0.95,
			metadata: { source_page: 1, section: '第一章 人工智能概述' },
			children: [
				{
					id: 'parent_2_1',
					text: '机器学习是人工智能的一个重要分支，它让计算机能够通过数据自动学习和改进，而无需明确编程。机器学习算法通过构建数学模型来基于训练数据进行预测或决策。它广泛应用于计算机视觉、自然语言处理、语音识别等领域。',
					level: 2,
					weight: 0.88,
					metadata: { source_page: 3, section: '1.1 机器学习基础' },
					children: [
						{
							id: 'current_chunk',
							text: '深度学习是机器学习的一个子集，它基于人工神经网络，特别是深层神经网络。深度学习在图像识别、语音识别、自然语言处理等领域取得了突破性进展，推动了人工智能的快速发展。',
							level: 3,
							weight: 0.82,
							metadata: { source_page: 5, section: '1.1.1 深度学习原理' }
						}
					]
				},
				{
					id: 'parent_2_2',
					text: '自然语言处理（NLP）是人工智能和语言学领域的分支学科。在NLP中，计算机和人类（自然）语言进行交互。NLP的终极目标是让计算机能够理解、解释和生成人类语言，从而实现人机之间的自然语言通信。',
					level: 2,
					weight: 0.85,
					metadata: { source_page: 8, section: '1.2 自然语言处理' },
					children: [
						{
							id: 'parent_3_1',
							text: '语言模型是自然语言处理的核心组件，它用于计算语言序列的概率。现代语言模型如GPT、BERT等基于Transformer架构，能够捕捉语言的复杂模式和语义关系。',
							level: 3,
							weight: 0.79,
							metadata: { source_page: 10, section: '1.2.1 语言模型基础' }
						}
					]
				}
			]
		}
	]

	useEffect(() => {
		loadParentsData()
	}, [chunkId])

	const loadParentsData = async () => {
		setLoading(true)
		try {
			// 模拟API调用
			await new Promise((resolve) => setTimeout(resolve, 800))
			setParentsData(mockParentsData)
			// 默认展开所有层级
			const keys = extractAllKeys(mockParentsData)
			setExpandedKeys(keys)
		} catch (error) {
			console.error('Failed to load parents data:', error)
		} finally {
			setLoading(false)
		}
	}

	const extractAllKeys = (data: ParentChunk[]): string[] => {
		const keys: string[] = []
		const traverse = (chunks: ParentChunk[]) => {
			chunks.forEach((chunk) => {
				keys.push(chunk.id)
				if (chunk.children) {
					traverse(chunk.children)
				}
			})
		}
		traverse(data)
		return keys
	}

	const handleChunkClick = (chunk: ParentChunk) => {
		setSelectedChunkId(chunk.id)
		onChunkSelect?.(chunk)
	}

	const truncateText = (text: string, maxLength: number = 200) => {
		if (text.length <= maxLength) return text
		return text.substring(0, maxLength) + '...'
	}

	const getLevelColor = (level: number) => {
		const colors = ['blue', 'green', 'orange']
		return colors[level - 1] || 'default'
	}

	const getLevelLabel = (level: number) => {
		if (is_cn) {
			return ['一级分段', '二级分段', '三级分段'][level - 1] || `${level}级分段`
		}
		return ['Level 1', 'Level 2', 'Level 3'][level - 1] || `Level ${level}`
	}

	// 转换为Tree组件需要的数据格式
	const convertToTreeData = (chunks: ParentChunk[]): TreeDataNode[] => {
		return chunks.map((chunk) => ({
			key: chunk.id,
			title: (
				<div
					className={`${styles.treeNode} ${
						chunk.id === selectedChunkId ? styles.currentChunk : ''
					}`}
					onClick={() => handleChunkClick(chunk)}
				>
					<div className={styles.nodeHeader}>
						<Tag color={getLevelColor(chunk.level)}>{getLevelLabel(chunk.level)}</Tag>
						<Tag color='purple'>Weight: {chunk.weight.toFixed(2)}</Tag>
						{chunk.metadata?.section && <Tag>{chunk.metadata.section}</Tag>}
					</div>
					<div className={styles.nodeContent}>
						<Text style={{ fontSize: 12, lineHeight: 1.5 }}>{truncateText(chunk.text)}</Text>
					</div>
					{chunk.metadata?.source_page && (
						<div className={styles.nodeFooter}>
							<Icon name='material-location_on' size={12} />
							<Text type='secondary' style={{ fontSize: 11 }}>
								{is_cn
									? `第${chunk.metadata.source_page}页`
									: `Page ${chunk.metadata.source_page}`}
							</Text>
						</div>
					)}
				</div>
			),
			children: chunk.children ? convertToTreeData(chunk.children) : undefined,
			isLeaf: !chunk.children || chunk.children.length === 0
		}))
	}

	const renderDetailView = () => {
		const selectedChunk = findChunkById(parentsData, selectedChunkId)
		if (!selectedChunk) return null

		return (
			<div className={styles.detailView}>
				<h4 className={styles.detailTitle}>
					<Icon name='material-preview' size={14} />
					{is_cn ? '分段详情' : 'Chunk Details'}
				</h4>

				<div className={styles.detailMeta}>
					<Tag color={getLevelColor(selectedChunk.level)}>{getLevelLabel(selectedChunk.level)}</Tag>
					<Tag color='purple'>Weight: {selectedChunk.weight.toFixed(2)}</Tag>
					{selectedChunk.metadata?.section && <Tag>{selectedChunk.metadata.section}</Tag>}
				</div>

				<div className={styles.detailContent}>
					<Paragraph style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
						{selectedChunk.text}
					</Paragraph>
				</div>

				{selectedChunk.metadata && (
					<div className={styles.detailMeta}>
						{selectedChunk.metadata.source_page && (
							<div className={styles.metaItem}>
								<Icon name='material-location_on' size={12} />
								<Text type='secondary' style={{ fontSize: 11 }}>
									{is_cn
										? `第${selectedChunk.metadata.source_page}页`
										: `Page ${selectedChunk.metadata.source_page}`}
								</Text>
							</div>
						)}
					</div>
				)}
			</div>
		)
	}

	const findChunkById = (chunks: ParentChunk[], id: string): ParentChunk | null => {
		for (const chunk of chunks) {
			if (chunk.id === id) return chunk
			if (chunk.children) {
				const found = findChunkById(chunk.children, id)
				if (found) return found
			}
		}
		return null
	}

	return (
		<div className={styles.parentsView}>
			{/* 标题区域 */}
			<div className={styles.header}>
				<div className={styles.titleSection}>
					<Icon name='material-account_tree' size={16} />
					<h3 className={styles.title}>{is_cn ? '上级分段' : 'Parent Chunks'}</h3>
				</div>
				<div className={styles.actionSection}>
					<Button
						size='small'
						icon={<Icon name='material-refresh' size={14} />}
						onClick={loadParentsData}
						loading={loading}
					>
						{is_cn ? '刷新' : 'Refresh'}
					</Button>
				</div>
			</div>

			{/* 内容区域 */}
			{loading ? (
				<div className={styles.loadingState}>
					<Icon name='material-hourglass_empty' size={32} />
					<Text>{is_cn ? '正在加载上级分段...' : 'Loading parent chunks...'}</Text>
				</div>
			) : parentsData.length === 0 ? (
				<Empty
					image={<Icon name='material-account_tree' size={48} />}
					description={is_cn ? '暂无上级分段数据' : 'No parent chunks data'}
				/>
			) : (
				<div className={styles.contentArea}>
					{/* 层级树形视图 */}
					<div className={styles.treeSection}>
						<h4 className={styles.sectionTitle}>
							<Icon name='material-device_hub' size={14} />
							{is_cn ? '分段层级结构' : 'Chunk Hierarchy'}
						</h4>
						<Tree
							treeData={convertToTreeData(parentsData)}
							defaultExpandAll
							expandedKeys={expandedKeys}
							onExpand={(keys) => setExpandedKeys(keys as string[])}
							className={styles.chunkTree}
							showLine={{ showLeafIcon: false }}
							selectable={false}
						/>
					</div>

					{/* 详情视图 */}
					{renderDetailView()}
				</div>
			)}
		</div>
	)
}

export default ParentsView
