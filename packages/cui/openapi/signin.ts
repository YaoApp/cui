import { OpenAPI } from './openapi'
import { ApiResponse, ErrorResponse, JWK, RSAKey, ECKey } from './types'
import * as jose from 'jose'

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
export interface OAuthAuthbackParams {
	code: string
	state: string
	provider: string
	error?: string
	error_description?: string
	[key: string]: any
}

export interface OAuthAuthbackResponse {
	id_token?: string
	error?: string
	error_description?: string
}

/**
 * Complete OAuth authentication result
 * Contains validated user info and authentication metadata
 */
export interface OAuthAuthResult {
	/** Validated user information from ID token */
	user: UserInfo
	/** OAuth provider identifier */
	provider?: string
	/** Authentication timestamp */
	authenticated_at: number
	/** ID token expiration timestamp */
	expires_at?: number
}

/**
 * User information from OpenID Connect ID token
 * Contains standard OIDC claims plus additional custom claims
 */
export interface UserInfo {
	/** Subject - unique identifier for the user */
	user_id: string
	/** User's display name */
	name?: string
	/** User's given/first name */
	given_name?: string
	/** User's family/last name */
	family_name?: string
	/** User's middle name */
	middle_name?: string
	/** User's nickname */
	nickname?: string
	/** User's preferred username */
	preferred_username?: string
	/** URL of user's profile page */
	profile?: string
	/** URL of user's profile picture */
	picture?: string
	/** URL of user's website */
	website?: string
	/** User's email address */
	email?: string
	/** Whether email address has been verified */
	email_verified?: boolean
	/** User's gender */
	gender?: string
	/** User's birthdate in YYYY-MM-DD format */
	birthdate?: string
	/** User's timezone */
	zoneinfo?: string
	/** User's locale */
	locale?: string
	/** User's phone number */
	phone_number?: string
	/** Whether phone number has been verified */
	phone_number_verified?: boolean
	/** User's address information */
	address?: {
		formatted?: string
		street_address?: string
		locality?: string
		region?: string
		postal_code?: string
		country?: string
	}
	/** Timestamp when profile was last updated */
	updated_at?: number
	/** JWT issued at timestamp */
	iat?: number
	/** JWT expiration timestamp */
	exp?: number
	/** JWT issuer */
	iss?: string
	/** Client ID (mapped from aud claim) */
	client_id?: string
	/** Token ID (mapped from jti claim) - unique identifier for this JWT */
	token_id?: string
	/** Additional custom claims */
	[key: string]: any
}

/**
 * JWT Header
 */
export interface JWTHeader {
	alg: string
	typ: string
	kid?: string
}

/**
 * JWT Payload (standard claims)
 */
export interface JWTPayload {
	iss?: string // Issuer
	sub?: string // Subject
	aud?: string | string[] // Audience
	exp?: number // Expiration Time
	nbf?: number // Not Before
	iat?: number // Issued At
	jti?: string // JWT ID
	[key: string]: any // Additional claims
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
	 * Auth back - Complete OAuth authentication flow
	 * @param id - The provider ID
	 * @param params - The OAuth callback parameters
	 * @returns Complete OAuth authentication result with validated user information
	 */
	async AuthBack(id: string, params: OAuthAuthbackParams): Promise<ApiResponse<OAuthAuthResult>> {
		const response = await this.api.Post<OAuthAuthbackResponse>(`/signin/oauth/${id}/authback`, params)
		if (this.IsError(response)) {
			throw new Error(
				response.error.error_description || response.error.error || 'OAuth authentication failed'
			)
		}

		// Validate the ID Token and extract user information
		const userInfo = await this.ValidateIDToken(response.data?.id_token || '')

		// Construct complete authentication result
		const authResult: OAuthAuthResult = {
			user: userInfo,
			provider: id,
			authenticated_at: Math.floor(Date.now() / 1000),
			expires_at: userInfo.exp
		}

		// Return the complete authentication result
		return {
			status: response.status,
			headers: response.headers,
			data: authResult
		}
	}

	/**
	 * Validate ID Token using JWK verification
	 * @param idToken - The ID Token
	 * @returns The user info
	 * @throws Error if validation fails
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
