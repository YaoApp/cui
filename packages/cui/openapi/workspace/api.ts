import { OpenAPI } from '../openapi'
import type { ApiResponse } from '../types'
import type {
	Workspace,
	WorkspaceOptionsResponse,
	DirEntry,
	CreateWorkspaceOptions,
	UpdateWorkspaceOptions,
	GitRepo,
	GitStatusResponse,
	GitFileDiffResponse
} from '../../pages/workspace/types'

export class WorkspaceAPI {
	constructor(private api: OpenAPI) {}

	async List(node?: string): Promise<ApiResponse<Workspace[]>> {
		const params: Record<string, string> = {}
		if (node) params.node = node
		return this.api.Get<Workspace[]>('/workspace', params)
	}

	async Options(): Promise<ApiResponse<WorkspaceOptionsResponse>> {
		return this.api.Get<WorkspaceOptionsResponse>('/workspace/options')
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

	// --- Git ---

	async GitListRepos(wsId: string): Promise<ApiResponse<GitRepo[]>> {
		return this.api.Get<GitRepo[]>(`/workspace/${wsId}/git/repos`)
	}

	async GitStatus(wsId: string, repoPath: string): Promise<ApiResponse<GitStatusResponse>> {
		return this.api.Get<GitStatusResponse>(`/workspace/${wsId}/git/status`, { repo_path: repoPath })
	}

	async GitFileDiff(wsId: string, repoPath: string, filePath: string, staged: boolean): Promise<ApiResponse<GitFileDiffResponse>> {
		return this.api.Get<GitFileDiffResponse>(`/workspace/${wsId}/git/diff`, {
			repo_path: repoPath,
			file_path: filePath,
			staged: staged ? 'true' : 'false'
		})
	}

	async GitAdd(wsId: string, repoPath: string, files?: string[]): Promise<ApiResponse<{ success: boolean }>> {
		return this.api.Post<{ success: boolean }>(`/workspace/${wsId}/git/add`, { repo_path: repoPath, files })
	}

	async GitReset(wsId: string, repoPath: string, files?: string[]): Promise<ApiResponse<{ success: boolean }>> {
		return this.api.Post<{ success: boolean }>(`/workspace/${wsId}/git/reset`, { repo_path: repoPath, files })
	}

	async GitCommit(
		wsId: string,
		repoPath: string,
		message: string,
		opts?: { author_name?: string; author_email?: string; allow_empty?: boolean }
	): Promise<ApiResponse<{ commit_hash: string; message: string }>> {
		return this.api.Post<{ commit_hash: string; message: string }>(`/workspace/${wsId}/git/commit`, {
			repo_path: repoPath,
			message,
			...opts
		})
	}

	async GitDiscardChanges(wsId: string, repoPath: string, files?: string[]): Promise<ApiResponse<{ success: boolean }>> {
		return this.api.Post<{ success: boolean }>(`/workspace/${wsId}/git/discard`, { repo_path: repoPath, files })
	}
}
