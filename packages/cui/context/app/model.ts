import { ConfigProvider } from 'antd'
import { makeAutoObservable, reaction, toJS } from 'mobx'
import { genConfig } from 'react-nice-avatar'
import { singleton } from 'tsyringe'

import { Stack } from '@/models'
import Service from '@/services/app'
import { getYaoMetadata, YaoMetadata } from '@/services/wellknown'
import { getCurrentMenuIndexs } from '@/utils'
import { local } from '@yaoapp/storex'

import type { AvatarFullConfig } from 'react-nice-avatar'
import type { App, LocaleMessages } from '@/types'
import { OpenAPI, OpenAPIConfig, UserInfo, JobAPI, AppAPI } from '@/openapi'
import { getLocale, history } from '@umijs/max'
import { getPath } from '@/utils'

@singleton()
export default class GlobalModel {
	layout: App.Layout = 'Admin'
	theme: App.Theme = 'light'
	avatar = {} as AvatarFullConfig
	default_assistant = {} as App.AssistantSummary
	agent_uses = {} as App.AgentUses
	locale_messages = {} as LocaleMessages

	// Deprecated fields (kept for backward compatibility)
	agent_storages = {} as App.AgentStorages // Deprecated: No longer provided by API
	connectors = {} as App.Connectors // Deprecated: Use separate API endpoint instead
	app_info = {} as App.Info
	openapi = {} as OpenAPIConfig
	yao_metadata = (local.yao_metadata || null) as YaoMetadata | null // Cached well-known metadata
	kb = {} as any // TODO: add Knowledge Base Config
	user = (local.user || {}) as App.User
	userInfo = (local.userInfo || null) as UserInfo | null
	features = (local.features || {}) as Record<string, Record<string, boolean>>
	menus = (local.menus || { items: [], setting: {}, quick: [] }) as App.Menus
	menu = (local.menu || []) as Array<App.Menu>

	in_setting = (local.in_setting || false) as boolean
	current_nav: number = local.current_nav || 0
	menu_key_path = (local.menu_key_path || []) as Array<string>
	menu_selected_keys: Array<string> = (local.menu_key_path || []) as Array<string>
	loading: boolean = false
	visible_menu: boolean = true
	hide_nav: boolean = false
	visible_log_window: boolean = false

	// Sidebar state management
	sidebar_visible: boolean = (local.sidebar_visible || false) as boolean
	sidebar_maximized: boolean = (local.sidebar_maximized || false) as boolean
	sidebar_width: number = (local.sidebar_width || 400) as number

	developer = {} as App.Developer

	// Global Neo Context
	neo: App.Neo = { assistant_id: undefined, chat_id: undefined, placeholder: undefined }
	dataCache: Record<string, any> = {}

	// Jobs status
	runningJobsCount: number = 0
	private jobsCountTimer: NodeJS.Timeout | null = null

	constructor(private service: Service, public stack: Stack) {
		makeAutoObservable(this, {}, { autoBind: true })

		const theme = (local.xgen_theme || 'light') as App.Theme
		const avatar = local.avatar as AvatarFullConfig
		// const layout = (local.xgen_layout || 'Admin') as App.Layout

		this.reactions()
		this.getAppInfo()
		this.setTheme(theme)
		this.setAvatar(avatar)
		// this.setLayout(layout)
		this.setNeo()
	}

	/**
	 * Check if OpenAPI is enabled by fetching /.well-known/yao (synchronous)
	 * Caches the result for subsequent requests
	 */
	checkOpenAPIEnabled(forceRefresh = false) {
		try {
			const metadata = getYaoMetadata(forceRefresh)
			this.yao_metadata = metadata
			local.yao_metadata = metadata
		} catch (error) {
			console.warn('Failed to check OpenAPI status:', error)
			this.yao_metadata = null
			local.yao_metadata = null
		}
	}

	/**
	 * Check if OpenAPI mode is active
	 */
	get isOpenAPIEnabled(): boolean {
		return this.yao_metadata !== null && !!this.yao_metadata.openapi
	}

