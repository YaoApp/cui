// Mock data for settings page - remove when API is ready
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

// 安全相关数据类型
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
	phone?: string // for SMS
	secret?: string // for TOTP (base32 encoded)
	backup_codes?: string[] // backup codes for TOTP
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

export type PlanType = 'free' | 'pro' | 'enterprise' | 'selfhosting'

// 点数包类型
export type CreditPackageType = 'purchased' | 'reward' | 'referral' | 'promotion' | 'gift'

// 充值记录相关类型
export type TopUpMethod = 'stripe' | 'card_code' | 'bank_transfer' | 'alipay' | 'wechat'
export type TopUpStatus = 'completed' | 'pending' | 'failed' | 'cancelled'

export interface TopUpRecord {
	id: string
	amount: number // 充值金额（美元）
	credits: number // 获得点数
	method: TopUpMethod
	status: TopUpStatus
	expiry_date: string // 点数有效期
	created_at: string
	completed_at?: string
	transaction_id?: string
	card_code?: string // 如果是点卡充值，记录卡号（脱敏）
	notes?: string
}

export interface BalanceInfo {
	total_credits: number // 总点数余额
	monthly_credits: {
		used: number
		limit: number
		reset_date: string
	}
	extra_credits: CreditPackage[] // 额外点数包
	pending_credits: number // 待到账点数
}

// 单个点数包
export interface CreditPackage {
	id: string
	type: CreditPackageType
	name: {
		'zh-CN': string
		'en-US': string
	}
	original_amount: number // 原始数量
	used: number // 已使用
	balance: number // 剩余
	expiry_date: string // 有效期
	created_at: string // 获得时间
	description?: {
		'zh-CN': string
		'en-US': string
	}
}

