// Mission Control - Mock Data
// Based on yao/agent/robot/types and yao/agent/robot/api
// Robot names based on DESIGN.md scenarios - these are autonomous agents, not assistants

import type { RobotState, Execution, RobotConfig, ResultFile } from '../types'

// ==================== Helper: Dynamic Time ====================

// Base time when module loads - execution times are relative to this
const MODULE_LOAD_TIME = new Date()

// Generate fixed time relative to module load (for active executions)
const getRelativeTime = (minutesAgo: number): string => {
	const time = new Date(MODULE_LOAD_TIME)
	time.setMinutes(time.getMinutes() - minutesAgo)
	return time.toISOString()
}

// Generate future time relative to module load (for next_run)
const getFutureTime = (minutesLater: number): string => {
	const time = new Date(MODULE_LOAD_TIME)
	time.setMinutes(time.getMinutes() + minutesLater)
	return time.toISOString()
}

// ==================== i18n Name Mapping ====================

export const robotNames: Record<string, { en: string; cn: string }> = {
	robot_001: { en: 'SEO Content Specialist', cn: 'SEO内容专员' },
	robot_002: { en: 'Competitor Monitor', cn: '竞品监控员' },
	robot_003: { en: 'Industry Research Analyst', cn: '行业研究分析师' },
	robot_004: { en: 'Sales Research Assistant', cn: '销售研究助理' },
	robot_005: { en: 'Lead Qualification Specialist', cn: '线索资质专员' },
	robot_006: { en: 'Daily Report Generator', cn: '日报生成器' },
	robot_007: { en: 'Data Quality Monitor', cn: '数据质量监控' },
	robot_008: { en: 'Social Media Tracker', cn: '社媒追踪器' }
}

// Get display name by locale
export const getRobotDisplayName = (memberId: string, locale: string): string => {
	const names = robotNames[memberId]
	if (!names) return memberId
	return locale === 'zh-CN' ? names.cn : names.en
}

// ==================== Robot States ====================

export const mockRobots: RobotState[] = [
	{
		member_id: 'robot_001',
		team_id: 'team_001',
		name: 'seo-content-specialist',
		display_name: 'SEO Content Specialist', // Will be replaced by i18n
		description: 'Generate SEO-optimized articles and optimize content for AI search (GEO)',
		status: 'working',
		running: 2,
		max_running: 3,
		last_run: '2026-01-19T14:00:00Z',
		next_run: undefined,
		running_ids: ['exec_001', 'exec_002']
	},
	{
		member_id: 'robot_002',
		team_id: 'team_001',
		name: 'competitor-monitor',
		display_name: 'Competitor Monitor',
		description: 'Monitor competitor websites, track pricing updates, watch for product launches',
		status: 'idle',
		running: 0,
		max_running: 2,
		last_run: '2026-01-19T09:00:00Z',
		next_run: getFutureTime(45), // 45 minutes from now
		running_ids: []
	},
	{
		member_id: 'robot_003',
		team_id: 'team_001',
		name: 'industry-research-analyst',
		display_name: 'Industry Research Analyst',
		description: 'Continuously scan industry news and papers, extract insights, build knowledge base',
		status: 'error',
		running: 0,
		max_running: 2,
		last_run: '2026-01-19T12:00:00Z',
		next_run: undefined,
		running_ids: []
	},
	{
		member_id: 'robot_004',
		team_id: 'team_001',
		name: 'sales-research-assistant',
		display_name: 'Sales Research Assistant',
		description: 'Research prospects, prepare proposals, draft follow-up emails when assigned',
		status: 'paused',
		running: 0,
		max_running: 2,
		last_run: '2026-01-18T17:00:00Z',
		next_run: undefined,
		running_ids: []
	},
	{
		member_id: 'robot_005',
		team_id: 'team_001',
		name: 'lead-qualification-specialist',
		display_name: 'Lead Qualification Specialist',
		description: 'Process new leads, enrich data, score quality, route to sales',
		status: 'working',
		running: 1,
		max_running: 2,
		last_run: '2026-01-19T15:30:00Z',
		next_run: undefined,
		running_ids: ['exec_005']
	},
	{
		member_id: 'robot_006',
		team_id: 'team_001',
		name: 'daily-report-generator',
		display_name: 'Daily Report Generator',
		description: 'Generate daily/weekly business reports, analyze trends, alert on changes',
		status: 'idle',
		running: 0,
		max_running: 3,
		last_run: '2026-01-19T13:00:00Z',
		next_run: getFutureTime(120), // 2 hours from now
		running_ids: []
	},
	{
		member_id: 'robot_007',
		team_id: 'team_001',
		name: 'data-quality-monitor',
		display_name: 'Data Quality Monitor',
		description: 'Monitor data quality, detect anomalies, generate health reports',
		status: 'maintenance',
		running: 0,
		max_running: 2,
		last_run: '2026-01-18T10:00:00Z',
		next_run: undefined,
		running_ids: []
	},
	{
		member_id: 'robot_008',
		team_id: 'team_001',
		name: 'social-media-tracker',
		display_name: 'Social Media Tracker',
		description: 'Track brand mentions, analyze sentiment, monitor trending topics',
		status: 'working',
		running: 3,
		max_running: 5,
		last_run: '2026-01-19T14:45:00Z',
		next_run: undefined,
		running_ids: ['exec_008a', 'exec_008b', 'exec_008c']
	}
]

