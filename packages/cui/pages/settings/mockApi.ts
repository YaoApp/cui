// Mock data for settings page - remove when API is ready
import { ProviderSchema } from '@/components/ui/Provider/types'
import type {
	User,
	ApiKey,
	Subscription,
	UsageStats,
	UsageRecord,
	TeamMember,
	Team,
	TeamInvitation,
	PreferencesData,
	PrivacyData,
	AuditLog,
	AuditLogResponse,
	PlanData,
	CreditPackage,
	BalanceInfo,
	TopUpRecord,
	BillingData,
	Invoice,
	SecurityData,
	MenuGroup,
	SystemInfoData,
	CheckUpdateResult,
	CloudServiceData,
	CloudServiceTestResult,
	ModelInfo,
	ProviderConfig,
	ModelsPageData,
	RoleAssignment,
	ProviderTestResult,
	SearchProviderPreset,
	SearchProviderConfig,
	SearchToolAssignment,
	SearchPageData,
	ComputerNode,
	RegistryConfig,
	SandboxImage,
	SandboxPageData,
	SmtpPreset,
	SmtpConfig,
	SmtpPageData,
	McpServerConfig,
	McpPageData
} from './types'
import { settingMenuGroups } from './menu'

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

// Mock preferences data
const generateMockPreferencesData = (): PreferencesData => ({
	language: 'auto',
	theme: 'auto',
	emailSubscription: true
})

