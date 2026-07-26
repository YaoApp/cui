import { local } from '@yaoapp/storex'

let redirecting = false

const INVALID_LOGIN_PATHS = ['/auth/back/', '/auth/token', '/auth/consent', '/auth/device']

export function redirectToLogin(): void {
	if (redirecting) return
	redirecting = true

	let loginUrl = (local.login_url as string) || '/auth/entry'

	// OAuth callback paths are not valid login destinations
	if (!loginUrl || INVALID_LOGIN_PATHS.some((p) => loginUrl.startsWith(p))) {
		loginUrl = '/auth/entry'
	}

	const base = typeof $runtime !== 'undefined' && $runtime.BASE ? `/${$runtime.BASE}` : ''
	window.location.href = `${base}${loginUrl.startsWith('/') ? loginUrl : '/' + loginUrl}`
}

export function isRedirecting(): boolean {
	return redirecting
}
