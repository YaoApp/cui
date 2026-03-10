import { OpenAPI } from '../openapi'
import type { ApiResponse } from '../types'
import type { VNCStatus } from './types'
import type { BoxInfo, CreateBoxOptions, ExecRequest, ExecResult } from '../../pages/computers/types'

export class Sandbox {
	constructor(private api: OpenAPI) {}

	private get baseURL(): string {
		// @ts-ignore - Access private config to get baseURL
		return this.api.config.baseURL
	}

	// ===== Sandbox Management =====

	async ListBoxes(nodeId?: string): Promise<ApiResponse<BoxInfo[]>> {
		const params: Record<string, string> = {}
		if (nodeId) params.node_id = nodeId
		return this.api.Get<BoxInfo[]>('/sandbox', params)
	}

	async GetBox(id: string): Promise<ApiResponse<BoxInfo>> {
		return this.api.Get<BoxInfo>(`/sandbox/${id}`)
	}

	async CreateBox(opts: CreateBoxOptions): Promise<ApiResponse<BoxInfo>> {
		return this.api.Post<BoxInfo>('/sandbox', opts)
	}

	async RemoveBox(id: string): Promise<ApiResponse<void>> {
		return this.api.Delete<void>(`/sandbox/${id}`)
	}

	async Exec(id: string, req: ExecRequest): Promise<ApiResponse<ExecResult>> {
		return this.api.Post<ExecResult>(`/sandbox/${id}/exec`, req)
	}

	async Heartbeat(id: string, active: boolean, processCount: number): Promise<ApiResponse<void>> {
		return this.api.Post<void>(`/sandbox/${id}/heartbeat`, { active, process_count: processCount })
	}

	// ===== VNC =====

	async GetVNCStatus(sandboxId: string): Promise<VNCStatus | null> {
		const response = await this.api.Get<VNCStatus>(`/sandbox/${sandboxId}/vnc`)
		if (this.api.IsError(response)) {
			console.error('Failed to get VNC status:', response.error)
			return null
		}
		return this.api.GetData(response)
	}

	GetVNCClientURL(sandboxId: string): string {
		return `${this.baseURL}/sandbox/${sandboxId}/vnc/client`
	}

	GetVNCWebSocketURL(sandboxId: string): string {
		const baseURL = this.baseURL
		let wsBaseURL: string

		if (typeof window !== 'undefined') {
			const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
			const host = window.location.host
			let path = ''
			try {
				const url = new URL(baseURL, window.location.origin)
				path = url.pathname
			} catch {
				path = baseURL.startsWith('/') ? baseURL : `/${baseURL}`
			}
			wsBaseURL = `${protocol}//${host}${path}`
		} else {
			wsBaseURL = baseURL.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')
		}

		return `${wsBaseURL}/sandbox/${sandboxId}/vnc/ws`
	}

	GetViewerURL(sandboxId: string): string {
		return `/sandbox/${sandboxId}`
	}
}
