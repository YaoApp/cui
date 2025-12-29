/**
 * Navigate Action
 * Open a route in the application sidebar or new window.
 *
 * Page Types:
 * - $dashboard/ : CUI Dashboard pages (direct route navigation, no prefix needed)
 * - /           : SUI pages (loaded via /web/ iframe wrapper)
 * - http(s)://  : External URLs (loaded via iframe in sidebar)
 */

export interface NavigatePayload {
	pathname: string
	title?: string
	query?: Record<string, string>
	target?: '_self' | '_blank'
}

/**
 * Build URL with query parameters
 */
const buildUrl = (pathname: string, query?: Record<string, string>): string => {
	if (!query || Object.keys(query).length === 0) {
		return pathname
	}
	const params = new URLSearchParams(query).toString()
	return `${pathname}?${params}`
}

/**
 * Resolve pathname to actual URL based on type
 * - $dashboard/xxx -> /xxx (CUI page, direct route, no prefix)
 * - /xxx -> /web/xxx (SUI page, iframe wrapper)
 * - http(s)://xxx -> as-is (external URL)
 */
const resolvePath = (pathname: string): { url: string; type: 'dashboard' | 'sui' | 'external' } => {
	// External URL
	if (pathname.startsWith('http://') || pathname.startsWith('https://')) {
		return { url: pathname, type: 'external' }
	}

	// CUI Dashboard page - just remove the $dashboard prefix
	if (pathname.startsWith('$dashboard/')) {
		const url = pathname.replace('$dashboard', '')
		return { url, type: 'dashboard' }
	}

	// SUI page - wrap with /web/ for iframe loading
	const url = pathname.startsWith('/web/') ? pathname : `/web${pathname}`
	return { url, type: 'sui' }
}

/**
 * Execute navigate action
 */
export const navigate = (payload: NavigatePayload): void => {
	if (!payload?.pathname) {
		console.warn('[Action:navigate] Missing pathname in payload')
		return
	}

	const { pathname, title, query, target = '_self' } = payload

	// Resolve path based on type
	const { url: resolvedUrl, type } = resolvePath(pathname)

	// Build full URL with query params
	const fullUrl = buildUrl(resolvedUrl, query)

	// Open in new window/tab
	if (target === '_blank') {
		// For external URLs, open directly
		// For internal URLs, open with full origin
		if (type === 'external') {
			window.open(fullUrl, '_blank')
		} else {
			window.open(window.location.origin + fullUrl, '_blank')
		}
		return
	}

	// Open in sidebar
	if (title) {
		// Temporary view with title (url mode)
		window.$app?.Event?.emit('app/openSidebar', {
			url: fullUrl,
			title
		})
	} else {
		// Menu navigation with system menu (path mode)
		window.$app?.Event?.emit('app/openSidebar', {
			path: fullUrl
		})
	}
}

export default navigate
