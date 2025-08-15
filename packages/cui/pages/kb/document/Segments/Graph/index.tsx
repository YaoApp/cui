import React, { useState, useEffect, useRef } from 'react'
import { Button, Select, Tag, Typography, Empty } from 'antd'
import { getLocale } from '@umijs/max'
import Icon from '@/widgets/Icon'
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

interface KnowledgeGraphProps {
	chunkId: string
	onDataLoad?: (data: KnowledgeGraphData) => void
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ chunkId, onDataLoad }) => {
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	const containerRef = useRef<HTMLDivElement>(null)
	const [loading, setLoading] = useState(false)
	const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null)
	const [selectedLayout, setSelectedLayout] = useState('force')
	const [selectedEntity, setSelectedEntity] = useState<EntityNode | null>(null)

	// 模拟知识图谱数据
	const mockGraphData: KnowledgeGraphData = {
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
	}

	useEffect(() => {
		loadKnowledgeGraph()
	}, [chunkId])

	const loadKnowledgeGraph = async () => {
		setLoading(true)
		try {
			// 模拟API调用
			await new Promise((resolve) => setTimeout(resolve, 1000))
			setGraphData(mockGraphData)
			onDataLoad?.(mockGraphData)
		} catch (error) {
			console.error('Failed to load knowledge graph:', error)
		} finally {
			setLoading(false)
		}
	}

	const getEntityTypeColor = (type: EntityNode['type']) => {
		const colors = {
			person: 'blue',
			organization: 'green',
			location: 'orange',
			concept: 'purple',
			event: 'red',
			object: 'cyan'
		}
		return colors[type] || 'default'
	}

	const getEntityTypeIcon = (type: EntityNode['type']) => {
		const icons = {
			person: 'material-person',
			organization: 'material-business',
			location: 'material-location_on',
			concept: 'material-lightbulb',
			event: 'material-event',
			object: 'material-category'
		}
		return icons[type] || 'material-help'
	}

	const layoutOptions = [
		{ value: 'force', label: is_cn ? '力导向布局' : 'Force Layout' },
		{ value: 'circular', label: is_cn ? '环形布局' : 'Circular Layout' },
		{ value: 'hierarchical', label: is_cn ? '层次布局' : 'Hierarchical Layout' },
		{ value: 'grid', label: is_cn ? '网格布局' : 'Grid Layout' }
	]

	const renderEntityList = () => {
		if (!graphData?.nodes.length) return null

		return (
			<div className={localStyles.entityList}>
				<h4 className={localStyles.sectionTitle}>
					<Icon name='material-account_tree' size={14} />
					{is_cn ? '实体列表' : 'Entity List'}
				</h4>
				<div className={localStyles.entityItems}>
					{graphData.nodes.map((node) => (
						<div
							key={node.id}
							className={`${localStyles.entityItem} ${
								selectedEntity?.id === node.id ? localStyles.selected : ''
							}`}
							onClick={() =>
								setSelectedEntity(selectedEntity?.id === node.id ? null : node)
							}
						>
							<Icon name={getEntityTypeIcon(node.type)} size={14} />
							<span className={localStyles.entityName}>{node.name}</span>
							<Tag color={getEntityTypeColor(node.type)}>{node.type}</Tag>
						</div>
					))}
				</div>
			</div>
		)
	}

	const renderRelationList = () => {
		if (!graphData?.edges.length) return null

		const filteredEdges = selectedEntity
			? graphData.edges.filter(
					(edge) => edge.source === selectedEntity.id || edge.target === selectedEntity.id
			  )
			: graphData.edges

		return (
			<div className={localStyles.relationList}>
				<h4 className={localStyles.sectionTitle}>
					<Icon name='material-device_hub' size={14} />
					{is_cn ? '关系列表' : 'Relations'}
					{selectedEntity && (
						<Text type='secondary' style={{ fontSize: 12, marginLeft: 8 }}>
							({selectedEntity.name})
						</Text>
					)}
				</h4>
				<div className={localStyles.relationItems}>
					{filteredEdges.map((edge) => {
						const sourceNode = graphData.nodes.find((n) => n.id === edge.source)
						const targetNode = graphData.nodes.find((n) => n.id === edge.target)

						return (
							<div key={edge.id} className={localStyles.relationItem}>
								<div className={localStyles.relationFlow}>
									<span className={localStyles.entityRef}>{sourceNode?.name}</span>
									<Icon name='material-arrow_forward' size={12} />
									<span className={localStyles.relationLabel}>{edge.relation}</span>
									<Icon name='material-arrow_forward' size={12} />
									<span className={localStyles.entityRef}>{targetNode?.name}</span>
								</div>
								<div className={localStyles.relationWeight}>
									<Text type='secondary' style={{ fontSize: 11 }}>
										{(edge.weight * 100).toFixed(0)}%
									</Text>
								</div>
							</div>
						)
					})}
				</div>
			</div>
		)
	}

	return (
		<div className={styles.tabContent}>
			{/* Head */}
			<div className={styles.tabHeader}>
				<div className={styles.tabTitle}>
					<Icon name='material-account_tree' size={16} />
					<span>{is_cn ? '知识图谱' : 'Knowledge Graph'}</span>
				</div>
				<div className={localStyles.controlSection}>
					<Select
						value={selectedLayout}
						onChange={setSelectedLayout}
						options={layoutOptions}
						size='small'
						style={{ width: 140 }}
					/>
					<Button
						size='small'
						icon={<Icon name='material-refresh' size={14} />}
						onClick={loadKnowledgeGraph}
						loading={loading}
					>
						{is_cn ? '刷新' : 'Refresh'}
					</Button>
				</div>
			</div>

			{/* Body */}
			<div className={localStyles.graphBody}>
				{/* 图谱可视化区域 */}
				<div className={localStyles.graphContainer}>
					{loading ? (
						<div className={localStyles.loadingState}>
							<Icon name='material-hourglass_empty' size={32} />
							<Text>{is_cn ? '正在加载知识图谱...' : 'Loading knowledge graph...'}</Text>
						</div>
					) : !graphData ? (
						<Empty
							image={<Icon name='material-account_tree' size={48} />}
							description={is_cn ? '暂无知识图谱数据' : 'No knowledge graph data'}
						/>
					) : (
						<div className={localStyles.graphContent}>
							{/* 这里将来可以集成图形可视化库如 D3.js, vis.js 等 */}
							<div className={localStyles.graphPlaceholder}>
								<Icon name='material-account_tree' size={48} />
								<Text type='secondary'>
									{is_cn
										? '图形可视化区域 (待集成可视化库)'
										: 'Graph Visualization Area (Visualization library to be integrated)'}
								</Text>
								<Text type='secondary' style={{ fontSize: 12, marginTop: 8 }}>
									{is_cn
										? `当前布局: ${
												layoutOptions.find(
													(opt) => opt.value === selectedLayout
												)?.label
										  }`
										: `Current Layout: ${
												layoutOptions.find(
													(opt) => opt.value === selectedLayout
												)?.label
										  }`}
								</Text>
							</div>
						</div>
					)}
				</div>

				{/* 数据展示区域 */}
				{graphData && (
					<div className={localStyles.dataSection}>
						{renderEntityList()}
						{renderRelationList()}
					</div>
				)}
			</div>
		</div>
	)
}

export default KnowledgeGraph
