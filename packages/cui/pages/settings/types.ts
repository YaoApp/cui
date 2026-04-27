import { ProviderSchema, PropertyValue } from '@/components/ui/Provider/types'

export interface User {
	id: string
	name: string
	email: string
	avatar?: string
	picture?: string
	gender?: string
	zoneinfo?: string
	website?: string
	role: string
	plan: string
	created_at: string
	updated_at: string
}

export interface ContactInfo {
	email?: string
	phone?: string
	email_verified: boolean
	phone_verified: boolean
}

export interface OAuthProvider {
	provider: string
	provider_id: string
	email?: string
	name?: string
	avatar?: string
	connected_at: string
}

export interface TwoFactorMethod {
	type: 'sms' | 'totp'
	enabled: boolean
	phone?: string
	secret?: string
	backup_codes?: string[]
	enabled_at?: string
}

export interface SecurityData {
	contact: ContactInfo
	oauthProviders: OAuthProvider[]
	twoFactor: {
		enabled: boolean
		primary_method?: 'sms' | 'totp'
		methods: TwoFactorMethod[]
	}
}

export interface MenuItem {
	id: string
	key: string
	name: {
		'zh-CN': string
		'en-US': string
	}
	icon: string
	path: string | { 'zh-CN': string; 'en-US': string }
}

export interface MenuGroup {
	key: string
	name: {
		'zh-CN': string
		'en-US': string
	}
	order: number
	items: MenuItem[]
}

export interface ApiKey {
	id: string
	name: string
	key: string
	created_at: string
	last_used_at?: string
	status: 'active' | 'disabled'
}

export interface Subscription {
	id: string
	plan: string
	status: 'active' | 'expired' | 'cancelled'
	start_date: string
	end_date: string
	requests_included: number
	requests_used: number
	monthly_cost: number
}

export type PlanType = 'free' | 'pro' | 'enterprise' | 'selfhosting'

export type CreditPackageType = 'purchased' | 'reward' | 'referral' | 'promotion' | 'gift'

export type TopUpMethod = 'stripe' | 'card_code' | 'bank_transfer' | 'alipay' | 'wechat'
export type TopUpStatus = 'completed' | 'pending' | 'failed' | 'cancelled'

export interface TopUpRecord {
	id: string
	amount: number
	credits: number
	method: TopUpMethod
	status: TopUpStatus
	expiry_date: string
	created_at: string
	completed_at?: string
	transaction_id?: string
	card_code?: string
	notes?: string
}

export interface BalanceInfo {
	total_credits: number
	monthly_credits: {
		used: number
		limit: number
		reset_date: string
	}
	extra_credits: CreditPackage[]
	pending_credits: number
}

export interface CreditPackage {
	id: string
	type: CreditPackageType
	name: {
		'zh-CN': string
		'en-US': string
	}
	original_amount: number
	used: number
	balance: number
	expiry_date: string
	created_at: string
	description?: {
		'zh-CN': string
		'en-US': string
	}
}

export interface CreditsInfo {
	monthly: {
		used: number
		limit: number
		reset_date: string
	}
	packages: CreditPackage[]
	total_used: number
	total_available: number
}

export interface PlanData {
	type: PlanType
	name: {
		'zh-CN': string
		'en-US': string
	}
	status: 'active' | 'cancelled' | 'expired'
	billing_cycle?: 'monthly' | 'yearly'
	current_period_start?: string
	current_period_end?: string
	next_billing_date?: string
	credits: CreditsInfo
}

export interface UsageStats {
	current_month: {
		requests: number
		requests_limit: number
		cost: number
		monthly_quota_used: number
		monthly_quota_limit: number
		extra_credits_used: number
		tokens_used: number
	}
	last_30_days: Array<{
		date: string
		requests: number
		cost: number
	}>
}

export interface UsageRecord {
	id: string
	date: string
	requests: number
	cost: number
	tokens: number
}

export interface PaymentMethod {
	id: string
	type: 'card' | 'bank_account'
	brand?: string
	last4?: string
	exp_month?: number
	exp_year?: number
}

export interface BillingAddress {
	line1: string
	line2?: string
	city: string
	state: string
	postal_code: string
	country: string
}

export interface CurrentPlan {
	id: string
	name: string
	amount: number
	currency: string
	interval: 'month' | 'year'
}

export interface BillingData {
	customer_id: string
	current_plan: CurrentPlan
	next_billing_date?: string
	payment_method?: PaymentMethod
	billing_address?: BillingAddress
}

export type InvoiceStatus = 'paid' | 'pending' | 'failed' | 'refunded'

export interface Invoice {
	id: string
	invoice_number: string
	date: string
	description: string
	amount: number
	currency: string
	status: InvoiceStatus
	pdf_url?: string | null
}

export interface TeamMember {
	id: string
	name: string
	email: string
	avatar?: string
	role: 'owner' | 'admin' | 'member'
	status: 'active' | 'pending' | 'suspended'
	joined_at: string
	last_active?: string
}

export interface Team {
	id: string
	name: string
	description?: string
	avatar?: string
	created_at: string
	updated_at: string
	member_count: number
	invite_link: string
	invite_link_enabled: boolean
}

export interface TeamInvitation {
	id: string
	email: string
	role: 'admin' | 'member'
	invited_by: string
	invited_at: string
	expires_at: string
	status: 'pending' | 'expired' | 'cancelled'
}

export type PreferencesData = Record<string, PropertyValue>
export type PrivacyData = Record<string, PropertyValue>

