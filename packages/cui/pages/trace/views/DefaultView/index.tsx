import { useCallback, useEffect, useRef, useState, useReducer } from 'react'
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
import { message, Empty } from 'antd'
import TraceNode from './components/TraceNode'
import MemoryCard from './components/MemoryCard'
import { OpenAPI } from '@/openapi'
import { TraceAPI, TraceInfo, TraceEvent, TraceNode as APITraceNode, TraceSpace } from '@/openapi/trace'
import { traceReducer, initialState } from './reducer'
import styles from './index.less'

interface DefaultViewProps {
	traceId?: string
	onSwitchMode: () => void
}

// 节点宽度和高度（需要与 TraceNode 的实际尺寸一致）
const NODE_WIDTH = 280
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

// 从 CSS 变量获取颜色值的辅助函数
const getStatusColor = (status: string): string => {
	const root = document.documentElement
	const computedStyle = getComputedStyle(root)

	switch (status) {
		case 'running':
			return computedStyle.getPropertyValue('--color_main').trim() || '#3371FC'
		case 'success':
		case 'completed':
			return computedStyle.getPropertyValue('--color_success').trim() || '#52C41A'
		case 'error':
		case 'failed':
			return computedStyle.getPropertyValue('--color_danger').trim() || '#F5222D'
		default:
			return computedStyle.getPropertyValue('--color_text_grey').trim() || '#8C8C8C'
	}
}

