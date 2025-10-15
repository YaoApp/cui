// ===== Authentication Types =====

/**
 * Login status enum
 */
export enum LoginStatus {
	Success = 'ok',
	MFARequired = 'mfa_required',
	TeamSelectionRequired = 'team_selection_required'
}

/**
 * OAuth provider configuration
 */
export interface SigninProvider {
	id: string
	label: string
	title: string
	logo?: string
	color: string
	text_color?: string
	client_id: string
	response_mode?: string
}

export interface OAuthAuthorizationURLResponse {
	authorization_url: string
	state: string
	error?: string
	error_description?: string
}

// OAuth callback request
export interface OAuthAuthbackParams {
	code: string
	state: string
	provider: string
	error?: string
	error_description?: string
	[key: string]: any
}

export interface OAuthAuthbackResponse {
	session_id?: string
	id_token?: string
	access_token?: string
	refresh_token?: string
	expires_in?: number
	refresh_token_expires_in?: number
	mfa_enabled?: boolean
	status?: LoginStatus
	error?: string
	error_description?: string
}

/**
 * Complete OAuth authentication result
 * Contains validated user info and authentication metadata
 */
export interface OAuthAuthResult {
	/** Login status */
	status: LoginStatus
	/** Validated user information from ID token (only available when status is Success) */
	user?: UserInfo
	/** OAuth provider identifier */
	provider?: string
	/** Authentication timestamp */
	authenticated_at: number
	/** ID token expiration timestamp */
	expires_at?: number
	/** Available scope */
	scope?: string
	/** Additional features */
	features?: object

	/** Entry */
	redirect_url?: string

	/** Logout redirect */
	logout_redirect?: string

	/** Session ID (for MFA or team selection) */
	session_id?: string

	access_token?: string
	expires_in?: number | number
	refresh_token?: string
	refresh_token_expires_in?: number
}

/**
 * User information from OpenID Connect ID token
 * Contains standard OIDC claims plus additional custom claims
 */
export interface UserInfo {
	/** Subject - unique identifier for the user */
	user_id: string
	/** User's display name */
	name?: string
	/** User's given/first name */
	given_name?: string
	/** User's family/last name */
	family_name?: string
	/** User's middle name */
	middle_name?: string
	/** User's nickname */
	nickname?: string
	/** User's preferred username */
	preferred_username?: string
	/** URL of user's profile page */
	profile?: string
	/** URL of user's profile picture */
	picture?: string
	/** URL of user's website */
	website?: string
	/** User's email address */
	email?: string
	/** Whether email address has been verified */
	email_verified?: boolean
	/** User's gender */
	gender?: string
	/** User's birthdate in YYYY-MM-DD format */
	birthdate?: string
	/** User's timezone */
	zoneinfo?: string
	/** User's locale */
	locale?: string
	/** User's phone number */
	phone_number?: string
	/** Whether phone number has been verified */
	phone_number_verified?: boolean
	/** User's address information */
	address?: {
		formatted?: string
		street_address?: string
		locality?: string
		region?: string
		postal_code?: string
		country?: string
	}
	/** Timestamp when profile was last updated */
	updated_at?: number
	/** JWT issued at timestamp */
	iat?: number
	/** JWT expiration timestamp */
	exp?: number
	/** JWT issuer */
	iss?: string
	/** Client ID (mapped from aud claim) */
	client_id?: string
	/** Token ID (mapped from jti claim) - unique identifier for this JWT */
	token_id?: string
	/** User's available scope */
	scope?: string
	/** User's features */
	features?: object
	/** Yao user ID (original user ID) */
	'yao:user_id'?: string
	/** Yao tenant ID */
	'yao:tenant_id'?: string
	/** Yao team ID */
	'yao:team_id'?: string
	/** Yao team information */
	'yao:team'?: TeamInfo
	/** Whether the user is the owner of the team */
	'yao:is_owner'?: boolean
	/** Yao user type ID */
	'yao:type_id'?: string
	/** Yao user type information */
	'yao:type'?: TypeInfo
	/** Additional custom claims */
	[key: string]: any
}

/**
 * Team information
 */
export interface TeamInfo {
	/** Team identifier */
	team_id?: string
	/** Team logo URL */
	logo?: string
	/** Team name */
	name?: string
	/** Team owner user ID */
	owner_id?: string
	/** Team description */
	description?: string
	/** Timestamp when team was last updated */
	updated_at?: number
}

/**
 * User type information
 */
export interface TypeInfo {
	/** User type identifier */
	type_id?: string
	/** User type name */
	name?: string
	/** User type locale */
	locale?: string
}

/**
 * JWT Header
 */
export interface JWTHeader {
	alg: string
	typ: string
	kid?: string
}

/**
 * JWT Payload (standard claims)
 */
export interface JWTPayload {
	iss?: string // Issuer
	sub?: string // Subject
	aud?: string | string[] // Audience
	exp?: number // Expiration Time
	nbf?: number // Not Before
	iat?: number // Issued At
	jti?: string // JWT ID
	[key: string]: any // Additional claims
}

