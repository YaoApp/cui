import { OpenAPI } from '../openapi'
import { UserAuth } from './auth'
import { UserProfileAPI } from './profile'
import { UserAccountAPI } from './account'
import { UserMFA } from './mfa'
import { UserPreferencesAPI } from './preferences'
import { UserTeams } from './teams'
import { UserSubscriptionAPI } from './subscription'
import { UserCreditsAPI } from './credits'

/**
 * User API - Comprehensive user management
 * Provides access to all user-related functionality
 */
export class User {
	public readonly auth: UserAuth
	public readonly profile: UserProfileAPI
	public readonly account: UserAccountAPI
	public readonly mfa: UserMFA
	public readonly preferences: UserPreferencesAPI
	public readonly teams: UserTeams
	public readonly subscription: UserSubscriptionAPI
	public readonly credits: UserCreditsAPI

	constructor(private api: OpenAPI) {
		this.auth = new UserAuth(api)
		this.profile = new UserProfileAPI(api)
		this.account = new UserAccountAPI(api)
		this.mfa = new UserMFA(api)
		this.preferences = new UserPreferencesAPI(api)
		this.teams = new UserTeams(api, this.auth)
		this.subscription = new UserSubscriptionAPI(api)
		this.credits = new UserCreditsAPI(api)
	}

	// ===== Convenience Methods (Backward Compatibility) =====

	/**
	 * Get entry configuration (unified login + register)
	 * @deprecated Use auth.GetEntryConfig() instead
	 */
	async GetConfig(locale?: string) {
		return this.auth.GetEntryConfig(locale)
	}

	/**
	 * Unified auth entry (login/register)
	 * @deprecated Use auth.Entry() instead
	 */
	async SigninWithPassword(credentials: any) {
		return this.auth.Entry(credentials)
	}

	/**
	 * Get OAuth authorization URL
	 * @deprecated Use auth.GetOAuthAuthorizationUrl() instead
	 */
	async GetOAuthAuthorizationUrl(id: string, redirectUri?: string) {
		return this.auth.GetOAuthAuthorizationUrl(id, redirectUri)
	}

	/**
	 * Complete OAuth authentication
	 * @deprecated Use auth.OAuthCallback() instead
	 */
	async AuthBack(id: string, params: any) {
		return this.auth.OAuthCallback(id, params)
	}

	/**
	 * Validate ID Token
	 * @deprecated Use auth.ValidateIDToken() instead
	 */
	async ValidateIDToken(idToken: string) {
		return this.auth.ValidateIDToken(idToken)
	}

	/**
	 * Sign out user
	 * @deprecated Use auth.Logout() instead
	 */
	async Signout(serverLogout: boolean = true) {
		return this.auth.Logout(serverLogout)
	}

	/**
	 * Check authentication status
	 * @deprecated Use auth.IsAuthenticated() instead
	 */
	async IsAuthenticated() {
		return this.auth.IsAuthenticated()
	}

	/**
	 * Get captcha
	 * @deprecated Use auth.GetCaptcha() instead
	 */
	async GetCaptcha() {
		return this.auth.GetCaptcha()
	}

	/**
	 * Refresh captcha
	 * @deprecated Use auth.RefreshCaptcha() instead
	 */
	async RefreshCaptcha(captchaId?: string) {
		return this.auth.RefreshCaptcha(captchaId)
	}

	/**
	 * Helper: Check if response contains an error
	 */
	IsError<T>(response: any): boolean {
		return this.api.IsError(response)
	}

	/**
	 * Helper: Extract data from successful response
	 */
	GetData<T>(response: any): T | null {
		return this.api.GetData(response)
	}
}