// 内部组件用于访问 ReactFlow 实例
const FlowContent: React.FC<{
	traceId?: string
	onSwitchMode: () => void
}> = ({ traceId, onSwitchMode }) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const reactFlowInstance = useReactFlow()
	const eventSourceRef = useRef<EventSource | null>(null)
	const previousTraceIdRef = useRef<string | undefined>(undefined)
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// 使用 useReducer 管理复杂状态，确保更新的原子性和顺序性
	const [state, dispatch] = useReducer(traceReducer, initialState)

	// 解构状态以保持向后兼容
	const { traceInfo, rawNodes, rawEdges, spaces, updatingMemoryIds, loadError } = state

	// 布局状态单独管理（因为它是派生状态）
	const [layoutedNodes, setLayoutedNodes] = useState<Node[]>([])
	const [layoutedEdges, setLayoutedEdges] = useState<Edge[]>([])

	// Initialize API
	// @ts-ignore
	const api = window.$app?.openapi || new OpenAPI({ baseURL: '/api/__yao/openapi/v1' })
	const traceApi = new TraceAPI(api)

	const onNodesChange = useCallback(() => {}, [])
	const onEdgesChange = useCallback(() => {}, [])

	// 获取 TraceInfo
	useEffect(() => {
		if (!traceId) {
			dispatch({ type: 'SET_LOAD_ERROR', payload: is_cn ? 'Trace ID 不能为空' : 'Trace ID is required' })
			return
		}

		console.log('🔍 Fetching TraceInfo for:', traceId)
		traceApi
			.GetInfo(traceId)
			.then((res) => {
				console.log('📦 GetInfo response:', res)
				if (api.IsError(res)) {
					const errorMsg =
						res.error?.error_description ||
						(is_cn ? '获取 Trace 信息失败' : 'Failed to get trace info')
					console.error('❌ GetInfo error:', errorMsg)
					dispatch({ type: 'SET_LOAD_ERROR', payload: errorMsg })
					message.error(errorMsg)
				} else if (res.data) {
					console.log('✅ TraceInfo loaded:', res.data)
					// 合并保留 SSE 可能已经更新的状态
					const preserveStatus = traceInfo && traceInfo.status !== 'pending'
					dispatch({
						type: 'SET_TRACE_INFO',
						payload: preserveStatus ? { ...res.data, status: traceInfo.status } : res.data
					})
					dispatch({ type: 'SET_LOAD_ERROR', payload: null })
				} else {
					console.warn('⚠️ GetInfo returned no data')
				}
			})
			.catch((err) => {
				console.error('❌ GetInfo network error:', err)
				const errorMsg = is_cn ? '网络错误' : 'Network error'
				dispatch({ type: 'SET_LOAD_ERROR', payload: errorMsg })
				message.error(errorMsg)
			})
	}, [traceId])

	// 当 rawNodes 或 rawEdges 变化时，重新计算布局
	useEffect(() => {
		console.log('🔧 Layout update triggered, rawNodes:', rawNodes.length, 'rawEdges:', rawEdges.length)
		if (rawNodes.length > 0) {
			// 直接计算布局（不再需要处理 Join 节点）
			const { nodes, edges } = getLayoutedElements(rawNodes, rawEdges)
			console.log('✨ Layout calculated, nodes:', nodes.length, 'edges:', edges.length)
			setLayoutedNodes(nodes)
			setLayoutedEdges(edges)
		} else {
			console.log('⚠️ Skipping layout, no nodes')
			setLayoutedNodes([])
			setLayoutedEdges([])
		}
	}, [rawNodes, rawEdges])

	// 当路由中的 traceId 变化时重置所有数据（只在真正切换到不同的 trace 时清理）
	useEffect(() => {
		if (!traceId) return

		const prevId = previousTraceIdRef.current

		// 只在 traceId 真正变化时清理数据（首次加载或相同ID不清理）
		if (prevId !== undefined && prevId !== traceId) {
			console.log('🔄 Route changed: TraceId', prevId, '→', traceId, '(resetting data)')
			// 使用 reducer 清理所有状态（原子操作）
			dispatch({ type: 'RESET_ALL' })
			setLayoutedNodes([])
			setLayoutedEdges([])
		}

		// 记录当前 traceId
		previousTraceIdRef.current = traceId
	}, [traceId])

	// Debug: 监控组件生命周期
	useEffect(() => {
		console.log('🎨 DefaultView mounted, traceId:', traceId)
		return () => {
			console.log('💀 DefaultView unmounting, traceId:', traceId)
		}
	}, [])

	// Debug: 监控 rawNodes 变化
	useEffect(() => {
		console.log(
			'📊 rawNodes changed, count:',
			rawNodes.length,
			rawNodes.map((n: Node) => n.id)
		)
	}, [rawNodes])

	// 初始化 SSE 连接（仅在 traceId 变化时重新连接）
	useEffect(() => {
		if (!traceId) return

		const source = traceApi.StreamEvents(
			traceId,
			(event) => {
				// 直接内联处理事件，避免依赖外部回调
				switch (event.type) {
					case 'init':
						console.log('🎬 Init event received:', event.data)
						dispatch({ type: 'UPDATE_TRACE_STATUS', payload: 'running' })
						break

					case 'node_start':
						// Handle both single node and parallel nodes
						const nodesToProcess: APITraceNode[] = []
						if (event.data.node) {
							nodesToProcess.push(event.data.node as APITraceNode)
						}
						if (event.data.nodes && Array.isArray(event.data.nodes)) {
							nodesToProcess.push(...(event.data.nodes as APITraceNode[]))
						}

						if (nodesToProcess.length > 0) {
							console.log(
								'🔵 Processing',
								nodesToProcess.length,
								'node(s):',
								nodesToProcess
							)

							// 使用 reducer 处理节点和边（原子操作）
							dispatch({ type: 'ADD_OR_UPDATE_NODES', payload: { nodes: nodesToProcess } })

							// 创建边
							const newEdges: Edge[] = []
							nodesToProcess.forEach((nodeData) => {
								if (nodeData.parent_ids && nodeData.parent_ids.length > 0) {
									nodeData.parent_ids.forEach((parentId) => {
										const edgeId = `${parentId}-${nodeData.id}`
										const color = getStatusColor(nodeData.status)
										newEdges.push({
											id: edgeId,
											source: parentId,
											target: nodeData.id,
											type: 'default',
											style: {
												stroke: color,
												strokeWidth: 1.5
											},
											markerEnd: {
												type: MarkerType.ArrowClosed,
												width: 12,
												height: 12,
												color: color
											},
											data: { targetStatus: nodeData.status }
										})
									})
								}
							})
							if (newEdges.length > 0) {
								dispatch({ type: 'ADD_EDGES', payload: newEdges })
							}
						}
						break

					case 'node_complete':
					case 'node_failed':
						if (event.data && event.data.node_id) {
							const newStatus = event.data.status
							// 使用 reducer 更新节点状态（原子操作）
							dispatch({
								type: 'UPDATE_NODE_STATUS',
								payload: {
									nodeId: event.data.node_id,
									status: newStatus,
									endTime: event.data.end_time,
									output: event.data.output
								}
							})

							// 更新边的状态
							if (newStatus) {
								dispatch({
									type: 'UPDATE_EDGES_STATUS',
									payload: { nodeId: event.data.node_id, status: newStatus }
								})
							}
						}
						break

					case 'log_added':
						if (event.data && event.node_id) {
							const log = {
								timestamp: event.timestamp,
								level: event.data.Level || 'info',
								message: event.data.Message || '',
								node_id: event.node_id,
								data: event.data.Data
							}
							dispatch({ type: 'ADD_NODE_LOG', payload: { nodeId: event.node_id, log } })
						}
						break

					case 'space_created':
						if (event.data) {
							dispatch({ type: 'ADD_OR_UPDATE_SPACE', payload: event.data })
						}
						break

					case 'memory_add':
					case 'memory_update':
						if (event.data && event.space_id) {
							const spaceId = event.space_id
							const item = event.data.item
							if (spaceId && item) {
								dispatch({
									type: 'SET_UPDATING_MEMORY',
									payload: { spaceId, isUpdating: true }
								})
								dispatch({
									type: 'UPDATE_SPACE_ITEM',
									payload: { spaceId, itemId: item.id, content: item.content }
								})
								setTimeout(() => {
									dispatch({
										type: 'SET_UPDATING_MEMORY',
										payload: { spaceId, isUpdating: false }
									})
								}, 500)
							}
						}
						break

					case 'complete':
						console.log('🎯 Complete event received:', event.data)
						if (event.data && event.data.status) {
							console.log('✅ Updating trace status to:', event.data.status)
							dispatch({ type: 'UPDATE_TRACE_STATUS', payload: event.data.status })
						} else {
							console.warn('❌ Complete event missing status:', event)
						}
						break
				}
			},
			(err) => console.error('SSE Error:', err)
		)

		eventSourceRef.current = source

		return () => {
			source.close()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [traceId])

	// 监听容器尺寸变化，重新调整视图
	useEffect(() => {
		if (!traceId) return

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

				// 为顶部预留空间给 Memory Cards
				const topOffset = 70 // Memory Cards 预留空间
				const viewport = containerRef.current
				if (!viewport) return

				const width = viewport.offsetWidth
				const height = viewport.offsetHeight

				// 计算内容的宽高
				const contentWidth = bounds.maxX - bounds.minX
				const contentHeight = bounds.maxY - bounds.minY

				// 固定缩放比例，不自动调整
				const scale = ZOOM_LEVEL

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

	if (loadError) {
		return (
			<div
				className={styles.container}
				style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
			>
				<Empty description={loadError} />
			</div>
		)
	}

	return (
		<div ref={containerRef} className={styles.container}>
			{/* Trace Info Panel (Top Left) */}
			<Panel position='top-left' className={styles.infoPanel}>
				<div className={styles.traceInfoBox}>
					<div className={styles.traceValue}>{traceId}</div>
					{traceInfo && (
						<div className={`${styles.traceStatus} ${styles[traceInfo.status]}`}>
							{traceInfo.status.toUpperCase()}
						</div>
					)}
				</div>
			</Panel>

			{/* Memory Cards 区域 */}
			<div className={styles.memorySection}>
				{spaces.map((space: TraceSpace) => (
					<MemoryCard
						key={space.id}
						data={{
							id: space.id,
							type: (['context', 'intent', 'knowledge', 'history'].includes(space.id)
								? space.id
								: 'custom') as any,
							title: space.label,
							content: space.description,
							count: space.data ? Object.keys(space.data).length : 0,
							items: Object.values(space.data || {})
								.map((v) => (typeof v === 'string' ? v : JSON.stringify(v)))
								.slice(0, 3)
						}}
						isUpdating={updatingMemoryIds.has(space.id)}
						onClick={() => console.log('Space clicked:', space.id)}
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