	/**
	 * Get the dashboard path from well-known metadata
	 */
	get dashboardPath(): string {
		return this.yao_metadata?.dashboard || '/yao'
	}

	async getAppInfo() {
		// First, check if OpenAPI is enabled via /.well-known/yao (synchronous)
		this.checkOpenAPIEnabled()

		const { res, err } = await this.service.getAppInfo<App.Info>()

		if (err) return Promise.reject()

		this.app_info = res

		// Shared onUnauthorized handler: redirect to login on 401
		const onUnauthorized = () => {
			const currentPath = getPath(history.location.pathname)

			// Skip for all auth pages (login, OAuth callback, consent, etc.)
			// These pages handle their own auth flow and 401 is expected
			if (currentPath.startsWith('/auth/')) return

			// Use history.push which respects the router base prefix
			history.push('/auth/entry')
			return true
		}

		// OpenAPI Config - use well-known metadata if available, otherwise fall back to app info
		if (this.yao_metadata?.openapi) {
			// OpenAPI is enabled via well-known
			window.$app.api_prefix = '__yao' // Widgets still use __yao prefix
			window.$app.openapi = new OpenAPI({ baseURL: this.yao_metadata.openapi, onUnauthorized })
		} else if (res.openapi) {
			// Fall back to app info
			window.$app.api_prefix = res.apiPrefix || '__yao'
			const config = typeof res.openapi === 'string' ? { baseURL: res.openapi } : res.openapi
			window.$app.openapi = new OpenAPI({ ...config, onUnauthorized })
		} else {
			// Legacy mode
			window.$app.api_prefix = res.apiPrefix || '__yao'
			window.$app.openapi = new OpenAPI({ baseURL: '/v1', onUnauthorized })
		}

		window.$app.kb = res.kb || {}

		// Storage
		local.remote_cache = res.optional?.remoteCache ?? true
		local.token_storage = res.token?.storage || 'sessionStorage'

		// Default Layout
		const layout = local.xgen_layout || res.optional?.layout || 'Admin'
		this.setLayout(layout)

		// Default Assistant
		this.setDefaultAssistant(res.agent?.default || {})

		// Agent Uses (new in API)
		this.setAgentUses(res.agent?.uses || {})

		// Legacy fields (deprecated, no longer provided by API)
		// Keep the setters for backward compatibility but don't process from API response
		// this.setAgentStorages(res.agent?.storages || {})
		// this.setConnectors(res.agent?.connectors || [])

		// Developer
		this.setDeveloper(res.developer || {})

		return Promise.resolve()
	}

	async getUserMenu(locale?: string) {
		// Use OpenAPI if available, otherwise fall back to legacy API
		if (window.$app?.openapi && this.app_info?.openapi) {
			try {
				const appAPI = new AppAPI(window.$app.openapi)
				const lang = locale || getLocale()?.toLowerCase() || 'en-us'
				const response = await appAPI.GetMenu(lang)
				if (!window.$app.openapi.IsError(response) && response.data) {
					this.setMenus(response.data)
					return Promise.resolve()
				}
				// Fall through to legacy API on error
			} catch (error) {
				console.error('Failed to get menu via OpenAPI, falling back to legacy API:', error)
			}
		}

		// Legacy API fallback
		const { res, err } = await this.service.getUserMenu<App.Menus>(locale)
		if (err) return Promise.reject()
		this.setMenus(res)
		return Promise.resolve()
	}

