import { getLocale } from '@umijs/max'
import { OpenAPI } from '../openapi'
import type { ApiResponse } from '../types'
import type {
	SystemInfoData,
	CheckUpdateResult,
	CloudServiceData,
	CloudServiceTestResult,
	LLMPageData,
	LLMProviderConfig,
	LLMRoleAssignment,
	LLMProviderTestResult,
	SearchPageData,
	SearchProviderConfig,
	SearchToolAssignment,
	SearchTestResult,
	SmtpPageData,
	SmtpConfig,
	SmtpTestResult,
	McpPageData,
	McpServerConfig,
	SandboxPageData,
	SandboxRegistryConfig,
	SandboxImage,
	SetupStatus,
	AssistantSetupStatus,
	PreferenceData,
	AgentSettingPageData,
	UserAgentSetting,
	SecretEntry,
	AgentSkill,
	APIKeyResponse,
	APIKeyCreateResponse
} from './types'

export class Setting {
	constructor(private api: OpenAPI) {}

	async GetSystemInfo(locale?: string): Promise<ApiResponse<SystemInfoData>> {
		const params = locale ? `?locale=${encodeURIComponent(locale)}` : ''
		return this.api.Get<SystemInfoData>(`/setting/system${params}`)
	}

	async CheckUpdate(): Promise<ApiResponse<CheckUpdateResult>> {
		return this.api.Post<CheckUpdateResult>('/setting/system/check-update', {})
	}

	async GetCloudService(): Promise<ApiResponse<CloudServiceData>> {
		return this.api.Get<CloudServiceData>('/setting/cloud')
	}

	async SaveCloudService(data: Partial<CloudServiceData>): Promise<ApiResponse<CloudServiceData>> {
		return this.api.Put<CloudServiceData>('/setting/cloud', data)
	}

	async TestCloudService(data?: { api_url?: string; api_key?: string }): Promise<ApiResponse<CloudServiceTestResult>> {
		return this.api.Post<CloudServiceTestResult>('/setting/cloud/test', data || {})
	}

	async RefreshCloudModels(): Promise<ApiResponse<{ success: boolean; count: number }>> {
		return this.api.Post<{ success: boolean; count: number }>('/setting/cloud/refresh', {})
	}

	// ─── LLM Providers ──────────────────────────────────

	async GetLLMConfig(): Promise<ApiResponse<LLMPageData>> {
		const locale = getLocale()
		return this.api.Get<LLMPageData>(`/setting/llm?locale=${locale}`)
	}

	async TestLLMConnection(data: { api_url: string; api_key?: string; type?: string }): Promise<ApiResponse<LLMProviderTestResult>> {
		return this.api.Post<LLMProviderTestResult>('/setting/llm/test', data)
	}

	async SaveRoles(roles: LLMRoleAssignment): Promise<ApiResponse<LLMRoleAssignment>> {
		return this.api.Put<LLMRoleAssignment>('/setting/llm/roles', roles)
	}

	async CreateProvider(data: Record<string, any>): Promise<ApiResponse<LLMProviderConfig>> {
		return this.api.Post<LLMProviderConfig>('/setting/llm/providers', data)
	}

	async UpdateProvider(key: string, data: Record<string, any>): Promise<ApiResponse<LLMProviderConfig>> {
		return this.api.Put<LLMProviderConfig>(`/setting/llm/providers/${encodeURIComponent(key)}`, data)
	}

	async DeleteProvider(key: string): Promise<ApiResponse<{ success: boolean; warning?: string }>> {
		return this.api.Delete<{ success: boolean; warning?: string }>(`/setting/llm/providers/${encodeURIComponent(key)}`)
	}

	async TestProvider(key: string): Promise<ApiResponse<LLMProviderTestResult>> {
		return this.api.Post<LLMProviderTestResult>(`/setting/llm/providers/${encodeURIComponent(key)}/test`, {})
	}

	// ─── Search & Scrape ──────────────────────────────────

	async GetSearchConfig(): Promise<ApiResponse<SearchPageData>> {
		return this.api.Get<SearchPageData>('/setting/search')
	}

	async UpdateSearchProvider(key: string, data: { field_values: Record<string, string> }): Promise<ApiResponse<SearchProviderConfig>> {
		return this.api.Put<SearchProviderConfig>(`/setting/search/providers/${encodeURIComponent(key)}`, data)
	}

