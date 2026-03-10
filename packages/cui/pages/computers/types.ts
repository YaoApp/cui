export type LifecyclePolicy = 'oneshot' | 'session' | 'longrunning' | 'persistent'

export type BoxStatus = 'running' | 'stopped' | 'creating'

export interface SystemInfo {
	os: string
	arch: string
	hostname: string
	num_cpu: number
	total_mem?: number
	shell?: string
	temp_dir?: string
}

export interface BoxInfo {
	id: string
	container_id: string
	node_id: string
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
	system: SystemInfo
}

export interface PortMapping {
	container_port: number
	host_port: number
	host_ip: string
	protocol: string
}

export interface CreateBoxOptions {
	id?: string
	node_id?: string
	image: string
	work_dir?: string
	user?: string
	env?: Record<string, string>
	memory?: number
	cpus?: number
	vnc?: boolean
	ports?: PortMapping[]
	policy: LifecyclePolicy
	labels?: Record<string, string>
	workspace_id?: string
	mount_mode?: 'rw' | 'ro'
	mount_path?: string
}

export interface ListBoxOptions {
	node_id?: string
}

export interface ExecRequest {
	cmd: string[]
	work_dir?: string
	env?: Record<string, string>
	timeout?: number
}

export interface ExecResult {
	exit_code: number
	stdout: string
	stderr: string
	duration_ms?: number
	error?: string
	truncated?: boolean
}