// Mock privacy data
const generateMockPrivacyData = (): PrivacyData => ({
	policyNotifications: true,
	dataCollection: true,
	thirdPartySharing: true
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

	const total = 1247
	const records: AuditLog[] = []

	for (let i = 0; i < size; i++) {
		const recordIndex = (page - 1) * size + i + 1
		if (recordIndex > total) break

		const user = users[Math.floor(Math.random() * users.length)]
		const operation = operations[Math.floor(Math.random() * operations.length)]
		const category = categories[Math.floor(Math.random() * categories.length)]
		const severity = severities[Math.floor(Math.random() * severities.length)]
		const success = Math.random() > 0.1
		const source = sources[Math.floor(Math.random() * sources.length)]
		const application = applications[Math.floor(Math.random() * applications.length)]
		const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)]

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

// Static reference for updates
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
		return Promise.resolve(settingMenuGroups)
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
			setTimeout(() => {
				const hasTeam = false
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
				if (!mockPreferencesDataCache) {
					mockPreferencesDataCache = generateMockPreferencesData()
				}
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
				if (!mockPrivacyDataCache) {
					mockPrivacyDataCache = generateMockPrivacyData()
				}
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
						total_used: 7500 + totalPackageUsed,
						total_available: 10000 + totalPackageBalance
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

				const balanceInfo: BalanceInfo = {
					total_credits: 12500,
					monthly_credits: {
						used: 2500,
						limit: 10000,
						reset_date: nextMonth.toISOString()
					},
					extra_credits: packages,
					pending_credits: 500
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
				const allRecords: TopUpRecord[] = [
					{
						id: 'reward-001',
						amount: 0,
						credits: 1000,
						method: 'stripe',
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

	getUsageRecords: (page: number = 1, limit: number = 20): Promise<{ records: UsageRecord[]; total: number }> => {
		return new Promise((resolve) => {
			setTimeout(() => {
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

	getBillingData: (): Promise<BillingData> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				const billingData: BillingData = {
					customer_id: 'cus_stripe123456789',
					current_plan: {
						id: 'price_pro_monthly',
						name: 'Pro Plan',
						amount: 2000,
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
	},

	getSystemInfo: (): Promise<SystemInfoData> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve({
					app: {
						name: 'YaoAgents',
						short: 'YaoAgents',
						description: 'Your AI Team. On Your Device. Under Your Control.',
						logo: '/api/__yao/app/icons/app.png',
						version: '1.0.0'
					},
					deployment: 'community',
					server: {
						version: '0.10.5',
						build_date: '2026-04-20',
						commit: '4996b86'
					},
					client: {
						version: '1.0.0',
						build_date: '2026-04-25',
						commit: 'bb6fee8'
					},
					environment: 'development',
					technical: {
						listen: '0.0.0.0:5099',
						db_driver: 'sqlite3',
						session_store: 'file'
					}
				})
			}, 300)
		})
	},

	checkUpdate: (): Promise<CheckUpdateResult> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve({
					has_update: false,
					latest_version: '0.10.5'
				})
			}, 1000)
		})
	},

	getCloudService: (): Promise<CloudServiceData> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve({
					regions: [
						{ key: 'us', label: { 'zh-CN': '美国', 'en-US': 'United States' }, api_url: 'https://api-us.yao.run', default: true },
						{ key: 'cn', label: { 'zh-CN': '中国', 'en-US': 'China' }, api_url: 'https://api-cn.yao.run' },
						{ key: 'ap', label: { 'zh-CN': '亚太', 'en-US': 'Asia Pacific' }, api_url: 'https://api-ap.yao.run' },
						{ key: 'eu', label: { 'zh-CN': '欧洲', 'en-US': 'Europe' }, api_url: 'https://api-eu.yao.run' }
					],
					region: 'us',
					api_url: 'https://api-us.yao.run',
					api_key: '',
					status: 'unconfigured'
				})
			}, 300)
		})
	},

	saveCloudService: (data: Partial<CloudServiceData>): Promise<CloudServiceData> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve({
					regions: [
						{ key: 'us', label: { 'zh-CN': '美国', 'en-US': 'United States' }, api_url: 'https://api-us.yao.run', default: true },
						{ key: 'cn', label: { 'zh-CN': '中国', 'en-US': 'China' }, api_url: 'https://api-cn.yao.run' },
						{ key: 'ap', label: { 'zh-CN': '亚太', 'en-US': 'Asia Pacific' }, api_url: 'https://api-ap.yao.run' },
						{ key: 'eu', label: { 'zh-CN': '欧洲', 'en-US': 'Europe' }, api_url: 'https://api-eu.yao.run' }
					],
					region: data.region || 'us',
					api_url: data.api_url || 'https://api-us.yao.run',
					api_key: data.api_key || '',
					status: data.api_key ? 'connected' : 'unconfigured'
				})
			}, 500)
		})
	},

	testCloudService: (): Promise<CloudServiceTestResult> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve({
					success: true,
					message: 'Connection successful',
					latency_ms: 128
				})
			}, 1000)
		})
	},

	// ─── Models ──────────────────────────────────────────────

	getModelsConfig: (): Promise<ModelsPageData> => {
		return new Promise((resolve) => {
			setTimeout(() => resolve(JSON.parse(JSON.stringify(modelsCache))), 400)
		})
	},

	saveRoleAssignment: (roles: RoleAssignment): Promise<RoleAssignment> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				modelsCache.roles = { ...roles }
				resolve({ ...roles })
			}, 300)
		})
	},

	addProvider: (presetKey: string, overrides: { api_key?: string; api_url?: string; name?: string; type?: ProviderConfig['type']; models?: ModelInfo[] }): Promise<ProviderConfig> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				const isCustom = presetKey === 'custom'
				const preset = isCustom ? null : modelsCache.preset_providers.find((p) => p.key === presetKey)
				const key = isCustom ? `custom_${Date.now()}` : presetKey
				const newP: ProviderConfig = {
					key,
					name: overrides.name || preset?.name || 'Custom',
					type: overrides.type || preset?.type || 'openai',
					api_url: overrides.api_url ?? preset?.api_url ?? '',
					api_key: overrides.api_key || '',
					models: overrides.models || preset?.default_models?.map((m) => ({ ...m })) || [],
					enabled: true,
					status: 'unconfigured',
					is_custom: isCustom,
					preset_key: isCustom ? undefined : presetKey,
					require_key: isCustom ? true : (preset?.require_key ?? true)
				}
				modelsCache.providers.push(newP)
				resolve(JSON.parse(JSON.stringify(newP)))
			}, 300)
		})
	},

	updateProvider: (key: string, config: { api_url?: string; api_key?: string; models?: ModelInfo[] }): Promise<ProviderConfig> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				const p = modelsCache.providers.find((x) => x.key === key)
				if (p) {
					if (config.api_url !== undefined) p.api_url = config.api_url
					if (config.api_key !== undefined) p.api_key = config.api_key
					if (config.models) p.models = config.models.map((m) => ({ ...m }))
				}
				resolve(JSON.parse(JSON.stringify(p)))
			}, 300)
		})
	},

	testProvider: (key: string): Promise<ProviderTestResult> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				const p = modelsCache.providers.find((x) => x.key === key)
				if (p) p.status = 'connected'
				resolve({ success: true, message: 'Connection successful', latency_ms: 95 })
			}, 1000)
		})
	},

	removeProvider: (key: string): Promise<boolean> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				modelsCache.providers = modelsCache.providers.filter((x) => x.key !== key)
				resolve(true)
			}, 200)
		})
	},

	// ─── Search & Scrape ──────────────────────────────────

	getSearchPageData: (): Promise<SearchPageData> => {
		return new Promise((resolve) => {
			setTimeout(async () => {
				const cloud = await mockApi.getCloudService()
				const cloudProvider = searchCache.providers.find((p) => p.preset_key === 'cloud')
				if (cloudProvider) {
					if (cloud.status === 'connected') {
						cloudProvider.enabled = true
						cloudProvider.status = 'connected'
					} else {
						cloudProvider.enabled = false
						cloudProvider.status = 'unconfigured'
					}
				}
				resolve(JSON.parse(JSON.stringify(searchCache)))
			}, 400)
		})
	},

	saveSearchProvider: (presetKey: string, fieldValues: Record<string, string>): Promise<SearchProviderConfig> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				const p = searchCache.providers.find((x) => x.preset_key === presetKey)
				if (p) {
					p.field_values = { ...p.field_values, ...fieldValues }
				}
				resolve(JSON.parse(JSON.stringify(p)))
			}, 300)
		})
	},

	toggleSearchProvider: (presetKey: string, enabled: boolean): Promise<SearchProviderConfig> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				const p = searchCache.providers.find((x) => x.preset_key === presetKey)
				if (p) {
					p.enabled = enabled
				}
				resolve(JSON.parse(JSON.stringify(p)))
			}, 200)
		})
	},

	testSearchProvider: (presetKey: string): Promise<ProviderTestResult> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				const p = searchCache.providers.find((x) => x.preset_key === presetKey)
				if (p) p.status = 'connected'
				resolve({ success: true, message: 'Connection successful', latency_ms: 120 })
			}, 1000)
		})
	},

	saveSearchToolAssignment: (assignment: SearchToolAssignment): Promise<SearchToolAssignment> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				searchCache.tool_assignment = { ...assignment }
				resolve({ ...assignment })
			}, 300)
		})
	},

	// ─── Sandbox ───────────────────────────────────────────

	getSandboxPageData: (): Promise<SandboxPageData> => {
		return new Promise((resolve) => {
			setTimeout(() => resolve(JSON.parse(JSON.stringify(sandboxCache))), 400)
		})
	},

	saveRegistryConfig: (config: Partial<RegistryConfig>): Promise<RegistryConfig> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				Object.assign(sandboxCache.registry, config)
				resolve({ ...sandboxCache.registry })
			}, 300)
		})
	},

	pullImage: (nodeId: string, imageId: string): Promise<SandboxImage> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				const images = sandboxCache.images[nodeId]
				const img = images?.find((i) => i.id === imageId)
				if (img) {
					img.status = 'downloading'
					img.progress = 0
				}
				resolve(JSON.parse(JSON.stringify(img)))
			}, 300)
		})
	},

	pullAllImages: (nodeId: string): Promise<SandboxImage[]> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				const images = sandboxCache.images[nodeId]
				if (images) {
					images.forEach((img) => {
						if (img.status === 'not_downloaded') {
							img.status = 'downloading'
							img.progress = 0
						}
					})
				}
				resolve(JSON.parse(JSON.stringify(images || [])))
			}, 300)
		})
	},

	removeImage: (nodeId: string, imageId: string): Promise<boolean> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				const images = sandboxCache.images[nodeId]
				const img = images?.find((i) => i.id === imageId)
				if (img) {
					img.status = 'not_downloaded'
					img.progress = undefined
				}
				resolve(true)
			}, 300)
		})
	},

	checkDocker: (_nodeId: string): Promise<{ docker_version?: string }> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve({ docker_version: '24.0.7' })
			}, 1000)
		})
	},

	// ─── SMTP ──────────────────────────────────────────────

	getSmtpConfig: (): Promise<SmtpPageData> => {
		return new Promise((resolve) => {
			setTimeout(() => resolve(JSON.parse(JSON.stringify({ presets: smtpPresets, config: smtpCache }))), 400)
		})
	},

	saveSmtpConfig: (config: Partial<SmtpConfig>): Promise<SmtpConfig> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				Object.assign(smtpCache, config)
				resolve(JSON.parse(JSON.stringify(smtpCache)))
			}, 300)
		})
	},

	toggleSmtp: (enabled: boolean): Promise<SmtpConfig> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				smtpCache.enabled = enabled
				if (!enabled) smtpCache.status = 'unconfigured'
				resolve(JSON.parse(JSON.stringify(smtpCache)))
			}, 200)
		})
	},

	testSmtp: (_toEmail: string): Promise<{ success: boolean; message: string }> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				smtpCache.status = 'connected'
				smtpCache.last_sent_at = new Date().toISOString()
				resolve({ success: true, message: 'Test email sent successfully' })
			}, 1500)
		})
	},

	// ─── MCP Services ─────────────────────────────────────

	getMcpServers: (): Promise<McpPageData> => {
		return new Promise((resolve) => {
			setTimeout(() => resolve(JSON.parse(JSON.stringify({ servers: mcpServersCache }))), 400)
		})
	},

	addMcpServer: (server: Omit<McpServerConfig, 'id' | 'status' | 'created_at' | 'updated_at'>): Promise<McpServerConfig> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				const now = new Date().toISOString()
				const newServer: McpServerConfig = {
					...server,
					id: `mcp-${Date.now()}`,
					status: server.authorization_token || !server.authorization_token ? 'connected' : 'unconfigured',
					created_at: now,
					updated_at: now
				}
				mcpServersCache.unshift(newServer)
				resolve(JSON.parse(JSON.stringify(newServer)))
			}, 500)
		})
	},

	updateMcpServer: (id: string, updates: Partial<McpServerConfig>): Promise<McpServerConfig> => {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				const idx = mcpServersCache.findIndex((s) => s.id === id)
				if (idx === -1) { reject(new Error('Server not found')); return }
				Object.assign(mcpServersCache[idx], updates, { updated_at: new Date().toISOString() })
				resolve(JSON.parse(JSON.stringify(mcpServersCache[idx])))
			}, 400)
		})
	},

	deleteMcpServer: (id: string): Promise<void> => {
		return new Promise((resolve) => {
			setTimeout(() => {
				const idx = mcpServersCache.findIndex((s) => s.id === id)
				if (idx !== -1) mcpServersCache.splice(idx, 1)
				resolve()
			}, 300)
		})
	}
}

