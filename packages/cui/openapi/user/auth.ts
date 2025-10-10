import { OpenAPI } from '../openapi'
import { ApiResponse, ErrorResponse, JWK } from '../types'
import * as jose from 'jose'
import {
	SigninConfig,
	SigninRequest,
	SigninResponse,
	OAuthAuthorizationURLResponse,
	OAuthAuthbackParams,
	OAuthAuthbackResponse,
	OAuthAuthResult,
	UserInfo,
	CaptchaResponse,
	LoginStatus
} from './types'

/**
 * User Authentication API
 * Handles login, logout, OAuth, and captcha functionality
 */
export class UserAuth {
	constructor(private api: OpenAPI) {}

	/**
	 * Get login configuration
	 */
	async GetLoginConfig(locale?: string): Promise<ApiResponse<SigninConfig>> {
		return this.api.Get<SigninConfig>(`/user/login`, { locale: locale || '' })
	}

	/**
	 * Login with username and password
	 */
	async Login(credentials: SigninRequest): Promise<ApiResponse<SigninResponse>> {
		const response = await this.api.Post<SigninResponse>('/user/login', credentials)

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

		const response = await this.api.Get<OAuthAuthorizationURLResponse>(`/user/oauth/${id}/authorize`, {
			redirect_uri: redirectUri
		})

		if (this.IsError(response)) {
			throw new Error(response.error.error_description)
		}

		return response.data?.authorization_url || ''
	}

	/**
	 * Complete OAuth authentication flow
	 */
	async OAuthCallback(id: string, params: OAuthAuthbackParams): Promise<ApiResponse<OAuthAuthResult>> {
		const response = await this.api.Post<OAuthAuthbackResponse>(`/user/oauth/${id}/callback`, params)
		if (this.IsError(response)) {
			throw new Error(
				response.error.error_description || response.error.error || 'OAuth authentication failed'
			)
		}

		// Check login status
		const status = response.data?.status || LoginStatus.Success

		// Base authentication result
		const authResult: OAuthAuthResult = {
			status,
			provider: id,
			authenticated_at: Math.floor(Date.now() / 1000),
			session_id: response.data?.session_id
		}

		// Handle MFA required
		if (status === LoginStatus.MFARequired) {
			authResult.mfa_token = response.data?.mfa_token
			authResult.mfa_token_expires_in = response.data?.mfa_token_expires_in
			return {
				status: response.status,
				headers: response.headers,
				data: authResult
			}
		}

		// Handle team selection required
		if (status === LoginStatus.TeamSelectionRequired) {
			return {
				status: response.status,
				headers: response.headers,
				data: authResult
			}
		}

		// Normal login success - validate the ID Token
		const userInfo = await this.ValidateIDToken(response.data?.id_token || '')
		authResult.user = userInfo
		authResult.expires_at = userInfo.exp

		return {
			status: response.status,
			headers: response.headers,
			data: authResult
		}
	}

