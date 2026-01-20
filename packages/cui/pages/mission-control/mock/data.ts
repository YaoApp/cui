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

// Helper: Generate past time for history records
const getPastTime = (daysAgo: number, hour: number, minute: number = 0): string => {
	const time = new Date(MODULE_LOAD_TIME)
	time.setDate(time.getDate() - daysAgo)
	time.setHours(hour, minute, 0, 0)
	return time.toISOString()
}

// Helper: Add duration to a start time
const addDuration = (startTime: string, minutes: number): string => {
	const time = new Date(startTime)
	time.setMinutes(time.getMinutes() + minutes)
	return time.toISOString()
}

export const mockExecutions: Execution[] = [
	// ==================== ACTIVE EXECUTIONS (running/pending) ====================

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
	},

	// ==================== HISTORY EXECUTIONS (completed/failed/cancelled) ====================

	// ========== Today (Day 0) ==========
	{
		id: 'exec_h001',
		member_id: 'robot_001',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(0, 6, 0),
		end_time: getPastTime(0, 6, 12),
		job_id: 'job_h001',
		name: { en: 'Morning Content Generation', cn: '晨间内容生成' },
		current: { task_index: 4, progress: '5/5' },
		goals: { content: '## Goals\n\n1. Write SEO article on AI app development\n2. Optimize for GEO search\n3. Publish to blog' },
		tasks: [
			{ id: 'th1', status: 'completed', order: 0, executor_type: 'assistant', executor_id: 'keyword-researcher', source: 'auto' },
			{ id: 'th2', status: 'completed', order: 1, executor_type: 'mcp', executor_id: 'google-search.trends', source: 'auto' },
			{ id: 'th3', status: 'completed', order: 2, executor_type: 'assistant', executor_id: 'content-writer', source: 'auto' },
			{ id: 'th4', status: 'completed', order: 3, executor_type: 'assistant', executor_id: 'seo-optimizer', source: 'auto' },
			{ id: 'th5', status: 'completed', order: 4, executor_type: 'mcp', executor_id: 'cms.publish', source: 'auto' }
		],
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
			sent_at: addDuration(getPastTime(0, 6, 12), 1)
		}
	},
	{
		id: 'exec_h002',
		member_id: 'robot_002',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(0, 8, 0),
		end_time: getPastTime(0, 8, 8),
		job_id: 'job_h002',
		name: { en: 'Morning Competitor Scan', cn: '晨间竞品扫描' },
		current: { task_index: 2, progress: '3/3' },
		delivery: {
			content: {
				summary: '🚨 Competitor A cut enterprise price 20% - review needed',
				body: '## Competitor Alert\n\nCompetitor A pricing change detected:\n- Enterprise tier: -20%\n- Professional tier: unchanged',
				attachments: [{ title: 'Pricing Analysis.pdf', file: '__attachment://file_003' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(0, 8, 8), 1)
		}
	},
	{
		id: 'exec_h003',
		member_id: 'robot_003',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'failed',
		phase: 'run',
		start_time: getPastTime(0, 9, 0),
		end_time: getPastTime(0, 9, 5),
		job_id: 'job_h003',
		name: { en: 'Research Paper Scan', cn: '研究论文扫描' },
		current_task_name: { en: 'Fetching from arXiv API', cn: '从 arXiv API 获取数据' },
		current: { task_index: 1, progress: '1/4' },
		error: 'arXiv API rate limit exceeded - will retry in next cycle'
	},
	{
		id: 'exec_h004',
		member_id: 'robot_005',
		team_id: 'team_001',
		trigger_type: 'event',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(0, 10, 30),
		end_time: getPastTime(0, 10, 35),
		job_id: 'job_h004',
		name: { en: 'Process Lead: John Smith @ BigCorp', cn: '处理线索：John Smith @ BigCorp' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'Lead scored 85/100 (HOT) - Routed to Sales Team A',
				body: '## Lead Analysis\n\n**John Smith** - VP Engineering @ BigCorp\n\n### Score: 85/100 (HOT)',
				attachments: [{ title: 'Lead Score Report.pdf', file: '__attachment://file_004' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(0, 10, 35), 1)
		}
	},
	{
		id: 'exec_h005',
		member_id: 'robot_006',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(0, 9, 0),
		end_time: getPastTime(0, 9, 15),
		job_id: 'job_h005',
		name: { en: 'Morning Sales Report', cn: '晨间销售报告' },
		current: { task_index: 2, progress: '3/3' },
		delivery: {
			content: {
				summary: 'Sales up 12% vs yesterday. 5 new deals closed.',
				body: '## Daily Sales Report\n\n- Total revenue: $45,230\n- New deals: 5\n- Pipeline value: $230,000',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(0, 9, 15), 1)
		}
	},
	{
		id: 'exec_h006',
		member_id: 'robot_008',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(0, 7, 0),
		end_time: getPastTime(0, 7, 20),
		job_id: 'job_h006',
		name: { en: 'Morning Social Scan', cn: '晨间社媒扫描' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: '23 brand mentions found, sentiment 78% positive',
				body: '## Social Media Report\n\nPlatforms scanned: Twitter, LinkedIn\n\n- Total mentions: 23\n- Positive: 78%\n- Neutral: 18%\n- Negative: 4%',
				attachments: [{ title: 'Social Report.pdf', file: '__attachment://file_006' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(0, 7, 20), 1)
		}
	},

	// ========== Yesterday (Day 1) ==========
	{
		id: 'exec_h007',
		member_id: 'robot_001',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(1, 6, 0),
		end_time: getPastTime(1, 6, 15),
		job_id: 'job_h007',
		name: { en: 'Morning Content Generation', cn: '晨间内容生成' },
		current: { task_index: 4, progress: '5/5' },
		delivery: {
			content: {
				summary: 'Published: "Top 10 Cloud Security Best Practices"',
				body: '## Article Published\n\nWord count: 2800\nKeywords targeted: 15',
				attachments: [{ title: 'Cloud Security Article.md', file: '__attachment://file_007' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(1, 6, 15), 1)
		}
	},
	{
		id: 'exec_h008',
		member_id: 'robot_001',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(1, 18, 0),
		end_time: getPastTime(1, 18, 10),
		job_id: 'job_h008',
		name: { en: 'Evening Content Generation', cn: '晚间内容生成' },
		current: { task_index: 4, progress: '5/5' },
		delivery: {
			content: {
				summary: 'Published: "Kubernetes vs Docker Swarm Comparison"',
				body: '## Article Published\n\nWord count: 3200\nKeywords targeted: 18',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(1, 18, 10), 1)
		}
	},
	{
		id: 'exec_h009',
		member_id: 'robot_002',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(1, 10, 0),
		end_time: getPastTime(1, 10, 5),
		job_id: 'job_h009',
		name: { en: 'Competitor Website Check', cn: '竞品网站检查' },
		current: { task_index: 2, progress: '3/3' },
		delivery: {
			content: {
				summary: 'No significant changes detected',
				body: '## Scan Complete\n\nAll monitored competitors checked.',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(1, 10, 5), 1)
		}
	},
	{
		id: 'exec_h010',
		member_id: 'robot_003',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(1, 9, 0),
		end_time: getPastTime(1, 9, 30),
		job_id: 'job_h010',
		name: { en: 'Daily Research Digest', cn: '每日研究摘要' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'Compiled 8 relevant papers on vector databases',
				body: '## Research Digest\n\n### Key Papers\n1. Vector DB performance benchmarks\n2. Hybrid search improvements',
				attachments: [{ title: 'Research Digest.pdf', file: '__attachment://file_008' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(1, 9, 30), 1)
		}
	},
	{
		id: 'exec_h011',
		member_id: 'robot_004',
		team_id: 'team_001',
		trigger_type: 'human',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(1, 14, 0),
		end_time: getPastTime(1, 14, 45),
		job_id: 'job_h011',
		name: { en: 'Research TechCorp Inc', cn: '研究 TechCorp 公司' },
		current: { task_index: 4, progress: '5/5' },
		delivery: {
			content: {
				summary: 'Completed company research for TechCorp Inc.',
				body: '## Company Profile\n\n**TechCorp Inc.**\n- Industry: Enterprise Software\n- Size: 500-1000 employees\n- Revenue: $50M-100M',
				attachments: [{ title: 'TechCorp Research.pdf', file: '__attachment://file_009' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(1, 14, 45), 1)
		}
	},
	{
		id: 'exec_h012',
		member_id: 'robot_005',
		team_id: 'team_001',
		trigger_type: 'event',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(1, 11, 20),
		end_time: getPastTime(1, 11, 25),
		job_id: 'job_h012',
		name: { en: 'Process Lead: Mike Johnson @ StartupXYZ', cn: '处理线索：Mike Johnson @ StartupXYZ' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'Lead scored 45/100 (WARM) - Added to nurture sequence',
				body: '## Lead Analysis\n\n**Mike Johnson** - CTO @ StartupXYZ\n\n### Score: 45/100 (WARM)',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(1, 11, 25), 1)
		}
	},
	{
		id: 'exec_h013',
		member_id: 'robot_006',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(1, 9, 0),
		end_time: getPastTime(1, 9, 12),
		job_id: 'job_h013',
		name: { en: 'Morning Sales Report', cn: '晨间销售报告' },
		current: { task_index: 2, progress: '3/3' },
		delivery: {
			content: {
				summary: 'Sales down 3% vs previous day. Pipeline healthy.',
				body: '## Daily Sales Report\n\n- Total revenue: $40,500\n- New deals: 3\n- Pipeline value: $245,000',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(1, 9, 12), 1)
		}
	},

	// ========== 2 Days Ago ==========
	{
		id: 'exec_h014',
		member_id: 'robot_001',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(2, 6, 0),
		end_time: getPastTime(2, 6, 18),
		job_id: 'job_h014',
		name: { en: 'Morning Content Generation', cn: '晨间内容生成' },
		current: { task_index: 4, progress: '5/5' },
		delivery: {
			content: {
				summary: 'Published: "Introduction to RAG Architecture"',
				body: '## Article Published\n\nWord count: 3500\nKeywords targeted: 20',
				attachments: [{ title: 'RAG Architecture.md', file: '__attachment://file_010' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(2, 6, 18), 1)
		}
	},
	{
		id: 'exec_h015',
		member_id: 'robot_002',
		team_id: 'team_001',
		trigger_type: 'human',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(2, 15, 0),
		end_time: getPastTime(2, 15, 30),
		job_id: 'job_h015',
		name: { en: 'Deep Dive: Competitor B New Feature', cn: '深入分析：竞品B新功能' },
		current: { task_index: 4, progress: '5/5' },
		delivery: {
			content: {
				summary: 'Analyzed Competitor B\'s new AI feature launch',
				body: '## Feature Analysis\n\n**Competitor B - AI Assistant Launch**\n\n- Feature set analysis\n- Pricing implications\n- Competitive response recommendations',
				attachments: [{ title: 'Competitor B Analysis.pdf', file: '__attachment://file_011' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(2, 15, 30), 1)
		}
	},
	{
		id: 'exec_h016',
		member_id: 'robot_003',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'failed',
		phase: 'run',
		start_time: getPastTime(2, 12, 0),
		end_time: getPastTime(2, 12, 3),
		job_id: 'job_h016',
		name: { en: 'Research Paper Scan', cn: '研究论文扫描' },
		current: { task_index: 0, progress: '0/4' },
		error: 'Network timeout while connecting to research database'
	},
	{
		id: 'exec_h017',
		member_id: 'robot_004',
		team_id: 'team_001',
		trigger_type: 'human',
		status: 'cancelled',
		phase: 'tasks',
		start_time: getPastTime(2, 16, 0),
		end_time: getPastTime(2, 17, 0),
		job_id: 'job_h017',
		name: { en: 'Research Acme Corp', cn: '研究 Acme 公司' },
		current: { task_index: 1, progress: '1/5' }
	},
	{
		id: 'exec_h018',
		member_id: 'robot_005',
		team_id: 'team_001',
		trigger_type: 'event',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(2, 9, 15),
		end_time: getPastTime(2, 9, 20),
		job_id: 'job_h018',
		name: { en: 'Process Lead: Lisa Wang @ MegaCorp', cn: '处理线索：王丽莎 @ MegaCorp' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'Lead scored 92/100 (HOT) - Urgent: Routed to Sales Director',
				body: '## Lead Analysis\n\n**Lisa Wang** - VP Engineering @ MegaCorp\n\n### Score: 92/100 (HOT)\n\n- Company size: 1000+\n- Budget: $100K+\n- Timeline: Immediate',
				attachments: [{ title: 'MegaCorp Lead Report.pdf', file: '__attachment://file_012' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(2, 9, 20), 1)
		}
	},
	{
		id: 'exec_h019',
		member_id: 'robot_006',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(2, 17, 0),
		end_time: getPastTime(2, 17, 20),
		job_id: 'job_h019',
		name: { en: 'Weekly Summary Report', cn: '周汇总报告' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'Weekly performance: Revenue up 8%, 12 new customers',
				body: '## Weekly Summary\n\n### Highlights\n- Revenue: +8%\n- New customers: 12\n- Churn: 2\n- NPS: 72',
				attachments: [{ title: 'Weekly Report.pdf', file: '__attachment://file_013' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(2, 17, 20), 1)
		}
	},

	// ========== 3 Days Ago ==========
	{
		id: 'exec_h020',
		member_id: 'robot_001',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(3, 6, 0),
		end_time: getPastTime(3, 6, 14),
		job_id: 'job_h020',
		name: { en: 'Morning Content Generation', cn: '晨间内容生成' },
		current: { task_index: 4, progress: '5/5' },
		delivery: {
			content: {
				summary: 'Published: "LLM Fine-tuning Best Practices"',
				body: '## Article Published\n\nWord count: 2900\nKeywords targeted: 14',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(3, 6, 14), 1)
		}
	},
	{
		id: 'exec_h021',
		member_id: 'robot_002',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(3, 8, 0),
		end_time: getPastTime(3, 8, 6),
		job_id: 'job_h021',
		name: { en: 'Competitor Price Scan', cn: '竞品价格扫描' },
		current: { task_index: 2, progress: '3/3' },
		delivery: {
			content: {
				summary: 'No pricing changes detected',
				body: '## Scan Complete\n\nAll competitor pricing unchanged.',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(3, 8, 6), 1)
		}
	},
	{
		id: 'exec_h022',
		member_id: 'robot_003',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(3, 9, 0),
		end_time: getPastTime(3, 9, 35),
		job_id: 'job_h022',
		name: { en: 'Weekly Research Digest', cn: '每周研究摘要' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'Compiled 15 papers on multimodal AI systems',
				body: '## Weekly Digest\n\n### Focus Area: Multimodal AI\n\n- Vision-language models\n- Audio understanding\n- Cross-modal transfer',
				attachments: [{ title: 'Weekly Research.pdf', file: '__attachment://file_014' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(3, 9, 35), 1)
		}
	},
	{
		id: 'exec_h023',
		member_id: 'robot_005',
		team_id: 'team_001',
		trigger_type: 'event',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(3, 14, 0),
		end_time: getPastTime(3, 14, 4),
		job_id: 'job_h023',
		name: { en: 'Process Lead: David Kim @ DataInc', cn: '处理线索：David Kim @ DataInc' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'Lead scored 62/100 (WARM) - Added to sales sequence',
				body: '## Lead Analysis\n\n**David Kim** - Director @ DataInc\n\n### Score: 62/100 (WARM)',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(3, 14, 4), 1)
		}
	},
	{
		id: 'exec_h024',
		member_id: 'robot_008',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(3, 7, 0),
		end_time: getPastTime(3, 7, 25),
		job_id: 'job_h024',
		name: { en: 'Morning Social Scan', cn: '晨间社媒扫描' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: '45 brand mentions, sentiment 82% positive. Viral thread detected.',
				body: '## Social Media Report\n\n### Viral Alert\nThread about our product reached 50K views',
				attachments: [{ title: 'Social Report.pdf', file: '__attachment://file_015' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(3, 7, 25), 1)
		}
	},

	// ========== 4-7 Days Ago (More history for pagination) ==========
	{
		id: 'exec_h025',
		member_id: 'robot_001',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(4, 6, 0),
		end_time: getPastTime(4, 6, 12),
		job_id: 'job_h025',
		name: { en: 'Morning Content: API Design', cn: '晨间内容：API 设计' },
		current: { task_index: 4, progress: '5/5' },
		delivery: {
			content: {
				summary: 'Published: "RESTful API Design Patterns"',
				body: '## Article Published\n\nWord count: 2600',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(4, 6, 12), 1)
		}
	},
	{
		id: 'exec_h026',
		member_id: 'robot_002',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(4, 10, 0),
		end_time: getPastTime(4, 10, 8),
		job_id: 'job_h026',
		name: { en: 'Competitor Feature Scan', cn: '竞品功能扫描' },
		current: { task_index: 2, progress: '3/3' },
		delivery: {
			content: {
				summary: 'Competitor C launched new dashboard feature',
				body: '## Feature Update Detected\n\nCompetitor C: New analytics dashboard',
				attachments: [{ title: 'Feature Analysis.pdf', file: '__attachment://file_016' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(4, 10, 8), 1)
		}
	},
	{
		id: 'exec_h027',
		member_id: 'robot_005',
		team_id: 'team_001',
		trigger_type: 'event',
		status: 'failed',
		phase: 'run',
		start_time: getPastTime(4, 15, 0),
		end_time: getPastTime(4, 15, 2),
		job_id: 'job_h027',
		name: { en: 'Process Lead: Unknown Contact', cn: '处理线索：未知联系人' },
		current: { task_index: 1, progress: '1/4' },
		error: 'Invalid email format in lead data'
	},
	{
		id: 'exec_h028',
		member_id: 'robot_006',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(5, 9, 0),
		end_time: getPastTime(5, 9, 18),
		job_id: 'job_h028',
		name: { en: 'Morning Sales Report', cn: '晨间销售报告' },
		current: { task_index: 2, progress: '3/3' },
		delivery: {
			content: {
				summary: 'Record day: Revenue up 25%, 8 new deals',
				body: '## Sales Report\n\n### Record Performance\n- Revenue: $58,000\n- New deals: 8',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(5, 9, 18), 1)
		}
	},
	{
		id: 'exec_h029',
		member_id: 'robot_001',
		team_id: 'team_001',
		trigger_type: 'human',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(5, 14, 0),
		end_time: getPastTime(5, 14, 25),
		job_id: 'job_h029',
		name: { en: 'Urgent: Press Release Draft', cn: '紧急：新闻稿草稿' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'Drafted press release for product launch',
				body: '## Press Release\n\nDraft completed for marketing review.',
				attachments: [{ title: 'Press Release Draft.md', file: '__attachment://file_017' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(5, 14, 25), 1)
		}
	},
	{
		id: 'exec_h030',
		member_id: 'robot_003',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(6, 9, 0),
		end_time: getPastTime(6, 9, 40),
		job_id: 'job_h030',
		name: { en: 'Industry News Digest', cn: '行业新闻摘要' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: '12 key industry updates compiled',
				body: '## Industry News\n\n### Key Updates\n1. Major acquisition announced\n2. New regulations proposed',
				attachments: [{ title: 'News Digest.pdf', file: '__attachment://file_018' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(6, 9, 40), 1)
		}
	},
	{
		id: 'exec_h031',
		member_id: 'robot_008',
		team_id: 'team_001',
		trigger_type: 'human',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(6, 11, 0),
		end_time: getPastTime(6, 11, 35),
		job_id: 'job_h031',
		name: { en: 'Competitor Social Analysis', cn: '竞品社媒分析' },
		current: { task_index: 4, progress: '5/5' },
		delivery: {
			content: {
				summary: 'Analyzed competitor social media presence',
				body: '## Competitor Social Analysis\n\n### Findings\n- Competitor A: 2x engagement rate\n- Competitor B: New campaign launched',
				attachments: [{ title: 'Social Competitive Analysis.pdf', file: '__attachment://file_019' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(6, 11, 35), 1)
		}
	},
	{
		id: 'exec_h032',
		member_id: 'robot_004',
		team_id: 'team_001',
		trigger_type: 'human',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(7, 10, 0),
		end_time: getPastTime(7, 10, 50),
		job_id: 'job_h032',
		name: { en: 'Prospect Research: GlobalTech', cn: '客户研究：GlobalTech' },
		current: { task_index: 4, progress: '5/5' },
		delivery: {
			content: {
				summary: 'Completed comprehensive research on GlobalTech',
				body: '## Company Profile\n\n**GlobalTech**\n- Industry: Enterprise Software\n- Employees: 2000+\n- Recent funding: $50M Series C',
				attachments: [{ title: 'GlobalTech Research.pdf', file: '__attachment://file_020' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(7, 10, 50), 1)
		}
	},
	{
		id: 'exec_h033',
		member_id: 'robot_005',
		team_id: 'team_001',
		trigger_type: 'event',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(7, 16, 0),
		end_time: getPastTime(7, 16, 5),
		job_id: 'job_h033',
		name: { en: 'Process Lead: Emma Davis @ CloudCorp', cn: '处理线索：Emma Davis @ CloudCorp' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'Lead scored 78/100 (HOT) - Routed to Sales',
				body: '## Lead Analysis\n\n**Emma Davis** - CTO @ CloudCorp\n\n### Score: 78/100',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(7, 16, 5), 1)
		}
	},
	{
		id: 'exec_h034',
		member_id: 'robot_006',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(7, 17, 0),
		end_time: getPastTime(7, 17, 25),
		job_id: 'job_h034',
		name: { en: 'Weekly Performance Report', cn: '周绩效报告' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'Strong week: All KPIs exceeded',
				body: '## Weekly Report\n\n### KPI Summary\n- Revenue: 115% of target\n- Leads: 120% of target\n- Conversion: 12% (up from 10%)',
				attachments: [{ title: 'Weekly KPI Report.pdf', file: '__attachment://file_021' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(7, 17, 25), 1)
		}
	},

	// ==================== MORE DATA FOR robot_004 (Sales Research) ====================
	{
		id: 'exec_h035',
		member_id: 'robot_004',
		team_id: 'team_001',
		trigger_type: 'human',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(1, 10, 0),
		end_time: getPastTime(1, 10, 45),
		job_id: 'job_h035',
		name: { en: 'Research: InnovateTech Inc', cn: '研究：InnovateTech 公司' },
		current: { task_index: 4, progress: '5/5' },
		delivery: {
			content: {
				summary: 'Complete profile for InnovateTech - Series B startup, strong growth',
				body: '## Company Profile\n\n**InnovateTech Inc**\n- Industry: AI/ML\n- Size: 200 employees\n- Growth: 150% YoY',
				attachments: [{ title: 'InnovateTech Profile.pdf', file: '__attachment://file_022' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(1, 10, 45), 1)
		}
	},
	{
		id: 'exec_h036',
		member_id: 'robot_004',
		team_id: 'team_001',
		trigger_type: 'human',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(3, 14, 0),
		end_time: getPastTime(3, 14, 35),
		job_id: 'job_h036',
		name: { en: 'Draft Proposal: MegaCorp', cn: '起草提案：MegaCorp' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'Proposal draft ready for MegaCorp enterprise deal',
				body: '## Proposal Draft\n\nCustomized enterprise solution for MegaCorp',
				attachments: [{ title: 'MegaCorp Proposal v1.pdf', file: '__attachment://file_023' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(3, 14, 35), 1)
		}
	},
	{
		id: 'exec_h037',
		member_id: 'robot_004',
		team_id: 'team_001',
		trigger_type: 'human',
		status: 'failed',
		phase: 'run',
		start_time: getPastTime(4, 11, 0),
		end_time: getPastTime(4, 11, 5),
		job_id: 'job_h037',
		name: { en: 'Research: PrivateCorp Ltd', cn: '研究：PrivateCorp 公司' },
		current: { task_index: 1, progress: '1/5' },
		error: 'Company website blocked - requires VPN access'
	},
	{
		id: 'exec_h038',
		member_id: 'robot_004',
		team_id: 'team_001',
		trigger_type: 'human',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(5, 9, 0),
		end_time: getPastTime(5, 9, 40),
		job_id: 'job_h038',
		name: { en: 'Follow-up Email: TechStart', cn: '跟进邮件：TechStart' },
		current: { task_index: 2, progress: '3/3' },
		delivery: {
			content: {
				summary: 'Drafted personalized follow-up email for TechStart CEO',
				body: '## Email Draft\n\nPersonalized follow-up based on recent conversation',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(5, 9, 40), 1)
		}
	},
	{
		id: 'exec_h039',
		member_id: 'robot_004',
		team_id: 'team_001',
		trigger_type: 'human',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(6, 15, 0),
		end_time: getPastTime(6, 15, 55),
		job_id: 'job_h039',
		name: { en: 'Competitive Analysis: CloudVendor', cn: '竞争分析：CloudVendor' },
		current: { task_index: 4, progress: '5/5' },
		delivery: {
			content: {
				summary: 'CloudVendor competitive analysis for sales pitch',
				body: '## Competitive Analysis\n\nCloudVendor vs Our Solution comparison',
				attachments: [{ title: 'CloudVendor Comparison.pdf', file: '__attachment://file_024' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(6, 15, 55), 1)
		}
	},
	{
		id: 'exec_h040',
		member_id: 'robot_004',
		team_id: 'team_001',
		trigger_type: 'human',
		status: 'cancelled',
		phase: 'goals',
		start_time: getPastTime(8, 10, 0),
		end_time: getPastTime(8, 10, 15),
		job_id: 'job_h040',
		name: { en: 'Research: OldCorp (Cancelled)', cn: '研究：OldCorp（已取消）' },
		current: { task_index: 0, progress: '0/5' }
	},
	{
		id: 'exec_h041',
		member_id: 'robot_004',
		team_id: 'team_001',
		trigger_type: 'human',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(9, 14, 0),
		end_time: getPastTime(9, 14, 30),
		job_id: 'job_h041',
		name: { en: 'Research: FinanceGroup', cn: '研究：FinanceGroup' },
		current: { task_index: 4, progress: '5/5' },
		delivery: {
			content: {
				summary: 'FinanceGroup profile complete - Fortune 500, conservative buyer',
				body: '## Company Profile\n\nConservative enterprise buyer profile',
				attachments: [{ title: 'FinanceGroup Profile.pdf', file: '__attachment://file_025' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(9, 14, 30), 1)
		}
	},
	{
		id: 'exec_h042',
		member_id: 'robot_004',
		team_id: 'team_001',
		trigger_type: 'human',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(10, 11, 0),
		end_time: getPastTime(10, 11, 25),
		job_id: 'job_h042',
		name: { en: 'Prepare Demo: HealthTech', cn: '准备演示：HealthTech' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'Demo materials prepared for HealthTech meeting',
				body: '## Demo Prep\n\nCustomized demo for healthcare use case',
				attachments: [{ title: 'HealthTech Demo.pdf', file: '__attachment://file_026' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(10, 11, 25), 1)
		}
	},

	// ==================== MORE DATA FOR robot_006 (Daily Report) ====================
	{
		id: 'exec_h043',
		member_id: 'robot_006',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(1, 17, 0),
		end_time: getPastTime(1, 17, 15),
		job_id: 'job_h043',
		name: { en: 'Evening Sales Report', cn: '晚间销售报告' },
		current: { task_index: 2, progress: '3/3' },
		delivery: {
			content: {
				summary: 'Daily close: $42,500 revenue, 4 deals closed',
				body: '## Evening Report\n\n- Revenue: $42,500\n- Deals: 4',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(1, 17, 15), 1)
		}
	},
	{
		id: 'exec_h044',
		member_id: 'robot_006',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(3, 9, 0),
		end_time: getPastTime(3, 9, 12),
		job_id: 'job_h044',
		name: { en: 'Morning Sales Report', cn: '晨间销售报告' },
		current: { task_index: 2, progress: '3/3' },
		delivery: {
			content: {
				summary: 'Morning update: Pipeline at $350K, 3 hot leads',
				body: '## Morning Report\n\n- Pipeline: $350K\n- Hot leads: 3',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(3, 9, 12), 1)
		}
	},
	{
		id: 'exec_h045',
		member_id: 'robot_006',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'failed',
		phase: 'run',
		start_time: getPastTime(4, 9, 0),
		end_time: getPastTime(4, 9, 3),
		job_id: 'job_h045',
		name: { en: 'Morning Sales Report', cn: '晨间销售报告' },
		current: { task_index: 0, progress: '0/3' },
		error: 'CRM API temporarily unavailable'
	},
	{
		id: 'exec_h046',
		member_id: 'robot_006',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(4, 17, 0),
		end_time: getPastTime(4, 17, 18),
		job_id: 'job_h046',
		name: { en: 'Evening Sales Report', cn: '晚间销售报告' },
		current: { task_index: 2, progress: '3/3' },
		delivery: {
			content: {
				summary: 'Strong finish: $55,000 daily revenue',
				body: '## Evening Report\n\n- Revenue: $55,000\n- Best day this week',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(4, 17, 18), 1)
		}
	},
	{
		id: 'exec_h047',
		member_id: 'robot_006',
		team_id: 'team_001',
		trigger_type: 'human',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(5, 15, 0),
		end_time: getPastTime(5, 15, 30),
		job_id: 'job_h047',
		name: { en: 'Custom Report: Q4 Analysis', cn: '自定义报告：Q4分析' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'Q4 performance analysis complete',
				body: '## Q4 Analysis\n\nComprehensive quarterly review',
				attachments: [{ title: 'Q4 Analysis Report.pdf', file: '__attachment://file_027' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(5, 15, 30), 1)
		}
	},
	{
		id: 'exec_h048',
		member_id: 'robot_006',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(6, 9, 0),
		end_time: getPastTime(6, 9, 14),
		job_id: 'job_h048',
		name: { en: 'Morning Sales Report', cn: '晨间销售报告' },
		current: { task_index: 2, progress: '3/3' },
		delivery: {
			content: {
				summary: 'Slow start: $12,000, focus on follow-ups',
				body: '## Morning Report\n\n- Revenue: $12,000\n- Action: Follow up on pending deals',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(6, 9, 14), 1)
		}
	},
	{
		id: 'exec_h049',
		member_id: 'robot_006',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(8, 9, 0),
		end_time: getPastTime(8, 9, 16),
		job_id: 'job_h049',
		name: { en: 'Morning Sales Report', cn: '晨间销售报告' },
		current: { task_index: 2, progress: '3/3' },
		delivery: {
			content: {
				summary: 'Monday start: New week, fresh pipeline',
				body: '## Morning Report\n\n- New opportunities: 15\n- Follow-ups scheduled: 8',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(8, 9, 16), 1)
		}
	},
	{
		id: 'exec_h050',
		member_id: 'robot_006',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(9, 17, 0),
		end_time: getPastTime(9, 17, 20),
		job_id: 'job_h050',
		name: { en: 'Weekly Summary Report', cn: '周汇总报告' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'Best week: Revenue +15%, NPS at 78',
				body: '## Weekly Summary\n\nExceptional performance across all metrics',
				attachments: [{ title: 'Weekly Summary.pdf', file: '__attachment://file_028' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(9, 17, 20), 1)
		}
	},

	// ==================== MORE DATA FOR robot_007 (Data Quality) ====================
	{
		id: 'exec_h051',
		member_id: 'robot_007',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(0, 3, 0),
		end_time: getPastTime(0, 3, 15),
		job_id: 'job_h051',
		name: { en: 'Nightly Data Quality Check', cn: '夜间数据质量检查' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'All checks passed. Data quality: 99.2%',
				body: '## Data Quality Report\n\n- Records scanned: 1.2M\n- Issues found: 0\n- Quality score: 99.2%',
				attachments: [{ title: 'Quality Report.pdf', file: '__attachment://file_029' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(0, 3, 15), 1)
		}
	},
	{
		id: 'exec_h052',
		member_id: 'robot_007',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(1, 3, 0),
		end_time: getPastTime(1, 3, 18),
		job_id: 'job_h052',
		name: { en: 'Nightly Data Quality Check', cn: '夜间数据质量检查' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: '⚠️ 23 duplicate records found - auto-merged',
				body: '## Data Quality Report\n\n- Duplicates found: 23\n- Action: Auto-merged\n- Quality score: 98.8%',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(1, 3, 18), 1)
		}
	},
	{
		id: 'exec_h053',
		member_id: 'robot_007',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'failed',
		phase: 'run',
		start_time: getPastTime(2, 3, 0),
		end_time: getPastTime(2, 3, 5),
		job_id: 'job_h053',
		name: { en: 'Nightly Data Quality Check', cn: '夜间数据质量检查' },
		current: { task_index: 1, progress: '1/4' },
		error: 'Database connection timeout - maintenance window'
	},
	{
		id: 'exec_h054',
		member_id: 'robot_007',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(3, 3, 0),
		end_time: getPastTime(3, 3, 20),
		job_id: 'job_h054',
		name: { en: 'Nightly Data Quality Check', cn: '夜间数据质量检查' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'Clean scan. No anomalies detected.',
				body: '## Data Quality Report\n\n- All checks passed\n- Quality score: 99.5%',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(3, 3, 20), 1)
		}
	},
	{
		id: 'exec_h055',
		member_id: 'robot_007',
		team_id: 'team_001',
		trigger_type: 'human',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(4, 10, 0),
		end_time: getPastTime(4, 10, 45),
		job_id: 'job_h055',
		name: { en: 'Full Database Audit', cn: '全量数据库审计' },
		current: { task_index: 4, progress: '5/5' },
		delivery: {
			content: {
				summary: 'Comprehensive audit complete. 5 tables need attention.',
				body: '## Database Audit\n\n- Tables scanned: 127\n- Issues: 5 tables with stale data\n- Recommendations included',
				attachments: [{ title: 'Database Audit Report.pdf', file: '__attachment://file_030' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(4, 10, 45), 1)
		}
	},
	{
		id: 'exec_h056',
		member_id: 'robot_007',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(5, 3, 0),
		end_time: getPastTime(5, 3, 12),
		job_id: 'job_h056',
		name: { en: 'Nightly Data Quality Check', cn: '夜间数据质量检查' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'All clear. Performance optimized.',
				body: '## Data Quality Report\n\n- Quality score: 99.7%\n- Query performance: +12%',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(5, 3, 12), 1)
		}
	},
	{
		id: 'exec_h057',
		member_id: 'robot_007',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(6, 3, 0),
		end_time: getPastTime(6, 3, 16),
		job_id: 'job_h057',
		name: { en: 'Nightly Data Quality Check', cn: '夜间数据质量检查' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: '🚨 Anomaly detected in user_events table',
				body: '## Data Quality Report\n\n- Anomaly: Spike in null values\n- Table: user_events\n- Action: Alerted data team',
				attachments: [{ title: 'Anomaly Report.pdf', file: '__attachment://file_031' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(6, 3, 16), 1)
		}
	},
	{
		id: 'exec_h058',
		member_id: 'robot_007',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(7, 3, 0),
		end_time: getPastTime(7, 3, 14),
		job_id: 'job_h058',
		name: { en: 'Nightly Data Quality Check', cn: '夜间数据质量检查' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'Normal operations. Quality maintained.',
				body: '## Data Quality Report\n\n- Quality score: 99.3%\n- No action required',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(7, 3, 14), 1)
		}
	},
	{
		id: 'exec_h059',
		member_id: 'robot_007',
		team_id: 'team_001',
		trigger_type: 'human',
		status: 'cancelled',
		phase: 'tasks',
		start_time: getPastTime(8, 14, 0),
		end_time: getPastTime(8, 14, 10),
		job_id: 'job_h059',
		name: { en: 'Custom Schema Validation', cn: '自定义架构验证' },
		current: { task_index: 1, progress: '1/5' }
	},
	{
		id: 'exec_h060',
		member_id: 'robot_007',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(9, 3, 0),
		end_time: getPastTime(9, 3, 18),
		job_id: 'job_h060',
		name: { en: 'Nightly Data Quality Check', cn: '夜间数据质量检查' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'Weekly best: 99.8% quality score',
				body: '## Data Quality Report\n\n- Quality score: 99.8%\n- Best of the week',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(9, 3, 18), 1)
		}
	},

	// ==================== MORE DATA FOR robot_008 (Social Media) ====================
	{
		id: 'exec_h061',
		member_id: 'robot_008',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(1, 12, 0),
		end_time: getPastTime(1, 12, 20),
		job_id: 'job_h061',
		name: { en: 'Midday Social Scan', cn: '午间社媒扫描' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: '18 mentions, 85% positive. CEO tweet viral.',
				body: '## Social Report\n\n- CEO tweet: 5K retweets\n- Sentiment: 85% positive',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(1, 12, 20), 1)
		}
	},
	{
		id: 'exec_h062',
		member_id: 'robot_008',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(2, 7, 0),
		end_time: getPastTime(2, 7, 22),
		job_id: 'job_h062',
		name: { en: 'Morning Social Scan', cn: '晨间社媒扫描' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: '32 mentions overnight, product launch buzz',
				body: '## Social Report\n\n- Launch mentions: 32\n- Sentiment: 78% positive',
				attachments: [{ title: 'Launch Buzz Report.pdf', file: '__attachment://file_032' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(2, 7, 22), 1)
		}
	},
	{
		id: 'exec_h063',
		member_id: 'robot_008',
		team_id: 'team_001',
		trigger_type: 'event',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(2, 15, 0),
		end_time: getPastTime(2, 15, 10),
		job_id: 'job_h063',
		name: { en: 'Crisis Alert: Negative Thread', cn: '危机预警：负面帖子' },
		current: { task_index: 2, progress: '3/3' },
		delivery: {
			content: {
				summary: '🚨 Negative thread detected - 500+ views. PR notified.',
				body: '## Crisis Alert\n\n- Thread: Customer complaint\n- Views: 500+\n- Action: PR team notified',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(2, 15, 10), 1)
		}
	},
	{
		id: 'exec_h064',
		member_id: 'robot_008',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'failed',
		phase: 'run',
		start_time: getPastTime(4, 7, 0),
		end_time: getPastTime(4, 7, 3),
		job_id: 'job_h064',
		name: { en: 'Morning Social Scan', cn: '晨间社媒扫描' },
		current: { task_index: 0, progress: '0/4' },
		error: 'Twitter API rate limit exceeded'
	},
	{
		id: 'exec_h065',
		member_id: 'robot_008',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(5, 7, 0),
		end_time: getPastTime(5, 7, 25),
		job_id: 'job_h065',
		name: { en: 'Morning Social Scan', cn: '晨间社媒扫描' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'Quiet day: 12 mentions, all neutral/positive',
				body: '## Social Report\n\n- Mentions: 12\n- No action required',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(5, 7, 25), 1)
		}
	},
	{
		id: 'exec_h066',
		member_id: 'robot_008',
		team_id: 'team_001',
		trigger_type: 'human',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(7, 14, 0),
		end_time: getPastTime(7, 14, 40),
		job_id: 'job_h066',
		name: { en: 'Influencer Analysis', cn: '影响者分析' },
		current: { task_index: 4, progress: '5/5' },
		delivery: {
			content: {
				summary: 'Top 20 industry influencers identified for outreach',
				body: '## Influencer Report\n\n- Influencers identified: 20\n- Outreach recommendations included',
				attachments: [{ title: 'Influencer List.pdf', file: '__attachment://file_033' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(7, 14, 40), 1)
		}
	},
	{
		id: 'exec_h067',
		member_id: 'robot_008',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(8, 7, 0),
		end_time: getPastTime(8, 7, 18),
		job_id: 'job_h067',
		name: { en: 'Morning Social Scan', cn: '晨间社媒扫描' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'Monday surge: 45 weekend mentions compiled',
				body: '## Social Report\n\n- Weekend mentions: 45\n- Sentiment: 80% positive',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(8, 7, 18), 1)
		}
	},

	// ==================== MORE DATA FOR OTHER ROBOTS (variety) ====================
	{
		id: 'exec_h068',
		member_id: 'robot_002',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(5, 8, 0),
		end_time: getPastTime(5, 8, 10),
		job_id: 'job_h068',
		name: { en: 'Competitor Price Scan', cn: '竞品价格扫描' },
		current: { task_index: 2, progress: '3/3' },
		delivery: {
			content: {
				summary: 'Competitor D raised prices 10%',
				body: '## Pricing Alert\n\nCompetitor D: +10% across all tiers',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(5, 8, 10), 1)
		}
	},
	{
		id: 'exec_h069',
		member_id: 'robot_003',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(4, 9, 0),
		end_time: getPastTime(4, 9, 35),
		job_id: 'job_h069',
		name: { en: 'Daily Research Digest', cn: '每日研究摘要' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: '6 papers on edge AI compiled',
				body: '## Research Digest\n\nFocus: Edge AI deployment',
				attachments: [{ title: 'Edge AI Digest.pdf', file: '__attachment://file_034' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(4, 9, 35), 1)
		}
	},
	{
		id: 'exec_h070',
		member_id: 'robot_005',
		team_id: 'team_001',
		trigger_type: 'event',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(5, 11, 0),
		end_time: getPastTime(5, 11, 5),
		job_id: 'job_h070',
		name: { en: 'Process Lead: Alex Thompson', cn: '处理线索：Alex Thompson' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'Lead scored 55/100 (WARM) - Added to nurture',
				body: '## Lead Analysis\n\nAlex Thompson - Manager @ SMBCorp',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(5, 11, 5), 1)
		}
	},

	// ==================== ADDITIONAL DATA FOR BETTER PAGINATION ====================
	// robot_002: Need more data (currently only 6)
	{
		id: 'exec_h071',
		member_id: 'robot_002',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(6, 8, 0),
		end_time: getPastTime(6, 8, 7),
		job_id: 'job_h071',
		name: { en: 'Competitor Price Scan', cn: '竞品价格扫描' },
		current: { task_index: 2, progress: '3/3' },
		delivery: {
			content: {
				summary: 'All prices stable - no changes',
				body: '## Scan Complete\n\nNo pricing changes detected.',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(6, 8, 7), 1)
		}
	},
	{
		id: 'exec_h072',
		member_id: 'robot_002',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'failed',
		phase: 'run',
		start_time: getPastTime(7, 8, 0),
		end_time: getPastTime(7, 8, 2),
		job_id: 'job_h072',
		name: { en: 'Competitor Price Scan', cn: '竞品价格扫描' },
		current: { task_index: 0, progress: '0/3' },
		error: 'Competitor website temporarily unavailable'
	},
	{
		id: 'exec_h073',
		member_id: 'robot_002',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(8, 10, 0),
		end_time: getPastTime(8, 10, 12),
		job_id: 'job_h073',
		name: { en: 'Competitor Feature Scan', cn: '竞品功能扫描' },
		current: { task_index: 2, progress: '3/3' },
		delivery: {
			content: {
				summary: 'Competitor E launched mobile app',
				body: '## Feature Alert\n\nCompetitor E: New mobile app released',
				attachments: [{ title: 'Mobile App Analysis.pdf', file: '__attachment://file_035' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(8, 10, 12), 1)
		}
	},
	{
		id: 'exec_h074',
		member_id: 'robot_002',
		team_id: 'team_001',
		trigger_type: 'human',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(9, 14, 0),
		end_time: getPastTime(9, 14, 45),
		job_id: 'job_h074',
		name: { en: 'Deep Analysis: Competitor A Strategy', cn: '深度分析：竞品A战略' },
		current: { task_index: 4, progress: '5/5' },
		delivery: {
			content: {
				summary: 'Comprehensive strategy analysis for Competitor A',
				body: '## Strategy Analysis\n\nCompetitor A market positioning and growth strategy',
				attachments: [{ title: 'Competitor A Strategy.pdf', file: '__attachment://file_036' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(9, 14, 45), 1)
		}
	},
	{
		id: 'exec_h075',
		member_id: 'robot_002',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(10, 8, 0),
		end_time: getPastTime(10, 8, 9),
		job_id: 'job_h075',
		name: { en: 'Competitor Price Scan', cn: '竞品价格扫描' },
		current: { task_index: 2, progress: '3/3' },
		delivery: {
			content: {
				summary: 'Competitor B introduced new tier',
				body: '## Pricing Alert\n\nCompetitor B: New "Starter" tier at $9/mo',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(10, 8, 9), 1)
		}
	},
	{
		id: 'exec_h076',
		member_id: 'robot_002',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'cancelled',
		phase: 'goals',
		start_time: getPastTime(11, 8, 0),
		end_time: getPastTime(11, 8, 5),
		job_id: 'job_h076',
		name: { en: 'Competitor Price Scan', cn: '竞品价格扫描' },
		current: { task_index: 0, progress: '0/3' }
	},
	{
		id: 'exec_h077',
		member_id: 'robot_002',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(12, 8, 0),
		end_time: getPastTime(12, 8, 8),
		job_id: 'job_h077',
		name: { en: 'Competitor Website Check', cn: '竞品网站检查' },
		current: { task_index: 2, progress: '3/3' },
		delivery: {
			content: {
				summary: 'Minor UI updates on Competitor C site',
				body: '## Website Check\n\nCompetitor C: Homepage redesign detected',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(12, 8, 8), 1)
		}
	},
	{
		id: 'exec_h078',
		member_id: 'robot_002',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(13, 10, 0),
		end_time: getPastTime(13, 10, 15),
		job_id: 'job_h078',
		name: { en: 'Weekly Competitor Summary', cn: '每周竞品汇总' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'Weekly summary: 3 pricing changes, 2 feature launches',
				body: '## Weekly Summary\n\nKey changes across all competitors',
				attachments: [{ title: 'Weekly Competitor Report.pdf', file: '__attachment://file_037' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(13, 10, 15), 1)
		}
	},
	{
		id: 'exec_h079',
		member_id: 'robot_002',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(14, 8, 0),
		end_time: getPastTime(14, 8, 6),
		job_id: 'job_h079',
		name: { en: 'Competitor Price Scan', cn: '竞品价格扫描' },
		current: { task_index: 2, progress: '3/3' },
		delivery: {
			content: {
				summary: 'No significant changes',
				body: '## Scan Complete\n\nAll monitored competitors stable.',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(14, 8, 6), 1)
		}
	},

	// robot_003: Add more variety
	{
		id: 'exec_h080',
		member_id: 'robot_003',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(5, 9, 0),
		end_time: getPastTime(5, 9, 28),
		job_id: 'job_h080',
		name: { en: 'Daily Research Digest', cn: '每日研究摘要' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: '5 papers on prompt engineering',
				body: '## Research Digest\n\nFocus: Advanced prompting techniques',
				attachments: [{ title: 'Prompt Engineering.pdf', file: '__attachment://file_038' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(5, 9, 28), 1)
		}
	},
	{
		id: 'exec_h081',
		member_id: 'robot_003',
		team_id: 'team_001',
		trigger_type: 'human',
		status: 'cancelled',
		phase: 'tasks',
		start_time: getPastTime(7, 14, 0),
		end_time: getPastTime(7, 14, 10),
		job_id: 'job_h081',
		name: { en: 'Custom Research: Quantum ML', cn: '自定义研究：量子机器学习' },
		current: { task_index: 1, progress: '1/5' }
	},
	{
		id: 'exec_h082',
		member_id: 'robot_003',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(8, 9, 0),
		end_time: getPastTime(8, 9, 32),
		job_id: 'job_h082',
		name: { en: 'Daily Research Digest', cn: '每日研究摘要' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: '8 papers on model optimization',
				body: '## Research Digest\n\nFocus: Inference optimization',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(8, 9, 32), 1)
		}
	},
	{
		id: 'exec_h083',
		member_id: 'robot_003',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'failed',
		phase: 'run',
		start_time: getPastTime(10, 9, 0),
		end_time: getPastTime(10, 9, 4),
		job_id: 'job_h083',
		name: { en: 'Daily Research Digest', cn: '每日研究摘要' },
		current: { task_index: 1, progress: '1/4' },
		error: 'Scholar API quota exceeded'
	},
	{
		id: 'exec_h084',
		member_id: 'robot_003',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(11, 9, 0),
		end_time: getPastTime(11, 9, 30),
		job_id: 'job_h084',
		name: { en: 'Weekly Research Digest', cn: '每周研究摘要' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: '22 papers compiled on AI agents',
				body: '## Weekly Digest\n\nComprehensive review of AI agent papers',
				attachments: [{ title: 'AI Agents Weekly.pdf', file: '__attachment://file_039' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(11, 9, 30), 1)
		}
	},
	{
		id: 'exec_h085',
		member_id: 'robot_003',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(12, 9, 0),
		end_time: getPastTime(12, 9, 25),
		job_id: 'job_h085',
		name: { en: 'Daily Research Digest', cn: '每日研究摘要' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: '4 papers on RAG improvements',
				body: '## Research Digest\n\nFocus: Advanced RAG techniques',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(12, 9, 25), 1)
		}
	},

	// More for other robots to ensure pagination
	{
		id: 'exec_h086',
		member_id: 'robot_001',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(8, 6, 0),
		end_time: getPastTime(8, 6, 15),
		job_id: 'job_h086',
		name: { en: 'Morning Content Generation', cn: '晨间内容生成' },
		current: { task_index: 4, progress: '5/5' },
		delivery: {
			content: {
				summary: 'Published: "Microservices Architecture Guide"',
				body: '## Article Published\n\nWord count: 3100',
				attachments: [{ title: 'Microservices Guide.md', file: '__attachment://file_040' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(8, 6, 15), 1)
		}
	},
	{
		id: 'exec_h087',
		member_id: 'robot_001',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'failed',
		phase: 'run',
		start_time: getPastTime(9, 18, 0),
		end_time: getPastTime(9, 18, 5),
		job_id: 'job_h087',
		name: { en: 'Evening Content Generation', cn: '晚间内容生成' },
		current: { task_index: 2, progress: '2/5' },
		error: 'Content generation timeout - article too complex'
	},
	{
		id: 'exec_h088',
		member_id: 'robot_001',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(10, 6, 0),
		end_time: getPastTime(10, 6, 12),
		job_id: 'job_h088',
		name: { en: 'Morning Content Generation', cn: '晨间内容生成' },
		current: { task_index: 4, progress: '5/5' },
		delivery: {
			content: {
				summary: 'Published: "GraphQL vs REST Comparison"',
				body: '## Article Published\n\nWord count: 2800',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(10, 6, 12), 1)
		}
	},
	{
		id: 'exec_h089',
		member_id: 'robot_001',
		team_id: 'team_001',
		trigger_type: 'human',
		status: 'cancelled',
		phase: 'goals',
		start_time: getPastTime(11, 15, 0),
		end_time: getPastTime(11, 15, 8),
		job_id: 'job_h089',
		name: { en: 'Custom Article: CEO Interview', cn: '自定义文章：CEO访谈' },
		current: { task_index: 0, progress: '0/4' }
	},
	{
		id: 'exec_h090',
		member_id: 'robot_005',
		team_id: 'team_001',
		trigger_type: 'event',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(6, 9, 0),
		end_time: getPastTime(6, 9, 4),
		job_id: 'job_h090',
		name: { en: 'Process Lead: Jennifer Lee', cn: '处理线索：Jennifer Lee' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'Lead scored 88/100 (HOT) - Urgent handoff',
				body: '## Lead Analysis\n\nJennifer Lee - Director @ FortuneCo',
				attachments: [{ title: 'FortuneCo Lead.pdf', file: '__attachment://file_041' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(6, 9, 4), 1)
		}
	},
	{
		id: 'exec_h091',
		member_id: 'robot_005',
		team_id: 'team_001',
		trigger_type: 'event',
		status: 'failed',
		phase: 'run',
		start_time: getPastTime(8, 14, 0),
		end_time: getPastTime(8, 14, 3),
		job_id: 'job_h091',
		name: { en: 'Process Lead: Bad Data', cn: '处理线索：数据错误' },
		current: { task_index: 0, progress: '0/4' },
		error: 'Missing required fields: company, email'
	},
	{
		id: 'exec_h092',
		member_id: 'robot_005',
		team_id: 'team_001',
		trigger_type: 'event',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(9, 10, 0),
		end_time: getPastTime(9, 10, 5),
		job_id: 'job_h092',
		name: { en: 'Process Lead: Robert Chen', cn: '处理线索：Robert Chen' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'Lead scored 72/100 (WARM) - Added to sequence',
				body: '## Lead Analysis\n\nRobert Chen - VP @ TechStartup',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(9, 10, 5), 1)
		}
	},
	{
		id: 'exec_h093',
		member_id: 'robot_008',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(9, 7, 0),
		end_time: getPastTime(9, 7, 22),
		job_id: 'job_h093',
		name: { en: 'Morning Social Scan', cn: '晨间社媒扫描' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: '28 mentions, product hunt feature trending',
				body: '## Social Report\n\nProduct Hunt: Featured on homepage',
				attachments: [{ title: 'PH Feature Report.pdf', file: '__attachment://file_042' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(9, 7, 22), 1)
		}
	},
	{
		id: 'exec_h094',
		member_id: 'robot_008',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(10, 7, 0),
		end_time: getPastTime(10, 7, 18),
		job_id: 'job_h094',
		name: { en: 'Morning Social Scan', cn: '晨间社媒扫描' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: '15 mentions, all positive sentiment',
				body: '## Social Report\n\nQuiet day, positive mentions',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(10, 7, 18), 1)
		}
	},
	{
		id: 'exec_h095',
		member_id: 'robot_006',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(10, 9, 0),
		end_time: getPastTime(10, 9, 14),
		job_id: 'job_h095',
		name: { en: 'Morning Sales Report', cn: '晨间销售报告' },
		current: { task_index: 2, progress: '3/3' },
		delivery: {
			content: {
				summary: 'Strong start: $35K by noon',
				body: '## Morning Report\n\nExcellent morning performance',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(10, 9, 14), 1)
		}
	},
	{
		id: 'exec_h096',
		member_id: 'robot_007',
		team_id: 'team_001',
		trigger_type: 'clock',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(10, 3, 0),
		end_time: getPastTime(10, 3, 16),
		job_id: 'job_h096',
		name: { en: 'Nightly Data Quality Check', cn: '夜间数据质量检查' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'Quality score: 99.1% - Minor issues fixed',
				body: '## Data Quality Report\n\nAutomated cleanup completed',
				attachments: []
			},
			success: true,
			sent_at: addDuration(getPastTime(10, 3, 16), 1)
		}
	},
	{
		id: 'exec_h097',
		member_id: 'robot_004',
		team_id: 'team_001',
		trigger_type: 'human',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(11, 10, 0),
		end_time: getPastTime(11, 10, 40),
		job_id: 'job_h097',
		name: { en: 'Research: StartupABC', cn: '研究：StartupABC' },
		current: { task_index: 4, progress: '5/5' },
		delivery: {
			content: {
				summary: 'Early-stage startup, high potential',
				body: '## Company Profile\n\nStartupABC - Seed stage, strong team',
				attachments: [{ title: 'StartupABC Profile.pdf', file: '__attachment://file_043' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(11, 10, 40), 1)
		}
	},
	{
		id: 'exec_h098',
		member_id: 'robot_004',
		team_id: 'team_001',
		trigger_type: 'human',
		status: 'completed',
		phase: 'delivery',
		start_time: getPastTime(12, 14, 0),
		end_time: getPastTime(12, 14, 35),
		job_id: 'job_h098',
		name: { en: 'Prepare Pitch: EnterpriseXYZ', cn: '准备演讲：EnterpriseXYZ' },
		current: { task_index: 3, progress: '4/4' },
		delivery: {
			content: {
				summary: 'Pitch deck and talking points ready',
				body: '## Pitch Prep\n\nCustomized for EnterpriseXYZ needs',
				attachments: [{ title: 'EnterpriseXYZ Pitch.pdf', file: '__attachment://file_044' }]
			},
			success: true,
			sent_at: addDuration(getPastTime(12, 14, 35), 1)
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

// Get history executions for a robot (completed/failed/cancelled, sorted by start_time desc)
export const getHistoryExecutions = (memberId: string): Execution[] => {
	return mockExecutions
		.filter(
			(exec) =>
				exec.member_id === memberId &&
				(exec.status === 'completed' || exec.status === 'failed' || exec.status === 'cancelled')
		)
		.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
}

// Get paginated history executions (simulates API pagination)
export interface HistoryQuery {
	memberId: string
	page?: number
	pageSize?: number
	status?: 'all' | 'completed' | 'failed' | 'cancelled' | 'running'
	keywords?: string
}

export interface HistoryResult {
	data: Execution[]
	total: number
	page: number
	pageSize: number
	hasMore: boolean
}

export const getHistoryExecutionsPaginated = (query: HistoryQuery): HistoryResult => {
	const { memberId, page = 1, pageSize = 10, status = 'all', keywords = '' } = query

	// Filter by member
	let filtered = mockExecutions.filter((exec) => exec.member_id === memberId)

	// Filter by status
	if (status === 'all') {
		// Show all statuses including running/pending
		// No filter needed
	} else if (status === 'running') {
		// Include both running and pending (paused)
		filtered = filtered.filter((exec) => exec.status === 'running' || exec.status === 'pending')
	} else {
		filtered = filtered.filter((exec) => exec.status === status)
	}

	// Filter by keywords (search in name)
	if (keywords.trim()) {
		const kw = keywords.toLowerCase()
		filtered = filtered.filter((exec) => {
			const nameEn = exec.name?.en?.toLowerCase() || ''
			const nameCn = exec.name?.cn || ''
			return nameEn.includes(kw) || nameCn.includes(kw)
		})
	}

	// Sort by start_time descending (newest first)
	filtered = filtered.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())

	// Paginate
	const total = filtered.length
	const startIndex = (page - 1) * pageSize
	const endIndex = startIndex + pageSize
	const data = filtered.slice(startIndex, endIndex)

	return {
		data,
		total,
		page,
		pageSize,
		hasMore: endIndex < total
	}
}

// Simulate API delay
export const simulateApiDelay = (ms: number = 500): Promise<void> => {
	return new Promise((resolve) => setTimeout(resolve, ms))
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
