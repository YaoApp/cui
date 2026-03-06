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
	name: string
	addr: string
	online: boolean
}

export type MountMode = 'rw' | 'ro'

export interface CreateWorkspaceOptions {
	id?: string
	name: string
	owner: string
	node: string
	labels?: Record<string, string>
}

export interface ListWorkspaceOptions {
	owner?: string
	node?: string
}

export interface UpdateWorkspaceOptions {
	name?: string
	labels?: Record<string, string>
}
