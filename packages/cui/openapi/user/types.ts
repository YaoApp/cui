import { JWK, RSAKey, ECKey } from '../types'
import * as jose from 'jose'

// ===== Authentication Types (migrated from signin.ts) =====

/**
 * OAuth provider configuration
 */
export interface SigninProvider {
	id: string
	label: string
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
	failure_url?: string
	logout_redirect?: string
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
		scope?: string
		features?: object
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
	/** Available scope */
	scope?: string
	/** Additional features */
	features?: object

	/** Entry */
	redirect_url?: string

	/** Logout redirect */
	logout_redirect?: string
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
	/** User's available scope */
	scope?: string
	/** User's features */
	features?: object
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

// ===== User Management Types =====
export interface UserProfile {
	id: string
	username: string
	email?: string
	name?: string
	avatar?: string
	roles?: string[]
	scope?: string
	features?: object
}

export interface UserPreferences {
	theme?: 'light' | 'dark'
	language?: string
	timezone?: string
	notifications?: {
		email?: boolean
		push?: boolean
		sms?: boolean
	}
}

export interface UserAccount {
	email?: string
	mobile?: string
	email_verified?: boolean
	mobile_verified?: boolean
}

export interface MFAConfig {
	totp_enabled?: boolean
	sms_enabled?: boolean
	recovery_codes?: string[]
}

export interface UserSubscription {
	plan?: string
	status?: string
	expires_at?: string
	features?: string[]
}

export interface UserCredits {
	balance: number
	currency?: string
	last_updated?: string
}

export interface UserTeam {
	id: string
	name: string
	role: string
	permissions?: string[]
}

export interface UserAPIKey {
	id: string
	name: string
	key?: string
	permissions?: string[]
	expires_at?: string
	created_at: string
	last_used?: string
}
