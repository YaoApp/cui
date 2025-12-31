import OpenAPI from './openapi'
import { ApiResponse } from './types'
import type { App } from '@/types'

/**
 * Menu response structure
 * Uses App.Menu and App.Menus types for compatibility
 */
export type MenuResponse = App.Menus

/**
 * App API class for application-related endpoints
 */
export class AppAPI {
	constructor(private api: OpenAPI) {}

	/**
	 * Get application menu
	 * @param locale - The locale for menu localization (e.g., 'en-us', 'zh-cn')
	 * @returns Menu response with items, setting, and quick menus
	 */
	async GetMenu(locale?: string): Promise<ApiResponse<MenuResponse>> {
		const query: Record<string, string> = {}
		if (locale) {
			query.locale = locale
		}
		return this.api.Get<MenuResponse>('/app/menu', query)
	}
}

export default AppAPI
