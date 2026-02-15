import { OpenAPIConfig, ApiResponse, ErrorResponse, JWKs } from './types'
import { HeaderBuilder, headers } from './headers'

/**
 * Yao OpenAPI Client with STRICT Secure Cookie Authentication
 *
 * 🚀 COMPREHENSIVE HTTP CLIENT FOR Yao App Engine:
 * Complete RESTful API client supporting all Yao OpenAPI endpoints including:
 * - OAuth 2.1 Authentication & OpenID Connect
 * - DSL Management (Models, Connectors, APIs, etc.)
 * - File Management (Upload, Download, Storage)
 * - AI Chat Completions (OpenAI Compatible)
 * - User Authentication & Signin
 *
 * 🛡️ STRICT SECURITY POLICY:
 * - MANDATORY __Secure- or __Host- prefixed cookies only
 * - No backward compatibility with insecure cookie names
 * - Strict enforcement of browser security standards (RFC 6265bis)
 * - Development-friendly: allows localhost and .local domains
 * - Intranet-friendly: allows private network addresses with warnings
 * - Production warnings for non-HTTPS connections
 *
 * 📚 HTTP METHODS SUPPORTED:
 * - GET: Retrieve resources, list data, download content
 * - POST: Create resources, authenticate, chat completions
 * - PUT: Update existing resources, modify configurations
 * - DELETE: Remove resources, clean up data
 * - Upload: File uploads with multipart/form-data support
 *
 * 🔒 COOKIE PREFIX REQUIREMENTS (RFC 6265bis):
 * - __Secure-*: Requires Secure flag, HTTPS-only transmission
 * - __Host-*: Most secure - Requires Secure flag, no Domain attr, Path=/
 *
 * Supported Cookie Names:
 * - Authentication: __Host-access_token, __Secure-access_token, __Host-session_token, __Secure-session_token
 * - CSRF Protection: __Host-csrf_token, __Secure-csrf_token, __Host-xsrf_token, __Secure-xsrf_token
 *
 * Environment Support:
 * 1. 🔧 Development: localhost/127.0.0.1/.local (permissive)
 * 2. 🏢 Intranet: Private IP ranges + .internal/.corp/.lan domains (allowed with warnings)
 * 3. 🌐 Public: External networks (allowed with strict HTTPS warnings)
 *
 * Private Network Ranges (RFC 1918):
 * - 10.0.0.0/8 (10.0.0.0 - 10.255.255.255)
 * - 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
 * - 192.168.0.0/16 (192.168.0.0 - 192.168.255.255)
 * - 169.254.0.0/16 (Link-local addresses)
 *
 * Security Features:
 * 1. MANDATORY secure cookie prefix validation
 * 2. Smart context validation (environment-aware security)
 * 3. HTTPS preference with debugging flexibility
 * 4. Multi-source CSRF protection (cookies + localStorage + meta tags)
 * 5. HttpOnly cookie support via credentials: 'include'
 * 6. Cross-origin authentication support
 * 7. Automatic authentication token handling
 * 8. Content-Type management for different payloads
 *
 * Server-side Cookie Requirements:
 * - HttpOnly: Prevents XSS attacks (MANDATORY)
 * - Secure: HTTPS-only transmission (MANDATORY)
 * - SameSite=Lax: CSRF protection with good compatibility (MANDATORY)
 * - __Secure- or __Host- prefix (MANDATORY)
 * - For __Host-: no Domain attribute, Path=/ (MANDATORY)
 *
 * Usage Examples:
 *
 * // Initialize client
 * const api = new OpenAPI({ baseURL: 'https://api.example.com/v1' })
 *
 * // Basic HTTP methods with type safety and error handling
 * const response = await api.Get<MyDataType>('/my/endpoint')
 * if (api.IsError(response)) {
 *   // Handle OAuth 2.1 compliant error format
 *   console.error(`Error ${response.error.error}: ${response.error.error_description}`)
 *   console.log(`HTTP Status: ${response.status}`)
 * } else {
 *   // Use type-safe data
 *   const data: MyDataType = response.data
 *   console.log('Success:', data)
 * }
 *
 * // POST with JSON payload
 * const createResponse = await api.Post<CreateResult>('/resources', {
 *   name: 'My Resource',
 *   type: 'example'
 * })
 *
 * // PUT for updates
 * const updateResponse = await api.Put<UpdateResult>('/resources/123', {
 *   name: 'Updated Resource'
 * })
 *
 * // DELETE resources
 * const deleteResponse = await api.Delete<void>('/resources/123')
 *
 * // File upload with FormData
 * const formData = new FormData()
 * formData.append('file', fileInput.files[0])
 * formData.append('metadata', JSON.stringify({ category: 'documents' }))
 * const uploadResponse = await api.Upload<any>('/upload', formData)
 *
 * // Custom headers
 * const customResponse = await api.Get<any>('/endpoint', {
 *   'Custom-Header': 'value',
 *   'Accept': 'application/json'
 * })
 *
 * // Helper methods for response handling
 * const data = api.GetData(response) // Extract data safely
 * const hasError = api.IsError(response) // Type-safe error checking
 *
 * // Cross-origin authentication handling
 * if (api.IsCrossOrigin()) {
 *   console.log('Cross-origin API detected')
 *
 *   // After successful login, manually set CSRF token
 *   const loginResponse = await api.Post('/auth/login', credentials)
 *   if (!api.IsError(loginResponse) && loginResponse.data.csrf_token) {
 *     api.SetCSRFToken(loginResponse.data.csrf_token)
 *   }
 * }
 *
 * // Logout and cleanup
 * await api.Post('/auth/logout', {})
 * api.ClearTokens() // Clear stored tokens
 */
