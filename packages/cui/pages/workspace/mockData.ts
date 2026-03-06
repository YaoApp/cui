import type { Workspace, DirEntry, NodeInfo } from './types'

export const mockNodes: NodeInfo[] = [
	{ name: 'node-01', addr: 'tai://10.0.1.10:9527', online: true },
	{ name: 'node-02', addr: 'tai://10.0.1.11:9527', online: true },
	{ name: 'node-03', addr: 'tai://10.0.1.12:9527', online: false }
]

export const mockWorkspaces: Workspace[] = [
	{
		id: 'ws-a1b2c3d4',
		name: 'AI Agent Pipeline',
		owner: 'user-001',
		node: 'node-01',
		labels: { env: 'production', team: 'ai-research', priority: 'high' },
		created_at: '2025-12-01T10:30:00Z',
		updated_at: '2026-03-04T14:20:00Z'
	},
	{
		id: 'ws-e5f6g7h8',
		name: 'Data Processing Hub',
		owner: 'user-001',
		node: 'node-01',
		labels: { env: 'production', team: 'data-eng' },
		created_at: '2025-11-15T08:00:00Z',
		updated_at: '2026-03-03T09:15:00Z'
	},
	{
		id: 'ws-i9j0k1l2',
		name: 'Frontend Dev Environment',
		owner: 'user-002',
		node: 'node-02',
		labels: { env: 'development', team: 'frontend' },
		created_at: '2026-01-10T16:45:00Z',
		updated_at: '2026-03-02T11:30:00Z'
	},
	{
		id: 'ws-m3n4o5p6',
		name: 'ML Training Workspace',
		owner: 'user-001',
		node: 'node-02',
		labels: { env: 'staging', team: 'ai-research', gpu: 'required' },
		created_at: '2026-02-01T12:00:00Z',
		updated_at: '2026-03-01T18:45:00Z'
	},
	{
		id: 'ws-q7r8s9t0',
		name: 'API Gateway Config',
		owner: 'user-003',
		node: 'node-01',
		labels: { env: 'production', team: 'platform' },
		created_at: '2025-10-20T09:30:00Z',
		updated_at: '2026-02-28T15:10:00Z'
	},
	{
		id: 'ws-u1v2w3x4',
		name: 'Sandbox Experiments',
		owner: 'user-002',
		node: 'node-03',
		labels: { env: 'development', team: 'ai-research' },
		created_at: '2026-02-15T14:20:00Z',
		updated_at: '2026-02-25T10:00:00Z'
	},
	{
		id: 'ws-y5z6a7b8',
		name: 'Documentation Builder',
		owner: 'user-001',
		node: 'node-01',
		labels: { env: 'production', team: 'docs' },
		created_at: '2026-01-05T11:15:00Z',
		updated_at: '2026-03-04T08:30:00Z'
	},
	{
		id: 'ws-c9d0e1f2',
		name: 'Integration Tests',
		owner: 'user-003',
		node: 'node-02',
		labels: { env: 'testing', team: 'qa' },
		created_at: '2026-02-20T07:00:00Z',
		updated_at: '2026-03-04T16:00:00Z'
	}
]

export const mockDirEntries: Record<string, DirEntry[]> = {
	'/': [
		{ name: 'src', is_dir: true, size: 0 },
		{ name: 'config', is_dir: true, size: 0 },
		{ name: 'data', is_dir: true, size: 0 },
		{ name: 'scripts', is_dir: true, size: 0 },
		{ name: '.workspace.json', is_dir: false, size: 256 },
		{ name: 'README.md', is_dir: false, size: 2048 },
		{ name: 'Makefile', is_dir: false, size: 1024 },
		{ name: 'package.json', is_dir: false, size: 512 }
	],
	'/src': [
		{ name: 'main.ts', is_dir: false, size: 4096 },
		{ name: 'utils.ts', is_dir: false, size: 2048 },
		{ name: 'index.ts', is_dir: false, size: 1024 },
		{ name: 'types.ts', is_dir: false, size: 768 },
		{ name: 'handlers', is_dir: true, size: 0 },
		{ name: 'models', is_dir: true, size: 0 }
	],
	'/config': [
		{ name: 'app.yaml', is_dir: false, size: 1536 },
		{ name: 'database.yaml', is_dir: false, size: 896 },
		{ name: 'logging.yaml', is_dir: false, size: 512 }
	],
	'/data': [
		{ name: 'training_data.csv', is_dir: false, size: 10485760 },
		{ name: 'model_weights.bin', is_dir: false, size: 52428800 },
		{ name: 'embeddings.json', is_dir: false, size: 8388608 },
		{ name: 'cache', is_dir: true, size: 0 }
	],
	'/scripts': [
		{ name: 'deploy.sh', is_dir: false, size: 2048 },
		{ name: 'build.sh', is_dir: false, size: 1536 },
		{ name: 'test.sh', is_dir: false, size: 1024 },
		{ name: 'clean.sh', is_dir: false, size: 512 }
	]
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const mockApi = {
	listWorkspaces: async (filter?: { owner?: string; node?: string }): Promise<Workspace[]> => {
		await delay(300)
		let result = [...mockWorkspaces]
		if (filter?.owner) result = result.filter((w) => w.owner === filter.owner)
		if (filter?.node) result = result.filter((w) => w.node === filter.node)
		return result
	},

	getWorkspace: async (id: string): Promise<Workspace | null> => {
		await delay(200)
		return mockWorkspaces.find((w) => w.id === id) || null
	},

	createWorkspace: async (opts: { name: string; owner: string; node: string; labels?: Record<string, string> }): Promise<Workspace> => {
		await delay(400)
		const ws: Workspace = {
			id: `ws-${Math.random().toString(36).substr(2, 8)}`,
			name: opts.name,
			owner: opts.owner,
			node: opts.node,
			labels: opts.labels || {},
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		}
		mockWorkspaces.unshift(ws)
		return ws
	},

	updateWorkspace: async (id: string, opts: { name?: string; labels?: Record<string, string> }): Promise<Workspace | null> => {
		await delay(300)
		const ws = mockWorkspaces.find((w) => w.id === id)
		if (!ws) return null
		if (opts.name !== undefined) ws.name = opts.name
		if (opts.labels !== undefined) ws.labels = opts.labels
		ws.updated_at = new Date().toISOString()
		return { ...ws }
	},

	deleteWorkspace: async (id: string): Promise<boolean> => {
		await delay(300)
		const idx = mockWorkspaces.findIndex((w) => w.id === id)
		if (idx === -1) return false
		mockWorkspaces.splice(idx, 1)
		return true
	},

	listDir: async (_wsId: string, path: string): Promise<DirEntry[]> => {
		await delay(200)
		return mockDirEntries[path] || []
	},

	getNodes: async (): Promise<NodeInfo[]> => {
		await delay(200)
		return [...mockNodes]
	},

	uploadFile: async (_wsId: string, _path: string, _file: File): Promise<boolean> => {
		await delay(800)
		return true
	},

	deleteFile: async (_wsId: string, _path: string): Promise<boolean> => {
		await delay(300)
		return true
	}
}
