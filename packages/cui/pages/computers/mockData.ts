import type { BoxInfo, PoolInfo } from './types'

export const mockPools: PoolInfo[] = [
	{
		name: 'local',
		addr: 'local',
		connected: true,
		boxes: 5,
		max_per_user: 0,
		max_total: 20,
		idle_timeout: 1800000,
		max_lifetime: 0
	},
	{
		name: 'gpu',
		addr: 'tai://gpu-server.internal',
		connected: true,
		boxes: 2,
		max_per_user: 1,
		max_total: 4,
		idle_timeout: 600000,
		max_lifetime: 7200000
	},
	{
		name: 'k8s',
		addr: 'tai://k8s-proxy.internal',
		connected: false,
		boxes: 0,
		max_per_user: 0,
		max_total: 100,
		idle_timeout: 3600000,
		max_lifetime: 0
	}
]

export const mockBoxes: BoxInfo[] = [
	{
		id: 'sb-dev-workspace-01',
		container_id: 'c4a8e2f1b3d5',
		pool: 'local',
		owner: 'user-001',
		status: 'running',
		policy: 'persistent',
		labels: { purpose: 'development', project: 'yao-app' },
		image: 'yaoapp/workspace:latest',
		created_at: '2026-02-20T09:00:00Z',
		last_active: '2026-03-05T10:30:00Z',
		process_count: 3,
		vnc: true,
		workspace_id: 'ws-a1b2c3d4',
		workspace_name: '开发环境'
	},
	{
		id: 'sb-data-pipeline-02',
		container_id: 'a7b3c9d2e6f1',
		pool: 'gpu',
		owner: 'user-001',
		status: 'running',
		policy: 'longrunning',
		labels: { purpose: 'ml-training', dataset: 'imagenet-v2' },
		image: 'yaoapp/ml-runtime:cuda12',
		created_at: '2026-03-01T14:00:00Z',
		last_active: '2026-03-05T09:45:00Z',
		process_count: 1,
		vnc: true,
		workspace_id: 'ws-e5f6g7h8',
		workspace_name: 'ML 训练'
	},
	{
		id: 'sb-agent-session-03',
		container_id: 'f2e8d4c6b1a3',
		pool: 'local',
		owner: 'user-002',
		status: 'running',
		policy: 'session',
		labels: { agent: 'code-assistant', chat: 'chat-xyz' },
		image: 'yaoapp/sandbox:v2',
		created_at: '2026-03-05T08:00:00Z',
		last_active: '2026-03-05T10:20:00Z',
		process_count: 0,
		vnc: false
	},
	{
		id: 'sb-staging-env-04',
		container_id: 'b9c5a1d7e3f2',
		pool: 'local',
		owner: 'user-001',
		status: 'stopped',
		policy: 'persistent',
		labels: { purpose: 'staging', env: 'staging' },
		image: 'yaoapp/workspace:latest',
		created_at: '2026-01-15T11:00:00Z',
		last_active: '2026-03-03T16:00:00Z',
		process_count: 0,
		vnc: true,
		workspace_id: 'ws-i9j0k1l2',
		workspace_name: '预发布环境'
	},
	{
		id: 'sb-oneshot-task-05',
		container_id: 'e1d3c5b7a9f2',
		pool: 'local',
		owner: 'user-003',
		status: 'running',
		policy: 'oneshot',
		labels: { task: 'build-artifact' },
		image: 'yaoapp/builder:latest',
		created_at: '2026-03-05T10:15:00Z',
		last_active: '2026-03-05T10:15:00Z',
		process_count: 1,
		vnc: false
	},
	{
		id: 'sb-longrun-web-06',
		container_id: 'd8e2f4a6b1c3',
		pool: 'local',
		owner: 'user-001',
		status: 'running',
		policy: 'longrunning',
		labels: { purpose: 'web-server', port: '8080' },
		image: 'yaoapp/workspace:latest',
		created_at: '2026-02-28T13:00:00Z',
		last_active: '2026-03-05T10:28:00Z',
		process_count: 2,
		vnc: false,
		workspace_id: 'ws-m3n4o5p6',
		workspace_name: 'Web 服务'
	},
	{
		id: 'sb-gpu-training-07',
		container_id: 'c6a2e8d4f1b3',
		pool: 'gpu',
		owner: 'user-002',
		status: 'stopped',
		policy: 'longrunning',
		labels: { purpose: 'training', model: 'llama-3' },
		image: 'yaoapp/ml-runtime:cuda12',
		created_at: '2026-02-25T10:00:00Z',
		last_active: '2026-03-04T22:00:00Z',
		process_count: 0,
		vnc: true
	}
]

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const mockApi = {
	listBoxes: async (filter?: { owner?: string; pool?: string; policy?: string }): Promise<BoxInfo[]> => {
		await delay(300)
		let result = [...mockBoxes]
		if (filter?.owner) result = result.filter((b) => b.owner === filter.owner)
		if (filter?.pool) result = result.filter((b) => b.pool === filter.pool)
		if (filter?.policy) result = result.filter((b) => b.policy === filter.policy)
		return result
	},

	getBox: async (id: string): Promise<BoxInfo | null> => {
		await delay(150)
		return mockBoxes.find((b) => b.id === id) || null
	},

	createBox: async (opts: {
		owner: string
		pool?: string
		image: string
		policy: string
		vnc?: boolean
		workspace_id?: string
		labels?: Record<string, string>
	}): Promise<BoxInfo> => {
		await delay(500)
		const id = `sb-${Date.now().toString(36)}`
		const now = new Date().toISOString()
		return {
			id,
			container_id: Math.random().toString(36).slice(2, 14),
			pool: opts.pool || 'local',
			owner: opts.owner,
			status: 'running',
			policy: opts.policy as BoxInfo['policy'],
			labels: opts.labels || {},
			image: opts.image,
			created_at: now,
			last_active: now,
			process_count: 0,
			vnc: opts.vnc || false,
			workspace_id: opts.workspace_id
		}
	},

	startBox: async (_id: string): Promise<boolean> => {
		await delay(400)
		return true
	},

	stopBox: async (_id: string): Promise<boolean> => {
		await delay(400)
		return true
	},

	removeBox: async (_id: string): Promise<boolean> => {
		await delay(300)
		return true
	},

	getVNCUrl: async (id: string): Promise<string> => {
		await delay(200)
		return `wss://vnc.example.com/websockify?token=${id}`
	},

	getPools: async (): Promise<PoolInfo[]> => {
		await delay(200)
		return [...mockPools]
	},

	testNode: async (addr: string): Promise<boolean> => {
		await delay(1200)
		if (addr.includes('fail') || addr.includes('invalid')) throw new Error('Connection refused')
		return true
	}
}
