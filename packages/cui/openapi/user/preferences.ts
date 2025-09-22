import { OpenAPI } from '../openapi'
import { ApiResponse } from '../types'
import { UserPreferences } from './types'

/**
 * User Preferences Management API
 */
export class UserPreferencesAPI {
	constructor(private api: OpenAPI) {}

	/**
	 * Get user preferences
	 */
	async GetPreferences(): Promise<ApiResponse<UserPreferences>> {
		return this.api.Get<UserPreferences>('/user/preferences')
	}

	/**
	 * Get user preferences schema
	 */
	async GetPreferencesSchema(): Promise<ApiResponse<any>> {
		return this.api.Get<any>('/user/preferences/schema')
	}

	/**
	 * Update user preferences
	 */
	async UpdatePreferences(preferences: Partial<UserPreferences>): Promise<ApiResponse<UserPreferences>> {
		return this.api.Put<UserPreferences>('/user/preferences', preferences)
	}
}