// ─── Models mock data ────────────────────────────────────

const mkModel = (id: string, name: string, caps: ModelInfo['capabilities'], enabled = true): ModelInfo => ({
	id,
	name,
	capabilities: caps,
	enabled
})

const modelsCache: ModelsPageData = {
	roles: {},
	providers: [],
	preset_providers: [
		{ key: 'yaoagents', name: 'Yao Agents', type: 'openai', api_url: 'https://api-us.yao.run/v1', require_key: false, is_cloud: true, default_models: [
			mkModel('kimi-k2.5', 'Kimi K2.5', ['vision', 'tool_calls', 'streaming', 'json']),
			mkModel('gpt-4o', 'GPT-4o', ['vision', 'audio', 'tool_calls', 'streaming', 'json']),
			mkModel('claude-sonnet-4.5', 'Claude Sonnet 4.5', ['vision', 'tool_calls', 'streaming', 'json']),
			mkModel('deepseek-reasoner', 'DeepSeek Reasoner', ['reasoning', 'streaming'], false),
			mkModel('whisper-1', 'Whisper-1', ['audio'], false),
			mkModel('text-embedding-3-large', 'Text Embedding 3 Large', ['embedding'], false),
			mkModel('gemini-2.5-pro', 'Gemini 2.5 Pro', ['vision', 'tool_calls', 'streaming', 'json'], false)
		]},
		{ key: 'openai', name: 'OpenAI', type: 'openai', api_url: 'https://api.openai.com/v1', require_key: true, default_models: [
			mkModel('gpt-4o', 'GPT-4o', ['vision', 'audio', 'tool_calls', 'streaming', 'json']),
			mkModel('gpt-4o-mini', 'GPT-4o Mini', ['vision', 'tool_calls', 'streaming', 'json']),
			mkModel('gpt-5.2', 'GPT-5.2', ['vision', 'audio', 'reasoning', 'tool_calls', 'streaming', 'json'], false),
			mkModel('o3', 'o3', ['reasoning', 'vision', 'tool_calls', 'streaming'], false),
			mkModel('whisper-1', 'Whisper-1', ['audio'], false),
			mkModel('text-embedding-3-large', 'Text Embedding 3 Large', ['embedding'], false)
		]},
		{ key: 'anthropic', name: 'Anthropic', type: 'anthropic', api_url: 'https://api.anthropic.com', require_key: true, default_models: [
			mkModel('claude-opus-4.5', 'Claude Opus 4.5', ['vision', 'reasoning', 'tool_calls', 'streaming', 'json']),
			mkModel('claude-sonnet-4.5', 'Claude Sonnet 4.5', ['vision', 'tool_calls', 'streaming', 'json']),
			mkModel('claude-haiku', 'Claude Haiku', ['vision', 'tool_calls', 'streaming', 'json'])
		]},
		{ key: 'ollama', name: 'Ollama', type: 'ollama', api_url: 'http://127.0.0.1:11434/v1', require_key: false, url_editable: true, default_models: [
			mkModel('llama3.3', 'Llama 3.3', ['tool_calls', 'streaming', 'json']),
			mkModel('deepseek-r1', 'DeepSeek R1', ['reasoning', 'streaming']),
			mkModel('qwen3', 'Qwen 3', ['tool_calls', 'streaming', 'json']),
			mkModel('nomic-embed-text', 'Nomic Embed Text', ['embedding'])
		]},
		{ key: 'google', name: 'Google (Gemini)', type: 'google', api_url: 'https://generativelanguage.googleapis.com/v1beta', require_key: true, default_models: [
			mkModel('gemini-2.5-pro', 'Gemini 2.5 Pro', ['vision', 'tool_calls', 'streaming', 'json']),
			mkModel('gemini-3-flash', 'Gemini 3 Flash', ['vision', 'tool_calls', 'streaming', 'json'])
		]},
		{ key: 'moonshot', name: 'Moonshot / Kimi', type: 'openai', api_url: 'https://api.moonshot.cn/v1', require_key: true, default_models: [
			mkModel('kimi-k2', 'Kimi K2', ['vision', 'tool_calls', 'streaming', 'json']),
			mkModel('kimi-k2.5', 'Kimi K2.5', ['vision', 'tool_calls', 'streaming', 'json']),
			mkModel('kimi-k2.5-thinking', 'Kimi K2.5 Thinking', ['vision', 'reasoning', 'tool_calls', 'streaming'])
		]},
		{ key: 'xai', name: 'xAI', type: 'openai', api_url: 'https://api.x.ai/v1', require_key: true, default_models: [
			mkModel('grok-4', 'Grok-4', ['vision', 'reasoning', 'tool_calls', 'streaming', 'json'])
		]},
		{ key: 'deepseek', name: 'DeepSeek', type: 'openai', api_url: 'https://api.deepseek.com/v1', require_key: true, default_models: [
			mkModel('deepseek-chat', 'DeepSeek Chat', ['tool_calls', 'streaming', 'json']),
			mkModel('deepseek-reasoner', 'DeepSeek Reasoner', ['reasoning', 'streaming'])
		]},
		{ key: 'meta', name: 'Meta Llama', type: 'openai', api_url: 'https://api.llama.com/v1', require_key: true, default_models: [
			mkModel('llama-4-maverick', 'Llama 4 Maverick', ['vision', 'tool_calls', 'streaming', 'json'])
		]},
		{ key: 'mistral', name: 'Mistral', type: 'openai', api_url: 'https://api.mistral.ai/v1', require_key: true, default_models: [
			mkModel('mistral-large-3', 'Mistral Large 3', ['vision', 'tool_calls', 'streaming', 'json'])
		]},
		{ key: 'azure', name: 'Azure OpenAI', type: 'openai', api_url: '', require_key: true, url_editable: true, default_models: [
			mkModel('gpt-5.2', 'GPT-5.2', ['vision', 'audio', 'reasoning', 'tool_calls', 'streaming', 'json'])
		]},
		{ key: 'groq', name: 'Groq', type: 'openai', api_url: 'https://api.groq.com/openai/v1', require_key: true, default_models: [
			mkModel('llama-4-maverick', 'Llama 4 Maverick', ['vision', 'tool_calls', 'streaming', 'json'])
		]},
		{ key: 'together', name: 'Together', type: 'openai', api_url: 'https://api.together.xyz/v1', require_key: true, default_models: [
			mkModel('llama-4-maverick', 'Llama 4 Maverick', ['vision', 'tool_calls', 'streaming', 'json']),
			mkModel('deepseek-r1', 'DeepSeek R1', ['reasoning', 'streaming'])
		]},
		{ key: 'fireworks', name: 'Fireworks', type: 'openai', api_url: 'https://api.fireworks.ai/inference/v1', require_key: true, default_models: [
			mkModel('llama-4-maverick', 'Llama 4 Maverick', ['vision', 'tool_calls', 'streaming', 'json'])
		]},
		{ key: 'openrouter', name: 'OpenRouter', type: 'openai', api_url: 'https://openrouter.ai/api/v1', require_key: true, default_models: [
			mkModel('auto', 'Auto', ['vision', 'tool_calls', 'streaming', 'json']),
			mkModel('claude-opus-4.5', 'Claude Opus 4.5', ['vision', 'reasoning', 'tool_calls', 'streaming', 'json']),
			mkModel('nova-premier', 'Nova Premier', ['vision', 'tool_calls', 'streaming', 'json'])
		]},
		{ key: 'siliconflow', name: 'SiliconFlow', type: 'openai', api_url: 'https://api.siliconflow.cn/v1', require_key: true, default_models: [
			mkModel('deepseek-v3', 'DeepSeek V3', ['tool_calls', 'streaming', 'json']),
			mkModel('qwen-2.5-72b', 'Qwen 2.5 72B', ['tool_calls', 'streaming', 'json'])
		]},
		{ key: 'volcengine', name: '\u706B\u5C71\u65B9\u821F (Volcengine)', type: 'openai', api_url: '', require_key: true, url_editable: true, default_models: [
			mkModel('doubao', 'Doubao', ['vision', 'tool_calls', 'streaming', 'json']),
			mkModel('deepseek-r1', 'DeepSeek R1', ['reasoning', 'streaming']),
			mkModel('glm-4-plus', 'GLM-4 Plus', ['vision', 'tool_calls', 'streaming', 'json'])
		]}
	]
}