// ==================== Executions ====================

export const mockExecutions: Execution[] = [
	// ========== Robot 001: SEO Content Specialist (2 active) ==========
	{
		id: 'exec_001',
		member_id: 'robot_001',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'running',
		phase: 'run',
		start_time: getRelativeTime(3), // Started 3 minutes ago
		job_id: 'job_001',
		name: { en: 'Evening Content Generation', cn: '晚间内容生成' },
		current_task_name: { en: 'Writing article on cloud computing trends', cn: '撰写云计算趋势文章' },
		current: {
			task_index: 2,
			progress: '3/5'
		},
		tasks: [
			{ id: 't1', status: 'completed', order: 0, executor_type: 'assistant', executor_id: 'keyword-researcher', source: 'auto' },
			{ id: 't2', status: 'completed', order: 1, executor_type: 'mcp', executor_id: 'google-search.trends', source: 'auto' },
			{ id: 't3', status: 'running', order: 2, executor_type: 'assistant', executor_id: 'content-writer', source: 'auto' },
			{ id: 't4', status: 'pending', order: 3, executor_type: 'assistant', executor_id: 'seo-optimizer', source: 'auto' },
			{ id: 't5', status: 'pending', order: 4, executor_type: 'mcp', executor_id: 'cms.publish', source: 'auto' }
		]
	},
	{
		id: 'exec_002',
		member_id: 'robot_001',
		team_id: 'team_001',
		trigger_type: 'human',
		status: 'running',
		phase: 'tasks',
		start_time: getRelativeTime(45), // Started 45 minutes ago
		job_id: 'job_002',
		name: { en: 'Rewrite Product Page', cn: '重写产品页面' },
		current_task_name: { en: 'Planning content structure', cn: '规划内容结构' },
		current: {
			task_index: 0,
			progress: '0/3'
		}
	},
	{
		id: 'exec_003',
		member_id: 'robot_001',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: '2026-01-19T06:00:00Z',
		end_time: '2026-01-19T06:12:34Z',
		job_id: 'job_003',
		name: { en: 'Morning Content Generation', cn: '晨间内容生成' },
		delivery: {
			content: {
				summary: 'Published SEO article: "Complete Guide to AI App Development" - targeting 12 keywords',
				body: '## Article Published\n\nKeywords: AI app development, build AI apps, AI dev guide...\n\nWord count: 2500\nSections: 8\nFAQ schema: Added for GEO',
				attachments: [
					{ title: 'SEO Article.md', file: '__attachment://file_001' },
					{ title: 'Keyword Report.xlsx', file: '__attachment://file_002' }
				]
			},
			success: true,
			sent_at: '2026-01-19T06:12:40Z'
		}
	},

	// ========== Robot 002: Competitor Monitor (0 active, history only) ==========
	{
		id: 'exec_006',
		member_id: 'robot_002',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: '2026-01-19T14:00:00Z',
		end_time: '2026-01-19T14:08:00Z',
		job_id: 'job_006',
		name: { en: 'Competitor Price Scan', cn: '竞品价格扫描' },
		delivery: {
			content: {
				summary: '🚨 Competitor A cut enterprise price 20% - review needed',
				body: '## Competitor Alert\n\nCompetitor A pricing change detected:\n- Enterprise tier: -20%\n- Professional tier: unchanged\n\nRecommendation: Review our pricing strategy',
				attachments: [{ title: 'Pricing Analysis.pdf', file: '__attachment://file_003' }]
			},
			success: true,
			sent_at: '2026-01-19T14:08:10Z'
		}
	},
	{
		id: 'exec_007',
		member_id: 'robot_002',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: '2026-01-19T12:00:00Z',
		end_time: '2026-01-19T12:05:00Z',
		job_id: 'job_007',
		name: { en: 'Competitor Website Check', cn: '竞品网站检查' },
		delivery: {
			content: {
				summary: 'No significant changes detected',
				body: '## Scan Complete\n\nAll monitored competitors checked. No pricing or feature changes detected.',
				attachments: []
			},
			success: true,
			sent_at: '2026-01-19T12:05:10Z'
		}
	},

	// ========== Robot 003: Industry Research Analyst (error state) ==========
	{
		id: 'exec_004',
		member_id: 'robot_003',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'failed',
		phase: 'run',
		start_time: '2026-01-19T12:00:00Z',
		end_time: '2026-01-19T12:05:23Z',
		job_id: 'job_004',
		name: { en: 'Research Paper Scan', cn: '研究论文扫描' },
		current_task_name: { en: 'Fetching from arXiv API', cn: '从 arXiv API 获取数据' },
		error: 'arXiv API rate limit exceeded - will retry in next cycle'
	},
	{
		id: 'exec_010',
		member_id: 'robot_003',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: '2026-01-19T09:00:00Z',
		end_time: '2026-01-19T09:30:00Z',
		job_id: 'job_010',
		name: { en: 'Weekly Research Digest', cn: '每周研究摘要' },
		delivery: {
			content: {
				summary: 'Compiled 12 relevant papers on LLM advancements',
				body: '## Weekly Digest\n\n### Key Findings\n- Paper 1: Efficient fine-tuning methods\n- Paper 2: RAG improvements...',
				attachments: [{ title: 'Industry Insights Weekly.pdf', file: '__attachment://file_005' }]
			},
			success: true,
			sent_at: '2026-01-19T09:30:10Z'
		}
	},

	// ========== Robot 004: Sales Research Assistant (paused) ==========
	{
		id: 'exec_011',
		member_id: 'robot_004',
		team_id: 'team_001',
		trigger_type: 'human',
		status: 'cancelled',
		phase: 'tasks',
		start_time: '2026-01-18T16:00:00Z',
		end_time: '2026-01-18T17:00:00Z',
		job_id: 'job_011',
		name: { en: 'Research Acme Corp', cn: '研究 Acme 公司' }
	},

	// ========== Robot 005: Lead Qualification Specialist (1 active) ==========
	{
		id: 'exec_005',
		member_id: 'robot_005',
		team_id: 'team_001',
		trigger_type: 'event',
		status: 'running',
		phase: 'delivery',
		start_time: getRelativeTime(8), // Started 8 minutes ago
		job_id: 'job_005',
		name: { en: 'Process Lead: Sarah Chen @ TechCorp', cn: '处理线索：陈思雅 @ TechCorp' },
		current_task_name: { en: 'Sending notification to sales', cn: '发送通知给销售团队' },
		current: {
			task_index: 3,
			progress: '4/4'
		}
	},
	{
		id: 'exec_012',
		member_id: 'robot_005',
		team_id: 'team_001',
		trigger_type: 'event',
		status: 'completed',
		phase: 'delivery',
		start_time: '2026-01-19T14:00:00Z',
		end_time: '2026-01-19T14:05:00Z',
		job_id: 'job_012',
		name: { en: 'Process Lead: John Smith @ BigCorp', cn: '处理线索：John Smith @ BigCorp' },
		delivery: {
			content: {
				summary: 'Lead scored 85/100 (HOT) - Routed to Sales Team A',
				body: '## Lead Analysis\n\n**John Smith** - VP Engineering @ BigCorp\n\n### Score: 85/100 (HOT)\n\n- Company size: 500+\n- Budget authority: Yes\n- Timeline: Q1 2026',
				attachments: [{ title: 'Lead Score Report - BigCorp.pdf', file: '__attachment://file_004' }]
			},
			success: true,
			sent_at: '2026-01-19T14:05:10Z'
		}
	},

	// ========== Robot 006: Daily Report Generator (0 active) ==========
	{
		id: 'exec_013',
		member_id: 'robot_006',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: '2026-01-19T13:00:00Z',
		end_time: '2026-01-19T13:15:00Z',
		job_id: 'job_013',
		name: { en: 'Afternoon Sales Report', cn: '下午销售报告' },
		delivery: {
			content: {
				summary: 'Sales up 12% vs yesterday. 5 new deals closed.',
				body: '## Daily Sales Report\n\n### Summary\n- Total revenue: $45,230\n- New deals: 5\n- Pipeline value: $230,000',
				attachments: []
			},
			success: true,
			sent_at: '2026-01-19T13:15:10Z'
		}
	},

	// ========== Robot 008: Social Media Tracker (3 active) ==========
	{
		id: 'exec_008a',
		member_id: 'robot_008',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'running',
		phase: 'run',
		start_time: getRelativeTime(12), // Started 12 minutes ago
		job_id: 'job_008a',
		name: { en: 'Twitter Brand Scan', cn: 'Twitter 品牌扫描' },
		current_task_name: { en: 'Analyzing sentiment of 156 mentions', cn: '分析 156 条提及的情感' },
		current: {
			task_index: 2,
			progress: '2/4'
		}
	},
	{
		id: 'exec_008b',
		member_id: 'robot_008',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'running',
		phase: 'run',
		start_time: getRelativeTime(5), // Started 5 minutes ago
		job_id: 'job_008b',
		name: { en: 'LinkedIn Trend Analysis', cn: 'LinkedIn 趋势分析' },
		current_task_name: { en: 'Extracting industry insights', cn: '提取行业洞察' },
		current: {
			task_index: 1,
			progress: '1/3'
		}
	},
	{
		id: 'exec_008c',
		member_id: 'robot_008',
		team_id: 'team_001',
		trigger_type: 'human',
		status: 'running',
		phase: 'goals',
		start_time: getRelativeTime(0), // Just started
		job_id: 'job_008c',
		name: { en: 'Viral Content Analysis', cn: '病毒内容分析' },
		current_task_name: { en: 'Generating analysis goals', cn: '生成分析目标' },
		current: {
			task_index: 0,
			progress: '0/0'
		}
	}
]

