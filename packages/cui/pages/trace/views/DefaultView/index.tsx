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
import { message, Empty } from 'antd'
import TraceNode from './components/TraceNode'
import MemoryCard from './components/MemoryCard'
import { OpenAPI } from '@/openapi'
import { TraceAPI, TraceInfo, TraceEvent, TraceNode as APITraceNode, TraceSpace } from '@/openapi/trace'
import styles from './index.less'

interface DefaultViewProps {
	traceId?: string
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
	const locale = getLocale()
	const is_cn = locale === 'zh-CN'

	// 动态状态
	const [traceInfo, setTraceInfo] = useState<TraceInfo | null>(null)
	const [rawNodes, setRawNodes] = useState<Node[]>([])
	const [rawEdges, setRawEdges] = useState<Edge[]>([])
	const [spaces, setSpaces] = useState<TraceSpace[]>([])
	const [layoutedNodes, setLayoutedNodes] = useState<Node[]>([])
	const [layoutedEdges, setLayoutedEdges] = useState<Edge[]>([])
	const [updatingMemoryIds, setUpdatingMemoryIds] = useState<Set<string>>(new Set())
	const [loadError, setLoadError] = useState<string | null>(null)

	// Initialize API
	// @ts-ignore
	const api = window.$app?.openapi || new OpenAPI({ baseURL: '/api/__yao/openapi/v1' })
	const traceApi = new TraceAPI(api)

	const onNodesChange = useCallback(() => {}, [])
	const onEdgesChange = useCallback(() => {}, [])

	// 获取 TraceInfo
	useEffect(() => {
		if (!traceId) {
			setLoadError(is_cn ? 'Trace ID 不能为空' : 'Trace ID is required')
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
					setLoadError(errorMsg)
					message.error(errorMsg)
				} else if (res.data) {
					console.log('✅ TraceInfo loaded:', res.data)
					// 不要直接覆盖，而是合并，保留 SSE 可能已经更新的状态
					setTraceInfo((prev) => {
						// 如果已经有状态且不是 pending，保留 SSE 更新的状态
						if (prev && prev.status !== 'pending') {
							console.log('⚠️ Preserving SSE status:', prev.status)
							return { ...res.data!, status: prev.status }
						}
						return res.data!
					})
					setLoadError(null)
				} else {
					console.warn('⚠️ GetInfo returned no data')
				}
			})
			.catch((err) => {
				console.error('❌ GetInfo network error:', err)
				const errorMsg = is_cn ? '网络错误' : 'Network error'
				setLoadError(errorMsg)
				message.error(errorMsg)
			})
	}, [traceId])

	// 当 rawNodes 或 rawEdges 变化时，重新计算布局
	useEffect(() => {
		if (rawNodes.length > 0) {
			// 直接计算布局（不再需要处理 Join 节点）
			const { nodes, edges } = getLayoutedElements(rawNodes, rawEdges)
			setLayoutedNodes(nodes)
			setLayoutedEdges(edges)
		}
	}, [rawNodes, rawEdges])

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
						setTraceInfo((prev) => {
							console.log('Init - Previous traceInfo:', prev)
							if (prev) {
								return { ...prev, status: 'running' }
							} else if (event.data && event.data.trace_id) {
								// If traceInfo is not loaded yet, create a minimal one
								return {
									id: event.data.trace_id,
									driver: 'unknown',
									status: 'running',
									created_at: Date.now(),
									updated_at: Date.now(),
									archived: false
								}
							}
							return null
						})
						break

					case 'node_start':
						if (event.data.node) {
							const nodeData = event.data.node as APITraceNode
							setRawNodes((prev) => {
								const existing = prev.find((n) => n.id === nodeData.id)
								const data = {
									label: nodeData.label,
									type: nodeData.type || 'custom',
									icon: nodeData.icon,
									status: nodeData.status,
									description: nodeData.description,
									start_time: nodeData.start_time,
									end_time: nodeData.end_time,
									duration:
										nodeData.end_time && nodeData.start_time
											? nodeData.end_time - nodeData.start_time
											: undefined,
									error: nodeData.status === 'failed' ? 'Failed' : undefined,
									logs: existing?.data.logs || []
								}
								const newNode: Node = {
									id: nodeData.id,
									type: 'traceNode',
									position: existing?.position || { x: 0, y: 0 },
									data
								}
								return existing
									? prev.map((n) => (n.id === nodeData.id ? newNode : n))
									: [...prev, newNode]
							})

							// Create edges
							if (nodeData.parent_ids && nodeData.parent_ids.length > 0) {
								setRawEdges((prev) => {
									const newEdges: Edge[] = []
									nodeData.parent_ids?.forEach((parentId) => {
										const edgeId = `${parentId}-${nodeData.id}`
										if (!prev.find((e) => e.id === edgeId)) {
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
										}
									})
									return newEdges.length > 0 ? [...prev, ...newEdges] : prev
								})
							}
						}
						break

					case 'node_complete':
					case 'node_failed':
						if (event.data && event.data.node_id) {
							const newStatus = event.data.status
							setRawNodes((prev) =>
								prev.map((node) => {
									if (node.id === event.data.node_id) {
										const endTime = event.data.end_time || node.data.end_time
										const startTime = node.data.start_time
										const duration =
											endTime && startTime
												? endTime - startTime
												: node.data.duration
										return {
											...node,
											data: {
												...node.data,
												status: newStatus || node.data.status,
												end_time: endTime,
												output: event.data.output || node.data.output,
												duration
											}
										}
									}
									return node
								})
							)

							// 更新连接到该节点的边的状态
							if (newStatus) {
								setRawEdges((prev) =>
									prev.map((edge) => {
										if (edge.target === event.data.node_id) {
											const color = getStatusColor(newStatus)
											return {
												...edge,
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
												data: { ...edge.data, targetStatus: newStatus }
											}
										}
										return edge
									})
								)
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
							setRawNodes((prev) =>
								prev.map((node) =>
									node.id === event.node_id
										? {
												...node,
												data: {
													...node.data,
													logs: [...(node.data.logs || []), log]
												}
										  }
										: node
								)
							)
						}
						break

					case 'space_created':
						if (event.data) {
							setSpaces((prev) => [...prev, event.data])
						}
						break

					case 'memory_add':
					case 'memory_update':
						if (event.data && event.space_id) {
							const spaceId = event.space_id
							const item = event.data.item
							if (spaceId && item) {
								setUpdatingMemoryIds((prev) => new Set(prev).add(spaceId))
								setSpaces((prev) =>
									prev.map((space) =>
										space.id === spaceId
											? {
													...space,
													data: {
														...(space.data || {}),
														[item.id]: item.content
													}
											  }
											: space
									)
								)
								setTimeout(() => {
									setUpdatingMemoryIds((prev) => {
										const next = new Set(prev)
										next.delete(spaceId)
										return next
									})
								}, 500)
							}
						}
						break

					case 'complete':
						console.log('🎯 Complete event received:', event.data)
						if (event.data && event.data.status) {
							console.log('✅ Updating trace status to:', event.data.status)
							setTraceInfo((prev) => {
								console.log('Previous traceInfo:', prev)
								// 如果 traceInfo 是 null，创建一个基本对象
								if (!prev) {
									return {
										id: event.trace_id || traceId || '',
										driver: 'unknown',
										status: event.data.status,
										created_at: Date.now(),
										updated_at: Date.now(),
										archived: false
									}
								}
								const updated = { ...prev, status: event.data.status }
								console.log('Updated traceInfo:', updated)
								return updated
							})
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
				{spaces.map((space) => (
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