// ─── Search & Scrape mock data ───────────────────────────

const searchPresets: SearchProviderPreset[] = [
	{
		key: 'cloud',
		name: 'Yao Agents',
		description: {
			'zh-CN': '云服务提供的搜索与抓取能力，凭证来自云服务配置页',
			'en-US': 'Search & scrape capabilities from cloud service, credentials from cloud config'
		},
		website: 'https://yaoagents.com',
		tools: ['web_search', 'web_scrape'],
		tool_labels: [
			{ 'zh-CN': '网页搜索', 'en-US': 'Web Search' },
			{ 'zh-CN': '网页抓取', 'en-US': 'Web Scrape' }
		],
		fields: [],
		is_cloud: true
	},
	{
		key: 'tavily',
		name: 'Tavily',
		description: {
			'zh-CN': 'AI 优化的搜索 API，返回结构化结果，适合 Agent 使用',
			'en-US': 'AI-optimized search API with structured results, ideal for agents'
		},
		website: 'https://tavily.com',
		tools: ['web_search'],
		tool_labels: [{ 'zh-CN': '网页搜索', 'en-US': 'Web Search' }],
		fields: [{
			key: 'api_key',
			label: { 'zh-CN': 'API Key', 'en-US': 'API Key' },
			type: 'password',
			placeholder: 'tvly-...'
		}]
	},
	{
		key: 'serper',
		name: 'Serper (Google)',
		description: {
			'zh-CN': '基于 Google 搜索的 API，价格实惠，结果质量高',
			'en-US': 'Google Search API with affordable pricing and high-quality results'
		},
		website: 'https://serper.dev',
		tools: ['web_search'],
		tool_labels: [{ 'zh-CN': '网页搜索', 'en-US': 'Web Search' }],
		fields: [{
			key: 'api_key',
			label: { 'zh-CN': 'API Key', 'en-US': 'API Key' },
			type: 'password',
			placeholder: ''
		}]
	},
	{
		key: 'brightdata',
		name: 'Brightdata',
		description: {
			'zh-CN': '部分网站有访问限制，开启代理可提升网页抓取成功率。不开启也能正常使用，如遇抓取失败可回来开启。',
			'en-US': 'Some websites have access restrictions. Enabling proxy improves scraping success rate. Not required for normal use.'
		},
		website: 'https://brightdata.com',
		tools: ['web_scrape'],
		tool_labels: [{ 'zh-CN': '网页抓取', 'en-US': 'Web Scrape' }],
		fields: [
			{
				key: 'api_key',
				label: { 'zh-CN': 'API Key', 'en-US': 'API Key' },
				type: 'password',
				placeholder: ''
			},
			{
				key: 'zone',
				label: { 'zh-CN': 'Zone', 'en-US': 'Zone' },
				type: 'text',
				default: 'web_unlocker1',
				hint: { 'zh-CN': '一般无需修改', 'en-US': 'Usually no need to change' }
			}
		]
	}
]