// ==================== Robot Configs ====================

export const mockRobotConfigs: Record<string, RobotConfig> = {
	robot_001: {
		identity: {
			role: 'SEO/GEO Content Specialist',
			duties: [
				'Research trending keywords in our industry',
				'Generate SEO-optimized articles (2-3 per day)',
				'Optimize existing content for GEO (AI search)',
				'Track keyword rankings and adjust strategy'
			]
		},
		clock: {
			mode: 'times',
			times: ['06:00', '18:00'],
			days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
			tz: 'Asia/Shanghai'
		},
		quota: { max: 3, queue: 10, priority: 5 },
		resources: {
			agents: ['keyword-researcher', 'content-writer', 'seo-optimizer'],
			mcp: [
				{ id: 'google-search', tools: ['trends', 'rankings'] },
				{ id: 'cms', tools: ['create', 'update', 'publish'] }
			]
		},
		delivery: {
			notify: {
				enabled: true,
				channel: 'marketing-team'
			}
		}
	},
	robot_002: {
		identity: {
			role: 'Competitor Intelligence Analyst',
			duties: [
				'Monitor competitor websites for changes',
				'Track competitor pricing updates',
				'Watch for new product launches',
				'Alert team on significant changes'
			]
		},
		clock: {
			mode: 'interval',
			every: '2h',
			tz: 'Asia/Shanghai'
		},
		quota: { max: 2, queue: 5, priority: 7 },
		resources: {
			agents: ['web-scraper', 'diff-analyzer', 'report-writer'],
			mcp: [{ id: 'web-search', tools: ['search', 'news'] }]
		},
		delivery: {
			webhook: {
				enabled: true,
				url: 'https://slack.com/webhook/competitor-alerts'
			}
		}
	},
	robot_003: {
		identity: {
			role: 'Industry Research Analyst',
			duties: [
				'Continuously scan industry news and papers',
				'Analyze trends and extract key insights',
				'Identify emerging technologies and competitors',
				'Build and maintain industry knowledge base'
			]
		},
		clock: {
			mode: 'daemon',
			timeout: '10m',
			tz: 'Asia/Shanghai'
		},
		quota: { max: 2, queue: 10, priority: 4 },
		resources: {
			agents: ['content-reader', 'insight-extractor', 'report-writer'],
			mcp: [
				{ id: 'web-search', tools: ['search', 'news'] },
				{ id: 'arxiv', tools: ['search', 'fetch'] }
			]
		}
	},
	robot_005: {
		identity: {
			role: 'Lead Qualification Specialist',
			duties: [
				'Instantly process new leads',
				'Enrich lead data (company info, LinkedIn)',
				'Score lead quality (1-100)',
				'Route hot leads to sales immediately'
			]
		},
		events: [
			{ type: 'webhook', source: '/webhook/leads' },
			{ type: 'database', source: 'crm_leads', filter: { trigger: 'insert' } }
		],
		quota: { max: 2, queue: 20, priority: 9 },
		resources: {
			agents: ['data-enricher', 'lead-scorer'],
			mcp: [
				{ id: 'clearbit', tools: ['enrich'] },
				{ id: 'crm', tools: ['update', 'assign'] }
			]
		},
		delivery: {
			webhook: {
				enabled: true,
				url: 'https://slack.com/webhook/sales-leads'
			}
		}
	}
}

