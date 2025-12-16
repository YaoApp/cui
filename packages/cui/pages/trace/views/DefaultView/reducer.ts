import { Node, Edge, MarkerType } from 'reactflow'
import { TraceInfo, TraceNode as APITraceNode, TraceSpace } from '@/openapi/trace'

// State type
export type TraceState = {
	traceInfo: TraceInfo | null
	rawNodes: Node[]
	rawEdges: Edge[]
	spaces: TraceSpace[]
	updatingMemoryIds: Set<string>
	loadError: string | null
}

// Action types
export type TraceAction =
	| { type: 'RESET_ALL' }
	| { type: 'SET_TRACE_INFO'; payload: TraceInfo | null }
	| { type: 'UPDATE_TRACE_STATUS'; payload: string }
	| { type: 'ADD_OR_UPDATE_NODES'; payload: { nodes: APITraceNode[] } }
	| { type: 'UPDATE_NODE_STATUS'; payload: { nodeId: string; status: string; endTime?: number; output?: any } }
	| { type: 'ADD_NODE_LOG'; payload: { nodeId: string; log: any } }
	| { type: 'ADD_EDGES'; payload: Edge[] }
	| { type: 'UPDATE_EDGES_STATUS'; payload: { nodeId: string; status: string } }
	| { type: 'ADD_OR_UPDATE_SPACE'; payload: TraceSpace }
	| { type: 'UPDATE_SPACE_ITEM'; payload: { spaceId: string; itemId: string; content: any } }
	| { type: 'SET_UPDATING_MEMORY'; payload: { spaceId: string; isUpdating: boolean } }
	| { type: 'SET_LOAD_ERROR'; payload: string | null }

// Initial state
export const initialState: TraceState = {
	traceInfo: null,
	rawNodes: [],
	rawEdges: [],
	spaces: [],
	updatingMemoryIds: new Set<string>(),
	loadError: null
}

// Helper function to get status color
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

// Reducer
export const traceReducer = (state: TraceState, action: TraceAction): TraceState => {
	switch (action.type) {
		case 'RESET_ALL':
			return {
				traceInfo: null,
				rawNodes: [],
				rawEdges: [],
				spaces: [],
				updatingMemoryIds: new Set(),
				loadError: null
			}

		case 'SET_TRACE_INFO':
			return { ...state, traceInfo: action.payload }

		case 'UPDATE_TRACE_STATUS':
			if (!state.traceInfo) {
				return {
					...state,
					traceInfo: {
						id: '',
						driver: 'unknown',
						status: action.payload as any,
						created_at: Date.now(),
						updated_at: Date.now(),
						archived: false
					}
				}
			}
			return {
				...state,
				traceInfo: { ...state.traceInfo, status: action.payload as any }
			}

		case 'ADD_OR_UPDATE_NODES': {
			const nodesToAdd = action.payload.nodes
			let updatedNodes = [...state.rawNodes]

			nodesToAdd.forEach((nodeData) => {
				const existingIndex = updatedNodes.findIndex((n) => n.id === nodeData.id)
				const existingNode = existingIndex >= 0 ? updatedNodes[existingIndex] : null

				const newNode: Node = {
					id: nodeData.id,
					type: 'traceNode',
					position: existingNode?.position || { x: 0, y: 0 },
					data: {
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
						logs: existingNode?.data.logs || []
					}
				}

				if (existingIndex >= 0) {
					updatedNodes[existingIndex] = newNode
				} else {
					updatedNodes.push(newNode)
				}
			})

			return { ...state, rawNodes: updatedNodes }
		}

		case 'UPDATE_NODE_STATUS': {
			const { nodeId, status, endTime, output } = action.payload
			const updatedNodes = state.rawNodes.map((node) => {
				if (node.id === nodeId) {
					const newEndTime = endTime || node.data.end_time
					const startTime = node.data.start_time
					const duration = newEndTime && startTime ? newEndTime - startTime : node.data.duration

					return {
						...node,
						data: {
							...node.data,
							status: status || node.data.status,
							end_time: newEndTime,
							output: output || node.data.output,
							duration
						}
					}
				}
				return node
			})
			return { ...state, rawNodes: updatedNodes }
		}

		case 'ADD_NODE_LOG': {
			const { nodeId, log } = action.payload
			const updatedNodes = state.rawNodes.map((node) => {
				if (node.id === nodeId) {
					return {
						...node,
						data: {
							...node.data,
							logs: [...(node.data.logs || []), log]
						}
					}
				}
				return node
			})
			return { ...state, rawNodes: updatedNodes }
		}

		case 'ADD_EDGES': {
			const newEdges = action.payload
			const existingEdgeIds = new Set(state.rawEdges.map((e) => e.id))
			const edgesToAdd = newEdges.filter((e) => !existingEdgeIds.has(e.id))
			return {
				...state,
				rawEdges: edgesToAdd.length > 0 ? [...state.rawEdges, ...edgesToAdd] : state.rawEdges
			}
		}

		case 'UPDATE_EDGES_STATUS': {
			const { nodeId, status } = action.payload
			const color = getStatusColor(status)
			const updatedEdges = state.rawEdges.map((edge) => {
				if (edge.target === nodeId) {
					return {
						...edge,
						style: { stroke: color, strokeWidth: 1.5 },
						markerEnd: {
							type: MarkerType.ArrowClosed,
							width: 12,
							height: 12,
							color: color
						},
						data: { ...edge.data, targetStatus: status }
					}
				}
				return edge
			})
			return { ...state, rawEdges: updatedEdges }
		}

		case 'ADD_OR_UPDATE_SPACE': {
			const newSpace = action.payload
			const existingIndex = state.spaces.findIndex((s) => s.id === newSpace.id)
			if (existingIndex >= 0) {
				const updatedSpaces = [...state.spaces]
				updatedSpaces[existingIndex] = newSpace
				return { ...state, spaces: updatedSpaces }
			}
			return { ...state, spaces: [...state.spaces, newSpace] }
		}

		case 'UPDATE_SPACE_ITEM': {
			const { spaceId, itemId, content } = action.payload
			const updatedSpaces = state.spaces.map((space) => {
				if (space.id === spaceId) {
					return {
						...space,
						data: {
							...(space.data || {}),
							[itemId]: content
						}
					}
				}
				return space
			})
			return { ...state, spaces: updatedSpaces }
		}

		case 'SET_UPDATING_MEMORY': {
			const { spaceId, isUpdating } = action.payload
			const newSet = new Set(state.updatingMemoryIds)
			if (isUpdating) {
				newSet.add(spaceId)
			} else {
				newSet.delete(spaceId)
			}
			return { ...state, updatingMemoryIds: newSet }
		}

		case 'SET_LOAD_ERROR':
			return { ...state, loadError: action.payload }

		default:
			return state
	}
}
