// Shared types for Trace page

// 视图模式
export type ViewMode = 'default' | 'developer'

// 节点状态
export type NodeStatus = 'pending' | 'running' | 'success' | 'error'

// 节点类型
export type NodeType = 'start' | 'search' | 'query' | 'llm' | 'format' | 'complete' | 'custom'

// 调用栈节点
export interface CallStackNode {
	id: string
	name: string
	type: NodeType
	status: NodeStatus
	description?: string
	startTime?: string
	endTime?: string
	duration?: number // 毫秒
	children?: CallStackNode[] // 子节点（用于并发分支）
	metadata?: Record<string, any>
	input?: any
	output?: any
	logs?: string[]
}

// 记忆项类型
export type MemoryType = 'context' | 'intent' | 'knowledge' | 'history' | 'custom'

// 记忆项
export interface MemoryItem {
	id: string
	type: MemoryType
	title: string
	content: string
	timestamp: string
	importance?: 'high' | 'medium' | 'low'
	metadata?: Record<string, any>
}

// 记忆分组（按类型）
export interface MemoryGroup {
	type: MemoryType
	label: string
	icon: string
	count: number
	items: MemoryItem[]
	lastUpdated?: string
}

// Trace 执行状态
export type TraceStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

// Trace 数据
export interface TraceData {
	id: string
	agentName?: string
	status: TraceStatus
	startTime: string
	endTime?: string
	totalDuration?: number
	currentStep?: string
	progress?: {
		current: number
		total: number
	}
	callStack: CallStackNode[]
	memory: MemoryGroup[]
}

// SSE 事件类型
export type SSEEventType =
	| 'init'
	| 'node_start'
	| 'node_update'
	| 'node_complete'
	| 'node_error'
	| 'memory_add'
	| 'memory_update'
	| 'complete'
	| 'error'

// SSE 事件数据
export interface SSEEvent {
	type: SSEEventType
	timestamp: string
	data: any
}