// ==================== Result Files ====================

export const mockResults: ResultFile[] = [
	{
		id: 'file_001',
		member_id: 'robot_001',
		execution_id: 'exec_003',
		name: 'SEO Article - AI App Development Guide.md',
		type: 'md',
		size: 24576,
		created_at: '2026-01-19T06:12:34Z',
		execution_name: 'Morning Content Generation'
	},
	{
		id: 'file_002',
		member_id: 'robot_001',
		execution_id: 'exec_003',
		name: 'Keyword Research Report.xlsx',
		type: 'xlsx',
		size: 156800,
		created_at: '2026-01-19T06:12:34Z',
		execution_name: 'Morning Content Generation'
	},
	{
		id: 'file_003',
		member_id: 'robot_002',
		execution_id: 'exec_002',
		name: 'Competitor Pricing Analysis.pdf',
		type: 'pdf',
		size: 452000,
		created_at: '2026-01-19T14:15:00Z',
		execution_name: 'Competitor A Price Change Alert'
	},
	{
		id: 'file_004',
		member_id: 'robot_005',
		execution_id: 'exec_005',
		name: 'Lead Score Report - BigCorp.pdf',
		type: 'pdf',
		size: 324560,
		created_at: '2026-01-19T15:45:00Z',
		execution_name: 'Lead Processing - John Smith'
	},
	{
		id: 'file_005',
		member_id: 'robot_003',
		execution_id: 'exec_003',
		name: 'Industry Insights Weekly.pdf',
		type: 'pdf',
		size: 1245600,
		created_at: '2026-01-19T09:30:00Z',
		execution_name: 'Weekly Research Digest'
	}
]