/**
 * Captcha response
 */
export interface CaptchaResponse {
	captcha_id: string
	captcha_image: string // Base64 encoded image or image URL
	expires_in?: number // Captcha expiration time in seconds
}

/**
 * Entry configuration response (unified login + register)
 */
export interface EntryConfig {
	title: string
	description: string
	success_url: string
	failure_url?: string
	logout_redirect?: string
	auto_login?: boolean
	role?: string
	type?: string
	form?: {
		username?: {
			placeholder: string
			fields: string[]
		}
		password?: {
			placeholder: string
		}
		captcha?: {
			type: 'image' | 'turnstile'
			options?: {
				secret?: string
				sitekey?: string
			}
		}
		remember_me?: boolean
		forgot_password_link?: boolean
		terms_of_service_link?: string
		privacy_policy_link?: string
	}
	token?: {
		expires_in?: string
		remember_me_expires_in?: string
	}
	messenger?: {
		channel?: string
		templates?: Record<string, string>
	}
	invite_required?: boolean
	third_party?: {
		providers: SigninProvider[]
	}
}

/**
 * Entry request payload (unified login/register)
 */
export interface EntryRequest {
	email: string
	captcha_code?: string
	captcha_id?: string
	locale?: string
}

/**
 * Entry response data (unified login/register)
 */
export interface EntryResponse {
	success: boolean
	message: string
	verification_required: boolean
	email: string
	next_step?: string
}

// ===== User Management Types =====
/**
 * User Profile (OIDC UserInfo)
 * Returned by GET /api/__yao/user/profile
 */
export interface UserProfile {
	/** OIDC Standard Claims */
	sub: string // Subject identifier (required)
	name?: string // Full name
	given_name?: string // Given name(s) or first name(s)
	family_name?: string // Surname(s) or last name(s)
	middle_name?: string // Middle name(s)
	nickname?: string // Casual name
	preferred_username?: string // Shorthand name
	profile?: string // Profile page URL
	picture?: string // Profile picture URL
	website?: string // Web page or blog URL
	email?: string // Email address
	email_verified?: boolean // Email verification status
	gender?: string // Gender
	birthdate?: string // Birthday (YYYY-MM-DD format)
	zoneinfo?: string // Time zone info
	locale?: string // Locale (language-country)
	phone_number?: string // Phone number
	phone_number_verified?: boolean // Phone verification status
	updated_at?: number // Time of last update (seconds since epoch)

	/** OIDC Address Claim */
	address?: {
		formatted?: string
		street_address?: string
		locality?: string
		region?: string
		postal_code?: string
		country?: string
	}

	/** Yao Custom Claims */
	'yao:user_id'?: string // Yao user ID (original user ID)
	'yao:tenant_id'?: string // Yao tenant ID
	'yao:team_id'?: string // Yao team ID
	'yao:team'?: {
		team_id?: string
		name?: string
		logo?: string
		description?: string
		owner_id?: string
	}
	'yao:is_owner'?: boolean // Is owner of current team
}

export interface UserPreferences {
	theme?: 'light' | 'dark'
	language?: string
	timezone?: string
	notifications?: {
		email?: boolean
		push?: boolean
		sms?: boolean
	}
}

export interface UserAccount {
	email?: string
	mobile?: string
	email_verified?: boolean
	mobile_verified?: boolean
}

export interface MFAConfig {
	totp_enabled?: boolean
	sms_enabled?: boolean
	recovery_codes?: string[]
}

export interface UserSubscription {
	plan?: string
	status?: string
	expires_at?: string
	features?: string[]
}

export interface UserCredits {
	balance: number
	currency?: string
	last_updated?: string
}

// ===== Team Management Types =====

/**
 * Team response from API
 */
export interface UserTeam {
	team_id: string
	name: string
	display_name?: string
	description?: string
	website?: string
	logo?: string
	owner_id: string
	status: string
	type_id?: string
	type?: string
	is_verified: boolean
	verified_by?: string
	verified_at?: string
	created_at: string
	updated_at: string
	role_id?: string // User's role in the team (returned by GetTeams)
	is_owner?: boolean // Whether the current user is the owner of this team
}

/**
 * Team detail response with additional settings and contact information
 */
export interface UserTeamDetail extends UserTeam {
	contact_email?: string
	contact_phone?: string
	team_code?: string
	team_code_type?: string
	address?: string
	street_address?: string
	city?: string
	state_province?: string
	postal_code?: string
	country?: string
	country_name?: string
	region?: string
	zoneinfo?: string
	settings?: TeamSettings
	metadata?: Record<string, any>
}

/**
 * Request payload for creating a team
 */
export interface CreateTeamRequest {
	name: string
	description?: string
	settings?: TeamSettings
	locale?: string // Locale for default team configuration (e.g., type)
}

/**
 * Request payload for updating a team
 */
export interface UpdateTeamRequest {
	name?: string
	description?: string
	settings?: TeamSettings
}

/**
 * Request payload for selecting a team
 */
export interface SelectTeamRequest {
	team_id: string
}

