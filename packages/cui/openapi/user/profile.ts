import { OpenAPI } from '../openapi'
import { ApiResponse } from '../types'
import { UserProfile } from './types'

/**
 * User Profile Management API
 */
export class UserProfileAPI {
	constructor(private api: OpenAPI) {}

	/**
	 * Get user profile
	 */
	async GetProfile(): Promise<ApiResponse<UserProfile>> {
		return this.api.Get<UserProfile>('/user/profile')
	}

	/**
	 * Update user profile
	 */
	async UpdateProfile(profile: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
		return this.api.Put<UserProfile>('/user/profile', profile)
	}
}
