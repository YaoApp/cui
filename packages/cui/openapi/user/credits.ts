import { OpenAPI } from '../openapi'
import { ApiResponse } from '../types'
import { UserCredits } from './types'

/**
 * User Credits Management API
 */
export class UserCreditsAPI {
	constructor(private api: OpenAPI) {}

	/**
	 * Get user credits info
	 */
	async GetCredits(): Promise<ApiResponse<UserCredits>> {
		return this.api.Get<UserCredits>('/user/credits')
	}

	/**
	 * Get credits change history
	 */
	async GetCreditsHistory(params?: {
		page?: number
		limit?: number
		start_date?: string
		end_date?: string
	}): Promise<ApiResponse<{
		data: any[]
		total: number
		page: number
		limit: number
	}>> {
		return this.api.Get<{
			data: any[]
			total: number
			page: number
			limit: number
		}>('/user/credits/history', params)
	}

	// ===== Top-up Management =====

	/**
	 * Get topup records
	 */
	async GetTopupRecords(params?: {
		page?: number
		limit?: number
	}): Promise<ApiResponse<{
		data: any[]
		total: number
		page: number
		limit: number
	}>> {
		return this.api.Get<{
			data: any[]
			total: number
			page: number
			limit: number
		}>('/user/credits/topup', params)
	}

	/**
	 * Create topup order
	 */
	async CreateTopupOrder(data: {
		amount: number
		currency?: string
		payment_method?: string
	}): Promise<ApiResponse<{
		order_id: string
		payment_url?: string
		message: string
	}>> {
		return this.api.Post<{
			order_id: string
			payment_url?: string
			message: string
		}>('/user/credits/topup', data)
	}

	/**
	 * Get topup order status
	 */
	async GetTopupOrderStatus(orderId: string): Promise<ApiResponse<{
		order_id: string
		status: string
		amount: number
		currency?: string
		created_at: string
		updated_at: string
	}>> {
		return this.api.Get<{
			order_id: string
			status: string
			amount: number
			currency?: string
			created_at: string
			updated_at: string
		}>(`/user/credits/topup/${orderId}`)
	}

	/**
	 * Redeem card code
	 */
	async RedeemCardCode(card_code: string): Promise<ApiResponse<{
		message: string
		credits_added: number
	}>> {
		return this.api.Post<{
			message: string
			credits_added: number
		}>('/user/credits/topup/card-code', { card_code })
	}
}
