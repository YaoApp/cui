import { GlobalModel } from '@/context/app'
import type { App } from '@/types'
import { findIndex } from 'lodash-es'
import type { UserInfo } from '@/openapi/user/types'
import { User } from '@/openapi/user'
import { getPath } from '@/utils'
import { local } from '@yaoapp/storex'
import { history } from '@umijs/max'

type AuthData = {
	user: UserInfo
	entry?: string
	logout_redirect?: string
}

export type AuthInfo = {
	user: App.User
	current_nav?: number
	login_url?: string
	logout_redirect?: boolean
}

export const AfterLogin = async (global: GlobalModel, data: AuthData): Promise<string> => {
	// Clear features cache (all domains) to ensure fresh permissions
	global.clearFeatures()

	// Store full OIDC UserInfo to global state
	global.setUserInfo(data.user)

	// Convert OIDC UserInfo to App.User format
	// Use yao:user_id (original user ID) if available, otherwise fall back to user_id
	const user: App.User = {
		id: data.user['yao:user_id'] || data.user.user_id || '',
		name: data.user.name || '',
		avatar: data.user.picture || '',
		type: 'user'
	}

	// Add team information if present
	if (data.user['yao:tenant_id']) {
		user.tenant_id = data.user['yao:tenant_id']
	}
	if (data.user['yao:team_id']) {
		user.team_id = data.user['yao:team_id']
	}
	if (data.user['yao:team']) {
		user.team = {
			team_id: data.user['yao:team'].team_id,
			logo: data.user['yao:team'].logo,
			name: data.user['yao:team'].name,
			owner_id: data.user['yao:team'].owner_id,
			description: data.user['yao:team'].description
		}
	}
	if (data.user['yao:is_owner'] !== undefined) {
		user.is_owner = data.user['yao:is_owner']
	}

	// Add user type information if present
	if (data.user['yao:type_id']) {
		user.type_id = data.user['yao:type_id']
	}
	if (data.user['yao:type']) {
		user.user_type = {
			type_id: data.user['yao:type'].type_id,
			name: data.user['yao:type'].name,
			locale: data.user['yao:type'].locale
		}
	}

	// Add member profile information if present (for team context)
	if (data.user['yao:member']) {
		user.member = {
			member_id: data.user['yao:member'].member_id,
			display_name: data.user['yao:member'].display_name,
			bio: data.user['yao:member'].bio,
			avatar: data.user['yao:member'].avatar,
			email: data.user['yao:member'].email
		}
	}

	// Get App Menus
	await window.$app.Event.emit('app/getUserMenu')

	const menus = global.menus
	const entry = data.entry || global.app_info?.login?.entry?.['admin'] || '/auth/helloworld'
	const current_nav = findIndex(menus.items, (item) => item.path === entry) || 0
	global.user = user
	global.setMenus(menus, current_nav, false)

	local.user = user
	local.current_nav = current_nav
	local.login_url = getPath(history.location.pathname)
	local.logout_redirect = data.logout_redirect || false
	return entry
}

/**
 * Get authentication information from local storage
 * @returns AuthInfo object if user is logged in, false if not logged in
 */
export const GetAuthInfo = (): AuthInfo | false => {
	try {
		const user = local.user as App.User | undefined

		// Check if user exists and has required fields
		if (!user || !user.id || !user.name) {
			return false
		}

		// Return authentication information
		return {
			user,
			current_nav: local.current_nav as number | undefined,
			login_url: local.login_url as string | undefined,
			logout_redirect: local.logout_redirect as boolean | undefined
		}
	} catch (error) {
		// Return false if any error occurs (e.g., localStorage not available)
		console.error('Failed to get auth info:', error)
		return false
	}
}

/**
 * Check if user is logged in
 * @returns true if user is logged in, false otherwise
 */
export const IsLoggedIn = (): boolean => {
	return GetAuthInfo() !== false
}

/**
 * Get current logged in user
 * @returns User object if logged in, null if not logged in
 */
export const GetCurrentUser = (): App.User | null => {
	const authInfo = GetAuthInfo()
	return authInfo !== false ? authInfo.user : null
}

/**
 * Check if current user is a team member
 * @returns true if user is part of a team, false otherwise
 */
export const IsTeamMember = (): boolean => {
	const user = GetCurrentUser()
	if (!user) return false
	// User is a team member if they have team_id and team information
	return !!(user.team_id && user.team)
}

/**
 * Clear authentication information (logout)
 */
export const ClearAuthInfo = (): void => {
	try {
		delete local.user
		delete local.current_nav
		delete local.login_url
		delete local.logout_redirect
	} catch (error) {
		console.error('Failed to clear auth info:', error)
	}
}

/**
 * Handle post-logout cleanup
 * Clears user info from global state and local storage
 */
export const AfterLogout = (global: GlobalModel): void => {
	try {
		// Clear user info from global state
		global.setUserInfo(null)

		// Clear features cache (all domains)
		global.clearFeatures()

		// Clear user info from local storage
		ClearAuthInfo()

		// Clear menus
		global.menus = { items: [], setting: [], quick: [] }
		global.menu = []
	} catch (error) {
		console.error('Failed to handle post-logout cleanup:', error)
	}
}

/**
 * Check if user has specific feature(s)
 * Uses cached features, fetches by domain if not available
 * @param feature Feature key(s) - single string or array of strings
 * @param domain Domain to fetch (e.g., "user", "user/team", "kb")
 * @returns For single feature: boolean. For multiple features: Record<string, boolean>
 *
 * @example
 * // Single feature
 * const canEdit = await Can("profile:write", "user")
 *
 * // Multiple features (batch)
 * const permissions = await Can(["profile:write", "profile:delete", "team:create"], "user")
 * // Returns: { "profile:write": true, "profile:delete": false, "team:create": true }
 */
export const Can = async (feature: string | string[], domain: string): Promise<boolean | Record<string, boolean>> => {
	try {
		// Get global model
		const global = window.$global

		// Check cache for this domain
		let features = global?.features?.[domain]

		// Fetch if no cache for this domain
		if (!features) {
			if (!window.$app?.openapi) {
				console.error('OpenAPI not initialized')
				return Array.isArray(feature) ? {} : false
			}

			const client = new User(window.$app.openapi)
			const response = await client.GetFeatures(domain)

			if (client.IsError(response) || !response?.data) {
				return Array.isArray(feature) ? {} : false
			}

			features = response.data
			global?.setFeatures(domain, features)
		}

		// Handle single feature
		if (typeof feature === 'string') {
			return !!features && features[feature] === true
		}

		// Handle multiple features (batch)
		const result: Record<string, boolean> = {}
		for (const key of feature) {
			result[key] = !!features && features[key] === true
		}
		return result
	} catch (error) {
		console.error('Failed to check feature:', error)
		return Array.isArray(feature) ? {} : false
	}
}
