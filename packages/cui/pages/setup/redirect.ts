import { getLocale } from '@umijs/max'
import { local } from '@yaoapp/storex'
import { UserAuth } from '@/openapi/user/auth'
import { Setting } from '@/openapi/setting'

/**
 * Get the post-setup redirect URL from entry config's success_url.
 * Falls back to '/chat' if the API call fails or returns nothing.
 */
export async function getSetupRedirectUrl(): Promise<string> {
	try {
		if (!window.$app?.openapi) return '/chat'
		const auth = new UserAuth(window.$app.openapi)
		const resp = await auth.GetEntryConfig()
		if (resp.data?.success_url) return resp.data.success_url
	} catch {
		// Non-critical: fall back to /chat
	}
	return '/chat'
}

/**
 * Refresh setup status and persist to localStorage so a subsequent
 * full-page reload reads fresh data instead of stale cache.
 */
export async function refreshSetupStatus(): Promise<void> {
	try {
		if (!window.$app?.openapi) return
		const api = new Setting(window.$app.openapi)
		const lang = getLocale()?.toLowerCase() || 'en-us'
		const res = await api.GetSetupStatus(lang)
		if (res?.data && !window.$app.openapi.IsError(res)) {
			local.setup_status = res.data
			local.setup_status_ts = Date.now()
			local.setup_status_locale = lang
			local.setup_status_uid = (local.user as any)?.id || ''
		}
	} catch {
		// Non-critical
	}
}
