import type Model from './model'
import type { App } from '@/types'

export type UserType = 'admin' | 'user'

export interface Captcha {
	id: string
	content: string
}

export interface FormValues {
	mobile: string
	password: string
	code: string
	remember_me?: boolean
	locale?: string
}

export interface ReqLogin {
	email?: string
	mobile?: string
	is?: string
	sid: string
	password: string
	captcha: {
		id: string
		code: string
	}
}

export interface ResLogin {
	expires_at: number
	menus: { items: Array<App.Menu>; setting: Array<App.Menu>; quick?: Array<App.Menu> }
	token: string
	user: App.User
	type: UserType
	entry?: string
	sid?: string
	logout_redirect?: string | boolean
	studio?: {
		expires_at: number
		port: number
		token: string
	}
}

// New types for enhanced login page
export interface ThirdPartyProvider {
	id: string
	title: string
	logo?: string
	color: string
	text_color?: string
	response_mode?: string
}

export interface LoginConfig {
	username: {
		label: string
		placeholder: string
		type: 'email' | 'mobile' | 'both'
		required: boolean
	}
	password: {
		label: string
		placeholder: string
		minLength: number
		required: boolean
	}
	captcha: {
		enabled: boolean
		type: 'image' | 'text' | 'cloudflare'
		endpoint?: string
		siteKey?: string
	}
	thirdPartyProviders: ThirdPartyProvider[]
	page: {
		title: string
		subtitle?: string
		backgroundImage?: string
		logo?: string
		primaryColor?: string
	}
	api: {
		login: string
		config: string
		thirdParty: string
	}
}

export interface ApiResponse<T = any> {
	success: boolean
	data?: T
	message?: string
	errors?: Record<string, string[]>
}

export interface IPropsCommon {
	type: UserType
	x: Model
}

export interface IPropsForm {
	code: Captcha['content']
	loading: boolean
	getCaptcha: () => void
	onFinish: (data: FormValues) => void
}

export interface IPropsThirdPartyLogin {
	items: App.Role['thirdPartyLogin']
}

// New prop interfaces for enhanced components
export interface IPropsResponsiveLogin {
	config?: LoginConfig
	onLogin: (data: FormValues) => void
	loading?: boolean
}

export interface IPropsThemeLanguageSwitcher {
	theme: 'light' | 'dark'
	language: string
	onThemeChange: (theme: 'light' | 'dark') => void
	onLanguageChange: (language: string) => void
}

export interface IPropsEnhancedThirdPartyLogin {
	providers: ThirdPartyProvider[]
	onProviderClick: (provider: ThirdPartyProvider) => void
	loading?: boolean
}
