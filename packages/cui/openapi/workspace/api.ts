import { OpenAPI } from '../openapi'
import type { ApiResponse } from '../types'
import type { Workspace, DirEntry, CreateWorkspaceOptions, UpdateWorkspaceOptions } from '../../pages/workspace/types'

export class WorkspaceAPI {
	constructor(private api: OpenAPI) {}

	async List(node?: string): Promise<ApiResponse<Workspace[]>> {
		const params: Record<string, string> = {}
		if (node) params.node = node
		return this.api.Get<Workspace[]>('/workspace', params)
	}

	async Options(node?: string): Promise<ApiResponse<Workspace[]>> {
		const params: Record<string, string> = {}
		if (node) params.node = node
		return this.api.Get<Workspace[]>('/workspace/options', params)
	}

	async Get(id: string): Promise<ApiResponse<Workspace>> {
		return this.api.Get<Workspace>(`/workspace/${id}`)
	}

	async Create(opts: CreateWorkspaceOptions): Promise<ApiResponse<Workspace>> {
		return this.api.Post<Workspace>('/workspace', opts)
	}

	async Update(id: string, opts: UpdateWorkspaceOptions): Promise<ApiResponse<Workspace>> {
		return this.api.Put<Workspace>(`/workspace/${id}`, opts)
	}

	async Delete(id: string, force?: boolean): Promise<ApiResponse<void>> {
		const path = force ? `/workspace/${id}?force=true` : `/workspace/${id}`
		return this.api.Delete<void>(path)
	}

	async ListDir(wsId: string, path: string): Promise<ApiResponse<DirEntry[]>> {
		return this.api.Get<DirEntry[]>(`/workspace/${wsId}/files`, { path })
	}

	async ReadFile(wsId: string, path: string, encoding?: 'base64'): Promise<ApiResponse<any>> {
		const params: Record<string, string> = {}
		if (encoding) params.encoding = encoding
		return this.api.Get<any>(`/workspace/${wsId}/files/${path}`, params)
	}

	ContentURL(wsId: string, path: string): string {
		const base = (this.api as any).config?.baseURL ?? ''
		const normalized = path.startsWith('/') ? path.slice(1) : path
		return `${base}/workspace/${wsId}/files/${normalized}`
	}

	async WriteFile(wsId: string, path: string, data: string | ArrayBuffer): Promise<ApiResponse<void>> {
		return this.api.Put<void>(`/workspace/${wsId}/files/${path}`, data)
	}

	async DeleteFile(wsId: string, path: string): Promise<ApiResponse<void>> {
		return this.api.Delete<void>(`/workspace/${wsId}/files/${path}`)
	}

	async Mkdir(wsId: string, path: string): Promise<ApiResponse<void>> {
		return this.api.Post<void>(`/workspace/${wsId}/mkdir`, { path })
	}

	async Rename(wsId: string, oldPath: string, newPath: string): Promise<ApiResponse<void>> {
		return this.api.Post<void>(`/workspace/${wsId}/rename`, { old_path: oldPath, new_path: newPath })
	}
}
