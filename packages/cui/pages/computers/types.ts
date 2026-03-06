export type LifecyclePolicy = 'oneshot' | 'session' | 'longrunning' | 'persistent'

export type BoxStatus = 'running' | 'stopped' | 'creating'

export interface BoxInfo {
	id: string
	container_id: string
	pool: string
	owner: string
	status: BoxStatus
	policy: LifecyclePolicy
	labels: Record<string, string>
	image: string
	created_at: string
	last_active: string
	process_count: number
	vnc: boolean
	workspace_id?: string
	workspace_name?: string
}

export interface PoolInfo {
	name: string
	addr: string
	connected: boolean
	boxes: number
	max_per_user: number
	max_total: number
	idle_timeout: number
	max_lifetime: number
}

export interface PortMapping {
	container_port: number
	host_port: number
	host_ip: string
	protocol: string
}

export interface CreateBoxOptions {
	id?: string
	owner: string
	pool?: string
	image: string
	workdir?: string
	user?: string
	env?: Record<string, string>
	memory?: number
	cpus?: number
	vnc?: boolean
	ports?: PortMapping[]
	policy: LifecyclePolicy
	idle_timeout?: number
	stop_timeout?: number
	workspace_id?: string
	mount_mode?: 'rw' | 'ro'
	mount_path?: string
	labels?: Record<string, string>
}

export interface ListBoxOptions {
	owner?: string
	pool?: string
	labels?: Record<string, string>
}
