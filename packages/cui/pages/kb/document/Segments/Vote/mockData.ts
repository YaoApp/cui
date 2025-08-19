import { VoteRecord } from '@/pages/kb/types'

// Mock Vote数据
export const mockVotesData: VoteRecord[] = Array.from({ length: 100 }, (_, index) => {
	const scenarios = ['智能问答', '文档检索', '知识推荐', '内容生成', '数据分析']
	const sources = ['web_chat', 'api_call', 'mobile_app', 'slack_bot', 'email_assistant']
	const queries = [
		'如何使用YAO框架创建API?',
		'YAO framework installation guide',
		'数据库连接配置',
		'What is the difference between YAO and other frameworks?',
		'用户权限管理设置',
		'API接口调试方法',
		'数据模型设计规范',
		'前端组件开发指南',
		'系统性能优化建议',
		'错误处理最佳实践'
	]

	const scenario = scenarios[index % scenarios.length]
	const source = sources[index % sources.length]
	const query = queries[index % queries.length]

	// 生成随机的好评和差评数
	const positiveVotes = Math.floor(Math.random() * 50) + 1
	const negativeVotes = Math.floor(Math.random() * 20)

	// 生成不同的context数据
	const contexts = [
		{
			query: query,
			user_id: `user_${Math.floor(Math.random() * 1000)}`,
			session_id: `session_${Math.floor(Math.random() * 10000)}`,
			ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
			user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
			vote_reason: '答案准确且详细',
			feedback: '非常有帮助的回答'
		},
		{
			query: query,
			api_key: `ak_${Math.random().toString(36).substr(2, 9)}`,
			endpoint: '/api/v1/search',
			method: 'POST',
			response_time: Math.floor(Math.random() * 1000) + 100,
			vote_type: 'positive'
		},
		{
			query: query,
			user_id: `user_${Math.floor(Math.random() * 1000)}`,
			device_id: `device_${Math.random().toString(36).substr(2, 9)}`,
			platform: 'iOS',
			version: '1.2.3',
			vote_score: Math.floor(Math.random() * 5) + 1
		},
		{
			query: query,
			channel: 'slack_integration',
			workspace_id: `W${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
			team_id: `T${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
			user_name: `user.${Math.floor(Math.random() * 1000)}`,
			vote_timestamp: new Date().toISOString()
		}
	]

	return {
		id: `vote_${(index + 1).toString().padStart(3, '0')}`,
		scenario,
		source,
		query,
		context: contexts[index % contexts.length],
		positive_votes: positiveVotes,
		negative_votes: negativeVotes,
		created_at: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
		metadata: {
			total_votes: positiveVotes + negativeVotes,
			vote_ratio: positiveVotes / (positiveVotes + negativeVotes),
			last_updated: new Date().toISOString()
		}
	}
})

// API响应类型
export interface ListVotesRequest {
	page?: number
	pagesize?: number
	scenario?: string
	source?: string
	query?: string
}

export interface ListVotesResponse {
	data: VoteRecord[]
	total: number
	page: number
	pagesize: number
}

// Mock API函数
export const mockListVotes = async (request: ListVotesRequest): Promise<ListVotesResponse> => {
	// 模拟网络延迟
	await new Promise((resolve) => setTimeout(resolve, 200))

	const { page = 1, pagesize = 10, scenario, source, query } = request

	// 过滤数据
	let filteredData = mockVotesData

	if (scenario) {
		filteredData = filteredData.filter((item) => item.scenario.toLowerCase().includes(scenario.toLowerCase()))
	}

	if (source) {
		filteredData = filteredData.filter((item) => item.source.toLowerCase().includes(source.toLowerCase()))
	}

	if (query) {
		filteredData = filteredData.filter((item) => item.query.toLowerCase().includes(query.toLowerCase()))
	}

	// 分页
	const start = (page - 1) * pagesize
	const end = start + pagesize
	const paginatedData = filteredData.slice(start, end)

	return {
		data: paginatedData,
		total: filteredData.length,
		page,
		pagesize
	}
}