export interface CreditsInfo {
	monthly: {
		used: number
		limit: number
		reset_date: string // Next reset date
	}
	packages: CreditPackage[] // 额外点数包列表
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
	next_billing_date?: string // Next billing/reset date
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

// Billing 相关类型定义
export interface PaymentMethod {
	id: string
	type: 'card' | 'bank_account'
	brand?: string // visa, mastercard, amex, etc.
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
	amount: number // 金额（分为单位）
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
	amount: number // 金额（分为单位）
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

// Audit log types based on audit.mod.yao
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

// Generate internationalized preferences schema
const generatePreferencesSchema = (locale: string = 'en-US'): ProviderSchema => {
	const isZhCN = locale === 'zh-CN'

	return {
		id: 'preferences',
		title: isZhCN ? '偏好设置' : 'Preferences',
		description: isZhCN
			? '管理您的个人偏好和界面设置'
			: 'Manage your personal preferences and interface settings',
		properties: {
			language: {
				type: 'string',
				title: isZhCN ? '语言' : 'Language',
				description: isZhCN ? '选择界面显示语言' : 'Select your preferred language for the interface',
				component: 'Select',
				enum: [
					{
						label: isZhCN ? '跟随浏览器' : 'Follow Browser',
						value: 'auto',
						description: isZhCN ? '使用浏览器语言偏好' : 'Use browser language preference'
					},
					{
						label: '中文',
						value: 'zh-CN',
						description: '简体中文'
					},
					{
						label: 'English',
						value: 'en-US',
						description: 'English (United States)'
					}
				],
				default: 'auto',
				required: true,
				order: 1
			},
			theme: {
				type: 'string',
				title: isZhCN ? '主题' : 'Theme',
				description: isZhCN ? '选择您喜欢的颜色主题' : 'Choose your preferred color theme',
				component: 'RadioGroup',
				enum: [
					{
						label: isZhCN ? '浅色' : 'Light',
						value: 'light',
						description: isZhCN ? '明亮的浅色主题' : 'Light theme with bright colors'
					},
					{
						label: isZhCN ? '深色' : 'Dark',
						value: 'dark',
						description: isZhCN ? '柔和的深色主题' : 'Dark theme with muted colors'
					},
					{
						label: isZhCN ? '跟随系统' : 'Follow System',
						value: 'auto',
						description: isZhCN ? '跟随系统主题偏好' : 'Follow system theme preference'
					}
				],
				default: 'auto',
				required: true,
				order: 2
			},
			emailSubscription: {
				type: 'boolean',
				title: isZhCN ? '邮件订阅' : 'Email Subscription',
				description: isZhCN
					? '接收产品更新和新闻通讯邮件'
					: 'Receive product updates and newsletters via email',
				component: 'Switch',
				default: true,
				required: false,
				order: 3
			}
		},
		required: ['language', 'theme']
	}
}

// Generate internationalized privacy schema
const generatePrivacySchema = (locale: string = 'en-US'): ProviderSchema => {
	const isZhCN = locale === 'zh-CN'

	return {
		id: 'privacy',
		title: isZhCN ? '隐私设置' : 'Privacy Settings',
		description: isZhCN
			? '管理您的隐私偏好和数据使用设置'
			: 'Manage your privacy preferences and data usage settings',
		properties: {
			policyNotifications: {
				type: 'boolean',
				title: isZhCN ? '政策变更通知' : 'Policy Change Notifications',
				description: isZhCN
					? '接收隐私政策变更、安全漏洞、共享政策变动等重要通知'
					: 'Receive important notifications about privacy policy changes, security vulnerabilities, and sharing policy updates',
				component: 'Switch',
				default: true,
				required: false,
				order: 1
			},
			dataCollection: {
				type: 'boolean',
				title: isZhCN ? '数据收集许可' : 'Data Collection Permission',
				description: isZhCN
					? '允许收集使用行为、错误日志等数据以改善产品体验'
					: 'Allow collection of usage behavior, error logs, and other data to improve product experience',
				component: 'Switch',
				default: true,
				required: false,
				order: 2
			},
			thirdPartySharing: {
				type: 'boolean',
				title: isZhCN ? '第三方数据共享' : 'Third-Party Data Sharing',
				description: isZhCN
					? '同意把部分数据分享给第三方（例如集成服务、合作伙伴等）'
					: 'Consent to share some data with third parties (such as integration services, partners, etc.)',
				component: 'Switch',
				default: true,
				required: false,
				order: 3
			}
		},
		required: []
	}
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
			// {
			// 	id: '1a',
			// 	key: 'balance',
			// 	name: { 'zh-CN': '账户余额', 'en-US': 'Balance' },
			// 	icon: 'material-account_balance_wallet',
			// 	path: '/settings/balance'
			// },
		{
			id: '2a',
			key: 'team',
			name: { 'zh-CN': '团队管理', 'en-US': 'Team' },
			icon: 'material-group',
			path: '/settings/team'
		}
			// {
			// 	id: '2b',
			// 	key: 'preferences',
			// 	name: { 'zh-CN': '偏好设置', 'en-US': 'Preferences' },
			// 	icon: 'material-settings',
			// 	path: '/settings/preferences'
			// }
		]
	},
	// {
	// 	key: 'plan',
	// 	name: { 'zh-CN': '套餐计划', 'en-US': 'Plan' },
	// 	order: 2,
	// 	items: [
	// 		{
	// 			id: '3',
	// 			key: 'plans',
	// 			name: { 'zh-CN': '套餐与价格', 'en-US': 'Plans & Pricing' },
	// 			icon: 'material-workspace_premium',
	// 			path: '/settings/plans'
	// 		},
	// 		{
	// 			id: '4',
	// 			key: 'subscription',
	// 			name: { 'zh-CN': '订阅管理', 'en-US': 'Subscription' },
	// 			icon: 'material-card_membership',
	// 			path: '/settings/subscription'
	// 		},
	// 		{
	// 			id: '5',
	// 			key: 'usage',
	// 			name: { 'zh-CN': '使用统计', 'en-US': 'Usage' },
	// 			icon: 'material-analytics',
	// 			path: '/settings/usage'
	// 		},
	// 		{
	// 			id: '6',
	// 			key: 'billing',
	// 			name: { 'zh-CN': '账单发票', 'en-US': 'Billing & Invoices' },
	// 			icon: 'material-receipt',
	// 			path: '/settings/billing'
	// 		}
	// 	]
	// },
	// {
	// 	key: 'marketing',
	// 	name: { 'zh-CN': '邀请奖励', 'en-US': 'Referrals' },
	// 	order: 3,
	// 	items: [
	// 		{
	// 			id: '7',
	// 			key: 'invite',
	// 			name: { 'zh-CN': '邀请码', 'en-US': 'Invite Code' },
	// 			icon: 'material-qr_code',
	// 			path: '/settings/invite'
	// 		},
	// 		{
	// 			id: '8',
	// 			key: 'commissions',
	// 			name: { 'zh-CN': '邀请记录', 'en-US': 'Commissions' },
	// 			icon: 'material-people_outline',
	// 			path: '/settings/commissions'
	// 		}
	// 	]
	// },
	// {
	// 	key: 'integrations',
	// 	name: { 'zh-CN': '第三方服务', 'en-US': 'Integrations' },
	// 	order: 4,
	// 	items: [
	// 		{
	// 			id: '9',
	// 			key: 'llm-providers',
	// 			name: { 'zh-CN': 'LLM 提供商', 'en-US': 'LLM Providers' },
	// 			icon: 'material-psychology',
	// 			path: '/settings/llm-providers'
	// 		},
	// 		{
	// 			id: '10',
	// 			key: 'mcp-servers',
	// 			name: { 'zh-CN': 'MCP 服务器', 'en-US': 'MCP Servers' },
	// 			icon: 'material-dns',
	// 			path: '/settings/mcp-servers'
	// 		},
	// 		{
	// 			id: '11',
	// 			key: 'stripe',
	// 			name: { 'zh-CN': 'Stripe', 'en-US': 'Stripe' },
	// 			icon: 'material-payment',
	// 			path: '/settings/stripe'
	// 		}
	// 	]
	// },
	// {
	// 	key: 'security',
	// 	name: { 'zh-CN': '安全设置', 'en-US': 'Security' },
	// 	order: 5,
	// 	items: [
	// 		{
	// 			id: '12',
	// 			key: 'security',
	// 			name: { 'zh-CN': '账号安全', 'en-US': 'Account Security' },
	// 			icon: 'material-security',
	// 			path: '/settings/security'
	// 		},
	// 		{
	// 			id: '13',
	// 			key: 'privacy',
	// 			name: { 'zh-CN': '隐私设置', 'en-US': 'Privacy' },
	// 			icon: 'material-privacy_tip',
	// 			path: '/settings/privacy'
	// 		},
	// 		{
	// 			id: '14',
	// 			key: 'audit-logs',
	// 			name: { 'zh-CN': '审计日志', 'en-US': 'Audit Logs' },
	// 			icon: 'material-history',
	// 			path: '/settings/audit-logs'
	// 		}
	// 	]
	// },
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
				path: 'https://yaoapps.com/docs'
			},
			{
				id: '16',
				key: 'discord',
				name: { 'zh-CN': '加入 Discord', 'en-US': 'Join Discord' },
				icon: 'material-forum',
				path: 'https://discord.gg/BkMR2NUsjU'
			},
			{
				id: '17',
				key: 'twitter',
				name: { 'zh-CN': '关注 X', 'en-US': 'Follow on X' },
				icon: 'material-tag',
				path: 'https://x.com/YaoApp'
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
		cost: 29.99,
		monthly_quota_used: 1800,
		monthly_quota_limit: 2000,
		extra_credits_used: 700,
		tokens_used: 125000
	},
	last_30_days: Array.from({ length: 30 }, (_, i) => ({
		date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
		requests: Math.floor(Math.random() * 200) + 50,
		cost: Number((Math.random() * 5).toFixed(2))
	}))
}