const searchCache: SearchPageData = {
	presets: searchPresets,
	providers: [
		{ preset_key: 'cloud', enabled: false, field_values: {}, status: 'unconfigured' },
		{ preset_key: 'tavily', enabled: false, field_values: {}, status: 'unconfigured' },
		{ preset_key: 'serper', enabled: false, field_values: {}, status: 'unconfigured' },
		{ preset_key: 'brightdata', enabled: false, field_values: { zone: 'web_unlocker1' }, status: 'unconfigured' }
	],
	tool_assignment: {}
}

// ─── Sandbox mock data ───────────────────────────────────

const sandboxNodes: ComputerNode[] = [
	{
		node_id: 'local',
		display_name: '\u672C\u673A',
		kind: 'host',
		os: 'macOS',
		arch: 'arm64',
		cpu: 10,
		memory_gb: 32,
		docker_version: '24.0.7',
		running_sandboxes: 2,
		online: true
	},
	{
		node_id: 'gpu-server-01',
		display_name: 'GPU Server',
		kind: 'node',
		os: 'Linux',
		arch: 'amd64',
		cpu: 64,
		memory_gb: 256,
		docker_version: '26.1.0',
		running_sandboxes: 5,
		online: true
	},
	{
		node_id: 'dev-pc-02',
		display_name: '\u5F00\u53D1\u673A',
		kind: 'node',
		os: 'Windows',
		arch: 'amd64',
		cpu: 16,
		memory_gb: 64,
		running_sandboxes: 0,
		online: true
	}
]

