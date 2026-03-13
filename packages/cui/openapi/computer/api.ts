import { OpenAPI } from '../openapi'
import type { ApiResponse } from '../types'
import type { ComputerFilter } from '../agent/types'

export interface ComputerOption {
	kind: 'box' | 'host' | 'node'
	id: string
	display_name: string
	node_id: string
	status: string
	mode?: string
	addr?: string
	image?: string
	policy?: string
	vnc?: boolean
	labels?: Record<string, string>
	system: {
		os: string
		arch: string
		hostname: string
		num_cpu: number
		total_mem?: number
	}
}

export class ComputerAPI {
	constructor(private api: OpenAPI) {}

	private get baseURL(): string {
		// @ts-ignore
		return this.api.config.baseURL
	}

	async Options(filter?: ComputerFilter): Promise<ApiResponse<ComputerOption[]>> {
		const params: Record<string, string> = {}
		if (filter) {
			if (filter.kind) params.kind = filter.kind
			if (filter.image) params.image = filter.image
			if (filter.vnc !== undefined) params.vnc = String(filter.vnc)
			if (filter.os) params.os = filter.os
			if (filter.arch) params.arch = filter.arch
			if (filter.min_cpus) params.min_cpus = String(filter.min_cpus)
			if (filter.min_mem) params.min_mem = filter.min_mem
		}
		return this.api.Get<ComputerOption[]>('/computer/options', params)
	}

	GetVNCWebSocketURL(taiID: string, containerID?: string): string {
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
		const target = containerID || '__host__'
		return `${wsBaseURL}/tai/${taiID}/vnc/${target}/ws`
	}

	GetViewerURL(taiID: string): string {
		return `/computer/${taiID}/desktop`
	}
}
