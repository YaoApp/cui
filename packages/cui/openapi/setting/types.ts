export interface Promotion {
	id: string
	title: string
	desc: string
	link: string
	label: string
}

export interface SystemInfoData {
	app: {
		name: string
		short: string
		description: string
		logo: string
		version: string
	}
	deployment: string
	deployment_label: string
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
	environment: string
	environment_label: string
	technical: {
		listen: string
		db_driver: string
		session_store: string
	}
	promotions?: Promotion[]
}

export interface CheckUpdateResult {
	has_update: boolean
	current_version: string
	latest_version?: string
	download_url?: string
}

export interface CloudRegion {
	key: string
	label: Record<string, string>
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

// ─── LLM Providers ──────────────────────────────────────

export interface LLMModelInfo {
	id: string
	model?: string
	name: string
	capabilities: string[]
	enabled: boolean
	max_input_tokens?: number
	max_output_tokens?: number
	options?: Record<string, any>
}

export interface LLMProviderConfig {
	key: string
	name: string
	type: string
	api_url: string
	api_key: string
	models: LLMModelInfo[]
	enabled: boolean
	status: string
	is_custom?: boolean
	preset_key?: string
	require_key: boolean
	is_cloud?: boolean
	url_editable?: boolean
}

export interface LLMProviderPreset {
	key: string
	name: string
	locale?: string
	type: string
	api_url: string
	require_key: boolean
	is_cloud?: boolean
	url_editable?: boolean
	default_models: LLMModelInfo[]
}

export interface LLMRoleTarget {
	provider: string
	model: string
}

export type LLMRoleAssignment = Record<string, LLMRoleTarget>

export interface LLMPageData {
	providers: LLMProviderConfig[]
	roles: LLMRoleAssignment
	preset_providers: LLMProviderPreset[]
}

export interface LLMProviderTestResult {
	success: boolean
	message: string
	latency_ms?: number
}

// ─── Search & Scrape ────────────────────────────────────

export interface SearchProviderField {
	key: string
	label: Record<string, string>
	type: 'text' | 'password'
	default?: string
	placeholder?: string
	hint?: Record<string, string>
}

export interface SearchProviderPreset {
	key: string
	name: string
	description?: Record<string, string>
	website?: string
	tools: string[]
	tool_labels: Record<string, string>[]
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
	web_search?: string | null
	web_scrape?: string | null
}

export interface SearchPageData {
	presets: SearchProviderPreset[]
	providers: SearchProviderConfig[]
	tool_assignment: SearchToolAssignment
}

export interface SearchTestResult {
	success: boolean
	message: string
	latency_ms?: number
}

// ─── SMTP ───────────────────────────────────────────────

export interface SmtpPreset {
	key: string
	name: string
	host: string
	port: number
	encryption: string
	hint?: Record<string, string>
	url?: string
	default?: boolean
}

export interface SmtpConfig {
	enabled: boolean
	preset_key: string
	host: string
	port: number
	encryption: string
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

export interface SmtpTestResult {
	success: boolean
	message: string
}

// ─── MCP Servers ────────────────────────────────────────

export interface McpServerConfig {
	id: string
	name: string
	label: string
	description?: string
	transport: 'http' | 'sse'
	url: string
	authorization_token?: string
	timeout?: string
	tags?: string[]
	enabled: boolean
	status: 'connected' | 'disconnected' | 'unconfigured'
}

export interface McpPageData {
	servers: McpServerConfig[]
}

// ─── Sandbox ────────────────────────────────────────────

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

export interface SandboxRegistryConfig {
	registry_url: string
	username: string
	password: string
}

export type SandboxImageStatus = 'downloaded' | 'not_downloaded' | 'downloading' | 'error'

export interface SandboxImage {
	id: string
	assistant_names: string[]
	image_name: string
	tag: string
	size_mb: number
	status: SandboxImageStatus
	progress?: number
	error_message?: string
}

export interface SandboxPageData {
	nodes: ComputerNode[]
	registry: SandboxRegistryConfig
	images: Record<string, SandboxImage[]>
}

// ─── Setup Status ───────────────────────────────────

export interface Checkpoint {
	status: 'pass' | 'fail'
	required: boolean
	label: string
	path: string
	detail?: string
}

export interface SetupStatus {
	completed: boolean
	checkpoints: Record<string, Checkpoint>
	onboarding_completed: boolean
	banner_dismissed: boolean
}

export interface AssistantSetupStatus {
	assistant_id: string
	assistant_name: string
	ready: boolean
	checkpoints: Record<string, Checkpoint>
}

// ─── User Preference ────────────────────────────────

export interface PreferenceData {
	email_notification?: boolean
	banner_dismissed?: boolean
	onboarding_completed?: boolean
}

// ─── Agent Setting ──────────────────────────────────

export interface SecretEntry {
	value?: string
	label?: string
	description?: string
	required?: boolean
	multiline?: boolean
	has_value?: boolean
	predefined?: boolean
}

export interface UserAgentSetting {
	runners?: string[]
	image?: string
	secrets?: Record<string, SecretEntry>
	options?: Record<string, any>
}

export interface AgentSkill {
	name: string
	description?: string
}

export interface AgentSettingPageData {
	setting: UserAgentSetting
	sandbox_config?: {
		runner?: {
			supports?: string[]
			name?: string
		}
	}
	supported_runners?: string[]
}

// ---------------------------------------------------------------------------
// API Keys
// ---------------------------------------------------------------------------

export interface APIKeyResponse {
	id: string
	name: string
	key_prefix: string
	status: string
	expires_at?: string
	created_at: string
	last_used?: string
}

export interface APIKeyCreateResponse {
	id: string
	name: string
	key: string
	key_prefix: string
	status: string
	expires_at?: string
	created_at: string
}
