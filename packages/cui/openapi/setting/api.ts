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
	SmtpTestResult
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

	// ─── LLM Providers ──────────────────────────────────

	async GetLLMConfig(): Promise<ApiResponse<LLMPageData>> {
		return this.api.Get<LLMPageData>('/setting/llm')
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
}