	setMenus(menus: App.Menus, current_nav?: number, in_setting?: boolean) {
		// Set keys for the menu items
		const setKeys = (items: Array<App.Menu>, parent_key: string, in_setting: boolean) => {
			let idxkey = 0
			items.forEach((item) => {
				const parent = parent_key != '' ? '/_parent' + parent_key : ''
				const setting = in_setting ? '/_setting' : ''
				const id = idxkey > 0 ? '/_' + idxkey : ''
				const key = `${item.path}/_menu${setting}${parent}${id}`
				item.key = key
				idxkey++
				if (item.children) setKeys(item.children, item.key, in_setting)
			})
		}

		// Default quick menu
		if (!menus.quick || menus.quick.length === 0) {
			menus.quick = [
				{
					id: 0,
					key: '/chat',
					name: 'Chat with Assistant',
					path: '/chat',
					icon: 'material-sms'
				},
				{
					id: 1,
					key: '/assistants',
					name: 'AI Assistants',
					path: '/assistants',
					icon: 'material-robot_2'
				},
				{
					id: 2,
					key: 'open:sidebar',
					name: 'Open Dashboard',
					icon: 'material-thumbnail_bar',
					path: 'open:sidebar'
				},
				{
					id: 3,
					key: '/setting',
					name: 'Settings',
					path: '/setting',
					icon: 'material-settings'
				}
			]
		}

		setKeys(menus.items, '', in_setting || false)
		setKeys(menus.setting, '', true)
		this.menus = menus
		this.menu = menus?.items || []
		local.menus = this.menus
		local.menu = this.menu
		if (current_nav !== undefined) this.setCurrentNav(current_nav)
		if (in_setting !== undefined) this.setInSetting(in_setting)
	}

	setCurrentNav(current_nav: number) {
		this.current_nav = current_nav
		local.current_nav = current_nav
	}

	setDefaultAssistant(assistant: App.AssistantSummary) {
		this.default_assistant = assistant
		local.default_assistant = assistant
	}

	setAgentStorages(storages: App.AgentStorages) {
		this.agent_storages = storages
		local.agent_storages = storages
	}

	setAgentUses(uses: App.AgentUses) {
		this.agent_uses = uses
		local.agent_uses = uses
	}

	setDeveloper(developer: App.Developer) {
		this.developer = developer
		local.developer = developer
	}

	setConnectors(connectors: Array<{ label: string; value: string }>) {
		this.connectors = {
			options: connectors,
			mapping: connectors.reduce((acc: Record<string, string>, connector) => {
				acc[connector.value] = connector.label
				return acc
			}, {})
		}
	}

	setInSetting(in_setting: boolean) {
		this.in_setting = in_setting
		local.in_setting = in_setting
	}

	setAvatar(avatar?: AvatarFullConfig) {
		this.avatar = avatar || genConfig()

		local.avatar = this.avatar
	}

	setTheme(theme: App.Theme) {
		this.theme = theme

		local.xgen_theme = theme
		document.documentElement.setAttribute('data-theme', theme)
		document.documentElement.style.colorScheme = theme

		ConfigProvider.config({
			prefixCls: 'xgen',
			theme: {
				primaryColor: theme === 'light' ? '#3371fc' : '#4580ff'
			}
		})
	}

	setLayout(layout: App.Layout) {
		this.layout = layout
		local.xgen_layout = layout
	}

	setNeo(neo?: App.Neo | null) {
		if (neo) {
			this.neo = neo
			return
		}
		this.neo = { chat_id: undefined, placeholder: undefined }
	}

	setNeoChatId(chat_id: string) {
		this.neo.chat_id = chat_id
	}

	setNeoAssistantId(assistant_id: string) {
		this.neo.assistant_id = assistant_id
	}

	setNeoPlaceholder(placeholder: App.ChatPlaceholder) {
		this.neo.placeholder = placeholder
	}

	setUserInfo(userInfo: UserInfo | null) {
		this.userInfo = userInfo
		if (userInfo) {
			// Store simplified user info in localStorage for persistence
			const persistentUserInfo = {
				user_id: userInfo.user_id,
				name: userInfo.name,
				picture: userInfo.picture,
				email: userInfo.email,
				scope: userInfo.scope,
				features: userInfo.features,
				'yao:auth_source': userInfo['yao:auth_source']
			}
			local.userInfo = persistentUserInfo
		} else {
			local.userInfo = null
		}
	}

	setFeatures(domain: string, features: Record<string, boolean>) {
		this.features[domain] = features
		local.features = this.features
	}

	clearFeatures() {
		this.features = {}
		local.features = {}
	}

	setVisibleLogWindow(visible: boolean) {
		this.visible_log_window = visible
	}

	setSidebarVisible(visible: boolean) {
		this.sidebar_visible = visible
		local.sidebar_visible = visible
	}

