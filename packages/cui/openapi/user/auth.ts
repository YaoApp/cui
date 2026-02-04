import { OpenAPI } from '../openapi'
import { ApiResponse, ErrorResponse, JWK } from '../types'
import { BuildURL } from '../lib/utils'
import * as jose from 'jose'
import {
	EntryConfig,
	EntryVerifyRequest,
	EntryVerifyResponse,
	EntryRegisterRequest,
	EntryLoginRequest,
	EntryAuthResponse,
	EntrySendOTPResponse,
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
	 * Get unified auth entry configuration
	 */
	async GetEntryConfig(locale?: string): Promise<ApiResponse<EntryConfig>> {
		return this.api.Get<EntryConfig>(`/user/entry`, { locale: locale || '' })
	}

	/**
	 * Verify entry (login/register)
	 * Checks if username exists and determines whether this is login or registration
	 * For registration: sends verification code automatically
	 */
	async EntryVerify(data: EntryVerifyRequest): Promise<ApiResponse<EntryVerifyResponse>> {
		return this.api.Post<EntryVerifyResponse>('/user/entry/verify', data)
	}

	/**
	 * Register a new user
	 * Requires temporary access token from EntryVerify
	 */
	async EntryRegister(data: EntryRegisterRequest, accessToken: string): Promise<ApiResponse<EntryAuthResponse>> {
		return this.api.Post<EntryAuthResponse>('/user/entry/register', data, {
			Authorization: `Bearer ${accessToken}`
		})
	}

	/**
	 * Login with username and password
	 * Requires temporary access token from EntryVerify
	 */
	async EntryLogin(data: EntryLoginRequest, accessToken: string): Promise<ApiResponse<EntryAuthResponse>> {
		return this.api.Post<EntryAuthResponse>('/user/entry/login', data, {
			Authorization: `Bearer ${accessToken}`
		})
	}

	/**
	 * Resend OTP verification code
	 * Requires temporary access token from EntryVerify
	 */
	async SendOTP(accessToken: string, locale?: string): Promise<ApiResponse<EntrySendOTPResponse>> {
		const params = new URLSearchParams()
		if (locale) params.append('locale', locale)

		return this.api.Post<EntrySendOTPResponse>(
			BuildURL('/user/entry/otp', params),
			{},
			{
				Authorization: `Bearer ${accessToken}`
			}
		)
	}

	/**
	 * Verify and redeem invitation code
	 * Requires temporary access token with invite_verification scope
	 * After successful verification, returns full login tokens
	 */
	async VerifyInvite(invitationCode: string, accessToken: string): Promise<ApiResponse<EntryAuthResponse>> {
		return this.api.Post<EntryAuthResponse>(
			'/user/entry/invite/verify',
			{
				invitation_code: invitationCode
			},
			{
				Authorization: `Bearer ${accessToken}`
			}
		)
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
			session_id: response.data?.session_id,
			access_token: response.data?.access_token,
			expires_in: response.data?.expires_in,
			refresh_token: response.data?.refresh_token,
			refresh_token_expires_in: response.data?.refresh_token_expires_in
		}

		// Handle MFA required
		if (status === LoginStatus.MFARequired) {
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

		// Handle invite verification required
		if (status === LoginStatus.InviteVerification) {
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
	 * If crypto.subtle is not available (non-secure context), skip signature verification
	 * and only decode the JWT payload (trusting the server)
	 */
	async ValidateIDToken(idToken: string): Promise<UserInfo> {
		if (!idToken || idToken.trim() === '') {
			throw new Error('ID Token is required')
		}

		// Check if crypto.subtle is available (required for JWT signature verification)
		// In non-secure contexts (HTTP + non-localhost IP), crypto.subtle is not available
		// In this case, skip signature verification and trust the server
		if (typeof window !== 'undefined' && !window.crypto?.subtle) {
			console.warn('[Auth] crypto.subtle not available, skipping JWT signature verification')
			return this.decodeJWTWithoutVerification(idToken)
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
			// Check if crypto.subtle is available (required for secure contexts)
			if (typeof window !== 'undefined' && !window.crypto?.subtle) {
				throw new Error('crypto.subtle is not available. HTTPS or localhost required for JWT verification.')
			}
			
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
	 * Decode JWT without signature verification (for non-secure contexts)
	 * WARNING: This should only be used when crypto.subtle is not available
	 */
	private decodeJWTWithoutVerification(idToken: string): UserInfo {
		try {
			// Decode JWT payload without verification
			const payload = jose.decodeJwt(idToken)

			// Validate standard JWT claims
			this.validateJWTClaims(payload)

			// Map standard JWT claims to more user-friendly names
			payload.user_id = payload.sub || ''
			delete payload.sub

			if (payload.aud) {
				payload.client_id = Array.isArray(payload.aud) ? payload.aud[0] : payload.aud
				delete payload.aud
			}

			if (payload.jti) {
				payload.token_id = payload.jti
				delete payload.jti
			}

			return payload as UserInfo
		} catch (error) {
			throw new Error(`Failed to decode JWT: ${error instanceof Error ? error.message : 'Unknown error'}`)
		}
	}

	/**
	 * Validate standard JWT claims
	 * Clock skew tolerance: 5 minutes (300 seconds) per OIDC spec recommendation
	 */
	private validateJWTClaims(payload: jose.JWTPayload): void {
		const now = Math.floor(Date.now() / 1000)
		const clockTolerance = 300 // 5 minutes tolerance for clock skew (OIDC standard)

		// Check expiration (with clock tolerance)
		if (payload.exp !== undefined && payload.exp < now - clockTolerance) {
			throw new Error('Token has expired')
		}

		// Check not before (with clock tolerance)
		if (payload.nbf !== undefined && payload.nbf > now + clockTolerance) {
			throw new Error('Token not yet valid')
		}

		// Check issued at (with clock tolerance)
		if (payload.iat !== undefined && payload.iat > now + clockTolerance) {
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
	 * Get captcha image for entry (login/register)
	 */
	async GetCaptcha(): Promise<ApiResponse<CaptchaResponse>> {
		return this.api.Get<CaptchaResponse>('/user/entry/captcha')
	}

	/**
	 * Refresh captcha image
	 */
	async RefreshCaptcha(captchaId?: string): Promise<ApiResponse<CaptchaResponse>> {
		const query = captchaId ? `?refresh=${encodeURIComponent(captchaId)}` : ''
		return this.api.Get<CaptchaResponse>(`/user/entry/captcha${query}`)
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
