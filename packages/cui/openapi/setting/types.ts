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
	name: string
	capabilities: string[]
	enabled: boolean
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
