import { OpenAPI } from '../openapi'
import type { ApiResponse } from '../types'
import type { SystemInfoData, CheckUpdateResult } from './types'

export class Setting {
	constructor(private api: OpenAPI) {}

	async GetSystemInfo(locale?: string): Promise<ApiResponse<SystemInfoData>> {
		const params = locale ? `?locale=${encodeURIComponent(locale)}` : ''
		return this.api.Get<SystemInfoData>(`/setting/system${params}`)
	}

	async CheckUpdate(): Promise<ApiResponse<CheckUpdateResult>> {
		return this.api.Post<CheckUpdateResult>('/setting/system/check-update', {})
	}
}
