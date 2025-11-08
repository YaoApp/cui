/**
 * OpenAPI Utility Functions
 * Provides utility functions for API operations
 */

/**
 * Build URL with query parameters
 * Safely constructs URL with query string, avoiding duplicate '?' characters
 * Handles edge cases where path or query string may already contain '?'
 *
 * @param path - Base URL path (e.g., '/agent/assistants')
 * @param params - URLSearchParams object containing query parameters
 * @returns Complete URL with query string if params exist, otherwise just the path
 *
 * @example
 * const params = new URLSearchParams()
 * params.append('locale', 'zh-cn')
 * params.append('type', 'assistant')
 * const url = BuildURL('/agent/assistants/tags', params)
 * // Returns: '/agent/assistants/tags?locale=zh-cn&type=assistant'
 *
 * @example
 * const params = new URLSearchParams()
 * const url = BuildURL('/agent/assistants', params)
 * // Returns: '/agent/assistants'
 *
 * @example
 * // Handles path with existing '?'
 * const url = BuildURL('/agent/assistants?', params)
 * // Returns: '/agent/assistants?locale=zh-cn&type=assistant' (removes duplicate '?')
 */
export function BuildURL(path: string, params: URLSearchParams): string {
	// Get query string from params
	const queryString = params.toString()
	
	// If no query string, return path as is (remove trailing '?' if exists)
	if (!queryString) {
		return path.endsWith('?') ? path.slice(0, -1) : path
	}
	
	// Remove trailing '?' from path if exists
	const cleanPath = path.endsWith('?') ? path.slice(0, -1) : path
	
	// Check if path already contains '?'
	if (cleanPath.includes('?')) {
		// Path already has query params, append with '&'
		return `${cleanPath}&${queryString}`
	}
	
	// Normal case: path + '?' + query string
	return `${cleanPath}?${queryString}`
}
