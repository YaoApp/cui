import React, { useState, useEffect } from 'react'
import { Tag, Typography, message, Popconfirm } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
import { useGlobal } from '@/context/app'
import { Button } from '../../../components'
import { KB } from '@/openapi'
import type { GraphNode as APIGraphNode, GraphRelationship as APIGraphRelationship } from '@/openapi/kb/types'
import GraphVisualization from './GraphVisualization'
import styles from '../detail.less'
import localStyles from './index.less'

const { Text } = Typography

interface EntityNode {
	id: string
	name: string
	type: 'person' | 'organization' | 'location' | 'concept' | 'event' | 'object'
	level?: number // 1-3 级别
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
	docID: string
	onDataLoad?: (data: GraphData) => void
}

const GraphView: React.FC<GraphViewProps> = ({ segmentData, docID, onDataLoad }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'
	const global = useGlobal()
	const { kb: kbConfig } = global.app_info || {}

	const [loading, setLoading] = useState(false)
	const [extracting, setExtracting] = useState(false)
	const [graphData, setGraphData] = useState<GraphData | null>(null)

	// 数据转换函数：将 API 返回的数据转换为组件需要的格式
	const transformAPIDataToGraphData = (apiData: {
		entities?: APIGraphNode[]
		relationships?: APIGraphRelationship[]
		entities_count?: number
		relationships_count?: number
	}): GraphData => {
		// 安全地转换实体节点
		const nodes: EntityNode[] = []
		const nodeIds = new Set<string>()

		if (Array.isArray(apiData.entities)) {
			apiData.entities.forEach((entity) => {
				if (!entity || !entity.id) {
					console.warn('Invalid entity data:', entity)
					return
				}

				// 避免重复节点
				if (nodeIds.has(entity.id)) {
					console.warn('Duplicate entity ID:', entity.id)
					return
				}
				nodeIds.add(entity.id)

				// 从 labels 中推断实体类型
				const getEntityType = (labels: string[]): EntityNode['type'] => {
					const label = labels?.[0]?.toLowerCase() || ''
					if (label.includes('person') || label.includes('人')) return 'person'
					if (label.includes('organization') || label.includes('组织') || label.includes('公司'))
						return 'organization'
					if (label.includes('location') || label.includes('地点') || label.includes('位置'))
						return 'location'
					if (label.includes('event') || label.includes('事件')) return 'event'
					if (label.includes('object') || label.includes('物品')) return 'object'
					return 'concept'
				}

				// 从 properties 中获取名称，如果没有则使用 ID
				const getName = (properties: Record<string, any> | undefined): string => {
					return properties?.name || properties?.title || properties?.label || entity.id
				}

				nodes.push({
					id: entity.id,
					name: getName(entity.properties),
					type: getEntityType(entity.labels || []),
					level: 1, // 默认级别，可以后续根据算法优化
					properties: entity.properties || {}
				})
			})
		}

		// 安全地转换关系边，只保留有效的边
		const edges: RelationEdge[] = []
		if (Array.isArray(apiData.relationships)) {
			apiData.relationships.forEach((relationship) => {
				if (!relationship || !relationship.id || !relationship.start_node || !relationship.end_node) {
					console.warn('Invalid relationship data:', relationship)
					return
				}

				// 检查源节点和目标节点是否存在
				if (!nodeIds.has(relationship.start_node)) {
					console.warn(
						`Relationship source node not found: ${relationship.start_node}`,
						relationship
					)
					return
				}
				if (!nodeIds.has(relationship.end_node)) {
					console.warn(`Relationship target node not found: ${relationship.end_node}`, relationship)
					return
				}

				edges.push({
					id: relationship.id,
					source: relationship.start_node,
					target: relationship.end_node,
					relation: relationship.type || 'unknown',
					weight: 1.0 // 默认权重，可以后续从 properties 中获取
				})
			})
		}

		console.log('Transformed graph data:', {
			originalEntities: apiData.entities?.length || 0,
			validNodes: nodes.length,
			originalRelationships: apiData.relationships?.length || 0,
			validEdges: edges.length
		})

		return {
			id: segmentData.id,
			entity_count: apiData.entities_count || nodes.length,
			relation_count: apiData.relationships_count || edges.length,
			graph_data: {
				nodes,
				edges
			},
			metadata: segmentData.metadata
		}
	}

	useEffect(() => {
		loadGraphData()
	}, [segmentData.id])

	const loadGraphData = async () => {
		setLoading(true)
		try {
			// 使用真实的 API 调用
			if (window.$app?.openapi) {
				const kb = new KB(window.$app.openapi)
				const response = await kb.GetSegmentGraph(docID, segmentData.id, {
					include_entities: true,
					include_relationships: true
				})

				if (!window.$app.openapi.IsError(response) && response.data) {
					const transformedData = transformAPIDataToGraphData(response.data)
					setGraphData(transformedData)
					onDataLoad?.(transformedData)
					return
				} else if (window.$app.openapi.IsError(response)) {
					console.error('API Error:', response)
					// 如果是 404 或者没有数据，显示空状态
					if (response.status === 404 || response.error?.error_description?.includes('not found')) {
						setGraphData(null)
						return
					}
					throw new Error(response.error?.error_description || 'API request failed')
				}
			}

			// 如果没有 API 连接，设置为空状态
			console.warn('No API connection available')
			setGraphData(null)
		} catch (error) {
			console.error('Failed to load graph data:', error)
			message.error(is_cn ? '加载图谱数据失败' : 'Failed to load graph data')
			// 设置为 null 以显示空状态
			setGraphData(null)
		} finally {
			setLoading(false)
		}
	}

	const handleReExtract = async () => {
		setExtracting(true)
		// 清空当前图数据，显示加载状态
		setGraphData(null)

		try {
			// 使用真实的重新提取 API 调用
			if (window.$app?.openapi) {
				const kb = new KB(window.$app.openapi)
				const response = await kb.ExtractSegmentGraph(docID, segmentData.id)

				if (!window.$app.openapi.IsError(response) && response.data) {
					message.success(is_cn ? '重新提取成功' : 'Re-extraction successful')
					await loadGraphData()
					return
				} else if (window.$app.openapi.IsError(response)) {
					console.error('Re-extract API Error:', response)
					throw new Error(response.error?.error_description || 'Re-extraction failed')
				}
			}

			// 如果没有 API 连接，显示错误信息
			console.warn('No API connection available')
			throw new Error('API connection not available')
		} catch (error) {
			console.error('Failed to re-extract graph:', error)
			message.error(is_cn ? '重新提取失败' : 'Failed to re-extract graph')
			// 重新加载当前数据
			await loadGraphData()
		} finally {
			setExtracting(false)
		}
	}

	const handleConfirmReExtract = () => {
		// 立即执行异步操作，不等待完成
		handleReExtract()
		// 返回 undefined 让 Popconfirm 立即关闭
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
					<Popconfirm
						title={
							is_cn
								? '确定要重新提取知识图谱吗？这将重新分析文本并生成实体关系。'
								: 'Are you sure to re-extract the knowledge graph? This will re-analyze the text and generate entities and relationships.'
						}
						onConfirm={handleConfirmReExtract}
						okText={is_cn ? '确定' : 'Yes'}
						cancelText={is_cn ? '取消' : 'Cancel'}
						disabled={extracting}
					>
						<Button
							type='primary'
							size='small'
							className={localStyles.extractButton}
							disabled={extracting}
							loading={extracting}
							loadingIcon='material-refresh'
							icon={
								!extracting ? (
									<Icon name='material-auto_fix_high' size={12} />
								) : undefined
							}
						>
							{is_cn ? '重新提取' : 'Re-extract'}
						</Button>
					</Popconfirm>
				</div>
			</div>

			{/* Body - 图谱展示区域 */}
			<div className={localStyles.graphBody}>
				<div className={localStyles.graphSection}>
					{extracting ? (
						<div className={localStyles.extractingState}>
							<Icon
								name='material-auto_fix_high'
								size={32}
								style={{ marginBottom: '16px' }}
							/>
							<Text>
								{is_cn
									? '正在重新提取实体和关系...'
									: 'Re-extracting entities and relationships...'}
							</Text>
							<Text type='secondary' style={{ fontSize: '12px', marginTop: '8px' }}>
								{is_cn
									? '请稍候，此过程可能需要一些时间'
									: 'Please wait, this may take a while'}
							</Text>
						</div>
					) : loading ? (
						<div className={localStyles.loadingState}>
							<Icon name='material-hourglass_empty' size={32} />
							<Text>{is_cn ? '正在加载知识图谱...' : 'Loading knowledge graph...'}</Text>
						</div>
					) : !graphData || (graphData.entity_count === 0 && graphData.relation_count === 0) ? (
						<div className={localStyles.emptyState}>
							<Icon name='material-account_tree' size={48} />
							<Text type='secondary'>
								{is_cn ? '暂无图谱数据' : 'No graph data available'}
							</Text>
							<Text type='secondary' style={{ fontSize: '12px', marginTop: '8px' }}>
								{is_cn
									? '点击"重新提取"按钮生成知识图谱'
									: 'Click "Re-extract" to generate knowledge graph'}
							</Text>
						</div>
					) : (
						<div className={localStyles.graphContent}>
							{/* 图谱可视化组件 */}
							<GraphVisualization
								nodes={graphData.graph_data.nodes}
								edges={graphData.graph_data.edges}
							/>
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