// Mock team data
export const mockTeam: Team = {
	id: '1',
	name: 'Yao Team',
	description: '我们的开发团队，专注于构建优秀的产品',
	avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=YT&backgroundColor=4f46e5&textColor=ffffff',
	created_at: '2024-01-01T00:00:00Z',
	updated_at: '2024-01-15T10:30:00Z',
	member_count: 12,
	invite_link: 'https://app.example.com/team/invite/abc123def456',
	invite_link_enabled: true
}

// Mock team members
export const mockTeamMembers: TeamMember[] = [
	{
		id: '1',
		name: 'Alex Chen',
		email: 'alex@example.com',
		avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4',
		role: 'owner',
		status: 'active',
		joined_at: '2024-01-01T00:00:00Z',
		last_active: '2024-01-20T14:30:00Z'
	},
	{
		id: '2',
		name: 'Sarah Wilson',
		email: 'sarah@example.com',
		avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=fde68a',
		role: 'admin',
		status: 'active',
		joined_at: '2024-01-02T09:15:00Z',
		last_active: '2024-01-20T11:45:00Z'
	},
	{
		id: '3',
		name: 'David Kim',
		email: 'david@example.com',
		avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David&backgroundColor=c7d2fe',
		role: 'admin',
		status: 'active',
		joined_at: '2024-01-05T16:20:00Z',
		last_active: '2024-01-19T18:30:00Z'
	},
	{
		id: '4',
		name: 'Emily Rodriguez',
		email: 'emily@example.com',
		avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily&backgroundColor=fecaca',
		role: 'member',
		status: 'active',
		joined_at: '2024-01-10T10:45:00Z',
		last_active: '2024-01-20T09:15:00Z'
	},
	{
		id: '5',
		name: 'James Thompson',
		email: 'james@example.com',
		role: 'member',
		status: 'active',
		joined_at: '2024-01-18T14:00:00Z',
		last_active: '2024-01-19T11:20:00Z'
	},
	{
		id: '6',
		name: 'Maria Garcia',
		email: 'maria@example.com',
		avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria&backgroundColor=d8b4fe',
		role: 'member',
		status: 'active',
		joined_at: '2024-01-12T08:30:00Z',
		last_active: '2024-01-20T15:45:00Z'
	},
	{
		id: '7',
		name: 'Robert Brown',
		email: 'robert@example.com',
		role: 'member',
		status: 'pending',
		joined_at: '2024-01-19T12:15:00Z'
	},
	{
		id: '8',
		name: 'Jennifer Lee',
		email: 'jennifer@example.com',
		avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jennifer&backgroundColor=bbf7d0',
		role: 'member',
		status: 'active',
		joined_at: '2024-01-08T14:20:00Z',
		last_active: '2024-01-20T10:30:00Z'
	},
	{
		id: '9',
		name: 'Michael Johnson',
		email: 'michael@example.com',
		avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael&backgroundColor=fed7aa',
		role: 'admin',
		status: 'active',
		joined_at: '2024-01-06T11:30:00Z',
		last_active: '2024-01-20T16:45:00Z'
	},
	{
		id: '10',
		name: 'Lisa Anderson',
		email: 'lisa@example.com',
		role: 'member',
		status: 'active',
		joined_at: '2024-01-14T09:20:00Z',
		last_active: '2024-01-19T14:15:00Z'
	},
	{
		id: '11',
		name: 'Tom Wilson',
		email: 'tom@example.com',
		avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tom&backgroundColor=fef3c7',
		role: 'member',
		status: 'pending',
		joined_at: '2024-01-20T08:45:00Z'
	},
	{
		id: '12',
		name: 'Anna Martinez',
		email: 'anna@example.com',
		avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna&backgroundColor=e0e7ff',
		role: 'member',
		status: 'active',
		joined_at: '2024-01-11T15:10:00Z',
		last_active: '2024-01-20T12:20:00Z'
	}
]

