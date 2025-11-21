export type TraceStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface TraceInfo {
	id: string
	driver: string
	status: TraceStatus
	created_at: number
	updated_at: number
	archived: boolean
	archived_at?: number
	metadata?: Record<string, any>
	created_by?: string
	team_id?: string
	tenant_id?: string
}

export interface TraceNode {
	id: string
	parent_ids: string[]
	label: string
	type: string
	icon: string
	description: string
	status: string
	created_at: number
	start_time: number
	end_time: number
	updated_at: number
	metadata?: Record<string, any>
	// Detailed fields (only present in GetNode)
	input?: any
	output?: any
	children_ids?: string[]
}

export interface TraceLog {
	timestamp: number
	level: string
	message: string
	node_id: string
	data?: Record<string, any>
}

export interface TraceSpace {
	id: string
	label: string
	type: string
	icon: string
	description: string
	ttl: number
	created_at: number
	updated_at: number
	metadata?: Record<string, any>
	// Detailed fields (only present in GetSpace)
	data?: Record<string, any>
}

export interface TraceEvent {
	type: string
	trace_id: string
	node_id?: string
	space_id?: string
	timestamp: number
	data: any
}

// Response Types
export interface TraceEventsResponse {
	id: string
	status: TraceStatus
	created_at: number
	updated_at: number
	archived: boolean
	archived_at?: number
	events: TraceEvent[]
}

export interface TraceNodesResponse {
	trace_id: string
	nodes: TraceNode[]
	count: number
}

export interface TraceLogsResponse {
	trace_id: string
	logs: TraceLog[]
	count: number
	node_id?: string
}

export interface TraceSpacesResponse {
	trace_id: string
	spaces: TraceSpace[]
	count: number
}

// Callback type for SSE
export type TraceEventCallback = (event: TraceEvent) => void
