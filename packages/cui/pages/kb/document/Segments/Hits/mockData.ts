import { HitRecord } from '../../../types'

// Mock Hits 数据
export const mockHitsData: HitRecord[] = [
	{
		id: 'hit_001',
		scenario: '智能问答',
		source: 'web_chat',
		context: {
			query: '如何使用YAO框架创建API？',
			user_id: 'user_123',
			session_id: 'session_456',
			ip: '192.168.1.100',
			user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
		},
		created_at: '2024-01-15T10:30:25Z',
		query: '如何使用YAO框架创建API？',
		score: 0.95,
		metadata: {
			response_time: 120,
			model: 'gpt-3.5-turbo',
			tokens: 450
		}
	},
	{
		id: 'hit_002',
		scenario: '文档检索',
		source: 'api_call',
		context: {
			query: 'YAO framework installation guide',
			api_key: 'ak_***123',
			endpoint: '/api/v1/search',
			method: 'POST'
		},
		created_at: '2024-01-15T09:45:12Z',
		query: 'YAO framework installation guide',
		score: 0.88,
		metadata: {
			response_time: 85,
			results_count: 12,
			filtered: true
		}
	},
	{
		id: 'hit_003',
		scenario: '知识推荐',
		source: 'mobile_app',
		context: {
			user_id: 'user_789',
			device_id: 'device_abc',
			platform: 'iOS',
			version: '1.2.3'
		},
		created_at: '2024-01-15T08:20:45Z',
		query: '数据库连接配置',
		score: 0.76,
		metadata: {
			recommendations: 5,
			clicked: 2,
			engagement_rate: 0.4
		}
	},
	{
		id: 'hit_004',
		scenario: '智能问答',
		source: 'slack_bot',
		context: {
			query: 'What is the difference between YAO and other frameworks?',
			channel_id: 'C1234567890',
			team_id: 'T0987654321',
			user_id: 'U1122334455'
		},
		created_at: '2024-01-15T07:15:30Z',
		query: 'What is the difference between YAO and other frameworks?',
		score: 0.92,
		metadata: {
			response_time: 200,
			language: 'en',
			confidence: 0.89
		}
	},
	{
		id: 'hit_005',
		scenario: '文档检索',
		source: 'web_search',
		context: {
			query: 'YAO 表单组件使用方法',
			referer: 'https://yaoapps.com/docs',
			search_type: 'fuzzy'
		},
		created_at: '2024-01-15T06:30:18Z',
		query: 'YAO 表单组件使用方法',
		score: 0.84,
		metadata: {
			results_count: 8,
			search_time: 45,
			cache_hit: false
		}
	},
	{
		id: 'hit_006',
		scenario: '知识推荐',
		source: 'email_digest',
		context: {
			user_id: 'user_456',
			email: 'user@example.com',
			digest_type: 'weekly',
			preferences: ['backend', 'api', 'database']
		},
		created_at: '2024-01-14T18:45:22Z',
		query: '后端开发最佳实践',
		score: 0.79,
		metadata: {
			recommendations: 10,
			opened: true,
			click_through_rate: 0.3
		}
	},
	{
		id: 'hit_007',
		scenario: '智能问答',
		source: 'discord_bot',
		context: {
			query: 'How to deploy YAO application to production?',
			guild_id: '123456789012345678',
			channel_id: '987654321098765432',
			user_id: '456789123456789123'
		},
		created_at: '2024-01-14T16:20:55Z',
		query: 'How to deploy YAO application to production?',
		score: 0.91,
		metadata: {
			response_time: 180,
			thread_created: true,
			mentions: 3
		}
	},
	{
		id: 'hit_008',
		scenario: '文档检索',
		source: 'vscode_extension',
		context: {
			query: 'YAO DSL syntax highlighting',
			extension_version: '1.5.2',
			vscode_version: '1.85.0',
			workspace: 'yao-project'
		},
		created_at: '2024-01-14T14:10:33Z',
		query: 'YAO DSL syntax highlighting',
		score: 0.87,
		metadata: {
			results_count: 6,
			auto_complete: true,
			snippets_used: 2
		}
	},
	// 添加更多测试数据
	{
		id: 'hit_009',
		scenario: '智能问答',
		source: 'web_chat',
		context: {
			query: 'YAO 数据模型如何定义？',
			user_id: 'user_101',
			session_id: 'session_789',
			ip: '10.0.0.1',
			user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
		},
		created_at: '2024-01-14T13:45:20Z',
		query: 'YAO 数据模型如何定义？',
		score: 0.89,
		metadata: {
			response_time: 95,
			model: 'gpt-4',
			tokens: 380
		}
	},
	{
		id: 'hit_010',
		scenario: '文档检索',
		source: 'api_call',
		context: {
			query: 'YAO workflow configuration',
			api_key: 'ak_***456',
			endpoint: '/api/v1/docs/search',
			method: 'GET'
		},
		created_at: '2024-01-14T12:30:15Z',
		query: 'YAO workflow configuration',
		score: 0.85,
		metadata: {
			response_time: 78,
			results_count: 15,
			filtered: false
		}
	},
	{
		id: 'hit_011',
		scenario: '知识推荐',
		source: 'mobile_app',
		context: {
			user_id: 'user_202',
			device_id: 'device_xyz',
			platform: 'Android',
			version: '2.1.0'
		},
		created_at: '2024-01-14T11:15:40Z',
		query: 'YAO 表单验证规则',
		score: 0.82,
		metadata: {
			recommendations: 8,
			clicked: 3,
			engagement_rate: 0.375
		}
	},
	{
		id: 'hit_012',
		scenario: '智能问答',
		source: 'slack_bot',
		context: {
			query: 'How to debug YAO applications?',
			channel_id: 'C9876543210',
			team_id: 'T1234567890',
			user_id: 'U9988776655'
		},
		created_at: '2024-01-14T10:20:25Z',
		query: 'How to debug YAO applications?',
		score: 0.93,
		metadata: {
			response_time: 165,
			language: 'en',
			confidence: 0.91
		}
	},
	{
		id: 'hit_013',
		scenario: '文档检索',
		source: 'web_search',
		context: {
			query: 'YAO 插件开发指南',
			referer: 'https://yaoapps.com/plugins',
			search_type: 'semantic'
		},
		created_at: '2024-01-14T09:45:30Z',
		query: 'YAO 插件开发指南',
		score: 0.88,
		metadata: {
			results_count: 12,
			search_time: 52,
			cache_hit: true
		}
	},
	{
		id: 'hit_014',
		scenario: '知识推荐',
		source: 'email_digest',
		context: {
			user_id: 'user_303',
			email: 'developer@company.com',
			digest_type: 'daily',
			preferences: ['frontend', 'ui', 'components']
		},
		created_at: '2024-01-14T08:30:15Z',
		query: 'YAO 前端组件库使用',
		score: 0.77,
		metadata: {
			recommendations: 12,
			opened: true,
			click_through_rate: 0.25
		}
	},
	{
		id: 'hit_015',
		scenario: '智能问答',
		source: 'discord_bot',
		context: {
			query: 'YAO performance optimization tips?',
			guild_id: '987654321012345678',
			channel_id: '123456789098765432',
			user_id: 'U1122334455667788'
		},
		created_at: '2024-01-14T07:15:45Z',
		query: 'YAO performance optimization tips?',
		score: 0.9,
		metadata: {
			response_time: 145,
			thread_created: false,
			mentions: 1
		}
	},
	{
		id: 'hit_016',
		scenario: '文档检索',
		source: 'vscode_extension',
		context: {
			query: 'YAO API documentation',
			extension_version: '1.6.0',
			vscode_version: '1.86.0',
			workspace: 'yao-api-project'
		},
		created_at: '2024-01-14T06:40:20Z',
		query: 'YAO API documentation',
		score: 0.86,
		metadata: {
			results_count: 18,
			auto_complete: false,
			snippets_used: 4
		}
	},
	{
		id: 'hit_017',
		scenario: '智能问答',
		source: 'web_chat',
		context: {
			query: 'YAO 数据库迁移怎么做？',
			user_id: 'user_404',
			session_id: 'session_101',
			ip: '172.16.0.1',
			user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15'
		},
		created_at: '2024-01-14T05:25:10Z',
		query: 'YAO 数据库迁移怎么做？',
		score: 0.87,
		metadata: {
			response_time: 110,
			model: 'gpt-3.5-turbo',
			tokens: 420
		}
	},
	{
		id: 'hit_018',
		scenario: '文档检索',
		source: 'api_call',
		context: {
			query: 'YAO authentication system',
			api_key: 'ak_***789',
			endpoint: '/api/v2/search',
			method: 'POST'
		},
		created_at: '2024-01-14T04:15:35Z',
		query: 'YAO authentication system',
		score: 0.91,
		metadata: {
			response_time: 88,
			results_count: 9,
			filtered: true
		}
	},
	{
		id: 'hit_019',
		scenario: '知识推荐',
		source: 'mobile_app',
		context: {
			user_id: 'user_505',
			device_id: 'device_123',
			platform: 'iOS',
			version: '1.8.2'
		},
		created_at: '2024-01-14T03:45:25Z',
		query: 'YAO 权限管理系统',
		score: 0.84,
		metadata: {
			recommendations: 6,
			clicked: 4,
			engagement_rate: 0.67
		}
	},
	{
		id: 'hit_020',
		scenario: '智能问答',
		source: 'slack_bot',
		context: {
			query: 'Best practices for YAO development?',
			channel_id: 'C5555666677',
			team_id: 'T9999888877',
			user_id: 'U1111222233'
		},
		created_at: '2024-01-14T02:30:50Z',
		query: 'Best practices for YAO development?',
		score: 0.94,
		metadata: {
			response_time: 175,
			language: 'en',
			confidence: 0.88
		}
	},
	{
		id: 'hit_021',
		scenario: '文档检索',
		source: 'web_search',
		context: {
			query: 'YAO 微服务架构设计',
			referer: 'https://yaoapps.com/architecture',
			search_type: 'hybrid'
		},
		created_at: '2024-01-14T01:20:15Z',
		query: 'YAO 微服务架构设计',
		score: 0.89,
		metadata: {
			results_count: 14,
			search_time: 65,
			cache_hit: false
		}
	},
	{
		id: 'hit_022',
		scenario: '知识推荐',
		source: 'email_digest',
		context: {
			user_id: 'user_606',
			email: 'architect@tech.com',
			digest_type: 'weekly',
			preferences: ['architecture', 'microservices', 'scalability']
		},
		created_at: '2024-01-14T00:45:30Z',
		query: 'YAO 系统扩展性优化',
		score: 0.81,
		metadata: {
			recommendations: 15,
			opened: true,
			click_through_rate: 0.33
		}
	},
	{
		id: 'hit_023',
		scenario: '智能问答',
		source: 'discord_bot',
		context: {
			query: 'How to handle errors in YAO workflows?',
			guild_id: '111222333444555666',
			channel_id: '777888999000111222',
			user_id: 'U4444555566'
		},
		created_at: '2024-01-13T23:15:45Z',
		query: 'How to handle errors in YAO workflows?',
		score: 0.92,
		metadata: {
			response_time: 155,
			thread_created: true,
			mentions: 2
		}
	},
	{
		id: 'hit_024',
		scenario: '文档检索',
		source: 'vscode_extension',
		context: {
			query: 'YAO testing framework',
			extension_version: '1.7.1',
			vscode_version: '1.87.0',
			workspace: 'yao-testing-suite'
		},
		created_at: '2024-01-13T22:30:20Z',
		query: 'YAO testing framework',
		score: 0.85,
		metadata: {
			results_count: 11,
			auto_complete: true,
			snippets_used: 3
		}
	},
	{
		id: 'hit_025',
		scenario: '智能问答',
		source: 'web_chat',
		context: {
			query: 'YAO 国际化支持如何配置？',
			user_id: 'user_707',
			session_id: 'session_202',
			ip: '192.168.100.1',
			user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
		},
		created_at: '2024-01-13T21:45:10Z',
		query: 'YAO 国际化支持如何配置？',
		score: 0.88,
		metadata: {
			response_time: 125,
			model: 'gpt-4',
			tokens: 395
		}
	},
	{
		id: 'hit_026',
		scenario: '文档检索',
		source: 'api_call',
		context: {
			query: 'YAO deployment strategies',
			api_key: 'ak_***012',
			endpoint: '/api/v1/knowledge',
			method: 'GET'
		},
		created_at: '2024-01-13T20:20:35Z',
		query: 'YAO deployment strategies',
		score: 0.9,
		metadata: {
			response_time: 72,
			results_count: 16,
			filtered: false
		}
	},
	{
		id: 'hit_027',
		scenario: '知识推荐',
		source: 'mobile_app',
		context: {
			user_id: 'user_808',
			device_id: 'device_456',
			platform: 'Android',
			version: '2.2.1'
		},
		created_at: '2024-01-13T19:15:25Z',
		query: 'YAO 缓存策略配置',
		score: 0.83,
		metadata: {
			recommendations: 9,
			clicked: 5,
			engagement_rate: 0.56
		}
	},
	{
		id: 'hit_028',
		scenario: '智能问答',
		source: 'slack_bot',
		context: {
			query: 'YAO monitoring and logging setup?',
			channel_id: 'C3333444455',
			team_id: 'T7777888899',
			user_id: 'U2222333344'
		},
		created_at: '2024-01-13T18:40:15Z',
		query: 'YAO monitoring and logging setup?',
		score: 0.95,
		metadata: {
			response_time: 190,
			language: 'en',
			confidence: 0.93
		}
	},
	{
		id: 'hit_029',
		scenario: '文档检索',
		source: 'web_search',
		context: {
			query: 'YAO 安全配置最佳实践',
			referer: 'https://yaoapps.com/security',
			search_type: 'exact'
		},
		created_at: '2024-01-13T17:25:40Z',
		query: 'YAO 安全配置最佳实践',
		score: 0.91,
		metadata: {
			results_count: 8,
			search_time: 48,
			cache_hit: true
		}
	},
	{
		id: 'hit_030',
		scenario: '知识推荐',
		source: 'email_digest',
		context: {
			user_id: 'user_909',
			email: 'security@enterprise.com',
			digest_type: 'monthly',
			preferences: ['security', 'compliance', 'best-practices']
		},
		created_at: '2024-01-13T16:10:30Z',
		query: 'YAO 企业级安全合规',
		score: 0.86,
		metadata: {
			recommendations: 20,
			opened: true,
			click_through_rate: 0.45
		}
	}
]