// Mock team invitations
export const mockTeamInvitations: TeamInvitation[] = [
	{
		id: '1',
		email: 'alice.johnson@example.com',
		role: 'member',
		invited_by: 'Alex Chen',
		invited_at: '2024-01-19T10:30:00Z',
		expires_at: '2024-01-26T10:30:00Z',
		status: 'pending'
	},
	{
		id: '2',
		email: 'bob.smith@example.com',
		role: 'admin',
		invited_by: 'Sarah Wilson',
		invited_at: '2024-01-18T15:20:00Z',
		expires_at: '2024-01-25T15:20:00Z',
		status: 'pending'
	},
	{
		id: '3',
		email: 'carol.davis@example.com',
		role: 'member',
		invited_by: 'David Kim',
		invited_at: '2024-01-20T09:15:00Z',
		expires_at: '2024-01-27T09:15:00Z',
		status: 'pending'
	},
	{
		id: '4',
		email: 'peter.zhang@example.com',
		role: 'admin',
		invited_by: 'Alex Chen',
		invited_at: '2024-01-20T14:30:00Z',
		expires_at: '2024-01-27T14:30:00Z',
		status: 'pending'
	},
	{
		id: '5',
		email: 'linda.wang@example.com',
		role: 'member',
		invited_by: 'Sarah Wilson',
		invited_at: '2024-01-20T16:45:00Z',
		expires_at: '2024-01-27T16:45:00Z',
		status: 'pending'
	}
]

// Mock preferences data - with default "auto" language preference
const generateMockPreferencesData = (): PreferencesData => ({
	language: 'auto', // Default to "Follow Browser" option
	theme: 'auto',
	emailSubscription: true
})

// Mock privacy data - with default privacy settings (all enabled by default)
const generateMockPrivacyData = (): PrivacyData => ({
	policyNotifications: true, // Default to allow policy notifications
	dataCollection: true, // Default to allow data collection
	thirdPartySharing: true // Default to allow third-party sharing
})

// Generate mock audit logs data
const generateMockAuditLogs = (page: number = 1, size: number = 20): AuditLogResponse => {
	const operations = ['login', 'logout', 'create', 'update', 'delete', 'view', 'export', 'import', 'backup']
	const categories: AuditLog['category'][] = ['authentication', 'authorization', 'data', 'system']
	const severities: AuditLog['severity'][] = ['low', 'medium', 'high', 'critical']
	const sources = ['UI', 'API', 'CLI', 'system']
	const applications = ['CUI', 'YAO', 'Admin Panel', 'API Gateway']
	const resourceTypes = ['user', 'file', 'table', 'config', 'api', 'model']

	const userAgents = [
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
		'YAO-CLI/1.0.0',
		'API-Client/2.1.0'
	]

	const users = [
		{ id: '1', name: 'John Doe' },
		{ id: '2', name: 'Jane Smith' },
		{ id: '3', name: 'Admin User' },
		{ id: '4', name: 'System' }
	]

	const total = 1247 // Mock total count
	const records: AuditLog[] = []

	for (let i = 0; i < size; i++) {
		const recordIndex = (page - 1) * size + i + 1
		if (recordIndex > total) break

		const user = users[Math.floor(Math.random() * users.length)]
		const operation = operations[Math.floor(Math.random() * operations.length)]
		const category = categories[Math.floor(Math.random() * categories.length)]
		const severity = severities[Math.floor(Math.random() * severities.length)]
		const success = Math.random() > 0.1 // 90% success rate
		const source = sources[Math.floor(Math.random() * sources.length)]
		const application = applications[Math.floor(Math.random() * applications.length)]
		const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)]

		// Generate timestamp (recent logs)
		const daysAgo = Math.floor(Math.random() * 30)
		const hoursAgo = Math.floor(Math.random() * 24)
		const minutesAgo = Math.floor(Math.random() * 60)
		const timestamp = new Date(
			Date.now() - daysAgo * 24 * 60 * 60 * 1000 - hoursAgo * 60 * 60 * 1000 - minutesAgo * 60 * 1000
		)

		const record: AuditLog = {
			id: `audit_${recordIndex.toString().padStart(4, '0')}`,
			event_id: `evt_${Math.random().toString(36).substr(2, 9)}`,
			operation,
			category,
			severity,
			user_id: user.id,
			user_name: user.name,
			session_id: `sess_${Math.random().toString(36).substr(2, 12)}`,
			client_ip: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
			user_agent: userAgents[Math.floor(Math.random() * userAgents.length)],
			target_resource: `/${resourceType}s/${Math.floor(Math.random() * 1000) + 1}`,
			resource_type: resourceType,
			source,
			application,
			success,
			error_message: success ? undefined : `Failed to ${operation} ${resourceType}: Permission denied`,
			created_at: timestamp.toISOString(),
			updated_at: timestamp.toISOString()
		}

		records.push(record)
	}

	return { records, total }
}

