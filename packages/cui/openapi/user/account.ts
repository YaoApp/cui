import { OpenAPI } from '../openapi'
import { ApiResponse } from '../types'
import { UserAccount } from './types'

/**
 * User Account Management API
 * Handles password, email, mobile management
 */
export class UserAccountAPI {
	constructor(private api: OpenAPI) {}

	/**
	 * Change password
	 */
	async ChangePassword(data: {
		current_password: string
		new_password: string
		confirm_password: string
	}): Promise<ApiResponse<{ message: string }>> {
		return this.api.Put<{ message: string }>('/user/account/password', data)
	}

	/**
	 * Request password reset
	 */
	async RequestPasswordReset(email: string): Promise<ApiResponse<{ message: string }>> {
		return this.api.Post<{ message: string }>('/user/account/password/reset/request', { email })
	}

	/**
	 * Verify password reset token and set new password
	 */
	async VerifyPasswordReset(data: {
		token: string
		new_password: string
		confirm_password: string
	}): Promise<ApiResponse<{ message: string }>> {
		return this.api.Post<{ message: string }>('/user/account/password/reset/verify', data)
	}

	/**
	 * Get current email info
	 */
	async GetEmail(): Promise<ApiResponse<UserAccount>> {
		return this.api.Get<UserAccount>('/user/account/email')
	}

	/**
	 * Request email change
	 */
	async RequestEmailChange(new_email: string): Promise<ApiResponse<{ message: string }>> {
		return this.api.Post<{ message: string }>('/user/account/email/change/request', { new_email })
	}

	/**
	 * Verify email change with code
	 */
	async VerifyEmailChange(data: {
		new_email: string
		verification_code: string
	}): Promise<ApiResponse<{ message: string }>> {
		return this.api.Post<{ message: string }>('/user/account/email/change/verify', data)
	}

	/**
	 * Send verification code to current email
	 */
	async SendEmailVerificationCode(): Promise<ApiResponse<{ message: string }>> {
		return this.api.Post<{ message: string }>('/user/account/email/verification-code', {})
	}

	/**
	 * Verify current email
	 */
	async VerifyEmail(verification_code: string): Promise<ApiResponse<{ message: string }>> {
		return this.api.Post<{ message: string }>('/user/account/email/verify', { verification_code })
	}

	/**
	 * Get current mobile info
	 */
	async GetMobile(): Promise<ApiResponse<UserAccount>> {
		return this.api.Get<UserAccount>('/user/account/mobile')
	}

	/**
	 * Request mobile change
	 */
	async RequestMobileChange(new_mobile: string): Promise<ApiResponse<{ message: string }>> {
		return this.api.Post<{ message: string }>('/user/account/mobile/change/request', { new_mobile })
	}

	/**
	 * Verify mobile change with code
	 */
	async VerifyMobileChange(data: {
		new_mobile: string
		verification_code: string
	}): Promise<ApiResponse<{ message: string }>> {
		return this.api.Post<{ message: string }>('/user/account/mobile/change/verify', data)
	}

	/**
	 * Send verification code to mobile
	 */
	async SendMobileVerificationCode(): Promise<ApiResponse<{ message: string }>> {
		return this.api.Post<{ message: string }>('/user/account/mobile/verification-code', {})
	}

	/**
	 * Verify current mobile
	 */
	async VerifyMobile(verification_code: string): Promise<ApiResponse<{ message: string }>> {
		return this.api.Post<{ message: string }>('/user/account/mobile/verify', { verification_code })
	}
}
