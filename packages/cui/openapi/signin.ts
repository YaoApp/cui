import { OpenAPI } from './openapi'
import { ApiResponse, ErrorResponse } from './types'

/**
 * OAuth provider configuration
 */
export interface SigninProvider {
	id: string
	title: string
	logo?: string
	color: string
	text_color?: string
	client_id: string
	response_mode?: string
}

/**
 * Signin configuration response
 */
export interface SigninConfig {
	title: string
	description: string
	success_url: string
	failure_url: string
	form: {
		username: {
			placeholder: string
			fields: string[]
		}
		password: {
			placeholder: string
		}
		captcha: {
			type: 'image' | 'turnstile'
			options?: {
				secret?: string
				sitekey?: string
			}
		}
		forgot_password_link: boolean
		remember_me: boolean
		register_link: string
		terms_of_service_link: string
		privacy_policy_link: string
	}
	token: {
		expires_in: string
		remember_me_expires_in: string
	}
	third_party: {
		register: {
			auto: boolean
			role: string
		}
		providers: SigninProvider[]
	}
}

/**
 * Signin request payload
 */
export interface SigninRequest {
	username: string
	password: string
	remember?: boolean
	captcha_code?: string
	captcha_id?: string
}

/**
 * Signin response data
 */
export interface SigninResponse {
	access_token?: string
	refresh_token?: string
	expires_in?: number
	user?: {
		id: string
		username: string
		email?: string
		name?: string
		avatar?: string
		roles?: string[]
	}
	csrf_token?: string
}

export interface OAuthAuthorizationURLResponse {
	authorization_url: string
	state: string
	error?: string
	error_description?: string
}

// OAuth callback request
export interface OAuthCallbackParams {
	locale: string
	code: string
	state: string
	provider: string
	error?: string
	error_description?: string
	[key: string]: any
}

export interface OAuthCallbackResponse {
	access_token?: string
	refresh_token?: string
	expires_in?: number
	user?: {
		id: string
		username: string
		email?: string
		name?: string
		avatar?: string
		roles?: string[]
	}
	error?: string
	error_description?: string
}

/**
 * Captcha response
 */
export interface CaptchaResponse {
	captcha_id: string
	captcha_image: string // Base64 encoded image or image URL
	expires_in?: number // Captcha expiration time in seconds
}

/**
 * Signin API client
 * Handles authentication flows including password auth and OAuth
 */
export class Signin {
	constructor(private api: OpenAPI) {}

	/**
	 * Get signin configuration
	 */
	async GetConfig(locale?: string): Promise<ApiResponse<SigninConfig>> {
		return this.api.Get<SigninConfig>(`/signin`, { locale: locale || '' })
	}

	/**
	 * Signin with username and password
	 */
	async SigninWithPassword(credentials: SigninRequest): Promise<ApiResponse<SigninResponse>> {
		const response = await this.api.Post<SigninResponse>('/signin', credentials)

		// Auto-handle CSRF token for cross-origin scenarios
		if (!this.IsError(response) && response.data?.csrf_token) {
			this.api.SetCSRFToken(response.data.csrf_token)
		}

		return response
	}

	/**
	 * Get OAuth authorization URL
	 */
	async GetOAuthAuthorizationUrl(id: string, redirectUri?: string): Promise<string> {
		if (!redirectUri || redirectUri == '') {
			const origin = window.location.origin
			const pathname = window.location.pathname
			const firstPath = pathname?.split('/')?.[1] || ''
			redirectUri = origin + `/${firstPath}/auth/back/${id}`
		}

		const response = await this.api.Get<OAuthAuthorizationURLResponse>(`/signin/oauth/${id}/authorize`, {
			redirect_uri: redirectUri
		})

		if (this.IsError(response)) {
			throw new Error(response.error.error_description)
		}

		return response.data?.authorization_url || ''
	}

	/**
	 * Auth back
	 * @param id - The provider ID
	 * @param params - The parameters
	 * @returns The response
	 */
	async AuthBack(id: string, params: OAuthCallbackParams): Promise<ApiResponse<OAuthCallbackResponse>> {
		const response = await this.api.Post<OAuthCallbackResponse>(`/signin/oauth/${id}/authback`, params)
		if (this.IsError(response)) {
			throw new Error(
				response.error.error_description || response.error.error || 'OAuth authentication failed'
			)
		}
		return response
	}

	/**
	 * Sign out user
	 */
	async Signout(serverLogout: boolean = true): Promise<ApiResponse<void>> {
		// Clear local tokens first
		this.api.ClearTokens()

		// Optionally call server logout endpoint
		if (serverLogout) {
			return this.api.Post<void>('/signin/logout', {})
		}

		return {
			status: 200,
			headers: new Headers(),
			data: undefined
		}
	}

	/**
	 * Check authentication status (asynchronous)
	 * Uses secure cookie-based authentication via AccessToken method
	 */
	async IsAuthenticated(): Promise<boolean> {
		// Check secure cookies via AccessToken method
		const token = await this.api.AccessToken()
		return !!(token && token.length > 0)
	}

	/**
	 * Get captcha image for signin
	 */
	async GetCaptcha(): Promise<ApiResponse<CaptchaResponse>> {
		return this.api.Get<CaptchaResponse>('/signin/captcha')
	}

	/**
	 * Refresh captcha image
	 */
	async RefreshCaptcha(captchaId?: string): Promise<ApiResponse<CaptchaResponse>> {
		const query = captchaId ? `?refresh=${encodeURIComponent(captchaId)}` : ''
		return this.api.Get<CaptchaResponse>(`/signin/captcha${query}`)
	}

	/**
	 * Helper: Check if response contains an error
	 */
	IsError<T>(response: ApiResponse<T>): response is ApiResponse<T> & { error: ErrorResponse } {
		return this.api.IsError(response)
	}

	/**
	 * Helper: Extract data from successful response
	 */
	GetData<T>(response: ApiResponse<T>): T | null {
		return this.api.GetData(response)
	}
}

export default Signin
