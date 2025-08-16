import React, { useState, useEffect } from 'react'
import { Button, Tag, Typography, message } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { useGlobal } from '@/context/app'
import { KB } from '@/openapi'
import styles from '../detail.less'
import localStyles from './index.less'

const { Text } = Typography

interface EntityNode {
	id: string
	name: string
	type: 'person' | 'organization' | 'location' | 'concept' | 'event' | 'object'
	properties?: Record<string, any>
}

interface RelationEdge {
	id: string
	source: string
	target: string
	relation: string
	weight: number
}

interface KnowledgeGraphData {
	nodes: EntityNode[]
	edges: RelationEdge[]
}

interface GraphData {
	id: string
	entity_count: number
	relation_count: number
	graph_data: KnowledgeGraphData
	metadata?: {
		chunk_details?: {
			depth?: number
			index?: number
		}
	}
}

interface GraphViewProps {
	segmentData: {
		id: string
		metadata?: {
			chunk_details?: {
				depth?: number
				index?: number
			}
		}
	}
	onDataLoad?: (data: GraphData) => void
}

const GraphView: React.FC<GraphViewProps> = ({ segmentData, onDataLoad }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const global = useGlobal()
	const { kb: kbConfig } = global.app_info || {}

	const [loading, setLoading] = useState(false)
	const [extracting, setExtracting] = useState(false)
	const [graphData, setGraphData] = useState<GraphData | null>(null)

	// 模拟图谱数据
	const mockGraphData: GraphData = {
		id: segmentData.id,
		entity_count: 6,
		relation_count: 5,
		graph_data: {
			nodes: [
				{ id: '1', name: '机器学习', type: 'concept', properties: { category: 'AI技术' } },
				{ id: '2', name: '深度学习', type: 'concept', properties: { category: 'AI技术' } },
				{ id: '3', name: '神经网络', type: 'concept', properties: { category: '算法' } },
				{ id: '4', name: 'OpenAI', type: 'organization', properties: { founded: '2015' } },
				{ id: '5', name: 'GPT模型', type: 'concept', properties: { type: '语言模型' } },
				{ id: '6', name: '自然语言处理', type: 'concept', properties: { domain: 'NLP' } }
			],
			edges: [
				{ id: 'e1', source: '2', target: '1', relation: '属于', weight: 0.9 },
				{ id: 'e2', source: '3', target: '2', relation: '基础', weight: 0.8 },
				{ id: 'e3', source: '4', target: '5', relation: '开发', weight: 0.95 },
				{ id: 'e4', source: '5', target: '6', relation: '应用于', weight: 0.85 },
				{ id: 'e5', source: '5', target: '2', relation: '基于', weight: 0.9 }
			]
		},
		metadata: segmentData.metadata
	}

	useEffect(() => {
		loadGraphData()
	}, [segmentData.id])

	const loadGraphData = async () => {
		setLoading(true)
		try {
			// TODO: 实际的 API 调用
			// if (window.$app?.openapi) {
			// 	const kb = new KB(window.$app.openapi)
			// 	const response = await kb.GetSegmentGraph(segmentData.id)
			// 	if (!window.$app.openapi.IsError(response) && response.data) {
			// 		setGraphData(response.data)
			// 		onDataLoad?.(response.data)
			// 		return
			// 	}
			// }

			// 模拟 API 调用延迟
			await new Promise((resolve) => setTimeout(resolve, 1000))
			setGraphData(mockGraphData)
			onDataLoad?.(mockGraphData)
		} catch (error) {
			console.error('Failed to load graph data:', error)
			message.error(is_cn ? '加载图谱数据失败' : 'Failed to load graph data')
		} finally {
			setLoading(false)
		}
	}

	const handleReExtract = async () => {
		setExtracting(true)
		try {
			// TODO: 实际的重新提取 API 调用
			// if (window.$app?.openapi) {
			// 	const kb = new KB(window.$app.openapi)
			// 	const response = await kb.ReExtractSegmentGraph(segmentData.id)
			// 	if (!window.$app.openapi.IsError(response)) {
			// 		message.success(is_cn ? '重新提取成功' : 'Re-extraction successful')
			// 		await loadGraphData()
			// 		return
			// 	}
			// }

			// 模拟重新提取
			await new Promise((resolve) => setTimeout(resolve, 2000))
			message.success(is_cn ? '重新提取成功' : 'Re-extraction successful')
			await loadGraphData()
		} catch (error) {
			console.error('Failed to re-extract graph:', error)
			message.error(is_cn ? '重新提取失败' : 'Failed to re-extract graph')
		} finally {
			setExtracting(false)
		}
	}

	return (
		<div className={styles.tabContent}>
			{/* Header - 与 Editor 一致的头部风格 */}
			<div className={`${styles.tabHeader} ${localStyles.cardHeader}`}>
				<div className={localStyles.chunkMeta}>
					<span className={localStyles.chunkNumber}>
						{segmentData.metadata?.chunk_details?.depth !== undefined &&
						segmentData.metadata?.chunk_details?.index !== undefined ? (
							<>
								<span className={localStyles.levelInfo}>
									<Icon name='material-account_tree' size={10} />
									{segmentData.metadata.chunk_details.depth}
								</span>
								<span>#{segmentData.metadata.chunk_details.index + 1}</span>
							</>
						) : (
							`#${segmentData.id.slice(-8)}`
						)}
					</span>
				</div>
				<div className={localStyles.metaInfo}>
					<span className={localStyles.metaItem}>
						{is_cn ? '实体' : 'Entities'}{' '}
						<span className={localStyles.metaNumber}>{graphData?.entity_count || 0}</span>
					</span>
					<span className={localStyles.metaItem}>
						{is_cn ? '关系' : 'Relations'}{' '}
						<span className={localStyles.metaNumber}>{graphData?.relation_count || 0}</span>
					</span>
				</div>
				<div className={localStyles.actionSection}>
					<Button
						type='primary'
						size='small'
						className={localStyles.extractButton}
						onClick={handleReExtract}
						loading={extracting}
					>
						<Icon name='material-auto_fix_high' size={14} />
						<span>{is_cn ? '重新提取' : 'Re-extract'}</span>
					</Button>
				</div>
			</div>

			{/* Body - 图谱展示区域 */}
			<div className={localStyles.graphBody}>
				<div className={localStyles.graphSection}>
					{loading ? (
						<div className={localStyles.loadingState}>
							<Icon name='material-hourglass_empty' size={32} />
							<Text>{is_cn ? '正在加载知识图谱...' : 'Loading knowledge graph...'}</Text>
						</div>
					) : !graphData ? (
						<div className={localStyles.emptyState}>
							<Icon name='material-account_tree' size={48} />
							<Text type='secondary'>
								{is_cn ? '暂无图谱数据' : 'No graph data available'}
							</Text>
						</div>
					) : (
						<div className={localStyles.graphContent}>
							{/* 图谱可视化区域 - 待集成可视化库 */}
							<div className={localStyles.graphPlaceholder}>
								<Icon name='material-account_tree' size={48} />
								<Text type='secondary'>
									{is_cn ? '图谱可视化区域' : 'Graph Visualization Area'}
								</Text>
								<Text type='secondary' style={{ fontSize: 12, marginTop: 8 }}>
									{is_cn
										? `${graphData.entity_count} 个实体，${graphData.relation_count} 个关系`
										: `${graphData.entity_count} entities, ${graphData.relation_count} relations`}
								</Text>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Footer - 关系路径等操作区域 */}
			<div className={localStyles.graphFooter}>{/* 预留给后续的关系路径展示和操作 */}</div>
		</div>
	)
}

export default GraphView
