import { useCallback, useEffect, useRef, useMemo } from 'react'
import ReactFlow, {
	Background,
	Controls,
	Node,
	Edge,
	NodeTypes,
	BackgroundVariant,
	Panel,
	ReactFlowProvider,
	useReactFlow,
	MarkerType
} from 'reactflow'
import { getLocale } from '@umijs/max'
import dagre from 'dagre'
import 'reactflow/dist/style.css'
import TraceNode from './components/TraceNode'
import MemoryCard from './components/MemoryCard'
import styles from './index.less'

interface DefaultViewProps {
	traceId: string
	onSwitchMode: () => void
}

// 节点宽度和高度（需要与 TraceNode 的实际尺寸一致）
const NODE_WIDTH = 200
const NODE_HEIGHT = 120
const ZOOM_LEVEL = 0.9

const nodeTypes: NodeTypes = {
	traceNode: TraceNode
}

// 使用 dagre 自动布局
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
	const dagreGraph = new dagre.graphlib.Graph()
	;(dagreGraph as any).setDefaultEdgeLabel(() => ({}))
	dagreGraph.setGraph({
		rankdir: direction,
		nodesep: 80, // 节点水平间距
		ranksep: 100, // 节点垂直间距（层级间距）
		align: undefined // 居中对齐（默认）
	})

	nodes.forEach((node) => {
		dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
	})

	edges.forEach((edge) => {
		dagreGraph.setEdge(edge.source, edge.target)
	})

	dagre.layout(dagreGraph)

	const layoutedNodes = nodes.map((node) => {
		const nodeWithPosition = dagreGraph.node(node.id) as { x: number; y: number }
		return {
			...node,
			position: {
				x: nodeWithPosition.x - NODE_WIDTH / 2,
				y: nodeWithPosition.y - NODE_HEIGHT / 2
			}
		}
	})

	return { nodes: layoutedNodes, edges }
}

// 原始节点数据（不含位置，由 dagre 自动计算）
const rawNodes: Node[] = [
	{
		id: 'start',
		type: 'traceNode',
		position: { x: 0, y: 0 },
		data: {
			label: 'Start',
			description: '开始执行',
			type: 'start',
			status: 'success',
			duration: 10
		}
	},
	{
		id: 'search-1',
		type: 'traceNode',
		position: { x: 0, y: 180 },
		data: {
			label: 'Search Data',
			description: '检索相关数据',
			type: 'search',
			status: 'success',
			duration: 1200
		}
	},
	{
		id: 'query-1',
		type: 'traceNode',
		position: { x: -190, y: 360 },
		data: {
			label: 'Query Database',
			description: '查询产品信息',
			type: 'query',
			status: 'success',
			duration: 850
		}
	},
	{
		id: 'query-2',
		type: 'traceNode',
		position: { x: 190, y: 360 },
		data: {
			label: 'Query Specs',
			description: '查询规格参数',
			type: 'query',
			status: 'running',
			duration: undefined
		}
	},
	{
		id: 'query-3',
		type: 'traceNode',
		position: { x: 380, y: 360 },
		data: {
			label: 'Query Cache',
			description: '查询缓存失败',
			type: 'query',
			status: 'error',
			duration: 150,
			error: 'Connection timeout'
		}
	},
	{
		id: 'llm-1',
		type: 'traceNode',
		position: { x: 0, y: 540 },
		data: {
			label: 'LLM Processing',
			description: '大模型推理分析',
			type: 'llm',
			status: 'pending',
			duration: undefined
		}
	},
	{
		id: 'format-1',
		type: 'traceNode',
		position: { x: 0, y: 720 },
		data: {
			label: 'Format Result',
			description: '整理输出格式',
			type: 'format',
			status: 'pending',
			duration: undefined
		}
	},
	{
		id: 'complete',
		type: 'traceNode',
		position: { x: 0, y: 900 },
		data: {
			label: 'Complete',
			description: '执行完成',
			type: 'complete',
			status: 'pending',
			duration: undefined
		}
	}
]

