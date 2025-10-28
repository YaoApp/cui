import { OpenAPI } from '../openapi'
import { ApiResponse } from '../types'
import { UserProfile, UpdateProfileRequest } from './types'

/**
 * User Profile Management API
 */
export class UserProfileAPI {
	constructor(private api: OpenAPI) {}

	/**
	 * Get user profile
	 * Optionally includes team, member, and type information
	 * @param options Query options
	 * @param options.team Include team information
	 * @param options.member Include member information
	 * @param options.type Include type information
	 */
	async GetProfile(options?: {
		team?: boolean
		member?: boolean
		type?: boolean
	}): Promise<ApiResponse<UserProfile>> {
		const params: Record<string, string> = {}
		if (options?.team) params.team = 'true'
		if (options?.member) params.member = 'true'
		if (options?.type) params.type = 'true'

		return this.api.Get<UserProfile>('/user/profile', params)
	}

	/**
	 * Update user profile
	 * Only profile-related fields can be updated
	 * Returns user_id and message upon successful update
	 * @param profile Profile data to update
	 */
	async UpdateProfile(profile: UpdateProfileRequest): Promise<ApiResponse<{ user_id: string; message: string }>> {
		return this.api.Put<{ user_id: string; message: string }>('/user/profile', profile)
	}
}