export interface AuditLog {
	id: string
	event_id?: string
	operation: string
	category?: 'authentication' | 'authorization' | 'data' | 'system'
	severity: 'low' | 'medium' | 'high' | 'critical'
	user_id: string
	user_name?: string
	session_id?: string
	client_ip?: string
	user_agent?: string
	target_resource?: string
	resource_type?: string
	source?: string
	application?: string
	success: boolean
	error_message?: string
	created_at: string
	updated_at: string
}

export interface AuditLogResponse {
	records: AuditLog[]
	total: number
}

export interface SystemInfoData {
	app: {
		name: string
		short: string
		description: string
		logo: string
		version: string
	}
	deployment: 'community' | 'enterprise' | 'cloud'
	license_key?: string
	server: {
		version: string
		build_date: string
		commit: string
	}
	client: {
		version: string
		build_date: string
		commit: string
	}
	environment: 'development' | 'production'
	technical: {
		listen: string
		db_driver: string
		session_store: string
	}
}

export interface CheckUpdateResult {
	has_update: boolean
	latest_version?: string
	download_url?: string
	release_notes?: string
}

export interface CloudRegion {
	key: string
	label: { 'zh-CN': string; 'en-US': string }
	api_url: string
	default?: boolean
}

export interface CloudServiceData {
	regions: CloudRegion[]
	region: string
	api_url: string
	api_key: string
	status: 'connected' | 'disconnected' | 'unconfigured'
}

export interface CloudServiceTestResult {
	success: boolean
	message: string
	latency_ms?: number
}

// ─── Models Page ─────────────────────────────────────────

export type ModelCapability = 'vision' | 'audio' | 'reasoning' | 'tool_calls' | 'streaming' | 'json' | 'embedding'

export interface ModelInfo {
	id: string
	name: string
	capabilities: ModelCapability[]
	enabled: boolean
}

export type ProviderType = 'openai' | 'anthropic' | 'google' | 'ollama' | 'custom'

export interface ProviderConfig {
	key: string
	name: string
	type: ProviderType
	api_url: string
	api_key: string
	models: ModelInfo[]
	enabled: boolean
	status: 'connected' | 'disconnected' | 'unconfigured'
	is_custom?: boolean
	preset_key?: string
	require_key: boolean
}

export type ModelRole = 'default' | 'vision' | 'audio' | 'embedding'

export type RoleAssignment = {
	[role in ModelRole]?: { provider: string; model: string }
}

export interface ProviderPreset {
	key: string
	name: string
	type: ProviderType
	api_url: string
	require_key: boolean
	is_cloud?: boolean
	url_editable?: boolean
	default_models: ModelInfo[]
}

export interface ModelsPageData {
	providers: ProviderConfig[]
	roles: RoleAssignment
	preset_providers: ProviderPreset[]
}

export interface ProviderTestResult {
	success: boolean
	message: string
	latency_ms?: number
}

// ─── Search & Scrape Page ────────────────────────────────

export type SearchToolType = 'web_search' | 'web_scrape'

export interface SearchProviderField {
	key: string
	label: { 'zh-CN': string; 'en-US': string }
	type: 'text' | 'password'
	default?: string
	placeholder?: string
	hint?: { 'zh-CN': string; 'en-US': string }
}

export interface SearchProviderPreset {
	key: string
	name: string
	description?: { 'zh-CN': string; 'en-US': string }
	website?: string
	tools: SearchToolType[]
	tool_labels: { 'zh-CN': string; 'en-US': string }[]
	fields: SearchProviderField[]
	is_cloud?: boolean
}

export interface SearchProviderConfig {
	preset_key: string
	enabled: boolean
	field_values: Record<string, string>
	status: 'connected' | 'disconnected' | 'unconfigured'
}

export interface SearchToolAssignment {
	web_search?: string
	web_scrape?: string
}

export interface SearchPageData {
	presets: SearchProviderPreset[]
	providers: SearchProviderConfig[]
	tool_assignment: SearchToolAssignment
}

// ─── Sandbox Page ────────────────────────────────────────

export interface ComputerNode {
	node_id: string
	display_name: string
	kind: 'host' | 'node'
	os: string
	arch: string
	cpu: number
	memory_gb: number
	docker_version?: string
	running_sandboxes: number
	online: boolean
}

export interface RegistryConfig {
	registry_url: string
	username: string
	password: string
}

export type ImageStatus = 'downloaded' | 'not_downloaded' | 'downloading'

export interface SandboxImage {
	id: string
	assistant_names: string[]
	image_name: string
	tag: string
	size_mb: number
	status: ImageStatus
	progress?: number
}

export interface SandboxPageData {
	nodes: ComputerNode[]
	registry: RegistryConfig
	images: Record<string, SandboxImage[]>
}

// ─── SMTP Page ───────────────────────────────────────────

export type SmtpEncryption = 'ssl' | 'tls' | 'none'

export interface SmtpPreset {
	key: string
	name: string
	host: string
	port: number
	encryption: SmtpEncryption
	hint?: { 'zh-CN': string; 'en-US': string }
	url?: string
}

export interface SmtpConfig {
	enabled: boolean
	preset_key: string
	host: string
	port: number
	encryption: SmtpEncryption
	username: string
	password: string
	from_name: string
	from_email: string
	status: 'connected' | 'disconnected' | 'unconfigured'
	last_sent_at?: string
}

export interface SmtpPageData {
	presets: SmtpPreset[]
	config: SmtpConfig
}