const rawEdges: Edge[] = [
	{
		id: 'e-start-search',
		source: 'start',
		target: 'search-1',
		type: 'default',
		animated: false,
		style: { stroke: 'var(--color_success)', strokeWidth: 2 },
		markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color_success)', width: 8, height: 8 }
	},
	{
		id: 'e-search-query1',
		source: 'search-1',
		target: 'query-1',
		type: 'default',
		animated: false,
		style: { stroke: 'var(--color_success)', strokeWidth: 2 },
		markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color_success)', width: 8, height: 8 }
	},
	{
		id: 'e-search-query2',
		source: 'search-1',
		target: 'query-2',
		type: 'default',
		animated: true,
		style: { stroke: 'var(--color_main)', strokeWidth: 2 },
		markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color_main)', width: 8, height: 8 }
	},
	{
		id: 'e-search-query3',
		source: 'search-1',
		target: 'query-3',
		type: 'default',
		animated: false,
		style: { stroke: 'var(--color_danger)', strokeWidth: 2 },
		markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color_danger)', width: 8, height: 8 }
	},
	{
		id: 'e-query1-llm',
		source: 'query-1',
		target: 'llm-1',
		type: 'default',
		animated: false,
		style: { stroke: 'var(--color_border)', strokeWidth: 2 },
		markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color_border)', width: 8, height: 8 }
	},
	{
		id: 'e-query2-llm',
		source: 'query-2',
		target: 'llm-1',
		type: 'default',
		animated: false,
		style: { stroke: 'var(--color_border)', strokeWidth: 2 },
		markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color_border)', width: 8, height: 8 }
	},
	{
		id: 'e-llm-format',
		source: 'llm-1',
		target: 'format-1',
		type: 'default',
		animated: false,
		style: { stroke: 'var(--color_border)', strokeWidth: 2 },
		markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color_border)', width: 8, height: 8 }
	},
	{
		id: 'e-format-complete',
		source: 'format-1',
		target: 'complete',
		type: 'default',
		animated: false,
		style: { stroke: 'var(--color_border)', strokeWidth: 2 },
		markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--color_border)', width: 8, height: 8 }
	}
]

// Mock Memory 数据 - 模拟产品详情页开发场景
const mockMemoryData = [
	{
		id: 'mem-1',
		type: 'context' as const,
		title: '当前任务上下文',
		content: '正在开发电商平台的产品详情页面，需要实现规格参数展示、SKU 选择器、价格计算、库存查询、购物车联动等核心功能模块',
		count: 3,
		items: [
			'正在开发电商平台的产品详情页面，需要实现规格参数展示、SKU 选择器、价格计算等核心功能',
			'用户需求包括：支持多规格组合选择（颜色/尺寸/版本），实时库存状态展示，动态价格计算',
			'技术栈使用 React + TypeScript + Ant Design，需要考虑移动端适配和性能优化'
		]
	},
	{
		id: 'mem-2',
		type: 'intent' as const,
		title: '开发意图分析',
		content: '实现用户可交互的 SKU 选择组件，支持多规格组合（颜色、尺寸、版本），动态计算价格和库存状态，优化移动端触控体验',
		count: 1,
		items: ['核心目标：构建高性能、用户体验良好的 SKU 选择交互组件，支持复杂规格组合场景']
	},
	{
		id: 'mem-3',
		type: 'knowledge' as const,
		title: '相关技术文档',
		content: 'React Hooks 最佳实践、SKU 算法实现方案、Ant Design 表单组件文档、商品数据结构设计规范、库存服务 API 接口文档',
		count: 5,
		items: [
			'React Hooks 最佳实践：使用 useMemo 优化 SKU 计算性能，useCallback 避免不必要的重渲染',
			'SKU 算法实现方案：基于笛卡尔积生成所有规格组合，使用哈希表快速查找库存状态',
			'Ant Design 表单组件文档：Radio.Group 用于单选规格，Checkbox.Group 用于多选场景',
			'商品数据结构设计规范：包含 spuId、skuList、priceRange、stockStatus 等核心字段',
			'库存服务 API 接口文档：GET /api/stock/check 实时查询库存，支持批量查询和缓存策略'
		]
	},
	{
		id: 'mem-4',
		type: 'history' as const,
		title: '历史开发记录',
		content: '上周完成了商品列表页的筛选功能和分页加载，本周聚焦详情页开发，团队反馈需要优化图片懒加载和首屏渲染性能',
		count: 2,
		items: [
			'上周完成：商品列表页筛选功能（价格区间、品牌、分类），虚拟滚动实现长列表优化',
			'本周计划：产品详情页 SKU 选择器开发，图片懒加载优化，首屏 LCP 性能提升至 2 秒内'
		]
	}
]

