import { OpenAPI } from '../openapi'
import { ApiResponse } from '../types'
import { MFAConfig } from './types'

/**
 * Multi-Factor Authentication API
 */
export class UserMFA {
	constructor(private api: OpenAPI) {}

	// ===== TOTP Management =====

	/**
	 * Get TOTP QR code and setup info
	 */
	async GetTOTP(): Promise<ApiResponse<{
		qr_code: string
		secret: string
		backup_codes?: string[]
	}>> {
		return this.api.Get<{
			qr_code: string
			secret: string
			backup_codes?: string[]
		}>('/user/mfa/totp')
	}

	/**
	 * Enable TOTP with verification
	 */
	async EnableTOTP(data: {
		secret: string
		verification_code: string
	}): Promise<ApiResponse<{ message: string; backup_codes: string[] }>> {
		return this.api.Post<{ message: string; backup_codes: string[] }>('/user/mfa/totp/enable', data)
	}

	/**
	 * Disable TOTP with verification
	 */
	async DisableTOTP(data: {
		verification_code?: string
		backup_code?: string
		password?: string
	}): Promise<ApiResponse<{ message: string }>> {
		return this.api.Post<{ message: string }>('/user/mfa/totp/disable', data)
	}

	/**
	 * Verify TOTP code
	 */
	async VerifyTOTP(verification_code: string): Promise<ApiResponse<{ valid: boolean }>> {
		return this.api.Post<{ valid: boolean }>('/user/mfa/totp/verify', { verification_code })
	}

	/**
	 * Get TOTP recovery codes
	 */
	async GetTOTPRecoveryCodes(): Promise<ApiResponse<{ backup_codes: string[] }>> {
		return this.api.Get<{ backup_codes: string[] }>('/user/mfa/totp/recovery-codes')
	}

	/**
	 * Regenerate TOTP recovery codes
	 */
	async RegenerateTOTPRecoveryCodes(): Promise<ApiResponse<{ backup_codes: string[] }>> {
		return this.api.Post<{ backup_codes: string[] }>('/user/mfa/totp/recovery-codes/regenerate', {})
	}

	/**
	 * Reset TOTP (requires email verification)
	 */
	async ResetTOTP(email_verification_code: string): Promise<ApiResponse<{ message: string }>> {
		return this.api.Post<{ message: string }>('/user/mfa/totp/reset', { email_verification_code })
	}

	// ===== SMS MFA Management =====

	/**
	 * Get SMS MFA status
	 */
	async GetSMSStatus(): Promise<ApiResponse<{
		enabled: boolean
		phone_number?: string
	}>> {
		return this.api.Get<{
			enabled: boolean
			phone_number?: string
		}>('/user/mfa/sms')
	}

	/**
	 * Enable SMS MFA
	 */
	async EnableSMS(data: {
		phone_number: string
		verification_code: string
	}): Promise<ApiResponse<{ message: string }>> {
		return this.api.Post<{ message: string }>('/user/mfa/sms/enable', data)
	}

	/**
	 * Disable SMS MFA
	 */
	async DisableSMS(data: {
		verification_code?: string
		password?: string
	}): Promise<ApiResponse<{ message: string }>> {
		return this.api.Post<{ message: string }>('/user/mfa/sms/disable', data)
	}

	/**
	 * Send SMS verification code
	 */
	async SendSMSVerificationCode(phone_number?: string): Promise<ApiResponse<{ message: string }>> {
		return this.api.Post<{ message: string }>('/user/mfa/sms/verification-code', { phone_number })
	}

	/**
	 * Verify SMS code
	 */
	async VerifySMS(verification_code: string): Promise<ApiResponse<{ valid: boolean }>> {
		return this.api.Post<{ valid: boolean }>('/user/mfa/sms/verify', { verification_code })
	}

	/**
	 * Get MFA configuration
	 */
	async GetMFAConfig(): Promise<ApiResponse<MFAConfig>> {
		return this.api.Get<MFAConfig>('/user/mfa')
	}
}