// Static reference for updates (will be initialized dynamically)
let mockPreferencesDataCache: PreferencesData | null = null
let mockPrivacyDataCache: PrivacyData | null = null

// Mock API function to simulate data fetching
export const mockApi = {
	getUser: (): Promise<User> => {
		return new Promise((resolve) => {
			setTimeout(() => resolve(mockUser), 300)
		})
	},

	getMenuGroups: (): Promise<MenuGroup[]> => {
		return new Promise((resolve) => {
			resolve(mockMenuGroups)
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

	getTeamMembers: (): Promise<TeamMember[]> => {
		return new Promise((resolve) => {
			setTimeout(() => resolve(mockTeamMembers), 300)
		})
	},

	getTeamInvitations: (): Promise<TeamInvitation[]> => {
		return new Promise((resolve) => {
			setTimeout(() => resolve(mockTeamInvitations), 300)
		})
	},

	getTeam: (): Promise<Team> => {
		return new Promise((resolve, reject) => {
			// 模拟没有团队的情况，返回 reject 来触发创建团队界面
			setTimeout(() => {
				// 可以通过这个变量控制是否有团队
				const hasTeam = false // 设置为 true 来显示正常团队界面，false 来测试创建团队界面
				if (hasTeam) {
					resolve(mockTeam)
				} else {
					reject(new Error('Team not found'))
				}
			}, 300)
		})
	},

	getPreferencesSchema: (locale: string = 'en-US'): Promise<ProviderSchema> => {
		return new Promise((resolve) => {
			setTimeout(() => resolve(generatePreferencesSchema(locale)), 200)
		})
	},

	getPreferencesData: (): Promise<PreferencesData> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				// Initialize cache if not exists
				if (!mockPreferencesDataCache) {
					mockPreferencesDataCache = generateMockPreferencesData()
				}
				resolve(mockPreferencesDataCache)
			}, 200)
		})
	},

	updatePreferencesData: (data: PreferencesData): Promise<PreferencesData> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				// Initialize cache if not exists
				if (!mockPreferencesDataCache) {
					mockPreferencesDataCache = generateMockPreferencesData()
				}
				// Update cached data
				Object.assign(mockPreferencesDataCache, data)
				resolve(mockPreferencesDataCache)
			}, 500)
		})
	},

	getPrivacySchema: (locale: string = 'en-US'): Promise<ProviderSchema> => {
		return new Promise((resolve) => {
			setTimeout(() => resolve(generatePrivacySchema(locale)), 200)
		})
	},

	getPrivacyData: (): Promise<PrivacyData> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				// Initialize cache if not exists
				if (!mockPrivacyDataCache) {
					mockPrivacyDataCache = generateMockPrivacyData()
				}
				resolve(mockPrivacyDataCache)
			}, 200)
		})
	},

	updatePrivacyData: (data: PrivacyData): Promise<PrivacyData> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				// Initialize cache if not exists
				if (!mockPrivacyDataCache) {
					mockPrivacyDataCache = generateMockPrivacyData()
				}
				// Update cached data
				Object.assign(mockPrivacyDataCache, data)
				resolve(mockPrivacyDataCache)
			}, 500)
		})
	},

	getAuditLogs: (page: number = 1, size: number = 20): Promise<AuditLogResponse> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				const data = generateMockAuditLogs(page, size)
				resolve(data)
			}, 300)
		})
	},

	getCurrentPlan: (): Promise<PlanData> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				const nextMonth = new Date()
				nextMonth.setMonth(nextMonth.getMonth() + 1)
				nextMonth.setDate(1)

				// 创建不同类型的点数包
				const now = new Date()
				const packages: CreditPackage[] = [
					{
						id: 'pkg-001',
						type: 'purchased',
						name: { 'zh-CN': '充值点数', 'en-US': 'Purchased Credits' },
						original_amount: 5000,
						used: 1000,
						balance: 4000,
						expiry_date: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1年后
						created_at: '2024-01-15T10:30:00Z',
						description: { 'zh-CN': '通过在线支付获得', 'en-US': 'Obtained via online payment' }
					},
					{
						id: 'pkg-002',
						type: 'referral',
						name: { 'zh-CN': '邀请奖励', 'en-US': 'Referral Reward' },
						original_amount: 2000,
						used: 500,
						balance: 1500,
						expiry_date: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6个月后
						created_at: '2024-02-01T14:20:00Z',
						description: {
							'zh-CN': '成功邀请好友获得',
							'en-US': 'Earned by successful referrals'
						}
					},
					{
						id: 'pkg-003',
						type: 'promotion',
						name: { 'zh-CN': '新年活动赠送', 'en-US': 'New Year Promotion' },
						original_amount: 1000,
						used: 0,
						balance: 1000,
						expiry_date: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 3个月后
						created_at: '2024-01-01T00:00:00Z',
						description: { 'zh-CN': '新年活动限时赠送', 'en-US': 'Limited-time New Year gift' }
					}
				]

				const totalPackageBalance = packages.reduce((sum, pkg) => sum + pkg.balance, 0)
				const totalPackageUsed = packages.reduce((sum, pkg) => sum + pkg.used, 0)

				const mockPlan: PlanData = {
					type: 'pro',
					name: {
						'zh-CN': 'Pro 版',
						'en-US': 'Pro Plan'
					},
					status: 'active',
					billing_cycle: 'monthly',
					current_period_start: '2024-01-01T00:00:00Z',
					current_period_end: '2024-02-01T00:00:00Z',
					next_billing_date: nextMonth.toISOString(),
					credits: {
						monthly: {
							used: 7500,
							limit: 10000,
							reset_date: nextMonth.toISOString()
						},
						packages: packages,
						total_used: 7500 + totalPackageUsed, // 月度使用 + 额外包使用
						total_available: 10000 + totalPackageBalance // 月度额度 + 额外包余额
					}
				}
				resolve(mockPlan)
			}, 300)
		})
	},

	getBalanceInfo: (): Promise<BalanceInfo> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				const nextMonth = new Date()
				nextMonth.setMonth(nextMonth.getMonth() + 1)
				nextMonth.setDate(1)

				// 创建不同类型的点数包
				const now = new Date()
				const packages: CreditPackage[] = [
					{
						id: 'pkg-001',
						type: 'purchased',
						name: { 'zh-CN': '充值点数', 'en-US': 'Purchased Credits' },
						original_amount: 5000,
						used: 1000,
						balance: 4000,
						expiry_date: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
						created_at: '2024-01-15T10:30:00Z',
						description: { 'zh-CN': '通过在线支付获得', 'en-US': 'Obtained via online payment' }
					},
					{
						id: 'pkg-002',
						type: 'referral',
						name: { 'zh-CN': '邀请奖励', 'en-US': 'Referral Reward' },
						original_amount: 2000,
						used: 500,
						balance: 1500,
						expiry_date: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString(),
						created_at: '2024-02-01T14:20:00Z',
						description: {
							'zh-CN': '成功邀请好友获得',
							'en-US': 'Earned by successful referrals'
						}
					},
					{
						id: 'pkg-003',
						type: 'promotion',
						name: { 'zh-CN': '新年活动赠送', 'en-US': 'New Year Promotion' },
						original_amount: 1000,
						used: 0,
						balance: 1000,
						expiry_date: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
						created_at: '2024-01-01T00:00:00Z',
						description: { 'zh-CN': '新年活动限时赠送', 'en-US': 'Limited-time New Year gift' }
					}
				]

				const totalPackageBalance = packages.reduce((sum, pkg) => sum + pkg.balance, 0)

				const balanceInfo: BalanceInfo = {
					total_credits: 12500, // 10000 (monthly) + 6500 (extra packages)
					monthly_credits: {
						used: 2500,
						limit: 10000,
						reset_date: nextMonth.toISOString()
					},
					extra_credits: packages,
					pending_credits: 500 // 待到账点数
				}

				resolve(balanceInfo)
			}, 300)
		})
	},

	getTopUpRecords: (
		page: number = 1,
		limit: number = 20
	): Promise<{ records: TopUpRecord[]; total: number; hasMore: boolean }> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				// 模拟充值记录数据 - 包含更多类型
				const allRecords: TopUpRecord[] = [
					// 邀请奖励
					{
						id: 'reward-001',
						amount: 0,
						credits: 1000,
						method: 'stripe', // 系统奖励也用stripe表示
						status: 'completed',
						expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
						created_at: '2024-01-25T09:15:00Z',
						completed_at: '2024-01-25T09:15:00Z',
						notes: '邀请好友奖励 - Referral Bonus'
					},
					{
						id: 'reward-002',
						amount: 0,
						credits: 500,
						method: 'stripe',
						status: 'completed',
						expiry_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
						created_at: '2024-01-22T16:20:00Z',
						completed_at: '2024-01-22T16:20:00Z',
						notes: '新用户注册奖励 - Welcome Bonus'
					},
					// 活动奖励
					{
						id: 'reward-003',
						amount: 0,
						credits: 2000,
						method: 'stripe',
						status: 'completed',
						expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
						created_at: '2024-01-20T12:00:00Z',
						completed_at: '2024-01-20T12:00:00Z',
						notes: '春节活动奖励 - New Year Event Bonus'
					},
					// 推广奖励
					{
						id: 'reward-004',
						amount: 0,
						credits: 800,
						method: 'stripe',
						status: 'completed',
						expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
						created_at: '2024-01-18T10:30:00Z',
						completed_at: '2024-01-18T10:30:00Z',
						notes: '社交媒体分享奖励 - Social Media Bonus'
					},
					// 任务完成奖励
					{
						id: 'reward-005',
						amount: 0,
						credits: 300,
						method: 'stripe',
						status: 'completed',
						expiry_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
						created_at: '2024-01-16T15:45:00Z',
						completed_at: '2024-01-16T15:45:00Z',
						notes: '每日任务完成奖励 - Daily Task Bonus'
					},
					{
						id: 'top-001',
						amount: 50.0,
						credits: 5000,
						method: 'stripe',
						status: 'completed',
						expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
						created_at: '2024-01-15T10:30:00Z',
						completed_at: '2024-01-15T10:32:15Z',
						transaction_id: 'pi_1234567890abcdef',
						notes: 'Standard credit package'
					},
					{
						id: 'top-002',
						amount: 20.0,
						credits: 2000,
						method: 'card_code',
						status: 'completed',
						expiry_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
						created_at: '2024-01-10T14:20:00Z',
						completed_at: '2024-01-10T14:21:30Z',
						card_code: 'CARD-****-****-5678',
						notes: 'Redeemed gift card'
					},
					{
						id: 'top-003',
						amount: 100.0,
						credits: 10000,
						method: 'stripe',
						status: 'completed',
						expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
						created_at: '2024-01-05T09:15:00Z',
						completed_at: '2024-01-05T09:17:45Z',
						transaction_id: 'pi_abcdef1234567890',
						notes: 'Premium credit package with bonus'
					},
					{
						id: 'top-004',
						amount: 30.0,
						credits: 3000,
						method: 'alipay',
						status: 'completed',
						expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
						created_at: '2024-01-02T16:45:00Z',
						completed_at: '2024-01-02T16:46:20Z',
						transaction_id: '2024010216453000001',
						notes: 'Alipay payment'
					},
					{
						id: 'top-005',
						amount: 25.0,
						credits: 2500,
						method: 'stripe',
						status: 'pending',
						expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
						created_at: '2024-01-20T08:30:00Z',
						transaction_id: 'pi_pending123456789',
						notes: 'Payment processing'
					},
					{
						id: 'top-006',
						amount: 15.0,
						credits: 1500,
						method: 'card_code',
						status: 'failed',
						expiry_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
						created_at: '2024-01-18T12:15:00Z',
						card_code: 'CARD-****-****-1234',
						notes: 'Invalid or expired card code'
					},
					{
						id: 'top-007',
						amount: 75.0,
						credits: 7500,
						method: 'wechat',
						status: 'completed',
						expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
						created_at: '2023-12-28T20:10:00Z',
						completed_at: '2023-12-28T20:11:45Z',
						transaction_id: 'wx_20231228201045001',
						notes: 'WeChat Pay transaction'
					},
					{
						id: 'top-008',
						amount: 40.0,
						credits: 4000,
						method: 'stripe',
						status: 'completed',
						expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
						created_at: '2023-12-20T11:30:00Z',
						completed_at: '2023-12-20T11:32:10Z',
						transaction_id: 'pi_completed987654321',
						notes: 'Holiday special offer'
					}
				]

				// 分页逻辑
				const startIndex = (page - 1) * limit
				const endIndex = startIndex + limit
				const records = allRecords.slice(startIndex, endIndex)
				const hasMore = endIndex < allRecords.length

				resolve({
					records,
					total: allRecords.length,
					hasMore
				})
			}, 300)
		})
	},

	// 获取使用记录（分页）
	getUsageRecords: (page: number = 1, limit: number = 20): Promise<{ records: UsageRecord[]; total: number }> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				// 生成 30 天的使用记录
				const records: UsageRecord[] = []
				const now = new Date()

				for (let i = 29; i >= 0; i--) {
					const date = new Date(now)
					date.setDate(date.getDate() - i)

					const baseRequests = Math.floor(Math.random() * 1000) + 100
					const tokens = baseRequests * (Math.random() * 1000 + 500)
					const cost = baseRequests * 0.002 + tokens * 0.000001

					records.push({
						id: `usage-${i}-${Date.now()}`,
						date: date.toISOString().split('T')[0],
						requests: baseRequests,
						cost: Number(cost.toFixed(3)),
						tokens: Math.floor(tokens)
					})
				}

				// 分页逻辑
				const startIndex = (page - 1) * limit
				const endIndex = startIndex + limit
				const paginatedRecords = records.slice(startIndex, endIndex)

				resolve({
					records: paginatedRecords,
					total: records.length
				})
			}, 300)
		})
	},

	// 获取账单数据
	getBillingData: (): Promise<BillingData> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				const billingData: BillingData = {
					customer_id: 'cus_stripe123456789',
					current_plan: {
						id: 'price_pro_monthly',
						name: 'Pro Plan',
						amount: 2000, // $20.00 in cents
						currency: 'USD',
						interval: 'month'
					},
					next_billing_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
					payment_method: {
						id: 'pm_stripe987654321',
						type: 'card',
						brand: 'visa',
						last4: '4242',
						exp_month: 12,
						exp_year: 2025
					},
					billing_address: {
						line1: '123 Main Street',
						line2: 'Apt 4B',
						city: 'San Francisco',
						state: 'CA',
						postal_code: '94105',
						country: 'United States'
					}
				}
				resolve(billingData)
			}, 300)
		})
	},

	// 获取发票列表
	getInvoices: (): Promise<Invoice[]> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				const invoices: Invoice[] = [
					{
						id: 'in_stripe001',
						invoice_number: 'INV-2024-001',
						date: '2024-01-15T00:00:00Z',
						description: 'Pro Plan - January 2024',
						amount: 2000,
						currency: 'USD',
						status: 'paid',
						pdf_url: 'https://stripe.com/invoices/inv_stripe001.pdf'
					},
					{
						id: 'in_stripe002',
						invoice_number: 'INV-2023-012',
						date: '2023-12-15T00:00:00Z',
						description: 'Pro Plan - December 2023',
						amount: 2000,
						currency: 'USD',
						status: 'paid',
						pdf_url: 'https://stripe.com/invoices/inv_stripe002.pdf'
					},
					{
						id: 'in_stripe003',
						invoice_number: 'INV-2023-011',
						date: '2023-11-15T00:00:00Z',
						description: 'Pro Plan - November 2023',
						amount: 2000,
						currency: 'USD',
						status: 'paid',
						pdf_url: 'https://stripe.com/invoices/inv_stripe003.pdf'
					},
					{
						id: 'in_stripe004',
						invoice_number: 'INV-2023-010',
						date: '2023-10-15T00:00:00Z',
						description: 'Pro Plan - October 2023',
						amount: 2000,
						currency: 'USD',
						status: 'paid',
						pdf_url: 'https://stripe.com/invoices/inv_stripe004.pdf'
					},
					{
						id: 'in_stripe005',
						invoice_number: 'INV-2023-009',
						date: '2023-09-15T00:00:00Z',
						description: 'Pro Plan - September 2023 + Extra Credits',
						amount: 2500,
						currency: 'USD',
						status: 'paid',
						pdf_url: 'https://stripe.com/invoices/inv_stripe005.pdf'
					},
					{
						id: 'in_stripe006',
						invoice_number: 'INV-2023-008',
						date: '2023-08-15T00:00:00Z',
						description: 'Pro Plan - August 2023',
						amount: 2000,
						currency: 'USD',
						status: 'refunded',
						pdf_url: 'https://stripe.com/invoices/inv_stripe006.pdf'
					},
					{
						id: 'in_stripe007',
						invoice_number: 'INV-2024-002',
						date: '2024-01-20T00:00:00Z',
						description: 'Extra Credits Purchase',
						amount: 5000,
						currency: 'USD',
						status: 'pending',
						pdf_url: null
					}
				]
				resolve(invoices)
			}, 300)
		})
	},

	// 获取安全信息
	getSecurityData: (): Promise<SecurityData> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				const securityData: SecurityData = {
					contact: {
						email: 'user@example.com',
						phone: '+1234567890',
						email_verified: true,
						phone_verified: false
					},
					oauthProviders: [
						{
							provider: 'google',
							provider_id: 'google_123456789',
							email: 'user@gmail.com',
							name: 'John Doe',
							avatar: 'https://lh3.googleusercontent.com/a/default-user',
							connected_at: '2024-01-15T10:30:00Z'
						},
						{
							provider: 'github',
							provider_id: 'github_987654321',
							email: 'user@example.com',
							name: 'johndoe',
							avatar: 'https://avatars.githubusercontent.com/u/123456?v=4',
							connected_at: '2024-02-20T14:45:00Z'
						}
					],
					twoFactor: {
						enabled: false,
						primary_method: undefined,
						methods: [
							{
								type: 'sms',
								enabled: false,
								phone: '+1234567890'
							},
							{
								type: 'totp',
								enabled: false,
								secret: undefined,
								backup_codes: undefined
							}
						]
					}
				}
				resolve(securityData)
			}, 300)
		})
	}
}
