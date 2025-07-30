/**
 * Core types for the OpenAPI client
 */
export interface OpenAPIConfig {
	baseURL: string
	timeout?: number
	defaultHeaders?: Record<string, string>
}

/**
 * OAuth 2.1 compliant error response format
 */
export interface ErrorResponse {
	error: string
	error_description?: string
	error_uri?: string
}

/**
 * OAuth 2.1 token response format
 */
export interface TokenResponse {
	access_token: string
	token_type: string
	expires_in?: number
	refresh_token?: string
	scope?: string
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = any> {
	data?: T
	error?: ErrorResponse
	status: number
	headers: Headers
}

/**
 * File upload response structure
 */
export interface FileUploadResponse {
	file_id: string
	filename: string
	size: number
	content_type: string
	url?: string
	metadata?: Record<string, any>
}

/**
 * File list response structure
 */
export interface FileListResponse {
	files: Array<{
		file_id: string
		filename: string
		size: number
		content_type: string
		created_at: string
		metadata?: Record<string, any>
	}>
	total: number
	page?: number
	per_page?: number
}

/**
 * Authorization server metadata (OpenID Connect Discovery)
 */
export interface AuthorizationServerMetadata {
	issuer: string
	authorization_endpoint: string
	token_endpoint: string
	userinfo_endpoint?: string
	jwks_uri?: string
	registration_endpoint?: string
	scopes_supported?: string[]
	response_types_supported: string[]
	grant_types_supported?: string[]
	token_endpoint_auth_methods_supported?: string[]
	subject_types_supported: string[]
	end_session_endpoint?: string
}
