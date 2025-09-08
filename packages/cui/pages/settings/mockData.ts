// Mock data for settings page - remove when API is ready

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

export interface MenuItem {
	id: string
	key: string
	name: {
		'zh-CN': string
		'en-US': string
	}
	icon: string
	path: string
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

export interface UsageStats {
	current_month: {
		requests: number
		requests_limit: number
		cost: number
	}
	last_30_days: Array<{
		date: string
		requests: number
		cost: number
	}>
}

export interface Invoice {
	id: string
	date: string
	amount: number
	status: 'paid' | 'pending' | 'failed'
	download_url?: string
}

// Mock menu groups with items
export const mockMenuGroups: MenuGroup[] = [
	{
		key: 'profile',
		name: { 'zh-CN': '账户设置', 'en-US': 'Account' },
		order: 1,
		items: [
			{
				id: '1',
				key: 'profile',
				name: { 'zh-CN': '个人资料', 'en-US': 'Profile' },
				icon: 'material-person',
				path: '/settings/profile'
			},
			{
				id: '2',
				key: 'api-keys',
				name: { 'zh-CN': 'API Keys', 'en-US': 'API Keys' },
				icon: 'material-vpn_key',
				path: '/settings/api-keys'
			},
			{
				id: '2a',
				key: 'team',
				name: { 'zh-CN': '团队', 'en-US': 'Team' },
				icon: 'material-group',
				path: '/settings/team'
			},
			{
				id: '2b',
				key: 'advanced',
				name: { 'zh-CN': '偏好设置', 'en-US': 'Preferences' },
				icon: 'material-settings',
				path: '/settings/advanced'
			}
		]
	},
	{
		key: 'plan',
		name: { 'zh-CN': '套餐计划', 'en-US': 'Plan' },
		order: 2,
		items: [
			{
				id: '3',
				key: 'plans',
				name: { 'zh-CN': '套餐与价格', 'en-US': 'Plans & Pricing' },
				icon: 'material-workspace_premium',
				path: '/settings/plans'
			},
			{
				id: '4',
				key: 'subscription',
				name: { 'zh-CN': '订阅管理', 'en-US': 'Subscription' },
				icon: 'material-card_membership',
				path: '/settings/subscription'
			},
			{
				id: '5',
				key: 'usage',
				name: { 'zh-CN': '使用统计', 'en-US': 'Usage' },
				icon: 'material-analytics',
				path: '/settings/usage'
			},
			{
				id: '6',
				key: 'billing',
				name: { 'zh-CN': '账单发票', 'en-US': 'Billing & Invoices' },
				icon: 'material-receipt',
				path: '/settings/billing'
			}
		]
	},
	{
		key: 'marketing',
		name: { 'zh-CN': '邀请奖励', 'en-US': 'Referrals' },
		order: 3,
		items: [
			{
				id: '7',
				key: 'referral-codes',
				name: { 'zh-CN': '邀请码', 'en-US': 'Invite Code' },
				icon: 'material-qr_code',
				path: '/settings/referral-codes'
			},
			{
				id: '8',
				key: 'referral-list',
				name: { 'zh-CN': '邀请记录', 'en-US': 'Commissions' },
				icon: 'material-people_outline',
				path: '/settings/referral-list'
			}
		]
	},
	{
		key: 'integrations',
		name: { 'zh-CN': '第三方服务', 'en-US': 'Integrations' },
		order: 4,
		items: [
			{
				id: '9',
				key: 'llm-providers',
				name: { 'zh-CN': 'LLM 提供商', 'en-US': 'LLM Providers' },
				icon: 'material-psychology',
				path: '/settings/llm-providers'
			},
			{
				id: '10',
				key: 'stripe-integration',
				name: { 'zh-CN': 'Stripe 集成', 'en-US': 'Stripe Integration' },
				icon: 'material-payment',
				path: '/settings/stripe-integration'
			},
			{
				id: '11',
				key: 'mcp-servers',
				name: { 'zh-CN': 'MCP 服务器', 'en-US': 'MCP Servers' },
				icon: 'material-dns',
				path: '/settings/mcp-servers'
			}
		]
	},
	{
		key: 'security',
		name: { 'zh-CN': '安全设置', 'en-US': 'Security' },
		order: 5,
		items: [
			{
				id: '12',
				key: 'security',
				name: { 'zh-CN': '账号安全', 'en-US': 'Account Security' },
				icon: 'material-security',
				path: '/settings/security'
			},
			{
				id: '13',
				key: 'privacy',
				name: { 'zh-CN': '隐私设置', 'en-US': 'Privacy' },
				icon: 'material-privacy_tip',
				path: '/settings/privacy'
			},
			{
				id: '14',
				key: 'audit-logs',
				name: { 'zh-CN': '审计日志', 'en-US': 'Audit Logs' },
				icon: 'material-history',
				path: '/settings/audit-logs'
			}
		]
	},
	{
		key: 'support',
		name: { 'zh-CN': '帮助支持', 'en-US': 'Support' },
		order: 6,
		items: [
			{
				id: '15',
				key: 'docs',
				name: { 'zh-CN': '文档', 'en-US': 'Documentation' },
				icon: 'material-description',
				path: '/settings/docs'
			},
			{
				id: '16',
				key: 'contact',
				name: { 'zh-CN': '联系支持', 'en-US': 'Contact Support' },
				icon: 'material-contact_support',
				path: '/settings/contact'
			}
		]
	}
]

// Mock user data
export const mockUser: User = {
	id: '1',
	name: 'John Doe',
	email: 'john.doe@example.com',
	avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
	role: 'Administrator',
	plan: 'Pro Plan',
	created_at: '2024-01-01T00:00:00Z',
	updated_at: '2024-01-15T10:30:00Z'
}

// Mock API keys
export const mockApiKeys: ApiKey[] = [
	{
		id: '1',
		name: 'Production Key',
		key: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
		created_at: '2024-01-01T00:00:00Z',
		last_used_at: '2024-01-15T10:30:00Z',
		status: 'active'
	},
	{
		id: '2',
		name: 'Development Key',
		key: 'sk-yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy',
		created_at: '2024-01-10T00:00:00Z',
		status: 'active'
	},
	{
		id: '3',
		name: 'Staging Environment Key',
		key: 'sk-zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
		created_at: '2024-01-05T00:00:00Z',
		last_used_at: '2024-01-14T08:15:00Z',
		status: 'active'
	},
	{
		id: '4',
		name: 'Testing API Key',
		key: 'sk-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
		created_at: '2024-01-12T00:00:00Z',
		status: 'active'
	},
	{
		id: '5',
		name: 'Integration Key',
		key: 'sk-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
		created_at: '2024-01-08T00:00:00Z',
		last_used_at: '2024-01-13T16:45:00Z',
		status: 'active'
	},
	{
		id: '6',
		name: 'Analytics Key',
		key: 'sk-ccccccccccccccccccccccccccccccccc',
		created_at: '2024-01-03T00:00:00Z',
		last_used_at: '2024-01-12T12:30:00Z',
		status: 'disabled'
	},
	{
		id: '7',
		name: 'Mobile App Key',
		key: 'sk-ddddddddddddddddddddddddddddddddd',
		created_at: '2024-01-07T00:00:00Z',
		status: 'active'
	},
	{
		id: '8',
		name: 'Webhook Integration',
		key: 'sk-eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
		created_at: '2024-01-11T00:00:00Z',
		last_used_at: '2024-01-15T09:20:00Z',
		status: 'active'
	}
]

// Mock subscription data
export const mockSubscription: Subscription = {
	id: '1',
	plan: 'Professional',
	status: 'active',
	start_date: '2024-01-01T00:00:00Z',
	end_date: '2024-02-01T00:00:00Z',
	requests_included: 10000,
	requests_used: 2500,
	monthly_cost: 29.99
}

// Mock usage statistics
export const mockUsageStats: UsageStats = {
	current_month: {
		requests: 2500,
		requests_limit: 10000,
		cost: 29.99
	},
	last_30_days: Array.from({ length: 30 }, (_, i) => ({
		date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
		requests: Math.floor(Math.random() * 200) + 50,
		cost: Number((Math.random() * 5).toFixed(2))
	}))
}

// Mock invoices
export const mockInvoices: Invoice[] = [
	{
		id: '1',
		date: '2024-01-01T00:00:00Z',
		amount: 29.99,
		status: 'paid',
		download_url: '#'
	},
	{
		id: '2',
		date: '2023-12-01T00:00:00Z',
		amount: 29.99,
		status: 'paid',
		download_url: '#'
	},
	{
		id: '3',
		date: '2023-11-01T00:00:00Z',
		amount: 29.99,
		status: 'paid',
		download_url: '#'
	}
]

// Mock API function to simulate data fetching
export const mockApi = {
	getUser: (): Promise<User> => {
		return new Promise((resolve) => {
			setTimeout(() => resolve(mockUser), 300)
		})
	},

	getMenuGroups: (): Promise<MenuGroup[]> => {
		return new Promise((resolve) => {
			setTimeout(() => resolve(mockMenuGroups), 200)
		})
	},

	getApiKeys: (): Promise<ApiKey[]> => {
		return new Promise((resolve) => {
			setTimeout(() => resolve(mockApiKeys), 300)
		})
	},

	getSubscription: (): Promise<Subscription> => {
		return new Promise((resolve) => {
			setTimeout(() => resolve(mockSubscription), 300)
		})
	},

	getUsageStats: (): Promise<UsageStats> => {
		return new Promise((resolve) => {
			setTimeout(() => resolve(mockUsageStats), 400)
		})
	},

	getInvoices: (): Promise<Invoice[]> => {
		return new Promise((resolve) => {
			setTimeout(() => resolve(mockInvoices), 300)
		})
	}
}