	async ToggleSearchProvider(key: string, data: { enabled: boolean }): Promise<ApiResponse<SearchProviderConfig>> {
		return this.api.Put<SearchProviderConfig>(`/setting/search/providers/${encodeURIComponent(key)}/toggle`, data)
	}

	async TestSearchProvider(key: string, data?: { field_values?: Record<string, string> }): Promise<ApiResponse<SearchTestResult>> {
		return this.api.Post<SearchTestResult>(`/setting/search/providers/${encodeURIComponent(key)}/test`, data || {})
	}

	async SaveSearchToolAssignment(data: SearchToolAssignment): Promise<ApiResponse<SearchToolAssignment>> {
		return this.api.Put<SearchToolAssignment>('/setting/search/tool-assignment', data)
	}

	// ─── SMTP ──────────────────────────────────────────────

	async GetSmtpConfig(locale?: string): Promise<ApiResponse<SmtpPageData>> {
		const params = locale ? `?locale=${encodeURIComponent(locale)}` : ''
		return this.api.Get<SmtpPageData>(`/setting/smtp${params}`)
	}

	async SaveSmtpConfig(data: Partial<SmtpConfig>): Promise<ApiResponse<SmtpConfig>> {
		return this.api.Put<SmtpConfig>('/setting/smtp', data)
	}

	async ToggleSmtp(data: { enabled: boolean }): Promise<ApiResponse<SmtpConfig>> {
		return this.api.Put<SmtpConfig>('/setting/smtp/toggle', data)
	}

	async TestSmtp(data: { to_email: string }): Promise<ApiResponse<SmtpTestResult>> {
		return this.api.Post<SmtpTestResult>('/setting/smtp/test', data)
	}

	// ─── MCP Servers ──────────────────────────────────────────

	async GetMcpServers(): Promise<ApiResponse<McpPageData>> {
		return this.api.Get<McpPageData>('/setting/mcp/servers')
	}

	async CreateMcpServer(data: Omit<McpServerConfig, 'id' | 'status' | 'enabled'>): Promise<ApiResponse<McpServerConfig>> {
		return this.api.Post<McpServerConfig>('/setting/mcp/servers', data)
	}

	async UpdateMcpServer(id: string, data: Partial<McpServerConfig>): Promise<ApiResponse<McpServerConfig>> {
		return this.api.Put<McpServerConfig>(`/setting/mcp/servers/${encodeURIComponent(id)}`, data)
	}

	async DeleteMcpServer(id: string): Promise<ApiResponse<void>> {
		return this.api.Delete<void>(`/setting/mcp/servers/${encodeURIComponent(id)}`)
	}

	async TestMcpServer(data: { transport: string; url: string; authorization_token?: string; timeout?: string }): Promise<ApiResponse<{ success: boolean; message: string; latency_ms?: number }>> {
		return this.api.Post<{ success: boolean; message: string; latency_ms?: number }>('/setting/mcp/test', data)
	}

	// ─── Sandbox ──────────────────────────────────────────────

	async GetSandboxConfig(locale?: string): Promise<ApiResponse<SandboxPageData>> {
		const params = locale ? `?locale=${encodeURIComponent(locale)}` : ''
		return this.api.Get<SandboxPageData>(`/setting/sandbox${params}`)
	}

	async SaveSandboxRegistry(data: Partial<SandboxRegistryConfig>): Promise<ApiResponse<SandboxRegistryConfig>> {
		return this.api.Put<SandboxRegistryConfig>('/setting/sandbox/registry', data)
	}

	async PullSandboxImage(nodeId: string, imageId: string): Promise<ApiResponse<SandboxImage>> {
		return this.api.Post<SandboxImage>(`/setting/sandbox/nodes/${encodeURIComponent(nodeId)}/images/${encodeURIComponent(imageId)}/pull`, {})
	}

	async PullAllSandboxImages(nodeId: string, locale?: string): Promise<ApiResponse<SandboxImage[]>> {
		const params = locale ? `?locale=${encodeURIComponent(locale)}` : ''
		return this.api.Post<SandboxImage[]>(`/setting/sandbox/nodes/${encodeURIComponent(nodeId)}/images/pull-all${params}`, {})
	}

