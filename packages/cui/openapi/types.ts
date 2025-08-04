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

/**
 * JSON Web Key (JWK) as defined in RFC 7517
 */
export interface JWK {
	/**
	 * Key Type - identifies the cryptographic algorithm family used with the key
	 * Common values: "RSA", "EC", "oct"
	 */
	kty: string

	/**
	 * Public Key Use - identifies the intended use of the public key
	 * Values: "sig" (signature) or "enc" (encryption)
	 */
	use?: string

	/**
	 * Key Operations - identifies the operation(s) for which the key is intended to be used
	 */
	key_ops?: string[]

	/**
	 * Algorithm - identifies the algorithm intended for use with the key
	 */
	alg?: string

	/**
	 * Key ID - used to match a specific key
	 */
	kid?: string

	/**
	 * X.509 URL - URI that refers to a resource for an X.509 public key certificate or certificate chain
	 */
	x5u?: string

	/**
	 * X.509 Certificate Chain - contains a chain of one or more PKIX certificates
	 */
	x5c?: string[]

	/**
	 * X.509 Certificate SHA-1 Thumbprint
	 */
	x5t?: string

	/**
	 * X.509 Certificate SHA-256 Thumbprint
	 */
	'x5t#S256'?: string
}

/**
 * RSA Key parameters (extends JWK for RSA keys)
 */
export interface RSAKey extends JWK {
	kty: 'RSA'
	/**
	 * Modulus - the "n" parameter for RSA
	 */
	n: string

	/**
	 * Exponent - the "e" parameter for RSA
	 */
	e: string

	/**
	 * Private Exponent - the "d" parameter for RSA (private keys only)
	 */
	d?: string

	/**
	 * First Prime Factor - the "p" parameter for RSA (private keys only)
	 */
	p?: string

	/**
	 * Second Prime Factor - the "q" parameter for RSA (private keys only)
	 */
	q?: string

	/**
	 * First Factor CRT Exponent - the "dp" parameter for RSA (private keys only)
	 */
	dp?: string

	/**
	 * Second Factor CRT Exponent - the "dq" parameter for RSA (private keys only)
	 */
	dq?: string

	/**
	 * First CRT Coefficient - the "qi" parameter for RSA (private keys only)
	 */
	qi?: string
}

/**
 * Elliptic Curve Key parameters (extends JWK for EC keys)
 */
export interface ECKey extends JWK {
	kty: 'EC'
	/**
	 * Curve - identifies the cryptographic curve used with the key
	 * Common values: "P-256", "P-384", "P-521"
	 */
	crv: string

	/**
	 * X Coordinate
	 */
	x: string

	/**
	 * Y Coordinate
	 */
	y: string

	/**
	 * ECC Private Key (private keys only)
	 */
	d?: string
}

/**
 * Symmetric Key parameters (extends JWK for symmetric keys)
 */
export interface SymmetricKey extends JWK {
	kty: 'oct'
	/**
	 * Key Value - contains the value of the symmetric key
	 */
	k: string
}

/**
 * JSON Web Key Set (JWKs) as defined in RFC 7517
 */
export interface JWKs {
	/**
	 * Array of JSON Web Key objects
	 */
	keys: (RSAKey | ECKey | SymmetricKey | JWK)[]
}