// 内部组件用于访问 ReactFlow 实例
const FlowContent: React.FC<{
	traceId: string
	onSwitchMode: () => void
}> = ({ traceId, onSwitchMode }) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const reactFlowInstance = useReactFlow()
	const onNodesChange = useCallback(() => {}, [])
	const onEdgesChange = useCallback(() => {}, [])
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// 使用 dagre 自动布局计算节点位置
	const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => getLayoutedElements(rawNodes, rawEdges), [])

	// 监听容器尺寸变化，重新调整视图
	useEffect(() => {
		const resizeObserver = new ResizeObserver(() => {
			// 延迟执行 fitView，确保 DOM 已更新
			setTimeout(() => {
				const nodes = reactFlowInstance.getNodes()
				if (nodes.length === 0) return

				// 计算所有节点的边界
				const bounds = nodes.reduce(
					(acc, node) => {
						const x1 = node.position.x
						const y1 = node.position.y
						const x2 = x1 + NODE_WIDTH
						const y2 = y1 + NODE_HEIGHT

						return {
							minX: Math.min(acc.minX, x1),
							minY: Math.min(acc.minY, y1),
							maxX: Math.max(acc.maxX, x2),
							maxY: Math.max(acc.maxY, y2)
						}
					},
					{ minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
				)

				// 为顶部预留空间给 Memory Cards（4个卡片大约需要 60-70px）
				const topOffset = 70
				const viewport = containerRef.current
				if (!viewport) return

				const width = viewport.offsetWidth
				const height = viewport.offsetHeight

				// 计算内容的宽高
				const contentWidth = bounds.maxX - bounds.minX
				const contentHeight = bounds.maxY - bounds.minY

				// 计算缩放比例（考虑顶部偏移）
				const availableHeight = height - topOffset
				const scaleX = width / (contentWidth + 200) // 左右留 padding
				const scaleY = availableHeight / (contentHeight + 100) // 上下留 padding
				const scale = Math.min(scaleX, scaleY, ZOOM_LEVEL)

				// 计算居中位置
				const x = (width - contentWidth * scale) / 2 - bounds.minX * scale
				const y = topOffset + (availableHeight - contentHeight * scale) / 2 - bounds.minY * scale

				reactFlowInstance.setViewport({ x, y, zoom: scale })
			}, 10)
		})

		if (containerRef.current) {
			resizeObserver.observe(containerRef.current)
		}

		return () => {
			resizeObserver.disconnect()
		}
	}, [reactFlowInstance])

	return (
		<div ref={containerRef} className={styles.container}>
			{/* Memory Cards 区域 */}
			<div className={styles.memorySection}>
				{mockMemoryData.map((memory) => (
					<MemoryCard
						key={memory.id}
						data={memory}
						onClick={() => console.log('Memory clicked:', memory.id)}
					/>
				))}
			</div>

			<ReactFlow
				nodes={layoutedNodes}
				edges={layoutedEdges}
				nodeTypes={nodeTypes}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				minZoom={0.3}
				maxZoom={1.5}
			>
				<Background variant={BackgroundVariant.Dots} gap={28} size={1} />
				<Controls position='bottom-right' showZoom={true} showFitView={false} showInteractive={false} />
				<Panel position='top-right'>
					<div className={styles.toolbar}>
						<div className={styles.modeSwitch}>
							<button
								className={`${styles.modeBtn} ${styles.active}`}
								onClick={onSwitchMode}
							>
								{is_cn ? '默认' : 'Default'}
							</button>
							<button className={styles.modeBtn} onClick={onSwitchMode}>
								{is_cn ? '开发者' : 'Developer'}
							</button>
						</div>
					</div>
				</Panel>
			</ReactFlow>
		</div>
	)
}

const DefaultView: React.FC<DefaultViewProps> = ({ traceId, onSwitchMode }) => {
	return (
		<ReactFlowProvider>
			<FlowContent traceId={traceId} onSwitchMode={onSwitchMode} />
		</ReactFlowProvider>
	)
}

export default DefaultView
