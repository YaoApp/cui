import { OpenAPI } from './openapi'
import { ApiResponse, ErrorResponse } from './types'

/**
 * OAuth provider configuration
 */
export interface SigninProvider {
	id: string
	name: string
	type: 'oauth' | 'oidc'
	authorization_url: string
	client_id: string
	scope?: string
	redirect_uri?: string
	icon?: string
	enabled: boolean
}

/**
 * Signin configuration response
 */
export interface SigninConfig {
	providers: SigninProvider[]
	password_enabled: boolean
	registration_enabled: boolean
	captcha_enabled: boolean
	locale: string
	locales: string[]
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

/**
 * OAuth callback parameters
 */
export interface OAuthCallback {
	code: string
	state: string
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
		const query = locale ? `?locale=${encodeURIComponent(locale)}` : ''
		return this.api.Get<SigninConfig>(`/signin${query}`)
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
	 * Handle OAuth callback (third-party)
	 */
	async HandleOAuthCallback(providerId: string, params: OAuthCallback): Promise<ApiResponse<SigninResponse>> {
		const response = await this.api.Post<SigninResponse>(`/signin/oauth/${providerId}/callback`, params)

		// Auto-handle CSRF token for cross-origin scenarios
		if (!this.IsError(response) && response.data?.csrf_token) {
			this.api.SetCSRFToken(response.data.csrf_token)
		}

		return response
	}

	/**
	 * Get OAuth authorization URL
	 */
	async GetOAuthAuthorizationUrl(
		providerId: string,
		redirectUri?: string,
		state?: string,
		scope?: string
	): Promise<string> {
		const config = await this.GetConfig()
		if (this.IsError(config)) {
			throw new Error(`Failed to get signin config: ${config.error.error_description}`)
		}

		const provider = config.data?.providers.find((p) => p.id === providerId)
		if (!provider) {
			throw new Error(`OAuth provider "${providerId}" not found`)
		}

		const params = new URLSearchParams({
			client_id: provider.client_id,
			response_type: 'code',
			redirect_uri: redirectUri || provider.redirect_uri || window.location.origin + '/auth/callback',
			state: state || this.GenerateOAuthState(),
			scope: scope || provider.scope || 'openid profile email'
		})

		return `${provider.authorization_url}?${params.toString()}`
	}

	/**
	 * Generate secure random state for OAuth
	 */
	GenerateOAuthState(): string {
		const array = new Uint8Array(32)
		crypto.getRandomValues(array)
		return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
	}

	/**
	 * Verify OAuth state parameter
	 */
	VerifyOAuthState(receivedState: string, expectedState: string): boolean {
		return receivedState === expectedState
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