/**
 * Response for team selection (returns new tokens with team_id)
 */
export interface SelectTeamResponse {
	user_id: string
	subject: string
	access_token: string
	id_token: string
	refresh_token: string
	expires_in: number
	refresh_token_expires_in: number
	token_type: string
	scope: string
	status: LoginStatus
	user?: UserInfo
}

/**
 * Request for accepting team invitation
 */
export interface AcceptInvitationRequest {
	token: string
}

/**
 * Team list response (simple array, no pagination)
 * Returns all teams where the user is a member, including role information
 */
export type TeamListResponse = UserTeam[]

export interface UserAPIKey {
	id: string
	name: string
	key?: string
	permissions?: string[]
	expires_at?: string
	created_at: string
	last_used?: string
}

// ===== Team Configuration Types =====

/**
 * Team role configuration
 */
export interface TeamRole {
	role_id: string
	label: string
	description: string
	default?: boolean // Whether this role is the default role
	hidden?: boolean // Whether this role is hidden from UI
}

/**
 * Invitation configuration
 */
export interface InviteConfig {
	channel?: string
	expiry?: string
	base_url?: string // Base URL for invitation links
	templates?: Record<string, string>
}

/**
 * Team configuration response (public endpoint)
 */
export interface TeamConfig {
	roles?: TeamRole[]
	invite?: InviteConfig
}

// ===== Settings Types =====

/**
 * Team-specific settings
 */
export interface TeamSettings {
	/** Team UI theme (e.g., "light", "dark") */
	theme?: string
	/** Team visibility (e.g., "public", "private") */
	visibility?: string
}

/**
 * Member-specific settings
 */
export interface MemberSettings {
	/** Whether to receive notifications */
	notifications?: boolean
	/** Custom permissions (e.g., ["read", "write"]) */
	permissions?: string[]
}

/**
 * Invitation-specific settings
 */
export interface InvitationSettings {
	/** Whether to send invitation email */
	send_email?: boolean
	/** Locale for email template */
	locale?: string
}

// ===== Team Member Management Types =====

/**
 * Team member response from API
 */
export interface TeamMember {
	id: number
	team_id: string
	user_id: string
	member_type: string
	role_id: string
	status: string
	invited_by?: string
	invited_at?: string
	joined_at?: string
	last_activity?: string
	settings?: MemberSettings
	created_at: string
	updated_at: string
}

/**
 * Team member detail response with additional user info
 */
export interface TeamMemberDetail extends TeamMember {
	user_info?: Record<string, any>
}

/**
 * Request payload for adding a team member directly
 */
export interface CreateMemberRequest {
	user_id: string
	member_type?: string // "user" or "robot"
	role_id: string
	settings?: MemberSettings
}

/**
 * Request payload for updating a team member
 */
export interface UpdateMemberRequest {
	role_id?: string
	status?: string
	settings?: MemberSettings
	last_activity?: string
}

/**
 * Paginated list response for team members
 */
export interface MemberListResponse {
	data: TeamMember[]
	total: number
	page: number
	pagesize: number
	pagecnt: number
	next: number
	prev: number
}

// ===== Team Invitation Management Types =====

/**
 * Team invitation response from API
 */
export interface TeamInvitation {
	id: number
	invitation_id?: string // Business key for invitation
	team_id: string
	user_id: string
	member_type: string
	role_id: string
	status: string
	invited_by: string
	invited_at: string
	invitation_token?: string
	invitation_link?: string // Full invitation link (constructed by backend)
	invitation_expires_at?: string
	message?: string
	settings?: InvitationSettings
	created_at: string
	updated_at: string
}

/**
 * Team invitation detail response with additional info
 */
export interface TeamInvitationDetail extends TeamInvitation {
	user_info?: Record<string, any>
	team_info?: Record<string, any>
}

/**
 * Request payload for creating a team invitation
 */
export interface CreateInvitationRequest {
	user_id?: string // Optional for unregistered users
	email?: string // Email address (if not provided, will be read from user profile when user_id is provided)
	member_type?: string // "user" or "robot"
	role_id: string
	message?: string
	expiry?: string // Custom expiry duration (e.g., "1d", "8h"), defaults to team config
	send_email?: boolean // Whether to send email (defaults to false)
	locale?: string // Language code for email template (e.g., "zh-CN", "en")
	settings?: InvitationSettings
}

/**
 * Paginated list response for team invitations
 */
export interface InvitationListResponse {
	data: TeamInvitation[]
	total: number
	page: number
	pagesize: number
	pagecnt: number
	next: number
	prev: number
}

/**
 * Inviter's public information
 */
export interface InviterInfo {
	user_id: string
	name?: string
	picture: string
}

/**
 * Public invitation response (for invitation recipients)
 * This type excludes sensitive information like tokens, database IDs, and timestamps
 */
export interface PublicInvitationResponse {
	invitation_id: string
	team_name: string
	team_logo: string
	team_description: string
	role_label?: string
	status: string
	invited_at: string
	invitation_expires_at?: string
	message?: string
	inviter_info?: InviterInfo
}
