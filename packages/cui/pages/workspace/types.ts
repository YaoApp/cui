export interface Workspace {
	id: string
	name: string
	owner: string
	node: string
	labels: Record<string, string>
	created_at: string
	updated_at: string
}

export interface DirEntry {
	name: string
	is_dir: boolean
	size: number
}

export interface NodeInfo {
	tai_id: string
	machine_id?: string
	version?: string
	display_name?: string
	mode: string
	addr?: string
	status: string
	system: NodeSystemInfo
	capabilities?: Record<string, boolean>
	ports?: Record<string, number>
	connected_at?: string
	last_ping?: string
}

export interface NodeSystemInfo {
	os: string
	arch: string
	hostname: string
	num_cpu: number
	total_mem?: number
	shell?: string
}

export type MountMode = 'rw' | 'ro'

export interface CreateWorkspaceOptions {
	id?: string
	name: string
	node: string
	labels?: Record<string, string>
}

export interface ListWorkspaceOptions {
	node?: string
}

export interface UpdateWorkspaceOptions {
	name?: string
	labels?: Record<string, string>
}

/** Primary display name for a node: display_name > hostname > tai_id. */
export function nodeName(n: NodeInfo): string {
	return n.display_name || n.system?.hostname || n.tai_id
}

/** Network address for a node: addr or fallback "mode://tai_id_short". */
export function nodeAddr(n: NodeInfo): string {
	return n.addr || `${n.mode}://${n.tai_id.slice(0, 8)}`
}

/** Secondary line: "addr os/arch". */
export function nodeDetail(n: NodeInfo): string {
	const addr = nodeAddr(n)
	const platform = n.system ? `${n.system.os}/${n.system.arch}` : ''
	return [addr, platform].filter(Boolean).join(' ')
}

/** Lookup a taiID and return just the addr, falling back to raw ID. */
export function resolveNodeAddr(taiID: string, nodeMap?: Record<string, NodeInfo>): string {
	const n = nodeMap?.[taiID]
	if (!n) return taiID
	return nodeAddr(n)
}