const sandboxImages: Record<string, SandboxImage[]> = {
	local: [
		{ id: 'img-1', assistant_names: ['\u901A\u7528\u52A9\u624B (OpenCode)', '\u516C\u53F8\u7814\u7A76\u5458', '\u6570\u636E\u7BA1\u5BB6', 'Claude Code'], image_name: 'yaoapps/sandbox', tag: 'latest', size_mb: 1228, status: 'downloaded' },
		{ id: 'img-2', assistant_names: ['\u6D4F\u89C8\u5668\u52A9\u624B'], image_name: 'yaoapps/browser', tag: 'latest', size_mb: 2150, status: 'not_downloaded' },
		{ id: 'img-3', assistant_names: ['\u6570\u636E\u5206\u6790\u52A9\u624B', 'ML \u52A9\u624B'], image_name: 'yaoapps/python', tag: '3.12', size_mb: 870, status: 'downloading', progress: 67 },
		{ id: 'img-4', assistant_names: ['ML \u52A9\u624B'], image_name: 'custom-registry/ml', tag: 'v2', size_mb: 3584, status: 'downloaded' }
	],
	'gpu-server-01': [
		{ id: 'img-1', assistant_names: ['\u901A\u7528\u52A9\u624B (OpenCode)', '\u516C\u53F8\u7814\u7A76\u5458', '\u6570\u636E\u7BA1\u5BB6', 'Claude Code'], image_name: 'yaoapps/sandbox', tag: 'latest', size_mb: 1228, status: 'downloaded' },
		{ id: 'img-2', assistant_names: ['\u6D4F\u89C8\u5668\u52A9\u624B'], image_name: 'yaoapps/browser', tag: 'latest', size_mb: 2150, status: 'downloaded' },
		{ id: 'img-3', assistant_names: ['\u6570\u636E\u5206\u6790\u52A9\u624B', 'ML \u52A9\u624B'], image_name: 'yaoapps/python', tag: '3.12', size_mb: 870, status: 'downloaded' },
		{ id: 'img-4', assistant_names: ['ML \u52A9\u624B'], image_name: 'custom-registry/ml', tag: 'v2', size_mb: 3584, status: 'not_downloaded' }
	],
	'dev-pc-02': []
}

