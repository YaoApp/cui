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
import { getLocale, history } from '@umijs/max'
import dagre from 'dagre'
import 'reactflow/dist/style.css'
import { message, Empty } from 'antd'
import Icon from '@/widgets/Icon'
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
			},
			// 设置节点尺寸，确保 fitView 能正确计算
			width: NODE_WIDTH,
			height: NODE_HEIGHT
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

	// Trace ID 输入状态
	const [showIdInput, setShowIdInput] = useState(false)
	const [inputTraceId, setInputTraceId] = useState('')
	const inputRef = useRef<HTMLInputElement>(null)

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

		traceApi
			.GetInfo(traceId)
			.then((res) => {
				if (api.IsError(res)) {
					const errorMsg =
						res.error?.error_description ||
						(is_cn ? '获取 Trace 信息失败' : 'Failed to get trace info')
					dispatch({ type: 'SET_LOAD_ERROR', payload: errorMsg })
					message.error(errorMsg)
				} else if (res.data) {
					const apiStatus = res.data.status
					const isTerminalStatus = ['completed', 'failed', 'cancelled', 'success', 'error'].includes(apiStatus)
					
					// 如果 API 返回终态，直接使用 API 的状态
					// 如果 API 返回非终态，但 SSE 已经更新为 running，保留 running
					let finalStatus = apiStatus
					if (!isTerminalStatus && traceInfo?.status === 'running') {
						finalStatus = 'running'
					}
					
					dispatch({
						type: 'SET_TRACE_INFO',
						payload: { ...res.data, status: finalStatus }
					})
					dispatch({ type: 'SET_LOAD_ERROR', payload: null })
				}
			})
			.catch((err) => {
				console.error('GetInfo network error:', err)
				const errorMsg = is_cn ? '网络错误' : 'Network error'
				dispatch({ type: 'SET_LOAD_ERROR', payload: errorMsg })
				message.error(errorMsg)
			})
	}, [traceId])

	// Track node structure for layout updates
	// Only recalculate layout when structure changes (node/edge count or IDs), not on data updates (logs, status)
	const nodeIds = rawNodes.map((n: Node) => n.id).join(',')
	const edgeIds = rawEdges.map((e: Edge) => e.id).join(',')

	// 当节点结构变化时，重新计算布局
	useEffect(() => {
		if (rawNodes.length > 0) {
			const { nodes, edges } = getLayoutedElements(rawNodes, rawEdges)
			setLayoutedNodes(nodes)
			setLayoutedEdges(edges)
		} else {
			setLayoutedNodes([])
			setLayoutedEdges([])
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [nodeIds, edgeIds])

	// 当节点数据变化（日志、状态）但结构不变时，只更新节点数据而不重新布局
	useEffect(() => {
		// 跳过：没有布局节点或节点数量不匹配
		if (layoutedNodes.length === 0) return
		if (rawNodes.length !== layoutedNodes.length) return

		// 检查是否只是数据更新（节点ID相同）
		const layoutedIds = layoutedNodes.map((n) => n.id).join(',')
		if (nodeIds !== layoutedIds) return

		// 检查是否有数据变化需要更新
		let hasChanges = false
		const updatedNodes = layoutedNodes.map((layoutedNode) => {
			const rawNode = rawNodes.find((n: Node) => n.id === layoutedNode.id)
			if (rawNode && rawNode.data !== layoutedNode.data) {
				hasChanges = true
				return { ...layoutedNode, data: rawNode.data }
			}
			return layoutedNode
		})

		// 只有在有变化时才更新
		if (hasChanges) {
			setLayoutedNodes(updatedNodes)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [rawNodes])

	// 当路由中的 traceId 变化时重置所有数据（只在真正切换到不同的 trace 时清理）
	useEffect(() => {
		if (!traceId) return

		const prevId = previousTraceIdRef.current

		// 只在 traceId 真正变化时清理数据（首次加载或相同ID不清理）
		if (prevId !== undefined && prevId !== traceId) {
			// 使用 reducer 清理所有状态（原子操作）
			dispatch({ type: 'RESET_ALL' })
			setLayoutedNodes([])
			setLayoutedEdges([])
		}

		// 记录当前 traceId
		previousTraceIdRef.current = traceId
	}, [traceId])

	// 初始化 SSE 连接（仅在 traceId 变化时重新连接）
	useEffect(() => {
		if (!traceId) return

		const source = traceApi.StreamEvents(
			traceId,
			(event) => {
				// 直接内联处理事件，避免依赖外部回调
				switch (event.type) {
					case 'init':
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
						if (event.data && event.data.status) {
							dispatch({ type: 'UPDATE_TRACE_STATUS', payload: event.data.status })
						}
						break
				}
			},
			(err) => console.error('[Trace] SSE Error:', err)
		)

		eventSourceRef.current = source

		return () => {
			source.close()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [traceId])

	// 当 traceId 变化时重置节点计数
	const prevNodeCountRef = useRef(0)
	useEffect(() => {
		prevNodeCountRef.current = 0
	}, [traceId])

	// 当布局节点变化时，调整视口
	useEffect(() => {
		if (layoutedNodes.length === 0) return

		// 使用 requestAnimationFrame 确保 DOM 已更新
		const rafId = requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				const nodes = reactFlowInstance.getNodes()
				if (nodes.length > 0) {
					reactFlowInstance.fitView({
						padding: 0.2,
						minZoom: 0.2,
						maxZoom: 1,
						duration: 0
					})
				}
			})
		})

		return () => cancelAnimationFrame(rafId)
	}, [layoutedNodes.length, reactFlowInstance])

	// 是否正在运行中
	const isRunning = traceInfo?.status === 'running'

	// 处理点击 Trace ID
	const handleTraceIdClick = () => {
		// 运行中不允许切换
		if (isRunning) return

		setInputTraceId(traceId || '')
		setShowIdInput(true)
		setTimeout(() => {
			inputRef.current?.focus()
			inputRef.current?.select()
		}, 100)
	}

	// 处理提交新的 Trace ID
	const handleSubmitTraceId = () => {
		const newId = inputTraceId.trim()
		if (newId && newId !== traceId) {
			history.push(`/trace/${newId}`)
		}
		setShowIdInput(false)
	}

	// 处理键盘事件
	const handleInputKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleSubmitTraceId()
		} else if (e.key === 'Escape') {
			setShowIdInput(false)
		}
	}

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
					{showIdInput ? (
						<div className={styles.traceIdInputWrapper}>
							<input
								ref={inputRef}
								type='text'
								className={styles.traceIdInput}
								value={inputTraceId}
								onChange={(e) => setInputTraceId(e.target.value)}
								onKeyDown={handleInputKeyDown}
								onBlur={() => setShowIdInput(false)}
								placeholder={is_cn ? '输入 Trace ID' : 'Enter Trace ID'}
							/>
							<button
								className={styles.traceIdSubmit}
								onMouseDown={(e) => {
									e.preventDefault()
									handleSubmitTraceId()
								}}
							>
								<Icon name='material-arrow_forward' size={14} />
							</button>
						</div>
					) : (
						<div
							className={`${styles.traceValue} ${isRunning ? styles.disabled : ''}`}
							onClick={handleTraceIdClick}
						>
							{traceId}
						</div>
					)}
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
				{/* TODO: 暂时隐藏模式切换，后续版本启用 */}
				<Panel position='top-right' style={{ display: 'none' }}>
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