// 生成更多Mock数据以测试分页
const generateMoreMockData = (): HitRecord[] => {
	const additionalData: HitRecord[] = []
	const scenarios = ['智能问答', '文档搜索', '知识推荐', '内容分析', '数据挖掘']
	const sources = ['web_chat', 'api_call', 'mobile_app', 'admin_panel', 'batch_job']
	const queries = [
		'如何使用YAO框架',
		'数据库连接配置',
		'API接口文档',
		'前端组件开发',
		'后端服务部署',
		'性能优化方案',
		'安全配置指南',
		'错误处理机制',
		'日志管理系统',
		'监控告警设置'
	]

	for (let i = 31; i <= 100; i++) {
		const scenario = scenarios[i % scenarios.length]
		const source = sources[i % sources.length]
		const query = queries[i % queries.length]

		additionalData.push({
			id: `hit_${i.toString().padStart(3, '0')}`,
			scenario,
			source,
			context: {
				query,
				user_id: `user_${Math.floor(i / 10)}`,
				session_id: `session_${i}`,
				timestamp: new Date(Date.now() - i * 3600000).toISOString(),
				ip_address: `192.168.1.${(i % 254) + 1}`,
				user_agent: 'Mozilla/5.0 (compatible; YAO-Bot/1.0)',
				response_time: Math.floor(Math.random() * 1000) + 100
			},
			score: Math.round((Math.random() * 0.5 + 0.4) * 100) / 100,
			created_at: new Date(Date.now() - i * 3600000).toISOString(),
			metadata: {
				recommendations: Math.floor(Math.random() * 50) + 1,
				opened: Math.random() > 0.3,
				click_through_rate: Math.round(Math.random() * 100) / 100
			}
		})
	}

	return additionalData
}

