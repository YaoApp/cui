// Mock data for settings page - remove when API is ready

export interface User {
	id: string
	name: string
	email: string
	avatar?: string
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
	group: 'profile' | 'plan' | 'connectors' | 'mcp' | 'security' | 'support'
	order: number
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

// Mock menu items
export const mockMenuItems: MenuItem[] = [
	{
		id: '1',
		key: 'profile',
		name: { 'zh-CN': '个人资料', 'en-US': 'Profile' },
		icon: 'material-person',
		path: '/settings/profile',
		group: 'profile',
		order: 1
	},
	{
		id: '2',
		key: 'api-sdk',
		name: { 'zh-CN': 'API Keys', 'en-US': 'API Keys' },
		icon: 'material-vpn_key',
		path: '/settings/api-sdk',
		group: 'profile',
		order: 2
	},
	{
		id: '2a',
		key: 'team',
		name: { 'zh-CN': '团队', 'en-US': 'Team' },
		icon: 'material-group',
		path: '/settings/team',
		group: 'profile',
		order: 2.1
	},
	{
		id: '2b',
		key: 'advanced',
		name: { 'zh-CN': '高级', 'en-US': 'Advanced' },
		icon: 'material-settings',
		path: '/settings/advanced',
		group: 'profile',
		order: 2.2
	},
	// Plan 分组
	{
		id: '3',
		key: 'plans',
		name: { 'zh-CN': '套餐与价格', 'en-US': 'Plans & Pricing' },
		icon: 'material-workspace_premium',
		path: '/settings/plans',
		group: 'plan',
		order: 3
	},
	{
		id: '4',
		key: 'subscription',
		name: { 'zh-CN': '订阅管理', 'en-US': 'Subscription' },
		icon: 'material-card_membership',
		path: '/settings/subscription',
		group: 'plan',
		order: 4
	},
	{
		id: '5',
		key: 'usage',
		name: { 'zh-CN': '使用统计', 'en-US': 'Usage' },
		icon: 'material-analytics',
		path: '/settings/usage',
		group: 'plan',
		order: 5
	},
	{
		id: '6',
		key: 'billing',
		name: { 'zh-CN': '付款和发票', 'en-US': 'Payment & Invoices' },
		icon: 'material-receipt',
		path: '/settings/billing',
		group: 'plan',
		order: 6
	},
	// Connectors 分组
	{
		id: '7',
		key: 'connectors',
		name: { 'zh-CN': '连接器', 'en-US': 'Connectors' },
		icon: 'material-cable',
		path: '/settings/connectors',
		group: 'connectors',
		order: 7
	},
	// MCP 分组
	{
		id: '8',
		key: 'mcp-servers',
		name: { 'zh-CN': 'MCP 服务器', 'en-US': 'MCP Servers' },
		icon: 'material-dns',
		path: '/settings/mcp-servers',
		group: 'mcp',
		order: 8
	},
	// Security 分组
	{
		id: '9',
		key: 'security',
		name: { 'zh-CN': '账号安全', 'en-US': 'Account Security' },
		icon: 'material-security',
		path: '/settings/security',
		group: 'security',
		order: 9
	},
	{
		id: '10',
		key: 'privacy',
		name: { 'zh-CN': '隐私设置', 'en-US': 'Privacy' },
		icon: 'material-privacy_tip',
		path: '/settings/privacy',
		group: 'security',
		order: 10
	},
	{
		id: '11',
		key: 'audit-logs',
		name: { 'zh-CN': '审计日志', 'en-US': 'Audit Logs' },
		icon: 'material-history',
		path: '/settings/audit-logs',
		group: 'security',
		order: 11
	},
	// Support 分组
	{
		id: '12',
		key: 'docs',
		name: { 'zh-CN': '文档', 'en-US': 'Documentation' },
		icon: 'material-description',
		path: '/settings/docs',
		group: 'support',
		order: 12
	},
	{
		id: '13',
		key: 'contact',
		name: { 'zh-CN': '联系', 'en-US': 'Contact' },
		icon: 'material-contact_support',
		path: '/settings/contact',
		group: 'support',
		order: 13
	}
]

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

	getMenuItems: (): Promise<MenuItem[]> => {
		return new Promise((resolve) => {
			setTimeout(() => resolve(mockMenuItems), 200)
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
