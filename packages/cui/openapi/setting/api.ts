import { OpenAPI } from '../openapi'
import type { ApiResponse } from '../types'
import type { SystemInfoData, CheckUpdateResult, CloudServiceData, CloudServiceTestResult } from './types'

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
}