export class OpenAPI {
	private config: OpenAPIConfig

	constructor(config: OpenAPIConfig) {
		this.config = config
	}

	private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
		const apiResponse: ApiResponse<T> = {
			status: response.status,
			headers: response.headers
		}

		// Invoke onUnauthorized callback for 401 responses
		if (response.status === 401 && this.config.onUnauthorized) {
			const suppress = this.config.onUnauthorized(response)
			if (suppress === true) {
				apiResponse.error = {
					error: 'unauthorized',
					error_description: 'Authentication required'
				}
				return apiResponse
			}
		}

		try {
			// Handle different content types
			const contentType = response.headers.get('content-type') || ''

			if (contentType.includes('application/json')) {
				const jsonData = await response.json()

				// Check if response contains OAuth error format
				if (!response.ok && jsonData.error) {
					apiResponse.error = jsonData as ErrorResponse
				} else if (response.ok) {
					apiResponse.data = jsonData as T
				} else {
					// Fallback error for non-OAuth error responses
					apiResponse.error = {
						error: 'http_error',
						error_description: `HTTP ${response.status}: ${response.statusText}`
					}
				}
			} else if (response.ok) {
				// Handle non-JSON successful responses (like file downloads)
				const textData = await response.text()
				apiResponse.data = textData as unknown as T
			} else {
				// Handle non-JSON error responses
				const errorText = await response.text()
				apiResponse.error = {
					error: 'http_error',
					error_description: errorText || `HTTP ${response.status}: ${response.statusText}`
				}
			}
		} catch (parseError) {
			// Handle JSON parsing errors
			apiResponse.error = {
				error: 'parse_error',
				error_description: `Failed to parse response: ${
					parseError instanceof Error ? parseError.message : 'Unknown error'
				}`
			}
		}

