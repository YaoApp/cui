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
	LLMProviderTestResult
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
}