	/**
	 * Validate ID Token using JWK verification
	 */
	async ValidateIDToken(idToken: string): Promise<UserInfo> {
		if (!idToken || idToken.trim() === '') {
			throw new Error('ID Token is required')
		}

		// Get JWKs from the server
		const jwks = await this.api.GetJWKs()
		if (this.IsError(jwks)) {
			throw new Error(jwks.error.error_description || jwks.error.error || 'Failed to fetch JWKs')
		}

		if (!jwks.data?.keys || jwks.data.keys.length === 0) {
			throw new Error('No JWKs found in keystore')
		}

		// Parse JWT header to get key ID (kid)
		let header: jose.ProtectedHeaderParameters
		try {
			header = jose.decodeProtectedHeader(idToken)
		} catch (error) {
			throw new Error(`Invalid JWT format: ${error instanceof Error ? error.message : 'Unknown error'}`)
		}

		// Ensure algorithm is present
		if (!header.alg) {
			throw new Error('JWT header missing algorithm (alg) claim')
		}

		// Find the matching JWK by kid or use the first available key
		let matchingJwk: JWK | undefined
		if (header.kid) {
			matchingJwk = jwks.data.keys.find((key) => key.kid === header.kid)
			if (!matchingJwk) {
				throw new Error(`No JWK found with kid: ${header.kid}`)
			}
		} else {
			// If no kid in header, use the first key that matches the algorithm
			matchingJwk = jwks.data.keys.find(
				(key) => !key.alg || key.alg === header.alg || this.isAlgorithmCompatible(key.kty, header.alg!)
			)
			if (!matchingJwk) {
				throw new Error('No compatible JWK found for the token algorithm')
			}
		}

		// Convert JWK to KeyLike for jose
		const keyLike = await this.jwkToKeyLike(matchingJwk)

		// Verify the JWT signature and extract payload
		const { payload } = await jose.jwtVerify(idToken, keyLike, {
			algorithms: [header.alg]
		})

		// Validate standard JWT claims
		this.validateJWTClaims(payload)

		// Map standard JWT claims to more user-friendly names
		// sub to user_id
		payload.user_id = payload.sub || ''
		delete payload.sub

		// aud to client_id (audience is typically the Client ID)
		if (payload.aud) {
			payload.client_id = Array.isArray(payload.aud) ? payload.aud[0] : payload.aud
			delete payload.aud
		}

		// jti to token_id (JWT ID for token tracking and management)
		if (payload.jti) {
			payload.token_id = payload.jti
			delete payload.jti
		}

		// Return the validated user info
		return payload as UserInfo
	}

	/**
	 * Convert JWK to key for jose library
	 */
	private async jwkToKeyLike(jwk: JWK): Promise<CryptoKey | Uint8Array> {
		try {
			return await jose.importJWK(jwk as jose.JWK)
		} catch (error) {
			throw new Error(`Failed to import JWK: ${error instanceof Error ? error.message : 'Unknown error'}`)
		}
	}

	/**
	 * Check if the key type is compatible with the algorithm
	 */
	private isAlgorithmCompatible(kty: string, alg: string): boolean {
		const compatibilityMap: Record<string, string[]> = {
			RSA: ['RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512'],
			EC: ['ES256', 'ES384', 'ES512'],
			oct: ['HS256', 'HS384', 'HS512']
		}

		return compatibilityMap[kty]?.includes(alg) || false
	}

	/**
	 * Validate standard JWT claims
	 */
	private validateJWTClaims(payload: jose.JWTPayload): void {
		const now = Math.floor(Date.now() / 1000)

		// Check expiration
		if (payload.exp !== undefined && payload.exp < now) {
			throw new Error('Token has expired')
		}

		// Check not before
		if (payload.nbf !== undefined && payload.nbf > now) {
			throw new Error('Token not yet valid')
		}

		// Check issued at (allow some clock skew)
		if (payload.iat !== undefined && payload.iat > now + 60) {
			throw new Error('Token issued in the future')
		}

		// Ensure subject exists
		if (!payload.sub) {
			throw new Error('Token missing subject (sub) claim')
		}
	}

	/**
	 * User logout
	 */
	async Logout(serverLogout: boolean = true): Promise<ApiResponse<void>> {
		// Clear local tokens first
		this.api.ClearTokens()

		// Optionally call server logout endpoint
		if (serverLogout) {
			return this.api.Post<void>('/user/logout', {})
		}

		return {
			status: 200,
			headers: new Headers(),
			data: undefined
		}
	}

	/**
	 * Check authentication status
	 */
	async IsAuthenticated(): Promise<boolean> {
		// Check secure cookies via AccessToken method
		const token = await this.api.AccessToken()
		return !!(token && token.length > 0)
	}

	/**
	 * Get captcha image for login
	 */
	async GetCaptcha(): Promise<ApiResponse<CaptchaResponse>> {
		return this.api.Get<CaptchaResponse>('/user/login/captcha')
	}

	/**
	 * Refresh captcha image
	 */
	async RefreshCaptcha(captchaId?: string): Promise<ApiResponse<CaptchaResponse>> {
		const query = captchaId ? `?refresh=${encodeURIComponent(captchaId)}` : ''
		return this.api.Get<CaptchaResponse>(`/user/login/captcha${query}`)
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