	async RemoveSandboxImage(nodeId: string, imageId: string): Promise<ApiResponse<{ success: boolean }>> {
		return this.api.Delete<{ success: boolean }>(`/setting/sandbox/nodes/${encodeURIComponent(nodeId)}/images/${encodeURIComponent(imageId)}`)
	}

	async CheckSandboxDocker(nodeId: string): Promise<ApiResponse<{ docker_version?: string; message?: string }>> {
		return this.api.Post<{ docker_version?: string; message?: string }>(`/setting/sandbox/nodes/${encodeURIComponent(nodeId)}/check-docker`, {})
	}

	// ─── Setup Status ──────────────────────────────────

	async GetSetupStatus(locale?: string): Promise<ApiResponse<SetupStatus>> {
		const params = locale ? `?locale=${encodeURIComponent(locale)}` : ''
		return this.api.Get<SetupStatus>(`/setting/setup-status${params}`)
	}

	async GetAssistantSetupStatus(id: string): Promise<ApiResponse<AssistantSetupStatus>> {
		return this.api.Get<AssistantSetupStatus>(`/setting/setup-status/assistant/${encodeURIComponent(id)}`)
	}

	// ─── User Preference ───────────────────────────────

	async GetPreference(): Promise<ApiResponse<PreferenceData>> {
		return this.api.Get<PreferenceData>('/setting/preference')
	}

	async UpdatePreference(data: Partial<PreferenceData>): Promise<ApiResponse<PreferenceData>> {
		return this.api.Put<PreferenceData>('/setting/preference', data)
	}

	// ─── Agent Setting ────────────────────────────────

	async GetAgentSetting(id: string): Promise<ApiResponse<AgentSettingPageData>> {
		return this.api.Get<AgentSettingPageData>(`/setting/agent/${encodeURIComponent(id)}`)
	}

	async UpdateAgentSetting(id: string, data: Partial<UserAgentSetting>): Promise<ApiResponse<{ runners?: string[]; image?: string }>> {
		return this.api.Put<{ runners?: string[]; image?: string }>(`/setting/agent/${encodeURIComponent(id)}`, data)
	}

	async GetAgentSecrets(id: string): Promise<ApiResponse<Record<string, SecretEntry>>> {
		return this.api.Get<Record<string, SecretEntry>>(`/setting/agent/${encodeURIComponent(id)}/secrets`)
	}

	async UpdateAgentSecrets(id: string, secrets: Record<string, { value: string; label?: string; description?: string; required?: boolean; multiline?: boolean }>): Promise<ApiResponse<{ updated: string[] }>> {
		return this.api.Put<{ updated: string[] }>(`/setting/agent/${encodeURIComponent(id)}/secrets`, secrets)
	}

	async DeleteAgentSecret(id: string, key: string): Promise<ApiResponse<{ success: boolean }>> {
		return this.api.Delete<{ success: boolean }>(`/setting/agent/${encodeURIComponent(id)}/secrets/${encodeURIComponent(key)}`)
	}

	async GetAgentSkills(id: string): Promise<ApiResponse<AgentSkill[]>> {
		return this.api.Get<AgentSkill[]>(`/setting/agent/${encodeURIComponent(id)}/skills`)
	}

	async GetAgentSkillDetail(id: string, name: string): Promise<ApiResponse<{ name: string; description?: string; content: string }>> {
		return this.api.Get<{ name: string; description?: string; content: string }>(`/setting/agent/${encodeURIComponent(id)}/skills/${encodeURIComponent(name)}`)
	}

	// ─── API Keys ──────────────────────────────────────────

	async GetApiKeys(): Promise<ApiResponse<APIKeyResponse[]>> {
		return this.api.Get<APIKeyResponse[]>('/setting/api-keys')
	}

	async CreateApiKey(data: { name: string; expires_at?: string }): Promise<ApiResponse<APIKeyCreateResponse>> {
		return this.api.Post<APIKeyCreateResponse>('/setting/api-keys', data)
	}

	async DeleteApiKey(keyId: string): Promise<ApiResponse<{ success: boolean }>> {
		return this.api.Delete<{ success: boolean }>(`/setting/api-keys/${encodeURIComponent(keyId)}`)
	}

	async RegenerateApiKey(keyId: string): Promise<ApiResponse<APIKeyCreateResponse>> {
		return this.api.Post<APIKeyCreateResponse>(`/setting/api-keys/${encodeURIComponent(keyId)}/regenerate`, {})
	}
}
