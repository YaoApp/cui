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