		return apiResponse
	}

	/**
	 * Get JWKs
	 * @returns The JWKs
	 */
	async GetJWKs(): Promise<ApiResponse<JWKs>> {
		return this.Get<JWKs>('/oauth/jwks')
	}

	async Get<T = any>(
		path: string,
		query: Record<string, string> = {},
		headersInit: HeadersInit = {}
	): Promise<ApiResponse<T>> {
		const headerBuilder = headers(headersInit)
		query = query || {}

		// Add Content-Type header if not set
		if (!headerBuilder.has('Content-Type')) {
			headerBuilder.set('Content-Type', 'application/json')
		}

		// Use server-side cookie authentication instead of client-side
		// const token = await this.AccessToken()
		// if (token) {
		// 	headerBuilder.set('Authorization', `Bearer ${token}`)
		// }

		// Add CSRF token for security
		this.addCSRFToken(headerBuilder)

		// Build URL with query parameters
		// If path already contains '?', append with '&', otherwise use '?'
		const queryString = new URLSearchParams(query).toString()
		let url = `${this.config.baseURL}${path}`
		if (queryString) {
			url += path.includes('?') ? `&${queryString}` : `?${queryString}`
		}

		const response = await fetch(url, {
			method: 'GET',
			headers: headerBuilder.toHeaders(),
			credentials: 'include'
		})

		return this.handleResponse<T>(response)
	}

	async Post<T = any>(path: string, payload: any, headersInit: HeadersInit = {}): Promise<ApiResponse<T>> {
		const headerBuilder = headers(headersInit)

		// Add Content-Type header if not set
		if (!headerBuilder.has('Content-Type')) {
			headerBuilder.set('Content-Type', 'application/json')
		}

		// Add authentication token - use server-side cookie authentication instead of client-side
		// const token = await this.AccessToken()
		// if (token) {
		// 	headerBuilder.set('Authorization', `Bearer ${token}`)
		// }

		// Add CSRF token for double cookie pattern security
		this.addCSRFToken(headerBuilder)

		// Set content type for JSON payload
		if (payload && typeof payload === 'object' && !headerBuilder.has('Content-Type')) {
			headerBuilder.set('Content-Type', 'application/json')
		}

		const response = await fetch(`${this.config.baseURL}${path}`, {
			method: 'POST',
			body: typeof payload === 'object' ? JSON.stringify(payload) : payload,
			headers: headerBuilder.toHeaders(),
			// Include HttpOnly cookies automatically for authentication
			credentials: 'include'
		})

		return this.handleResponse<T>(response)
	}

	async Put<T = any>(path: string, payload: any, headersInit: HeadersInit = {}): Promise<ApiResponse<T>> {
		const headerBuilder = headers(headersInit)

		// Add Content-Type header if not set
		if (!headerBuilder.has('Content-Type')) {
			headerBuilder.set('Content-Type', 'application/json')
		}

		// Add authentication token - use server-side cookie authentication instead of client-side
		// const token = await this.AccessToken()
		// if (token) {
		// 	headerBuilder.set('Authorization', `Bearer ${token}`)
		// }

		// Add CSRF token for security
		this.addCSRFToken(headerBuilder)

		// Set content type for JSON payload
		if (payload && typeof payload === 'object' && !headerBuilder.has('Content-Type')) {
			headerBuilder.set('Content-Type', 'application/json')
		}

		const response = await fetch(`${this.config.baseURL}${path}`, {
			method: 'PUT',
			body: typeof payload === 'object' ? JSON.stringify(payload) : payload,
			headers: headerBuilder.toHeaders(),
			// Include HttpOnly cookies automatically for authentication
			credentials: 'include'
		})

		return this.handleResponse<T>(response)
	}

	async Delete<T = any>(path: string, headersInit: HeadersInit = {}, payload?: any): Promise<ApiResponse<T>> {
		const headerBuilder = headers(headersInit)

		// Add Content-Type header if not set
		if (!headerBuilder.has('Content-Type')) {
			headerBuilder.set('Content-Type', 'application/json')
		}

		// Add authentication token - use server-side cookie authentication instead of client-side
		// const token = await this.AccessToken()
		// if (token) {
		// 	headerBuilder.set('Authorization', `Bearer ${token}`)
		// }

		// Add CSRF token for security
		this.addCSRFToken(headerBuilder)

		const requestOptions: RequestInit = {
			method: 'DELETE',
			headers: headerBuilder.toHeaders(),
			// Include HttpOnly cookies automatically for authentication
			credentials: 'include'
		}

		// Add body if payload is provided
		if (payload !== undefined) {
			requestOptions.body = JSON.stringify(payload)
		}

		const response = await fetch(`${this.config.baseURL}${path}`, requestOptions)

		return this.handleResponse<T>(response)
	}

	async Upload<T = any>(path: string, formData: FormData, headersInit: HeadersInit = {}): Promise<ApiResponse<T>> {
		const headerBuilder = headers(headersInit)

		// Add authentication token - use server-side cookie authentication instead of client-side
		// const token = await this.AccessToken()
		// if (token) {
		// 	headerBuilder.set('Authorization', `Bearer ${token}`)
		// }

		// Add CSRF token for security
		this.addCSRFToken(headerBuilder)

		// Don't set Content-Type for FormData - let browser set it with boundary
		// FormData automatically sets multipart/form-data with proper boundary

		const response = await fetch(`${this.config.baseURL}${path}`, {
			method: 'POST',
			body: formData,
			headers: headerBuilder.toHeaders(),
			// Include HttpOnly cookies automatically for authentication
			credentials: 'include'
		})

		return this.handleResponse<T>(response)
	}

	async AccessToken(): Promise<string> {
		// SECURITY CHECK: Validate context (development-friendly)
		if (!this.isSecureContext()) {
			console.warn('🔒 Security: Unable to read cookies in current context')
			return ''
		}

		// NEW PROJECT: Only use secure-prefixed cookies (no backward compatibility)
		// __Host- is most secure (no Domain, Path=/), fallback to __Secure-
		const secureCookieValue =
			this.getSecureCookie('__Host-access_token') ||
			this.getSecureCookie('__Secure-access_token') ||
			this.getSecureCookie('__Host-session_token') ||
			this.getSecureCookie('__Secure-session_token')

		return secureCookieValue || ''
	}

	private isSecureContext(): boolean {
		// Check if running in browser environment
		if (typeof window === 'undefined') {
			return false
		}

		const hostname = window.location.hostname
		const isHTTPS = window.location.protocol === 'https:'
		const currentURL = window.location.href

		// DEVELOPMENT MODE: Allow localhost and development environments
		const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')

		// INTRANET MODE: Allow private network addresses
		const isIntranet = this.isPrivateNetworkAddress(hostname)

		// Handle localhost/development environments
		if (isLocalhost) {
			if (!isHTTPS) {
				console.info('🔧 Development Mode: Using HTTP on localhost for debugging')
			}
			return true
		}

		// Handle intranet environments
		if (isIntranet) {
			if (!isHTTPS) {
				console.warn('🏢 Intranet Warning: Using HTTP on private network')
				console.warn(`🏢 Current URL: ${currentURL}`)
				console.warn('🏢 Recommendation: Consider HTTPS even for internal networks')
				console.warn('🏢 Some security features may be limited over HTTP')
			} else {
				console.info('✅ Secure HTTPS connection detected on private network')
			}
			return true
		}

		// For public networks, warn about non-HTTPS connections
		if (!isHTTPS) {
			console.warn(`🔒 Security Warning: Using insecure HTTP connection on public network`)
			console.warn(`🔒 Current URL: ${currentURL}`)
			console.warn(`🔒 Recommendation: Switch to HTTPS for production security`)
			console.warn(`🔒 Cookie security features may be limited over HTTP`)
		} else {
			console.info('✅ Secure HTTPS connection detected')
		}

		// Allow all contexts but log security status
		return true
	}

	private isPrivateNetworkAddress(hostname: string): boolean {
		// Check for private IP address ranges (RFC 1918)
		const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
		const match = hostname.match(ipRegex)

		if (!match) {
			// Check for common intranet domain patterns
			return (
				hostname.endsWith('.internal') ||
				hostname.endsWith('.corp') ||
				hostname.endsWith('.lan') ||
				hostname.includes('.local.')
			)
		}

		const [, a, b, c, d] = match.map(Number)

		// Validate IP address format
		if (a > 255 || b > 255 || c > 255 || d > 255) {
			return false
		}

		// Check private IP ranges
		// 10.0.0.0/8 (10.0.0.0 - 10.255.255.255)
		if (a === 10) return true

		// 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
		if (a === 172 && b >= 16 && b <= 31) return true

		// 192.168.0.0/16 (192.168.0.0 - 192.168.255.255)
		if (a === 192 && b === 168) return true

		// Link-local addresses 169.254.0.0/16
		if (a === 169 && b === 254) return true

		return false
	}

	private getSecureCookie(name: string): string | null {
		// SECURITY ENFORCEMENT: Only allow secure cookie names
		if (!this.isSecureCookieName(name)) {
			console.warn(`🔒 Security: Cookie "${name}" does not meet security naming requirements`)
			return null
		}

		// Check if running in browser environment
		if (typeof document === 'undefined') {
			return null
		}

		// Parse cookie string to find the specified cookie
		const value = `; ${document.cookie}`
		const parts = value.split(`; ${name}=`)

		if (parts.length === 2) {
			const cookieValue = parts.pop()?.split(';').shift()
			return cookieValue ? decodeURIComponent(cookieValue) : null
		}

		return null
	}

	private isSecureCookieName(name: string): boolean {
		// NEW PROJECT: STRICT SECURITY - Only allow secure cookie prefixes
		// __Secure- prefix: requires Secure flag and HTTPS
		// __Host- prefix: requires Secure flag, HTTPS, no Domain, Path=/

		const hasSecurePrefix = name.startsWith('__Secure-') || name.startsWith('__Host-')

		if (!hasSecurePrefix) {
			console.warn(`🔒 Security Policy: Cookie "${name}" must use __Secure- or __Host- prefix`)
		}

		return hasSecurePrefix
	}

	// Add CSRF token to headers if available (supports both same-origin and cross-origin)
	private addCSRFToken(headerBuilder: HeaderBuilder): void {
		// CROSS-ORIGIN SUPPORT: Try multiple CSRF token sources

		// 1. Try reading from cookies (same-origin only)
		if (this.isSecureContext()) {
			const cookieToken =
				this.getSecureCookie('__Host-csrf_token') ||
				this.getSecureCookie('__Secure-csrf_token') ||
				this.getSecureCookie('__Host-xsrf_token') ||
				this.getSecureCookie('__Secure-xsrf_token')

			if (cookieToken) {
				headerBuilder.set('X-CSRF-Token', cookieToken)
				return
			}
		}

		// 2. Try reading from localStorage/sessionStorage (cross-origin fallback)
		// Note: This should be set by server after successful authentication
		if (typeof localStorage !== 'undefined') {
			const storedToken = localStorage.getItem('csrf_token') || localStorage.getItem('xsrf_token')
			if (storedToken) {
				headerBuilder.set('X-CSRF-Token', storedToken)
				return
			}
		}

		// 3. Try reading from meta tag (server-rendered pages)
		if (typeof document !== 'undefined') {
			const metaToken =
				document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
				document.querySelector('meta[name="xsrf-token"]')?.getAttribute('content')
			if (metaToken) {
				headerBuilder.set('X-CSRF-Token', metaToken)
				return
			}
		}

		// 4. No CSRF token available - let server handle it
		// For cross-origin APIs, server might not require CSRF tokens
		// if using other protection mechanisms (like proper CORS + SameSite cookies)
	}
	/**
	 * Response helper methods
	 */

	/**
	 * Check if response contains an error
	 */
	IsError<T>(response: ApiResponse<T>): response is ApiResponse<T> & { error: ErrorResponse } {
		return response.error !== undefined
	}

	/**
	 * Extract data from successful response
	 */
	GetData<T>(response: ApiResponse<T>): T | null {
		return response.data || null
	}

	/**
	 * Cross-origin authentication helpers
	 */

	/**
	 * Set CSRF token manually (for cross-origin scenarios)
	 * Call this after successful authentication to store CSRF token
	 */
	SetCSRFToken(token: string): void {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('csrf_token', token)
		}
	}

	/**
	 * Clear stored CSRF tokens (logout helper)
	 * Note: Access tokens are stored in HttpOnly secure cookies and cleared by server
	 */
	ClearTokens(): void {
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem('csrf_token')
			localStorage.removeItem('xsrf_token')
		}
	}

	/**
	 * Check if current request will be cross-origin
	 */
	IsCrossOrigin(): boolean {
		if (typeof window === 'undefined') {
			return false
		}

		try {
			const apiUrl = new URL(this.config.baseURL, window.location.origin)
			const currentOrigin = window.location.origin
			return apiUrl.origin !== currentOrigin
		} catch {
			return true // Assume cross-origin if URL parsing fails
		}
	}
}

export default OpenAPI
// Signin module has been migrated to User module
export { Captcha } from './captcha'