const sandboxCache: SandboxPageData = {
	nodes: sandboxNodes,
	registry: { registry_url: 'docker.io', username: '', password: '' },
	images: sandboxImages
}

// ─── SMTP mock data ─────────────────────────────────────

const smtpPresets: SmtpPreset[] = [
	{
		key: 'gmail', name: 'Gmail', host: 'smtp.gmail.com', port: 465, encryption: 'ssl',
		url: 'https://myaccount.google.com/apppasswords',
		hint: { 'zh-CN': 'Gmail 需要专用密码（App Password），非登录密码', 'en-US': 'Gmail requires an App Password, not your login password' }
	},
	{
		key: 'outlook', name: 'Outlook / Office 365', host: 'smtp.office365.com', port: 587, encryption: 'tls',
		url: 'https://admin.microsoft.com/',
		hint: { 'zh-CN': '需在 Microsoft 365 管理后台启用 SMTP AUTH', 'en-US': 'SMTP AUTH must be enabled in Microsoft 365 admin center' }
	},
	{
		key: 'aliyun', name: '阿里云邮箱', host: 'smtp.aliyun.com', port: 465, encryption: 'ssl',
		url: 'https://mail.aliyun.com/',
		hint: { 'zh-CN': '需在阿里云邮箱设置中开启 SMTP 服务', 'en-US': 'Enable SMTP in Aliyun Mail settings' }
	},
	{
		key: 'qq', name: '腾讯企业邮', host: 'smtp.exmail.qq.com', port: 465, encryption: 'ssl',
		url: 'https://exmail.qq.com/',
		hint: { 'zh-CN': '密码需使用客户端专用密码，在企业邮设置中生成', 'en-US': 'Use a client-specific password generated in Tencent Exmail settings' }
	},
	{
		key: 'sendgrid', name: 'SendGrid', host: 'smtp.sendgrid.net', port: 587, encryption: 'tls',
		url: 'https://app.sendgrid.com/',
		hint: { 'zh-CN': '用户名固定为 apikey，密码填 API Key', 'en-US': 'Username is always "apikey", password is your API Key' }
	},
	{
		key: 'ses', name: 'Amazon SES', host: 'email-smtp.us-east-1.amazonaws.com', port: 587, encryption: 'tls',
		url: 'https://console.aws.amazon.com/ses/',
		hint: { 'zh-CN': '需在 AWS SES 控制台创建 SMTP 凭证，非 IAM 密钥', 'en-US': 'Create SMTP credentials in AWS SES console, not IAM keys' }
	},
	{
		key: 'custom', name: '自定义', host: '', port: 465, encryption: 'ssl',
		hint: { 'zh-CN': '手动填写 SMTP 服务器信息', 'en-US': 'Manually enter SMTP server details' }
	}
]