// ==================== Activity Feed ====================

export type ActivityType = 'completed' | 'file' | 'error' | 'started' | 'paused'

export interface Activity {
	id: string
	type: ActivityType
	member_id: string
	robot_name: { en: string; cn: string }
	title: { en: string; cn: string }
	description?: { en: string; cn: string }
	file_id?: string
	timestamp: string
}

export const mockActivities: Activity[] = [
	{
		id: 'act_001',
		type: 'completed',
		member_id: 'robot_001',
		robot_name: { en: 'SEO Content Specialist', cn: 'SEO内容专员' },
		title: { en: 'Completed "AI App Development Guide"', cn: '完成了 "AI应用开发指南"' },
		description: { en: '2500 words, 12 keywords targeted', cn: '2500字，覆盖12个关键词' },
		timestamp: '2026-01-19T17:02:00Z'
	},
	{
		id: 'act_002',
		type: 'file',
		member_id: 'robot_002',
		robot_name: { en: 'Competitor Monitor', cn: '竞品监控员' },
		title: { en: 'Generated Pricing Analysis Report', cn: '生成了价格分析报告' },
		file_id: 'file_003',
		timestamp: '2026-01-19T16:45:00Z'
	},
	{
		id: 'act_003',
		type: 'error',
		member_id: 'robot_003',
		robot_name: { en: 'Industry Research Analyst', cn: '行业研究分析师' },
		title: { en: 'Error: arXiv API rate limit', cn: '错误：arXiv API 限流' },
		description: { en: 'Will retry in next cycle', cn: '将在下一周期重试' },
		timestamp: '2026-01-19T16:30:00Z'
	},
	{
		id: 'act_004',
		type: 'completed',
		member_id: 'robot_005',
		robot_name: { en: 'Lead Qualification Specialist', cn: '线索资质专员' },
		title: { en: 'Processed lead: John Smith @ BigCorp', cn: '处理了线索：John Smith @ BigCorp' },
		description: { en: 'Score: 85/100 (HOT) - Routed to Sales', cn: '评分：85/100（高意向）- 已转销售' },
		timestamp: '2026-01-19T16:15:00Z'
	},
	{
		id: 'act_005',
		type: 'started',
		member_id: 'robot_008',
		robot_name: { en: 'Social Media Tracker', cn: '社媒追踪器' },
		title: { en: 'Started brand mention scan', cn: '开始品牌提及扫描' },
		timestamp: '2026-01-19T16:00:00Z'
	}
]

