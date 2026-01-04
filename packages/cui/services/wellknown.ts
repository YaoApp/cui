/**
 * Yao server metadata from /.well-known/yao
 */
export interface YaoMetadata {
	name?: string
	version?: string
	description?: string
	openapi: string // OpenAPI base URL (e.g., "/v1")
	issuer_url?: string
	dashboard?: string // Admin dashboard root path (e.g., "/admin")
	optional?: Record<string, any>
	developer?: {
		id?: string
		name?: string
		info?: string
		email?: string
		homepage?: string
	}
}

// In-memory cache (global singleton)
let cache: YaoMetadata | null = null
let fetched = false

/**
 * Fetch metadata from server using synchronous XMLHttpRequest
 */
function fetchMetadataSync(): YaoMetadata | null {
	try {
		const xhr = new XMLHttpRequest()
		xhr.open('GET', '/.well-known/yao', false) // false = synchronous
		xhr.setRequestHeader('Accept', 'application/json')
		xhr.send(null)

		if (xhr.status === 200) {
			const data = JSON.parse(xhr.responseText) as YaoMetadata
			if (data?.openapi) {
				cache = data
				fetched = true
				return data
			}
		}

		// 404 or missing openapi field means OpenAPI is not enabled
		fetched = true
		return null
	} catch (error) {
		console.warn('Failed to fetch /.well-known/yao:', error)
		fetched = true
		return null
	}
}

/**
 * Get Yao metadata (synchronous, cached in memory)
 */
export function getYaoMetadata(forceRefresh = false): YaoMetadata | null {
	if (!forceRefresh && fetched) {
		return cache
	}
	return fetchMetadataSync()
}

/**
 * Check if OpenAPI is enabled
 */
export function isOpenAPIEnabled(): boolean {
	return getYaoMetadata() !== null
}

/**
 * Get OpenAPI base URL (returns null if not enabled)
 */
export function getOpenAPIBaseURL(): string | null {
	return getYaoMetadata()?.openapi || null
}

/**
 * Get dashboard path (returns default if not available)
 */
export function getDashboardPath(): string {
	return getYaoMetadata()?.dashboard || '/yao'
}

/**
 * Clear cache (for testing or logout)
 */
export function clearWellKnownCache(): void {
	cache = null
	fetched = false
}

/**
 * Get API base path for widget/system APIs
 * - OpenAPI enabled: /{baseURL} (e.g., /v1)
 * - Legacy mode: /api
 */
export function getApiBase(): string {
	return getYaoMetadata()?.openapi || '/api'
}

/**
 * Get default app logo URL
 */
export function getDefaultLogoUrl(): string {
	return `${getApiBase()}/__yao/app/icons/app.png`
}
