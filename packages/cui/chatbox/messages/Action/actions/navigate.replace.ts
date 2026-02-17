/**
 * Navigate Replace Action
 * Replace the current CUI route when an iframe navigates internally.
 *
 * When a SUI page (iframe) navigates from one page to another (e.g., entry list → detail),
 * the CUI route must update to match. This ensures:
 * - Address bar reflects the actual page
 * - Browser refresh loads the correct page
 * - Chatbox metadata.page tracks the current page for context-aware interactions
 * - Sidebar tab URL and title stay in sync
 *
 * Uses `app/replaceRoute` event → ChatboxWrapper calls navigate(url, { replace: true })
 * so React Router handles the base prefix (__yao_admin_root) automatically.
 *
 * Unlike `navigate` (which creates/opens sidebar tabs), this replaces the current route in-place.
 */

export interface NavigateReplacePayload {
	route: string
	title?: string
}

/**
 * Resolve pathname to CUI URL
 */
const resolvePath = (pathname: string): string => {
	if (pathname.startsWith('http://') || pathname.startsWith('https://')) {
		return pathname
	}
	if (pathname.startsWith('$dashboard/')) {
		return pathname.replace('$dashboard', '')
	}
	return pathname.startsWith('/web/') ? pathname : `/web${pathname}`
}

/**
 * Execute navigate.replace action
 */
export const navigateReplace = (payload: NavigateReplacePayload): void => {
	if (!payload?.route) {
		console.warn('[Action:navigate.replace] Missing route in payload')
		return
	}

	const { route, title } = payload
	const url = resolvePath(route)

	// Emit event — ChatboxWrapper listens and calls navigate(url, { replace: true })
	window.$app?.Event?.emit('app/replaceRoute', { url, title: title || route })
}

export default navigateReplace
