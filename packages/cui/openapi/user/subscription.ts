import { OpenAPI } from '../openapi'
import { ApiResponse } from '../types'
import { UserSubscription } from './types'

/**
 * User Subscription Management API
 */
export class UserSubscriptionAPI {
	constructor(private api: OpenAPI) {}

	/**
	 * Get user subscription
	 */
	async GetSubscription(): Promise<ApiResponse<UserSubscription>> {
		return this.api.Get<UserSubscription>('/user/subscription')
	}

	/**
	 * Update user subscription
	 */
	async UpdateSubscription(subscription: Partial<UserSubscription>): Promise<ApiResponse<UserSubscription>> {
		return this.api.Put<UserSubscription>('/user/subscription', subscription)
	}
}
