import { useCallback, useEffect, useRef, useState } from 'react'
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
import { MockSSEConnection, SSEEvent, MockMemory } from '../../utils/sse'
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
	if (nodes.length === 0) return { nodes: [], edges: [] }

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

// 内部组件用于访问 ReactFlow 实例
const FlowContent: React.FC<{
	traceId: string
	onSwitchMode: () => void
}> = ({ traceId, onSwitchMode }) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const reactFlowInstance = useReactFlow()
	const sseConnectionRef = useRef<MockSSEConnection | null>(null)
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// 动态状态：节点、边、记忆数据
	const [rawNodes, setRawNodes] = useState<Node[]>([])
	const [rawEdges, setRawEdges] = useState<Edge[]>([])
	const [memoryData, setMemoryData] = useState<MockMemory[]>([])
	const [layoutedNodes, setLayoutedNodes] = useState<Node[]>([])
	const [layoutedEdges, setLayoutedEdges] = useState<Edge[]>([])

	const onNodesChange = useCallback(() => {}, [])
	const onEdgesChange = useCallback(() => {}, [])

	// 当 rawNodes 或 rawEdges 变化时，重新计算布局
	useEffect(() => {
		if (rawNodes.length > 0) {
			const { nodes, edges } = getLayoutedElements(rawNodes, rawEdges)
			setLayoutedNodes(nodes)
			setLayoutedEdges(edges)
		}
	}, [rawNodes, rawEdges])

	// SSE 事件处理
	const handleSSEEvent = useCallback((event: SSEEvent) => {
		console.log('📡 SSE Event:', event.type, event.data)

		switch (event.type) {
			case 'node_start':
			case 'node_complete':
				// 处理单个节点
				if (event.data.node) {
					const newNode: Node = {
						id: event.data.node.id,
						type: 'traceNode',
						position: { x: 0, y: 0 }, // dagre 会重新计算
						data: event.data.node.data
					}

					setRawNodes((prev) => {
						const existing = prev.find((n) => n.id === event.data.node!.id)
						if (existing) {
							// 更新现有节点
							return prev.map((n) => (n.id === event.data.node!.id ? newNode : n))
						} else {
							// 添加新节点
							return [...prev, newNode]
						}
					})
				}

				// 处理批量节点（并发场景）
				if (event.data.nodes && event.data.nodes.length > 0) {
					const newNodes: Node[] = event.data.nodes.map((nodeData) => ({
						id: nodeData.id,
						type: 'traceNode',
						position: { x: 0, y: 0 },
						data: nodeData.data
					}))

					setRawNodes((prev) => {
						const updated = [...prev]
						newNodes.forEach((newNode) => {
							const index = updated.findIndex((n) => n.id === newNode.id)
							if (index >= 0) {
								updated[index] = newNode
							} else {
								updated.push(newNode)
							}
						})
						return updated
					})
				}

				// 处理单个边
				if (event.data.edge) {
					const newEdge: Edge = {
						...event.data.edge,
						type: 'default',
						markerEnd: {
							...event.data.edge.markerEnd,
							type: MarkerType.ArrowClosed
						}
					}

					setRawEdges((prev) => {
						const existing = prev.find((e) => e.id === newEdge.id)
						if (existing) {
							// 更新现有边
							return prev.map((e) => (e.id === newEdge.id ? newEdge : e))
						} else {
							// 添加新边
							return [...prev, newEdge]
						}
					})
				}

				// 处理批量边（并发场景）
				if (event.data.edges && event.data.edges.length > 0) {
					const newEdges: Edge[] = event.data.edges.map((edgeData) => ({
						...edgeData,
						type: 'default',
						markerEnd: {
							...edgeData.markerEnd,
							type: MarkerType.ArrowClosed
						}
					}))

					setRawEdges((prev) => {
						const updated = [...prev]
						newEdges.forEach((newEdge) => {
							const index = updated.findIndex((e) => e.id === newEdge.id)
							if (index >= 0) {
								updated[index] = newEdge
							} else {
								updated.push(newEdge)
							}
						})
						return updated
					})
				}
				break

			case 'node_update':
				// 处理单个边更新
				if (event.data.edge) {
					const updatedEdge: Edge = {
						...event.data.edge,
						type: 'default',
						markerEnd: {
							...event.data.edge.markerEnd,
							type: MarkerType.ArrowClosed
						}
					}

					setRawEdges((prev) => {
						const existing = prev.find((e) => e.id === updatedEdge.id)
						if (existing) {
							return prev.map((e) => (e.id === updatedEdge.id ? updatedEdge : e))
						} else {
							return [...prev, updatedEdge]
						}
					})
				}

				// 处理批量边更新
				if (event.data.edges && event.data.edges.length > 0) {
					const updatedEdges: Edge[] = event.data.edges.map((edgeData) => ({
						...edgeData,
						type: 'default',
						markerEnd: {
							...edgeData.markerEnd,
							type: MarkerType.ArrowClosed
						}
					}))

					setRawEdges((prev) => {
						const updated = [...prev]
						updatedEdges.forEach((updatedEdge) => {
							const index = updated.findIndex((e) => e.id === updatedEdge.id)
							if (index >= 0) {
								updated[index] = updatedEdge
							} else {
								updated.push(updatedEdge)
							}
						})
						return updated
					})
				}
				break

			case 'memory_add':
				// 处理单个 Memory
				if (event.data.memory) {
					setMemoryData((prev) => [...prev, event.data.memory!])
				}
				
				// 处理批量 Memory（并发场景）
				if (event.data.memories && event.data.memories.length > 0) {
					setMemoryData((prev) => [...prev, ...event.data.memories!])
				}
				break

			case 'memory_update':
				// 更新 Memory（支持单个和批量）
				if (event.data.memory) {
					setMemoryData((prev) => {
						const index = prev.findIndex((m) => m.id === event.data.memory!.id)
						if (index >= 0) {
							// 更新现有 Memory
							const updated = [...prev]
							updated[index] = event.data.memory!
							return updated
						} else {
							// 如果不存在，则添加（兜底逻辑）
							return [...prev, event.data.memory!]
						}
					})
				}
				
				if (event.data.memories && event.data.memories.length > 0) {
					setMemoryData((prev) => {
						const updated = [...prev]
						event.data.memories!.forEach((newMemory) => {
							const index = updated.findIndex((m) => m.id === newMemory.id)
							if (index >= 0) {
								updated[index] = newMemory
							} else {
								updated.push(newMemory)
							}
						})
						return updated
					})
				}
				break

			case 'complete':
				console.log('✅ SSE Complete')
				break
		}
	}, [])

	// 初始化 SSE 连接
	useEffect(() => {
		const connection = new MockSSEConnection()
		sseConnectionRef.current = connection
		connection.connect(handleSSEEvent)

		return () => {
			connection.disconnect()
		}
	}, [handleSSEEvent])

	// 监听容器尺寸变化，重新调整视图
	useEffect(() => {
		const resizeObserver = new ResizeObserver(() => {
			// 延迟执行，确保 DOM 已更新
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
				const topOffset = 150 // 增加顶部偏移，让 Start 节点在上方
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

				// 计算居中位置（水平居中，垂直靠上）
				const x = (width - contentWidth * scale) / 2 - bounds.minX * scale
				const y = topOffset - bounds.minY * scale + 20 // 垂直靠上，距离 Memory Cards 20px

				reactFlowInstance.setViewport({ x, y, zoom: scale })
			}, 10)
		})

		if (containerRef.current) {
			resizeObserver.observe(containerRef.current)
		}

		return () => {
			resizeObserver.disconnect()
		}
	}, [reactFlowInstance, layoutedNodes])

	return (
		<div ref={containerRef} className={styles.container}>
			{/* Memory Cards 区域 */}
			<div className={styles.memorySection}>
				{memoryData.map((memory) => (
					<MemoryCard
						key={memory.id}
						data={{
							...memory,
							// 最多保留 3 条 items 用于悬停卡片显示
							items: memory.items.slice(0, 3)
						}}
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
