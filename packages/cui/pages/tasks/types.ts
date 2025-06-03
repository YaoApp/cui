/**
 * API Response
 */
export type ListResponse = { tasks: Task[]; categories: Catgory[]; total: number } | ErrorDetail
export type DetailResponse = Task | ErrorDetail

export type ErrorDetail = {
	message: string
	code: number
}

/**
 * Task Item
 */
export interface Task {
	id: string
	name: string
	icon?: string
	description: string
	category: 'assistant' | 'knowledge' | 'workflow' | 'schedule' | string
	status: 'pending' | 'running' | 'completed' | 'failed' | string
	logs?: TaskLog[]
	created_at: string
	updated_at: string
	created_by: string
	sort: number
	result?: any
	started_at?: string
	ended_at?: string
}

/**
 * Log Item
 */
export interface TaskLog {
	timestamp: string
	message: string
	level: 'info' | 'error' | 'warning' | 'retry'
}

/**
 * Category Item
 */
export interface Catgory {
	id: string
	name: string
	icon?: string
	description: string
	sort: number
}