	setSidebarMaximized(maximized: boolean) {
		this.sidebar_maximized = maximized
		local.sidebar_maximized = maximized
	}

	setSidebarWidth(width: number) {
		this.sidebar_width = width
		local.sidebar_width = width
	}

	// Combined method for updating sidebar state
	updateSidebarState(visible?: boolean, maximized?: boolean, width?: number) {
		if (visible !== undefined) this.setSidebarVisible(visible)
		if (maximized !== undefined) this.setSidebarMaximized(maximized)
		if (width !== undefined) this.setSidebarWidth(width)
	}

	/**
	 * Check if user is logged in (simplified version from auth.ts)
	 * @returns true if user is logged in, false otherwise
	 */
	private isLoggedIn(): boolean {
		try {
			const user = local.user as App.User | undefined
			return !!(user && user.id && user.name)
		} catch (error) {
			return false
		}
	}

	async refreshJobsCount() {
		try {
			// Only refresh if user is logged in
			if (!this.isLoggedIn()) return

			if (!window.$app?.openapi) return

			const jobAPI = new JobAPI(window.$app.openapi)
			const response = await jobAPI.GetStats()

			if (!window.$app.openapi.IsError(response)) {
				this.runningJobsCount = response.data?.running_jobs || 0
			}
		} catch (error) {
			console.error('Failed to refresh jobs count:', error)
		}
	}

	// 启动定时刷新Jobs数量（每5分钟）
	startJobsCountTimer() {
		if (this.jobsCountTimer) {
			clearInterval(this.jobsCountTimer)
		}

		// 立即刷新一次
		this.refreshJobsCount()

		// 设置定时器，每5分钟刷新一次
		this.jobsCountTimer = setInterval(() => {
			this.refreshJobsCount()
		}, 5 * 60 * 1000) // 5分钟 = 300,000毫秒
	}

	// 停止定时刷新
	stopJobsCountTimer() {
		if (this.jobsCountTimer) {
			clearInterval(this.jobsCountTimer)
			this.jobsCountTimer = null
		}
	}

	updateMenuStatus(itemkey_or_pathname: string) {
		const { hit, current_nav, paths, keys } = getCurrentMenuIndexs(
			itemkey_or_pathname,
			toJS(this.in_setting ? this.menus.setting : this.menus.items)
		)

		if (!hit) return
		this.current_nav = current_nav
		this.menu_key_path = paths
		this.menu_selected_keys = keys
	}

	reactions() {
		reaction(
			() => this.in_setting,
			(v) => {
				this.menu = v ? this.menus.setting : this.menus.items

				local.in_setting = v
			}
		)
		reaction(
			() => this.menu,
			(v) => (local.menu = v)
		)
		reaction(
			() => this.current_nav,
			(v) => (local.current_nav = v)
		)
		reaction(
			() => this.menu_key_path,
			(v) => (local.menu_key_path = v)
		)
		reaction(
			() => this.menu_selected_keys,
			(v) => (local.menu_selected_keys = v)
		)
		reaction(
			() => this.sidebar_visible,
			(v) => (local.sidebar_visible = v)
		)
		reaction(
			() => this.sidebar_maximized,
			(v) => (local.sidebar_maximized = v)
		)
		reaction(
			() => this.sidebar_width,
			(v) => (local.sidebar_width = v)
		)
	}

	on() {
		window.$app.Event.on('app/getAppInfo', this.getAppInfo)
		window.$app.Event.on('app/getUserMenu', this.getUserMenu)
		window.$app.Event.on('app/updateMenuStatus', this.updateMenuStatus)
		window.$app.Event.on('app/refreshJobsCount', this.refreshJobsCount)

		// 启动Jobs数量定时刷新
		this.startJobsCountTimer()
	}

	off() {
		window.$app.Event.off('app/getAppInfo', this.getAppInfo)
		window.$app.Event.off('app/getUserMenu', this.getUserMenu)
		window.$app.Event.off('app/updateMenuStatus', this.updateMenuStatus)
		window.$app.Event.off('app/refreshJobsCount', this.refreshJobsCount)

		// 停止Jobs数量定时刷新
		this.stopJobsCountTimer()
	}
}
