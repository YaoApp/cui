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
	GitFileDiffResponse,
	GitCredentialEntry,
	GitSSHKeyEntry
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

	// --- Git Config & Credentials ---

	async GitConfigGet(wsId: string, key?: string): Promise<ApiResponse<{ values: Record<string, string> }>> {
		const params: Record<string, string> = {}
		if (key) params.key = key
		return this.api.Get<{ values: Record<string, string> }>(`/workspace/${wsId}/git/config`, params)
	}

	async GitConfigSet(wsId: string, key: string, value: string): Promise<ApiResponse<{ success: boolean }>> {
		return this.api.Post<{ success: boolean }>(`/workspace/${wsId}/git/config`, { key, value })
	}

	async GitCredentialSet(
		wsId: string,
		host: string,
		token: string,
		username?: string
	): Promise<ApiResponse<{ success: boolean }>> {
		return this.api.Post<{ success: boolean }>(`/workspace/${wsId}/git/credential`, { host, token, username })
	}

	async GitCredentialList(wsId: string): Promise<ApiResponse<GitCredentialEntry[]>> {
		return this.api.Get<GitCredentialEntry[]>(`/workspace/${wsId}/git/credentials`)
	}

	async GitCredentialDelete(wsId: string, host: string): Promise<ApiResponse<{ success: boolean }>> {
		return this.api.Delete<{ success: boolean }>(`/workspace/${wsId}/git/credential?host=${encodeURIComponent(host)}`)
	}

	async GitSSHKeyImport(
		wsId: string,
		name: string,
		privateKey: string,
		opts?: { public_key?: string; host?: string }
	): Promise<ApiResponse<{ success: boolean }>> {
		return this.api.Post<{ success: boolean }>(`/workspace/${wsId}/git/ssh-key`, {
			name,
			private_key: privateKey,
			...opts
		})
	}

	async GitSSHKeyList(wsId: string): Promise<ApiResponse<GitSSHKeyEntry[]>> {
		return this.api.Get<GitSSHKeyEntry[]>(`/workspace/${wsId}/git/ssh-keys`)
	}

	async GitSSHKeyDelete(wsId: string, name: string): Promise<ApiResponse<{ success: boolean }>> {
		return this.api.Delete<{ success: boolean }>(`/workspace/${wsId}/git/ssh-key?name=${encodeURIComponent(name)}`)
	}

	// --- Git Remote Sync ---

	async GitFetch(wsId: string, repoPath: string, remote?: string): Promise<ApiResponse<{ success: boolean }>> {
		return this.api.Post<{ success: boolean }>(`/workspace/${wsId}/git/fetch`, { repo_path: repoPath, remote })
	}

	async GitPull(
		wsId: string,
		repoPath: string,
		opts?: { remote?: string; rebase?: boolean }
	): Promise<ApiResponse<{ success: boolean }>> {
		return this.api.Post<{ success: boolean }>(`/workspace/${wsId}/git/pull`, {
			repo_path: repoPath,
			...opts
		})
	}

	async GitPush(
		wsId: string,
		repoPath: string,
		opts?: { remote?: string; force?: boolean; set_upstream?: boolean }
	): Promise<ApiResponse<{ success: boolean }>> {
		return this.api.Post<{ success: boolean }>(`/workspace/${wsId}/git/push`, {
			repo_path: repoPath,
			...opts
		})
	}

	async GitSync(
		wsId: string,
		repoPath: string,
		opts?: { remote?: string; set_upstream?: boolean }
	): Promise<ApiResponse<{ fetched: boolean; pulled: boolean; pushed: boolean; has_conflicts: boolean }>> {
		return this.api.Post<{ fetched: boolean; pulled: boolean; pushed: boolean; has_conflicts: boolean }>(
			`/workspace/${wsId}/git/sync`,
			{ repo_path: repoPath, ...opts }
		)
	}
}