// Get recent activities
export const getRecentActivities = (limit: number = 10): Activity[] => {
	return mockActivities.slice(0, limit)
}

// ==================== Helper Functions ====================

// Get executions for a specific robot
export const getExecutionsForRobot = (memberId: string): Execution[] => {
	return mockExecutions.filter((exec) => exec.member_id === memberId)
}

// Get active executions for a robot
export const getActiveExecutions = (memberId: string): Execution[] => {
	return mockExecutions.filter(
		(exec) => exec.member_id === memberId && (exec.status === 'running' || exec.status === 'pending')
	)
}

// Get results for a robot
export const getResultsForRobot = (memberId: string): ResultFile[] => {
	return mockResults.filter((file) => file.member_id === memberId)
}

// Get config for a robot
export const getConfigForRobot = (memberId: string): RobotConfig | undefined => {
	return mockRobotConfigs[memberId]
}

// Calculate stats from robots
export const getRobotStats = (robots: RobotState[]) => {
	return {
		total: robots.length,
		working: robots.filter((r) => r.status === 'working').length,
		idle: robots.filter((r) => r.status === 'idle').length,
		error: robots.filter((r) => r.status === 'error').length,
		paused: robots.filter((r) => r.status === 'paused').length,
		maintenance: robots.filter((r) => r.status === 'maintenance').length
	}
}