const smtpCache: SmtpConfig = {
	enabled: false,
	preset_key: 'custom',
	host: '',
	port: 465,
	encryption: 'ssl',
	username: '',
	password: '',
	from_name: '',
	from_email: '',
	status: 'unconfigured'
}

// ─── MCP Services mock data ─────────────────────────────

const mcpServersCache: McpServerConfig[] = [
	{
		id: 'mcp-1',
		name: 'stripe',
		label: 'Stripe',
		description: 'Payments, subscriptions, invoices',
		transport: 'http',
		url: 'https://mcp.stripe.com',
		authorization_token: 'Bearer rk_test_51abc...xyz',
		timeout: '30s',
		tags: ['payments', 'finance'],
		status: 'connected',
		created_at: '2026-03-15T08:00:00Z',
		updated_at: '2026-04-20T10:30:00Z'
	},
	{
		id: 'mcp-2',
		name: 'github',
		label: 'GitHub',
		description: 'Repos, issues, PRs, workflows',
		transport: 'http',
		url: 'https://api.githubcopilot.com/mcp/',
		authorization_token: 'Bearer ghp_xxxxxxxxxxxx',
		timeout: '30s',
		tags: ['development', 'git'],
		status: 'connected',
		created_at: '2026-03-10T12:00:00Z',
		updated_at: '2026-04-18T09:00:00Z'
	},
	{
		id: 'mcp-3',
		name: 'cloudflare',
		label: 'Cloudflare',
		description: 'DNS, Workers, R2, Zero Trust',
		transport: 'http',
		url: 'https://mcp.cloudflare.com/mcp',
		timeout: '30s',
		tags: ['cloud', 'infrastructure'],
		status: 'unconfigured',
		created_at: '2026-04-01T06:00:00Z',
		updated_at: '2026-04-01T06:00:00Z'
	},
	{
		id: 'mcp-4',
		name: 'notion',
		label: 'Notion',
		description: 'Pages, databases, comments',
		transport: 'http',
		url: 'https://mcp.notion.com/mcp',
		authorization_token: 'Bearer ntn_xxx_xxxxxxxx',
		timeout: '30s',
		tags: ['productivity'],
		status: 'connected',
		created_at: '2026-03-20T14:00:00Z',
		updated_at: '2026-04-22T11:00:00Z'
	},
	{
		id: 'mcp-5',
		name: 'supabase',
		label: 'Supabase',
		description: 'Database, auth, storage, realtime',
		transport: 'http',
		url: 'https://mcp.supabase.com/mcp',
		timeout: '30s',
		tags: ['database', 'backend'],
		status: 'connected',
		created_at: '2026-04-05T16:00:00Z',
		updated_at: '2026-04-25T08:00:00Z'
	}
]