// 合并原始数据和生成的数据
export const allMockHitsData = [...mockHitsData, ...generateMoreMockData()]

console.log(`📊 Mock数据总量: ${allMockHitsData.length} 条`)

// 模拟 API 响应结构 (类似 ListDocuments)
export interface ListHitsRequest {
	page?: number
	pagesize?: number
	select?: string
	keywords?: string
	scenario?: string
	source?: string
	date_from?: string
	date_to?: string
	sort?: string
}

// 匹配 ListDocumentsResponse 的结构
export interface ListHitsResponse {
	data: HitRecord[]
	total: number // 总记录数
	page: number // 当前页
	pagesize: number // 每页大小
}

// 模拟分页获取 Hits 数据
export const mockListHits = async (request?: ListHitsRequest): Promise<ListHitsResponse> => {
	await new Promise((resolve) => setTimeout(resolve, 300)) // 模拟网络延迟

	const page = request?.page || 1
	const pagesize = request?.pagesize || 10
	const keywords = request?.keywords || ''
	const scenario = request?.scenario || ''
	const source = request?.source || ''

	// 过滤数据
	let filteredData = allMockHitsData

	if (keywords) {
		filteredData = filteredData.filter(
			(hit) =>
				hit.query?.toLowerCase().includes(keywords.toLowerCase()) ||
				JSON.stringify(hit.context).toLowerCase().includes(keywords.toLowerCase())
		)
	}

	if (scenario) {
		filteredData = filteredData.filter((hit) => hit.scenario === scenario)
	}

	if (source) {
		filteredData = filteredData.filter((hit) => hit.source === source)
	}

	// 排序
	if (request?.sort) {
		const [field, order] = request.sort.split(':')
		filteredData.sort((a, b) => {
			let aVal = (a as any)[field]
			let bVal = (b as any)[field]

			if (field === 'created_at') {
				aVal = new Date(aVal).getTime()
				bVal = new Date(bVal).getTime()
			}

			if (order === 'desc') {
				return bVal > aVal ? 1 : -1
			} else {
				return aVal > bVal ? 1 : -1
			}
		})
	}

	// 分页
	const total = filteredData.length
	const start = (page - 1) * pagesize
	const end = start + pagesize
	const data = filteredData.slice(start, end)

	console.log('🔍 Mock API Debug:', {
		request,
		total: filteredData.length,
		page,
		pagesize,
		start,
		end,
		dataLength: data.length,
		hasMore: end < filteredData.length
	})

	return {
		data,
		total: filteredData.length, // 返回过滤后的总数
		page,
		pagesize
	}
}
